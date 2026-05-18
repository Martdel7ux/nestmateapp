import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/features/profile/onboarding-tour";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { LocationGate } from "@/components/features/location/LocationGate";
import { LocationSettingsPage } from "@/pages/location/LocationSettingsPage";
import { SearchProvider } from "@/contexts/search-context";
import { UniversalSearchOverlay } from "@/features/search/components/UniversalSearchOverlay";
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
import { PropertiesPage } from "@/pages/properties-page";
import { SearchPage } from "@/pages/search-page";
import { StudyHubPage } from "@/pages/study/StudyHubPage";
import { NoteEditorPage } from "@/pages/study/NoteEditorPage";
import { NoteViewPage } from "@/pages/study/NoteViewPage";
import { PublicLibraryPage } from "@/pages/study/PublicLibraryPage";
import { PublicNotePage } from "@/pages/study/PublicNotePage";
import { StudyGroupsPage } from "@/pages/study/StudyGroupsPage";
import { StudyGroupPage } from "@/pages/study/StudyGroupPage";
import { NewStudyGroupPage } from "@/pages/study/NewStudyGroupPage";
import { PeersPage } from "@/pages/study/PeersPage";
import { PeerProfilePage } from "@/pages/study/PeerProfilePage";
import { StudyMessagesPage } from "@/pages/study/MessagesPage";
import { ConversationPage } from "@/pages/study/ConversationPage";
import { MyCoursesPage } from "@/pages/study/MyCoursesPage";
import { RentOverviewPage } from "@/pages/rent/RentOverviewPage";
import { RentNewPage } from "@/pages/rent/RentNewPage";
import { RentAgreementDetailPage } from "@/pages/rent/RentAgreementDetailPage";
import { RentPaymentDetailPage } from "@/pages/rent/RentPaymentDetailPage";
import { HouseholdIndexPage } from "@/pages/household/HouseholdIndexPage";
import { HouseholdNewPage } from "@/pages/household/HouseholdNewPage";
import { HouseholdJoinPage } from "@/pages/household/HouseholdJoinPage";
import { HouseholdDashboardPage } from "@/pages/household/HouseholdDashboardPage";
import { ExpensesListPage } from "@/pages/household/ExpensesListPage";
import { ExpenseNewPage } from "@/pages/household/ExpenseNewPage";
import { ExpenseDetailPage } from "@/pages/household/ExpenseDetailPage";
import { SettleUpPage } from "@/pages/household/SettleUpPage";
import { SettlementNewPage } from "@/pages/household/SettlementNewPage";
import { MembersPage } from "@/pages/household/MembersPage";
import { HouseholdSettingsPage } from "@/pages/household/HouseholdSettingsPage";
import { DocumentsListPage } from "@/pages/documents/DocumentsListPage";
import { DocumentNewPage } from "@/pages/documents/DocumentNewPage";
import { DocumentViewerPage } from "@/pages/documents/DocumentViewerPage";
import { DocumentEditPage } from "@/pages/documents/DocumentEditPage";
import { DocumentsExpiringPage } from "@/pages/documents/DocumentsExpiringPage";
import { DocumentsTrashPage } from "@/pages/documents/DocumentsTrashPage";
import { DocumentSearchPage } from "@/pages/documents/DocumentSearchPage";
import { BillsCalculatorPage } from "@/pages/tools/BillsCalculatorPage";
import { OutagesPage } from "@/pages/tools/OutagesPage";
import { OutageDetailPage } from "@/pages/tools/OutageDetailPage";
import { BusesPage } from "@/pages/tools/BusesPage";
import { BusRouteDetailPage } from "@/pages/tools/BusRouteDetailPage";
import { GarbagePage } from "@/pages/tools/GarbagePage";

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
    <SearchProvider>
      <AppShell>
        <Outlet />
      </AppShell>
      <OnboardingTour />
      <LocationGate />
      <UniversalSearchOverlay />
    </SearchProvider>
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
          <Route path="/properties" element={<PropertiesPage />} />
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
          <Route path="/study" element={<StudyHubPage />} />
          <Route path="/study/notes/new" element={<NoteEditorPage />} />
          <Route path="/study/notes/:id" element={<NoteViewPage />} />
          <Route path="/study/notes/:id/edit" element={<NoteEditorPage />} />
          <Route path="/study/library" element={<PublicLibraryPage />} />
          <Route path="/study/library/:id" element={<PublicNotePage />} />
          <Route path="/study/groups" element={<StudyGroupsPage />} />
          <Route path="/study/groups/new" element={<NewStudyGroupPage />} />
          <Route path="/study/groups/:id" element={<StudyGroupPage />} />
          <Route path="/study/peers" element={<PeersPage />} />
          <Route path="/study/peers/:userId" element={<PeerProfilePage />} />
          <Route path="/study/messages" element={<StudyMessagesPage />} />
          <Route path="/study/messages/:conversationId" element={<ConversationPage />} />
          <Route path="/study/courses" element={<MyCoursesPage />} />
          <Route path="/rent" element={<RentOverviewPage />} />
          <Route path="/rent/new" element={<RentNewPage />} />
          <Route path="/rent/:agreementId" element={<RentAgreementDetailPage />} />
          <Route path="/rent/payments/:paymentId" element={<RentPaymentDetailPage />} />
          <Route path="/household" element={<HouseholdIndexPage />} />
          <Route path="/household/new" element={<HouseholdNewPage />} />
          <Route path="/household/join" element={<HouseholdJoinPage />} />
          <Route path="/household/:id" element={<HouseholdDashboardPage />} />
          <Route path="/household/:id/expenses" element={<ExpensesListPage />} />
          <Route path="/household/:id/expenses/new" element={<ExpenseNewPage />} />
          <Route path="/household/:id/expenses/:expenseId" element={<ExpenseDetailPage />} />
          <Route path="/household/:id/settle" element={<SettleUpPage />} />
          <Route path="/household/:id/settle/new" element={<SettlementNewPage />} />
          <Route path="/household/:id/members" element={<MembersPage />} />
          <Route path="/household/:id/settings" element={<HouseholdSettingsPage />} />
          <Route path="/documents" element={<DocumentsListPage />} />
          <Route path="/documents/new" element={<DocumentNewPage />} />
          <Route path="/documents/search" element={<DocumentSearchPage />} />
          <Route path="/documents/expiring" element={<DocumentsExpiringPage />} />
          <Route path="/documents/trash" element={<DocumentsTrashPage />} />
          <Route path="/documents/:id" element={<DocumentViewerPage />} />
          <Route path="/documents/:id/edit" element={<DocumentEditPage />} />
          <Route path="/profile/settings/location" element={<LocationSettingsPage />} />
          <Route path="/tools/bills-calculator" element={<BillsCalculatorPage />} />
          <Route path="/tools/outages" element={<OutagesPage />} />
          <Route path="/tools/outages/:id" element={<OutageDetailPage />} />
          <Route path="/tools/buses" element={<BusesPage />} />
          <Route path="/tools/buses/:university" element={<BusRouteDetailPage />} />
          <Route path="/tools/garbage" element={<GarbagePage />} />
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
