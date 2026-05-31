import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import type {
  LandlordPreferences,
  OnboardingData,
  OnboardingUserType,
  StudentPreferences,
} from "@/types/onboarding";

interface OnboardingContextValue {
  data: OnboardingData;
  isComplete: boolean;
  /** True once ALL checks (localStorage + profile) have resolved. ProtectedLayout
   *  must wait for this before making any redirect decision. */
  loaded: boolean;
  setUserType: (type: OnboardingUserType) => void;
  patchStudentPrefs: (prefs: Partial<StudentPreferences>) => void;
  patchLandlordPrefs: (prefs: Partial<LandlordPreferences>) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { snapshot, dataLoading } = useData();
  const [data, setData] = useState<OnboardingData>({});
  const [loaded, setLoaded] = useState(false);

  // Phase 1: read from localStorage as soon as we know the user.
  // If completedAt is already set we're done — mark loaded immediately.
  // If not, hold off and let Phase 2 finish the check before marking loaded.
  useEffect(() => {
    setLoaded(false);
    if (!user) {
      setData({});
      // Do NOT set loaded=true here. ProtectedLayout redirects to /auth for
      // unauthenticated users before it ever checks `loaded`, so leaving it
      // false prevents a premature onboarding redirect while auth is resolving.
      return;
    }
    const stored = readData(user.id);
    setData(stored);
    if (stored.completedAt) {
      setLoaded(true);
    }
    // else: Phase 2 will set loaded once it has profile data
  }, [user?.id]);

  // Phase 2: once profile data is available, decide whether to auto-skip onboarding
  // (existing / old accounts). Then — and only then — mark loaded so the router acts.
  useEffect(() => {
    if (!user || dataLoading) return;

    const stored = readData(user.id);

    if (!stored.completedAt) {
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isOldAccount = Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
      const hasProfileData = !!(snapshot.profile?.university || snapshot.profile?.city);

      if (isOldAccount || hasProfileData) {
        const completed = { ...stored, completedAt: new Date().toISOString() };
        writeData(user.id, completed);
        setData(completed);
      }
    }

    // All checks done — router may now act.
    setLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dataLoading]);

  const persist = useCallback(
    (next: OnboardingData) => {
      setData(next);
      if (user) writeData(user.id, next);
    },
    [user?.id],
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

  const completeOnboarding = useCallback(
    () => persist({ ...data, completedAt: new Date().toISOString() }),
    [data, persist],
  );

  const skipOnboarding = useCallback(
    () => persist({ ...data, completedAt: new Date().toISOString() }),
    [data, persist],
  );

  return (
    <OnboardingContext.Provider
      value={{
        data,
        isComplete: Boolean(data.completedAt),
        loaded,
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
