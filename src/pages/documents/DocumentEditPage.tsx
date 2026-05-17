import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHouseholds } from "@/hooks/use-household";
import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { ExpiryDateInput } from "@/components/features/documents/ExpiryDateInput";
import { SharingToggle } from "@/components/features/documents/SharingToggle";
import type { DocumentCategory, DocumentVisibility } from "@/types/document";
import { CATEGORY_LABELS } from "@/types/document";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

const CATEGORIES: DocumentCategory[] = [
  "lease","deposit_receipt","utility_bill","rent_receipt","insurance",
  "university_id","residence_permit","visa","passport",
  "bank_statement","medical","tax","other",
];

export function DocumentEditPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const { data: doc, isLoading } = useDocument(id);
  const { data: households = [] } = useHouseholds(user?.id);
  const { mutateAsync: update, isPending } = useUpdateDocument(user?.id ?? "");

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<DocumentCategory>("other");
  const [issuedDate,  setIssuedDate]  = useState("");
  const [expiresAt,   setExpiresAt]   = useState("");
  const [tagsInput,   setTagsInput]   = useState("");
  const [visibility,  setVisibility]  = useState<DocumentVisibility>("private");
  const [householdId, setHouseholdId] = useState("");

  useEffect(() => {
    if (!doc) return;
    setTitle(doc.title);
    setDescription(doc.description ?? "");
    setCategory(doc.category);
    setIssuedDate(doc.issued_date ?? "");
    setExpiresAt(doc.expires_at ?? "");
    setTagsInput(doc.tags.join(", "));
    setVisibility(doc.visibility);
    setHouseholdId(doc.shared_household_id ?? "");
  }, [doc]);

  async function handleSave() {
    if (!id || !title.trim()) { toast.error("Title is required."); return; }
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await update({
        id,
        patch: {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          issued_date: issuedDate || undefined,
          expires_at: expiresAt || undefined,
          tags,
          visibility,
          shared_household_id: visibility === "household" ? householdId : undefined,
        },
      });
      toast.success("Document updated.");
      navigate(`/documents/${id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading || !doc) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Edit Document" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Edit Document" />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32 space-y-5">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} className={cn(inputCls, "resize-none")} />
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Issue date</label>
            <input type="date" value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)} className={inputCls} />
          </div>
          <ExpiryDateInput value={expiresAt} onChange={setExpiresAt} />
        </div>

        {/* Tags */}
        <div>
          <label className={labelCls}>Tags</label>
          <input type="text" value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="visa, 2025 (comma-separated)"
            className={inputCls} />
        </div>

        {/* Sharing */}
        <div>
          <label className={labelCls}>Visibility</label>
          <SharingToggle
            visibility={visibility}
            sharedHouseholdId={householdId}
            households={households}
            onVisibilityChange={setVisibility}
            onHouseholdChange={setHouseholdId}
          />
        </div>

        <button type="button" onClick={handleSave} disabled={isPending}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
