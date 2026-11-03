import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VEHICLES, POPULAR_LOCATIONS } from '../data/mockData';
import { 
  Truck, ShieldCheck, Clock, MapPin, CheckCircle, ArrowRight, 
  HelpCircle, Star, PhoneCall, Award, Layers 
} from 'lucide-react';

export default function TrucksMumbaiPage() {
  const navigate = useNavigate();
  const { setSelectedCity } = useApp();

  const mumbaiLocations = POPULAR_LOCATIONS['mumbai'];
  const [pickup, setPickup] = useState(mumbaiLocations[0].name);
  const [drop, setDrop] = useState(mumbaiLocations[1].name);
  const [selectedTruck, setSelectedTruck] = useState('tata-ace');

  const trucksList = VEHICLES.filter(v => v.category === 'truck');
  const shortName = (n) => n.replace(/\s*\(.*\)$/, '');

  const handleBookTruck = (e) => {
    e.preventDefault();
    setSelectedCity({ id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', isPopular: true });
    navigate('/fare-estimate', {
      state: {
        pickup: `${pickup}, Mumbai`,
        drop: `${drop}, Mumbai`,
        category: 'truck',
        selectedVehicleId: selectedTruck
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* MUMBAI HERO WITH FLUX.2 PHOTOREALISTIC BACKGROUND */}
      <section className="relative bg-slate-950 text-white py-14 px-4 sm:px-8 overflow-hidden border-b border-indigo-900/40">
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src="/images/mini-trucks-fleet.webp" 
            alt="Commercial Mini Trucks Fleet" 
            className="w-full h-full object-cover object-center opacity-30 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Dedicated Mini Truck Freight in Mumbai & MMR</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Instant Commercial Mini Trucks in Mumbai
            </h1>

            <p className="text-sm sm:text-base text-indigo-100 max-w-xl leading-relaxed">
              Book Tata Ace, 3-Wheelers & Pickup 8ft starting at ₹{fleetTariffs.find(v => v.category === 'truck')?.basePrice || 189}. Verified fleet partners for manufacturing supplies, wholesale goods, and bulk deliveries across Mumbai, Thane & Navi Mumbai.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Driver arrives in &lt;15 mins</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Live GPS Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Helper for loading available</span>
              </div>
            </div>
          </div>

          {/* Quick Mumbai Booking Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900">
              <h3 className="text-base font-black text-gray-900 mb-1">Book Mini Truck in Mumbai</h3>
              <p className="text-xs text-gray-500 mb-4">Instant vehicle dispatch across Mumbai metropolitan region</p>

              <form onSubmit={handleBookTruck} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Pickup Area
                  </label>
                  <select
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                  >
                    {mumbaiLocations.map((loc, i) => (
                      <option key={i} value={loc.name}>{loc.name} ({loc.area})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Drop Destination
                  </label>
                  <select
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                  >
                    {mumbaiLocations.map((loc, i) => (
                      <option key={i} value={loc.name}>{loc.name} ({loc.area})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Vehicle Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {trucksList.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTruck(t.id)}
                        className={`p-2 rounded-xl border text-center transition ${
                          selectedTruck === t.id
                            ? 'border-porter-blue bg-blue-50/70 text-porter-blue font-bold shadow-sm'
                            : 'border-gray-200 bg-gray-50 text-gray-700 text-xs font-medium'
                        }`}
                      >
                        <span className="block text-xs truncate">{shortName(t.name)}</span>
                        <span className="text-[10px] text-gray-400">from ₹{t.basePrice}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition mt-2"
                >
                  <span>See Live Mumbai Rates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* MUMBAI RATE CARD TABLE */}
      <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-3 py-1 rounded-full">
            Mumbai Fleet & Tariff
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Transparent Mini Truck Rates in Mumbai
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Standard tariffs applicable across Mumbai, Thane, Navi Mumbai, Mira-Bhayandar & Kalyan-Dombivli.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trucksList.map((truck) => (
            <div
              key={truck.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm card-hover flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {truck.tag}
                </span>

                <div className="h-28 flex items-center justify-center my-4">
                  <img src={truck.icon || truck.image} alt={truck.name} className="max-h-24 object-contain" />
                </div>

                <h3 className="text-base font-bold text-gray-900">{truck.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{truck.description}</p>

                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payload Capacity</span>
                    <span className="font-bold text-gray-800">{truck.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dimensions</span>
                    <span className="font-bold text-gray-800">{truck.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate per extra km</span>
                    <span className="font-bold text-gray-800">₹{truck.ratePerKm}/km</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">Base Fare (First 2km)</span>
                  <span className="text-lg font-black text-porter-blue">₹{truck.basePrice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/fare-estimate', { state: { category: 'truck', selectedVehicleId: truck.id } });
                  }}
                  className="w-full py-2.5 bg-porter-blue hover:bg-porter-hover text-white text-xs font-bold rounded-xl transition"
                >
                  Book {shortName(truck.name)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR MUMBAI COMMERCIAL CORRIDORS */}
      <section className="bg-white py-14 px-4 sm:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
            Top Commercial Delivery Routes in Mumbai
          </h2>
          <p className="text-xs text-gray-500 mb-8">
            Daily frequent mini truck routes with immediate driver availability:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { route: 'Bhiwandi Warehouses ⇄ Andheri MIDC', distance: '~38 km', ideal: 'Tata Ace & 14ft Truck' },
              { route: 'APMC Market Vashi ⇄ Dadar Flower Market', distance: '~22 km', ideal: '3 Wheeler & Tata Ace' },
              { route: 'Kalamboli Steel Market ⇄ Thane Wagle Estate', distance: '~29 km', ideal: 'Pickup 8ft' },
              { route: 'Lower Parel ⇄ BKC Bandra', distance: '~11 km', ideal: '3 Wheeler' },
              { route: 'Goregaon West ⇄ Borivali Industrial Area', distance: '~9 km', ideal: 'Tata Ace' },
              { route: 'Panvel ⇄ Ghatkopar East', distance: '~31 km', ideal: 'Pickup 8ft' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{item.route}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Approx. {item.distance} • Ideal: {item.ideal}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/fare-estimate')}
                  className="text-xs text-porter-blue font-bold hover:underline shrink-0 ml-2"
                >
                  Estimate →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
