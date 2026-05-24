import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/features/profile/onboarding-tour";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { LocationGate } from "@/components/features/location/LocationGate";
import { SearchProvider } from "@/contexts/search-context";
import { UniversalSearchOverlay } from "@/features/search/components/UniversalSearchOverlay";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { supabase } from "@/lib/supabase";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";

// Onboarding pages (not lazy — critical first-run path)
import { WelcomeSplash } from "@/features/onboarding/pages/WelcomeSplash";
import { IntroSlides } from "@/features/onboarding/pages/IntroSlides";
import { UserTypeSelection } from "@/features/onboarding/pages/UserTypeSelection";
import { StudentPersonalization } from "@/features/onboarding/pages/StudentPersonalization";
import { LandlordPersonalization } from "@/features/onboarding/pages/LandlordPersonalization";
import { CompletionScreen } from "@/features/onboarding/pages/CompletionScreen";

// ── Static imports (always needed immediately) ──────────────────────────────
import { HomePage } from "@/pages/home-page";
import { AuthPage } from "@/pages/auth-page";
import { AuthCallbackPage } from "@/pages/auth-callback-page";
import { NotFoundPage } from "@/pages/not-found-page";

// ── Lazy page imports ────────────────────────────────────────────────────────
const AdminPage                = lazy(() => import("@/pages/admin-page").then(m => ({ default: m.AdminPage })));
const AssistantPage            = lazy(() => import("@/pages/assistant-page").then(m => ({ default: m.AssistantPage })));
const ChatPage                 = lazy(() => import("@/pages/chat-page").then(m => ({ default: m.ChatPage })));
const DiscoverPage             = lazy(() => import("@/pages/discover-page").then(m => ({ default: m.DiscoverPage })));
const DiscoverNotificationsPage= lazy(() => import("@/pages/discover-notifications-page").then(m => ({ default: m.DiscoverNotificationsPage })));
const DiscoverPreferencesPage  = lazy(() => import("@/pages/discover-preferences-page").then(m => ({ default: m.DiscoverPreferencesPage })));
const FlatmatesPage            = lazy(() => import("@/pages/flatmates-page").then(m => ({ default: m.FlatmatesPage })));
const LandlordDashboardPage    = lazy(() => import("@/pages/landlord-dashboard-page").then(m => ({ default: m.LandlordDashboardPage })));
const MessagesPage             = lazy(() => import("@/pages/messages-page").then(m => ({ default: m.MessagesPage })));
const NotificationsPage        = lazy(() => import("@/pages/notifications-page").then(m => ({ default: m.NotificationsPage })));
const OpportunityDetailPage    = lazy(() => import("@/pages/opportunity-detail-page").then(m => ({ default: m.OpportunityDetailPage })));
const ProfilePage              = lazy(() => import("@/pages/profile-page").then(m => ({ default: m.ProfilePage })));
const SavedOpportunitiesPage   = lazy(() => import("@/pages/saved-opportunities-page").then(m => ({ default: m.SavedOpportunitiesPage })));
const SavedPropertiesPage      = lazy(() => import("@/pages/saved-properties-page").then(m => ({ default: m.SavedPropertiesPage })));
const PropertiesPage           = lazy(() => import("@/pages/properties-page").then(m => ({ default: m.PropertiesPage })));
const SearchPage               = lazy(() => import("@/pages/search-page").then(m => ({ default: m.SearchPage })));
const LocationSettingsPage     = lazy(() => import("@/pages/location/LocationSettingsPage").then(m => ({ default: m.LocationSettingsPage })));
const ToolsPage                = lazy(() => import("@/pages/tools-page").then(m => ({ default: m.ToolsPage })));

