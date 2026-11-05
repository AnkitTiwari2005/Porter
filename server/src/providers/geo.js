import { CITY_COORDINATES, haversineKm } from '../../../shared/cities.js';

const ROAD_FACTOR = 1.32; // straight-line to road-distance estimate, only for the offline provider
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function createLocal() {
  const cityPlaces = (cityId) => Object.entries((CITY_COORDINATES[cityId] || CITY_COORDINATES.mumbai).locations).map(([name, [lat, lng]]) => ({ name, lat, lng }));
  return {
    name: 'local',
    async autocomplete(q, cityId) {
      const n = norm(q);
      return cityPlaces(cityId).filter((p) => norm(p.name).includes(n)).slice(0, 6).map((p) => ({ label: `${p.name}`, lat: p.lat, lng: p.lng }));
    },
    async geocode(address, cityId) {
      const n = norm(address);
      const first = norm(String(address).split(',')[0]);
      const places = cityPlaces(cityId);
      const hit = places.find((p) => n.includes(norm(p.name))) || (first.length >= 4 ? places.find((p) => norm(p.name).includes(first)) : null);
      return hit ? { label: hit.name, lat: hit.lat, lng: hit.lng } : null;
    },
    async reverse(lat, lng, cityId) {
      const near = cityPlaces(cityId).map((p) => ({ p, d: haversineKm([lat, lng], [p.lat, p.lng]) })).sort((a, b) => a.d - b.d)[0];
      return near ? { label: `Near ${near.p.name}`, lat, lng } : null;
    },
    async route(from, to) {
      const km = haversineKm(from, to) * ROAD_FACTOR;
      return { km: Math.max(1, Number(km.toFixed(1))), minutes: Math.round((km / 22) * 60), line: [from, to], approximate: true };
    }
  };
}

function createMapbox(config, fetchImpl) {
  const t = config.MAPBOX_TOKEN;
  const get = async (url) => {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`mapbox ${res.status}`);
    return res.json();
  };
  const feature = (f) => ({ label: f.place_name, lat: f.center[1], lng: f.center[0] });
  const proximity = (cityId) => {
    const c = (CITY_COORDINATES[cityId] || CITY_COORDINATES.mumbai).center;
    return `${c[1]},${c[0]}`;
  };
  return {
    name: 'mapbox',
    async autocomplete(q, cityId) {
      const j = await get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${t}&country=in&autocomplete=true&limit=6&proximity=${proximity(cityId)}`);
      return (j.features || []).map(feature);
    },
    async geocode(address, cityId) {
      const j = await get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${t}&country=in&limit=1&proximity=${proximity(cityId)}`);
      return j.features?.[0] ? feature(j.features[0]) : null;
    },
    async reverse(lat, lng) {
      const j = await get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${t}&limit=1`);
      return j.features?.[0] ? { ...feature(j.features[0]), lat, lng } : null;
    },
    async route(from, to) {
      const j = await get(`https://api.mapbox.com/directions/v5/mapbox/driving/${from[1]},${from[0]};${to[1]},${to[0]}?access_token=${t}&geometries=geojson&overview=simplified`);
      const r = j.routes?.[0];
      if (!r) throw new Error('no route');
      return { km: Number((r.distance / 1000).toFixed(1)), minutes: Math.round(r.duration / 60), line: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), approximate: false };
    }
  };
}

// Wraps a provider so any failure degrades to the offline estimate instead of blocking bookings.
export function createGeo(config, { fetchImpl = fetch, log = console } = {}) {
  const local = createLocal();
  if (config.GEO_PROVIDER !== 'mapbox') return local;
  const remote = createMapbox(config, fetchImpl);
  const safe = (name) => async (...args) => {
    try { return await remote[name](...args); }
    catch (e) { log.warn?.({ err: e.message }, `geo ${name} failed, using offline fallback`); return local[name](...args); }
  };
  return { name: 'mapbox', autocomplete: safe('autocomplete'), geocode: safe('geocode'), reverse: safe('reverse'), route: safe('route') };
}
