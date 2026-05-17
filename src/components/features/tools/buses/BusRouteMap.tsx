import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { BusRoute } from "@/types/tools";

// Fix Leaflet default marker icon in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const startIcon = new L.Icon({
  iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function RecenterMap({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], zoom); }, [lat, lon, zoom, map]);
  return null;
}

interface Props {
  routes: BusRoute[];
  centerLat: number;
  centerLon: number;
}

const LINE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];

export function BusRouteMap({ routes, centerLat, centerLon }: Props) {
  const routesWithStops = routes.filter((r) => r.stops && r.stops.length > 0);

  return (
    <div className="rounded-2xl overflow-hidden border border-border" style={{ height: 240 }}>
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={centerLat} lon={centerLon} zoom={13} />

        {routesWithStops.map((route, routeIdx) => {
          const stops = [...(route.stops ?? [])].sort((a, b) => a.stop_order - b.stop_order);
          const coords = stops
            .filter((s) => s.latitude != null && s.longitude != null)
            .map((s) => [s.latitude!, s.longitude!] as [number, number]);
          const color = LINE_COLORS[routeIdx % LINE_COLORS.length];

          return (
            <span key={route.id}>
              {coords.length > 1 && (
                <Polyline positions={coords} color={color} weight={3} opacity={0.8} />
              )}
              {stops.filter((s) => s.latitude && s.longitude).map((stop, idx) => (
                <Marker
                  key={stop.id}
                  position={[stop.latitude!, stop.longitude!]}
                  icon={idx === 0 || idx === stops.length - 1 ? startIcon : new L.Icon({
                    iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="5" fill="${encodeURIComponent(color)}"/></svg>`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                  })}
                >
                  <Popup>{stop.stop_name}</Popup>
                </Marker>
              ))}
            </span>
          );
        })}
      </MapContainer>
    </div>
  );
}
