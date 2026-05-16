import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCurationForm } from "./EventCurationForm";
import {
  useCuratedEvents,
  useCuratedEvent,
  useCreateCuratedEvent,
  useUpdateCuratedEvent,
  useDeleteCuratedEvent,
  usePermanentlyDeleteEvent,
} from "@/hooks/use-curated-events";
import { useSuggestions, useReviewSuggestion } from "@/hooks/use-suggestions";
import { useExtractMetadata } from "@/hooks/use-extract-metadata";
import type { CuratedEventFilters, EventFormData } from "@/lib/admin-events-api";
import type { OppStatus, Opportunity, OpportunitySuggestion } from "@/types/discover";

// ── View type ────────────────────────────────────────────────────────────────

type View =
  | { type: "list" }
  | { type: "new" }
  | { type: "edit"; id: string }
  | { type: "curate"; url: string }
  | { type: "queue" };

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OppStatus | null | undefined }) {
  const cfg = {
    published:   { cls: "bg-emerald-500/10 text-emerald-600" },
    draft:       { cls: "bg-amber-500/10 text-amber-600" },
    unpublished: { cls: "bg-muted text-muted-foreground" },
    flagged:     { cls: "bg-red-500/10 text-red-600" },
  };
  const c = cfg[status ?? "draft"] ?? cfg.draft;
  return <Badge className={c.cls}>{status ?? "draft"}</Badge>;
}

// ── Back header ───────────────────────────────────────────────────────────────

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
      </button>
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function EventsListView({
  onNew,
  onEdit,
  onCurate,
  onQueue,
}: {
  onNew: () => void;
  onEdit: (id: string) => void;
  onCurate: (url: string) => void;
  onQueue: () => void;
}) {
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState<OppStatus | "all">("all");
  const [type,   setType]     = useState<string>("all");
  const [urlInput, setUrlInput] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const filters: CuratedEventFilters = {
    status: status === "all" ? undefined : status,
    type:   type   === "all" ? undefined : type,
    query:  search || undefined,
  };

  const { data: events, isLoading, refetch } = useCuratedEvents({ ...filters, _key: refreshKey } as CuratedEventFilters);
  const deleteMutation         = useDeleteCuratedEvent();
  const permanentDeleteMutation = usePermanentlyDeleteEvent();

  function handleRefresh() {
    void refetch();
    setRefreshKey((k) => k + 1);
  }

  function handlePasteSubmit() {
    const url = urlInput.trim();
    if (!url) return;
    try { new URL(url); }
    catch { toast.error("Enter a valid URL"); return; }
    onCurate(url);
  }

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={onNew}>
          <Plus size={14} /> New event
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPaste((v) => !v)}>
          <ExternalLink size={14} /> Paste URL
        </Button>
        <Button size="sm" variant="outline" onClick={onQueue}>
          <Inbox size={14} /> Suggestions queue
        </Button>
        <button
          onClick={handleRefresh}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Paste URL panel */}
      {showPaste && (
        <Card className="flex gap-2 p-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasteSubmit()}
            placeholder="https://eventbrite.com/e/… or any event URL"
            className="flex-1 rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            autoFocus
          />
          <Button size="sm" onClick={handlePasteSubmit}>Extract & curate</Button>
          <Button size="sm" variant="outline" onClick={() => { setShowPaste(false); setUrlInput(""); }}>
            Cancel
          </Button>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, org, location…"
            className="w-full rounded-2xl border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "draft", "unpublished"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "event", "job", "internship", "volunteering"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          : events?.length === 0
          ? <p className="py-8 text-center text-sm text-muted-foreground">No events found.</p>
          : events?.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              onEdit={() => onEdit(ev.id)}
              onUnpublish={() => {
                deleteMutation.mutate(ev.id, {
                  onSuccess: () => toast.success("Event unpublished."),
                  onError:   (e) => toast.error(String(e)),
                });
              }}
              onPermanentDelete={() => {
                permanentDeleteMutation.mutate(ev.id, {
                  onSuccess: () => toast.success("Event permanently deleted."),
                  onError:   (e) => toast.error(String(e)),
                });
              }}
            />
          ))
        }
      </div>
    </div>
  );
}

