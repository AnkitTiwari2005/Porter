import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { api } from '../lib/api';

const DOT = { emerald: 'bg-emerald-500', rose: 'bg-rose-500', amber: 'bg-amber-500' };

// onChange(text): the text box changed.  onSelect(place | null): a place with coordinates was chosen, or null once the
// user edits the text again (so stale coordinates are never sent with different text).
export default function LocationSearchInput({
  label, value, onChange, onSelect,
  placeholder = 'Enter address or landmark',
  dotColor = 'emerald', cityId = 'mumbai', cityName = 'Mumbai', popularLocations = []
}) {
  const inputId = useId();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [active, setActive] = useState(-1);
  const containerRef = useRef(null);
  const typedRef = useRef(false); // only search for text the user typed, not for text we filled in ourselves

  useEffect(() => {
    const onDown = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    const q = (value || '').trim();
    if (!typedRef.current || q.length < 3) { setRemote([]); setLoading(false); return undefined; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/geo/autocomplete?q=${encodeURIComponent(q)}&cityId=${encodeURIComponent(cityId)}`, { signal: ctrl.signal });
        setRemote(r.results || []);
      } catch (e) {
        if (e.name !== 'AbortError') setRemote([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value, cityId]);

  const localMatches = useMemo(() => {
    const q = (value || '').toLowerCase();
    return (q ? popularLocations.filter((l) => l.name.toLowerCase().includes(q) || l.area?.toLowerCase().includes(q)) : popularLocations).slice(0, 6);
  }, [value, popularLocations]);

  // Server results first (they have real coordinates), then curated hubs, without duplicates.
  const options = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of remote) { const k = r.label.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push({ label: r.label, lat: r.lat, lng: r.lng, source: 'search' }); } }
    for (const l of localMatches) {
      const label = l.name.includes(cityName) ? l.name : `${l.name}, ${cityName}`;
      const k = label.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push({ label, lat: l.lat, lng: l.lng, area: l.area, source: 'hub' }); }
    }
    return out;
  }, [remote, localMatches, cityName]);

  const choose = (opt) => {
    typedRef.current = false;
    onChange(opt.label);
    onSelect?.({ address: opt.label, lat: opt.lat, lng: opt.lng });
    setIsOpen(false);
    setActive(-1);
  };

  const useGps = () => {
    setGpsError('');
    if (!navigator.geolocation) { setGpsError('Location is not supported on this device.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        try {
          const r = await api.get(`/geo/reverse?lat=${lat}&lng=${lng}&cityId=${encodeURIComponent(cityId)}`);
          if (r.result?.label) address = r.result.label;
        } catch { /* keep the coordinate label */ }
        choose({ label: address, lat, lng });
      },
      () => { setGpsError('Could not read your location. Allow location access or type an address.'); setIsOpen(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIsOpen(true); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
    else if (e.key === 'Enter' && isOpen && active >= 0 && options[active]) { e.preventDefault(); choose(options[active]); }
    else if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={inputId} className="text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer">
            <span className={`w-2.5 h-2.5 rounded-full ${DOT[dotColor] || 'bg-blue-500'}`} />
            <span>{label}</span>
          </label>
          <button type="button" onClick={useGps} className="text-[11px] font-semibold text-porter-blue hover:underline flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>Use GPS</span>
          </button>
        </div>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => { typedRef.current = true; onChange(e.target.value); onSelect?.(null); setIsOpen(true); setActive(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear address"
            onClick={() => { typedRef.current = false; onChange(''); onSelect?.(null); setIsOpen(true); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto animate-fadeIn">
          <button type="button" onClick={useGps} className="w-full text-left px-4 py-2 hover:bg-blue-50/70 transition flex items-center gap-2.5 text-xs text-porter-blue font-bold border-b border-gray-100">
            <div className="w-6 h-6 rounded-lg bg-blue-100/70 flex items-center justify-center shrink-0"><Navigation className="w-3.5 h-3.5" /></div>
            <span>Use current location (GPS)</span>
          </button>
          {gpsError && <p className="px-4 py-2 text-[11px] text-rose-600">{gpsError}</p>}

          <ul id={listId} role="listbox" aria-label="Address suggestions">
            {options.map((o, i) => (
              <li key={`${o.label}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => choose(o)}
                  className={`w-full text-left px-4 py-2 transition flex items-center gap-2.5 text-xs ${i === active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-semibold text-gray-800 block truncate">{o.label}</span>
                    {o.area && <span className="text-[10px] text-gray-400">{o.area}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {loading && <p className="px-4 py-2 text-[11px] text-gray-400">Searching…</p>}
          {!loading && options.length === 0 && (value || '').trim().length >= 3 && (
            <p className="px-4 py-3 text-xs text-gray-500">No matches yet. Keep typing, or pick a nearby landmark.</p>
          )}
        </div>
      )}
    </div>
  );
}
