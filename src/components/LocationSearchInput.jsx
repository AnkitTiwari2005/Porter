import React, { useState, useRef, useEffect, useId } from 'react';
import { MapPin, Navigation, X, Check, Search } from 'lucide-react';

export default function LocationSearchInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address or landmark',
  dotColor = 'emerald', // 'emerald' | 'rose' | 'amber'
  cityName = 'Mumbai',
  popularLocations = []
}) {
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dotClasses = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500'
  };

  const filteredLocations = value
    ? popularLocations.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase()) ||
        loc.area?.toLowerCase().includes(value.toLowerCase())
      )
    : popularLocations;

  const handleSelect = (locName, locObj) => {
    const fullText = locName.includes(cityName) ? locName : `${locName}, ${cityName}`;
    onChange(fullText);
    if (onSelect) onSelect(fullText, locObj);
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locText = `Current GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          onChange(locText);
          if (onSelect) {
            onSelect(locText, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
          setIsOpen(false);
        },
        () => {
          // Fallback if denied or unavailable
          if (popularLocations[0]) {
            handleSelect(popularLocations[0].name, popularLocations[0]);
          }
        }
      );
    } else if (popularLocations[0]) {
      handleSelect(popularLocations[0].name, popularLocations[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={inputId} className="text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer">
            <span className={`w-2.5 h-2.5 rounded-full ${dotClasses[dotColor] || 'bg-blue-500'}`}></span>
            <span>{label}</span>
          </label>
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="text-[11px] font-semibold text-porter-blue hover:underline flex items-center gap-1"
          >
            <Navigation className="w-3 h-3 text-porter-blue" />
            <span>Use GPS</span>
          </button>
        </div>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto animate-fadeIn">
          {/* Use GPS option */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="w-full text-left px-4 py-2 hover:bg-blue-50/70 transition flex items-center gap-2.5 text-xs text-porter-blue font-bold border-b border-gray-100"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-100/70 flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5 text-porter-blue" />
            </div>
            <span>Use Current Location (GPS)</span>
          </button>

          {filteredLocations.length > 0 ? (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {value ? `Matching places in ${cityName}` : `Popular Hubs in ${cityName}`}
              </div>
              {filteredLocations.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(loc.name, loc)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-porter-blue transition-colors shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800">{loc.name}</p>
                      {loc.area && (
                        <p className="text-[10px] text-gray-400">{loc.area}, {cityName}</p>
                      )}
                    </div>
                  </div>
                  {value && loc.name.toLowerCase().includes(value.toLowerCase()) && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Match
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">"{value}"</p>
              <button
                type="button"
                onClick={() => handleSelect(value, null)}
                className="text-[11px] text-porter-blue font-bold hover:underline mt-1 block"
              >
                Use this exact address in {cityName} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
