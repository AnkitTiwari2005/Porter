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
      {/* HERO SECTION WITH AUTHENTIC PORTER BANNER */}
      <section className="relative bg-gradient-to-r from-[#002884] via-[#0a57ff] to-[#001f66] text-white overflow-hidden py-12 md:py-20 px-4 sm:px-8">
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Available across {selectedCity?.name || 'Mumbai'} & 19+ Indian Cities</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Delivery Aapki, <br />
              <span className="text-yellow-300">Transport Hamara</span>
            </h1>

            <p className="text-base sm:text-lg text-blue-100 max-w-xl font-normal leading-relaxed">
              India's leading on-demand goods transport platform. Book mini trucks, 3-wheelers, and two-wheelers for hassle-free business logistics and home shifting.
            </p>

            {/* Porter Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20 max-w-lg">
              <div>
                <span className="text-xl sm:text-2xl font-black text-white block">15 Mins</span>
                <span className="text-xs text-blue-200">Avg. Driver Arrival</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-white block">1.5 Cr+</span>
                <span className="text-xs text-blue-200">Trips Delivered</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-white block">500,000+</span>
                <span className="text-xs text-blue-200">Driver Partners</span>
              </div>
            </div>
          </div>

          {/* Right Hero Booking Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-gray-900 border border-gray-100">
              {/* Service Tab Switcher */}
              <div className="grid grid-cols-4 gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('trucks')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition ${
                    activeTab === 'trucks'
                      ? 'bg-white text-porter-blue shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1" />
                  <span>Trucks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('two-wheeler')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition ${
                    activeTab === 'two-wheeler'
                      ? 'bg-white text-porter-blue shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Bike className="w-4 h-4 mb-1" />
                  <span>2 Wheeler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('packers')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition ${
                    activeTab === 'packers'
                      ? 'bg-white text-porter-blue shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-4 h-4 mb-1" />
                  <span>Packers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('parcel')}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition ${
                    activeTab === 'parcel'
                      ? 'bg-white text-porter-blue shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4 mb-1" />
                  <span>All India</span>
                </button>
              </div>

              {/* Booking Inputs Form */}
              <form onSubmit={handleQuickEstimate} className="space-y-4">
                {/* City reminder */}
                <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
                  <span className="font-semibold text-gray-700">Booking in:</span>
                  <button
                    type="button"
                    onClick={() => setIsCityModalOpen(true)}
                    className="text-porter-blue font-bold flex items-center gap-1 hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedCity?.name} (Change City)</span>
                  </button>
                </div>

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
                    className="w-full py-4 bg-porter-blue hover:bg-porter-hover text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition"
                  >
                    <span>Check Live Fare & Book</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* OUR SERVICES SECTION */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-3 py-1 rounded-full">
            Logistics On Demand
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Our Services
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Hassle-free goods transportation and delivery solutions tailored for individual needs and businesses of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: City Mini Trucks */}
          <Link
            to="/trucks-mumbai"
            className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm card-hover flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-porter-blue flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <img src="/images/Tata_Ace_5fd23cdaf0.svg" alt="Mini Trucks" className="w-9 h-9 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">City Mini Trucks</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Tata Ace, 3-Wheelers & Pickup 8ft for business transport, furniture moving and bulk merchandise.
              </p>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                Base fare starts at ₹189
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
              <span>View Fleet & Rates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: 2-Wheeler Instant Courier */}
          <Link
            to="/two-wheelers-mumbai"
            className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm card-hover flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <img src="/images/2_wheeler_5624a12e03_cd20b2a174.svg" alt="2 Wheeler" className="w-9 h-9 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">Two-Wheelers</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Reliable goods transportation services for up to 20 kg. Instant pickup within 15 minutes.
              </p>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                Fares starting at ₹42
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
              <span>Send a Package</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Packers & Movers */}
          <Link
            to="/packers-and-movers"
            className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm card-hover flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Home className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">Packers & Movers</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                House shifting hai? #HoJayega. Safe packing, dismantling, loading, and unpacking for 1, 2, 3 BHK homes.
              </p>
              <div className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md w-fit">
                Verified moving experts
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
              <span>Book House Shift</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Porter Enterprise */}
          <Link
            to="/enterprise"
            className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm card-hover flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Briefcase className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">{BRANDING.name} Enterprise</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Streamline intra-city supply chains and multi-drop delivery routes with centralized corporate billing and APIs.
              </p>
              <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md w-fit">
                Corporate Billing & SLA
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-porter-blue">
              <span>Enterprise Logistics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

      {/* WHY PORTER / PROPOSITIONS */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-3 py-1 rounded-full">
              Why Choose {BRANDING.name}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 leading-snug">
              Smart, Transparent & Reliable Logistics Across India
            </h2>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              No bargaining with roadside drivers. Get instant verified drivers, accurate GPS tracking, and transparent upfront fare quotes.
            </p>

            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Guaranteed Transparent Pricing</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Upfront price calculation with zero surge surprises or roadside price negotiations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Fast 15-Minute Driver Dispatch</h4>
                  <p className="text-xs text-gray-500 mt-0.5">With over 500,000 driver partners, a vehicle is always stationed near your location.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Real-Time Live GPS Tracking</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Share live trip link with receivers for contactless delivery and secure OTP verification.</p>
                </div>
              </div>
            </div>
          </div>

          {/* App download card */}
          <div className="bg-gradient-to-br from-porter-navy to-porter-blue rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Mobile App</span>
              <h3 className="text-2xl font-black">Get the {BRANDING.name} App for Instant 1-Tap Booking</h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Scan the QR code with your phone camera or download directly from Google Play Store or Apple App Store.
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
