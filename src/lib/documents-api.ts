import { supabase } from "@/lib/supabase";
import type {
  Document, DocumentUploadForm, DocumentEditForm,
  DocumentAccessLog, DocumentShareToken, DocumentAccessAction,
} from "@/types/document";

function sb() {
  if (!supabase) throw new Error("Supabase not initialized");
  return supabase;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadDocument(
  form: DocumentUploadForm,
  userId: string
): Promise<Document> {
  const client = sb();
  const ext   = form.file.name.split(".").pop() ?? "bin";
  const docId = crypto.randomUUID();
  const path  = `${userId}/${docId}/original.${ext}`;

  const { error: uploadErr } = await client.storage
    .from("documents")
    .upload(path, form.file, { contentType: form.file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  const { data, error } = await client
    .from("documents")
    .insert({
      id:                         docId,
      owner_id:                   userId,
      title:                      form.title,
      description:                form.description || null,
      category:                   form.category,
      storage_path:               path,
      mime_type:                  form.file.type,
      file_size:                  form.file.size,
      issued_date:                form.issued_date || null,
      expires_at:                 form.expires_at || null,
      tags:                       form.tags,
      visibility:                 form.visibility,
      shared_household_id:        form.visibility === "household" ? (form.shared_household_id || null) : null,
      related_rent_agreement_id:  form.related_rent_agreement_id || null,
      ocr_status:                 "skipped",
    })
    .select()
    .single();

  if (error) {
    // Roll back the storage upload
    await client.storage.from("documents").remove([path]);
    throw error;
  }
  return data as Document;
}

// ── Fetch lists ───────────────────────────────────────────────────────────────

export async function fetchDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchHouseholdDocuments(householdId: string): Promise<Document[]> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("shared_household_id", householdId)
    .eq("visibility", "household")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchExpiringDocuments(userId: string, days = 30): Promise<Document[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", cutoff.toISOString().slice(0, 10))
    .order("expires_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchTrashedDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function searchDocuments(query: string): Promise<Document[]> {
  if (!query.trim()) return [];
  const { data, error } = await sb().rpc("search_documents", { p_query: query });
  if (error) throw error;
  return (data ?? []) as Document[];
}

// ── Single document ────────────────────────────────────────────────────────────

export async function fetchDocument(id: string): Promise<Document | null> {
  const { data, error } = await sb()
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Document | null;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateDocument(
  id: string,
  patch: DocumentEditForm
): Promise<Document> {
  const { data, error } = await sb()
    .from("documents")
    .update({
      title:               patch.title,
      description:         patch.description || null,
      category:            patch.category,
      issued_date:         patch.issued_date || null,
      expires_at:          patch.expires_at || null,
      tags:                patch.tags,
      visibility:          patch.visibility,
      shared_household_id: patch.visibility === "household" ? (patch.shared_household_id || null) : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

// ── Soft delete / restore / hard delete ───────────────────────────────────────

export async function softDeleteDocument(id: string): Promise<void> {
  const { error } = await sb()
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await logAccess(id, "delete");
}

export async function restoreDocument(id: string): Promise<void> {
  const { error } = await sb()
    .from("documents")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
  await logAccess(id, "restore");
}

export async function hardDeleteDocument(doc: Document): Promise<void> {
  const client = sb();
  // Remove files from storage
  const paths = [doc.storage_path];
  if (doc.thumbnail_path) paths.push(doc.thumbnail_path);
  await client.storage.from("documents").remove(paths);

  const { error } = await client.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

// ── Signed URLs ───────────────────────────────────────────────────────────────

export async function getSignedUrl(storagePath: string, expiresIn = 300): Promise<string> {
  const { data, error } = await sb()
    .storage
    .from("documents")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ── Access logs ───────────────────────────────────────────────────────────────

export async function logAccess(
  documentId: string,
  action: DocumentAccessAction
): Promise<void> {
  const client = sb();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  await client.from("document_access_logs").insert({
    document_id: documentId,
    accessed_by: user.id,
    action,
    user_agent:  navigator.userAgent.slice(0, 500),
  });
}

export async function fetchAccessLogs(documentId: string): Promise<DocumentAccessLog[]> {
  const { data, error } = await sb()
    .from("document_access_logs")
    .select("*")
    .eq("document_id", documentId)
    .order("accessed_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as DocumentAccessLog[];
}

// ── Share tokens ──────────────────────────────────────────────────────────────

export async function createShareToken(
  documentId: string,
  sharedBy: string,
  expiresAt: string,
  maxDownloads?: number
): Promise<DocumentShareToken> {
  const { data, error } = await sb()
    .from("document_share_tokens")
    .insert({
      document_id:   documentId,
      shared_by:     sharedBy,
      expires_at:    expiresAt,
      max_downloads: maxDownloads ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await logAccess(documentId, "share");
  return data as DocumentShareToken;
}

export async function fetchShareTokens(documentId: string): Promise<DocumentShareToken[]> {
  const { data, error } = await sb()
    .from("document_share_tokens")
    .select("*")
    .eq("document_id", documentId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentShareToken[];
}

export async function revokeShareToken(tokenId: string): Promise<void> {
  const { error } = await sb()
    .from("document_share_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId);
  if (error) throw error;
}
