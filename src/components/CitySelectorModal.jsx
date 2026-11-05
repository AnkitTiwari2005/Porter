import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES } from '../data/mockData';
import { Search, MapPin, X, Check } from 'lucide-react';

export default function CitySelectorModal() {
  const { isCityModalOpen, setIsCityModalOpen, selectedCity, setSelectedCity } = useApp();
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsCityModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setIsCityModalOpen]);

  if (!isCityModalOpen) return null;

  const filteredCities = CITIES.filter(city =>
    city.name.toLowerCase().includes(search.toLowerCase()) ||
    city.state.toLowerCase().includes(search.toLowerCase())
  );

  const popularCities = CITIES.filter(c => c.isPopular);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setIsCityModalOpen(false);
    setSearch('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Select Operational City</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose your city to view exact live fleet availability & tariffs</p>
          </div>
          <button
            onClick={() => setIsCityModalOpen(false)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Mumbai, Bangalore, Delhi, Hyderabad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* City Lists */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-6">
          {/* Popular Cities Quick Grid */}
          {!search && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Major Logistics Hubs
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {popularCities.map((city) => {
                  const isSelected = selectedCity?.id === city.id;
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected 
                          ? 'border-porter-blue bg-blue-50/60 text-porter-blue font-bold shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-porter-blue text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate w-full">{city.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Cities List */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {search ? 'Search Results' : 'All Serviced Cities'}
            </p>
            <div className="space-y-1">
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between transition text-left ${
                      isSelected 
                        ? 'bg-blue-50 text-porter-blue font-bold' 
                        : 'hover:bg-gray-50 text-gray-700 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-4 h-4 ${isSelected ? 'text-porter-blue' : 'text-gray-400'}`} />
                      <div>
                        <span className="text-xs block text-gray-900">{city.name}</span>
                        <span className="text-[10px] text-gray-400">{city.state}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-porter-blue" />}
                  </button>
                );
              })}

              {filteredCities.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">
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
