import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import InteractiveMap from '../components/InteractiveMap';
import { STATUS_BADGE } from '../components/TrackOrderModal';
import { Star, Truck, Phone, ShieldCheck, MapPin, ArrowLeft, Share2, FileText, CheckCircle2, AlertTriangle, CreditCard, XCircle, Loader2 } from 'lucide-react';

const STEPS = ['Booked', 'Driver assigned', 'On the way', 'Delivered'];
const stepIndex = (s) => ({ pending_payment: -1, scheduled: 0, confirmed: 0, searching: 0, assigned: 1, in_transit: 2, delivered: 3 }[s] ?? 0);
const EVENT_LABEL = {
  created: 'Order placed', payment_paid: 'Payment received', dispatch_started: 'Finding a driver', offer_sent: 'Offered to a nearby driver',
  driver_assigned: 'Driver assigned', admin_assigned: 'Driver assigned by support', picked_up: 'Goods picked up', delivered: 'Delivered', cancelled: 'Order cancelled'
};

// Live order: an initial fetch, then Server-Sent Events for status and driver GPS, with slow polling as a safety net.
function useOrderLive(orderId) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [driverPos, setDriverPos] = useState(null);

  const load = useCallback(async () => {
    try { setOrder((await api.get(`/orders/${orderId}`)).order); setError(''); }
    catch (e) { setError(e.message); }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return undefined;
    setOrder(null); setDriverPos(null); load();
    let es;
    if (typeof EventSource !== 'undefined') {
      es = new EventSource(api.url(`/orders/${orderId}/stream`), { withCredentials: true });
      es.addEventListener('order', (e) => setOrder((o) => ({ ...(o || {}), ...JSON.parse(e.data) })));
      es.addEventListener('driver_location', (e) => { const d = JSON.parse(e.data); setDriverPos([d.lat, d.lng]); });
    }
    const poll = setInterval(load, 20000);
    return () => { es?.close(); clearInterval(poll); };
  }, [orderId, load]);

  return { order, error, driverPos, reload: load };
}

