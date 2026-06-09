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
import { storageGet, storageSet } from "@/lib/native-storage";
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

// Backed by Capacitor Preferences (durable native storage) with a localStorage
// fallback on web — see native-storage.ts. These are async because native
// storage access is async.
async function readData(uid: string): Promise<OnboardingData> {
  try {
    const raw = await storageGet(storageKey(uid));
    return raw ? (JSON.parse(raw) as OnboardingData) : {};
  } catch {
    return {};
  }
}

async function writeData(uid: string, data: OnboardingData): Promise<void> {
  await storageSet(storageKey(uid), JSON.stringify(data));
}

async function markComplete(uid: string, existing: OnboardingData): Promise<OnboardingData> {
  const completed = { ...existing, completedAt: new Date().toISOString() };
  await writeData(uid, completed);
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

  // Resolve onboarding status for the current user. The DB (`user_preferences`)
  // is the source of truth for completion; localStorage is just a fast cache.
  //
  // Crucially, when the local cache has NO completion record we must consult the
  // DB BEFORE flipping `ready` — otherwise a returning user whose cache was
  // cleared (e.g. after force-quitting the native app, where WebView storage is
  // not guaranteed to persist) would be wrongly sent back through onboarding.
  useEffect(() => {
    let cancelled = false;
    setReady(false);

    if (!user) {
      setData({});
      setReady(true); // No user: ProtectedLayout will redirect to /auth anyway.
      return;
    }

    const uid = user.id;
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const isOldAccount = createdAt > 0 && Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;

    const finish = (next: OnboardingData) => {
      if (cancelled) return;
      setData(next);
      setReady(true);
    };

    // Safety net: never block the app indefinitely on slow storage/DB access.
    const timeout = window.setTimeout(() => finish({}), 6000);

    void (async () => {
      const stored = await readData(uid);
      if (cancelled) return;

      // Fast path: durable cache already marks completion.
      if (stored.completedAt) {
        window.clearTimeout(timeout);
        finish(stored);
        return;
      }

      // Old account heuristic: auto-skip without a DB query.
      if (isOldAccount) {
        const completed = await markComplete(uid, stored);
        window.clearTimeout(timeout);
        finish(completed);
        return;
      }

      // No local completion → authoritative DB check before deciding.
      if (!supabase) {
        window.clearTimeout(timeout);
        finish(stored);
        return;
      }

      try {
        const { data: row } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", uid)
          .maybeSingle();
        if (cancelled) return;
        const next = row ? await markComplete(uid, stored) : stored;
        window.clearTimeout(timeout);
        finish(next);
      } catch {
        // Network error → fall back to local cache (treat as not complete).
        window.clearTimeout(timeout);
        finish(stored);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    (next: OnboardingData) => {
      setData(next);
      if (user) void writeData(user.id, next);
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
