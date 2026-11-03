import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Package, Plane, Truck, ShieldCheck, MapPin, 
  Clock, ArrowRight, CheckCircle2, Check, Scale 
} from 'lucide-react';

export default function AllIndiaParcelPage() {
  const navigate = useNavigate();
  const { addBooking, setActiveTrackingOrderId, user, setIsLoginModalOpen } = useApp();

  const [pickupPincode, setPickupPincode] = useState('400001'); // Mumbai
  const [dropPincode, setDropPincode] = useState('560001');   // Bangalore
  const [weightKg, setWeightKg] = useState(2.5);
  const [serviceMode, setServiceMode] = useState('air'); // 'air' | 'surface'
  const [isBooked, setIsBooked] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [formError, setFormError] = useState('');
  const pinOk = (p) => /^[1-9][0-9]{5}$/.test(p);

  const pricing = useMemo(() => {
    const isAir = serviceMode === 'air';
    const baseRate = isAir ? 180 : 90;
    const perKg = isAir ? 65 : 35;
    const weightCharge = Math.round(weightKg * perKg);
    const subtotal = baseRate + weightCharge;
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;
    const eta = isAir ? '24 - 48 Hours' : '3 - 5 Days';

    return { baseRate, weightCharge, gst, total, eta };
  }, [weightKg, serviceMode]);

  const handleBookParcel = (e) => {
    e.preventDefault();
    if (!user.isLoggedIn) { setIsLoginModalOpen(true); return; }
    if (!pinOk(pickupPincode) || !pinOk(dropPincode)) { setFormError('Enter valid 6-digit pickup and destination pincodes.'); return; }
    if (!receiverName.trim() || !/^[6-9][0-9]{9}$/.test(receiverPhone)) { setFormError('Enter the receiver name and a valid 10-digit mobile number.'); return; }
    setFormError('');
    const orderId = addBooking({
      pickup: `Pincode: ${pickupPincode} (Doorstep Pickup)`,
      drop: `Pincode: ${dropPincode} (All India Destination)`,
      distance: 980,
      vehicle: {
        name: `All India Parcel (${serviceMode === 'air' ? 'Air Priority Express' : 'Surface Express'})`,
        id: 'intercity-parcel',
        icon: '/images/trucks_india_a42dcdfc61.webp'
      },
      fare: pricing.total,
      senderName: user.name,
      senderPhone: user.phone,
      receiverName: receiverName.trim(),
      receiverPhone,
      goodsType: `Intercity Courier Parcel (${weightKg} kg)`
    });

    setIsBooked(orderId);
    setActiveTrackingOrderId(orderId);
    navigate('/track');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Banner with Portex Palette & FLUX.2 Photorealistic Cargo Background */}
        <div className="relative rounded-3xl p-8 sm:p-12 text-white overflow-hidden shadow-2xl border border-indigo-900/40 bg-slate-950 min-h-[340px] flex items-center">
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src="/images/all-india-logistics.webp" 
              alt="Intercity Parcel Air Cargo Fleet" 
              className="w-full h-full object-cover object-center opacity-30 transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/80"></div>
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Doorstep Intercity Courier • 19,000+ Pincodes Serviced</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Nationwide Doorstep Parcel Courier
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed max-w-xl">
              Fast, insured intercity shipping covering 19,000+ pincodes. Doorstep pickup with real-time tracking, free packing assistance, and express air delivery across major cities.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Doorstep Pickup Included</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live Milestone Tracking</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transit Insurance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pincode & Weight Estimator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-porter-blue" />
                <span>1. Enter Pincodes & Package Weight</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Pincode (6-Digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 400001 (Mumbai)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                  {pinOk(pickupPincode)
                    ? <span className="text-[10px] text-emerald-600 font-semibold block mt-1">● Pincode format valid</span>
                    : <span className="text-[10px] text-rose-600 font-semibold block mt-1">Enter a 6-digit pincode</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Destination Pincode (6-Digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 560001 (Bangalore)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                  {pinOk(dropPincode)
                    ? <span className="text-[10px] text-emerald-600 font-semibold block mt-1">● Pincode format valid</span>
                    : <span className="text-[10px] text-rose-600 font-semibold block mt-1">Enter a 6-digit pincode</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Receiver Name</label>
                  <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Receiver Mobile</label>
                  <input type="tel" inputMode="numeric" maxLength={10} value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-porter-blue" />
                </div>
              </div>
              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              {/* Package Weight Slider */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-porter-blue" />
                    <span>Estimated Package Weight:</span>
                  </span>
                  <span className="text-base text-porter-blue font-black">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                  className="w-full accent-porter-blue h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                  <span>0.5 kg (Document / Packet)</span>
                  <span>10 kg (Medium Box)</span>
                  <span>20 kg (Carton)</span>
                  <span>30 kg (Heavy)</span>
                </div>
              </div>

              {/* Service Mode Selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-700">Select Delivery Speed</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setServiceMode('air')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      serviceMode === 'air'
                        ? 'border-porter-blue bg-blue-50 text-porter-blue font-bold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-porter-blue">
                        <Plane className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">Air Priority Express</h4>
                        <p className="text-[11px] text-gray-500">Fastest 24 - 48 hr transit</p>
                      </div>
                    </div>
                    {serviceMode === 'air' && <Check className="w-4 h-4 text-porter-blue" />}
                  </div>

                  <div
                    onClick={() => setServiceMode('surface')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      serviceMode === 'surface'
                        ? 'border-porter-blue bg-blue-50 text-porter-blue font-bold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">Surface Express</h4>
                        <p className="text-[11px] text-gray-500">Economy 3 - 5 business days</p>
                      </div>
                    </div>
                    {serviceMode === 'surface' && <Check className="w-4 h-4 text-porter-blue" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-lg sticky top-20 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Parcel Rate Estimate</h3>
                <span className="text-xs bg-blue-100 text-porter-blue font-bold px-2.5 py-0.5 rounded-full">
                  {serviceMode === 'air' ? 'Air Cargo' : 'Surface Cargo'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base Booking & Doorstep Pickup</span>
                  <span className="font-bold text-gray-900">₹{pricing.baseRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight Charges ({weightKg} kg)</span>
                  <span className="font-bold text-gray-900">₹{pricing.weightCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery Timeline</span>
                  <span className="font-bold text-emerald-600">{pricing.eta}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-bold text-gray-900">₹{pricing.gst}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-black text-gray-900 block">Total Freight</span>
                    <span className="text-[11px] text-gray-400">Doorstep to doorstep</span>
                  </div>
                  <span className="text-2xl font-black text-porter-blue">₹{pricing.total}</span>
                </div>
              </div>

              {isBooked ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm text-gray-900">Booking Placed: #{isBooked}</p>
                  <p className="text-xs text-gray-500">Redirecting to Live Trip Tracker...</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBookParcel}
                  className="w-full py-4 bg-porter-blue hover:bg-porter-hover text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition"
                >
                  <span>Book Intercity Pickup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Doorstep pickup with tamper-proof security pouch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
