import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, UsersRound, Building2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { AppHeader } from "@/components/layout/app-header";
import { LandlordHome } from "@/components/features/landlord/landlord-home";
import { ExpiringSoonStrip } from "@/components/features/documents/ExpiringSoonStrip";
import { LocationConfirmationBanner } from "@/components/features/location/LocationConfirmationBanner";
import { PropertyDetailModal } from "@/components/features/properties/property-detail-modal";
import { currency } from "@/lib/utils";
import type { Property } from "@/types/supabase";
import { useI18n } from "@/contexts/i18n-context";

// ── Compact property card (home grid only) ────────────────────────────────────

function CompactPropertyCard({
  property, saved, onToggle,
}: {
  property: Property;
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-[var(--glass-fill)] border border-[var(--glass-border)]">
      {/* Image */}
      <div className="relative h-[108px] bg-muted overflow-hidden">
        {property.image_urls?.[0] ? (
          <img
            src={property.image_urls[0]}
            alt={property.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={28} className="text-muted-foreground/30" />
          </div>
        )}
        {/* Save button */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggle(); }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/50"
        >
          <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${saved ? "fill-rose-500 text-rose-500" : "fill-none text-foreground/60"}`} stroke="currentColor" strokeWidth={1.8}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-bold text-primary leading-none mb-1">
          {currency(property.rent_price)}<span className="text-[10px] font-medium text-muted-foreground">/mo</span>
        </p>
        <p className="text-[12px] font-semibold text-foreground line-clamp-1 mb-0.5">
          {property.title}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={9} />
          <span className="truncate">{property.address || property.city}</span>
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function HomePage() {
  const { snapshot, toggleSavedProperty } = useData();
  const reduced = useReducedMotion();
  const { t } = useI18n();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  if (snapshot.profile.user_type === "landlord") return <LandlordHome />;

  const firstName = snapshot.profile.full_name?.split(" ")[0] ?? "there";
  const hour      = new Date().getHours();
  const greeting  =
    hour >= 5 && hour < 12 ? t("homeGoodMorning") :
    hour >= 12 && hour < 18 ? t("homeGoodAfternoon") :
    t("homeGoodEvening");
  const userCity  = snapshot.profile.city;

  const featuredProperties = snapshot.featuredProperties.slice(0, 4);
  const savedIds = new Set(snapshot.savedProperties.map((p) => p.id));

  return (
    <div className="relative min-h-dvh [overflow-x:clip]">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute -left-[20%] -top-[10%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-primary)" }} />
        <div className="absolute -right-[15%] top-[18%] h-[44vh] w-[44vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-secondary)" }} />
        <div className="absolute bottom-[8%] left-[5%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-accent)" }} />
        <div className="bg-noise absolute inset-0" style={{ opacity: "var(--grain-opacity)" }} />
      </div>

      {/* Sticky header */}
      <AppHeader variant="home" title="" right={{ type: "notifications" }} />

      {/* Blur veil below header */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[39]"
        style={{
          height: "calc(72px + env(safe-area-inset-top))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
        }} />

      <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />

      <div className="space-y-6 px-5 pb-32 pt-4">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{greeting}</p>
          <h1 className="text-[30px] font-light leading-[1.15] tracking-tight text-foreground">
            {t("homeWelcome", { name: firstName })}
          </h1>
          {userCity && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <MapPin size={10} />
              <span>{userCity}, Cyprus</span>
            </div>
          )}
        </motion.div>

        {/* ── Housing hero card ── */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <div
            className="relative overflow-hidden rounded-[24px] p-6"
            style={{ background: "var(--action-property)", minHeight: "168px" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative">
              <p className="text-white/70 text-[12px] font-medium mb-1 uppercase tracking-wider">
                {t("homeFindYourHome")}
              </p>
              <h2 className="text-white text-[22px] font-semibold leading-snug mb-1.5">
                {t("homeStudentHousingTitle")}
              </h2>
              <p className="text-white/75 text-[13px] mb-5">
                {t("homeStudentHousingDesc")}
              </p>
              <div className="flex gap-2.5">
                <Link to="/properties" className="flex-1">
                  <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                    <Search size={14} />
                    {t("homeSearch")}
                  </span>
                </Link>
                <Link to="/flatmates" className="flex-1">
                  <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                    <UsersRound size={14} />
                    {t("homeFlatmates")}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Property grid ── */}
        {featuredProperties.length > 0 && (
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-foreground">{t("homeTopProperties")}</p>
              <Link to="/properties" className="text-[12px] font-medium text-primary">
                {t("homeViewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featuredProperties.map((property: Property) => (
                <div key={property.id} onClick={() => setSelectedProperty(property)} className="cursor-pointer">
                  <CompactPropertyCard
                    property={property}
                    saved={savedIds.has(property.id)}
                    onToggle={() => toggleSavedProperty(property)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Location confirmation banner ── */}
        <LocationConfirmationBanner />

        {/* ── Expiring documents strip ── */}
        <ExpiringSoonStrip />

      </div>
    </div>
  );
}
