import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNote,
  deleteNote,
  fetchMyNotes,
  searchNotes,
  toggleNoteUpvote,
  updateNote,
} from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import type { Note, NoteFilters } from "@/types/study";

export function useMyNotes(filters: NoteFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-notes", user?.id, filters],
    queryFn: () => fetchMyNotes(user!.id, filters),
    enabled: !!user,
  });
}

export function useSearchNotes(query: string) {
  const { user } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return useQuery({
    queryKey: ["search-notes", user?.id, debouncedQuery],
    queryFn: () => searchNotes(debouncedQuery, user!.id),
    enabled: !!user && debouncedQuery.trim().length > 1,
  });
}

export function useCreateNote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (note: Partial<Note> & { title: string }) =>
      createNote({ ...note, owner_id: user!.id }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-notes", user?.id] });
      void qc.invalidateQueries({ queryKey: ["public-library"] });
    },
  });
}

export function useUpdateNote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      updateNote(id, updates),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["my-notes", user?.id] });
      void qc.invalidateQueries({ queryKey: ["note", variables.id] });
      void qc.invalidateQueries({ queryKey: ["public-library"] });
    },
  });
}

export function useDeleteNote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-notes", user?.id] });
      void qc.invalidateQueries({ queryKey: ["public-library"] });
    },
  });
}

export function useToggleUpvote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      currentlyUpvoted,
    }: {
      noteId: string;
      currentlyUpvoted: boolean;
    }) => toggleNoteUpvote(user!.id, noteId, currentlyUpvoted),
    onMutate: async ({ noteId, currentlyUpvoted }) => {
      // Optimistic update on note detail
      await qc.cancelQueries({ queryKey: ["note", noteId] });
      const previous = qc.getQueryData<Note>(["note", noteId]);
      if (previous) {
        qc.setQueryData<Note>(["note", noteId], {
          ...previous,
          is_upvoted: !currentlyUpvoted,
          upvote_count: currentlyUpvoted
            ? Math.max(0, previous.upvote_count - 1)
            : previous.upvote_count + 1,
        });
      }
      return { previous };
    },
    onError: (_err, { noteId }, context) => {
      if (context?.previous) {
        qc.setQueryData(["note", noteId], context.previous);
      }
    },
    onSettled: (_data, _err, { noteId }) => {
      void qc.invalidateQueries({ queryKey: ["note", noteId] });
      void qc.invalidateQueries({ queryKey: ["public-library"] });
    },
  });
}

// Re-export for convenience
export { useMemo };
