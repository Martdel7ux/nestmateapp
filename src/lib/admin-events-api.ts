import { supabase } from "@/lib/supabase";
import type { Opportunity, OpportunitySuggestion, OppStatus } from "@/types/discover";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Types ───────────────────────────────────────────────────────────────────

export interface CuratedEventFilters {
  status?: OppStatus | "all";
  type?:   string;
  query?:  string;
}

export interface ExtractionResult {
  title:              string;
  description:        string;
  image_url:          string;
  starts_at:          string | null;
  ends_at:            string | null;
  location:           string;
  organization:       string;
  tags:               string[];
  url:                string;
  raw_html_snippet:   string;
  extraction_method:  "json-ld" | "opengraph" | "twitter-card" | "heuristic" | "mixed";
  confidence:         "high" | "medium" | "low";
  image_warning?:     string;
  error?:             string;
  duplicate?:         boolean;
  existing_id?:       string;
  existing_title?:    string;
}

export type EventFormData = {
  type:          string;
  title:         string;
  description:   string;
  image_url:     string;
  starts_at:     string | null;
  ends_at:       string | null;
  location:      string;
  location_type: string;
  organization:  string;
  tags:          string[];
  url:           string;
  source_url:    string;
  status:        OppStatus;
};

// ── Events CRUD ─────────────────────────────────────────────────────────────

export async function fetchCuratedEvents(
  filters: CuratedEventFilters,
  limit = 50
): Promise<Opportunity[]> {
  if (!supabase) return [];
  let q = supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.type && filters.type !== "all") {
    q = q.eq("type", filters.type);
  }
  if (filters.query?.trim()) {
    q = q.or(
      `title.ilike.%${filters.query.trim()}%,organization.ilike.%${filters.query.trim()}%,location.ilike.%${filters.query.trim()}%`
    );
  }

  const { data, error } = await q;
  if (error) {
    console.error("[admin-events] fetchCuratedEvents:", error.message);
    return [];
  }
  return (data ?? []) as Opportunity[];
}

export async function fetchCuratedEvent(id: string): Promise<Opportunity | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[admin-events] fetchCuratedEvent:", error.message);
    return null;
  }
  return (data as Opportunity) ?? null;
}

export async function createCuratedEvent(
  form: EventFormData,
  curatedBy: string
): Promise<Opportunity> {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      type:          form.type,
      title:         form.title,
      description:   form.description || null,
      image_url:     form.image_url   || null,
      starts_at:     form.starts_at   || null,
      ends_at:       form.ends_at     || null,
      location:      form.location    || null,
      location_type: form.location_type || null,
      organization:  form.organization || null,
      tags:          form.tags.length ? form.tags : null,
      url:           form.url         || null,
      source_url:    form.source_url  || null,
      source:        "manual",
      status:        form.status,
      curated_by:    curatedBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function updateCuratedEvent(
  id: string,
  form: Partial<EventFormData>,
  curatedBy: string
): Promise<Opportunity> {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("opportunities")
    .update({
      ...(form.type          !== undefined && { type:          form.type }),
      ...(form.title         !== undefined && { title:         form.title }),
      ...(form.description   !== undefined && { description:   form.description || null }),
      ...(form.image_url     !== undefined && { image_url:     form.image_url || null }),
      ...(form.starts_at     !== undefined && { starts_at:     form.starts_at || null }),
      ...(form.ends_at       !== undefined && { ends_at:       form.ends_at || null }),
      ...(form.location      !== undefined && { location:      form.location || null }),
      ...(form.location_type !== undefined && { location_type: form.location_type || null }),
      ...(form.organization  !== undefined && { organization:  form.organization || null }),
      ...(form.tags          !== undefined && { tags:          form.tags.length ? form.tags : null }),
      ...(form.url           !== undefined && { url:           form.url || null }),
      ...(form.source_url    !== undefined && { source_url:    form.source_url || null }),
      ...(form.status        !== undefined && { status:        form.status }),
      updated_at:    new Date().toISOString(),
      curated_by:    curatedBy,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function deleteCuratedEvent(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "unpublished" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Soft duplicate search: same title within ±3 days ───────────────────────

export async function findSoftDuplicates(
  title: string,
  startsAt: string | null
): Promise<Opportunity[]> {
  if (!supabase || !title) return [];
  let q = supabase
    .from("opportunities")
    .select("id, title, starts_at, status")
    .ilike("title", `%${title.trim().slice(0, 40)}%`)
    .limit(5);

  if (startsAt) {
    const d = new Date(startsAt);
    const lo = new Date(d.getTime() - 3 * 86400_000).toISOString();
    const hi = new Date(d.getTime() + 3 * 86400_000).toISOString();
    q = q.gte("starts_at", lo).lte("starts_at", hi);
  }

  const { data } = await q;
  return (data ?? []) as Opportunity[];
}

// ── Metadata extraction ─────────────────────────────────────────────────────

export async function extractEventMetadata(
  url: string,
  token: string
): Promise<ExtractionResult> {
  const resp = await fetch(
    `${SUPABASE_URL}/functions/v1/extract-event-metadata`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": ANON_KEY,
      },
      body: JSON.stringify({ url }),
    }
  );
  if (!resp.ok) throw new Error(`Edge Function returned ${resp.status}`);
  return resp.json() as Promise<ExtractionResult>;
}

// ── Upload image to event-images bucket ────────────────────────────────────

export async function uploadEventImage(file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase not initialized");
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("event-images")
    .upload(filename, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage
    .from("event-images")
    .getPublicUrl(filename);
  return publicUrl;
}

// ── Suggestions ─────────────────────────────────────────────────────────────

export async function fetchSuggestions(
  status: "pending" | "approved" | "rejected" | "all" = "pending"
): Promise<OpportunitySuggestion[]> {
  if (!supabase) return [];
  let q = supabase
    .from("opportunity_suggestions")
    .select("*, user_profiles!submitted_by(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[admin-events] fetchSuggestions:", error.message);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = row.user_profiles as Record<string, unknown> | null;
    const { user_profiles: _ignored, ...rest } = row;
    void _ignored;
    return {
      ...(rest as unknown as OpportunitySuggestion),
      submitter_name:   (profile?.full_name  as string) ?? null,
      submitter_avatar: (profile?.avatar_url as string) ?? null,
    };
  });
}

export async function reviewSuggestion(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string,
  opts?: { rejectionReason?: string; resultingOpportunityId?: string }
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("opportunity_suggestions")
    .update({
      status,
      reviewed_by:               reviewedBy,
      reviewed_at:               new Date().toISOString(),
      ...(opts?.rejectionReason         && { rejection_reason:          opts.rejectionReason }),
      ...(opts?.resultingOpportunityId  && { resulting_opportunity_id:  opts.resultingOpportunityId }),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function submitEventSuggestion(
  userId: string,
  url: string,
  note: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase not initialized");
  const { error } = await supabase
    .from("opportunity_suggestions")
    .insert({ submitted_by: userId, url: url || null, note: note || null });
  if (error) {
    if (error.message.includes("rate_limit_exceeded")) {
      throw new Error("You've reached the daily limit of 5 suggestions. Try again tomorrow.");
    }
    throw new Error(error.message);
  }
}
