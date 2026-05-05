import { useMemo } from "react";
import { Eye, PencilLine, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/features/properties/property-form";
import { useData } from "@/contexts/data-context";

export function LandlordDashboardPage() {
  const { snapshot, togglePropertyVisibility } = useData();
  const myProperties = useMemo(
    () => snapshot.featuredProperties.filter((property) => property.owner_id.startsWith("landlord")),
    [snapshot.featuredProperties]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Landlord"
        title="My properties"
        description="Track views, control listing visibility, and edit property details."
        action={
          <Button>
            <Plus size={16} />
            Add property
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {myProperties.map((property) => (
          <Card key={property.id} className="space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={property.image_urls[0]}
                alt={property.title}
                className="h-24 w-24 rounded-[1.5rem] object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{property.title}</h3>
                  <Badge>{property.city}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{property.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={14} />
                    {property.views_count ?? 0} views
                  </span>
                  <span>{property.is_visible ? "Visible" : "Hidden"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => togglePropertyVisibility(property.id)}>
                {property.is_visible ? "Hide listing" : "Show listing"}
              </Button>
              <Button variant="ghost" size="sm">
                <PencilLine size={14} />
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <PropertyForm />
    </div>
  );
}
