import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { POPULAR_LOCATIONS, FAQS, TESTIMONIALS } from '../data/mockData';
import LocationSearchInput from '../components/LocationSearchInput';
import { 
  Truck, Bike, Package, Home, MapPin, ArrowRight, ShieldCheck, 
  Clock, Award, Star, ChevronDown, CheckCircle2, QrCode, PhoneCall, Check, Briefcase 
} from 'lucide-react';

export default function HomePage() {
  const { selectedCity, setIsCityModalOpen, fleetTariffs } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('trucks'); // 'trucks' | 'two-wheeler' | 'packers' | 'parcel'
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const cityLocations = POPULAR_LOCATIONS[selectedCity.id] || POPULAR_LOCATIONS['mumbai'];

  const handleQuickEstimate = (e) => {
    e.preventDefault();
    if (activeTab === 'packers') {
      navigate('/packers-and-movers', {
        state: {
          pickup: pickup || (cityLocations[0] ? `${cityLocations[0].name}, ${selectedCity.name}` : ''),
          drop: drop || (cityLocations[1] ? `${cityLocations[1].name}, ${selectedCity.name}` : '')
        }
      });
      return;
    }
    if (activeTab === 'parcel') {
      navigate('/all-india-parcel');
      return;
    }
    navigate('/fare-estimate', {
      state: {
        pickup: pickup || (cityLocations[0] ? `${cityLocations[0].name}, ${selectedCity.name}` : ''),
        drop: drop || (cityLocations[1] ? `${cityLocations[1].name}, ${selectedCity.name}` : ''),
        category: activeTab === 'two-wheeler' ? 'bike' : 'truck'
      }
    });
  };

  const handleSelectQuickLocation = (loc, type) => {
    const fullLoc = `${loc.name}, ${selectedCity.name}`;
    if (type === 'pickup') setPickup(fullLoc);
    else setDrop(fullLoc);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* HERO SECTION WITH DYNAMIC VIDEO/PHOTO BACKGROUND & RADIANT EFFECTS */}
      <section className="relative bg-[#070b14] text-white overflow-hidden py-14 md:py-24 px-4 sm:px-8 border-b border-indigo-900/30">
        {/* Layer 1: Looping Video + Photorealistic Fallback Image */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Looping ambient highway video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero-logistics-bg.webp"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-90 contrast-110 animate-slow-zoom opacity-50"
          >
            <source src="/videos/hero-traffic.webm" type="video/webm" />
            <source src="/videos/hero-traffic.mp4" type="video/mp4" />
          </video>

          {/* High-detail FLUX fallback photo backing */}
          <img 
            src="/images/hero-logistics-bg.webp" 
            alt="Portex Logistics High-Speed Highway Network" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-screen pointer-events-none"
          />

          {/* Radiant Ambient Color Orbs */}
          <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-indigo-600/30 blur-[130px] animate-ambient-glow pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none"></div>
          <div className="absolute -bottom-24 right-1/4 w-[480px] h-[480px] rounded-full bg-blue-500/25 blur-[140px] pointer-events-none"></div>

          {/* Precision Digital Tech Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none"></div>

          {/* Multi-angle cinematic gradient masks */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/75 to-[#070b14]/40 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-[#070b14]/60 pointer-events-none"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-950/70 backdrop-blur-md border border-indigo-400/30 text-xs font-semibold text-indigo-200 shadow-lg shadow-indigo-950/50">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20"></span>
              <span className="tracking-wide">Available across {selectedCity?.name || 'Mumbai'} & 19+ Indian Cities</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
              High-Speed Freight & Delivery, <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent drop-shadow-sm">
                At the Tap of a Button
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              India's next-generation on-demand logistics network. Instant mini trucks, quick city 2-wheelers, and verified home shifting across 19+ cities with upfront guaranteed fares.
            </p>

            {/* Portex Performance Pillars with Elevated Glass Style */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
              <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="font-display text-2xl sm:text-3xl font-black text-white block">12 Mins</span>
                <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mt-0.5 block">Avg. Pickup</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="font-display text-2xl sm:text-3xl font-black text-white block">2.4 Cr+</span>
                <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mt-0.5 block">Km Delivered</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <span className="font-display text-2xl sm:text-3xl font-black text-emerald-400 block">99.6%</span>
                <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mt-0.5 block">Safe Transit</span>
              </div>
            </div>
          </div>

          {/* Right Hero Booking Card - Ultra Premium Glassmorphic */}
          <div className="lg:col-span-6">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-gray-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.6)] border border-white/70 relative">
              {/* Subtle top indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Instant Fleet Dispatch
                </span>
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(true)}
                  className="text-porter-blue font-bold flex items-center gap-1 hover:underline group"
                >
                  <MapPin className="w-3.5 h-3.5 text-porter-blue group-hover:scale-110 transition-transform" />
                  <span>{selectedCity?.name} (Change City)</span>
                </button>
              </div>

              {/* Service Tab Switcher */}
              <div className="grid grid-cols-4 gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('trucks')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'trucks'
                      ? 'bg-porter-blue text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1" />
                  <span>Trucks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('two-wheeler')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'two-wheeler'
                      ? 'bg-porter-blue text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Bike className="w-4 h-4 mb-1" />
                  <span>2 Wheeler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('packers')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'packers'
                      ? 'bg-porter-blue text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Home className="w-4 h-4 mb-1" />
                  <span>Packers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('parcel')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'parcel'
                      ? 'bg-porter-blue text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Package className="w-4 h-4 mb-1" />
                  <span>All India</span>
                </button>
              </div>

              {/* Booking Inputs Form */}
              <form onSubmit={handleQuickEstimate} className="space-y-4">
                {/* Smart Autocomplete Pickup input */}
                <LocationSearchInput
                  label="Pickup Location"
                  value={pickup}
                  onChange={setPickup}
                  placeholder={`Search pickup address or landmark in ${selectedCity.name}...`}
                  dotColor="emerald"
                  cityName={selectedCity.name}
                  popularLocations={cityLocations}
                />

                {/* Smart Autocomplete Drop input */}
                <LocationSearchInput
                  label="Drop Location"
                  value={drop}
                  onChange={setDrop}
                  placeholder={`Search drop destination in ${selectedCity.name}...`}
                  dotColor="rose"
                  cityName={selectedCity.name}
                  popularLocations={cityLocations}
                />

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6366f1] hover:from-[#3730a3] hover:to-[#4338ca] text-white rounded-2xl font-bold font-display text-sm tracking-wide shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Check Live Fare & Book</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* OUR SERVICES SECTION WITH FLUX.2 PHOTOREALISTIC PREVIEWS */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            Logistics On Demand
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-3">
            Our Core Logistics Solutions
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Hassle-free goods transportation and delivery solutions tailored for individual needs and businesses of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: City Mini Trucks */}
          <Link
            to="/trucks-mumbai"
            className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img 
                  src="/images/mini-trucks-fleet.webp" 
                  alt="City Mini Trucks Fleet" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 backdrop-blur-md text-porter-blue px-2.5 py-1 rounded-full shadow-sm">
                  Tata Ace & Pickups
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                  <span>City Mini Trucks</span>
                  <Truck className="w-5 h-5 text-indigo-600" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Tata Ace, 3-Wheelers & Pickup 8ft for business transport, furniture moving and bulk merchandise.
                </p>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-100">
                  Base fare starts at ₹189
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
                <span>View Fleet & Rates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: 2-Wheeler Instant Courier */}
          <Link
            to="/two-wheelers-mumbai"
            className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img 
                  src="/images/courier-bike-express.webp" 
                  alt="2-Wheeler Express Courier" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 backdrop-blur-md text-emerald-700 px-2.5 py-1 rounded-full shadow-sm">
                  Instant Hyperlocal
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                  <span>Two-Wheelers</span>
                  <Bike className="w-5 h-5 text-emerald-600" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Reliable goods transportation services for up to 20 kg. Instant pickup within 15 minutes.
                </p>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-100">
                  Fares starting at ₹42
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
                <span>Send a Package</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Packers & Movers */}
          <Link
            to="/packers-and-movers"
            className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img 
                  src="/images/packers-hero.webp" 
                  alt="Packers & Movers Shifting" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 backdrop-blur-md text-purple-700 px-2.5 py-1 rounded-full shadow-sm">
                  Complete Home Shifting
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                  <span>Packers & Movers</span>
                  <Home className="w-5 h-5 text-purple-600" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  House shifting made effortless. Multi-layer packing, carpenter dismantling, safe transit & room setup.
                </p>
                <div className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg w-fit border border-purple-100">
                  Verified moving experts
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
                <span>Book House Shift</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 4: All-India Parcel */}
          <Link
            to="/all-india-parcel"
            className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img 
                  src="/images/all-india-logistics.webp" 
                  alt="All India Parcel Courier" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 backdrop-blur-md text-blue-700 px-2.5 py-1 rounded-full shadow-sm">
                  19,000+ Pincodes
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                  <span>All India Parcel</span>
                  <Package className="w-5 h-5 text-blue-600" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Doorstep intercity shipping with surface and priority air cargo. Real-time milestone tracking nationwide.
                </p>
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg w-fit border border-blue-100">
                  Air & Surface Delivery
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
                <span>Send Intercity Parcel</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 5: Portex Enterprise */}
          <Link
            to="/enterprise"
            className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-44 md:h-full w-full overflow-hidden bg-slate-900">
                <img 
                  src="/images/enterprise-logistics.webp" 
                  alt="Portex Enterprise Logistics" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 backdrop-blur-md text-amber-700 px-2.5 py-1 rounded-full shadow-sm">
                  Dedicated Corporate Fleet
                </span>
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                    <span>{BRANDING.name} Enterprise</span>
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Streamline intra-city supply chains and multi-drop delivery routes with centralized corporate billing, dedicated SLAs, and API dispatch integrations.
                  </p>
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-fit border border-amber-100 mb-4">
                    Custom Contracts & 30-Day Billing
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
                  <span>Explore Enterprise Solutions</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* VEHICLE FLEET & TARIFF SPECIFICATIONS */}
      <section className="bg-white py-16 px-4 sm:px-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-porter-blue">Fleet Variety</span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                Choose the Right Vehicle for Your Load
              </h2>
            </div>
            <Link
              to="/fare-estimate"
              className="text-xs font-bold text-porter-blue hover:underline flex items-center gap-1"
            >
              <span>Calculate exact fare estimate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleetTariffs.map((v) => (
              <div
                key={v.id}
                className="bg-gray-50/70 hover:bg-white rounded-2xl p-6 border border-gray-200 hover:border-porter-blue/50 hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-porter-blue">
                      {v.tag}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Avg. {v.etaMinutes} mins away</span>
                  </div>

                  <div className="h-28 flex items-center justify-center my-3">
                    <img 
                      src={v.icon || v.image} 
                      alt={v.name} 
                      className="max-h-24 max-w-full object-contain filter drop-shadow-sm" 
                    />
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{v.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-200/60 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Payload Capacity</span>
                      <span className="font-bold text-gray-800">{v.capacity}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Cargo Dimensions</span>
                      <span className="font-bold text-gray-800">{v.dimensions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Base Price</span>
                    <span className="text-lg font-black text-porter-blue">₹{v.basePrice}</span>
                    <span className="text-[11px] text-gray-500"> (incl. 2 km)</span>
                  </div>

                  <Link
                    to="/fare-estimate"
                    state={{ selectedVehicleId: v.id }}
                    className="px-4 py-2 bg-porter-blue hover:bg-porter-hover text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    Select & Estimate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PORTEX / PROPOSITIONS */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              The {BRANDING.name} Advantage
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 leading-snug">
              Why Modern Indian Logistics Runs on {BRANDING.name}
            </h2>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              Say goodbye to roadside haggling and unreliable fleet arrival times. Benefit from automated driver allocation, real-time telemetry, and 100% transparent itemized invoicing.
            </p>

            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">100% Algorithmic Rate Transparency</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Guaranteed upfront rate cards covering base fare, fuel, and helpers with zero surge spikes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Rapid 12-Minute Partner Allocation</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Over 50,000 screened commercial trucks and EV two-wheelers stationed across key industrial hubs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Live Telemetry & Contactless OTP Delivery</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Share live trip link with receivers for turn-by-turn tracking and tamper-proof OTP handover.</p>
                </div>
              </div>
            </div>
          </div>

          {/* App download card with updated Indigo-Obsidian gradient & Portex App Icon */}
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-900/50">
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Mobile On-Demand</span>
                <img 
                  src={BRANDING.appIcon} 
                  alt="Portex Mobile App Icon" 
                  className="w-14 h-14 rounded-2xl shadow-xl ring-2 ring-indigo-400/40 hover:scale-110 transition-transform" 
                />
              </div>
              <h3 className="text-2xl font-black">Ship & Track Cargo with the {BRANDING.name} App</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Book mini trucks or courier bikes with one tap. Scan the QR code with your smartphone camera to install immediately on Android & iOS.
              </p>

              <div className="flex items-center gap-6 pt-2">
                <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0">
                  <img src="/images/qr_code_6ac327e0fa.png" alt="Scan QR" className="w-24 h-24 object-contain" />
                  <span className="text-[10px] text-gray-800 font-bold block text-center mt-1">Scan to Install</span>
                </div>

                <div className="space-y-3">
                  <a href="https://play.google.com/store/apps/details?id=com.theporter.android.customerapp" target="_blank" rel="noreferrer" className="block">
                    <img src="/images/googleplay_419e81f188.png" alt="Play Store" className="h-11 hover:scale-105 transition-transform" />
                  </a>
                  <a href="https://apps.apple.com/in/app/porter-trucks-bike-delivery/id1451296307" target="_blank" rel="noreferrer" className="block">
                    <img src="/images/appstore_1ca72680f5.png" alt="App Store" className="h-11 hover:scale-105 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS ACCORDION (MATCHING AUTHENTIC EXTRACTED FAQS) */}
      <section className="py-16 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-porter-blue">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left font-bold text-xs sm:text-sm text-gray-800 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-porter-blue' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs text-gray-500 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