// Study
const StudyHubPage      = lazy(() => import("@/pages/study/StudyHubPage").then(m => ({ default: m.StudyHubPage })));
const NoteEditorPage    = lazy(() => import("@/pages/study/NoteEditorPage").then(m => ({ default: m.NoteEditorPage })));
const NoteViewPage      = lazy(() => import("@/pages/study/NoteViewPage").then(m => ({ default: m.NoteViewPage })));
const PublicLibraryPage = lazy(() => import("@/pages/study/PublicLibraryPage").then(m => ({ default: m.PublicLibraryPage })));
const PublicNotePage    = lazy(() => import("@/pages/study/PublicNotePage").then(m => ({ default: m.PublicNotePage })));
const StudyGroupsPage   = lazy(() => import("@/pages/study/StudyGroupsPage").then(m => ({ default: m.StudyGroupsPage })));
const StudyGroupPage    = lazy(() => import("@/pages/study/StudyGroupPage").then(m => ({ default: m.StudyGroupPage })));
const NewStudyGroupPage = lazy(() => import("@/pages/study/NewStudyGroupPage").then(m => ({ default: m.NewStudyGroupPage })));
const PeersPage         = lazy(() => import("@/pages/study/PeersPage").then(m => ({ default: m.PeersPage })));
const PeerProfilePage   = lazy(() => import("@/pages/study/PeerProfilePage").then(m => ({ default: m.PeerProfilePage })));
const StudyMessagesPage = lazy(() => import("@/pages/study/MessagesPage").then(m => ({ default: m.StudyMessagesPage })));
const ConversationPage  = lazy(() => import("@/pages/study/ConversationPage").then(m => ({ default: m.ConversationPage })));
const MyCoursesPage     = lazy(() => import("@/pages/study/MyCoursesPage").then(m => ({ default: m.MyCoursesPage })));

// Rent
const RentOverviewPage        = lazy(() => import("@/pages/rent/RentOverviewPage").then(m => ({ default: m.RentOverviewPage })));
const RentNewPage             = lazy(() => import("@/pages/rent/RentNewPage").then(m => ({ default: m.RentNewPage })));
const RentAgreementDetailPage = lazy(() => import("@/pages/rent/RentAgreementDetailPage").then(m => ({ default: m.RentAgreementDetailPage })));
const RentPaymentDetailPage   = lazy(() => import("@/pages/rent/RentPaymentDetailPage").then(m => ({ default: m.RentPaymentDetailPage })));

// Household
const HouseholdIndexPage     = lazy(() => import("@/pages/household/HouseholdIndexPage").then(m => ({ default: m.HouseholdIndexPage })));
const HouseholdNewPage       = lazy(() => import("@/pages/household/HouseholdNewPage").then(m => ({ default: m.HouseholdNewPage })));
const HouseholdJoinPage      = lazy(() => import("@/pages/household/HouseholdJoinPage").then(m => ({ default: m.HouseholdJoinPage })));
const HouseholdDashboardPage = lazy(() => import("@/pages/household/HouseholdDashboardPage").then(m => ({ default: m.HouseholdDashboardPage })));
const ExpensesListPage       = lazy(() => import("@/pages/household/ExpensesListPage").then(m => ({ default: m.ExpensesListPage })));
const ExpenseNewPage         = lazy(() => import("@/pages/household/ExpenseNewPage").then(m => ({ default: m.ExpenseNewPage })));
const ExpenseDetailPage      = lazy(() => import("@/pages/household/ExpenseDetailPage").then(m => ({ default: m.ExpenseDetailPage })));
const SettleUpPage           = lazy(() => import("@/pages/household/SettleUpPage").then(m => ({ default: m.SettleUpPage })));
const SettlementNewPage      = lazy(() => import("@/pages/household/SettlementNewPage").then(m => ({ default: m.SettlementNewPage })));
const MembersPage            = lazy(() => import("@/pages/household/MembersPage").then(m => ({ default: m.MembersPage })));
const HouseholdSettingsPage  = lazy(() => import("@/pages/household/HouseholdSettingsPage").then(m => ({ default: m.HouseholdSettingsPage })));

// Documents
const DocumentsListPage    = lazy(() => import("@/pages/documents/DocumentsListPage").then(m => ({ default: m.DocumentsListPage })));
const DocumentNewPage      = lazy(() => import("@/pages/documents/DocumentNewPage").then(m => ({ default: m.DocumentNewPage })));
const DocumentViewerPage   = lazy(() => import("@/pages/documents/DocumentViewerPage").then(m => ({ default: m.DocumentViewerPage })));
const DocumentEditPage     = lazy(() => import("@/pages/documents/DocumentEditPage").then(m => ({ default: m.DocumentEditPage })));
const DocumentsExpiringPage= lazy(() => import("@/pages/documents/DocumentsExpiringPage").then(m => ({ default: m.DocumentsExpiringPage })));
const DocumentsTrashPage   = lazy(() => import("@/pages/documents/DocumentsTrashPage").then(m => ({ default: m.DocumentsTrashPage })));
const DocumentSearchPage   = lazy(() => import("@/pages/documents/DocumentSearchPage").then(m => ({ default: m.DocumentSearchPage })));

