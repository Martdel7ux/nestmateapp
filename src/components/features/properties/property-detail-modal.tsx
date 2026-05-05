import { Mail, MapPinned, MessageCircleMore, Phone, ShieldCheck, Star } from "lucide-react";
import { universityCoordinates } from "@/lib/constants";
import { currency } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useData } from "@/contexts/data-context";
import type { Property } from "@/types/supabase";

export function PropertyDetailModal({
  property,
  onClose
}: {
  property: Property | null;
  onClose: () => void;
}) {
  const { snapshot } = useData();
  const propertyReviews = snapshot.reviews.filter((review) => review.property_id === property?.id);

  if (!property) return null;

  const university = snapshot.profile.university
    ? universityCoordinates[snapshot.profile.university]
    : null;

  const distanceKm = university
    ? (
        Math.sqrt(
          (university.lat - property.latitude) ** 2 +
            (university.lng - property.longitude) ** 2
        ) * 111
      ).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-lg">
      <div className="mx-auto max-w-5xl">
        <Card className="space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-3xl">{property.title}</h2>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinned size={16} />
                {property.address}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {property.image_urls.map((image) => (
              <img
                key={image}
                src={image}
                alt={property.title}
                className="h-60 w-full rounded-[1.75rem] object-cover"
              />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{property.city}</Badge>
                <Badge className="bg-white/85 text-slate-900">
                  {currency(property.rent_price)} / month
                </Badge>
                <Badge className="bg-success/15 text-accent">
                  {property.bedrooms} bed • {property.bathrooms} bath
                </Badge>
                {distanceKm ? (
                  <Badge className="bg-primary/10 text-primary">
                    {distanceKm} km to {snapshot.profile.university}
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground">{property.description}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <a className="rounded-3xl bg-muted/60 p-4 text-sm" href={`tel:${property.phone}`}>
                  <Phone className="mb-2" size={16} />
                  {property.phone ?? "No phone"}
                </a>
                <a className="rounded-3xl bg-muted/60 p-4 text-sm" href={`mailto:${property.email}`}>
                  <Mail className="mb-2" size={16} />
                  {property.email ?? "No email"}
                </a>
                <div className="rounded-3xl bg-muted/60 p-4 text-sm">
                  <MessageCircleMore className="mb-2" size={16} />
                  {property.has_whatsapp ? "WhatsApp available" : "No WhatsApp"}
                </div>
              </div>
              <Card className="space-y-3 bg-card/60">
                <p className="font-semibold">AI review summary</p>
                <p className="text-sm text-muted-foreground">
                  {propertyReviews.length
                    ? "Reviewers highlight responsive hosts, practical layouts, and a student-friendly location."
                    : "No reviews yet. Once reviews arrive, the edge function can summarize them here."}
                </p>
                <div className="space-y-2">
                  {propertyReviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-muted/40 p-3 text-sm">
                      <p className="font-medium">{review.user?.full_name}</p>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="space-y-4 bg-card/70">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={property.owner?.full_name ?? "Landlord"}
                    src={property.owner?.avatar_url}
                    className="h-14 w-14"
                  />
                  <div>
                    <p className="font-semibold">{property.owner?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{property.owner?.bio}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary">
                    <Star size={12} className="fill-current" />
                    {property.average_rating?.toFixed(1) ?? "New host"}
                  </Badge>
                  {property.owner?.is_verified_landlord ? (
                    <Badge className="bg-sky-500/10 text-sky-600">
                      <ShieldCheck size={12} />
                      Verified landlord
                    </Badge>
                  ) : null}
                </div>
              </Card>
              <div className="overflow-hidden rounded-[1.75rem] border border-border">
                <iframe
                  title="Property map"
                  src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                  className="h-64 w-full"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
