import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Home,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users2,
  XCircle,
  X,
  Zap,
} from "lucide-react";
import { EventsAdminTab } from "@/components/features/admin/events/EventsAdminTab";
import { OutagesAdminTab } from "@/components/features/admin/OutagesAdminTab";
import { BusRoutesAdminTab } from "@/components/features/admin/BusRoutesAdminTab";
import { GarbageAdminTab } from "@/components/features/admin/GarbageAdminTab";
import { CyprusAreasAdminTab } from "@/components/features/admin/CyprusAreasAdminTab";
import type { Property } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { formatCompactNumber } from "@/lib/utils";

type Tab = "overview" | "properties" | "flatmates" | "verifications" | "users" | "events" | "outages" | "buses" | "garbage" | "areas";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",      label: "Overview",      icon: LayoutDashboard },
  { id: "properties",    label: "Properties",    icon: Home },
  { id: "flatmates",     label: "Flatmates",     icon: Users2 },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "users",         label: "Users",         icon: UserRound },
  { id: "events",        label: "Events",        icon: CalendarDays },
  { id: "outages",       label: "Outages",       icon: Zap },
  { id: "buses",         label: "Buses",         icon: Bus },
  { id: "garbage",       label: "Garbage",       icon: Trash2 },
  { id: "areas",         label: "Areas",         icon: MapPin },
];

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <Badge className={approved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
      {approved ? "Approved" : "Pending"}
    </Badge>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
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
          { label: "Pending properties",    count: pendingProperties,    color: "text-amber-600", bg: "bg-amber-500/10", tab: "properties" as Tab },
          { label: "Pending flat listings", count: pendingFlatmates,     color: "text-amber-600", bg: "bg-amber-500/10", tab: "flatmates" as Tab },
          { label: "Pending verifications", count: pendingVerifications, color: "text-sky-600",   bg: "bg-sky-500/10",   tab: "verifications" as Tab },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.tab)}
            className="text-left w-full"
          >
          <Card className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 ${item.count > 0 ? "ring-1 ring-amber-400/30" : ""}`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
              <AlertTriangle size={20} className={item.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
            {item.count > 0 && <span className="text-xs text-muted-foreground shrink-0">Review →</span>}
          </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Property detail modal ─────────────────────────────────────────────────────

function PropertyDetailModal({ property, onClose, onApprove, onDelete }: {
  property: Property;
  onClose: () => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photos = property.image_urls ?? [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[2rem] bg-background shadow-card">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <X size={15} />
        </button>

        {/* Image gallery */}
        {photos.length > 0 && (
          <div className="relative h-56 w-full overflow-hidden bg-muted">
            <img src={photos[imgIndex]} alt="" className="h-full w-full object-cover" />
            {photos.length > 1 && (
              <>
                <button onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setImgIndex((i) => Math.min(photos.length - 1, i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-5 p-5 pb-10">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">{property.title}</h2>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin size={13} />
                <span>{property.address}, {property.city}</span>
              </div>
            </div>
            <StatusBadge approved={property.is_approved} />
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: BedDouble, label: "Bedrooms", value: property.bedrooms },
              { icon: Bath,      label: "Bathrooms", value: property.bathrooms },
              { icon: Home,      label: "Rent/mo",   value: `€${property.rent_price}` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-muted/30 p-3 text-center">
                <s.icon size={16} className="mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-semibold text-sm">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {property.description && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed text-foreground">{property.description}</p>
            </div>
          )}

          {/* Owner details */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Listed by</p>

            <div className="flex items-center gap-3">
              {property.owner?.avatar_url ? (
                <img src={property.owner.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <UserRound size={18} className="text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold">{property.owner?.full_name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground capitalize">{property.owner?.user_type}</p>
              </div>
              {property.owner?.is_verified_landlord && (
                <div className="ml-auto flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600">
                  <ShieldCheck size={11} /> Verified
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-2 pt-1 border-t border-border">
              {property.phone && (
                <a href={`tel:${property.phone}`}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-sm font-medium transition hover:bg-muted">
                  <Phone size={15} className="text-primary shrink-0" />
                  <span>{property.phone}</span>
                </a>
              )}
              {property.email && (
                <a href={`mailto:${property.email}`}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-sm font-medium transition hover:bg-muted">
                  <Mail size={15} className="text-primary shrink-0" />
                  <span className="truncate">{property.email}</span>
                </a>
              )}
              {!property.phone && !property.email && (
                <p className="text-xs text-muted-foreground">No contact details provided.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!property.is_approved ? (
              <Button size="sm" onClick={() => { onApprove(); onClose(); }}>
                <CheckCircle2 size={14} /> Approve listing
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { onApprove(); onClose(); }}>
                <XCircle size={14} /> Unapprove
              </Button>
            )}

            {confirmDelete ? (
              <>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/50"
                  onClick={() => { onDelete(); onClose(); }}>
                  <Trash2 size={14} /> Confirm Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="text-destructive"
                onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Properties ────────────────────────────────────────────────────────────────

function PropertiesTab() {
  const { snapshot, approveProperty, deleteProperty } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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
      {/* Property detail modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onApprove={() => approveProperty(selectedProperty.id, !selectedProperty.is_approved)}
          onDelete={() => { deleteProperty(selectedProperty.id); setSelectedProperty(null); }}
        />
      )}

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
          <Card
            key={property.id}
            className="cursor-pointer p-4 transition-colors hover:bg-muted/30 active:scale-[0.99]"
            onClick={() => setSelectedProperty(property)}
          >
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
                  {property.phone && <span className="ml-2 text-primary">· {property.phone}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {property.image_urls?.[0] && (
                  <img src={property.image_urls[0]} alt="" className="h-16 w-20 rounded-xl object-cover" />
                )}
                <span className="text-xs text-muted-foreground">View →</span>
              </div>
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
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visible = snapshot.flatmates.filter((f) => {
    const matchesSearch =
      !search ||
      f.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.preferred_city.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !f.is_approved) ||
      (filter === "approved" && f.is_approved);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-2xl border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            {filter === "pending" ? "No pending flat listings to review." : "No listings found."}
          </p>
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
                  {flatmate.preferred_city} · {flatmate.student_type}
                </p>
                <p className="mt-0.5 text-xs font-medium">
                  {flatmate.housing_status === "has_flat"
                    ? "🏠 Student offering a flat — needs approval"
                    : "🔍 Student seeking a flat — auto-approved"}
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

// ─── User profile detail modal ─────────────────────────────────────────────────

import type { Profile } from "@/types/supabase";

function UserDetailModal({ profile, onClose, onDelete }: {
  profile: Profile;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { snapshot } = useData();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const theirProperties = snapshot.featuredProperties.filter((p) => p.owner_id === profile.id);
  const theirFlatmate = snapshot.flatmates.find((f) => f.user_id === profile.id);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 z-50 max-h-[80dvh] -translate-y-1/2 overflow-y-auto rounded-3xl bg-background p-6 shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <UserRound size={22} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-display text-xl font-bold">{profile.full_name}</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <Badge className="capitalize text-xs">{profile.user_type}</Badge>
                {profile.is_verified_landlord && (
                  <Badge className="bg-sky-500/10 text-sky-600 text-xs">
                    <ShieldCheck size={11} /> Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {profile.city && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">City</span>
              <span className="font-medium">{profile.city}</span>
            </div>
          )}
          {profile.university && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">University</span>
              <span className="font-medium">{profile.university}</span>
            </div>
          )}
          {profile.created_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
          {profile.bio && (
            <div className="pt-1">
              <p className="text-muted-foreground mb-1">Bio</p>
              <p className="rounded-2xl bg-muted/40 px-3 py-2">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Their properties */}
        {theirProperties.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties ({theirProperties.length})
            </p>
            {theirProperties.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate">{p.title}</span>
                <StatusBadge approved={p.is_approved} />
              </div>
            ))}
          </div>
        )}

        {/* Their flatmate listing */}
        {theirFlatmate && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flatmate listing</p>
            <div className="rounded-2xl bg-muted/40 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{theirFlatmate.housing_status.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span>{theirFlatmate.preferred_city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Approved</span>
                <StatusBadge approved={theirFlatmate.is_approved} />
              </div>
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="mt-6 border-t pt-4">
          {confirmDelete ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive border-destructive/50"
                onClick={onDelete}
              >
                <Trash2 size={14} /> Confirm Delete Account
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} /> Delete this account
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Users ─────────────────────────────────────────────────────────────────────

function UsersTab() {
  const { allProfiles, snapshot, adminDeleteAccount } = useData();
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

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
      {selectedProfile && (
        <UserDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onDelete={() => {
            void adminDeleteAccount(selectedProfile.id);
            setSelectedProfile(null);
          }}
        />
      )}

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
          <Card
            key={profile.id}
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setSelectedProfile(profile)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
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
              <span className="text-xs text-muted-foreground flex-shrink-0">View →</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Root panel ────────────────────────────────────────────────────────────────

export function AdminPanel() {
  const { reloadAdminData } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Load fresh data from Supabase every time the admin panel mounts
  useEffect(() => {
    void reloadAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadAdminData();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar + refresh */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-2xl bg-muted/50 p-1">
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
        <button
          onClick={() => { void handleRefresh(); }}
          disabled={refreshing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "overview"      && <OverviewTab onNavigate={setActiveTab} />}
      {activeTab === "properties"    && <PropertiesTab />}
      {activeTab === "flatmates"     && <FlatematesTab />}
      {activeTab === "verifications" && <VerificationsTab />}
      {activeTab === "users"         && <UsersTab />}
      {activeTab === "events"        && <EventsAdminTab />}
      {activeTab === "outages"       && <OutagesAdminTab />}
      {activeTab === "buses"         && <BusRoutesAdminTab />}
      {activeTab === "garbage"       && <GarbageAdminTab />}
      {activeTab === "areas"         && <CyprusAreasAdminTab />}
    </div>
  );
}
