import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { POPULAR_LOCATIONS, PROMO_CODES } from '../data/mockData';
import { getCoordinatesForAddress, calculateGeoDistance } from '../data/geoData';
import InteractiveMap from '../components/InteractiveMap';
import RazorpayModal from '../components/RazorpayModal';
import LocationSearchInput from '../components/LocationSearchInput';
import { BRANDING } from '../config/branding';
import { 
  Calculator, MapPin, Truck, Bike, ArrowRight, Check, Tag, ShieldCheck, 
  Info, Clock, AlertCircle, Sparkles, Navigation, X, CheckCircle2, CreditCard, 
  Plus, Trash2, UserPlus, Users 
} from 'lucide-react';

export default function FareEstimatePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { selectedCity, setIsCityModalOpen, addBooking, setIsTrackModalOpen, setActiveTrackingOrderId, user, fleetTariffs } = useApp();

  const cityLocations = POPULAR_LOCATIONS[selectedCity.id] || POPULAR_LOCATIONS['mumbai'];

  const [pickup, setPickup] = useState(state?.pickup || `${cityLocations[0]?.name || 'Andheri West'}, ${selectedCity.name}`);
  const [drop, setDrop] = useState(state?.drop || `${cityLocations[1]?.name || 'BKC Bandra'}, ${selectedCity.name}`);
  const [extraStop, setExtraStop] = useState('');
  const [showExtraStop, setShowExtraStop] = useState(false);

  // Helper options (None, 1 Helper, 2 Helpers)
  const [helperCount, setHelperCount] = useState(0); // 0, 1, 2

  const [distanceKm, setDistanceKm] = useState(13.5);
  const [selectedVehicleId, setSelectedVehicleId] = useState(state?.selectedVehicleId || (state?.category === 'bike' ? 'two-wheeler' : 'tata-ace'));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Booking & Payment Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    senderName: user.name || 'Ankit Sharma',
    senderPhone: user.phone || '9876543210',
    receiverName: 'Pooja Verma',
    receiverPhone: '9820011223',
    goodsType: 'Carton Boxes & Electronics'
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Derive coordinates from selected locations
  const pickupCoord = useMemo(() => {
    return getCoordinatesForAddress(pickup, selectedCity.id);
  }, [pickup, selectedCity.id]);

  const dropCoord = useMemo(() => {
    return getCoordinatesForAddress(drop, selectedCity.id);
  }, [drop, selectedCity.id]);

  const stopCoord = useMemo(() => {
    if (showExtraStop && extraStop) {
      return getCoordinatesForAddress(extraStop, selectedCity.id);
    }
    return null;
  }, [showExtraStop, extraStop, selectedCity.id]);

  // Recalculate geo distance whenever pickup, drop or multi-stop changes
  useEffect(() => {
    if (stopCoord) {
      const leg1 = calculateGeoDistance(pickupCoord, stopCoord);
      const leg2 = calculateGeoDistance(stopCoord, dropCoord);
      setDistanceKm(Number((leg1 + leg2).toFixed(1)));
    } else {
      const geoDist = calculateGeoDistance(pickupCoord, dropCoord);
      setDistanceKm(Number(geoDist.toFixed(1)));
    }
  }, [pickupCoord, dropCoord, stopCoord]);

  const selectedVehicle = useMemo(() => {
    return fleetTariffs.find(v => v.id === selectedVehicleId) || fleetTariffs[0];
  }, [selectedVehicleId, fleetTariffs]);

  // Pricing calculation
  const pricing = useMemo(() => {
    const v = selectedVehicle;
    const base = v.basePrice;
    const extraKm = Math.max(0, distanceKm - v.baseKm);
    const distanceCharge = Math.round(extraKm * v.ratePerKm);
    const helperCharge = helperCount === 1 ? 150 : helperCount === 2 ? 300 : 0;
    const stopCharge = showExtraStop && extraStop ? 50 : 0;

    const subtotal = base + distanceCharge + helperCharge + stopCharge;

    let discount = 0;
    if (appliedPromo) {
      const calcDiscount = Math.round((subtotal * appliedPromo.discountPercent) / 100);
      discount = Math.min(calcDiscount, appliedPromo.maxDiscount);
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const gst = Math.round(discountedSubtotal * 0.05); // 5% GST
    const total = discountedSubtotal + gst;

    return {
      baseFare: base,
      baseKm: v.baseKm,
      extraKm: Number(extraKm.toFixed(1)),
      ratePerKm: v.ratePerKm,
      distanceCharge,
      helperCharge,
      stopCharge,
      subtotal,
      discount,
      gst,
      total
    };
  }, [selectedVehicle, distanceKm, helperCount, showExtraStop, extraStop, appliedPromo]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    const found = PROMO_CODES.find(p => p.code.toUpperCase() === promoInput.trim().toUpperCase());
    if (!found) {
      setPromoError('Invalid coupon code. Try PORTER50 or FIRSTTRUCK');
      return;
    }
    if (pricing.subtotal < found.minFare) {
      setPromoError(`Minimum ride fare of ₹${found.minFare} required for this coupon.`);
      return;
    }
    setAppliedPromo(found);
    setPromoInput('');
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setIsBookingModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setIsPaymentModalOpen(false);
    const orderId = addBooking({
      pickup,
      drop,
      distance: distanceKm,
      vehicle: selectedVehicle,
      fare: pricing.total,
      senderName: bookingForm.senderName,
      senderPhone: bookingForm.senderPhone,
      receiverName: bookingForm.receiverName,
      receiverPhone: bookingForm.receiverPhone,
      goodsType: bookingForm.goodsType,
      paymentId: paymentData.paymentId,
      helperCount
    });

    setBookingSuccess(orderId);
    setActiveTrackingOrderId(orderId);
    setTimeout(() => {
      setBookingSuccess(null);
      navigate('/track');
    }, 1500);
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
                  {distanceKm} km (Real Driving Route)
                </span>
              </div>

              {/* Leaflet Map Embed with Real Coordinates */}
              <InteractiveMap
                pickupCoord={pickupCoord}
                dropCoord={dropCoord}
                stopCoord={stopCoord}
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
                    placeholder={`Search destination address in ${selectedCity.name}...`}
                    dotColor="rose"
                    cityName={selectedCity.name}
                    popularLocations={cityLocations}
                  />
                </div>
              </div>

              {/* Distance Slider Override */}
              <div className="pt-2 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>Calculated Route Distance:</span>
                  <span className="text-base text-porter-blue font-black">{distanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-porter-blue h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
                  <span>1 km (Local drop)</span>
                  <span>15 km (City traverse)</span>
                  <span>30 km (Suburbs)</span>
                  <span>60 km (Long-haul)</span>
                </div>
              </div>

              {/* Porter Helper Assistance Option */}
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
                  const extra = Math.max(0, distanceKm - v.baseKm);
                  const approxPrice = Math.round((v.basePrice + (extra * v.ratePerKm)) * 1.05);

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
                    <span>Loading Helper Assistance ({helperCount} helper)</span>
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
                      onClick={() => setAppliedPromo(null)}
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
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-4 bg-porter-blue hover:bg-porter-hover text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition"
              >
                <span>Book {selectedVehicle.name} • ₹{pricing.total}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero cancellation fees before driver arrival</span>
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

      {/* RAZORPAY PAYMENT MODAL */}
      <RazorpayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={pricing.total}
        orderId={`PRT-${Math.floor(10000 + Math.random() * 90000)}`}
        customerName={bookingForm.senderName}
        customerPhone={bookingForm.senderPhone}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
