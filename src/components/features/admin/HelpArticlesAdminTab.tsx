import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchAllArticlesAdmin, fetchHelpCategories,
  upsertArticle, deleteArticle,
} from "@/features/help/api/help-api";
import type { HelpArticle, HelpCategory } from "@/types/help";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-amber-500/10 text-amber-600",
  published: "bg-emerald-500/10 text-emerald-600",
  archived:  "bg-muted text-muted-foreground",
};

interface EditorState {
  id?: string;
  title: string;
  slug: string;
  category_id: string;
  summary: string;
  content: string;
  tags: string;
  status: "draft" | "published" | "archived";
  display_order_in_category: number;
}

function blankEditor(categories: HelpCategory[]): EditorState {
  return {
    title: "", slug: "", category_id: categories[0]?.id ?? "",
    summary: "", content: "", tags: "",
    status: "draft", display_order_in_category: 100,
  };
}

export function HelpArticlesAdminTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin", "help-articles"],
    queryFn:  fetchAllArticlesAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["help", "categories-all"],
    queryFn:  fetchHelpCategories,
  });

  function startNew() {
    setEditing(blankEditor(categories));
    setPreview(false);
  }

  function startEdit(a: HelpArticle) {
    setEditing({
      id: a.id, title: a.title, slug: a.slug,
      category_id: a.category_id, summary: a.summary ?? "",
      content: a.content, tags: a.tags.join(", "),
      status: a.status, display_order_in_category: a.display_order_in_category,
    });
    setPreview(false);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertArticle({
        id: editing.id,
        title: editing.title,
        slug: editing.slug || slugify(editing.title),
        category_id: editing.category_id,
        summary: editing.summary || null,
        content: editing.content,
        tags: editing.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: editing.status,
        display_order_in_category: editing.display_order_in_category,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "help-articles"] });
      setEditing(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this article?")) return;
    await deleteArticle(id);
    await qc.invalidateQueries({ queryKey: ["admin", "help-articles"] });
  }

  if (editing) {
    return (
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{editing.id ? "Edit Article" : "New Article"}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPreview((p) => !p)}>
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="ml-1">{preview ? "Editor" : "Preview"}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin mr-1" />}
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold block mb-1">Title</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing((s) => s && ({
                ...s, title: e.target.value,
                slug: s.id ? s.slug : slugify(e.target.value),
              }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Slug</label>
            <input
              value={editing.slug}
              onChange={(e) => setEditing((s) => s && ({ ...s, slug: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Category</label>
            <select
              value={editing.category_id}
              onChange={(e) => setEditing((s) => s && ({ ...s, category_id: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Status</label>
            <select
              value={editing.status}
              onChange={(e) => setEditing((s) => s && ({ ...s, status: e.target.value as any }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Display order</label>
            <input
              type="number"
              value={editing.display_order_in_category}
              onChange={(e) => setEditing((s) => s && ({ ...s, display_order_in_category: Number(e.target.value) }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold block mb-1">Summary (shown in search)</label>
            <input
              value={editing.summary}
              onChange={(e) => setEditing((s) => s && ({ ...s, summary: e.target.value }))}
              maxLength={200}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold block mb-1">Tags (comma-separated)</label>
            <input
              value={editing.tags}
              onChange={(e) => setEditing((s) => s && ({ ...s, tags: e.target.value }))}
              placeholder="rent, landlord, deposit"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold block mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={editing.content}
              onChange={(e) => setEditing((s) => s && ({ ...s, content: e.target.value }))}
              rows={18}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Help Articles ({articles.length})</h2>
        <Button size="sm" onClick={startNew}>
          <Plus size={14} className="mr-1" /> New article
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}

      <div className="space-y-2">
        {articles.map((a) => {
          const cat = categories.find((c) => c.id === a.category_id);
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className={STATUS_STYLES[a.status]}>{a.status}</Badge>
                  {cat && <span className="text-[10px] text-muted-foreground">{cat.name}</span>}
                </div>
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.slug}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(a)}>
                  <Pencil size={13} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                  <Trash2 size={13} className="text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
