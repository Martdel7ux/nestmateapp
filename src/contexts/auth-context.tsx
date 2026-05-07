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
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateConsent: (acceptAll: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

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

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then((result: { data: Profile | null }) => {
        setProfile(result.data ?? null);
      });
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      profile,
      async signInWithPassword(email, password) {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(input) {
        if (!supabase) return;
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
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: authRedirectUrl,
            // On native the system browser handles the OAuth flow; skip the
            // in-app browser redirect Supabase would otherwise attempt.
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
      async deleteAccount() {
        if (!supabase || !user) return;
        // Delete profile row first, then sign out (account deletion requires server-side admin)
        await supabase.from("profiles").delete().eq("id", user.id);
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
        const { error, data } = await supabase
          .from("profiles")
          .update({
            accepted_terms_at: iso,
            accepted_privacy_at: iso,
            accepted_cookies_at: iso
          })
          .eq("id", user.id)
          .select()
          .single();
        if (error) throw error;
        setProfile(data as Profile);
      }
    }),
    [loading, profile, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
