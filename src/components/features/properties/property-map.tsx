import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Property } from "@/types/supabase";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export function PropertyMap({
  properties,
  onSelect
}: {
  properties: Property[];
  onSelect: (property: Property) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border">
      <MapContainer
        center={[35.1264, 33.4299]}
        zoom={9}
        className="h-[26rem] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            eventHandlers={{ click: () => onSelect(property) }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{property.title}</p>
                <p>{property.city}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
