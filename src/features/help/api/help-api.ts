import { supabase } from "@/lib/supabase";
import type {
  HelpArticle, HelpCategory, HelpSearchResult,
  SupportMessage, SupportReply, AiHandoffContext,
} from "@/types/help";

function sb() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  const { data, error } = await sb()
    .from("help_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as HelpCategory[];
}

export async function fetchCategoriesWithCounts(): Promise<HelpCategory[]> {
  const { data, error } = await sb()
    .from("help_categories")
    .select(`
      *,
      article_count:help_articles(count)
    `)
    .eq("is_active", true)
    .eq("help_articles.status", "published")
    .order("display_order");
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...c,
    article_count: c.article_count?.[0]?.count ?? 0,
  })) as HelpCategory[];
}

// ── Articles ──────────────────────────────────────────────────────────────────

export async function fetchArticlesByCategory(categorySlug: string): Promise<HelpArticle[]> {
  const { data, error } = await sb()
    .from("help_articles")
    .select("*, category:help_categories(*)")
    .eq("status", "published")
    .eq("help_categories.slug", categorySlug)
    .order("display_order_in_category");
  if (error) throw error;
  return (data ?? []) as HelpArticle[];
}

export async function fetchArticleBySlug(slug: string): Promise<HelpArticle | null> {
  const { data, error } = await sb()
    .from("help_articles")
    .select("*, category:help_categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as HelpArticle | null;
}

export async function fetchPopularArticles(limit = 5): Promise<HelpArticle[]> {
  const { data, error } = await sb()
    .from("help_articles")
    .select("*, category:help_categories(*)")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as HelpArticle[];
}

export async function fetchRelatedArticles(ids: string[]): Promise<HelpArticle[]> {
  if (!ids.length) return [];
  const { data, error } = await sb()
    .from("help_articles")
    .select("id, slug, title, summary, estimated_read_minutes, category:help_categories(slug, name)")
    .in("id", ids)
    .eq("status", "published");
  if (error) throw error;
  return (data ?? []) as unknown as HelpArticle[];
}

export async function recordArticleView(articleId: string): Promise<void> {
  await sb().rpc("record_article_view", { p_article_id: articleId });
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchHelpArticles(query: string): Promise<HelpSearchResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await sb().rpc("search_help_articles", {
    p_query: query.trim(),
    p_limit: 20,
  });
  if (error) throw error;
  return (data ?? []) as HelpSearchResult[];
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function submitArticleFeedback(
  articleId: string,
  wasHelpful: boolean,
  comment?: string,
): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  const { error } = await sb().from("help_article_feedback").insert({
    article_id: articleId,
    user_id:    user?.id ?? null,
    was_helpful: wasHelpful,
    comment:    comment ?? null,
  });
  if (error) throw error;
}

// ── Support messages ──────────────────────────────────────────────────────────

export async function fetchMyTickets(): Promise<SupportMessage[]> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return [];
  const { data, error } = await sb()
    .from("support_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupportMessage[];
}

export async function fetchTicketWithReplies(id: string): Promise<SupportMessage | null> {
  const { data, error } = await sb()
    .from("support_messages")
    .select("*, replies:support_message_replies(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as SupportMessage | null;
}

export async function createSupportMessage(payload: {
  subject: string;
  category: string;
  body: string;
  attachment_urls?: string[];
  page_url?: string;
}): Promise<SupportMessage> {
  const { data: { user } } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("support_messages")
    .insert({
      user_id:         user?.id ?? null,
      user_email:      user?.email ?? null,
      subject:         payload.subject,
      category:        payload.category,
      body:            payload.body,
      attachment_urls: payload.attachment_urls ?? [],
      page_url:        payload.page_url ?? null,
      user_agent:      navigator.userAgent,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SupportMessage;
}

export async function replyToTicket(
  messageId: string,
  body: string,
): Promise<SupportReply> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb()
    .from("support_message_replies")
    .insert({ message_id: messageId, sender_id: user.id, sender_type: "user", body })
    .select()
    .single();
  if (error) throw error;
  return data as SupportReply;
}

export async function markRepliesRead(replyIds: string[]): Promise<void> {
  if (!replyIds.length) return;
  await sb()
    .from("support_message_replies")
    .update({ read_by_recipient_at: new Date().toISOString() })
    .in("id", replyIds)
    .is("read_by_recipient_at", null);
}

// ── AI handoff logging ────────────────────────────────────────────────────────

export async function logAiHandoff(ctx: AiHandoffContext): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("ai_assistant_help_context").insert({
    user_id:           user.id,
    query:             ctx.query,
    source:            ctx.source,
    source_article_id: ctx.source_article_id ?? null,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAllArticlesAdmin(): Promise<HelpArticle[]> {
  const { data, error } = await sb()
    .from("help_articles")
    .select("*, category:help_categories(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HelpArticle[];
}

export async function upsertArticle(article: Partial<HelpArticle> & { title: string; category_id: string }): Promise<HelpArticle> {
  const now = new Date().toISOString();
  const readMin = article.content
    ? Math.max(1, Math.round(article.content.split(/\s+/).length / 200))
    : null;
  const payload = {
    ...article,
    estimated_read_minutes: readMin,
    updated_at: now,
    published_at: article.status === "published" && !article.published_at ? now : article.published_at,
  };
  const { data, error } = article.id
    ? await sb().from("help_articles").update(payload).eq("id", article.id).select().single()
    : await sb().from("help_articles").insert(payload).select().single();
  if (error) throw error;
  return data as HelpArticle;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await sb().from("help_articles").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAllSupportMessages(): Promise<SupportMessage[]> {
  const { data, error } = await sb()
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupportMessage[];
}

export async function updateTicketStatus(
  id: string,
  status: string,
  priority?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (priority) patch.priority = priority;
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  const { error } = await sb().from("support_messages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function adminReplyToTicket(
  messageId: string,
  body: string,
): Promise<SupportReply> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb()
    .from("support_message_replies")
    .insert({ message_id: messageId, sender_id: user.id, sender_type: "admin", body })
    .select()
    .single();
  if (error) throw error;
  // Update first_responded_at if not set
  await sb()
    .from("support_messages")
    .update({ first_responded_at: new Date().toISOString() })
    .eq("id", messageId)
    .is("first_responded_at", null);
  return data as SupportReply;
}
