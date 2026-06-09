import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BedDouble, Heart, Home, MapPin, MessageCircle, Search, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { useMatchScore } from "@/hooks/use-match-score";
import { matchTier } from "@/lib/match-score";
import type { FlatmateListing } from "@/types/supabase";
import { ProfileDetailSheetPortal } from "./profile-detail-sheet";

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {label}
    </span>
  );
}

// ── Full-screen match overlay ─────────────────────────────────────────────────
function MatchOverlay({ matched, myPhoto, onClose, onMessage }: {
  matched: FlatmateListing;
  myPhoto: string;
  onClose: () => void;
  onMessage: () => void;
}) {
  const matchedDicebear = `https://api.dicebear.com/9.x/adventurer/svg?seed=${matched.profile?.full_name ?? matched.id}`;
  const matchedPhoto =
    matched.profile_image_url ?? matched.profile?.avatar_url ??
    matched.apartment_images?.[0] ?? matchedDicebear;
  const matchedName = matched.profile?.full_name ?? "Your flatmate";

  return (
    <motion.div
      className="match-overlay-bg fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <button type="button" onClick={onClose}
        className="absolute left-5 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm dark:bg-slate-800/80"
      >
        <X size={18} className="text-gray-600 dark:text-gray-300" />
      </button>

      <div className="relative mb-8" style={{ width: 290, height: 210 }}>
        <motion.div
          className="absolute left-0 top-0 overflow-hidden rounded-3xl border-4 border-white shadow-2xl dark:border-slate-700"
          style={{ width: 145, height: 190, rotate: -8, zIndex: 1 } as React.CSSProperties}
          initial={{ x: -40, opacity: 0, rotate: -20 }} animate={{ x: 0, opacity: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
        >
          <img src={matchedPhoto} alt={matchedName} className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = matchedDicebear; }} />
        </motion.div>

        <motion.div
          className="absolute right-0 top-4 overflow-hidden rounded-3xl border-4 border-white shadow-2xl dark:border-slate-700"
          style={{ width: 145, height: 190, rotate: 8, zIndex: 1 } as React.CSSProperties}
          initial={{ x: 40, opacity: 0, rotate: 20 }} animate={{ x: 0, opacity: 1, rotate: 8 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.15 }}
        >
          <img src={myPhoto} alt="You" className="h-full w-full object-cover" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl dark:bg-slate-800"
          initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }}
          transition={{ duration: 0.45, delay: 0.3 }}
        >
          <BedDouble size={24} className="text-sky-500 dark:text-sky-400" />
        </motion.div>
      </div>

      <motion.div className="flex flex-col items-center gap-2 px-8 text-center"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
      >
        <h2 className="font-display text-4xl font-black text-gray-900 dark:text-white">You matched!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You and {matchedName} are a great fit — start a conversation!
        </p>
      </motion.div>

      <motion.button type="button" onClick={onMessage}
        className="mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl dark:bg-slate-800"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 20 }}
        whileTap={{ scale: 0.92 }}
      >
        <MessageCircle size={28} className="text-gray-700 dark:text-gray-200" />
      </motion.button>
    </motion.div>
  );
}

