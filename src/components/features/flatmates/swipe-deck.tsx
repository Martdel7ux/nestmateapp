import { useMemo, useState } from "react";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import { useData } from "@/contexts/data-context";

export function SwipeDeck() {
  const { filteredFlatmates, swipeFlatmate } = useData();
  const [index, setIndex] = useState(0);
  const [matchName, setMatchName] = useState<string | null>(null);
  const current = filteredFlatmates[index];

  const budget = useMemo(() => {
    if (!current) return "";
    return `${currency(current.min_budget)} - ${currency(current.max_budget)}`;
  }, [current]);

  if (!current) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-2xl">No more flatmates in this stack</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust your filters or add more listing data through Supabase.
        </p>
      </Card>
    );
  }

  const handleSwipe = (direction: "left" | "right") => {
    const result = swipeFlatmate(current.id, direction);
    if (direction === "right" && result?.profile?.full_name) {
      setMatchName(result.profile.full_name);
      window.setTimeout(() => setMatchName(null), 1800);
    }
    setIndex((currentIndex) => currentIndex + 1);
  };

  return (
    <div className="relative space-y-4">
      <AnimatePresence>
        {matchName ? (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-slate-950/75 text-white backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <p className="font-display text-4xl">It&apos;s a Match!</p>
              <p className="mt-2 text-sm text-slate-200">
                You and {matchName} can now start chatting.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        key={current.id}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative h-[28rem]">
          <img
            src={current.profile_image_url ?? current.apartment_images[0]}
            alt={current.profile?.full_name ?? "Flatmate"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-4 p-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white">{current.preferred_city}</Badge>
              <Badge className="bg-white/15 text-white">{budget}</Badge>
              <Badge className="bg-white/15 text-white">
                {current.housing_status === "has_flat" ? "Has a flat" : "Seeking a flat"}
              </Badge>
            </div>
            <div>
              <h3 className="font-display text-3xl">
                {current.profile?.full_name ?? "Flatmate"}
              </h3>
              <p className="mt-2 text-sm text-slate-200">{current.bio}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {current.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-100"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-center gap-4">
        <Button size="icon" variant="outline" onClick={() => handleSwipe("left")}>
          <X size={18} />
        </Button>
        <Button size="icon" onClick={() => handleSwipe("right")}>
          <Heart size={18} />
        </Button>
      </div>
    </div>
  );
}
