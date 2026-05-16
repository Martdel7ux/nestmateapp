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
  // ── Navigation ──
  navHome:        { en: "Home",       el: "Αρχική" },
  navFlatmates:   { en: "Flatmates",  el: "Συγκάτοικοι" },
  navDiscover:    { en: "Discover",   el: "Ανακάλυψε" },
  navStudy:       { en: "Study",      el: "Σπουδές" },
  navProperties:  { en: "Properties", el: "Ακίνητα" },
  navMessages:    { en: "Messages",   el: "Μηνύματα" },
  navProfile:     { en: "Profile",    el: "Προφίλ" },

  // ── Home page ──
  homeGoodMorning:    { en: "Good morning",   el: "Καλημέρα" },
  homeGoodAfternoon:  { en: "Good afternoon", el: "Καλό απόγευμα" },
  homeGoodEvening:    { en: "Good evening",   el: "Καλό βράδυ" },
  homeHello:          { en: "Hello, {name}",  el: "Γεια, {name}" },
  homeHeroLine1:      { en: "Explore Modern Student", el: "Εξερεύνησε Σύγχρονα Φοιτητικά" },
  homeHeroLine2:      { en: "Homes Near You",         el: "Σπίτια Κοντά Σου" },
  homeSearchPlaceholder: { en: "Search city or property…", el: "Αναζήτηση πόλης ή ακινήτου…" },
  homeSeeDetails:     { en: "See Property Details", el: "Δες Λεπτομέρειες" },
  homeDiscover:       { en: "Discover",    el: "Ανακάλυψε" },
  homeFindFlatmates:  { en: "Find Flatmates", el: "Βρες Συγκάτοικο" },
  homePoweredByAI:    { en: "Powered by Nestmate AI", el: "Με τεχνολογία Nestmate AI" },
  homeAIAssistant:    { en: "AI Assistant",  el: "AI Βοηθός" },
  homeTopProperty:    { en: "Top Property",  el: "Κορυφαία Ακίνητα" },
  homeViewAll:        { en: "View All",      el: "Δες Όλα" },
  homeNoProperties:   { en: "No properties match your search.", el: "Δεν βρέθηκαν ακίνητα." },
  homeReviews:        { en: "reviews",   el: "κριτικές" },
  homePerMonth:       { en: "/mo",       el: "/μήνα" },
  homeCategoryAll:    { en: "All",       el: "Όλα" },

  // ── Filter panel ──
  filterTitle:        { en: "Filters",        el: "Φίλτρα" },
  filterClearAll:     { en: "Clear all",      el: "Καθαρισμός" },
  filterBedrooms:     { en: "Bedrooms",       el: "Υπνοδωμάτια" },
  filterBathrooms:    { en: "Bathrooms",      el: "Μπάνια" },
  filterPriceRange:   { en: "Price range (€/mo)", el: "Εύρος τιμής (€/μήνα)" },
  filterMinPrice:     { en: "Min price",      el: "Ελάχ. τιμή" },
  filterMaxPrice:     { en: "Max price",      el: "Μέγ. τιμή" },
  filterCity:         { en: "City",           el: "Πόλη" },
  filterArea:         { en: "Area in {city}", el: "Περιοχή σε {city}" },
  filterClearAreas:   { en: "Clear areas",    el: "Καθαρισμός περιοχών" },
  filterAllAreas:     { en: "All areas of {city} — tap to narrow down", el: "Όλες οι περιοχές σε {city} — πατήστε για φίλτρο" },
  filterAny:          { en: "Any",            el: "Όλα" },
  filterShowResults:  { en: "Show Results",   el: "Εμφάνιση Αποτελεσμάτων" },

  // ── Flatmates page ──
  flatmatesTitle:       { en: "Find a Flatmate", el: "Βρες Συγκάτοικο" },
  flatmatesSubtitle:    { en: "Tell us about yourself first — then you can start browsing potential flatmates.", el: "Πες μας πρώτα για σένα — μετά θα μπορείς να δεις άλλους." },
  flatmatesFilter:      { en: "Filter",     el: "Φίλτρο" },
  flatmatesAllCities:   { en: "All cities", el: "Όλες οι πόλεις" },
  flatmatesAllTypes:    { en: "All student types", el: "Όλοι οι τύποι" },
  flatmatesErasmus:     { en: "Erasmus / short-term", el: "Erasmus / βραχυπρόθεσμος" },
  flatmatesFullTime:    { en: "Full-time",  el: "Κανονικός φοιτητής" },
  flatmatesMinBudget:   { en: "Min budget (€)", el: "Ελάχ. προϋπολογισμός (€)" },
  flatmatesMaxBudget:   { en: "Max budget (€)", el: "Μέγ. προϋπολογισμός (€)" },

  // ── Flatmate form ──
  formYourProfile:       { en: "Your Profile",         el: "Το Προφίλ Σου" },
  formAddPhoto:          { en: "Add Photo",             el: "Πρόσθεσε Φωτογραφία" },
  formAboutYou:          { en: "About You",             el: "Σχετικά με σένα" },
  formBioLabel:          { en: "Bio",                   el: "Βιογραφικό" },
  formBioPlaceholder:    { en: "Tell potential flatmates about yourself…", el: "Πες στους υποψήφιους συγκατοίκους για σένα…" },
  formCountry:           { en: "Country of origin",     el: "Χώρα καταγωγής" },
  formSelectCountry:     { en: "Select country",        el: "Επίλεξε χώρα" },
  formLanguage:          { en: "Primary language",      el: "Κύρια γλώσσα" },
  formSelectLanguage:    { en: "Select language",       el: "Επίλεξε γλώσσα" },
  formStudentType:       { en: "Student type",          el: "Τύπος φοιτητή" },
  formErasmus:           { en: "Erasmus / Exchange",    el: "Erasmus / Ανταλλαγή" },
  formFullTime:          { en: "Full-time student",     el: "Κανονικός φοιτητής" },
  formPreferences:       { en: "Preferences",           el: "Προτιμήσεις" },
  formPets:              { en: "Pets",                  el: "Κατοικίδια" },
  formPetLove:           { en: "Love them 🐾",          el: "Τα λατρεύω 🐾" },
  formPetOkay:           { en: "Okay with pets",        el: "Δεν με πειράζει" },
  formPetNeutral:        { en: "Neutral",               el: "Ουδέτερος" },
  formPetNo:             { en: "No pets please",        el: "Όχι κατοικίδια" },
  formBudget:            { en: "Budget",                el: "Προϋπολογισμός" },
  formMinBudget:         { en: "Min budget (€/mo)",     el: "Ελάχ. (€/μήνα)" },
  formMaxBudget:         { en: "Max budget (€/mo)",     el: "Μέγ. (€/μήνα)" },
  formPreferredCity:     { en: "Preferred city",        el: "Προτιμώμενη πόλη" },
  formHaveFlat:          { en: "I have a flat",         el: "Έχω διαμέρισμα" },
  formHaveFlatDesc:      { en: "I'm a tenant looking for a flatmate to share with", el: "Έχω σπίτι και ψάχνω συγκάτοικο" },
  formNoFlatDesc:        { en: "I'm looking for a flat and flatmates", el: "Ψάχνω σπίτι και συγκάτοικους" },
  formFlatDetails:       { en: "Your Flat Details",     el: "Στοιχεία Διαμερίσματος" },
  formFlatCity:          { en: "Flat city",             el: "Πόλη διαμερίσματος" },
  formFlatPrice:         { en: "Rent per person (€/mo)", el: "Ενοίκιο ανά άτομο (€/μήνα)" },
  formFlatPricePlaceholder: { en: "e.g. 350",           el: "π.χ. 350" },
  formFlatDescription:   { en: "Flat description",      el: "Περιγραφή διαμερίσματος" },
  formFlatDescPlaceholder: { en: "Describe your flat…", el: "Περίγραψε το διαμέρισμά σου…" },
  formFlatFeatures:      { en: "Flat features",         el: "Χαρακτηριστικά" },
  formFlatPhotos:        { en: "Flat Photos",           el: "Φωτογραφίες Διαμερίσματος" },
  formAddPhotos:         { en: "Add photos",            el: "Πρόσθεσε φωτογραφίες" },
  formSubmit:            { en: "Create Listing",        el: "Δημιουργία Αγγελίας" },
  formRequired:          { en: "This field is required", el: "Αυτό το πεδίο είναι υποχρεωτικό" },
  formBioRequired:       { en: "Please write a short bio", el: "Γράψε μια σύντομη περιγραφή" },
  formCountryRequired:   { en: "Please select your country", el: "Επίλεξε χώρα καταγωγής" },
  formLanguageRequired:  { en: "Please select your primary language", el: "Επίλεξε κύρια γλώσσα" },
  formBudgetRequired:    { en: "Please enter your budget range", el: "Εισάγετε το εύρος προϋπολογισμού" },
  formFlatPriceRequired: { en: "Please enter the rent price", el: "Εισάγετε το ενοίκιο" },

  // ── Messages page ──
  messagesTitle:     { en: "Messages",    el: "Μηνύματα" },
  messagesEmpty:     { en: "Your messages will appear here", el: "Τα μηνύματά σου θα εμφανιστούν εδώ" },
  messagesEmptyDesc: { en: "Once you match with someone, you can start a conversation with them here.", el: "Μόλις ταιριάξεις με κάποιον, μπορείτε να ξεκινήσετε συνομιλία εδώ." },
  messagesSayHello:  { en: "Say hello 👋", el: "Πες γεια 👋" },
  messagesFlatmate:  { en: "Flatmate",    el: "Συγκάτοικος" },

  // ── Notifications page ──
  notificationsTitle:    { en: "Notifications",  el: "Ειδοποιήσεις" },
  notificationsUnread:   { en: "{n} unread",     el: "{n} αδιάβαστες" },
  notificationsMarkRead: { en: "Mark all read",  el: "Επισήμανση ως διαβασμένα" },
  notificationsEmpty:    { en: "No notifications yet", el: "Δεν υπάρχουν ειδοποιήσεις" },
  notificationsEmptyDesc:{ en: "When someone matches with you or sends a message, it'll show up here.", el: "Όταν κάποιος σε ταιριάξει ή σου στείλει μήνυμα, θα εμφανιστεί εδώ." },
  notificationsJustNow:  { en: "Just now",     el: "Μόλις τώρα" },
  notificationsMAgo:     { en: "{n}m ago",     el: "πριν {n}λ" },
  notificationsHAgo:     { en: "{n}h ago",     el: "πριν {n}ω" },
  notificationsYesterday:{ en: "Yesterday",    el: "Χθες" },
  notificationsDAgo:     { en: "{n}d ago",     el: "πριν {n}μ" },

  // ── Profile page ──
  profileEditBtn:        { en: "Edit profile",      el: "Επεξεργασία" },
  profileCancelBtn:      { en: "Cancel editing",    el: "Ακύρωση" },
  profileEditTitle:      { en: "Edit Profile",      el: "Επεξεργασία Προφίλ" },
  profileFullName:       { en: "Full name",         el: "Πλήρες όνομα" },
  profileFullNamePh:     { en: "Your full name",    el: "Το πλήρες όνομά σου" },
  profileBio:            { en: "Bio",               el: "Βιογραφικό" },
  profileBioPh:          { en: "Tell others about yourself…", el: "Πες στους άλλους για σένα…" },
  profileUniversity:     { en: "University",        el: "Πανεπιστήμιο" },
  profileUniversityPh:   { en: "Your university",   el: "Το πανεπιστήμιό σου" },
  profileCity:           { en: "City",              el: "Πόλη" },
  profileAccountType:    { en: "Account type",      el: "Τύπος λογαριασμού" },
  profileSaving:         { en: "Saving…",           el: "Αποθήκευση…" },
  profileSaveChanges:    { en: "Save changes",      el: "Αποθήκευση αλλαγών" },
  profileChooseAvatar:   { en: "Choose your avatar", el: "Επίλεξε εικονίδιο" },
  profileUploadPhoto:    { en: "Upload your own photo", el: "Ανέβασε δική σου φωτογραφία" },
  profileVerifiedLandlord: { en: "Verified Landlord", el: "Επαληθευμένος Ιδιοκτήτης" },
  profileSavedProperties:  { en: "Saved Properties", el: "Αποθηκευμένα Ακίνητα" },
  profileChangePassword: { en: "Change Password",   el: "Αλλαγή Κωδικού" },
  profileNewPwPh:        { en: "New password (min 6 chars)", el: "Νέος κωδικός (τουλ. 6 χαρακτήρες)" },
  profileConfirmPwPh:    { en: "Confirm new password", el: "Επιβεβαίωση νέου κωδικού" },
  profileUpdatePw:       { en: "Update password",   el: "Ενημέρωση κωδικού" },
  profileSignOut:        { en: "Sign Out",          el: "Αποσύνδεση" },
  profileDeleteAccount:  { en: "Delete Account",    el: "Διαγραφή Λογαριασμού" },
  profileDeleteTitle:    { en: "Delete account?",   el: "Διαγραφή λογαριασμού;" },
  profileDeleteDesc:     { en: "This will permanently delete your profile, listings, and all data. This cannot be undone.", el: "Αυτό θα διαγράψει μόνιμα το προφίλ, τις αγγελίες και όλα τα δεδομένα σου." },
  profileCancel:         { en: "Cancel",            el: "Ακύρωση" },
  profileYesDelete:      { en: "Yes, delete",       el: "Ναι, διαγραφή" },
  profileNotSet:         { en: "Not set",           el: "Δεν έχει οριστεί" },

  // ── Settings ──
  settingsLanguage: { en: "Language", el: "Γλώσσα" },

  // ── Auth page ──
  authWelcomeBack:     { en: "Welcome back!",            el: "Καλώς ήρθες!" },
  authSignInFailed:    { en: "Sign in failed",           el: "Αποτυχία σύνδεσης" },
  authEmailLabel:      { en: "Email address",            el: "Διεύθυνση email" },
  authEmailPh:         { en: "you@email.com",            el: "εσείς@email.com" },
  authPasswordLabel:   { en: "Password",                 el: "Κωδικός" },
  authPasswordPh:      { en: "Your password",            el: "Ο κωδικός σου" },
  authSignIn:          { en: "Sign in",                  el: "Σύνδεση" },
  authSignUp:          { en: "Sign up",                  el: "Εγγραφή" },
  authForgotPassword:  { en: "Forgot password?",         el: "Ξέχασες τον κωδικό;" },
  authNoAccount:       { en: "Don't have an account?",   el: "Δεν έχεις λογαριασμό;" },
  authHaveAccount:     { en: "Already have an account?", el: "Έχεις ήδη λογαριασμό;" },
  authFullName:        { en: "Full name",                el: "Πλήρες όνομα" },
  authFullNamePh:      { en: "Your full name",           el: "Το πλήρες όνομά σου" },
  authIAm:             { en: "I am a…",                 el: "Είμαι…" },
  authStudent:         { en: "Student",                  el: "Φοιτητής" },
  authLandlord:        { en: "Landlord",                 el: "Ιδιοκτήτης" },
  authConfirmPassword: { en: "Confirm password",         el: "Επιβεβαίωση κωδικού" },
  authConfirmPwPh:     { en: "Repeat your password",     el: "Επανέλαβε τον κωδικό" },
  authResetTitle:      { en: "Reset password",           el: "Επαναφορά κωδικού" },
  authResetDesc:       { en: "Enter your email and we'll send a reset link.", el: "Εισάγετε το email σας και θα σας στείλουμε σύνδεσμο επαναφοράς." },
  authSendReset:       { en: "Send reset link",          el: "Αποστολή συνδέσμου" },
  authBackToSignIn:    { en: "Back to sign in",          el: "Επιστροφή στη σύνδεση" },
  authOrContinueWith:  { en: "or continue with",         el: "ή συνέχεια με" },
  authContinueGoogle:  { en: "Continue with Google",     el: "Συνέχεια με Google" },
  authEmailError:      { en: "Enter a valid email address", el: "Εισάγετε έγκυρη διεύθυνση email" },
  authPasswordError:   { en: "Password is required",     el: "Ο κωδικός είναι υποχρεωτικός" },
  authPasswordShort:   { en: "Password must be at least 6 characters", el: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες" },
  authNameError:       { en: "Please enter your full name", el: "Εισάγετε το πλήρες όνομά σας" },
  authPasswordMatch:   { en: "Passwords don't match",    el: "Οι κωδικοί δεν ταιριάζουν" },
  authConfirmPwError:  { en: "Please confirm your password", el: "Επιβεβαιώστε τον κωδικό σας" },
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof dictionary, params?: Record<string, string | number>) => string;
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
      t: (key: keyof typeof dictionary, params?: Record<string, string | number>) => {
        let str = dictionary[key]?.[language] ?? key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return str;
      },
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
