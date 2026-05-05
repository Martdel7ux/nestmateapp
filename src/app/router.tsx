import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { GdprGate } from "@/components/features/auth/gdpr-gate";
import { OnboardingTour } from "@/components/features/profile/onboarding-tour";
import { SplashScreen } from "@/components/features/profile/splash-screen";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { AdminPage } from "@/pages/admin-page";
import { AssistantPage } from "@/pages/assistant-page";
import { AuthCallbackPage } from "@/pages/auth-callback-page";
import { AuthPage } from "@/pages/auth-page";
import { ChatPage } from "@/pages/chat-page";
import { FlatmatesPage } from "@/pages/flatmates-page";
import { HomePage } from "@/pages/home-page";
import { LandlordDashboardPage } from "@/pages/landlord-dashboard-page";
import { MessagesPage } from "@/pages/messages-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { ProfilePage } from "@/pages/profile-page";
import { SavedPropertiesPage } from "@/pages/saved-properties-page";
import { SearchPage } from "@/pages/search-page";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => !window.sessionStorage.getItem("nestmate-splash"));

  useEffect(() => {
    if (!showSplash) return;
    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem("nestmate-splash", "true");
      setShowSplash(false);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [showSplash]);

  if (loading) return null;
  if (supabase && !user) return <Navigate to="/auth" replace />;

  return (
    <>
      <SplashScreen visible={showSplash} />
      <AppShell>
        <Outlet />
      </AppShell>
      <GdprGate />
      <OnboardingTour />
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/saved-properties" element={<SavedPropertiesPage />} />
          <Route path="/my-properties" element={<LandlordDashboardPage />} />
          <Route path="/flatmates" element={<FlatmatesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:matchId" element={<ChatPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
