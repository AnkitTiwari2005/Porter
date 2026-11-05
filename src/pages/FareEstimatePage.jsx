import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { computeFare } from '../utils/pricing';
import { getCityLocations } from '../data/geoData';
import { api, newIdempotencyKey } from '../lib/api';
import InteractiveMap from '../components/InteractiveMap';
import PaymentModal from '../components/PaymentModal';
import LocationSearchInput from '../components/LocationSearchInput';
import { 
  Calculator, MapPin, Truck, Bike, ArrowRight, Check, Tag, ShieldCheck, 
  Info, Clock, AlertCircle, Sparkles, Navigation, X, CheckCircle2, CreditCard, 
  Plus, Trash2, UserPlus, Users 
} from 'lucide-react';

const toPoint = (text, place) => (place && place.address === text ? { address: text, lat: place.lat, lng: place.lng } : { address: text });

export default function FareEstimatePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { selectedCity, setIsCityModalOpen, user, fleetTariffs, gstRate, cancelFee, catalogError, paymentsEnabled, requireLogin, bookOrder } = useApp();

  const cityLocations = useMemo(() => getCityLocations(selectedCity.id), [selectedCity.id]);
  const hub = (i) => {
    const l = cityLocations[i];
    if (!l) return { text: '', place: null };
    const text = l.name.includes(selectedCity.name) ? l.name : `${l.name}, ${selectedCity.name}`;
    return { text, place: { address: text, lat: l.lat, lng: l.lng } };
  };

  const [pickup, setPickup] = useState(state?.pickup || hub(0).text);
  const [pickupPlace, setPickupPlace] = useState(state?.pickup ? null : hub(0).place);
  const [drop, setDrop] = useState(state?.drop || hub(1).text);
  const [dropPlace, setDropPlace] = useState(state?.drop ? null : hub(1).place);
  const [extraStop, setExtraStop] = useState('');
  const [showExtraStop, setShowExtraStop] = useState(false);
  const [helperCount, setHelperCount] = useState(0);

  const [selectedVehicleId, setSelectedVehicleId] = useState(state?.selectedVehicleId || (state?.category === 'bike' ? 'two-wheeler' : 'tata-ace'));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(state?.category === 'bike' ? 'bike' : state?.category === 'truck' ? 'truck' : 'all');

  // Changing city resets the route to that city's hubs (but not on first render, so values passed from Home survive).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setPickup(hub(0).text); setPickupPlace(hub(0).place);
    setDrop(hub(1).text); setDropPlace(hub(1).place);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity.id]);

  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    senderName: user.name || '', senderPhone: user.phone || '', receiverName: '', receiverPhone: '', goodsType: 'Carton Boxes & Electronics'
  });
  useEffect(() => {
    setBookingForm((f) => ({ ...f, senderName: f.senderName || user.name || '', senderPhone: f.senderPhone || user.phone || '' }));
  }, [user.name, user.phone]);
  const [routeError, setRouteError] = useState('');
  const [submit, setSubmit] = useState({ busy: false, error: '' });

  const selectedVehicle = useMemo(() => fleetTariffs.find((v) => v.id === selectedVehicleId) || fleetTariffs[0], [selectedVehicleId, fleetTariffs]);

  // ---- Server quote: the API computes distance, discount and tax; this page only displays it.
  const quoteInput = useMemo(() => ({
    serviceType: 'city', cityId: selectedCity.id, vehicleId: selectedVehicle.id,
    pickup: toPoint(pickup.trim(), pickupPlace), drop: toPoint(drop.trim(), dropPlace),
    helperCount: selectedVehicle.category === 'truck' ? helperCount : 0,
    hasStop: showExtraStop && !!extraStop.trim(),
    ...(promoCode ? { promoCode } : {})
  }), [selectedCity.id, selectedVehicle, pickup, pickupPlace, drop, dropPlace, helperCount, showExtraStop, extraStop, promoCode]);
  const quoteKey = JSON.stringify(quoteInput);
  const [refreshTick, setRefreshTick] = useState(0);

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  useEffect(() => {
    if (pickup.trim().length < 3 || drop.trim().length < 3) { setQuote(null); setQuoteError(''); setQuoting(false); return undefined; }
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const q = await api.post('/quotes', JSON.parse(quoteKey), { signal: ctrl.signal });
        setQuote(q);
        setQuoteError('');
        if (q.promo && !q.promo.valid) { setPromoError(q.promo.error || 'This coupon cannot be applied.'); setPromoCode(''); }
      } catch (e) {
        if (e.name === 'AbortError') return;
        setQuote(null);
        setQuoteError(e.message);
      } finally {
        if (!ctrl.signal.aborted) setQuoting(false);
      }
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [quoteKey, refreshTick, pickup, drop]);

  const quoteReady = !!quote && !quoting && !quoteError;
  const distanceKm = quote?.distanceKm ?? null;
  const pricing = quote?.pricing ?? computeFare({ vehicle: selectedVehicle, distanceKm: selectedVehicle.baseKm, helperCount: selectedVehicle.category === 'truck' ? helperCount : 0, hasStop: showExtraStop && !!extraStop.trim(), gstRate });
  const appliedPromo = quote?.promo?.valid ? { code: quote.promo.code, description: 'Discount applied to your fare' } : null;

  const center = (id) => cityLocations[id] ? [cityLocations[id].lat, cityLocations[id].lng] : [19.076, 72.8777];
  const pickupCoord = quote ? [quote.pickup.lat, quote.pickup.lng] : pickupPlace ? [pickupPlace.lat, pickupPlace.lng] : center(0);
  const dropCoord = quote ? [quote.drop.lat, quote.drop.lng] : dropPlace ? [dropPlace.lat, dropPlace.lng] : center(1);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError('');
    setPromoCode(code);
    setPromoInput('');
  };

  const handleBookClick = () => {
    if (!user.isLoggedIn) { requireLogin(() => setIsBookingModalOpen(true)); return; }
    if (user.role !== 'customer') { setRouteError('Please log in with a customer account to book.'); return; }
    if (!pickup.trim() || !drop.trim()) { setRouteError('Enter both pickup and drop addresses.'); return; }
    if (!quoteReady) { setRouteError(quoteError || 'Hold on, we are calculating your fare.'); return; }
    setRouteError('');
    setIsBookingModalOpen(true);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setSubmit({ busy: false, error: '' });
    setIsBookingModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  // One idempotency key per distinct request, so a retry after a flaky network never books twice.
  const idem = useRef({ body: '', key: '' });
  const confirmPayment = async (method) => {
    const payload = {
      quote: JSON.parse(quoteKey),
      paymentMethod: method,
      expectedTotal: pricing.total,
      sender: { name: bookingForm.senderName.trim(), phone: bookingForm.senderPhone },
      receiver: { name: bookingForm.receiverName.trim(), phone: bookingForm.receiverPhone },
      goodsType: bookingForm.goodsType,
      ...(showExtraStop && extraStop.trim() ? { notes: `Extra stop: ${extraStop.trim()}` } : {})
    };
    const body = JSON.stringify(payload);
    if (idem.current.body !== body) idem.current = { body, key: newIdempotencyKey() };
    setSubmit({ busy: true, error: '' });
    try {
      const { paymentPending } = await bookOrder(payload, idem.current.key);
      setIsPaymentModalOpen(false);
      navigate('/track', { state: { paymentPending } });
    } catch (e) {
      if (e.status === 401) { setIsPaymentModalOpen(false); requireLogin(() => setIsPaymentModalOpen(true)); setSubmit({ busy: false, error: '' }); return; }
      if (e.code === 'price_changed') {
        setRefreshTick((n) => n + 1);
        setSubmit({ busy: false, error: `The fare changed to ₹${e.details?.total ?? 'a new amount'}. Please review the updated price and confirm again.` });
        return;
      }
      const detail = e.details?.[0]?.message;
      setSubmit({ busy: false, error: detail && e.code === 'invalid_request' ? `${e.message}` : e.message });
    }
  };

  const filteredVehicles = fleetTariffs.filter(v => {
    if (activeCategoryFilter === 'all') return true;
    return v.category === activeCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-porter-blue bg-blue-50 px-3 py-1 rounded-full mb-1 border border-blue-100">
              <Calculator className="w-3.5 h-3.5" />
              <span>Fare Estimate Calculator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Get Upfront Fare Estimate & Book Instantly
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Transparent, guaranteed rates for <span className="font-bold text-gray-700">{selectedCity.name}</span>. No hidden surge charges.
            </p>
          </div>

          <button
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-porter-blue transition shadow-sm w-fit"
          >
            <MapPin className="w-3.5 h-3.5 text-porter-blue" />
            <span>City: {selectedCity.name} (Change)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Route, Real Leaflet Map, Multi-Stop & Fleet Selection */}
          <div className="lg:col-span-8 space-y-6">
            {/* Real OpenStreetMap Route Visualizer */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-porter-blue" />
                  <span>1. Route & Live GPS Map</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {quote ? `${quote.distanceKm} km${quote.route?.approximate ? ' (estimated)' : ''}` : quoting ? 'Calculating…' : 'Enter both addresses'}
                </span>
              </div>

              {/* Leaflet Map Embed with Real Coordinates */}
              <InteractiveMap
                pickupCoord={pickupCoord}
                dropCoord={dropCoord}
                routeLine={quote?.route?.line}
                stopCoord={null}
                pickupLabel={pickup}
                dropLabel={drop}
                stopLabel={extraStop}
                height="280px"
                vehicleProgress={0.4}
              />

              {/* Route Input Boxes with Smart Autocomplete */}
              <div className="space-y-4 pt-2">
                <LocationSearchInput
                  label="Pickup Address"
                  value={pickup}
                  onChange={setPickup}
                  onSelect={setPickupPlace}
                  cityId={selectedCity.id}
                  placeholder={`Search pickup address or landmark in ${selectedCity.name}...`}
                  dotColor="emerald"
                  cityName={selectedCity.name}
                  popularLocations={cityLocations}
                />

                {/* Optional Intermediate Multi-Drop Stop */}
                {showExtraStop && (
                  <div className="relative animate-fadeIn space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Stop 1 (Intermediate Drop Point)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setShowExtraStop(false); setExtraStop(''); }}
                        className="text-gray-400 hover:text-red-500 text-[11px] flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Stop
                      </button>
                    </div>
                    <LocationSearchInput
                      value={extraStop}
                      onChange={setExtraStop}
                      cityId={selectedCity.id}
                      placeholder={`Enter intermediate drop point in ${selectedCity.name}...`}
                      dotColor="amber"
                      cityName={selectedCity.name}
                      popularLocations={cityLocations}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    {!showExtraStop && (
                      <button
                        type="button"
                        onClick={() => setShowExtraStop(true)}
                        className="text-xs font-bold text-porter-blue hover:underline flex items-center gap-1 ml-auto mb-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stop (+ Multi-Drop Routing)</span>
                      </button>
                    )}
                  </div>
                  <LocationSearchInput
                    label="Drop Destination"
                    value={drop}
                    onChange={setDrop}
                    onSelect={setDropPlace}
                    cityId={selectedCity.id}
                    placeholder={`Search destination address in ${selectedCity.name}...`}
                    dotColor="rose"
                    cityName={selectedCity.name}
                    popularLocations={cityLocations}
                  />
                </div>
              </div>

              {/* Server-calculated distance (cannot be edited: it drives the price) */}
              <div className="pt-2 bg-blue-50/60 p-4 rounded-2xl border border-blue-100" aria-live="polite">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Route distance</span>
                  <span className="text-base text-porter-blue font-black">{quote ? `${quote.distanceKm} km` : '—'}</span>
                </div>
                {quote && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    About {quote.route?.minutes ?? '—'} min drive{quote.route?.approximate ? '. Distance is estimated; the fare is confirmed when you book.' : '.'}
                  </p>
                )}
                {quoteError && <p role="alert" className="text-[11px] text-rose-600 font-medium mt-1">{quoteError}</p>}
                {catalogError && <p role="alert" className="text-[11px] text-rose-600 font-medium mt-1">{catalogError}</p>}
              </div>

              {/* Portex Helper Assistance Option */}
              {selectedVehicle.category === 'truck' && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-porter-blue" />
                      <span>Helper for Loading / Unloading</span>
                    </span>
                    <span className="text-[11px] text-gray-400">Driver assists ground-to-ground</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { count: 0, label: 'No Helper', price: '₹0' },
                      { count: 1, label: '1 Helper', price: '+₹150' },
                      { count: 2, label: '2 Helpers', price: '+₹300' }
                    ].map(h => (
                      <button
                        key={h.count}
                        type="button"
                        onClick={() => setHelperCount(h.count)}
                        className={`py-2 px-3 rounded-xl border text-center transition ${
                          helperCount === h.count
                            ? 'border-porter-blue bg-blue-50 text-porter-blue font-bold shadow-sm'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="block text-xs">{h.label}</span>
                        <span className="text-[10px] font-semibold">{h.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Selection Grid */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-porter-blue" />
                  <span>2. Select Vehicle</span>
                </h3>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg transition ${activeCategoryFilter === 'all' ? 'bg-white text-porter-blue shadow-sm' : ''}`}
                  >
                    All Fleet ({fleetTariffs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('truck')}
                    className={`px-3 py-1 rounded-lg transition ${activeCategoryFilter === 'truck' ? 'bg-white text-porter-blue shadow-sm' : ''}`}
                  >
                    Mini Trucks
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('bike')}
                    className={`px-3 py-1 rounded-lg transition ${activeCategoryFilter === 'bike' ? 'bg-white text-porter-blue shadow-sm' : ''}`}
                  >
                    Two-Wheelers
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVehicles.map((v) => {
                  const isSelected = selectedVehicleId === v.id;
                  const approxPrice = computeFare({ vehicle: v, distanceKm: distanceKm ?? v.baseKm, gstRate }).total;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
                        isSelected
                          ? 'border-porter-blue bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center p-1 shrink-0 border border-gray-100">
                        <img 
                          src={v.icon || v.image} 
                          alt={v.name} 
                          className="max-h-12 max-w-full object-contain" 
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{v.name}</h4>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-porter-blue text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Capacity: <span className="font-bold text-gray-700">{v.capacity}</span>
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                          ⚡ Driver ETA ~{v.etaMinutes} mins
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-400 block font-medium">Est. Fare</span>
                        <span className="text-base font-black text-porter-blue">₹{approxPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Fare Breakdown, Razorpay Checkout & Promos */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-lg sticky top-20 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Fare Summary</h3>
                <span className="text-xs bg-blue-100 text-porter-blue font-bold px-2.5 py-0.5 rounded-full">
                  {selectedVehicle.name}
                </span>
              </div>

              {/* Line items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Base Fare (First {pricing.baseKm} km)</span>
                  <span className="font-semibold text-gray-900">₹{pricing.baseFare}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Distance Charge ({pricing.extraKm} km @ ₹{pricing.ratePerKm}/km)</span>
                  <span className="font-semibold text-gray-900">₹{pricing.distanceCharge}</span>
                </div>

                {pricing.helperCharge > 0 && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Loading Helper Assistance ({helperCount} {helperCount === 1 ? 'helper' : 'helpers'})</span>
                    <span className="font-semibold text-gray-900">₹{pricing.helperCharge}</span>
                  </div>
                )}

                {pricing.stopCharge > 0 && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Multi-Drop Stop Fee</span>
                    <span className="font-semibold text-gray-900">₹{pricing.stopCharge}</span>
                  </div>
                )}

                {pricing.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon Discount ({appliedPromo?.code})</span>
                    </span>
                    <span>- ₹{pricing.discount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600">
                  <span>GST & Insurance (5%)</span>
                  <span className="font-semibold text-gray-900">₹{pricing.gst}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-black text-gray-900 block">Total Fare</span>
                    <span className="text-[11px] text-gray-400">All taxes & fuel included</span>
                  </div>
                  <span className="text-2xl font-black text-porter-blue">₹{pricing.total}</span>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-1">
                {appliedPromo ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Coupon '{appliedPromo.code}' Applied!
                      </span>
                      <p className="text-[11px] text-emerald-600 mt-0.5">{appliedPromo.description}</p>
                    </div>
                    <button
                      onClick={() => { setPromoCode(''); setPromoError(''); }}
                      className="text-xs text-rose-600 font-bold hover:underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Coupon Code"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-porter-blue"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-rose-500 font-medium">{promoError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Book Now Button */}
              <button
                type="button"
                onClick={handleBookClick}
                disabled={quoting}
                className="w-full py-4 bg-porter-blue hover:bg-porter-hover text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition"
              >
                <span>Book {selectedVehicle.name} • ₹{pricing.total}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {routeError && <p className="text-xs text-rose-600 font-medium text-center">{routeError}</p>}

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{cancelFee > 0 ? `Cancellation after a driver is assigned: ₹${cancelFee}` : 'Free cancellation before pickup'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRIP DETAILS MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <form onSubmit={handleProceedToPayment}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Trip Consignment Details</h3>
                  <p className="text-xs text-gray-500">{selectedVehicle.name} • Total: ₹{pricing.total}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-50/70 p-3.5 rounded-2xl text-xs space-y-1.5 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                    <p><span className="font-bold text-gray-800">From:</span> {pickup}</p>
                  </div>
                  {showExtraStop && extraStop && (
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                      <p><span className="font-bold text-amber-800">Stop 1:</span> {extraStop}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                    <p><span className="font-bold text-gray-800">To:</span> {drop}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Sender Name</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.senderName}
                      onChange={(e) => setBookingForm({...bookingForm, senderName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Sender Mobile</label>
                    <input
                      type="tel"
                      required
                      pattern="(\+91[\s-]?)?[6-9][0-9]{9}"
                      title="10-digit Indian mobile number"
                      value={bookingForm.senderPhone}
                      onChange={(e) => setBookingForm({...bookingForm, senderPhone: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Receiver Name</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.receiverName}
                      onChange={(e) => setBookingForm({...bookingForm, receiverName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Receiver Mobile</label>
                    <input
                      type="tel"
                      required
                      pattern="(\+91[\s-]?)?[6-9][0-9]{9}"
                      title="10-digit Indian mobile number"
                      value={bookingForm.receiverPhone}
                      onChange={(e) => setBookingForm({...bookingForm, receiverPhone: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Goods / Consignment Category</label>
                  <select
                    value={bookingForm.goodsType}
                    onChange={(e) => setBookingForm({...bookingForm, goodsType: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  >
                    <option value="Carton Boxes & Electronics">Carton Boxes & Electronics</option>
                    <option value="Household Furniture & Appliances">Household Furniture & Appliances</option>
                    <option value="Commercial Hardware & Timber">Commercial Hardware & Timber</option>
                    <option value="Urgent Documents & Parcels">Urgent Documents & Parcels</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block font-medium">Total Amount</span>
                  <span className="text-lg font-black text-porter-blue">₹{pricing.total}</span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-porter-blue hover:bg-porter-hover text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Choose Payment Method</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={pricing.total}
        codAllowed
        onlineAvailable={paymentsEnabled}
        busy={submit.busy}
        error={submit.error}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
