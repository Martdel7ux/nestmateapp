import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchCuratedEvents,
  fetchCuratedEvent,
  createCuratedEvent,
  updateCuratedEvent,
  deleteCuratedEvent,
  permanentlyDeleteEvent,
  findSoftDuplicates,
  type CuratedEventFilters,
  type EventFormData,
} from "@/lib/admin-events-api";

const QK_LIST   = (f: CuratedEventFilters) => ["admin-events", f] as const;
const QK_SINGLE = (id: string)             => ["admin-event", id] as const;

export function useCuratedEvents(filters: CuratedEventFilters = {}) {
  return useQuery({
    queryKey: QK_LIST(filters),
    queryFn:  () => fetchCuratedEvents(filters),
    staleTime: 60_000,
  });
}

export function useCuratedEvent(id: string | null) {
  return useQuery({
    queryKey: QK_SINGLE(id ?? ""),
    queryFn:  () => fetchCuratedEvent(id!),
    enabled:  !!id,
    staleTime: 30_000,
  });
}

export function useCreateCuratedEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: EventFormData) => createCuratedEvent(form, user!.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-events"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useUpdateCuratedEvent(id: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: Partial<EventFormData>) => updateCuratedEvent(id, form, user!.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-events"] });
      void qc.invalidateQueries({ queryKey: QK_SINGLE(id) });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function useDeleteCuratedEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCuratedEvent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-events"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function usePermanentlyDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteEvent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-events"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}

export function useSoftDuplicates(title: string, startsAt: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["soft-duplicates", title, startsAt],
    queryFn:  () => findSoftDuplicates(title, startsAt),
    enabled:  enabled && title.trim().length >= 5,
    staleTime: 60_000,
  });
}
