import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create custom SVG markers so we don't depend on external PNG files
const createCustomIcon = (bgColor, label, isTruck = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        width: ${isTruck ? '36px' : '28px'};
        height: ${isTruck ? '36px' : '28px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${isTruck ? '14px' : '11px'};
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${label}
      </div>
    `,
    iconSize: isTruck ? [36, 36] : [28, 28],
    iconAnchor: isTruck ? [18, 18] : [14, 14]
  });
};

const pickupIcon = createCustomIcon('#10b981', 'P');
const dropIcon = createCustomIcon('#f43f5e', 'D');
const stopIcon = createCustomIcon('#f59e0b', 'S');
const truckIcon = createCustomIcon('#4338ca', '🚚', true);

// Component to dynamically fit bounds of the visible points
function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

// The default OpenStreetMap tile server is for light use only (see its tile usage policy).
// For production traffic set VITE_MAP_TILE_URL (and VITE_MAP_ATTRIBUTION) to a tile provider you have an account with.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// driverCoord is a REAL position reported by the driver's phone; the vehicle marker is only drawn when it exists.
export default function InteractiveMap({
  pickupCoord,
  dropCoord,
  stopCoord = null,
  routeLine = null,
  driverCoord = null,
  pickupLabel = 'Pickup',
  dropLabel = 'Drop',
  stopLabel = 'Stop',
  driverLabel = 'Driver',
  height = '360px'
}) {
  // Real road geometry from the routing provider when we have it; otherwise a plain line between the points.
  const line = useMemo(() => {
    if (routeLine && routeLine.length > 1) return routeLine;
    return stopCoord ? [pickupCoord, stopCoord, dropCoord] : [pickupCoord, dropCoord];
  }, [routeLine, pickupCoord, dropCoord, stopCoord]);

  const fitPoints = useMemo(() => {
    const pts = stopCoord ? [pickupCoord, stopCoord, dropCoord] : [pickupCoord, dropCoord];
    return driverCoord ? [...pts, driverCoord] : pts;
  }, [pickupCoord, dropCoord, stopCoord, driverCoord]);

  return (
    <div style={{ height }} className="w-full relative isolate rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <MapContainer center={pickupCoord} zoom={12} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

        <Polyline positions={line} pathOptions={{ color: '#1e1b4b', weight: 6, opacity: 0.25 }} />
        <Polyline positions={line} pathOptions={{ color: '#4338ca', weight: 4, opacity: 0.95 }} />

        <Marker position={pickupCoord} icon={pickupIcon}>
          <Popup><div className="text-xs"><strong className="text-emerald-700">Pickup</strong><p>{pickupLabel}</p></div></Popup>
        </Marker>

        {stopCoord && (
          <Marker position={stopCoord} icon={stopIcon}>
            <Popup><div className="text-xs"><strong className="text-amber-700">Stop</strong><p>{stopLabel}</p></div></Popup>
          </Marker>
        )}

        <Marker position={dropCoord} icon={dropIcon}>
          <Popup><div className="text-xs"><strong className="text-rose-700">Drop</strong><p>{dropLabel}</p></div></Popup>
        </Marker>

        {driverCoord && (
          <Marker position={driverCoord} icon={truckIcon}>
            <Popup><div className="text-xs"><strong className="text-porter-blue">{driverLabel}</strong><p>Live location</p></div></Popup>
          </Marker>
        )}

        <MapBoundsUpdater points={fitPoints} />
      </MapContainer>

      {driverCoord && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold">Live driver location</span>
        </div>
      )}
    </div>
  );
}
