import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUpcomingOutages, fetchOutage, createOutage, updateOutage, deleteOutage,
  fetchNextOutageForDistrict,
  fetchBusRoutes, fetchAllBusRoutes, createBusRoute, updateBusRoute, deleteBusRoute,
  fetchGarbageSchedules, fetchGarbageSchedule, fetchAllGarbageSchedules,
  upsertGarbageSchedule, deleteGarbageSchedule,
} from "@/lib/tools-api";
import type { CyprusDistrict, UniversityKey, EacOutage, GarbageSchedule, BusRoute } from "@/types/tools";

export const toolKeys = {
  outages:         (district?: CyprusDistrict) => ["tools", "outages", district ?? "all"] as const,
  outage:          (id: string)                => ["tools", "outage", id] as const,
  nextOutage:      (district: CyprusDistrict)  => ["tools", "outage-next", district] as const,
  buses:           (uni: UniversityKey)        => ["tools", "buses", uni] as const,
  busesAll:        ()                          => ["tools", "buses", "all"] as const,
  garbage:         (city: string)              => ["tools", "garbage", city] as const,
  garbageArea:     (city: string, area: string)=> ["tools", "garbage", city, area] as const,
  garbageAll:      ()                          => ["tools", "garbage", "all"] as const,
};

// ── Outages ───────────────────────────────────────────────────────────────────

export function useOutages(district?: CyprusDistrict) {
  return useQuery({
    queryKey: toolKeys.outages(district),
    queryFn:  () => fetchUpcomingOutages(district),
  });
}

export function useOutage(id: string | undefined) {
  return useQuery({
    queryKey: toolKeys.outage(id ?? ""),
    queryFn:  () => fetchOutage(id!),
    enabled:  !!id,
  });
}

export function useNextOutage(district: CyprusDistrict | undefined) {
  return useQuery({
    queryKey: toolKeys.nextOutage(district ?? "nicosia"),
    queryFn:  () => fetchNextOutageForDistrict(district!),
    enabled:  !!district,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateOutage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof createOutage>[0]) => createOutage(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "outages"] }),
  });
}

export function useUpdateOutage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EacOutage> }) => updateOutage(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "outages"] }),
  });
}

export function useDeleteOutage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOutage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "outages"] }),
  });
}

// ── Bus Routes ────────────────────────────────────────────────────────────────

export function useBusRoutes(university: UniversityKey | undefined) {
  return useQuery({
    queryKey: toolKeys.buses(university ?? "unic"),
    queryFn:  () => fetchBusRoutes(university!),
    enabled:  !!university,
    staleTime: 60 * 60 * 1000, // bus schedule changes rarely
  });
}

export function useAllBusRoutes() {
  return useQuery({
    queryKey: toolKeys.busesAll(),
    queryFn:  fetchAllBusRoutes,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateBusRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof createBusRoute>[0]) => createBusRoute(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "buses"] }),
  });
}

export function useUpdateBusRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BusRoute> }) => updateBusRoute(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "buses"] }),
  });
}

export function useDeleteBusRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBusRoute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "buses"] }),
  });
}

// ── Garbage ───────────────────────────────────────────────────────────────────

export function useGarbageSchedules(city: string | undefined) {
  return useQuery({
    queryKey: toolKeys.garbage(city ?? ""),
    queryFn:  () => fetchGarbageSchedules(city!),
    enabled:  !!city,
    staleTime: 24 * 60 * 60 * 1000, // garbage schedule changes very rarely
  });
}

export function useGarbageSchedule(city: string | undefined, area: string | undefined) {
  return useQuery({
    queryKey: toolKeys.garbageArea(city ?? "", area ?? ""),
    queryFn:  () => fetchGarbageSchedule(city!, area!),
    enabled:  !!city && !!area,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useAllGarbageSchedules() {
  return useQuery({
    queryKey: toolKeys.garbageAll(),
    queryFn:  fetchAllGarbageSchedules,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useUpsertGarbageSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof upsertGarbageSchedule>[0]) => upsertGarbageSchedule(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "garbage"] }),
  });
}

export function useDeleteGarbageSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGarbageSchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", "garbage"] }),
  });
}
