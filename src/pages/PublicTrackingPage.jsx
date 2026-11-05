import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import InteractiveMap from '../components/InteractiveMap';
import { STATUS_BADGE } from '../components/TrackOrderModal';
import { Truck, MapPin } from 'lucide-react';

// Receiver-facing page opened from the SMS / share link. No login, no phone numbers, no OTP.
export default function PublicTrackingPage() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () => api.get(`/track/${encodeURIComponent(token)}`).then((r) => { if (alive) { setOrder(r.order); setError(''); } }).catch((e) => { if (alive) setError(e.message); });
    load();
    const t = setInterval(load, 8000);
    return () => { alive = false; clearInterval(t); };
  }, [token]);

  if (error && !order) return <div className="min-h-[60vh] flex items-center justify-center p-6 text-center text-sm text-gray-600">{error}</div>;
  if (!order) return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">Loading…</div>;

  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.searching;
  const driver = order.driver && order.driver.lat != null && ['assigned', 'in_transit'].includes(order.status) ? [order.driver.lat, order.driver.lng] : null;
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3"><Truck className="w-6 h-6 text-porter-blue" /><h1 className="text-xl font-black text-gray-900">Order {order.id}</h1><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>{badge.label}</span></div>
        {order.pickup?.lat != null && order.drop?.lat != null && <InteractiveMap pickupCoord={[order.pickup.lat, order.pickup.lng]} dropCoord={[order.drop.lat, order.drop.lng]} routeLine={order.route} driverCoord={driver} height="340px" />}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 text-xs space-y-3">
          <div className="flex gap-2.5"><MapPin className="w-4 h-4 text-emerald-600 shrink-0" /><span className="font-semibold text-gray-800">{order.pickup.address}</span></div>
          <div className="flex gap-2.5"><MapPin className="w-4 h-4 text-rose-500 shrink-0" /><span className="font-semibold text-gray-800">{order.drop.address}</span></div>
          {order.driver && <p className="text-gray-500 pt-2 border-t border-gray-100">Driver: <span className="font-bold text-gray-800">{order.driver.name}</span> · <span className="font-mono">{order.driver.vehicleNo}</span></p>}
        </div>
        <p className="text-[11px] text-gray-400 text-center">Keep your delivery OTP ready. Share it only with the driver at delivery.</p>
      </div>
    </div>
  );
}
