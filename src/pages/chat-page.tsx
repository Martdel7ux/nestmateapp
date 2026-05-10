import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, BedDouble, Home, MapPin, Send, Search, ShieldCheck, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useData } from "@/contexts/data-context";
import type { FlatmateListing, Profile } from "@/types/supabase";

// ── Profile bottom sheet ──────────────────────────────────────────────────────
function ProfileSheet({
  profile,
  listing,
  onClose,
}: {
  profile: Profile;
  listing: FlatmateListing | null;
  onClose: () => void;
}) {
  const hasFlat = listing?.housing_status === "has_flat";

  const tags = listing
    ? [
        listing.country_of_origin,
        listing.language,
        listing.student_type === "erasmus" ? "Erasmus" : "Full-time",
        listing.pet_preference === "love"
          ? "Loves pets 🐾"
          : listing.pet_preference === "no"
          ? "No pets"
          : "Okay with pets",
      ].filter(Boolean)
    : [];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-[2rem] bg-background pb-10 shadow-card"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <X size={15} />
        </button>

        {/* Hero photo */}
        <div className="relative mx-5 mt-3 h-56 overflow-hidden rounded-3xl">
          <img
            src={
              listing?.profile_image_url ??
              listing?.apartment_images?.[0] ??
              `https://api.dicebear.com/9.x/adventurer/svg?seed=${profile.full_name}`
            }
            alt={profile.full_name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Housing badge */}
          {listing && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              {hasFlat ? (
                <Home size={12} className="text-sky-400" />
              ) : (
                <Search size={12} className="text-amber-400" />
              )}
              <span className="text-xs font-semibold text-white">
                {hasFlat ? "Has a flat" : "Seeking a flat"}
              </span>
            </div>
          )}
          {/* Name overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-white">{profile.full_name}</h2>
              {profile.is_verified_landlord && (
                <ShieldCheck size={18} className="text-sky-400" />
              )}
            </div>
            {profile.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-white/70" />
                <span className="text-xs text-white/70">{profile.city}, Cyprus</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 px-5 pt-4">
          {/* University */}
          {profile.university && (
            <p className="text-sm text-muted-foreground">{profile.university}</p>
          )}

          {/* Bio */}
          {listing?.bio && (
            <p className="text-sm leading-relaxed text-foreground">{listing.bio}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag as string}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Flat details */}
          {listing && hasFlat && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
              {listing.flat_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly rent</span>
                  <span className="text-sm font-semibold">€{listing.flat_price}/mo</span>
                </div>
              )}
              {(listing as FlatmateListing & { flat_area?: string }).flat_area && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Area</span>
                  <span className="text-sm font-medium">
                    {(listing as FlatmateListing & { flat_area?: string }).flat_area}
                  </span>
                </div>
              )}
              {(listing as FlatmateListing & { flat_postal_code?: string }).flat_postal_code && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Postal code</span>
                  <span className="text-sm font-medium">
                    {(listing as FlatmateListing & { flat_postal_code?: string }).flat_postal_code}
                  </span>
                </div>
              )}
              {listing.flat_features && listing.flat_features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {listing.flat_features.map((f) => (
                    <span key={f} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Budget (seeking) */}
          {listing && !hasFlat && listing.min_budget > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <BedDouble size={15} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="ml-auto text-sm font-semibold">
                €{listing.min_budget}–€{listing.max_budget}/mo
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Chat page ─────────────────────────────────────────────────────────────────
export function ChatPage() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? "/messages";
  const { snapshot, sendMessage, markMessagesRead } = useData();
  const [draft, setDraft] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const match = snapshot.matches.find((m) => m.id === matchId);
  const otherId =
    match?.user_a === snapshot.profile.id ? match.user_b : match?.user_a;
  const otherListing = snapshot.flatmates.find((f) => f.user_id === otherId) ?? null;
  const otherProfile = otherListing?.profile ?? null;

  const messages = snapshot.messages.filter((m) => m.match_id === matchId);

  // Mark all incoming messages as read as soon as the chat is opened
  useEffect(() => {
    if (matchId) markMessagesRead(matchId);
  }, [matchId]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(matchId, draft.trim());
    setDraft("");
  };

  if (!match || !otherProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Avatar + name — tappable to view profile */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="relative">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <Avatar
                name={otherProfile.full_name}
                src={otherListing?.profile_image_url ?? otherProfile.avatar_url}
                className="h-full w-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{otherProfile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {otherProfile.city ? `${otherProfile.city} · ` : ""}Tap to view profile
            </p>
          </div>
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BedDouble size={24} className="text-primary" />
            </div>
            <p className="font-semibold">You matched!</p>
            <p className="text-sm text-muted-foreground px-6">
              Say hello to {otherProfile.full_name} and start the conversation.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === snapshot.profile.id;
          const time = new Date(msg.created_at).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%] space-y-1">
                <div
                  className={`rounded-[1.4rem] px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-card text-card-foreground shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[10px] text-muted-foreground ${isMine ? "text-right pr-1" : "pl-1"}`}>
                  {time} {isMine && (msg.read ? "· Read" : "· Sent")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 border-t border-border bg-background px-4 pb-6 pt-3">
        <div className="flex items-center gap-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Message ${otherProfile.full_name.split(" ")[0]}…`}
            className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ── Profile bottom sheet ── */}
      <AnimatePresence>
        {profileOpen && (
          <ProfileSheet
            key="profile-sheet"
            profile={otherProfile}
            listing={otherListing}
            onClose={() => setProfileOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
