import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  fetchRentAgreements, fetchRentAgreement,
  createRentAgreement, updateRentAgreement, deactivateRentAgreement,
  fetchRentPayments, fetchRentPayment, fetchUpcomingRentPayment,
  markRentPaid, savePushSubscription, deletePushSubscription,
} from "@/lib/rent-api";
import type { RentAgreementFormData, MarkPaidFormData } from "@/types/rent";

// ── Query keys ────────────────────────────────────────────────────────────────

export const rentKeys = {
  all:       ["rent"] as const,
  agreements:(uid: string)  => ["rent", "agreements", uid] as const,
  agreement: (id: string)   => ["rent", "agreement", id] as const,
  payments:  (agId: string) => ["rent", "payments", agId] as const,
  payment:   (id: string)   => ["rent", "payment", id] as const,
  upcoming:  (uid: string)  => ["rent", "upcoming", uid] as const,
};

// ── Agreements ────────────────────────────────────────────────────────────────

export function useRentAgreements(userId: string | undefined) {
  return useQuery({
    queryKey: rentKeys.agreements(userId ?? ""),
    queryFn:  () => fetchRentAgreements(userId!),
    enabled:  !!userId,
  });
}

export function useRentAgreement(id: string | undefined) {
  return useQuery({
    queryKey: rentKeys.agreement(id ?? ""),
    queryFn:  () => fetchRentAgreement(id!),
    enabled:  !!id,
  });
}

export function useCreateRentAgreement(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: RentAgreementFormData) => createRentAgreement(form, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentKeys.agreements(userId) }),
  });
}

export function useUpdateRentAgreement(id: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<RentAgreementFormData>) => updateRentAgreement(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rentKeys.agreement(id) });
      qc.invalidateQueries({ queryKey: rentKeys.agreements(userId) });
    },
  });
}

export function useDeactivateRentAgreement(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateRentAgreement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentKeys.agreements(userId) }),
  });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function useRentPayments(agreementId: string | undefined) {
  return useQuery({
    queryKey: rentKeys.payments(agreementId ?? ""),
    queryFn:  () => fetchRentPayments(agreementId!),
    enabled:  !!agreementId,
  });
}

export function useRentPayment(id: string | undefined) {
  return useQuery({
    queryKey: rentKeys.payment(id ?? ""),
    queryFn:  () => fetchRentPayment(id!),
    enabled:  !!id,
  });
}

export function useUpcomingRentPayment(userId: string | undefined) {
  return useQuery({
    queryKey: rentKeys.upcoming(userId ?? ""),
    queryFn:  () => fetchUpcomingRentPayment(userId!),
    enabled:  !!userId,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });
}

export function useMarkRentPaid(paymentId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payment, form }: { payment: Parameters<typeof markRentPaid>[0]; form: MarkPaidFormData }) =>
      markRentPaid(payment, form, userId),
    onSuccess: (_, { payment }) => {
      qc.invalidateQueries({ queryKey: rentKeys.payment(paymentId) });
      qc.invalidateQueries({ queryKey: rentKeys.payments(payment.agreement_id) });
      qc.invalidateQueries({ queryKey: rentKeys.upcoming(userId) });
    },
  });
}

// ── Push subscription ─────────────────────────────────────────────────────────

type PushState = "unknown" | "granted" | "denied" | "unsupported";

export function usePushSubscription(userId: string | undefined) {
  const [state, setState]   = useState<PushState>("unknown");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission === "granted" ? "granted"
      : Notification.permission === "denied" ? "denied" : "unknown");
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId || !("serviceWorker" in navigator)) return false;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return false;
      }
      setState("granted");

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await savePushSubscription(userId, sub);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId || !("serviceWorker" in navigator)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(userId, sub.endpoint);
        await sub.unsubscribe();
      }
      setState("unknown");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { state, loading, subscribe, unsubscribe };
}
