import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  MapPin,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { uploadEventImage, type EventFormData } from "@/lib/admin-events-api";
import { useSoftDuplicates } from "@/hooks/use-curated-events";
import type { OppStatus } from "@/types/discover";

// ── Constants ───────────────────────────────────────────────────────────────

const ALL_TAGS = [
  "tech", "business", "career", "networking", "academic",
  "arts", "sports", "volunteer", "student", "cyprus", "free",
];

const OPP_TYPES = ["event", "job", "internship", "volunteering"] as const;

const LOC_TYPES = [
  { value: "in_person", label: "In-person" },
  { value: "remote",    label: "Remote" },
  { value: "hybrid",    label: "Hybrid" },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: Partial<EventFormData>;
  sourceUrl?: string;
  extractionMethod?: string;
  confidence?: "high" | "medium" | "low";
  onSubmit: (data: EventFormData, action: "draft" | "publish") => Promise<void>;
  submitting?: boolean;
  mode: "new" | "edit" | "curate";
}

// ── Component ────────────────────────────────────────────────────────────────

export function EventCurationForm({
  initial,
  sourceUrl,
  extractionMethod,
  confidence,
  onSubmit,
  submitting,
  mode,
}: Props) {
  const [form, setForm] = useState<EventFormData>({
    type:          initial?.type          ?? "event",
    title:         initial?.title         ?? "",
    description:   initial?.description   ?? "",
    image_url:     initial?.image_url     ?? "",
    starts_at:     initial?.starts_at     ?? null,
    ends_at:       initial?.ends_at       ?? null,
    location:      initial?.location      ?? "",
    location_type: initial?.location_type ?? "in_person",
    organization:  initial?.organization  ?? "",
    tags:          initial?.tags          ?? [],
    url:           initial?.url           ?? "",
    source_url:    initial?.source_url    ?? sourceUrl ?? "",
    status:        initial?.status        ?? "draft",
  });

  const [tagInput,   setTagInput]   = useState("");
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep form in sync when `initial` changes (e.g. after extraction)
  useEffect(() => {
    if (!initial) return;
    setForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(initial).filter(([, v]) => v !== undefined)
      ) as Partial<EventFormData>,
    }));
  }, [initial]);

  const set = <K extends keyof EventFormData>(key: K, val: EventFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Soft duplicate check
  const { data: softDupes } = useSoftDuplicates(
    form.title,
    form.starts_at,
    mode !== "edit" && form.title.length >= 5
  );

  // Past event warning
  const isPast = form.starts_at
    ? new Date(form.starts_at) < new Date()
    : false;

  // Tag helpers
  function toggleTag(tag: string) {
    set("tags", form.tags.includes(tag)
      ? form.tags.filter((t) => t !== tag)
      : [...form.tags, tag]);
  }

  function addCustomTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  // Image upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadEventImage(file);
      set("image_url", url);
    } catch (err) {
      console.error("[EventCurationForm] image upload:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-border bg-muted/30 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  const selectCls = `${inputCls} pr-8 appearance-none cursor-pointer`;

  return (
    <div className="space-y-5">

      {/* Confidence badge */}
      {confidence && extractionMethod && (
        <div className="flex items-center gap-2">
          <Badge
            className={
              confidence === "high"   ? "bg-emerald-500/10 text-emerald-600" :
              confidence === "medium" ? "bg-amber-500/10 text-amber-600" :
                                        "bg-red-500/10 text-red-600"
            }
          >
            {confidence === "high"   ? <CheckCircle2 size={11} /> : <Info size={11} />}
            Extracted from {extractionMethod} · {confidence} confidence
          </Badge>
        </div>
      )}

      {/* Soft duplicate warning */}
      {(softDupes?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Possible duplicate — similar events found:
            </p>
            <ul className="mt-1 space-y-0.5">
              {softDupes?.map((d) => (
                <li key={d.id} className="text-xs text-amber-600 dark:text-amber-300">
                  "{d.title}" {d.starts_at ? `· ${new Date(d.starts_at).toLocaleDateString()}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Past event warning */}
      {isPast && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            This event's start date is in the past — confirm before publishing.
          </p>
        </div>
      )}

      <Card className="space-y-4 p-4">
        {/* Type + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={selectCls}
              >
                {OPP_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as OppStatus)}
                className={selectCls}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Event title"
            className={inputCls}
            required
          />
        </div>

        {/* Organization */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization</label>
          <input
            type="text"
            value={form.organization}
            onChange={(e) => set("organization", e.target.value)}
            placeholder="Organizing body or company"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description *
          </label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Event description (~500 chars ideal)"
            className="min-h-[120px] text-sm"
          />
        </div>
      </Card>

      {/* Dates + Location */}
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays size={11} /> Starts at *
            </label>
            <input
              type="datetime-local"
              value={isoToLocal(form.starts_at)}
              onChange={(e) => set("starts_at", localToIso(e.target.value))}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays size={11} /> Ends at
            </label>
            <input
              type="datetime-local"
              value={isoToLocal(form.ends_at)}
              onChange={(e) => set("ends_at", localToIso(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin size={11} /> Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Address or venue name"
            className={inputCls}
          />
        </div>

        {/* Location type toggle */}
        <div className="flex gap-2">
          {LOC_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("location_type", value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                form.location_type === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Image */}
      <Card className="space-y-4 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <ImageIcon size={11} /> Image
        </p>
        <div className="space-y-2">
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://… or upload below"
            className={inputCls}
          />
          {form.image_url && (
            <div className="relative">
              <img
                src={form.image_url}
                alt="preview"
                className="h-36 w-full rounded-xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => set("image_url", "")}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : "Upload image"}
            </Button>
            <span className="text-xs text-muted-foreground">Max 5 MB</span>
          </div>
        </div>
      </Card>

      {/* Tags */}
      <Card className="space-y-4 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Tag size={11} /> Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                form.tags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {/* Freeform tag add */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
            placeholder="Add custom tag…"
            className={`${inputCls} flex-1`}
          />
          <Button type="button" size="sm" variant="outline" onClick={addCustomTag}>
            Add
          </Button>
        </div>
        {/* Custom tags */}
        {form.tags.filter((t) => !ALL_TAGS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags
              .filter((t) => !ALL_TAGS.includes(t))
              .map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {tag}
                  <button type="button" onClick={() => toggleTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
          </div>
        )}
      </Card>

      {/* URLs */}
      <Card className="space-y-4 p-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ExternalLink size={11} /> Apply / Register URL
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://… link for users to register"
            className={inputCls}
          />
        </div>
        {form.source_url && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Source URL (read-only)
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-2">
              <span className="flex-1 truncate text-sm text-muted-foreground">{form.source_url}</span>
              <a
                href={form.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-primary hover:opacity-70"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </Card>

      {/* CTAs */}
      <div className="flex items-center gap-3 pb-4">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => {
            void onSubmit({ ...form, status: "draft" }, "draft");
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          Save as draft
        </Button>
        <Button
          type="button"
          disabled={!form.title.trim() || submitting}
          onClick={() => {
            void onSubmit({ ...form, status: "published" }, "publish");
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Publish
        </Button>
      </div>
    </div>
  );
}
