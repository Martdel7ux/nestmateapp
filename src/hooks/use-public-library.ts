import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPublicNotes } from "@/lib/study-api";
import type { NoteFilters } from "@/types/study";

const PAGE_SIZE = 20;

export function usePublicLibrary(filters: NoteFilters) {
  return useInfiniteQuery({
    queryKey: ["public-library", filters],
    queryFn: ({ pageParam }) => fetchPublicNotes(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });
}
