import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { X, Search, Phone, ShieldCheck, MapPin, Navigation, Clock, CheckCircle, Truck, Package, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrackOrderModal() {
  const { isTrackModalOpen, setIsTrackModalOpen, activeBookings, activeTrackingOrderId, setActiveTrackingOrderId } = useApp();
  const [searchId, setSearchId] = useState('');

  if (!isTrackModalOpen) return null;

  const currentOrder = activeBookings.find(b => b.orderId === (searchId.trim().toUpperCase() || activeTrackingOrderId)) || activeBookings[0];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return { label: 'Order Confirmed', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'assigned':
        return { label: 'Driver Assigned', color: 'bg-blue-100 text-porter-blue border-blue-200' };
      case 'in_transit':
        return { label: 'Out for Delivery / In Transit', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'delivered':
        return { label: 'Delivered', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      default:
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-porter-blue">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Live Order Tracking</h3>
              <p className="text-xs text-gray-500">Real-time GPS status of your goods in transit</p>
            </div>
          </div>
          <button
            onClick={() => setIsTrackModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. PRT-89412)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white uppercase tracking-wider"
            />
          </div>

          {activeBookings.length > 1 && (
            <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-gray-400 font-medium shrink-0">Recent Orders:</span>
              {activeBookings.map(b => (
                <button
                  key={b.orderId}
                  onClick={() => { setActiveTrackingOrderId(b.orderId); setSearchId(''); }}
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border transition shrink-0 ${
                    currentOrder?.orderId === b.orderId
                      ? 'bg-blue-50 border-porter-blue text-porter-blue'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {b.orderId}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        {currentOrder ? (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Order Details Card */}
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-4 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-base">{currentOrder.orderId}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(currentOrder.status).color}`}>
                    {getStatusBadge(currentOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Estimated Arrival: <span className="font-semibold text-gray-700">18 mins</span> ({currentOrder.distance})
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block font-medium">Total Fare</span>
                <span className="text-xl font-black text-porter-blue">₹{currentOrder.fare}</span>
              </div>
            </div>

            {/* Route Map Graphic / Visualization */}
            <div className="bg-gray-900 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1 font-semibold text-blue-400">
                    <Navigation className="w-3.5 h-3.5 animate-pulse" /> Live Trip Route
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono text-[11px]">
                    GPS ACTIVE
                  </span>
                </div>

                {/* Simulated Path Visualizer */}
                <div className="space-y-4 my-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">Pickup</span>
                      <p className="text-sm font-semibold text-gray-100">{currentOrder.pickup}</p>
                    </div>
                  </div>

                  <div className="ml-3 pl-3 border-l-2 border-dashed border-blue-500/40 py-2">
                    <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/60 p-2 rounded-lg border border-blue-800/40 w-fit">
                      <Truck className="w-4 h-4 text-porter-blue" />
                      <span>Vehicle in transit on Western Express Highway</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">Destination</span>
                      <p className="text-sm font-semibold text-gray-100">{currentOrder.drop}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver & Delivery Details */}
            {currentOrder.driver && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                    {currentOrder.driver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{currentOrder.driver.name}</h4>
                      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                        ★ {currentOrder.driver.rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {currentOrder.vehicleName} • <span className="font-bold text-gray-800">{currentOrder.driver.vehicleNo}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="text-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Delivery OTP</span>
                    <span className="text-sm font-mono font-black text-porter-blue">{currentOrder.driver.otp}</span>
                  </div>
                  <a
                    href={`tel:${currentOrder.driver.phone}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No matching order found</p>
            <p className="text-xs text-gray-500 mt-1">Please check the Order ID and try again.</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          <Link
            to="/track"
            onClick={() => setIsTrackModalOpen(false)}
            className="text-porter-blue font-bold hover:underline flex items-center gap-1"
          >
            <span>Open Full GPS Map & Invoice Dashboard →</span>
          </Link>
          <a
            href={`tel:${BRANDING.supportPhone.replace(/\s+/g, '')}`}
            className="text-gray-600 hover:text-porter-blue font-semibold flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-porter-blue" />
            <span>24x7 Helpdesk ({BRANDING.supportPhone})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
