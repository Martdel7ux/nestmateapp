import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Check, ChevronRight, Eye, EyeOff,
  Key, LogOut, MapPin, Pencil, ShieldCheck, Trash2, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { VerificationUpload } from "@/components/features/verification/verification-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { cities } from "@/lib/constants";
import type { City } from "@/types/supabase";

const PRESET_AVATARS = [
  { seed: "Zoe", bg: "b6e3f4" }, { seed: "Liam", bg: "ffd5dc" },
  { seed: "Emma", bg: "c0aede" }, { seed: "Noah", bg: "d1f4e0" },
  { seed: "Olivia", bg: "ffdfbf" }, { seed: "Marcus", bg: "f4d4b6" },
  { seed: "Sofia", bg: "b6c9f4" }, { seed: "Aiden", bg: "f4b6e3" },
].map(({ seed, bg }) => ({
  seed,
  url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`,
}));

export function LandlordProfileView() {
  const { snapshot, updateProfile } = useData();
  const { signOut, updatePassword, deleteAccount } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const profile = snapshot.profile;
  const photoRef = useRef<HTMLInputElement>(null);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(profile.avatar_url ?? null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.full_name);
  const [editCity, setEditCity] = useState(profile.city ?? cities[0]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAvatar(URL.createObjectURL(file));
    setAvatarOpen(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: editName, city: editCity as City, avatar_url: selectedAvatar ?? undefined });
      toast.success("Profile updated");
      setEditing(false);
    } catch { toast.error("Failed to save"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await updatePassword(newPw);
      toast.success("Password changed");
      setPwOpen(false); setNewPw(""); setConfirmPw("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to change password"); }
    finally { setSavingPw(false); }
  };

  const displayAvatar = selectedAvatar ?? profile.avatar_url;

  return (
    <div className="space-y-5 px-5 pt-2 pb-8">

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
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            {profile.is_verified_landlord && (
              <ShieldCheck size={18} className="text-sky-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            Landlord {profile.city ? `· ${profile.city}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium transition hover:border-primary/50"
        >
          <Pencil size={13} />
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {/* ── Edit profile form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <Card className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium"><User size={14} /> Full name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium"><MapPin size={14} /> City</label>
                <Select value={editCity} onChange={(e) => setEditCity(e.target.value as City)}>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? "Saving…" : "Save changes"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Verification ── */}
      {!profile.is_verified_landlord && (
        <div className="space-y-2">
          <h2 className="font-display text-base font-bold">Verification</h2>
          <VerificationUpload />
        </div>
      )}

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
                language === code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-3xl leading-none">{code === "en" ? "🇬🇧" : "🇬🇷"}</span>
              <div>
                <p className="text-sm font-bold">{code === "en" ? "English" : "Ελληνικά"}</p>
                <p className="text-xs text-muted-foreground">{code === "en" ? "English" : "Greek"}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 transition-all ${language === code ? "border-primary bg-primary" : "border-border"}`} />
            </button>
          ))}
        </div>
      </Card>

      {/* ── Security ── */}
      <Card className="space-y-1 overflow-hidden p-0">
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
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border"
            >
              <div className="space-y-3 px-5 pb-5 pt-4">
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder={t("profileNewPwPh")}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <Input type={showPw ? "text" : "password"} placeholder={t("profileConfirmPwPh")} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                <Button onClick={handleChangePassword} disabled={savingPw} className="w-full">
                  {savingPw ? "Saving…" : t("profileUpdatePw")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── Account actions ── */}
      <Card className="space-y-1 overflow-hidden p-0">
        <button
          type="button"
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="flex w-full items-center gap-3 px-5 py-4 transition hover:bg-muted/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted">
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

      {/* ── Avatar picker ── */}
      <AnimatePresence>
        {avatarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setAvatarOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] bg-background p-6 shadow-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Choose photo</h3>
                <button onClick={() => setAvatarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((av) => {
                  const active = selectedAvatar === av.url;
                  return (
                    <button key={av.seed} type="button"
                      onClick={() => { setSelectedAvatar(av.url); setAvatarOpen(false); }}
                      className={`relative overflow-hidden rounded-2xl transition active:scale-95 ${active ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                    >
                      <img src={av.url} alt={av.seed} className="h-full w-full object-cover" />
                      {active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Check size={18} className="text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => photoRef.current?.click()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground">
                <Camera size={16} /> Upload photo
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-6 z-50 rounded-[2rem] bg-background p-6 shadow-card"
            >
              <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 size={22} className="text-destructive" />
              </div>
              <h3 className="mt-3 text-center font-display text-xl font-bold">{t("profileDeleteTitle")}</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">{t("profileDeleteDesc")}</p>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>{t("profileCancel")}</Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => { try { await deleteAccount(); navigate("/auth", { replace: true }); } catch { toast.error("Failed"); }}}
                >
                  {t("profileYesDelete")}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
  );
}