function RatingCard({ order, onRated }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (order.rating) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-200 text-center space-y-1">
        <p className="text-xs font-bold text-gray-500">Your rating</p>
        <div className="flex justify-center gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-5 h-5 ${n <= order.rating.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}</div>
        {order.rating.comment && <p className="text-xs text-gray-500 italic">“{order.rating.comment}”</p>}
      </div>
    );
  }
  const submit = async () => {
    setBusy(true); setErr('');
    try { await api.post(`/orders/${order.id}/rating`, { stars, ...(comment.trim() ? { comment: comment.trim() } : {}) }); await onRated(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
      <p className="text-sm font-bold text-gray-900">How was {order.driver?.name || 'your driver'}?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} className="p-0.5">
            <Star className={`w-7 h-7 transition ${n <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} rows={2} placeholder="Add a comment (optional)" aria-label="Comment" className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-porter-blue" />
      {err && <p role="alert" className="text-xs text-rose-600">{err}</p>}
      <button disabled={!stars || busy} onClick={submit} className="w-full py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl disabled:opacity-50">{busy ? 'Submitting…' : 'Submit rating'}</button>
    </div>
  );
}

export default function OrderTrackingPage() {
  usePageTitle('Track your order');
  const { orders, ordersLoading, activeTrackingOrderId, setActiveTrackingOrderId, user, requireLogin, cancelOrder, payPending, refreshOrders } = useApp();
  const { orderId: routeId } = useParams();
  const { state } = useLocation();
  const orderId = routeId || activeTrackingOrderId || orders[0]?.id;
  const { order, error, driverPos, reload } = useOrderLive(user.isLoggedIn ? orderId : null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(state?.paymentPending ? 'Your booking is saved but not paid yet. Complete the payment to start looking for a driver.' : '');
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (routeId) setActiveTrackingOrderId(routeId); }, [routeId, setActiveTrackingOrderId]);

  const run = async (name, fn) => {
    setBusy(name); setNotice('');
    try { await fn(); await reload(); await refreshOrders(); }
    catch (e) { if (!e.dismissed) setNotice(e.message); }
    finally { setBusy(''); }
  };

  const pickup = useMemo(() => (order?.pickup?.lat != null ? [order.pickup.lat, order.pickup.lng] : null), [order]);
  const drop = useMemo(() => (order?.drop?.lat != null ? [order.drop.lat, order.drop.lng] : null), [order]);
  const driverCoord = driverPos || (order?.driver?.lat != null && ['assigned', 'in_transit'].includes(order.status) ? [order.driver.lat, order.driver.lng] : null);

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Truck className="w-14 h-14 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Log in to track your orders</h2>
        <button onClick={() => requireLogin()} className="mt-4 px-6 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Log in</button>
      </div>
    );
  }
  if (!orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Truck className="w-14 h-14 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">{ordersLoading ? 'Loading your orders…' : 'No orders yet'}</h2>
        {!ordersLoading && <Link to="/fare-estimate" className="mt-4 px-6 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Get a fare estimate</Link>}
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        {error ? <><AlertTriangle className="w-10 h-10 text-rose-400 mb-2" /><p className="text-sm text-rose-600">{error}</p><Link to="/" className="mt-3 text-xs text-porter-blue font-bold">Back to home</Link></> : <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />}
      </div>
    );
  }

  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.searching;
  const idx = stepIndex(order.status);
  const cancelled = order.status === 'cancelled';
  const canCancel = ['pending_payment', 'scheduled', 'confirmed', 'searching', 'assigned'].includes(order.status);
  const shareUrl = `${window.location.origin}/t/${order.trackToken}`;

  const share = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Copy tracking link:', shareUrl); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-porter-blue mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Home</Link>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3 flex-wrap">
              Order {order.id}
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>{badge.label}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">{order.vehicleName}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={share} className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-porter-blue flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> {copied ? 'Link copied' : 'Share tracking link'}
            </button>
            {order.status === 'delivered' && (
              <a href={api.url(`/orders/${order.id}/invoice.pdf`)} className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-porter-blue flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Invoice (PDF)
              </a>
            )}
          </div>
        </div>

        {orders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {orders.map((o) => (
              <button key={o.id} onClick={() => setActiveTrackingOrderId(o.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${o.id === order.id ? 'bg-porter-blue text-white border-porter-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {o.id} · ₹{o.total}
              </button>
            ))}
          </div>
        )}

        {notice && <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">{notice}</div>}

        {order.status === 'pending_payment' && (
          <div className="p-4 bg-white border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Payment pending</p>
              <p className="text-xs text-gray-500">We start looking for a driver as soon as your payment of ₹{order.total} is confirmed.</p>
            </div>
            <button disabled={!!busy} onClick={() => run('pay', () => payPending(order.id))} className="px-5 py-2.5 bg-porter-blue disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-2">
              {busy === 'pay' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pay ₹{order.total}
            </button>
          </div>
        )}

        {cancelled ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 flex items-start gap-3">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This order was cancelled{order.cancelledBy === 'system' ? ' because no driver was available' : ''}.</p>
              {order.paymentStatus === 'refunded' && <p className="text-xs mt-1">Your payment has been refunded to the original payment method.</p>}
              {order.paymentStatus === 'refund_pending' && <p className="text-xs mt-1">Your refund is being processed. It can take a few working days to appear.</p>}
            </div>
          </div>
        ) : (
          <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
            {STEPS.map((label, i) => (
              <li key={label} className="text-center">
                <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-porter-blue' : 'bg-gray-200'}`} />
                <p className={`mt-1.5 text-[11px] font-semibold ${i <= idx ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            {pickup && drop && (
              <InteractiveMap pickupCoord={pickup} dropCoord={drop} stopCoord={order.stop?.lat != null ? [order.stop.lat, order.stop.lng] : null} routeLine={order.route} driverCoord={driverCoord} pickupLabel={order.pickup.address} dropLabel={order.drop.address} driverLabel={order.driver?.name || 'Driver'} height="380px" />
            )}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 grid sm:grid-cols-2 gap-4 text-xs">
              <div className="flex gap-2.5"><MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-gray-400 font-semibold">Pickup</p><p className="font-semibold text-gray-800">{order.pickup.address}</p></div></div>
              {order.stop && <div className="flex gap-2.5 sm:col-span-2"><MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><div><p className="text-gray-400 font-semibold">Stop on the way</p><p className="font-semibold text-gray-800">{order.stop.address}</p></div></div>}
              <div className="flex gap-2.5"><MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /><div><p className="text-gray-400 font-semibold">Drop</p><p className="font-semibold text-gray-800">{order.drop.address}</p></div></div>
            </div>
            {order.events?.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Activity</h3>
                <ul className="space-y-2.5">
                  {order.events.filter((e) => EVENT_LABEL[e.type]).map((e, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-semibold text-gray-800">{EVENT_LABEL[e.type]}</span>
                      <span className="text-gray-400 ml-auto">{new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            {order.driver && !cancelled && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-porter-blue font-black flex items-center justify-center">{order.driver.name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.driver.name}</p>
                    <p className="text-xs text-gray-500">★ {Number(order.driver.rating).toFixed(1)} · <span className="font-mono">{order.driver.vehicleNo}</span></p>
                  </div>
                </div>
                {order.driver.phone && <a href={`tel:+91${order.driver.phone}`} className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Phone className="w-3.5 h-3.5" /> Call driver</a>}
              </div>
            )}

            {order.status === 'delivered' && order.driver && <RatingCard order={order} onRated={reload} />}

            {order.deliveryOtp && !cancelled && order.status !== 'pending_payment' && (
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Delivery OTP</p>
                <p className="text-3xl font-mono font-black text-gray-900 tracking-[0.3em] mt-1">{order.deliveryOtp}</p>
                <p className="text-[11px] text-amber-800 mt-1.5">The receiver gives this code to the driver at delivery. Never share it earlier.</p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-black text-gray-900">₹{order.total}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold text-gray-800">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'} · {String(order.paymentStatus).replace(/_/g, ' ')}</span></div>
              {order.distanceKm != null && <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="font-bold text-gray-800">{order.distanceKm} km</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Receiver</span><span className="font-bold text-gray-800">{order.receiver?.name}</span></div>
            </div>

            {canCancel && (
              <button disabled={!!busy} onClick={() => { if (window.confirm('Cancel this order?')) run('cancel', () => cancelOrder(order.id, 'Cancelled by customer')); }} className="w-full py-2.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 disabled:opacity-60">
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Only share the OTP with the driver at delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
