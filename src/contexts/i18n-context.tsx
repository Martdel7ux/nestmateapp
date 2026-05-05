import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

type Language = "en" | "el";

type Dictionary = Record<string, { en: string; el: string }>;

const dictionary: Dictionary = {
  homeTitle: {
    en: "Find your next nest in Cyprus",
    el: "Βρες το επόμενο σου σπίτι στην Κύπρο"
  },
  homeSubtitle: {
    en: "Student rentals, flatmate matching, and real-time support in one place.",
    el: "Φοιτητικά ενοίκια, ταίριασμα συγκατοίκων και υποστήριξη σε πραγματικό χρόνο."
  },
  smartSearch: {
    en: "Smart search",
    el: "Έξυπνη αναζήτηση"
  },
  assistant: {
    en: "Assistant",
    el: "Βοηθός"
  },
  properties: {
    en: "Properties",
    el: "Ακίνητα"
  },
  flatmates: {
    en: "Flatmates",
    el: "Συγκάτοικοι"
  },
  messages: {
    en: "Messages",
    el: "Μηνύματα"
  },
  notifications: {
    en: "Notifications",
    el: "Ειδοποιήσεις"
  },
  profile: {
    en: "Profile",
    el: "Προφίλ"
  },
  admin: {
    en: "Admin",
    el: "Διαχειριστής"
  }
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof dictionary) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (window.localStorage.getItem("nestmate-language") as Language) || "en";
  });

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        window.localStorage.setItem("nestmate-language", nextLanguage);
        setLanguage(nextLanguage);
      },
      t: (key: keyof typeof dictionary) => dictionary[key][language]
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
