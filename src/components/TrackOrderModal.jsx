import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, Search, Truck, ArrowRight } from 'lucide-react';

export const STATUS_BADGE = {
  pending_payment: { label: 'Payment pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  confirmed: { label: 'Confirmed', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  searching: { label: 'Finding a driver', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  assigned: { label: 'Driver assigned', color: 'bg-blue-100 text-porter-blue border-blue-200' },
  in_transit: { label: 'On the way', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-800 border-rose-200' }
};

// Quick lookup of the signed-in customer's orders. The full live view is the /track page.
export default function TrackOrderModal() {
  const { isTrackModalOpen, setIsTrackModalOpen, orders, setActiveTrackingOrderId, user, requireLogin } = useApp();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isTrackModalOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setIsTrackModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isTrackModalOpen, setIsTrackModalOpen]);

  if (!isTrackModalOpen) return null;
  const close = () => setIsTrackModalOpen(false);
  const needle = q.trim().toUpperCase();
  const list = needle ? orders.filter((o) => o.id.includes(needle) || o.vehicleName.toUpperCase().includes(needle)) : orders;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="track-title" onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-porter-blue"><Truck className="w-5 h-5" /></div>
            <h3 id="track-title" className="text-base font-bold text-gray-900">Your orders</h3>
          </div>
          <button onClick={close} aria-label="Close" className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition"><X className="w-5 h-5" /></button>
        </div>

        {!user.isLoggedIn ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-gray-600">Log in to see and track your orders.</p>
            <button onClick={() => { close(); requireLogin(); }} className="px-5 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Log in</button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID" aria-label="Search orders" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue" />
              </div>
            </div>
            <ul className="overflow-y-auto divide-y divide-gray-100">
              {list.map((o) => {
                const badge = STATUS_BADGE[o.status] || STATUS_BADGE.searching;
                return (
                  <li key={o.id}>
                    <Link to="/track" onClick={() => { setActiveTrackingOrderId(o.id); close(); }} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900">{o.id} <span className="font-normal text-gray-400">· ₹{o.total}</span></span>
                        <span className="block text-xs text-gray-500 truncate">{o.vehicleName}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      </span>
                    </Link>
                  </li>
                );
              })}
              {list.length === 0 && <li className="p-8 text-center text-sm text-gray-500">{orders.length ? 'No order matches that ID.' : 'You have no orders yet.'}</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
