import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import InteractiveMap from '../components/InteractiveMap';
import { getCoordinatesForAddress } from '../data/geoData';
import { 
  Truck, Power, DollarSign, Navigation, Phone, 
  CheckCircle2, Clock, MapPin, AlertCircle, Award, Star, X, Check, 
  Compass, Play, Bell 
} from 'lucide-react';

export default function DriverPortalPage() {
  const { 
    activeBookings, 
    verifyDeliveryOtp, 
    updateBookingStatus, 
    driverOnline, 
    setDriverOnline, 
    driverEarnings,
    addBooking,
    selectedCity 
  } = useApp();

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [tripCompletedSuccess, setTripCompletedSuccess] = useState(false);
  const [navStep, setNavStep] = useState(1); // 1: heading to pickup, 2: goods loaded / in transit, 3: arrived at drop

  // Audio chime synthesizer
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  };

  // Find active assigned trip
  const activeTrip = activeBookings.find(b => b.status === 'in_transit' || b.status === 'assigned') || activeBookings[0];
  const tripPickupCoord = activeTrip ? getCoordinatesForAddress(activeTrip.pickup) : undefined;
  const tripDropCoord = activeTrip ? getCoordinatesForAddress(activeTrip.drop) : undefined;

  const handleVerifyOtpAndComplete = (e) => {
    e.preventDefault();
    if (!activeTrip) return;

    const result = verifyDeliveryOtp(activeTrip.orderId, otpInput);
    if (!result.success) {
      setOtpError(result.message);
      return;
    }

    playAlertChime();
    setOtpError('');
    setTripCompletedSuccess(true);
    setOtpInput('');

    setTimeout(() => {
      setTripCompletedSuccess(false);
      setNavStep(1);
    }, 4000);
  };

  // Fast trigger for testing incoming booking
  const handleSimulateNewBooking = () => {
    playAlertChime();
    addBooking({
      pickup: 'Andheri West Link Road, Mumbai',
      drop: 'BKC Bandra Kurla Complex, Mumbai',
      distance: 14.5,
      vehicle: {
        name: 'Tata Ace (Chota Hathi)',
        id: 'tata-ace',
        icon: '/images/Tata_Ace_5fd23cdaf0.svg'
      },
      fare: 480,
      senderName: 'Rohit Khandelwal',
      senderPhone: '+91 98205 66781',
      receiverName: 'Sanjay Deshmukh',
      receiverPhone: '+91 98190 22345',
      goodsType: 'Retail Footwear & Apparel'
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Driver Top Profile Bar */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-gray-900">Rameshwar Yadav</h1>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400" /> 4.92 Rating
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Tata Ace Gold • <span className="font-bold text-gray-800">MH 02 EE 7418</span> • {selectedCity.name} Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateNewBooking}
              className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-porter-blue border border-blue-200 transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Simulate Customer Booking</span>
            </button>

            {/* Online Toggle Button */}
            <button
              onClick={() => setDriverOnline(!driverOnline)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                driverOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{driverOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>

        {/* Driver Today's Ledger */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[11px] text-gray-400 block font-semibold uppercase">Today's Earnings</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹{driverEarnings}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[11px] text-gray-400 block font-semibold uppercase">Trips Completed</span>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {activeBookings.filter(b => b.status === 'delivered').length + 3}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[11px] text-gray-400 block font-semibold uppercase">Platform Incentive</span>
            <p className="text-2xl font-black text-porter-blue mt-1">+₹350</p>
          </div>
        </div>

        {/* ACTIVE TRIP DASHBOARD */}
        {activeTrip && activeTrip.status !== 'delivered' ? (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-porter-blue uppercase tracking-widest block">
                  Active Dispatch Assigned
                </span>
                <h3 className="text-lg font-bold text-gray-900">Order #{activeTrip.orderId}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Driver Fare (82%)</span>
                <span className="text-xl font-black text-emerald-600">₹{Math.round(activeTrip.fare * 0.82)}</span>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="h-64 rounded-2xl overflow-hidden border border-gray-200">
              <InteractiveMap
                pickupCoord={tripPickupCoord}
                dropCoord={tripDropCoord}
                pickupLabel={activeTrip?.pickup || 'Pickup'}
                dropLabel={activeTrip?.drop || 'Destination'}
                height="100%"
                vehicleProgress={0.4}
              />
            </div>

            {/* Turn-by-Turn Navigation Simulator */}
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-porter-blue text-white flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {navStep === 1 ? 'Turn right onto Western Express Highway in 350m' : navStep === 2 ? 'Continue straight for 4.2 km towards BKC' : 'Arrived at Drop Destination'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">ETA: ~12 mins • Optimal route selected</p>
                </div>
              </div>
              <button
                onClick={() => setNavStep(prev => prev < 3 ? prev + 1 : 1)}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-xl font-bold text-porter-blue text-xs hover:bg-blue-100"
              >
                Next Step →
              </button>
            </div>

            {/* Route details */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Pickup Point</span>
                  <p className="text-sm font-semibold text-gray-800">{activeTrip.pickup}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold uppercase">Destination</span>
                  <p className="text-sm font-semibold text-gray-800">{activeTrip.drop}</p>
                </div>
              </div>
            </div>

            {/* Client Call & Details */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-900">{activeTrip.senderName || 'Customer'}</p>
                <p className="text-[11px] text-gray-500">{activeTrip.goodsType || 'Commercial Cargo'}</p>
              </div>
              <a
                href={`tel:${activeTrip.senderPhone || '9876543210'}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>
            </div>

            {/* Trip Completion & OTP Gate */}
            {tripCompletedSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-gray-900">Trip Delivered & Completed!</h4>
                <p className="text-xs text-emerald-800">
                  Fare credited to your driver wallet. Customer app tracking updated to 'Delivered'.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtpAndComplete} className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Verify Customer Delivery OTP
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Enter the 4-digit code provided by the receiver (Customer OTP: <strong className="text-porter-blue">{activeTrip.driver?.otp}</strong>)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 4-Digit OTP"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold tracking-widest text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-porter-blue"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-porter-blue hover:bg-porter-hover text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition"
                  >
                    Complete Delivery
                  </button>
                </div>
                {otpError && <p className="text-xs text-rose-600 font-medium">{otpError}</p>}
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-porter-blue flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No active deliveries pending</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You are marked as <span className="text-emerald-600 font-bold">Online</span>. Click the button above to simulate a customer booking!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
