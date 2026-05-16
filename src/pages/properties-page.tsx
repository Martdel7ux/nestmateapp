import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Grid2X2, Heart, HeartHandshake, Landmark, MapPin, Search, SlidersHorizontal, Star, Bot, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { PropertyDetailModal } from "@/components/features/properties/property-detail-modal";
import { currency } from "@/lib/utils";
import { cities } from "@/lib/constants";
import type { Property } from "@/types/supabase";

const CITY_AREAS: Record<string, string[]> = {
  Nicosia: [
    "Engomi", "Agios Dometios", "Makedonitissa", "Strovolos", "Latsia",
    "Aglantzia", "Lakatamia", "Pallouriotissa", "Kaimakli", "Acropolis",
    "Lycavittos", "Agios Andreas", "Anthoupolis", "Tseri", "Dasoupolis",
  ],
  Limassol: [
    "Mesa Geitonia", "Agios Athanasios", "Germasogeia", "Potamos Germasogeia",
    "Polemidia", "Zakaki", "Omonia", "Agios Nikolaos", "Columbia",
    "Ypsonas", "Pyrgos", "Kolossi", "Episkopi", "Mouttagiaka", "Parekklisia",
  ],
  Larnaca: [
    "Skala", "Finikoudes", "Drosia", "Vergina", "Aradippou",
    "Livadia", "Tersefanou", "Perivolia", "Kiti", "Oroklini", "Dhekelia",
  ],
  Paphos: [
    "Kato Paphos", "Pano Paphos", "Chloraka", "Emba", "Tala",
    "Peyia", "Yeroskipou", "Mesogi", "Kissonerga", "Mandria",
  ],
  Famagusta: [
    "Paralimni", "Protaras", "Ayia Napa", "Deryneia",
    "Sotira", "Frenaros", "Liopetri", "Acheritou",
  ],
  Kyrenia: [
    "Kyrenia Town", "Lapithos", "Bellapais", "Karavas", "Kyrenia Hills",
  ],
};

const categoryDefs = [
  { value: "All",      icon: Grid2X2  },
  { value: "Nicosia",  icon: Building2 },
  { value: "Limassol", icon: Building2 },
  { value: "Larnaca",  icon: Landmark  },
  { value: "Paphos",   icon: Building2 },
] as const;

type Category = (typeof categoryDefs)[number]["value"];

