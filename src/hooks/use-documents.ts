import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments, fetchDocument, fetchHouseholdDocuments,
  fetchExpiringDocuments, fetchTrashedDocuments, searchDocuments,
  uploadDocument, updateDocument, softDeleteDocument,
  restoreDocument, hardDeleteDocument, getSignedUrl,
  fetchAccessLogs, fetchShareTokens, createShareToken, revokeShareToken,
} from "@/lib/documents-api";
import type { DocumentUploadForm, DocumentEditForm, Document } from "@/types/document";

export const docKeys = {
  all:        ["documents"] as const,
  list:       (uid: string) => ["documents", "list", uid] as const,
  household:  (hid: string) => ["documents", "household", hid] as const,
  expiring:   (uid: string) => ["documents", "expiring", uid] as const,
  trash:      (uid: string) => ["documents", "trash", uid] as const,
  search:     (q: string)   => ["documents", "search", q] as const,
  detail:     (id: string)  => ["documents", "detail", id] as const,
  logs:       (id: string)  => ["documents", "logs", id] as const,
  tokens:     (id: string)  => ["documents", "tokens", id] as const,
  signedUrl:  (path: string) => ["documents", "url", path] as const,
};

// ── Lists ─────────────────────────────────────────────────────────────────────

export function useDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: docKeys.list(userId ?? ""),
    queryFn:  () => fetchDocuments(userId!),
    enabled:  !!userId,
  });
}

export function useHouseholdDocuments(householdId: string | undefined) {
  return useQuery({
    queryKey: docKeys.household(householdId ?? ""),
    queryFn:  () => fetchHouseholdDocuments(householdId!),
    enabled:  !!householdId,
  });
}

export function useExpiringDocuments(userId: string | undefined, days = 30) {
  return useQuery({
    queryKey: docKeys.expiring(userId ?? ""),
    queryFn:  () => fetchExpiringDocuments(userId!, days),
    enabled:  !!userId,
  });
}

export function useTrashedDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: docKeys.trash(userId ?? ""),
    queryFn:  () => fetchTrashedDocuments(userId!),
    enabled:  !!userId,
  });
}

export function useDocumentSearch(query: string) {
  return useQuery({
    queryKey: docKeys.search(query),
    queryFn:  () => searchDocuments(query),
    enabled:  query.trim().length >= 2,
  });
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: docKeys.detail(id ?? ""),
    queryFn:  () => fetchDocument(id!),
    enabled:  !!id,
  });
}

export function useSignedUrl(storagePath: string | undefined | null) {
  return useQuery({
    queryKey: docKeys.signedUrl(storagePath ?? ""),
    queryFn:  () => getSignedUrl(storagePath!),
    enabled:  !!storagePath,
    staleTime: 240_000, // 4 min (URL expires in 5 min)
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useUploadDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: DocumentUploadForm) => uploadDocument(form, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.list(userId) });
      qc.invalidateQueries({ queryKey: docKeys.expiring(userId) });
    },
  });
}

export function useUpdateDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DocumentEditForm }) =>
      updateDocument(id, patch),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: docKeys.list(userId) });
      qc.invalidateQueries({ queryKey: docKeys.detail(doc.id) });
      qc.invalidateQueries({ queryKey: docKeys.expiring(userId) });
    },
  });
}

export function useSoftDeleteDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.list(userId) });
      qc.invalidateQueries({ queryKey: docKeys.trash(userId) });
    },
  });
}

export function useRestoreDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.list(userId) });
      qc.invalidateQueries({ queryKey: docKeys.trash(userId) });
    },
  });
}

export function useHardDeleteDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: Document) => hardDeleteDocument(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.trash(userId) });
    },
  });
}

// ── Access logs ───────────────────────────────────────────────────────────────

export function useAccessLogs(documentId: string | undefined) {
  return useQuery({
    queryKey: docKeys.logs(documentId ?? ""),
    queryFn:  () => fetchAccessLogs(documentId!),
    enabled:  !!documentId,
  });
}

// ── Share tokens ──────────────────────────────────────────────────────────────

export function useShareTokens(documentId: string | undefined) {
  return useQuery({
    queryKey: docKeys.tokens(documentId ?? ""),
    queryFn:  () => fetchShareTokens(documentId!),
    enabled:  !!documentId,
  });
}

export function useCreateShareToken(documentId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expiresAt, maxDownloads }: { expiresAt: string; maxDownloads?: number }) =>
      createShareToken(documentId, userId, expiresAt, maxDownloads),
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.tokens(documentId) }),
  });
}

export function useRevokeShareToken(documentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => revokeShareToken(tokenId),
    onSuccess: () => qc.invalidateQueries({ queryKey: docKeys.tokens(documentId) }),
  });
}
