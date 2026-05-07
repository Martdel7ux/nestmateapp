import { Building2, Heart, MapPinned, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import type { Property } from "@/types/supabase";

export function PropertyCard({
  property,
  saved,
  onToggleSave,
  onOpen
}: {
  property: Property;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-60 overflow-hidden">
        {property.image_urls[0] ? (
          <img
            src={property.image_urls[0]}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const placeholder = e.currentTarget.parentElement?.querySelector(".img-placeholder") as HTMLElement | null;
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="img-placeholder absolute inset-0 items-center justify-center bg-muted"
          style={{ display: property.image_urls[0] ? "none" : "flex" }}
        >
          <Building2 size={40} className="text-muted-foreground/40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge>{property.city}</Badge>
          <Badge className="bg-white/85 text-slate-800">
            {property.available_to === "erasmus" ? "Erasmus / short-term" : "Full-time"}
          </Badge>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-900 backdrop-blur"
        >
          <Heart size={18} className={saved ? "fill-current text-rose-500" : ""} />
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{property.title}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinned size={14} />
              {property.address}
            </p>
          </div>
          <p className="text-lg font-bold text-primary">{currency(property.rent_price)}</p>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{property.description}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {property.bedrooms} bed • {property.bathrooms} bath
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {property.average_rating?.toFixed(1) ?? "New"}
          </span>
        </div>
        {property.owner?.is_verified_landlord && (
          <div className="flex items-center gap-1.5 text-xs text-sky-600">
            <ShieldCheck size={13} />
            <span>Verified landlord</span>
          </div>
        )}
        <Button className="w-full" onClick={onOpen}>
          View details
        </Button>
      </div>
    </Card>
  );
}
