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

  useEffect(() => {
    if (!user) { setData({}); return; }
    setData(readData(user.id));
  }, [user?.id]);

  // Auto-skip onboarding for users who aren't first-timers:
  // accounts older than 7 days, or accounts that already have profile data set.
  useEffect(() => {
    if (!user || dataLoading) return;
    const stored = readData(user.id);
    if (stored.completedAt) return;

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const accountAgeMs = Date.now() - createdAt;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isExistingAccount = accountAgeMs > SEVEN_DAYS_MS;

    const profile = snapshot.profile;
    const hasProfileData = !!(profile?.university || profile?.city);

    if (isExistingAccount || hasProfileData) {
      const completed = { ...stored, completedAt: new Date().toISOString() };
      writeData(user.id, completed);
      setData(completed);
    }
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
