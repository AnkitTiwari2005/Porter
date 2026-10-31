import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { POPULAR_LOCATIONS } from '../data/mockData';
import { 
  Home, CheckCircle2, ShieldCheck, Calendar, ArrowRight, 
  Box, Sparkles, Award, Clock, Phone, MapPin, Check 
} from 'lucide-react';

export default function PackersMoversPage() {
  const navigate = useNavigate();
  const { selectedCity, addBooking, setActiveTrackingOrderId } = useApp();

  const cityLocations = POPULAR_LOCATIONS[selectedCity.id] || POPULAR_LOCATIONS['mumbai'];

  const [houseSize, setHouseSize] = useState('1bhk'); // '1rk' | '1bhk' | '2bhk' | '3bhk' | 'few'
  const [pickup, setPickup] = useState(cityLocations[0]?.name || 'Andheri West');
  const [drop, setDrop] = useState(cityLocations[1]?.name || 'Powai Hiranandani');
  const [moveDate, setMoveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [hasLiftPickup, setHasLiftPickup] = useState(true);
  const [hasLiftDrop, setHasLiftDrop] = useState(true);
  const [needDismantling, setNeedDismantling] = useState(true);
  const [isBooked, setIsBooked] = useState(false);

  const houseOptions = [
    { id: '1rk', label: '1 RK / Studio', base: 3200, items: '1 Bed, 1 Wardrobe, 5-8 Boxes, Fridge' },
    { id: '1bhk', label: '1 BHK Apartment', base: 4900, items: '1 Queen Bed, Sofa, Dining, Fridge, TV, 10-15 Boxes' },
    { id: '2bhk', label: '2 BHK Apartment', base: 7800, items: '2 Beds, 5-seater Sofa, Full Kitchen, 20-25 Boxes' },
    { id: '3bhk', label: '3 BHK / Villa', base: 11900, items: '3 Beds, Living Room, Appliances, ACs, 30+ Boxes' },
    { id: 'few', label: 'Few Items / Mini Shift', base: 1800, items: '1-3 Furniture pieces or appliance only' }
  ];

  const currentOption = houseOptions.find(h => h.id === houseSize) || houseOptions[1];

  const estimatedFare = useMemo(() => {
    let price = currentOption.base;
    if (!hasLiftPickup) price += 400; // Extra stairs carrying
    if (!hasLiftDrop) price += 400;
    if (needDismantling) price += 600; // Carpenter disassembly
    return price;
  }, [currentOption, hasLiftPickup, hasLiftDrop, needDismantling]);

  const handleBookShifting = (e) => {
    e.preventDefault();
    const orderId = addBooking({
      pickup: `${pickup}, ${selectedCity.name}`,
      drop: `${drop}, ${selectedCity.name}`,
      distance: 16.5,
      vehicle: {
        name: `Packers & Movers (${currentOption.label})`,
        id: 'packers-movers',
        icon: '/images/trucks_india_a42dcdfc61.webp'
      },
      fare: estimatedFare,
      senderName: 'Ankit Sharma',
      senderPhone: '+91 98765 43210',
      receiverName: 'Ankit Sharma',
      receiverPhone: '+91 98765 43210',
      goodsType: `House Shifting (${currentOption.label})`
    });

    setIsBooked(orderId);
    setActiveTrackingOrderId(orderId);
    setTimeout(() => {
      navigate('/track');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner with Portex Palette */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/50">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{BRANDING.name} Verified Relocation Specialists</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              Relocating Your Home? <br />
              <span className="text-amber-400">Zero-Stress Shifting</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Complete multi-layer bubble wrapping, skilled carpenter dismantling, reliable transportation, and careful room-by-room unpacking at your new home in {selectedCity.name}.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Hidden Charges</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Damage Free Transit Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Free Rescheduling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shifting Configuration & Estimate Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Select House Size & Options */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: House Size */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-porter-blue" />
                <span>1. Select Shifting Size</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {houseOptions.map((opt) => {
                  const isSelected = houseSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHouseSize(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-porter-blue bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-gray-900">{opt.label}</h4>
                          {isSelected && <span className="w-4 h-4 rounded-full bg-porter-blue text-white flex items-center justify-center text-[10px] font-bold">✓</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{opt.items}</p>
                      </div>
                      <span className="text-xs font-black text-porter-blue mt-3">From ₹{opt.base}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Route & Move Date */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-porter-blue" />
                <span>2. Shifting Locations & Moving Date</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Current House (Pickup)</label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">New House (Destination)</label>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Moving Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Add-on Logistics Options */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900">3. Building Floor & Service Options</h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100/60">
                  <span>Elevator / Lift Available at Current Home</span>
                  <input
                    type="checkbox"
                    checked={hasLiftPickup}
                    onChange={(e) => setHasLiftPickup(e.target.checked)}
                    className="w-4 h-4 accent-porter-blue rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100/60">
                  <span>Elevator / Lift Available at New Home</span>
                  <input
                    type="checkbox"
                    checked={hasLiftDrop}
                    onChange={(e) => setHasLiftDrop(e.target.checked)}
                    className="w-4 h-4 accent-porter-blue rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100/60">
                  <span>Carpenter Bed / Wardrobe Dismantling & Re-assembly (+₹600)</span>
                  <input
                    type="checkbox"
                    checked={needDismantling}
                    onChange={(e) => setNeedDismantling(e.target.checked)}
                    className="w-4 h-4 accent-porter-blue rounded"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-lg sticky top-20 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Quote Breakdown</h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  {currentOption.label}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base Shifting Package</span>
                  <span className="font-bold text-gray-900">₹{currentOption.base}</span>
                </div>
                <div className="flex justify-between">
                  <span>Multi-layer Bubble Wrap & Packing</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                {needDismantling && (
                  <div className="flex justify-between">
                    <span>Carpenter Dismantling & Assembly</span>
                    <span className="font-bold text-gray-900">₹600</span>
                  </div>
                )}
                {(!hasLiftPickup || !hasLiftDrop) && (
                  <div className="flex justify-between">
                    <span>Manual Stairs Carrying Assistance</span>
                    <span className="font-bold text-gray-900">₹{(!hasLiftPickup ? 400 : 0) + (!hasLiftDrop ? 400 : 0)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-black text-gray-900 block">Total Package</span>
                    <span className="text-[11px] text-gray-400">All taxes & labor included</span>
                  </div>
                  <span className="text-2xl font-black text-purple-700">₹{estimatedFare}</span>
                </div>
              </div>

              {isBooked ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm text-gray-900">Slot Booked: #{isBooked}</p>
                  <p className="text-xs text-gray-500">Redirecting to Live Trip Tracker...</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBookShifting}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition"
                >
                  <span>Book House Shifting Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>₹50,000 Goods Transit Insurance Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
