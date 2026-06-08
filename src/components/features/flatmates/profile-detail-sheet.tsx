import { useState } from "react";
import {
  ChevronDown, Euro, Globe, GraduationCap, Home, MapPin, PawPrint, Search, X, Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FlatmateListing } from "@/types/supabase";

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {label}
    </span>
  );
}

export function ProfileDetailSheet({
  flatmate,
  onClose,
  onSwipe,
}: {
  flatmate: FlatmateListing;
  onClose: () => void;
  /** Called with "right" (like) or "left" (pass). If omitted, no action buttons shown. */
  onSwipe?: (dir: "left" | "right") => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);

  const dicebear = `https://api.dicebear.com/9.x/adventurer/svg?seed=${flatmate.profile?.full_name ?? flatmate.id}&backgroundColor=b6e3f4&backgroundType=solid`;
  const hasFlat = flatmate.housing_status === "has_flat";
  const name = flatmate.profile?.full_name ?? "Student";

  const photos: string[] =
    hasFlat && flatmate.apartment_images?.length
      ? flatmate.apartment_images
      : [flatmate.profile_image_url ?? flatmate.profile?.avatar_url ?? dicebear];

  const profilePhoto =
    flatmate.profile_image_url ?? flatmate.profile?.avatar_url ?? dicebear;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[2rem] bg-background shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-background/80 backdrop-blur-sm">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Image gallery */}
        {hasFlat && photos.length > 0 ? (
          <div className="relative h-64 w-full overflow-hidden bg-muted">
            <img
              src={photos[imgIndex]}
              alt={`Photo ${imgIndex + 1}`}
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear; }}
            />
            {photos.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} type="button" onClick={() => setImgIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button type="button" className="absolute inset-y-0 left-0 w-1/3"
                  onClick={() => setImgIndex((i) => Math.max(0, i - 1))} />
                <button type="button" className="absolute inset-y-0 right-0 w-1/3"
                  onClick={() => setImgIndex((i) => Math.min(photos.length - 1, i + 1))} />
              </>
            )}
          </div>
        ) : (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img src={profilePhoto} alt={name} className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear; }} />
          </div>
        )}

        {/* Content */}
        <div className={`space-y-5 p-5 ${onSwipe ? "pb-32" : "pb-8"}`}>

          {/* Header */}
          <div className="flex items-start gap-3">
            {hasFlat && (
              <img src={profilePhoto} alt={name} loading="lazy" decoding="async"
                className="h-14 w-14 rounded-full object-cover border-2 border-border shadow shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear; }} />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl font-bold truncate">{name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                <MapPin size={13} />
                <span>{flatmate.preferred_city ?? flatmate.flat_postal_code ?? "Cyprus"}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0 ${
              hasFlat
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {hasFlat ? <Home size={12} /> : <Search size={12} />}
              {hasFlat ? "Has a flat" : "Seeking"}
            </div>
          </div>

          {/* Bio */}
          {flatmate.bio && (
            <p className="text-sm leading-relaxed text-muted-foreground">{flatmate.bio}</p>
          )}

          {/* Flat details */}
          {hasFlat && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">About the flat</h3>
              {flatmate.apartment_description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {flatmate.apartment_description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {flatmate.flat_price && (
                  <div className="flex items-center gap-2">
                    <Euro size={15} className="text-primary shrink-0" />
                    <span className="font-semibold">
                      €{flatmate.flat_price}
                      <span className="font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                )}
                {flatmate.flat_area && (
                  <div className="flex items-center gap-2">
                    <Home size={15} className="text-primary shrink-0" />
                    <span>{flatmate.flat_area}</span>
                  </div>
                )}
                {flatmate.preferred_city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-primary shrink-0" />
                    <span>{flatmate.preferred_city}</span>
                  </div>
                )}
                {flatmate.flat_postal_code && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">Postal: {flatmate.flat_postal_code}</span>
                  </div>
                )}
              </div>
              {flatmate.flat_features && flatmate.flat_features.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {flatmate.flat_features.map((f) => <Chip key={f} label={f} />)}
                </div>
              )}
            </div>
          )}

          {/* Budget (seeking) */}
          {!hasFlat && (flatmate.min_budget || flatmate.max_budget) && (
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <Euro size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Budget range</p>
                <p className="font-semibold">
                  €{flatmate.min_budget} – €{flatmate.max_budget}
                  <span className="font-normal text-muted-foreground text-sm">/mo</span>
                </p>
              </div>
            </div>
          )}

          {/* About tags */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">About {name.split(" ")[0]}</h3>
            <div className="flex flex-wrap gap-2">
              {flatmate.country_of_origin && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                  <Globe size={12} className="text-muted-foreground" />
                  {flatmate.country_of_origin}
                </div>
              )}
              {flatmate.language && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                  <span>🗣</span> {flatmate.language}
                </div>
              )}
              {flatmate.student_type && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                  <GraduationCap size={12} className="text-muted-foreground" />
                  {flatmate.student_type === "erasmus" ? "Erasmus" : "Full-time student"}
                </div>
              )}
              {flatmate.pet_preference && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                  <PawPrint size={12} className="text-muted-foreground" />
                  {flatmate.pet_preference === "love" ? "Loves pets"
                    : flatmate.pet_preference === "no" ? "No pets"
                    : "Okay with pets"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky action bar — only when swipe actions are available */}
        {onSwipe && (
          <div className="fixed bottom-0 inset-x-0 flex items-center justify-center gap-6 bg-background/90 backdrop-blur-sm border-t border-border py-4 px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button"
              onClick={() => { onClose(); onSwipe("left"); }}
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-300 bg-white shadow-md transition active:scale-95 dark:bg-card"
            >
              <X size={26} className="text-rose-500" />
            </button>
            <button type="button" onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition active:scale-95"
            >
              <ChevronDown size={20} className="text-muted-foreground" />
            </button>
            <button type="button"
              onClick={() => { onClose(); onSwipe("right"); }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-400 shadow-glow transition active:scale-95"
            >
              <Heart size={26} className="fill-white text-white" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Re-export with AnimatePresence wrapper for convenience
export function ProfileDetailSheetPortal({
  flatmate,
  onClose,
  onSwipe,
}: {
  flatmate: FlatmateListing | null;
  onClose: () => void;
  onSwipe?: (dir: "left" | "right") => void;
}) {
  return (
    <AnimatePresence>
      {flatmate && (
        <ProfileDetailSheet
          key={flatmate.id}
          flatmate={flatmate}
          onClose={onClose}
          onSwipe={onSwipe}
        />
      )}
    </AnimatePresence>
  );
}
