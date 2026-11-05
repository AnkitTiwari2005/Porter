import { POPULAR_LOCATIONS } from './mockData';
import { CITY_COORDINATES } from '../../shared/cities.js';

// Coordinates database for Indian cities and key local areas
export { CITY_COORDINATES };

// Haversine distance calculator between 2 coordinates in km
export function calculateGeoDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 12.5;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Road tortuosity multiplier (~1.32x for Indian urban streets)
  const roadDistance = straightLine * 1.32;
  return Math.max(1.5, Number(roadDistance.toFixed(1)));
}

// Suggestion list for a city: curated hubs if present, else derived from the coordinate table.
export function getCityLocations(cityId) {
  if (POPULAR_LOCATIONS[cityId]) return POPULAR_LOCATIONS[cityId];
  const city = CITY_COORDINATES[cityId];
  if (!city) return [];
  return Object.entries(city.locations).map(([name, [lat, lng]]) => ({ name, area: name, lat, lng }));
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Deterministic lookup: GPS text -> curated hub -> coordinate table -> city centre.
// (No random jitter: the same input always gives the same pin.)
export function getCoordinatesForAddress(addressText, cityId = 'mumbai') {
  const city = CITY_COORDINATES[cityId] || CITY_COORDINATES.mumbai;
  if (!addressText) return city.center;

  const gps = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(addressText);
  if (gps) return [parseFloat(gps[1]), parseFloat(gps[2])];

  const text = norm(addressText);
  for (const loc of getCityLocations(cityId)) {
    if (text.includes(norm(loc.name))) return [loc.lat, loc.lng];
  }
  for (const [key, coords] of Object.entries(city.locations)) {
    if (text.includes(norm(key))) return coords;
  }
  return city.center;
}
