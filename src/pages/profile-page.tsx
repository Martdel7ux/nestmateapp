import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LandlordProfileView } from "@/components/features/landlord/landlord-profile-view";
import { AppHeader } from "@/components/layout/app-header";
import { useI18n } from "@/contexts/i18n-context";
import {
  Camera, Check, ChevronRight, Eye, EyeOff,
  FolderOpen, Heart, HelpCircle, Key, Laptop, LogOut, MapPin, Moon, Pencil,
  ShieldCheck, Sparkles, Sun, Trash2, University, User, Wallet, X
} from "lucide-react";
import { useUpcomingRentPayment } from "@/hooks/use-rent";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { VerificationUpload } from "@/components/features/verification/verification-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { NotificationSettings } from "@/components/features/notifications/notification-settings";
import { cities } from "@/lib/constants";
import type { City } from "@/types/supabase";
import { currency } from "@/lib/utils";

// ── DiceBear avatars (adventurer style, Apple Memoji vibe) ──────────────────
const PRESET_AVATARS = [
  { seed: "Zoe",      bg: "b6e3f4" },
  { seed: "Liam",     bg: "ffd5dc" },
  { seed: "Emma",     bg: "c0aede" },
  { seed: "Noah",     bg: "d1f4e0" },
  { seed: "Olivia",   bg: "ffdfbf" },
  { seed: "Marcus",   bg: "f4d4b6" },
  { seed: "Sofia",    bg: "b6c9f4" },
  { seed: "Aiden",    bg: "f4b6e3" },
  { seed: "Isabella", bg: "b6f4d4" },
  { seed: "James",    bg: "f4f4b6" },
  { seed: "Mia",      bg: "d4b6f4" },
  { seed: "Luna",     bg: "b6f4f4" },
  { seed: "Kai",      bg: "f4b6b6" },
  { seed: "Aria",     bg: "c8f4b6" },
  { seed: "Ryan",     bg: "f4cdb6" },
  { seed: "Nadia",    bg: "b6d4f4" },
].map(({ seed, bg }) => ({
  seed,
  url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`
}));

export function ProfilePage() {
  const { snapshot, updateProfile, toggleSavedProperty } = useData();
  const { user, signOut, updatePassword, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const profile = snapshot.profile;
  const isLandlord = profile.user_type === "landlord";

  // Rent (My Stuff)
  const { data: rentPayment } = useUpcomingRentPayment(user?.id ?? "");
  const rentSubtitle = (() => {
    if (!rentPayment) return "No upcoming payments";
    const due   = new Date(rentPayment.due_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days  = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    const amount = `€${Number(rentPayment.amount).toFixed(0)}`;
    if (rentPayment.status === "late" || days < 0) return `${amount} · Overdue`;
    if (days === 0) return `${amount} · Due today`;
    if (days === 1) return `${amount} · Due tomorrow`;
    return `${amount} · Due in ${days} days`;
  })();
  const rentBadge = (() => {
    if (!rentPayment) return undefined;
    const due   = new Date(rentPayment.due_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days  = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (rentPayment.status === "late" || days < 0) return { text: "Overdue", variant: "danger" as const };
    if (days <= 7) return { text: "Due soon", variant: "warning" as const };
    return undefined;
  })();

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.full_name);
  const [editBio, setEditBio] = useState(profile.bio ?? "");
  const [editUniversity, setEditUniversity] = useState(profile.university ?? "");
  const [editCity, setEditCity] = useState<string>(profile.city ?? cities[0]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar picker
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(profile.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Password change
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Profile completion
  const completionFields = [
    { label: "Full name",   done: !!profile.full_name?.trim() },
    { label: "Bio",         done: !!profile.bio?.trim() },
    { label: "University",  done: !!profile.university?.trim() },
    { label: "City",        done: !!profile.city?.trim() },
  ];
  const completedCount = completionFields.filter((f) => f.done).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  // One-time popup for incomplete profiles
  const PROMPT_KEY = `nestmate_profile_prompt_${profile.id}`;
  const [promptOpen, setPromptOpen] = useState(false);
  useEffect(() => {
    if (completionPct < 100 && !localStorage.getItem(PROMPT_KEY)) {
      const t = setTimeout(() => setPromptOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setSelectedAvatar(URL.createObjectURL(file)); // local preview only — never saved to DB
    setAvatarOpen(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(
        {
          full_name: editName,
          bio: editBio,
          university: editUniversity,
          city: editCity as City,
          // Only pass avatar_url when it's a real URL (preset DiceBear), not a blob
          avatar_url: avatarFile ? undefined : selectedAvatar ?? undefined
        },
        avatarFile ?? undefined
      );
      toast.success("Profile updated");
      setEditing(false);
      setAvatarFile(null);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await updatePassword(newPw);
      toast.success("Password changed successfully");
      setPwOpen(false);
      setNewPw(""); setConfirmPw("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const displayAvatar = selectedAvatar ?? profile.avatar_url;

  // Landlords get a dedicated CRM profile view
  if (isLandlord) return <LandlordProfileView />;

  return (
    <>
      <AppHeader title="Profile" right={{ type: "none" }} />
      <div className="space-y-5 px-5 pt-4">

      {/* ── New-user profile completion prompt ── */}
      <AnimatePresence>
        {promptOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => { setPromptOpen(false); localStorage.setItem(PROMPT_KEY, "1"); }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-6 z-50 rounded-[2rem] bg-background p-6 shadow-card"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Sparkles size={26} className="text-primary" />
              </div>
              <h3 className="text-center font-display text-xl font-bold">Complete your profile</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
                A complete profile helps you get better matches and enjoy the full NestMate experience.
              </p>

              {/* Mini progress inside popup */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">{completedCount} of {completionFields.length} completed</span>
                  <span className="text-primary">{completionPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-all duration-700"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {completionFields.map((f) => (
                    <span key={f.label}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        f.done ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {f.done ? <Check size={10} /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" />}
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPromptOpen(false); localStorage.setItem(PROMPT_KEY, "1"); }}
                  className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromptOpen(false);
                    localStorage.setItem(PROMPT_KEY, "1");
                    setEditing(true);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95"
                >
                  Complete now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Avatar + name header ── */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="relative">
          <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-primary/20 shadow-card">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/15 text-3xl font-bold text-primary">
                {profile.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAvatarOpen(true)}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95"
          >
            <Camera size={16} />
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {profile.user_type} {profile.city ? `· ${profile.city}` : ""}
          </p>
          {profile.is_verified_landlord && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600">
              <ShieldCheck size={12} /> {t("profileVerifiedLandlord")}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setEditing(!editing); setEditName(profile.full_name); setEditBio(profile.bio ?? ""); setEditUniversity(profile.university ?? ""); setEditCity(profile.city ?? cities[0]); }}
          className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium transition hover:border-primary/50"
        >
          <Pencil size={13} />
          {editing ? t("profileCancelBtn") : t("profileEditBtn")}
        </button>
      </div>

      {/* ── Profile completion bar ── */}
      {completionPct < 100 && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 text-left transition hover:bg-primary/10 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Complete your profile</span>
            </div>
            <span className="text-sm font-bold text-primary">{completionPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {completionFields.map((f) => (
              <span key={f.label}
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  f.done
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f.done
                  ? <Check size={10} />
                  : <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
                {f.label}
              </span>
            ))}
          </div>
        </button>
      )}

      {/* ── Avatar picker sheet ── */}
      <AnimatePresence>
        {avatarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setAvatarOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-background p-6 shadow-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{t("profileChooseAvatar")}</h3>
                <button onClick={() => setAvatarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((av) => {
                  const active = selectedAvatar === av.url;
                  return (
                    <button
                      key={av.seed}
                      type="button"
                      onClick={() => { setSelectedAvatar(av.url); setAvatarOpen(false); }}
                      className={`relative overflow-hidden rounded-2xl transition active:scale-95 ${active ? "ring-3 ring-primary shadow-glow" : "ring-1 ring-border"}`}
                    >
                      <img src={av.url} alt={av.seed} className="h-full w-full object-cover" loading="lazy" />
                      {active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Check size={18} className="text-primary drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                <Camera size={16} /> {t("profileUploadPhoto")}
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Edit profile form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="space-y-4">
              <h3 className="font-display text-lg font-bold">{t("profileEditTitle")}</h3>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User size={14} /> {t("profileFullName")}
                </label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t("profileFullNamePh")} />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Pencil size={14} /> {t("profileBio")}
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t("profileBioPh")}
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <University size={14} /> {t("profileUniversity")}
                </label>
                <Input value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} placeholder={t("profileUniversityPh")} />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin size={14} /> {t("profileCity")}
                </label>
                <Select value={editCity} onChange={(e) => setEditCity(e.target.value)}>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <ShieldCheck size={14} />
                {t("profileAccountType")}: <span className="font-semibold capitalize text-foreground">{profile.user_type}</span>
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? t("profileSaving") : t("profileSaveChanges")}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile info (view mode) ── */}
      {!editing && (
        <Card className="space-y-3">
          {[
            { icon: University, label: t("profileUniversity"), value: profile.university || t("profileNotSet") },
            { icon: MapPin, label: t("profileCity"), value: profile.city || t("profileNotSet") },
            { icon: User, label: t("profileAccountType"), value: profile.user_type, capitalize: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <row.icon size={15} />
                {row.label}
              </div>
              <span className={`text-sm font-medium ${row.capitalize ? "capitalize" : ""}`}>{row.value}</span>
            </div>
          ))}
          {profile.bio && (
            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Saved properties ── */}
      {snapshot.savedProperties.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-500" />
            <h3 className="font-semibold">{t("profileSavedProperties")}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {snapshot.savedProperties.length}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {snapshot.savedProperties.map((property) => (
              <div key={property.id} className="relative w-52 shrink-0 overflow-hidden rounded-[1.5rem] shadow-card">
                <img src={property.image_urls[0]} alt={property.title} className="h-32 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="truncate text-xs font-semibold text-white">{property.title}</p>
                  <p className="text-xs text-white/70">{currency(property.rent_price)}/mo</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSavedProperty(property)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80"
                >
                  <Heart size={13} className="fill-rose-500 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Landlord verification ── */}
      {isLandlord && <VerificationUpload />}

      {/* ── My stuff ── */}
      <Card className="space-y-3">
        <h3 className="font-display text-base font-bold">My stuff</h3>
        <div className="space-y-2.5">
          {/* Rent */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => rentPayment ? navigate(`/rent/payments/${rentPayment.id}`) : navigate("/rent")}
            onKeyDown={(e) => e.key === "Enter" && (rentPayment ? navigate(`/rent/payments/${rentPayment.id}`) : navigate("/rent"))}
            className="flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 cursor-pointer
              bg-foreground/[0.03] border border-border
              hover:bg-foreground/[0.06] active:bg-foreground/[0.08] transition-colors duration-150"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06]">
              <Wallet size={18} strokeWidth={1.8} className="text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Rent</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{rentSubtitle}</p>
            </div>
            {rentBadge && (
              <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                rentBadge.variant === "danger"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {rentBadge.text}
              </span>
            )}
            <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
          </div>
          {/* Documents */}
          <Link
            to="/documents"
            className="flex items-center gap-3.5 rounded-[18px] px-4 py-3.5
              bg-foreground/[0.03] border border-border
              hover:bg-foreground/[0.06] active:bg-foreground/[0.08] transition-colors duration-150"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06]">
              <FolderOpen size={18} strokeWidth={1.8} className="text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Documents</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">Passport, insurance, contracts</p>
            </div>
            <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
          </Link>
        </div>
      </Card>

      {/* ── Notification settings ── */}
      <NotificationSettings />

      {/* ── Appearance ── */}
      <Card className="space-y-3">
        <h3 className="font-display text-base font-bold">Appearance</h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "system", Icon: Laptop, label: "System" },
              { value: "light",  Icon: Sun,    label: "Light"  },
              { value: "dark",   Icon: Moon,   label: "Dark"   },
            ] as { value: Theme; Icon: typeof Sun; label: string }[]
          ).map(({ value, Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Icon size={22} className={theme === value ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-bold">{label}</p>
              <div className={`h-4 w-4 rounded-full border-2 transition-all ${
                theme === value ? "border-primary bg-primary" : "border-border"
              }`} />
            </button>
          ))}
        </div>
      </Card>

      {/* ── Language settings ── */}
      <Card className="space-y-3">
        <h3 className="font-display text-base font-bold">{t("settingsLanguage")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["en", "el"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                language === code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-3xl leading-none">{code === "en" ? "🇬🇧" : "🇬🇷"}</span>
              <div>
                <p className="text-sm font-bold">{code === "en" ? "English" : "Ελληνικά"}</p>
                <p className="text-xs text-muted-foreground">{code === "en" ? "English" : "Greek"}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 transition-all ${
                language === code ? "border-primary bg-primary" : "border-border"
              }`} />
            </button>
          ))}
        </div>
      </Card>

      {/* ── Help & Support ── */}
      <Card className="p-0 overflow-hidden">
        <Link
          to="/profile/help"
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <HelpCircle size={16} />
            </div>
            <div>
              <p className="font-medium">Help & Support</p>
              <p className="text-xs text-muted-foreground">Articles, AI assistant, contact us</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      </Card>

      {/* ── Location ── */}
      <Card className="p-0 overflow-hidden">
        <Link
          to="/profile/settings/location"
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin size={16} />
            </div>
            <div>
              <p className="font-medium">Location</p>
              <p className="text-xs text-muted-foreground">
                {profile.city && profile.area
                  ? `${profile.area}, ${profile.city}`
                  : profile.city ?? "Not set"}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      </Card>

      {/* ── Security ── */}
      <Card className="space-y-1 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setPwOpen(!pwOpen)}
          className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Key size={16} />
            </div>
            <span className="font-medium">{t("profileChangePassword")}</span>
          </div>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform ${pwOpen ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {pwOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="space-y-3 px-5 pb-5 pt-4">
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder={t("profileNewPwPh")}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder={t("profileConfirmPwPh")}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
                <Button onClick={handleChangePassword} disabled={savingPw} className="w-full">
                  {savingPw ? t("profileSaving") : t("profileUpdatePw")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── Account actions ── */}
      <Card className="space-y-1 p-0 overflow-hidden">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-5 py-4 transition hover:bg-muted/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-foreground">
            <LogOut size={16} />
          </div>
          <span className="font-medium">{t("profileSignOut")}</span>
        </button>

        <div className="border-t border-border" />

        <button
          type="button"
          onClick={() => setDeleteConfirm(true)}
          className="flex w-full items-center gap-3 px-5 py-4 transition hover:bg-destructive/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 size={16} />
          </div>
          <span className="font-medium text-destructive">{t("profileDeleteAccount")}</span>
        </button>
      </Card>

      {/* ── Delete confirmation sheet ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-6 z-50 rounded-[2rem] bg-background p-6 shadow-card"
            >
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <Trash2 size={22} className="text-destructive" />
              </div>
              <h3 className="mt-3 text-center font-display text-xl font-bold">{t("profileDeleteTitle")}</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {t("profileDeleteDesc")}
              </p>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>
                  {t("profileCancel")}
                </Button>
                <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
                  {t("profileYesDelete")}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
    </>
  );
}
