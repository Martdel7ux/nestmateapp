import { useState } from "react";
import { LayoutGrid, Map } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyFilters } from "@/components/features/properties/property-filters";
import { PropertyCard } from "@/components/features/properties/property-card";
import { PropertyMap } from "@/components/features/properties/property-map";
import { PropertyDetailModal } from "@/components/features/properties/property-detail-modal";
import { useData } from "@/contexts/data-context";
import type { Property } from "@/types/supabase";

export function SearchPage() {
  const {
    filteredProperties,
    propertyFilters,
    setPropertyFilters,
    snapshot,
    toggleSavedProperty
  } = useData();
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Search"
        title="Browse Cyprus student rentals"
        description="Filter by city, price, bedroom count, and student type, or describe what you want naturally."
        action={
          <div className="flex gap-2">
            <Button variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>
              <LayoutGrid size={16} />
            </Button>
            <Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}>
              <Map size={16} />
            </Button>
          </div>
        }
      />

      <PropertyFilters
        filters={propertyFilters}
        onChange={(patch) => setPropertyFilters({ ...propertyFilters, ...patch })}
        onSmartSearch={(query) => {
          const normalized = query.toLowerCase();
          setPropertyFilters({
            ...propertyFilters,
            city: normalized.includes("nicosia")
              ? "Nicosia"
              : normalized.includes("limassol")
                ? "Limassol"
                : undefined,
            maxPrice: normalized.includes("cheap") ? 600 : propertyFilters.maxPrice,
            studentType: normalized.includes("erasmus") ? "erasmus" : propertyFilters.studentType
          });
        }}
      />

      {view === "grid" ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              saved={snapshot.savedProperties.some((item) => item.id === property.id)}
              onToggleSave={() => toggleSavedProperty(property)}
              onOpen={() => setSelectedProperty(property)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-3">
          <PropertyMap properties={filteredProperties} onSelect={setSelectedProperty} />
        </Card>
      )}

      <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />
    </div>
  );
}