// Tools
const BillsCalculatorPage = lazy(() => import("@/pages/tools/BillsCalculatorPage").then(m => ({ default: m.BillsCalculatorPage })));
const OutagesPage         = lazy(() => import("@/pages/tools/OutagesPage").then(m => ({ default: m.OutagesPage })));
const OutageDetailPage    = lazy(() => import("@/pages/tools/OutageDetailPage").then(m => ({ default: m.OutageDetailPage })));
const BusesPage           = lazy(() => import("@/pages/tools/BusesPage").then(m => ({ default: m.BusesPage })));
const BusRouteDetailPage  = lazy(() => import("@/pages/tools/BusRouteDetailPage").then(m => ({ default: m.BusRouteDetailPage })));
const BusStopPage         = lazy(() => import("@/pages/tools/BusStopPage").then(m => ({ default: m.BusStopPage })));
const GarbagePage         = lazy(() => import("@/pages/tools/GarbagePage").then(m => ({ default: m.GarbagePage })));

// Help
const HelpLandingPage  = lazy(() => import("@/pages/help/HelpLandingPage").then(m => ({ default: m.HelpLandingPage })));
const HelpSearchPage   = lazy(() => import("@/pages/help/HelpSearchPage").then(m => ({ default: m.HelpSearchPage })));
const HelpCategoryPage = lazy(() => import("@/pages/help/HelpCategoryPage").then(m => ({ default: m.HelpCategoryPage })));
const HelpArticlePage  = lazy(() => import("@/pages/help/HelpArticlePage").then(m => ({ default: m.HelpArticlePage })));
const ContactFormPage  = lazy(() => import("@/pages/help/ContactFormPage").then(m => ({ default: m.ContactFormPage })));
const MyTicketsPage    = lazy(() => import("@/pages/help/MyTicketsPage").then(m => ({ default: m.MyTicketsPage })));
const TicketDetailPage = lazy(() => import("@/pages/help/TicketDetailPage").then(m => ({ default: m.TicketDetailPage })));

// ── Route guards ─────────────────────────────────────────────────────────────

function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function OnboardingProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (supabase && !user) return <Navigate to="/auth" replace />;
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { isComplete } = useOnboarding();
  const { dataLoading } = useData();

  if (loading) return null;
  if (supabase && !user) return <Navigate to="/auth" replace />;

  // Wait for profile data before deciding — prevents flashing onboarding for existing users
  if (!isComplete && dataLoading) return null;

  if (!isComplete) return <Navigate to="/onboarding/welcome" replace />;

  return (
    <SearchProvider>
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
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

        {/* Onboarding — auth-gated but no AppShell */}
        <Route element={<OnboardingProtectedLayout />}>
          <Route path="/onboarding/welcome" element={<WelcomeSplash />} />
          <Route path="/onboarding/intro" element={<IntroSlides />} />
          <Route path="/onboarding/user-type" element={<UserTypeSelection />} />
          <Route path="/onboarding/student" element={<StudentPersonalization />} />
          <Route path="/onboarding/landlord" element={<LandlordPersonalization />} />
          <Route path="/onboarding/complete" element={<CompletionScreen />} />
        </Route>

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
          <Route path="/tools" element={<ToolsPage />} />
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
<Route path="/tools/buses/route/:routeId" element={<BusRouteDetailPage />} />
          <Route path="/tools/buses/stop/:stopId" element={<BusStopPage />} />
          <Route path="/tools/garbage" element={<GarbagePage />} />
          <Route path="/profile/help" element={<HelpLandingPage />} />
          <Route path="/profile/help/search" element={<HelpSearchPage />} />
          <Route path="/profile/help/category/:slug" element={<HelpCategoryPage />} />
          <Route path="/profile/help/article/:slug" element={<HelpArticlePage />} />
          <Route path="/profile/help/contact" element={<ContactFormPage />} />
          <Route path="/profile/help/my-tickets" element={<MyTicketsPage />} />
          <Route path="/profile/help/my-tickets/:id" element={<TicketDetailPage />} />
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
