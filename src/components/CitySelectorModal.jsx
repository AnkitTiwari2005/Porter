import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES } from '../data/mockData';
import { Search, MapPin, X, Check } from 'lucide-react';

export default function CitySelectorModal() {
  const { isCityModalOpen, setIsCityModalOpen, selectedCity, setSelectedCity } = useApp();
  const [search, setSearch] = useState('');

  if (!isCityModalOpen) return null;

  const filteredCities = CITIES.filter(city =>
    city.name.toLowerCase().includes(search.toLowerCase()) ||
    city.state.toLowerCase().includes(search.toLowerCase())
  );

  const popularCities = CITIES.filter(c => c.isPopular);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setIsCityModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-porter-blue">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Choose Your City</h3>
              <p className="text-xs text-gray-500">Service availability and local rates depend on selected city</p>
            </div>
          </div>
          <button
            onClick={() => setIsCityModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city or state name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {!search && (
            <div className="mb-5">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Popular Cities</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                {popularCities.map((city) => {
                  const isSelected = selectedCity?.id === city.id;
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
                        isSelected
                          ? 'border-porter-blue bg-blue-50/70 text-porter-blue'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{city.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-porter-blue shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {search ? 'Matching Cities' : 'All Serviced Cities'}
            </span>
            <div className="divide-y divide-gray-100 mt-2">
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 text-left transition"
                  >
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-porter-blue' : 'text-gray-800'}`}>
                        {city.name}
                      </p>
                      <p className="text-xs text-gray-400">{city.state}</p>
                    </div>
                    {isSelected ? (
                      <span className="text-xs bg-blue-100 text-porter-blue font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Select →</span>
                    )}
                  </button>
                );
              })}
              {filteredCities.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No cities found matching "{search}".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
