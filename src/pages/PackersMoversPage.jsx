import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { getCityLocations } from '../data/geoData';
import { computePackers, PACKERS_PLANS } from '../utils/pricing';
import { api, newIdempotencyKey } from '../lib/api';
import LocationSearchInput from '../components/LocationSearchInput';
import PaymentModal from '../components/PaymentModal';
import { 
  Home, CheckCircle2, ShieldCheck, Calendar, ArrowRight, 
  Box, Sparkles, Award, Clock, Phone, MapPin, Check 
} from 'lucide-react';

export default function PackersMoversPage() {
  usePageTitle('Packers & Movers');
  const navigate = useNavigate();
  const { selectedCity, user, gstRate, paymentsEnabled, requireLogin, bookOrder } = useApp();
  const { state } = useLocation();

  const cityLocations = useMemo(() => getCityLocations(selectedCity.id), [selectedCity.id]);
  const hub = (i) => {
    const l = cityLocations[i];
    if (!l) return { text: '', place: null };
    const text = l.name.includes(selectedCity.name) ? l.name : `${l.name}, ${selectedCity.name}`;
    return { text, place: { address: text, lat: l.lat, lng: l.lng } };
  };
  const toPoint = (text, place) => (place && place.address === text ? { address: text, lat: place.lat, lng: place.lng } : { address: text });

  const [houseSize, setHouseSize] = useState('1bhk');
  const [pickup, setPickup] = useState(state?.pickup || hub(0).text);
  const [pickupPlace, setPickupPlace] = useState(state?.pickup ? null : hub(0).place);
  const [drop, setDrop] = useState(state?.drop || hub(1).text);
  const [dropPlace, setDropPlace] = useState(state?.drop ? null : hub(1).place);
  const [moveDate, setMoveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-CA'); // local YYYY-MM-DD (toISOString is UTC and can be a day off in IST)
  });
  const [hasLiftPickup, setHasLiftPickup] = useState(true);
  const [hasLiftDrop, setHasLiftDrop] = useState(true);
  const [needDismantling, setNeedDismantling] = useState(true);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setPickup(hub(0).text); setPickupPlace(hub(0).place);
    setDrop(hub(1).text); setDropPlace(hub(1).place);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity.id]);

  const descriptions = {
    '1rk': '1 Bed, 1 Wardrobe, 5-8 Boxes, Fridge',
    '1bhk': '1 Queen Bed, Sofa, Dining, Fridge, TV, 10-15 Boxes',
    '2bhk': '2 Beds, 5-seater Sofa, Full Kitchen, 20-25 Boxes',
    '3bhk': '3 Beds, Living Room, Appliances, ACs, 30+ Boxes',
    few: '1-3 Furniture pieces or appliance only'
  };
  const houseOptions = PACKERS_PLANS.map((p) => ({ ...p, items: descriptions[p.id] }));
  const currentOption = houseOptions.find((h) => h.id === houseSize) || houseOptions[1];

  // The API computes the real price; the local figure is only a placeholder until the quote arrives.
  const quoteInput = useMemo(() => ({
    serviceType: 'packers', cityId: selectedCity.id, planId: houseSize,
    pickup: toPoint(pickup.trim(), pickupPlace), drop: toPoint(drop.trim(), dropPlace),
    hasLiftPickup, hasLiftDrop, needDismantling
  }), [selectedCity.id, houseSize, pickup, pickupPlace, drop, dropPlace, hasLiftPickup, hasLiftDrop, needDismantling]);
  const quoteKey = JSON.stringify(quoteInput);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  useEffect(() => {
    if (pickup.trim().length < 3 || drop.trim().length < 3) { setQuote(null); setQuoteError(''); return undefined; }
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(async () => {
      try { setQuote(await api.post('/quotes', JSON.parse(quoteKey), { signal: ctrl.signal })); setQuoteError(''); }
      catch (e) { if (e.name !== 'AbortError') { setQuote(null); setQuoteError(e.message); } }
      finally { if (!ctrl.signal.aborted) setQuoting(false); }
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [quoteKey, pickup, drop]);

  const pricing = quote?.pricing ?? computePackers({ planId: houseSize, hasLiftPickup, hasLiftDrop, needDismantling, gstRate });
  const estimatedFare = pricing.total;

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [submit, setSubmit] = useState({ busy: false, error: '' });
  const idem = useRef({ body: '', key: '' });

  const handleBookShifting = (e) => {
    e.preventDefault();
    if (!user.isLoggedIn) { requireLogin(() => setIsPaymentOpen(true)); return; }
    if (user.role !== 'customer') { setSubmit({ busy: false, error: 'Please log in with a customer account to book.' }); return; }
    if (!quote || quoting) { setSubmit({ busy: false, error: quoteError || 'Hold on, we are calculating your quote.' }); return; }
    setSubmit({ busy: false, error: '' });
    setIsPaymentOpen(true);
  };

  const confirmPayment = async (method) => {
    const payload = {
      quote: JSON.parse(quoteKey), paymentMethod: method, expectedTotal: estimatedFare,
      sender: { name: user.name || 'Customer', phone: user.phone }, receiver: { name: user.name || 'Customer', phone: user.phone },
      goodsType: `House Shifting (${currentOption.label})`,
      scheduledFor: new Date(`${moveDate}T09:00:00+05:30`).toISOString()
    };
    const body = JSON.stringify(payload);
    if (idem.current.body !== body) idem.current = { body, key: newIdempotencyKey() };
    setSubmit({ busy: true, error: '' });
    try {
      const { paymentPending } = await bookOrder(payload, idem.current.key);
      setIsPaymentOpen(false);
      navigate('/track', { state: { paymentPending } });
    } catch (err) {
      setSubmit({ busy: false, error: err.code === 'price_changed' ? `The price changed to ₹${err.details?.total}. Please review and confirm again.` : err.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner with Portex Palette & FLUX.2 Photorealistic Imagery */}
        <div className="relative rounded-3xl p-8 sm:p-12 text-white overflow-hidden shadow-2xl border border-indigo-900/40 bg-slate-950 min-h-[340px] flex items-center">
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src="/images/packers-hero.webp" 
              alt="Professional Packers & Movers" 
              className="w-full h-full object-cover object-center opacity-30 transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-purple-950/80"></div>
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{BRANDING.name} Verified Relocation Specialists</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Relocating Your Home? <br />
              <span className="text-amber-400">Zero-Stress Shifting</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed max-w-xl">
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
                <LocationSearchInput
                  label="Current House (Pickup)" value={pickup} onChange={setPickup} onSelect={setPickupPlace}
                  cityId={selectedCity.id} cityName={selectedCity.name} popularLocations={cityLocations} dotColor="emerald"
                  placeholder={`Search your current address in ${selectedCity.name}`}
                />
                <LocationSearchInput
                  label="New House (Destination)" value={drop} onChange={setDrop} onSelect={setDropPlace}
                  cityId={selectedCity.id} cityName={selectedCity.name} popularLocations={cityLocations} dotColor="rose"
                  placeholder={`Search your new address in ${selectedCity.name}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Moving Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    min={new Date().toLocaleDateString('en-CA')}
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
                  <span className="font-bold text-gray-900">₹{pricing.baseFare}</span>
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
                    <span className="text-[11px] text-gray-400">Includes GST (₹{pricing.gst}) and labour</span>
                  </div>
                  <span className="text-2xl font-black text-purple-700">₹{estimatedFare}</span>
                </div>
              </div>

              {(quoteError || submit.error) && <p role="alert" className="text-xs text-rose-600 font-medium">{submit.error || quoteError}</p>}
              <button
                type="button"
                onClick={handleBookShifting}
                disabled={quoting}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition"
              >
                <span>{quoting ? 'Calculating…' : 'Book House Shifting Slot'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Free cancellation before pickup</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} total={estimatedFare} codAllowed={!paymentsEnabled} onlineAvailable={paymentsEnabled} busy={submit.busy} error={submit.error} onConfirm={confirmPayment} />
    </div>
  );
}
