"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface FeederLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: number; // 0 = normal, 1 = alert, 2 = critical
  load_kw: number;
}

export interface FlexRequestLocation {
  id: string;
  feederId: string;
  lat: number;
  lng: number;
  flexRequested: number;
  status: string;
}

interface FeederMapProps {
  feeders: FeederLocation[];
  requests?: FlexRequestLocation[];
  selectedFeederId?: string | null;
  onFeederClick?: (feederId: string) => void;
}

// Custom marker icons based on state
const createFeederIcon = (state: number) => {
  const color = state === 2 ? "#DC2626" : state === 1 ? "#F59E0B" : "#10B981";
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" 
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const createRequestIcon = () => {
  const svgIcon = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="#fff" stroke-width="2"/>
      <path d="M10 5 L10 11 L13 11" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: "custom-request-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

// Component to handle map centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function FeederMap({
  feeders,
  requests = [],
  selectedFeederId,
  onFeederClick,
}: FeederMapProps) {
  const [mounted, setMounted] = useState(false);

  // Only render map on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] border border-slate-800 rounded-xl bg-[#02091F] flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    );
  }

  // Center on Islington, London
  const center: [number, number] = [51.5465, -0.1058];

  return (
    <div className="w-full h-[400px] border border-slate-800 rounded-xl overflow-hidden relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapController center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Feeder markers */}
        {feeders.map((feeder) => (
          <Marker
            key={feeder.id}
            position={[feeder.lat, feeder.lng]}
            icon={createFeederIcon(feeder.state)}
            eventHandlers={{
              click: () => onFeederClick?.(feeder.id),
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-slate-900">{feeder.name}</p>
                <p className="text-slate-600">ID: {feeder.id}</p>
                <p className="text-slate-600">Load: {feeder.load_kw.toFixed(1)} kW</p>
                <p className="text-slate-600">
                  Status: {feeder.state === 2 ? "Critical" : feeder.state === 1 ? "Alert" : "Normal"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Request markers */}
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.lat, request.lng]}
            icon={createRequestIcon()}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold text-slate-900">Flex Request</p>
                <p className="text-slate-600">ID: {request.id}</p>
                <p className="text-slate-600">Feeder: {request.feederId}</p>
                <p className="text-slate-600">Requested: {request.flexRequested} kW</p>
                <p className="text-slate-600">Status: {request.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 text-[10px] z-[1000]">
        <p className="font-semibold text-slate-100 mb-1.5">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10B981] border border-white"></div>
            <span className="text-slate-300">Normal feeder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B] border border-white"></div>
            <span className="text-slate-300">Alert feeder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#DC2626] border border-white"></div>
            <span className="text-slate-300">Critical feeder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6] border border-white"></div>
            <span className="text-slate-300">Flex request</span>
          </div>
        </div>
      </div>
    </div>
  );
}
