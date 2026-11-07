import React, { useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { getCityLocations } from '../data/geoData';
import { 
  Bike, Zap, ShieldCheck, Clock, CheckCircle2, ArrowRight, 
  MapPin, Sparkles, FileText, ShoppingBag, Key, Package 
} from 'lucide-react';

export default function TwoWheelersPage() {
  usePageTitle('2-wheeler delivery');
  const navigate = useNavigate();
  const { selectedCity, fleetTariffs } = useApp();

  const cityLocations = getCityLocations(selectedCity.id);
  const [pickup, setPickup] = useState(cityLocations[0]?.name || '');
  const [drop, setDrop] = useState(cityLocations[1]?.name || '');
  const [useEv, setUseEv] = useState(false);


  const handleBookBike = (e) => {
    e.preventDefault();
    navigate('/fare-estimate', {
      state: {
        pickup: `${pickup}, ${selectedCity.name}`,
        drop: `${drop}, ${selectedCity.name}`,
        category: 'bike',
        selectedVehicleId: useEv ? 'two-wheeler-ev' : 'two-wheeler'
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 2-WHEELER HERO WITH FLUX.2 PHOTOREALISTIC BACKGROUND */}
      <section className="relative bg-slate-950 text-white py-14 px-4 sm:px-8 overflow-hidden border-b border-emerald-950/40">
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src="/images/courier-bike-express.webp" 
            alt="Express Courier Delivery Rider" 
            className="w-full h-full object-cover object-center opacity-30 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-950/80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Hyperlocal 2-Wheeler Delivery • Across {selectedCity.name}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Rapid Hyperlocal Courier for Parcels up to 20 kg
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 max-w-xl leading-relaxed">
              Send essentials across {selectedCity.name} in minutes. Starting at just ₹{fleetTariffs.find(v => v.category === 'bike')?.basePrice || 42}. Ideal for business contracts, forgotten keys, medicines, food packages, and retail consignments.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Pickup in &lt;15 mins</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Secure OTP Handover</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Eco-friendly EV option</span>
              </div>
            </div>
          </div>

          {/* Quick Bike Booking Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-gray-900">Send a Package by Bike</h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Up to 20 kg
                </span>
              </div>

              <form onSubmit={handleBookBike} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Pickup Point
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Drop Destination
                  </label>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* EV option toggle */}
                <div 
                  onClick={() => setUseEv(!useEv)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    useEv ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <p className="text-xs font-bold">Prefer Electric Bike (EV)</p>
                      <p className="text-[10px] text-gray-500">Zero tailpipe emissions & ₹7 lower base fare</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs ${
                    useEv ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300'
                  }`}>
                    {useEv ? '✓' : ''}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition mt-2"
                >
                  <span>Get Bike Fare Estimate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN SEND */}
      <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Popular Use Cases
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            What Can You Send with {BRANDING.name} 2-Wheeler?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Urgent Documents & Cheques', desc: 'Contracts, invoices, bank forms with OTP security', icon: FileText },
            { title: 'Forgotten Items & Keys', desc: 'Chargers, keys, spectacles, lunch boxes delivered instantly', icon: Key },
            { title: 'E-commerce & Retail', desc: 'Deliver products to customers within 45 minutes', icon: ShoppingBag },
            { title: 'Medicines & Medical Reports', desc: 'Critical prescriptions delivered from chemist to home', icon: Package }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BIKE COMPARISON CARDS */}
      <section className="bg-white py-14 px-4 sm:px-8 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {BRANDING.name} 2-Wheeler vs. Traditional Courier
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500/40 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  ✓
                </span>
                <h4 className="text-sm font-bold text-emerald-950">{BRANDING.name} 2-Wheeler Hyperlocal</h4>
              </div>

              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pickup within <strong>15 minutes</strong> from doorstep</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Delivered directly within <strong>45-60 mins</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live <strong>GPS route map</strong> & driver contact</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Rates starting from just <strong>₹{fleetTariffs.find(v => v.category === 'bike')?.basePrice || 42}</strong></span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4 opacity-80">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gray-400 text-white font-bold flex items-center justify-center text-xs">
                  ✕
                </span>
                <h4 className="text-sm font-bold text-gray-800">Traditional Courier Companies</h4>
              </div>

              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <span>• Same-day cutoff limits or next-day scheduled pickup</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• Takes 24 to 48 hours for local delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• Multiple intermediate hub sorting transfers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>• High weight slab charges and packaging hurdles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
