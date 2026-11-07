import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import InteractiveMap from '../components/InteractiveMap';
import { Truck, MapPin, Phone, Power, Banknote, CheckCircle2, Loader2, AlertTriangle, Navigation } from 'lucide-react';

const useCountdown = (iso) => {
  const [left, setLeft] = useState(() => Math.max(0, Math.round((new Date(iso) - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, Math.round((new Date(iso) - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [iso]);
  return left;
};

function OfferCard({ offer, onAccept, onReject, busy }) {
  const left = useCountdown(offer.expiresAt);
  return (
    <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 space-y-3 shadow-lg animate-scaleUp">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">New trip request</span>
        <span className={`text-xs font-mono font-black ${left <= 8 ? 'text-rose-600' : 'text-gray-700'}`}>{left}s</span>
      </div>
      <div className="text-xs space-y-1.5">
        <p className="flex gap-2"><MapPin className="w-4 h-4 text-emerald-600 shrink-0" /><span className="font-semibold">{offer.pickup}</span></p>
        <p className="flex gap-2"><MapPin className="w-4 h-4 text-rose-500 shrink-0" /><span className="font-semibold">{offer.drop}</span></p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{offer.vehicleName}{offer.distanceKm ? ` · ${offer.distanceKm} km` : ''}</span>
        <span className="font-black text-lg text-gray-900">You earn ₹{offer.earn}</span>
      </div>
      {offer.collectCash > 0 && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">Collect ₹{offer.collectCash} cash from the receiver.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={() => onReject(offer.id)} className="py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Decline</button>
        <button disabled={busy || left === 0} onClick={() => onAccept(offer.id)} className="py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Accept</button>
      </div>
    </div>
  );
}

export default function DriverPortalPage() {
  usePageTitle('Driver portal');
  const { user, authReady, requireLogin, logout, setIsProfileModalOpen } = useApp();
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [gps, setGps] = useState({ pos: null, error: '' });
  const lastSent = useRef(0);

  const load = useCallback(async () => {
    try { setMe(await api.get('/driver/me')); setError(''); } catch (e) { setError(e.message); }
  }, []);

  const isDriver = user.role === 'driver';
  useEffect(() => {
    if (!isDriver) return undefined;
    load();
    const poll = setInterval(load, 10000);
    let es;
    if (typeof EventSource !== 'undefined') {
      es = new EventSource(api.url('/driver/stream'), { withCredentials: true });
      ['offer', 'offer_expired', 'assigned', 'order_cancelled'].forEach((t) => es.addEventListener(t, load));
    }
    return () => { clearInterval(poll); es?.close(); };
  }, [isDriver, load]);

  // Report real GPS while online (at most one update every 8 seconds).
  const online = !!me?.driver?.online;
  useEffect(() => {
    if (!online) return undefined;
    if (!navigator.geolocation) { setGps({ pos: null, error: 'This device cannot share its location.' }); return undefined; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = [p.coords.latitude, p.coords.longitude];
        setGps({ pos, error: '' });
        if (Date.now() - lastSent.current > 8000) { lastSent.current = Date.now(); api.post('/driver/location', { lat: pos[0], lng: pos[1] }).catch(() => {}); }
      },
      () => setGps({ pos: null, error: 'Location is blocked. Allow location access to receive trips.' }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [online]);

  const act = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (!authReady) return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (!isDriver) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Truck className="w-14 h-14 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Driver partner portal</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">{user.isLoggedIn ? 'This account is not a driver account.' : 'Log in with the mobile number registered by our team.'}</p>
        {user.isLoggedIn
          ? <button onClick={logout} className="mt-4 px-6 py-2.5 border border-gray-300 text-xs font-bold rounded-xl">Log out</button>
          : <button onClick={() => requireLogin()} className="mt-4 px-6 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Driver login</button>}
      </div>
    );
  }
  if (!me) return <div className="min-h-[60vh] flex items-center justify-center">{error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />}</div>;

  const { driver, activeOrder: trip, offers, earnings } = me;
  const approved = driver.status === 'approved';

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-mono">{driver.vehicleNo}</p>
            <h1 className="text-lg font-black">{driver.name || 'Driver'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-amber-400 font-bold">★ {Number(driver.rating).toFixed(1)}</span>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline"
              >
                Profile & KYC Docs
              </button>
            </div>
          </div>
          <button
            disabled={!approved || busy || !!trip}
            onClick={() => act(() => api.post('/driver/online', { online: !online }))}
            aria-pressed={online}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition disabled:opacity-50 ${online ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}
          >
            <Power className="w-4 h-4" /> {online ? 'Online' : 'Go online'}
          </button>
        </div>

        {!approved && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
            <p className="font-bold">{driver.status === 'pending' ? 'Your account is waiting for verification.' : `Your account is ${driver.status}.`}</p>
            {(driver.documentIssues || []).map((i) => <p key={i}>• {i}</p>)}
            <p>Contact support once your documents are up to date.</p>
          </div>
        )}
        {approved && (() => {
          const soon = [['Driving licence', driver.documents?.licenseExpiry], ['Vehicle registration', driver.documents?.rcExpiry], ['Insurance', driver.documents?.insuranceExpiry]]
            .filter(([, d]) => d && new Date(d) - Date.now() < 30 * 86400000);
          return soon.length ? <div role="status" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">{soon.map(([k, d]) => <p key={k}>{k} expires on {d}. Renew it to keep receiving trips.</p>)}</div> : null;
        })()}
        {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">{error}</div>}
        {online && gps.error && <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{gps.error}</div>}

        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Today', `₹${earnings.today}`], ['Trips', earnings.trips], ['Total', `₹${earnings.total}`]].map(([k, v]) => (
            <div key={k} className="bg-white rounded-xl border border-gray-200 py-3"><p className="text-[11px] text-gray-400 font-semibold">{k}</p><p className="text-base font-black text-gray-900">{v}</p></div>
          ))}
        </div>

        {trip ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black text-gray-900">Order {trip.id}</h2><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-porter-blue">{trip.status === 'assigned' ? 'Go to pickup' : 'Deliver now'}</span></div>
            {trip.pickup.lat != null && trip.drop.lat != null && <InteractiveMap pickupCoord={[trip.pickup.lat, trip.pickup.lng]} dropCoord={[trip.drop.lat, trip.drop.lng]} routeLine={trip.route} driverCoord={gps.pos} height="220px" />}
            <div className="text-xs space-y-2">
              <p className="flex gap-2"><MapPin className="w-4 h-4 text-emerald-600 shrink-0" /><span><span className="text-gray-400">Pickup · </span><span className="font-semibold">{trip.pickup.address}</span><br /><span className="text-gray-500">{trip.sender.name}</span> <a className="text-porter-blue font-bold" href={`tel:+91${trip.sender.phone}`}>Call</a></span></p>
              <p className="flex gap-2"><MapPin className="w-4 h-4 text-rose-500 shrink-0" /><span><span className="text-gray-400">Drop · </span><span className="font-semibold">{trip.drop.address}</span><br /><span className="text-gray-500">{trip.receiver.name}</span> <a className="text-porter-blue font-bold" href={`tel:+91${trip.receiver.phone}`}>Call</a></span></p>
              {trip.goodsType && <p className="text-gray-500">Goods: <span className="font-semibold text-gray-800">{trip.goodsType}</span></p>}
              {trip.notes && <p className="text-gray-500">Note: <span className="font-semibold text-gray-800">{trip.notes}</span></p>}
            </div>
            {trip.collectCash > 0 && <p className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"><Banknote className="w-4 h-4" /> Collect ₹{trip.collectCash} cash on delivery</p>}
            <a className="w-full py-2.5 text-xs font-bold text-porter-blue bg-blue-50 rounded-xl flex items-center justify-center gap-2" target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps/dir/?api=1&destination=${(trip.status === 'assigned' ? trip.pickup : trip.drop).lat},${(trip.status === 'assigned' ? trip.pickup : trip.drop).lng}`}>
              <Navigation className="w-4 h-4" /> Open navigation
            </a>

            {trip.status === 'assigned' ? (
              <button disabled={busy} onClick={() => act(() => api.post(`/driver/orders/${trip.id}/pickup`))} className="w-full py-3 bg-porter-blue text-white text-sm font-bold rounded-xl disabled:opacity-60">Goods picked up</button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); act(async () => { await api.post(`/driver/orders/${trip.id}/deliver`, { otp }); setOtp(''); }); }} className="space-y-2">
                <label htmlFor="otp" className="text-xs font-bold text-gray-700">Receiver's 4-digit OTP</label>
                <input id="otp" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-porter-blue" />
                <button disabled={busy || otp.length !== 4} className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Complete delivery</button>
              </form>
            )}
          </div>
        ) : (
          <>
            {offers.map((o) => <OfferCard key={o.id} offer={o} busy={busy} onAccept={(id) => act(() => api.post(`/driver/offers/${id}/accept`))} onReject={(id) => act(() => api.post(`/driver/offers/${id}/reject`))} />)}
            {offers.length === 0 && (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-sm text-gray-500">
                {online ? 'You are online. New trip requests will appear here.' : 'Go online to start receiving trips.'}
              </div>
            )}
          </>
        )}
        <button onClick={logout} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2">Log out</button>
      </div>
    </div>
  );
}
