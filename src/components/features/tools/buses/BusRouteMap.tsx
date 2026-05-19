import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GtfsStopWithSeq, GtfsShapePoint } from "@/types/gtfs";
import { routeBgColor } from "@/types/gtfs";

function RecenterMap({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], zoom); }, [lat, lon, zoom, map]);
  return null;
}

interface Props {
  shape:          GtfsShapePoint[];
  stops:          GtfsStopWithSeq[];
  routeColor:     string;
  centerLat?:     number;
  centerLon?:     number;
  onStopClick?:   (stop: GtfsStopWithSeq) => void;
  selectedStopId?: string | null;
}

const NICOSIA_LAT = 35.1667;
const NICOSIA_LON = 33.3667;

export function BusRouteMap({
  shape, stops, routeColor, centerLat, centerLon, onStopClick, selectedStopId,
}: Props) {
  const polyline = shape.map((p): [number, number] => [p.lat, p.lon]);
  const color    = routeBgColor(routeColor);

  // Default center: midpoint of shape, or Nicosia
  const midIdx   = Math.floor(polyline.length / 2);
  const defLat   = centerLat ?? (polyline[midIdx]?.[0] ?? NICOSIA_LAT);
  const defLon   = centerLon ?? (polyline[midIdx]?.[1] ?? NICOSIA_LON);

  return (
    <div className="rounded-2xl overflow-hidden border border-border" style={{ height: 260 }}>
      <MapContainer
        center={[defLat, defLon]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={defLat} lon={defLon} zoom={13} />

        {/* Route polyline */}
        {polyline.length > 1 && (
          <Polyline positions={polyline} color={color} weight={4} opacity={0.85} />
        )}

        {/* Stop markers */}
        {stops.map((stop) => {
          const isSelected = selectedStopId === stop.stop_id;
          return (
            <CircleMarker
              key={stop.stop_id}
              center={[stop.stop_lat, stop.stop_lon]}
              radius={isSelected ? 9 : 6}
              pathOptions={{
                color:       isSelected ? '#f59e0b' : color,
                fillColor:   isSelected ? '#f59e0b' : '#ffffff',
                fillOpacity: 1,
                weight:      isSelected ? 3 : 2,
              }}
              eventHandlers={{ click: () => onStopClick?.(stop) }}
            >
              <Popup>
                <span className="text-xs font-semibold">{stop.stop_name}</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
