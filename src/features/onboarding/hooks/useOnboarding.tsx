import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import type {
  LandlordPreferences,
  OnboardingData,
  OnboardingUserType,
  StudentPreferences,
} from "@/types/onboarding";

interface OnboardingContextValue {
  data: OnboardingData;
  isComplete: boolean;
  /** True once we have read localStorage for the current user. Always resolves
   *  within one effect cycle (~16 ms). The router waits for this before deciding
   *  whether to show onboarding. */
  ready: boolean;
  setUserType: (type: OnboardingUserType) => void;
  patchStudentPrefs: (prefs: Partial<StudentPreferences>) => void;
  patchLandlordPrefs: (prefs: Partial<LandlordPreferences>) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const storageKey = (uid: string) => `nestmate_onboarding_${uid}`;

function readData(uid: string): OnboardingData {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as OnboardingData) : {};
  } catch {
    return {};
  }
}

function writeData(uid: string, data: OnboardingData) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(data));
  } catch { /* quota errors */ }
}

function markComplete(uid: string, existing: OnboardingData): OnboardingData {
  const completed = { ...existing, completedAt: new Date().toISOString() };
  writeData(uid, completed);
  return completed;
}

function deriveUserType(type: OnboardingUserType | undefined): string {
  if (!type) return "student";
  return type === "landlord" ? "landlord" : "student";
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData>({});
  // `ready` flips to true after one synchronous effect cycle — never hangs.
  const [ready, setReady] = useState(false);

  // Step 1 — synchronous localStorage read. Runs once per user change, resolves in ~16 ms.
  useEffect(() => {
    setReady(false);
    if (!user) {
      setData({});
      setReady(true); // No user: ProtectedLayout will redirect to /auth anyway.
      return;
    }

    const stored = readData(user.id);

    // Auto-skip for old accounts (no DB query needed).
    if (!stored.completedAt) {
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isOldAccount = Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
      if (isOldAccount) {
        const completed = markComplete(user.id, stored);
        setData(completed);
        setReady(true);
        return;
      }
    }

    setData(stored);
    setReady(true); // Always resolves synchronously from localStorage.
  }, [user?.id]);

  // Step 2 — background DB check for cross-device completion.
  // Runs after ready=true so it never blocks the UI.
  useEffect(() => {
    if (!user || !supabase) return;
    const stored = readData(user.id);
    if (stored.completedAt) return; // Already done — nothing to check.

    void supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) return;
        const completed = markComplete(user.id, readData(user.id));
        setData(completed);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    (next: OnboardingData) => {
      setData(next);
      if (user) writeData(user.id, next);
    },
    [user?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setUserType = useCallback(
    (type: OnboardingUserType) => persist({ ...data, userType: type }),
    [data, persist],
  );

  const patchStudentPrefs = useCallback(
    (prefs: Partial<StudentPreferences>) =>
      persist({ ...data, studentPreferences: { ...data.studentPreferences, ...prefs } }),
    [data, persist],
  );

  const patchLandlordPrefs = useCallback(
    (prefs: Partial<LandlordPreferences>) =>
      persist({ ...data, landlordPreferences: { ...data.landlordPreferences, ...prefs } }),
    [data, persist],
  );

  const completeOnboarding = useCallback(async () => {
    const next = { ...data, completedAt: new Date().toISOString() };
    persist(next);

    if (!supabase || !user) return;

    const sp = data.studentPreferences;
    const lp = data.landlordPreferences;

    await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        user_type: deriveUserType(data.userType),
        university: sp?.university ?? null,
        city: sp?.city ?? lp?.location ?? null,
        budget: sp?.budget ?? null,
        has_place: sp?.hasPlace ?? null,
        bedrooms_available: sp?.bedroomsAvailable ?? null,
        rent_per_person: sp?.rentPerPerson ?? null,
        property_count: lp?.propertyCount ?? null,
        property_location: lp?.location ?? null,
      },
      { onConflict: "user_id" },
    );
  }, [data, persist, user]);

  const skipOnboarding = useCallback(async () => {
    const next = { ...data, completedAt: new Date().toISOString() };
    persist(next);

    if (!supabase || !user) return;

    await supabase.from("user_preferences").upsert(
      { user_id: user.id, user_type: deriveUserType(data.userType) },
      { onConflict: "user_id" },
    );
  }, [data, persist, user]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        isComplete: Boolean(data.completedAt),
        ready,
        setUserType,
        patchStudentPrefs,
        patchLandlordPrefs,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
