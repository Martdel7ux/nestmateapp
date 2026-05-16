import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { NoteEditor } from "@/components/features/study/NoteEditor";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import { useCreateNote, useUpdateNote } from "@/hooks/use-notes";
import { useNote } from "@/hooks/use-note";
import { useMyStudyGroups } from "@/hooks/use-study-groups";
import { uploadNoteAttachment } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import type { NoteVisibility } from "@/types/study";

const DRAFT_KEY = "study-note-draft";

type VisibilityOption = { value: NoteVisibility; label: string; desc: string };
const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: "private", label: "Private", desc: "Only you can see this" },
  { value: "group", label: "Group", desc: "Share with a study group" },
  { value: "public", label: "Public", desc: "Visible to all students" },
];

export function NoteEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: existingNote, isLoading: loadingNote } = useNote(id ?? "");
  const { data: myGroups = [] } = useMyStudyGroups();
  const { mutate: createNote, isPending: creating } = useCreateNote();
  const { mutate: updateNote, isPending: updating } = useUpdateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<NoteVisibility>("private");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSaving = creating || updating;

  // Load existing note in edit mode
  useEffect(() => {
    if (isEdit && existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content ?? "");
      setCourseId(existingNote.course_id ?? null);
      setVisibility(existingNote.visibility);
      setGroupId(existingNote.group_id ?? null);
      setTags(existingNote.tags ?? []);
      setAttachmentUrls(existingNote.attachment_urls ?? []);
    }
  }, [isEdit, existingNote]);

  // Load draft in create mode
  useEffect(() => {
    if (!isEdit) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          setTitle(parsed.title ?? "");
          setContent(parsed.content ?? "");
        }
      } catch {
        // ignore
      }
    }
  }, [isEdit]);

  // Autosave draft every 30s
  useEffect(() => {
    if (isEdit) return;
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
    }, 30_000);
    return () => clearInterval(interval);
  }, [isEdit, title, content]);

  const addTag = (raw: string) => {
    const newTags = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !tags.includes(t));
    if (newTags.length) setTags((prev) => [...prev, ...newTags]);
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadNoteAttachment(user.id, file);
      setAttachmentUrls((prev) => [...prev, url]);
      toast.success("Attachment uploaded");
    } catch {
      toast.error("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const buildPayload = () => ({
    title: title.trim(),
    content,
    course_id: courseId,
    visibility,
    group_id: visibility === "group" ? groupId : null,
    tags,
    attachment_urls: attachmentUrls,
  });

  const handleSave = (publish = false) => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    const payload = { ...buildPayload(), visibility: publish ? visibility : ("private" as NoteVisibility) };

    if (isEdit && id) {
      updateNote(
        { id, updates: payload },
        {
          onSuccess: () => {
            toast.success("Note saved");
            navigate(`/study/notes/${id}`);
          },
          onError: () => toast.error("Failed to save"),
        }
      );
    } else {
      createNote(payload as Parameters<typeof createNote>[0], {
        onSuccess: (note) => {
          localStorage.removeItem(DRAFT_KEY);
          toast.success("Note created");
          navigate(`/study/notes/${note.id}`);
        },
        onError: () => toast.error("Failed to create note"),
      });
    }
  };

  if (isEdit && loadingNote) {
    return (
      <div className="p-5 space-y-3">
        <Skeleton className="h-8 w-1/2 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-semibold text-foreground">
          {isEdit ? "Edit Note" : "New Note"}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4 pb-32">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title…"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />

          {/* Content editor */}
          <NoteEditor value={content} onChange={setContent} />

          {/* Course select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Course</label>
            <CourseSelect value={courseId} onChange={setCourseId} placeholder="No course selected" />
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Visibility</label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Group picker (only if group visibility) */}
          {visibility === "group" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Study Group
              </label>
              <select
                value={groupId ?? ""}
                onChange={(e) => setGroupId(e.target.value || null)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a group…</option>
                {myGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tags (comma-separated)
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) {
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              placeholder="e.g. algorithms, exam, chapter-3"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Attachments
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              {uploading ? "Uploading…" : "Upload file"}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="image/*,.pdf,.doc,.docx,.txt,.pptx,.xlsx"
            />
            {attachmentUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachmentUrls.map((url, i) => (
                  <div key={url} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary truncate"
                    >
                      Attachment {i + 1}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachmentUrls((prev) => prev.filter((u) => u !== url))
                      }
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
