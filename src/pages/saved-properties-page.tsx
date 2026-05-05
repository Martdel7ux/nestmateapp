import { PageHeader } from "@/components/layout/page-header";
import { PropertyCard } from "@/components/features/properties/property-card";
import { useData } from "@/contexts/data-context";

export function SavedPropertiesPage() {
  const { snapshot, toggleSavedProperty } = useData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saved"
        title="Saved properties"
        description="Your shortlist stays one tap away for quick comparisons and follow-up."
      />
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {snapshot.savedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            saved
            onToggleSave={() => toggleSavedProperty(property)}
            onOpen={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