function PropertyCard({
  property,
  saved,
  onToggleSave,
  onOpen,
}: {
  property: Property;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[1.5rem] shadow-card cursor-pointer"
      onClick={onOpen}
    >
      {property.image_urls[0] ? (
        <img
          src={property.image_urls[0]}
          alt={property.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-muted">
          <Building2 size={32} className="text-muted-foreground/40" />
        </div>
      )}

      {/* Heart */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm transition active:scale-95"
      >
        <Heart
          size={18}
          className={saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}
        />
      </button>

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-[1.5rem] bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-10">
        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-white/70">
          <MapPin size={10} />
          {property.city}
        </div>
        <h3 className="text-sm font-bold leading-tight text-white line-clamp-1">{property.title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            {currency(property.rent_price)}<span className="text-white/60">/mo</span>
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-white/80">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            {property.average_rating != null ? property.average_rating.toFixed(1) : "New"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function PropertiesPage() {
  const { snapshot, toggleSavedProperty } = useData();
  const { t } = useI18n();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Applied filter values
  const [filterBedrooms, setFilterBedrooms] = useState<number | null>(null);
  const [filterBathrooms, setFilterBathrooms] = useState<number | null>(null);
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterAreas, setFilterAreas] = useState<string[]>([]);

  // Draft values while panel is open
  const [draftBedrooms, setDraftBedrooms] = useState<number | null>(null);
  const [draftBathrooms, setDraftBathrooms] = useState<number | null>(null);
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftCity, setDraftCity] = useState<string | null>(null);
  const [draftAreas, setDraftAreas] = useState<string[]>([]);

  const selectDraftCity = (city: string) => {
    if (draftCity === city) {
      setDraftCity(null);
      setDraftAreas([]);
    } else {
      setDraftCity(city);
      setDraftAreas([]);
    }
  };

  const toggleDraftArea = (area: string) =>
    setDraftAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );

  const openFilters = () => {
    setDraftBedrooms(filterBedrooms);
    setDraftBathrooms(filterBathrooms);
    setDraftMinPrice(filterMinPrice);
    setDraftMaxPrice(filterMaxPrice);
    setDraftCity(filterCity);
    setDraftAreas(filterAreas);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilterBedrooms(draftBedrooms);
    setFilterBathrooms(draftBathrooms);
    setFilterMinPrice(draftMinPrice);
    setFilterMaxPrice(draftMaxPrice);
    setFilterCity(draftCity);
    setFilterAreas(draftAreas);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDraftBedrooms(null);
    setDraftBathrooms(null);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftCity(null);
    setDraftAreas([]);
  };

  const hasActiveFilters =
    filterBedrooms !== null ||
    filterBathrooms !== null ||
    filterMinPrice !== "" ||
    filterMaxPrice !== "" ||
    filterCity !== null;

  const filtered = snapshot.featuredProperties.filter((p) => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || p.city === category;
    const matchesBedrooms = filterBedrooms === null || (filterBedrooms >= 4 ? p.bedrooms >= 4 : p.bedrooms === filterBedrooms);
    const matchesBathrooms = filterBathrooms === null || (filterBathrooms >= 3 ? p.bathrooms >= 3 : p.bathrooms === filterBathrooms);
    const matchesMin = !filterMinPrice || p.rent_price >= Number(filterMinPrice);
    const matchesMax = !filterMaxPrice || p.rent_price <= Number(filterMaxPrice);
    const matchesCity = !filterCity || p.city === filterCity;
    const matchesArea = filterAreas.length === 0 || filterAreas.some((a) => p.address.toLowerCase().includes(a.toLowerCase()));
    return matchesQuery && matchesCategory && matchesBedrooms && matchesBathrooms && matchesMin && matchesMax && matchesCity && matchesArea;
  });

  return (
    <>
      <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      <AppHeader title="Properties" right={{ type: "notifications" }} />

      <div className="space-y-7 pb-4">

      {/* ── Search + Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4 }}
        className="flex items-center gap-3 px-5"
      >
        <div className="glass flex flex-1 items-center gap-2 rounded-2xl px-4 py-3">
          <Search size={17} className="shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("homeSearchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs text-muted-foreground">
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={openFilters}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm transition active:scale-95"
        >
          <SlidersHorizontal size={17} />
          {hasActiveFilters && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </motion.div>

      {/* ── Category pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-5 pb-1">
          {categoryDefs.map(({ value, icon: Icon }) => {
            const active = category === value;
            return (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                {value === "All" ? t("homeCategoryAll") : value}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="grid grid-cols-2 gap-3 px-5"
      >
        {/* Find Flatmate card */}
        <Link to="/flatmates" className="group">
          <div className="relative h-44 overflow-hidden rounded-[1.75rem] shadow-card transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-[0.97]">
            <img
              src="/flatmates-hero.jpg"
              alt="Find Flatmates"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/20 transition-opacity duration-200 group-hover:opacity-80" />
            <div className="absolute left-3.5 right-3.5 top-3.5 flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <HeartHandshake size={17} className="text-white" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors duration-200 group-hover:bg-white/35">
                <ArrowUpRight size={13} className="text-white" />
              </div>
            </div>
            <div className="absolute bottom-3.5 left-3.5">
              <p className="text-[11px] text-white/60">{t("homeDiscover")}</p>
              <p className="text-sm font-bold leading-tight text-white">{t("homeFindFlatmates")}</p>
            </div>
          </div>
        </Link>

        {/* AI Assistant card */}
        <Link to="/assistant" className="group">
          <div className="relative h-44 overflow-hidden rounded-[1.75rem] shadow-card transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-[0.97]">
            <img
              src="/ai-hero.jpg"
              alt="AI Assistant"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/20 transition-opacity duration-200 group-hover:opacity-80" />
            <div className="absolute left-3.5 right-3.5 top-3.5 flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Bot size={17} className="text-white" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-colors duration-200 group-hover:bg-white/35">
                <ArrowUpRight size={13} className="text-white" />
              </div>
            </div>
            <div className="absolute bottom-3.5 left-3.5">
              <p className="text-[11px] text-white/60">{t("homePoweredByAI")}</p>
              <p className="text-sm font-bold leading-tight text-white">{t("homeAIAssistant")}</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Filter Bottom Sheet ── */}
      {showFilters && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          {/* Panel */}
          <motion.div
            className="relative flex w-full max-h-[85vh] flex-col rounded-t-[2rem] bg-background shadow-card"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) setShowFilters(false);
            }}
          >
            {/* Sticky header */}
            <div className="shrink-0 px-6 pt-6 pb-4">
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setShowFilters(false)}
                className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border cursor-pointer hover:bg-muted-foreground/40 transition-colors"
              />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{t("filterTitle")}</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("filterClearAll")}
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto px-6 pb-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* City */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t("filterCity")}</p>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectDraftCity(city)}
                        className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                          draftCity === city
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area */}
                {draftCity && CITY_AREAS[draftCity] && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t("filterArea", { city: draftCity ?? "" })}</p>
                      {draftAreas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setDraftAreas([])}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t("filterClearAreas")}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CITY_AREAS[draftCity].map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleDraftArea(area)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            draftAreas.includes(area)
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                    {draftAreas.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("filterAllAreas", { city: draftCity ?? "" })}
                      </p>
                    )}
                  </div>
                )}

                {/* Bedrooms */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t("filterBedrooms")}</p>
                  <div className="flex gap-2">
                    {[null, 1, 2, 3, 4].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setDraftBedrooms(val)}
                        className={`flex-1 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all ${
                          draftBedrooms === val
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {val === null ? t("filterAny") : val === 4 ? "4+" : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t("filterBathrooms")}</p>
                  <div className="flex gap-2">
                    {[null, 1, 2, 3].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setDraftBathrooms(val)}
                        className={`flex-1 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all ${
                          draftBathrooms === val
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {val === null ? t("filterAny") : val === 3 ? "3+" : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t("filterPriceRange")}</p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder={t("filterMinPrice")}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-muted px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="number"
                      placeholder={t("filterMaxPrice")}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-muted px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer button */}
            <div className="shrink-0 px-6 pb-10 pt-4" onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={applyFilters}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                {t("filterShowResults")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Property grid ── */}
      <div className="space-y-4 px-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-lg font-bold">{t("homeTopProperty")}</h2>
          <Link to="/search" className="text-sm font-medium text-primary">
            {t("homeViewAll")}
          </Link>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            {t("homeNoProperties")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                saved={snapshot.savedProperties.some((s) => s.id === property.id)}
                onToggleSave={() => toggleSavedProperty(property)}
                onOpen={() => setSelectedProperty(property)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
