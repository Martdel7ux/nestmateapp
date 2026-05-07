import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Home,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users2,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { formatCompactNumber } from "@/lib/utils";

type Tab = "overview" | "properties" | "flatmates" | "verifications" | "users";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",      label: "Overview",      icon: LayoutDashboard },
  { id: "properties",    label: "Properties",    icon: Home },
  { id: "flatmates",     label: "Flatmates",     icon: Users2 },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "users",         label: "Users",         icon: UserRound },
];

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <Badge className={approved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
      {approved ? "Approved" : "Pending"}
    </Badge>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  const { snapshot } = useData();
  const pendingProperties = snapshot.featuredProperties.filter((p) => !p.is_approved).length;
  const pendingFlatmates = snapshot.flatmates.filter((f) => !f.is_approved).length;
  const pendingVerifications = snapshot.verifications.filter((v) => v.verification_status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total users",     value: formatCompactNumber(snapshot.stats.totalUsers),     icon: Users2 },
          { label: "Properties",      value: formatCompactNumber(snapshot.stats.totalProperties), icon: Home },
          { label: "Matches",         value: formatCompactNumber(snapshot.stats.totalMatches),    icon: ShieldCheck },
          { label: "Active listings", value: formatCompactNumber(snapshot.stats.activeListings),  icon: CheckCircle2 },
        ].map((item) => (
          <Card key={item.label} className="space-y-2 p-4">
            <item.icon className="text-primary" size={20} />
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-3xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending properties",    count: pendingProperties,    color: "text-amber-600",  bg: "bg-amber-500/10" },
          { label: "Pending flatmates",     count: pendingFlatmates,     color: "text-amber-600",  bg: "bg-amber-500/10" },
          { label: "Pending verifications", count: pendingVerifications, color: "text-sky-600",    bg: "bg-sky-500/10" },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-4 p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
              <AlertTriangle size={20} className={item.color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Properties ────────────────────────────────────────────────────────────────

function PropertiesTab() {
  const { snapshot, approveProperty, deleteProperty } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visible = snapshot.featuredProperties.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !p.is_approved) ||
      (filter === "approved" && p.is_approved);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-2xl border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search by title or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No properties found.</p>
        )}
        {visible.map((property) => (
          <Card key={property.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{property.title}</p>
                  <StatusBadge approved={property.is_approved} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {property.city} · €{property.rent_price}/mo · {property.bedrooms} bed
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Owner: {property.owner?.full_name ?? property.owner_id}
                </p>
              </div>
              {property.image_urls?.[0] && (
                <img
                  src={property.image_urls[0]}
                  alt=""
                  className="h-16 w-20 rounded-xl object-cover flex-shrink-0"
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!property.is_approved ? (
                <Button size="sm" onClick={() => approveProperty(property.id, true)}>
                  <CheckCircle2 size={14} /> Approve
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => approveProperty(property.id, false)}>
                  <XCircle size={14} /> Unapprove
                </Button>
              )}
              {deletingId === property.id ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50"
                    onClick={() => { deleteProperty(property.id); setDeletingId(null); }}
                  >
                    <Trash2 size={14} /> Confirm Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeletingId(property.id)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Flatmates ─────────────────────────────────────────────────────────────────

function FlatematesTab() {
  const { snapshot, approveFlatmate, adminDeleteFlatmate } = useData();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visible = snapshot.flatmates.filter(
    (f) =>
      !search ||
      f.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.preferred_city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-2xl border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No listings found.</p>
        )}
        {visible.map((flatmate) => (
          <Card key={flatmate.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{flatmate.profile?.full_name ?? "Unknown"}</p>
                  <StatusBadge approved={flatmate.is_approved} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {flatmate.preferred_city} · {flatmate.housing_status === "seeking_flat" ? "Seeking flat" : "Has flat"} · {flatmate.student_type}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{flatmate.bio}</p>
              </div>
              {flatmate.profile_image_url && (
                <img
                  src={flatmate.profile_image_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {flatmate.is_approved ? (
                <Button size="sm" variant="outline" onClick={() => approveFlatmate(flatmate.id, false)}>
                  <Flag size={14} /> Unapprove
                </Button>
              ) : (
                <Button size="sm" onClick={() => approveFlatmate(flatmate.id, true)}>
                  <CheckCircle2 size={14} /> Approve
                </Button>
              )}
              {deletingId === flatmate.id ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50"
                    onClick={() => { adminDeleteFlatmate(flatmate.id); setDeletingId(null); }}
                  >
                    <Trash2 size={14} /> Confirm Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeletingId(flatmate.id)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Verifications ─────────────────────────────────────────────────────────────

function VerificationsTab() {
  const { snapshot, approveVerification, rejectVerification } = useData();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const handleReject = (landlordId: string) => {
    rejectVerification(landlordId, rejectReason || "Documents did not meet requirements.");
    setRejectingId(null);
    setRejectReason("");
  };

  const visible = snapshot.verifications.filter(
    (v) => filter === "all" || v.verification_status === filter
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "" : filter} verification requests.
        </p>
      )}

      {visible.map((verif) => (
        <Card key={verif.id} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{verif.profile?.full_name ?? "Landlord"}</p>
              <p className="text-sm text-muted-foreground">
                {verif.profile?.city} · Submitted {new Date(verif.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge
              className={
                verif.verification_status === "approved"
                  ? "bg-sky-500/10 text-sky-600"
                  : verif.verification_status === "rejected"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-600"
              }
            >
              {verif.verification_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">ID Card</p>
              <img
                src={verif.id_document_url}
                alt="ID document"
                className="h-28 w-full rounded-xl object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Selfie</p>
              <img
                src={verif.selfie_url}
                alt="Selfie"
                className="h-28 w-full rounded-xl object-cover"
              />
            </div>
          </div>

          {verif.admin_notes && (
            <p className="text-sm text-destructive">Rejection reason: {verif.admin_notes}</p>
          )}

          {verif.verification_status === "pending" && (
            <>
              {rejectingId === verif.landlord_id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleReject(verif.landlord_id)}
                    >
                      <XCircle size={14} /> Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveVerification(verif.landlord_id)}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(verif.landlord_id)}>
                    <XCircle size={14} /> Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Users ─────────────────────────────────────────────────────────────────────

function UsersTab() {
  const { allProfiles, snapshot, adminDeleteAccount } = useData();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Merge allProfiles (from Supabase) with profiles embedded in mock data
  const mockProfiles: typeof allProfiles = [];
  snapshot.featuredProperties.forEach((p) => { if (p.owner) mockProfiles.push(p.owner); });
  snapshot.flatmates.forEach((f) => { if (f.profile) mockProfiles.push(f.profile); });
  const seenIds = new Set<string>();
  const combined = [...allProfiles, ...mockProfiles].filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  const visible = combined.filter(
    (p) =>
      !search ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-2xl border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
        )}
        {visible.map((profile) => (
          <Card key={profile.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted flex-shrink-0">
                    <UserRound size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{profile.full_name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">{profile.user_type}</span>
                    {profile.city && <span className="text-xs text-muted-foreground">· {profile.city}</span>}
                    {profile.is_verified_landlord && (
                      <span className="flex items-center gap-0.5 text-xs text-sky-600">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {deletingId === profile.id ? (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50"
                    onClick={() => { void adminDeleteAccount(profile.id); setDeletingId(null); }}
                  >
                    <Trash2 size={14} /> Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive flex-shrink-0"
                  onClick={() => setDeletingId(profile.id)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Root panel ────────────────────────────────────────────────────────────────

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview"      && <OverviewTab />}
      {activeTab === "properties"    && <PropertiesTab />}
      {activeTab === "flatmates"     && <FlatematesTab />}
      {activeTab === "verifications" && <VerificationsTab />}
      {activeTab === "users"         && <UsersTab />}
    </div>
  );
}