// ── Single swipeable card ─────────────────────────────────────────────────────
function ProfileCard({ flatmate, onSwipe, onTap, isTop, stackIndex }: {
  flatmate: FlatmateListing;
  onSwipe: (direction: "left" | "right") => void;
  onTap: () => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const match = useMatchScore(flatmate);

  const dicebear = `https://api.dicebear.com/9.x/adventurer/svg?seed=${flatmate.profile?.full_name ?? flatmate.id}&backgroundColor=b6e3f4&backgroundType=solid`;
  const imageUrl =
    flatmate.profile_image_url ?? flatmate.profile?.avatar_url ??
    flatmate.apartment_images?.[0] ?? dicebear;

  const name = flatmate.profile?.full_name ?? "Student";
  const city = flatmate.preferred_city ?? "Cyprus";
  const hasFlat = flatmate.housing_status === "has_flat";

  const tags = [
    flatmate.country_of_origin,
    flatmate.language,
    flatmate.student_type === "erasmus" ? "Erasmus" : "Full-time",
    flatmate.pet_preference === "love" ? "Loves pets 🐾"
      : flatmate.pet_preference === "no" ? "No pets" : "Okay with pets",
  ].filter(Boolean) as string[];

  if (!isTop) {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-slate-900"
        style={{ transform: `scale(${1 - stackIndex * 0.04}) translateY(${stackIndex * 14}px)`, zIndex: 10 - stackIndex }}
      >
        <img src={imageUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-70"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear; }} />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab overflow-hidden rounded-[2.5rem] shadow-2xl active:cursor-grabbing"
      style={{ x, rotate, zIndex: 20 } as React.CSSProperties}
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe("right");
        else if (info.offset.x < -100) onSwipe("left");
      }}
      onClick={() => { if (Math.abs(x.get()) < 5) onTap(); }}
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <img src={imageUrl} alt={name} decoding="async" className="h-full w-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear; }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <motion.div className="absolute left-5 top-10 rotate-[-20deg] rounded-xl border-4 border-emerald-400 px-4 py-1.5"
        style={{ opacity: likeOpacity } as React.CSSProperties}>
        <span className="text-2xl font-black tracking-widest text-emerald-400">LIKE</span>
      </motion.div>
      <motion.div className="absolute right-5 top-10 rotate-[20deg] rounded-xl border-4 border-rose-500 px-4 py-1.5"
        style={{ opacity: nopeOpacity } as React.CSSProperties}>
        <span className="text-2xl font-black tracking-widest text-rose-500">NOPE</span>
      </motion.div>

      <div className="absolute left-4 top-4">
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          {hasFlat ? <Home size={12} className="text-sky-400" /> : <Search size={12} className="text-amber-400" />}
          <span className="text-xs font-semibold text-white">{hasFlat ? "Has a flat" : "Seeking a flat"}</span>
        </div>
      </div>
      <div className="absolute right-4 top-4">
        <div className="rounded-full bg-black/40 px-2.5 py-1.5 backdrop-blur-sm">
          <span className="text-[10px] font-medium text-white/80">Tap for details</span>
        </div>
      </div>

      {/* Compatibility match score */}
      {match && match.dimensions.length > 0 && (
        <div className="absolute left-1/2 top-3.5 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 shadow-lg ring-1 ring-black/5">
            <span className={`text-base font-extrabold leading-none ${matchTier(match.overall).text}`}>
              {match.overall}%
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Match</span>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-white/70" />
          <span className="text-sm font-medium text-white/80">{city}</span>
        </div>
        <h2 className="font-display text-4xl font-bold leading-tight text-white drop-shadow">{name}</h2>
        {flatmate.bio && <p className="line-clamp-2 text-sm leading-snug text-white/80">{flatmate.bio}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag) => <Tag key={tag} label={tag} />)}
          {hasFlat && flatmate.flat_price && <Tag label={`€${flatmate.flat_price}/mo`} />}
          {!hasFlat && flatmate.min_budget && flatmate.max_budget && (
            <Tag label={`€${flatmate.min_budget}–€${flatmate.max_budget}`} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Deck ──────────────────────────────────────────────────────────────────────
export function SwipeDeck() {
  const navigate = useNavigate();
  const { filteredFlatmates, swipeFlatmate, snapshot } = useData();
  const [index, setIndex] = useState(0);
  const [matchedFlatmate, setMatchedFlatmate] = useState<FlatmateListing | null>(null);
  const [detailFlatmate, setDetailFlatmate] = useState<FlatmateListing | null>(null);

  const myPhoto =
    snapshot.profile.avatar_url ??
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${snapshot.profile.id}`;

  const visible = filteredFlatmates.slice(index, index + 3);
  const current = filteredFlatmates[index];

  const handleSwipe = (direction: "left" | "right") => {
    if (!current) return;
    const result = swipeFlatmate(current.id, direction);
    if (result) setMatchedFlatmate(result);
    setIndex((i) => i + 1);
  };

  if (filteredFlatmates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart size={28} className="text-muted-foreground" />
        </div>
        <p className="font-semibold">No profiles yet</p>
        <p className="text-sm text-muted-foreground">Check back soon — more students are joining every day.</p>
      </div>
    );
  }

  if (index >= filteredFlatmates.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart size={28} className="text-muted-foreground" />
        </div>
        <p className="font-semibold">You've seen everyone!</p>
        <p className="text-sm text-muted-foreground">Come back later for new profiles.</p>
        <button type="button" onClick={() => setIndex(0)}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Start over
        </button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {matchedFlatmate && (
          <MatchOverlay key="match-overlay" matched={matchedFlatmate} myPhoto={myPhoto}
            onClose={() => setMatchedFlatmate(null)}
            onMessage={() => { setMatchedFlatmate(null); navigate("/messages"); }}
          />
        )}
      </AnimatePresence>

      <ProfileDetailSheetPortal
        flatmate={detailFlatmate}
        onClose={() => setDetailFlatmate(null)}
        onSwipe={(dir) => { setDetailFlatmate(null); handleSwipe(dir); }}
      />

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-full" style={{ height: "72vmax", maxHeight: 560 }}>
          <AnimatePresence>
            {[...visible].reverse().map((flatmate, reversedIdx) => {
              const stackIndex = visible.length - 1 - reversedIdx;
              return (
                <ProfileCard key={flatmate.id} flatmate={flatmate}
                  isTop={stackIndex === 0} stackIndex={stackIndex}
                  onSwipe={handleSwipe}
                  onTap={() => setDetailFlatmate(flatmate)}
                />
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-6">
          <button type="button" onClick={() => handleSwipe("left")}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-300 bg-white shadow-md transition active:scale-95 dark:bg-card">
            <X size={26} className="text-rose-500" />
          </button>
          <button type="button" onClick={() => handleSwipe("right")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-400 shadow-glow transition active:scale-95">
            <Heart size={26} className="fill-white text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
