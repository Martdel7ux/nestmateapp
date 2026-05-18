export interface FeatureEntry {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: string;
  href: string;
}

export const FEATURE_INDEX: FeatureEntry[] = [
  { id: "feature:add-expense",        title: "Add an expense",            subtitle: "Split a bill with your household",              keywords: ["split", "bill", "expense", "money", "owe", "utilities", "groceries", "share"],     icon: "Wallet",       href: "/household" },
  { id: "feature:settle-up",          title: "Settle up",                 subtitle: "Pay back what you owe",                        keywords: ["settle", "pay", "owe", "debt", "balance", "repay"],                               icon: "HandCoins",    href: "/household" },
  { id: "feature:find-flatmate",      title: "Find a flatmate",           subtitle: "Browse people looking for a flat",             keywords: ["flatmate", "roommate", "housemate", "share", "looking"],                          icon: "Users",        href: "/flatmates" },
  { id: "feature:rent-reminders",     title: "Rent reminders",            subtitle: "Track rent and get notified before due dates",  keywords: ["rent", "reminder", "due", "monthly", "landlord", "payment"],                      icon: "Calendar",     href: "/rent" },
  { id: "feature:new-rent-agreement", title: "Add rent agreement",        subtitle: "Set up a new rental contract",                 keywords: ["rent", "agreement", "contract", "lease", "add", "new"],                           icon: "FileSignature",href: "/rent/new" },
  { id: "feature:upload-document",    title: "Upload a document",         subtitle: "Store leases, IDs, receipts",                  keywords: ["document", "upload", "lease", "id", "receipt", "pdf", "file", "store"],           icon: "FileUp",       href: "/documents/new" },
  { id: "feature:my-documents",       title: "My documents",              subtitle: "See all your saved documents",                 keywords: ["document", "file", "pdf", "lease", "id", "saved"],                                icon: "FileText",     href: "/documents" },
  { id: "feature:expiring-documents", title: "Expiring documents",        subtitle: "Documents that expire soon",                   keywords: ["document", "expiry", "expire", "soon", "visa", "passport"],                       icon: "AlertCircle",  href: "/documents/expiring" },
  { id: "feature:study-notes",        title: "My study notes",            subtitle: "Your personal note library",                   keywords: ["notes", "study", "class", "lecture", "personal"],                                 icon: "BookOpen",     href: "/study" },
  { id: "feature:new-note",           title: "Create a new note",         subtitle: "Write a note for a class or topic",            keywords: ["note", "new", "write", "create", "study"],                                        icon: "PenLine",      href: "/study/notes/new" },
  { id: "feature:study-library",      title: "Public notes library",      subtitle: "Notes shared by other students",               keywords: ["notes", "library", "shared", "public", "study", "browse"],                        icon: "Library",      href: "/study/library" },
  { id: "feature:study-peers",        title: "Find study peers",          subtitle: "Connect with students in your courses",        keywords: ["peers", "mentor", "tutor", "help", "study", "connect", "students"],               icon: "GraduationCap",href: "/study/peers" },
  { id: "feature:study-groups",       title: "Study groups",              subtitle: "Join or create a study group",                 keywords: ["group", "study", "team", "join", "create", "collaborate"],                        icon: "Users2",       href: "/study/groups" },
  { id: "feature:events",             title: "Discover events",           subtitle: "Events, jobs, internships, volunteering",      keywords: ["events", "jobs", "internship", "volunteer", "opportunity", "discover"],           icon: "Compass",      href: "/discover" },
  { id: "feature:saved-events",       title: "My saved events",           subtitle: "Events you bookmarked",                        keywords: ["saved", "favorite", "bookmark", "events"],                                        icon: "Heart",        href: "/discover/saved" },
  { id: "feature:properties",         title: "Browse properties",         subtitle: "Find a flat or room to rent",                  keywords: ["property", "flat", "room", "rent", "browse", "apartment", "accommodation"],      icon: "Home",         href: "/properties" },
  { id: "feature:bills-calculator",   title: "Bills calculator",          subtitle: "Estimate your monthly Cyprus utility costs",   keywords: ["bills", "calculator", "estimate", "eac", "electricity", "summer", "water", "internet"], icon: "Calculator", href: "/tools/bills-calculator" },
  { id: "feature:bus-routes",         title: "University bus routes",     subtitle: "Get to UNIC, UCY, CUT, EUC by bus",           keywords: ["bus", "route", "transport", "unic", "ucy", "cut", "euc", "public"],               icon: "Bus",          href: "/tools/buses" },
  { id: "feature:garbage-schedule",   title: "Garbage day schedule",      subtitle: "When to put bins out in your area",            keywords: ["garbage", "trash", "bins", "recycling", "collection", "waste"],                   icon: "Trash2",       href: "/tools/garbage" },
  { id: "feature:eac-outages",        title: "Power outage alerts",       subtitle: "EAC scheduled outages in your district",       keywords: ["power", "outage", "eac", "electricity", "blackout", "cut"],                      icon: "Zap",          href: "/tools/outages" },
  { id: "feature:messages",           title: "Messages",                  subtitle: "Chat with flatmates and landlords",            keywords: ["messages", "chat", "conversation", "talk", "reply"],                              icon: "MessageCircle",href: "/messages" },
  { id: "feature:ai-assistant",       title: "Ask NestmateAI",            subtitle: "Get instant help from our AI",                 keywords: ["ai", "assistant", "help", "ask", "question", "smart"],                           icon: "Sparkles",     href: "/assistant" },
  { id: "feature:profile",            title: "Profile & settings",        subtitle: "Edit your profile, theme, notifications",      keywords: ["profile", "settings", "account", "theme", "dark", "light", "edit"],              icon: "User",         href: "/profile" },
  { id: "feature:location-settings",  title: "Update my location",        subtitle: "Change your city or neighbourhood",            keywords: ["location", "city", "area", "move", "address", "change"],                         icon: "MapPin",       href: "/profile/settings/location" },
  { id: "feature:household",          title: "My household",              subtitle: "Manage your shared home and expenses",         keywords: ["household", "home", "shared", "flatmates", "expenses", "manage"],                 icon: "Home",         href: "/household" },
];
