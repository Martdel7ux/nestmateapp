import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchUserHouseholds, fetchHousehold, createHousehold, updateHousehold,
  regenerateInviteCode, joinHouseholdByCode,
  fetchHouseholdMembers, leaveHousehold, removeMember,
  fetchExpenses, fetchExpense, addExpense, softDeleteExpense,
  fetchSettlements, addSettlement,
  fetchHouseholdBalances,
} from "@/lib/household-api";
import type { ExpenseFormData, SettlementFormData } from "@/types/household";

// ── Query keys ────────────────────────────────────────────────────────────────

export const hhKeys = {
  all:          ["households"] as const,
  list:         (uid: string) => ["households", "list", uid] as const,
  detail:       (id: string)  => ["households", "detail", id] as const,
  members:      (id: string)  => ["households", "members", id] as const,
  balances:     (id: string)  => ["households", "balances", id] as const,
  expenses:     (id: string)  => ["households", "expenses", id] as const,
  expense:      (id: string)  => ["households", "expense", id] as const,
  settlements:  (id: string)  => ["households", "settlements", id] as const,
};

// ── Households ────────────────────────────────────────────────────────────────

export function useHouseholds(userId: string | undefined) {
  return useQuery({
    queryKey: hhKeys.list(userId ?? ""),
    queryFn:  () => fetchUserHouseholds(userId!),
    enabled:  !!userId,
  });
}

export function useHousehold(id: string | undefined) {
  return useQuery({
    queryKey: hhKeys.detail(id ?? ""),
    queryFn:  () => fetchHousehold(id!),
    enabled:  !!id,
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHousehold,
    onSuccess: () => qc.invalidateQueries({ queryKey: hhKeys.all }),
  });
}

export function useUpdateHousehold(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateHousehold>[1]) =>
      updateHousehold(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hhKeys.detail(id) });
      qc.invalidateQueries({ queryKey: hhKeys.all });
    },
  });
}

export function useRegenerateInviteCode(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateInviteCode(householdId),
    onSuccess: () => qc.invalidateQueries({ queryKey: hhKeys.detail(householdId) }),
  });
}

export function useJoinHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, userId }: { code: string; userId: string }) =>
      joinHouseholdByCode(code, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: hhKeys.all }),
  });
}

// ── Members ───────────────────────────────────────────────────────────────────

export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: hhKeys.members(householdId ?? ""),
    queryFn:  () => fetchHouseholdMembers(householdId!),
    enabled:  !!householdId,
  });
}

export function useLeaveHousehold(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => leaveHousehold(householdId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hhKeys.members(householdId) });
      qc.invalidateQueries({ queryKey: hhKeys.all });
    },
  });
}

export function useRemoveMember(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(householdId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: hhKeys.members(householdId) }),
  });
}

// ── Balances (with realtime) ───────────────────────────────────────────────────

export function useHouseholdBalances(householdId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!householdId || !supabase) return;
    const channel = supabase
      .channel(`hh-balances-${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses",
          filter: `household_id=eq.${householdId}` },
        () => qc.invalidateQueries({ queryKey: hhKeys.balances(householdId) })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements",
          filter: `household_id=eq.${householdId}` },
        () => qc.invalidateQueries({ queryKey: hhKeys.balances(householdId) })
      )
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, [householdId, qc]);

  return useQuery({
    queryKey: hhKeys.balances(householdId ?? ""),
    queryFn:  () => fetchHouseholdBalances(householdId!),
    enabled:  !!householdId,
  });
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export function useExpenses(householdId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: hhKeys.expenses(householdId ?? ""),
    queryFn:  () => fetchExpenses(householdId!, limit),
    enabled:  !!householdId,
  });
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: hhKeys.expense(id ?? ""),
    queryFn:  () => fetchExpense(id!),
    enabled:  !!id,
  });
}

export function useAddExpense(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ form, userId }: { form: ExpenseFormData; userId: string }) =>
      addExpense(form, householdId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hhKeys.expenses(householdId) });
      qc.invalidateQueries({ queryKey: hhKeys.balances(householdId) });
    },
  });
}

export function useDeleteExpense(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hhKeys.expenses(householdId) });
      qc.invalidateQueries({ queryKey: hhKeys.balances(householdId) });
    },
  });
}

// ── Settlements ───────────────────────────────────────────────────────────────

export function useSettlements(householdId: string | undefined) {
  return useQuery({
    queryKey: hhKeys.settlements(householdId ?? ""),
    queryFn:  () => fetchSettlements(householdId!),
    enabled:  !!householdId,
  });
}

export function useAddSettlement(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ form, userId }: { form: SettlementFormData; userId: string }) =>
      addSettlement(form, householdId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hhKeys.settlements(householdId) });
      qc.invalidateQueries({ queryKey: hhKeys.balances(householdId) });
    },
  });
}
