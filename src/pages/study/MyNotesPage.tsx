import { useState } from "react";
import { BookOpen, Grid2X2, LayoutList, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NoteCard } from "@/components/features/study/NoteCard";
import { NoteFiltersBar } from "@/components/features/study/NoteFilters";
import { useDeleteNote, useMyNotes } from "@/hooks/use-notes";
import type { NoteFilters } from "@/types/study";

const VIEW_STORAGE_KEY = "study-notes-view";

export function MyNotesPage() {
  const [filters, setFilters] = useState<NoteFilters>({});
  const [view, setView] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "list" ? "list" : "grid";
  });

  const { data: notes = [], isLoading } = useMyNotes(filters);
  const { mutate: deleteNote } = useDeleteNote();

  const toggleView = (v: "grid" | "list") => {
    setView(v);
    localStorage.setItem(VIEW_STORAGE_KEY, v);
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteNote(id, {
      onSuccess: () => toast.success("Note deleted"),
      onError: () => toast.error("Failed to delete note"),
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 pt-4 pb-3 bg-background">
        <NoteFiltersBar filters={filters} onChange={setFilters} showVisibility />

        {/* View toggle */}
        <div className="flex items-center justify-end gap-1 px-4 pt-2">
          <button
            type="button"
            onClick={() => toggleView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => toggleView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-32 pt-2">
          {isLoading ? (
            <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "space-y-3")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <BookOpen size={40} className="text-muted-foreground/40" />
              <p className="font-semibold text-foreground">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first note to get started
              </p>
              <Link
                to="/study/notes/new"
                className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Create a note
              </Link>
            </div>
          ) : (
            <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "space-y-3")}>
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={() => handleDelete(note.id, note.title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link
        to="/study/notes/new"
        className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg text-primary-foreground active:scale-95 transition-transform z-30"
        aria-label="New note"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
