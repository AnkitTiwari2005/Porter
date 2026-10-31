import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BRANDING } from '../config/branding';

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
const dropIcon = createCustomIcon('#ef4444', 'D');
const stopIcon = createCustomIcon('#f59e0b', 'S');
const truckIcon = createCustomIcon('#0a57ff', '🚚', true);

// Component to dynamically fit bounds of both points
function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

export default function InteractiveMap({
  pickupCoord = [19.1197, 72.8464], // Default: Andheri
  dropCoord = [19.0664, 72.8687],   // Default: BKC
  stopCoord = null,
  pickupLabel = 'Pickup Point',
  dropLabel = 'Drop Destination',
  stopLabel = 'Intermediate Stop 1',
  showVehicle = true,
  vehicleProgress = 0.5, // 0 to 1
  height = '360px',
  onMarkerDrag
}) {
  // Interpolate vehicle position along the route for real-time simulation
  const vehicleCoord = useMemo(() => {
    const lat = pickupCoord[0] + (dropCoord[0] - pickupCoord[0]) * vehicleProgress;
    const lng = pickupCoord[1] + (dropCoord[1] - pickupCoord[1]) * vehicleProgress;
    return [lat, lng];
  }, [pickupCoord, dropCoord, vehicleProgress]);

  // Intermediate simulated route points to give a road curve look
  const routePoints = useMemo(() => {
    if (stopCoord) {
      return [pickupCoord, stopCoord, dropCoord];
    }
    const midLat = (pickupCoord[0] + dropCoord[0]) / 2 + 0.005;
    const midLng = (pickupCoord[1] + dropCoord[1]) / 2 - 0.005;
    return [
      pickupCoord,
      [midLat, midLng],
      dropCoord
    ];
  }, [pickupCoord, dropCoord, stopCoord]);

  const allPoints = useMemo(() => {
    return stopCoord ? [pickupCoord, stopCoord, dropCoord] : [pickupCoord, dropCoord];
  }, [pickupCoord, dropCoord, stopCoord]);

  return (
    <div style={{ height }} className="w-full relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <MapContainer
        center={pickupCoord}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline in Porter Royal Blue */}
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#002884', weight: 6, opacity: 0.25 }}
        />
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#0a57ff', weight: 4, dashArray: '6, 8', opacity: 0.95 }}
        />

        {/* Pickup Marker */}
        <Marker position={pickupCoord} icon={pickupIcon}>
          <Popup>
            <div className="text-xs">
              <strong className="text-emerald-700">Pickup Location:</strong>
              <p>{pickupLabel}</p>
            </div>
          </Popup>
        </Marker>

        {/* Optional Multi-drop Stop Marker */}
        {stopCoord && (
          <Marker position={stopCoord} icon={stopIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-amber-700">Stop 1 (Intermediate):</strong>
                <p>{stopLabel}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop Marker */}
        <Marker position={dropCoord} icon={dropIcon}>
          <Popup>
            <div className="text-xs">
              <strong className="text-rose-700">Destination:</strong>
              <p>{dropLabel}</p>
            </div>
          </Popup>
        </Marker>

        {/* Live Moving Vehicle */}
        {showVehicle && (
          <Marker position={vehicleCoord} icon={truckIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-porter-blue">{BRANDING.name} Fleet Partner</strong>
                <p>Telemetry: Active (Speed ~32 km/h)</p>
              </div>
            </Popup>
          </Marker>
        )}

        <MapBoundsUpdater points={allPoints} />
      </MapContainer>

      {/* Floating map telemetry badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="font-semibold">Live GPS Telemetry</span>
      </div>
    </div>
  );
}
