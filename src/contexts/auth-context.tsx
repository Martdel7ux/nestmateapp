import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import type { Profile, UserType } from "@/types/supabase";

// On native the OS routes this custom scheme back into the app.
// On web we use the real origin so the callback page can handle it.
const authRedirectUrl = Capacitor.isNativePlatform()
  ? "com.nestmate.app://login-callback"
  : `${window.location.origin}/auth/callback`;

const resetRedirectUrl = Capacitor.isNativePlatform()
  ? "com.nestmate.app://reset-password"
  : `${window.location.origin}/reset-password`;

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  userType: UserType;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateConsent: (acceptAll: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then((result) => {
      setSession(result.data.session);
      setUser(result.data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    // Public profile + owner-only private PII (consent timestamps, home address)
    // live in separate tables; merge them into the in-memory Profile object so
    // the rest of the app can keep reading `profile.street_address`, etc.
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profiles_private").select("*").eq("id", user.id).maybeSingle(),
    ]).then(([pub, priv]) => {
      const base = pub.data as Profile | null;
      if (!base) {
        setProfile(null);
        return;
      }
      setProfile({ ...base, ...(priv.data ?? {}) } as Profile);
    });
  }, [user]);

  // Admin status comes from the `user_roles` table (the same source the
  // database RLS policies use), not a hardcoded email. RLS lets only admins
  // read user_roles, so a non-admin simply gets no row here → isAdmin = false.
  useEffect(() => {
    if (!supabase || !user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      profile,
      isAdmin,
      async signInWithPassword(email, password) {
        if (!supabase) throw new Error("Authentication is not configured. Please contact support.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(input) {
        if (!supabase) throw new Error("Authentication is not configured. Please contact support.");
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              full_name: input.fullName,
              user_type: input.userType
            },
            emailRedirectTo: authRedirectUrl
          }
        });
        if (error) throw error;
      },
      async signInWithGoogle() {
        if (!supabase) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: authRedirectUrl,
            skipBrowserRedirect: Capacitor.isNativePlatform(),
          }
        });
        if (error) throw error;
      },
      async signInWithApple() {
        if (!supabase) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo: authRedirectUrl,
            skipBrowserRedirect: Capacitor.isNativePlatform(),
          }
        });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      async updatePassword(newPassword) {
        if (!supabase) return;
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      },
      async updateEmail(newEmail) {
        if (!supabase) return;
        // Supabase emails a confirmation link to the new address (and, when
        // "secure email change" is on, the old one too). The change only takes
        // effect once the user clicks through — so the UI tells them to check.
        const { error } = await supabase.auth.updateUser(
          { email: newEmail },
          { emailRedirectTo: authRedirectUrl }
        );
        if (error) throw error;
      },
      async deleteAccount() {
        if (!supabase || !user) return;
        // Fully erase the account server-side (auth user + storage + cascaded
        // rows). The client cannot delete an auth user, so this runs in the
        // `delete-account` edge function with the service role.
        const { error } = await supabase.functions.invoke("delete-account", {
          method: "POST",
        });
        if (error) throw error;
        await supabase.auth.signOut();
      },
      async resetPassword(email) {
        if (!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl
        });
        if (error) throw error;
      },
      async updateConsent(acceptAll) {
        if (!supabase || !user || !acceptAll) return;
        const iso = new Date().toISOString();
        // Consent timestamps are owner-only PII → profiles_private.
        const { error, data } = await supabase
          .from("profiles_private")
          .upsert(
            {
              id: user.id,
              accepted_terms_at: iso,
              accepted_privacy_at: iso,
              accepted_cookies_at: iso
            },
            { onConflict: "id" }
          )
          .select()
          .single();
        if (error) throw error;
        setProfile((current) => (current ? { ...current, ...data } : current));
      }
    }),
    [isAdmin, loading, profile, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
