import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download, Edit3, Trash2, Share2, ChevronDown, ChevronUp,
  ExternalLink, Copy, Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import {
  useDocument, useSignedUrl, useAccessLogs,
  useShareTokens, useCreateShareToken, useRevokeShareToken,
  useSoftDeleteDocument,
} from "@/hooks/use-documents";
import { CategoryBadge } from "@/components/features/documents/CategoryBadge";
import { AccessLogList } from "@/components/features/documents/AccessLogList";
import { logAccess } from "@/lib/documents-api";
import { formatFileSize, isPdf } from "@/utils/fileValidation";
import { cn } from "@/lib/utils";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function DocumentViewerPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const { data: doc, isLoading } = useDocument(id);
  const { data: url }            = useSignedUrl(doc?.storage_path);
  const { data: logs = [] }      = useAccessLogs(id);
  const { data: tokens = [] }    = useShareTokens(id);

  const { mutateAsync: softDelete }   = useSoftDeleteDocument(user?.id ?? "");
  const { mutateAsync: createToken }  = useCreateShareToken(id ?? "", user?.id ?? "");
  const { mutateAsync: revokeToken }  = useRevokeShareToken(id ?? "");

  const [showLogs,   setShowLogs]   = useState(false);
  const [showShare,  setShowShare]  = useState(false);
  const [shareExpiry, setShareExpiry] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  // Log view on mount
  useEffect(() => {
    if (id) logAccess(id, "view").catch(() => {});
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm("Move this document to trash?")) return;
    try {
      await softDelete(id);
      toast.success("Document moved to trash.");
      navigate("/documents");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDownload() {
    if (!url || !id) return;
    try {
      await logAccess(id, "download");
      const a = document.createElement("a");
      a.href = url;
      a.download = doc?.title ?? "document";
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  }

  async function handleCreateShareLink() {
    if (!id) return;
    try {
      const token = await createToken({ expiresAt: new Date(shareExpiry).toISOString() });
      const link  = `${window.location.origin}/share/${token.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading || !doc) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Document" />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-6 w-2/3 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isOwner   = doc.owner_id === user?.id;
  const expiryDays = doc.expires_at
    ? Math.ceil((new Date(doc.expires_at).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000)
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={doc.title}
        right={isOwner ? {
          type: "custom",
          element: (
            <button type="button" onClick={() => navigate(`/documents/${id}/edit`)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Edit3 size={15} />
            </button>
          ),
        } : { type: "none" }}
      />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {/* Preview area */}
        {url && (
          <div className="rounded-2xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center"
            style={{ minHeight: 200 }}>
            {isPdf(doc.mime_type) ? (
              <a href={url} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 py-8 text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink size={28} />
                <span className="text-sm font-semibold">Open PDF</span>
              </a>
            ) : (
              <img src={url} alt={doc.title} className="w-full object-contain max-h-64 rounded-2xl" />
            )}
          </div>
        )}

        {/* Meta */}
        <div className="rounded-2xl border border-border bg-background/60 divide-y divide-border">
          {[
            ["Category",   <CategoryBadge key="cat" category={doc.category} />],
            ["Size",       formatFileSize(doc.file_size)],
            ["Issued",     formatDate(doc.issued_date)],
            ["Expires",    doc.expires_at
              ? <span key="exp" className={cn("font-semibold", expiryDays !== null && expiryDays < 0 ? "text-rose-500" : expiryDays !== null && expiryDays <= 30 ? "text-amber-600" : "text-foreground")}>
                  {formatDate(doc.expires_at)} {expiryDays !== null && expiryDays < 0 ? "(expired)" : expiryDays === 0 ? "(today)" : expiryDays !== null ? `(${expiryDays}d)` : ""}
                </span>
              : "—"],
            ["Tags",       doc.tags.length > 0
              ? <div key="tags" className="flex gap-1 flex-wrap">{doc.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                ))}</div>
              : "—"],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-start justify-between gap-3 px-4 py-3">
              <span className="text-sm text-muted-foreground shrink-0">{label}</span>
              <span className="text-sm text-foreground text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3 text-sm font-semibold">
            <Download size={15} /> Download
          </button>
          {isOwner && (
            <button type="button" onClick={() => setShowShare((s) => !s)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3 text-sm font-semibold">
              <Share2 size={15} /> Share
            </button>
          )}
        </div>

        {/* Share panel */}
        {showShare && isOwner && (
          <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Create share link</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Expires</label>
                <input type="date" value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <button type="button" onClick={handleCreateShareLink}
                className="self-end flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Copy size={13} /> Copy
              </button>
            </div>

            {tokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Active links</p>
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{t.token.slice(0, 12)}…</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={9} />
                        Expires {new Date(t.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button type="button" onClick={() => revokeToken(t.id)}
                      className="text-xs text-destructive font-semibold">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Access logs */}
        {isOwner && (
          <div className="rounded-2xl border border-border bg-background/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowLogs((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-semibold text-foreground">Access history</span>
              {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showLogs && (
              <div className="px-4 pb-4">
                <AccessLogList logs={logs} />
              </div>
            )}
          </div>
        )}

        {/* Danger zone */}
        {isOwner && (
          <button type="button" onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive">
            <Trash2 size={15} /> Move to trash
          </button>
        )}
      </div>
    </div>
  );
}
