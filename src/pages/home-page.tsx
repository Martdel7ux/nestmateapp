import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bell, Bot, Building2, Grid2X2, Heart, HeartHandshake, Landmark, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { currency } from "@/lib/utils";
import type { Property } from "@/types/supabase";

const categories = [
  { label: "All", icon: Grid2X2 },
  { label: "Nicosia", icon: Building2 },
  { label: "Limassol", icon: Building2 },
  { label: "Larnaca", icon: Landmark },
  { label: "Paphos", icon: Building2 },
] as const;

type Category = (typeof categories)[number]["label"];

function PropertyCard({
  property,
  saved,
  onToggleSave,
}: {
  property: Property;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[2rem] shadow-card"
    >
      <img
        src={property.image_urls[0]}
        alt={property.title}
        className="h-80 w-full object-cover"
      />

      {/* Heart */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm transition active:scale-95"
      >
        <Heart
          size={18}
          className={saved ? "fill-rose-500 text-rose-500" : "text-slate-500"}
        />
      </button>

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pb-5 pt-16">
        <div className="mb-1 flex items-center gap-1 text-[11px] text-white/70">
          <MapPin size={11} />
          {property.city}
        </div>
        <h3 className="text-lg font-bold leading-tight text-white">{property.title}</h3>
        <div className="mt-1 mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {currency(property.rent_price)}<span className="text-white/60">/mo</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-white/80">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {property.average_rating != null ? property.average_rating.toFixed(1) : "New"} reviews
          </span>
        </div>

        {/* Details pill */}
        <div className="flex items-center justify-between rounded-full bg-white/15 px-5 py-3 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">See Property Details</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30">
            <span className="text-white text-sm">›</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const { snapshot, toggleSavedProperty } = useData();
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");

  const firstName = snapshot.profile.full_name?.split(" ")[0] ?? "there";
  const userCity = snapshot.profile.city ?? "Cyprus";
  const unread = snapshot.notifications.filter((n) => !n.is_read).length;

  const filtered = snapshot.featuredProperties.filter((p) => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || p.city === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pt-5">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-xs text-muted-foreground">Good day</p>
          <p className="text-lg font-bold">Hello, {firstName}</p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={11} />
            <span>{userCity}, Cyprus</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <Link
            to="/notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-muted shadow-sm"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        </motion.div>
      </div>

      {/* ── Hero text ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="px-5"
      >
        <h1 className="text-[2rem] leading-[1.2] tracking-tight">
          Explore{" "}
          <span className="font-extrabold">Modern Student</span>
          <br />
          <span className="font-extrabold">Homes Near You</span>
        </h1>
      </motion.div>

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
            placeholder="Search city or property…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs text-muted-foreground">
              ✕
            </button>
          )}
        </div>
        <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm transition active:scale-95">
          <SlidersHorizontal size={17} />
        </button>
      </motion.div>

      {/* ── Category pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-5 pb-1">
          {categories.map(({ label, icon: Icon }) => {
            const active = category === label;
            return (
              <button
                key={label}
                onClick={() => setCategory(label)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                {label}
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
            {/* Faint overlay — lightens slightly on hover */}
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
              <p className="text-[11px] text-white/60">Discover</p>
              <p className="text-sm font-bold leading-tight text-white">Find Flatmates</p>
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
              <p className="text-[11px] text-white/60">Powered by AI</p>
              <p className="text-sm font-bold leading-tight text-white">AI Assistant</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Top Property ── */}
      <div className="space-y-4 px-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-lg font-bold">Top Property</h2>
          <Link to="/search" className="text-sm font-medium text-primary">
            View All
          </Link>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No properties match your search.
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                saved={snapshot.savedProperties.some((s) => s.id === property.id)}
                onToggleSave={() => toggleSavedProperty(property)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
