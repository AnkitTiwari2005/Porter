import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import InteractiveMap from '../components/InteractiveMap';
import InvoiceModal from '../components/InvoiceModal';
import { getCoordinatesForAddress } from '../data/geoData';
import { 
  Navigation, Truck, Phone, ShieldCheck, MapPin, 
  Clock, CheckCircle, AlertTriangle, ArrowLeft, Share2, HelpCircle, 
  FileText, Play, Pause, CheckCircle2 
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function OrderTrackingPage() {
  const { activeBookings, activeTrackingOrderId, setActiveTrackingOrderId, updateBookingStatus } = useApp();
  const { orderId: routeOrderId } = useParams();
  const [copied, setCopied] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(null);

  const order = activeBookings.find(b => b.orderId === (routeOrderId || activeTrackingOrderId))
    || (routeOrderId ? undefined : activeBookings[0]);
  const pickupCoord = order ? (order.pickupCoord || getCoordinatesForAddress(order.pickup, order.cityId)) : [19.1197, 72.8464];
  const dropCoord = order ? (order.dropCoord || getCoordinatesForAddress(order.drop, order.cityId)) : [19.0664, 72.8687];

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${order.orderId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy tracking link:', url);
    }
  };

  // Demo simulator: advances the marker, stops just short of the destination.
  // Delivery itself is completed only by the driver's OTP check, never by the simulation.
  const baseProgress = order ? (order.progress ?? 60) / 100 : 0.6;
  useEffect(() => {
    if (!isSimulating) return undefined;
    const id = setInterval(() => {
      setSimulatedProgress((p) => Math.min(0.95, (p ?? baseProgress) + 0.05));
    }, 1500);
    return () => clearInterval(id);
  }, [isSimulating, baseProgress]);

  useEffect(() => {
    if (isSimulating && simulatedProgress !== null && simulatedProgress >= 0.95) setIsSimulating(false);
  }, [isSimulating, simulatedProgress]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <Truck className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">No active trips found</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          You don't have any in-progress consignments right now. Check out the fare estimate calculator to book your vehicle!
        </p>
        <Link
          to="/fare-estimate"
          className="mt-5 px-6 py-2.5 bg-porter-blue text-white rounded-xl text-xs font-bold hover:bg-porter-hover transition shadow-md shadow-blue-500/20"
        >
          Book a Mini Truck or Bike
        </Link>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isInTransit = order.status === 'in_transit';
  const effectiveProgress = isDelivered ? 1.0 : (simulatedProgress ?? baseProgress);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  Tracking Order #{order.orderId}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isDelivered 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-blue-100 text-porter-blue border-blue-200'
                }`}>
                  {isDelivered ? '✓ Delivered' : 'GPS Telemetry Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Booked via {BRANDING.name} Logistics • {order.vehicleName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Movement Simulation Button */}
            {!isDelivered && (
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  isSimulating 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-blue-50 text-porter-blue border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Pause GPS Sim' : 'Simulate Vehicle Movement'}</span>
              </button>
            )}

            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Tax Invoice</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span>{copied ? 'Link Copied!' : 'Share Live Tracking'}</span>
            </button>
          </div>
        </div>

        {/* Multi-Order Tabs */}
        {activeBookings.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Your Active Trips:</span>
            {activeBookings.map(b => (
              <button
                key={b.orderId}
                onClick={() => { setActiveTrackingOrderId(b.orderId); setIsSimulating(false); setSimulatedProgress(null); }}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition shrink-0 ${
                  b.orderId === order.orderId
                    ? 'bg-porter-blue text-white border-porter-blue shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {b.orderId} • {b.vehicleName.replace(/\s*\(.*\)$/, '')} (₹{b.fare})
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live OpenStreetMap Route Visualizer */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-porter-blue animate-pulse" />
                  <span>Real-time GPS Map Telemetry</span>
                </span>
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {isDelivered 
                    ? 'Trip Completed' 
                    : `Speed: ~28 km/h • ETA: ${Math.max(2, Math.round((1 - effectiveProgress) * 20))} mins`}
                </span>
              </div>

              {/* Real Leaflet Map */}
              <InteractiveMap
                pickupCoord={pickupCoord}
                dropCoord={dropCoord}
                pickupLabel={order.pickup}
                dropLabel={order.drop}
                vehicleProgress={effectiveProgress}
                height="340px"
              />

              {/* Waypoint Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Pickup Location</span>
                  <p className="font-semibold text-gray-800 truncate">{order.pickup}</p>
                </div>
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Destination</span>
                  <p className="font-semibold text-gray-800 truncate">{order.drop}</p>
                </div>
              </div>
            </div>

            {/* Trip Milestones */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Trip Milestones</h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1. Booked</span>
                  </span>
                  <p className="text-[11px] text-emerald-700">Order Confirmed</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Assigned</span>
                  </span>
                  <p className="text-[11px] text-emerald-700">{order.driver?.name}</p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  isDelivered 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-blue-50 border-porter-blue text-porter-blue ring-2 ring-blue-500/20'
                }`}>
                  <span className="font-black flex items-center gap-1">
                    <Truck className={`w-3.5 h-3.5 text-porter-blue ${!isDelivered ? 'animate-pulse' : ''}`} />
                    <span>3. In Transit</span>
                  </span>
                  <p className="text-[11px] text-blue-700">
                    {isDelivered ? 'Completed' : `Moving (${Math.round(effectiveProgress * 100)}%)`}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  isDelivered 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 ring-2 ring-emerald-500/20' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle className={`w-3.5 h-3.5 ${isDelivered ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <span>4. Delivered</span>
                  </span>
                  <p className="text-[11px]">{isDelivered ? 'OTP Verified ✓' : 'Requires OTP'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Driver Details & Delivery OTP */}
          <div className="lg:col-span-4 space-y-6">
            {order.driver && (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">
                  Assigned Driver Partner
                </h3>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    {order.driver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{order.driver.name}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{order.vehicleName}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit border border-amber-200">
                      ★ {order.driver.rating} (Verified Partner)
                    </div>
                  </div>
                </div>

                {/* Registration plate & OTP box */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Vehicle Plate</span>
                    <span className="text-xs font-mono font-black text-gray-800">{order.driver.vehicleNo}</span>
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-porter-blue block">Delivery OTP</span>
                    <span className="text-base font-mono font-black text-porter-blue">{order.driver.otp}</span>
                  </div>
                </div>

                {/* Call driver */}
                <a
                  href={`tel:${order.driver.phone}`}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {order.driver.name}</span>
                </a>

                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Trip Fare:</span>
                    <span className="font-bold text-gray-900">₹{order.fare}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Mode:</span>
                    <span className="font-bold text-emerald-600">{order.paymentMethod || 'Razorpay Verified ✓'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Consignment:</span>
                    <span className="font-bold text-gray-900 truncate max-w-[160px]">{order.goodsType || 'Commercial Cargo'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />
    </div>
  );
}
