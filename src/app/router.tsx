import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/features/profile/onboarding-tour";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { AdminPage } from "@/pages/admin-page";
import { AssistantPage } from "@/pages/assistant-page";
import { AuthCallbackPage } from "@/pages/auth-callback-page";
import { AuthPage } from "@/pages/auth-page";
import { ChatPage } from "@/pages/chat-page";
import { DiscoverPage } from "@/pages/discover-page";
import { DiscoverNotificationsPage } from "@/pages/discover-notifications-page";
import { DiscoverPreferencesPage } from "@/pages/discover-preferences-page";
import { FlatmatesPage } from "@/pages/flatmates-page";
import { HomePage } from "@/pages/home-page";
import { LandlordDashboardPage } from "@/pages/landlord-dashboard-page";
import { MessagesPage } from "@/pages/messages-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { OpportunityDetailPage } from "@/pages/opportunity-detail-page";
import { ProfilePage } from "@/pages/profile-page";
import { SavedOpportunitiesPage } from "@/pages/saved-opportunities-page";
import { SavedPropertiesPage } from "@/pages/saved-properties-page";
import { SearchPage } from "@/pages/search-page";

function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (supabase && !user) return <Navigate to="/auth" replace />;

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <OnboardingTour />
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <OnboardingFlow>
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
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/discover/notifications" element={<DiscoverNotificationsPage />} />
          <Route path="/discover/preferences" element={<DiscoverPreferencesPage />} />
          <Route path="/discover/saved" element={<SavedOpportunitiesPage />} />
          <Route path="/discover/:id" element={<OpportunityDetailPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </OnboardingFlow>
    </BrowserRouter>
  );
}
