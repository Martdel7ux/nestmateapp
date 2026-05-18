export interface HelpCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color_token: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  article_count?: number;
}

export interface HelpArticle {
  id: string;
  slug: string;
  category_id: string;
  category?: HelpCategory;
  title: string;
  summary: string | null;
  content: string;
  tags: string[];
  related_article_ids: string[];
  related_articles?: HelpArticleStub[];
  status: "draft" | "published" | "archived";
  display_order_in_category: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  estimated_read_minutes: number | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface HelpArticleStub {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  estimated_read_minutes: number | null;
  category_slug?: string;
  category_name?: string;
}

export interface HelpSearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  estimated_read_minutes: number | null;
  rank: number;
}

export interface HelpArticleFeedback {
  id: string;
  article_id: string;
  user_id: string | null;
  was_helpful: boolean;
  comment: string | null;
  created_at: string;
}

export type SupportCategory = "bug" | "feature_request" | "account" | "billing" | "other";
export type SupportStatus   = "open" | "in_progress" | "resolved" | "closed" | "spam";
export type SupportPriority = "low" | "normal" | "high" | "urgent";

export interface SupportMessage {
  id: string;
  user_id: string | null;
  user_email: string | null;
  subject: string | null;
  category: SupportCategory;
  body: string;
  attachment_urls: string[];
  status: SupportStatus;
  priority: SupportPriority;
  assigned_to: string | null;
  internal_notes: string | null;
  user_agent: string | null;
  app_version: string | null;
  page_url: string | null;
  created_at: string;
  first_responded_at: string | null;
  resolved_at: string | null;
  replies?: SupportReply[];
  unread_reply_count?: number;
}

export interface SupportReply {
  id: string;
  message_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  body: string;
  attachment_urls: string[];
  read_by_recipient_at: string | null;
  created_at: string;
}

export interface AiHandoffContext {
  query: string;
  source: "help_search" | "help_article" | "help_landing";
  source_article_id?: string;
}