function EventRow({
  event,
  onEdit,
  onUnpublish,
  onPermanentDelete,
}: {
  event: Opportunity;
  onEdit: () => void;
  onUnpublish: () => void;
  onPermanentDelete: () => void;
}) {
  const [confirm, setConfirm] = useState<"unpublish" | "delete" | null>(null);
  const isUnpublished = event.status === "unpublished";

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {event.image_url && (
          <img src={event.image_url} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate">{event.title}</p>
            <StatusBadge status={event.status} />
            <Badge className="capitalize text-xs">{event.type}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {event.organization && <span>{event.organization} · </span>}
            {event.starts_at && <span>{new Date(event.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · </span>}
            {event.location && <span>{event.location}</span>}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/60">
            source: {event.source ?? "manual"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            {!isUnpublished && (
              confirm === "unpublish" ? (
                <>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => { onUnpublish(); setConfirm(null); }}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirm("unpublish")}>
                  Unpublish
                </Button>
              )
            )}
          </div>
          {isUnpublished && (
            confirm === "delete" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive font-medium">Permanently delete?</span>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => { onPermanentDelete(); setConfirm(null); }}>Delete</Button>
                <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="destructive" onClick={() => setConfirm("delete")}>
                Delete permanently
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Curate view ───────────────────────────────────────────────────────────────

function CurateView({
  initialUrl,
  onBack,
  onSaved,
}: {
  initialUrl: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [submitted, setSubmitted] = useState(false);
  const extractMutation = useExtractMetadata();
  const createMutation  = useCreateCuratedEvent();

  const result = extractMutation.data;
  const isBlocked = !!(result?.error);
  const isDuplicate = result?.duplicate;

  function handleExtract() {
    const u = url.trim();
    if (!u) return;
    try { new URL(u); } catch { toast.error("Enter a valid URL"); return; }
    extractMutation.mutate(u);
  }

  async function handleSubmit(form: EventFormData, action: "draft" | "publish") {
    try {
      await createMutation.mutateAsync(form);
      toast.success(action === "publish" ? "Event published." : "Draft saved.");
      onSaved();
    } catch (e) {
      toast.error(String(e));
    }
  }

  // Map extraction result to form initial
  const initial: Partial<EventFormData> | undefined = (result && !result.error && !result.duplicate) ? {
    title:       result.title,
    description: result.description,
    image_url:   result.image_url,
    starts_at:   result.starts_at,
    ends_at:     result.ends_at,
    location:    result.location,
    organization: result.organization,
    tags:        result.tags,
    url:         result.url,
    source_url:  url,
    type:        "event",
    status:      "draft",
  } : undefined;

  return (
    <div className="space-y-4">
      <BackHeader title="Curate from URL" onBack={onBack} />

      {/* URL input row */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleExtract()}
          placeholder="https://eventbrite.com/…"
          className="flex-1 rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleExtract}
          disabled={extractMutation.isPending}
        >
          {extractMutation.isPending
            ? <><Loader2 size={14} className="animate-spin" /> Extracting…</>
            : "Extract metadata"}
        </Button>
      </div>

      {/* Error/Blocked state */}
      {isBlocked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{result.error}</p>
            {result.error?.includes("Instagram") || result.error?.includes("manually") ? (
              <p className="text-xs text-amber-600 mt-1">
                You can still fill in the form manually below. The source URL is preserved.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Duplicate state */}
      {isDuplicate && (
        <div className="flex items-start gap-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3">
          <AlertTriangle size={15} className="text-sky-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
              An event with this source URL already exists: "{result.existing_title}"
            </p>
            <p className="text-xs text-sky-600 mt-0.5">
              Edit the existing event instead, or paste a different URL.
            </p>
          </div>
        </div>
      )}

      {/* Source preview for non-blocked, non-duplicate */}
      {url && !isDuplicate && (extractMutation.isSuccess || isBlocked) && (
        <SourcePreviewPane
          url={url}
          extractionMethod={result?.extraction_method}
          confidence={result?.confidence as "high" | "medium" | "low" | undefined}
        />
      )}

      {/* Form — always shown after extract attempt (even for blocked sources) */}
      {(extractMutation.isSuccess || isBlocked) && !isDuplicate && (
        <EventCurationForm
          key={url}
          initial={initial ?? { source_url: url, type: "event", status: "draft" }}
          sourceUrl={url}
          extractionMethod={result?.extraction_method}
          confidence={result?.confidence as "high" | "medium" | "low" | undefined}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          mode="curate"
        />
      )}
    </div>
  );
}

// ── Source preview pane ───────────────────────────────────────────────────────

function SourcePreviewPane({
  url,
  extractionMethod,
  confidence,
}: {
  url: string;
  extractionMethod?: string;
  confidence?: "high" | "medium" | "low";
}) {
  const [iframeError, setIframeError] = useState(false);

  const isFacebookOrInstagram =
    url.includes("facebook.com") || url.includes("instagram.com");

  function copyUrl() {
    void navigator.clipboard.writeText(url);
    toast.success("URL copied");
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-xs text-muted-foreground max-w-[220px]">{url}</span>
          <button onClick={copyUrl} className="shrink-0 text-muted-foreground hover:text-foreground">
            <Copy size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confidence && (
            <Badge
              className={
                confidence === "high"   ? "bg-emerald-500/10 text-emerald-600 text-[10px]" :
                confidence === "medium" ? "bg-amber-500/10 text-amber-600 text-[10px]" :
                                          "bg-red-500/10 text-red-600 text-[10px]"
              }
            >
              {extractionMethod ?? "heuristic"} · {confidence}
            </Badge>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-70"
          >
            Open <ExternalLink size={11} />
          </a>
        </div>
      </div>
      {!isFacebookOrInstagram && !iframeError ? (
        <iframe
          src={url}
          sandbox="allow-scripts allow-same-origin"
          className="h-60 w-full border-none"
          title="source preview"
          onError={() => setIframeError(true)}
        />
      ) : (
        <div className="flex h-32 items-center justify-center text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isFacebookOrInstagram
                ? "Facebook/Instagram blocks embedding — use the Open link above."
                : "Preview unavailable — use the Open link above."}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── New event view ────────────────────────────────────────────────────────────

function NewEventView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const createMutation = useCreateCuratedEvent();

  async function handleSubmit(form: EventFormData, action: "draft" | "publish") {
    try {
      await createMutation.mutateAsync(form);
      toast.success(action === "publish" ? "Event published." : "Draft saved.");
      onSaved();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <div>
      <BackHeader title="New event" onBack={onBack} />
      <EventCurationForm
        initial={{ type: "event", status: "draft" }}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        mode="new"
      />
    </div>
  );
}

// ── Edit view ─────────────────────────────────────────────────────────────────

function EditEventView({
  id,
  onBack,
  onSaved,
}: {
  id: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { data: event, isLoading } = useCuratedEvent(id);
  const updateMutation = useUpdateCuratedEvent(id);

  async function handleSubmit(form: EventFormData, action: "draft" | "publish") {
    try {
      await updateMutation.mutateAsync(form);
      toast.success(action === "publish" ? "Event updated & published." : "Draft saved.");
      onSaved();
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (isLoading) return (
    <div>
      <BackHeader title="Edit event" onBack={onBack} />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!event) return (
    <div>
      <BackHeader title="Edit event" onBack={onBack} />
      <p className="py-12 text-center text-sm text-muted-foreground">Event not found.</p>
    </div>
  );

  return (
    <div>
      <BackHeader title={`Edit: ${event.title}`} onBack={onBack} />

      {/* Audit info */}
      <div className="mb-4 rounded-2xl border border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        Created {new Date(event.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        {event.updated_at && ` · Updated ${new Date(event.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
        {` · source: ${event.source ?? "manual"}`}
      </div>

      <EventCurationForm
        key={event.id}
        initial={{
          type:          event.type,
          title:         event.title,
          description:   event.description ?? "",
          image_url:     event.image_url ?? "",
          starts_at:     event.starts_at ?? null,
          ends_at:       event.ends_at ?? null,
          location:      event.location ?? "",
          location_type: event.location_type ?? "in_person",
          organization:  event.organization ?? "",
          tags:          event.tags ?? [],
          url:           event.url ?? "",
          source_url:    event.source_url ?? "",
          status:        (event.status as import("@/types/discover").OppStatus) ?? "published",
        }}
        sourceUrl={event.source_url ?? undefined}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        mode="edit"
      />
    </div>
  );
}

// ── Suggestions queue view ────────────────────────────────────────────────────

const REJECTION_REASONS = [
  "spam",
  "duplicate",
  "not relevant",
  "past event",
  "invalid URL",
] as const;

function SuggestionsView({
  onBack,
  onCurate,
}: {
  onBack: () => void;
  onCurate: (url: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejectingId, setRejectingId]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const { data: suggestions, isLoading } = useSuggestions(statusFilter);
  const reviewMutation = useReviewSuggestion();

  function handleReject(id: string) {
    reviewMutation.mutate(
      { id, status: "rejected", rejectionReason: rejectReason || "not relevant" },
      {
        onSuccess: () => { toast.success("Suggestion rejected."); setRejectingId(null); setRejectReason(""); },
        onError:   (e) => toast.error(String(e)),
      }
    );
  }

  function handleApproveAndCurate(suggestion: OpportunitySuggestion) {
    reviewMutation.mutate(
      { id: suggestion.id, status: "approved" },
      {
        onSuccess: () => {
          toast.success("Marked as approved. Opening curate form…");
          onCurate(suggestion.url ?? "");
        },
        onError: (e) => toast.error(String(e)),
      }
    );
  }

  return (
    <div className="space-y-4">
      <BackHeader title="Suggestions queue" onBack={onBack} />

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : suggestions?.length === 0
          ? <p className="py-8 text-center text-sm text-muted-foreground">No {statusFilter === "all" ? "" : statusFilter} suggestions.</p>
          : suggestions?.map((s) => (
            <Card key={s.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {s.submitter_avatar ? (
                    <img src={s.submitter_avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound size={14} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.submitter_name ?? "Anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    s.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                    s.status === "rejected" ? "bg-red-500/10 text-red-600" :
                    "bg-amber-500/10 text-amber-600"
                  }
                >
                  {s.status}
                </Badge>
              </div>

              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:opacity-70 truncate"
                >
                  <ExternalLink size={11} />
                  {s.url}
                </a>
              )}

              {s.note && (
                <p className="text-sm text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
                  "{s.note}"
                </p>
              )}

              {s.rejection_reason && (
                <p className="text-xs text-red-500">Rejected: {s.rejection_reason}</p>
              )}

              {s.status === "pending" && (
                rejectingId === s.id ? (
                  <div className="space-y-2">
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm outline-none"
                    >
                      <option value="">Select reason…</option>
                      {REJECTION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleReject(s.id)}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle size={14} /> Confirm reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {s.url && (
                      <Button size="sm" onClick={() => handleApproveAndCurate(s)} disabled={reviewMutation.isPending}>
                        <CheckCircle2 size={14} /> Curate this event
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(s.id)}>
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )
              )}
            </Card>
          ))
        }
      </div>
    </div>
  );
}

// ── Root tab ──────────────────────────────────────────────────────────────────

export function EventsAdminTab() {
  const [view, setView] = useState<View>({ type: "list" });

  if (view.type === "new") return (
    <NewEventView
      onBack={() => setView({ type: "list" })}
      onSaved={() => setView({ type: "list" })}
    />
  );

  if (view.type === "edit") return (
    <EditEventView
      id={view.id}
      onBack={() => setView({ type: "list" })}
      onSaved={() => setView({ type: "list" })}
    />
  );

  if (view.type === "curate") return (
    <CurateView
      initialUrl={view.url}
      onBack={() => setView({ type: "list" })}
      onSaved={() => setView({ type: "list" })}
    />
  );

  if (view.type === "queue") return (
    <SuggestionsView
      onBack={() => setView({ type: "list" })}
      onCurate={(url) => setView({ type: "curate", url })}
    />
  );

  return (
    <EventsListView
      onNew={() => setView({ type: "new" })}
      onEdit={(id) => setView({ type: "edit", id })}
      onCurate={(url) => setView({ type: "curate", url })}
      onQueue={() => setView({ type: "queue" })}
    />
  );
}
