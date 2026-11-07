import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { CITIES } from '../data/mockData';
import { STATUS_BADGE } from '../components/TrackOrderModal';
import { Activity, Users, Banknote, CheckCircle, Download, RefreshCw, ShieldCheck } from 'lucide-react';

const card = 'bg-slate-800/60 border border-slate-700/60 rounded-2xl';
const input = 'px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const btn = 'px-3 py-1.5 text-[11px] font-bold rounded-lg border transition disabled:opacity-50';

function useAdmin(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setData(await api.get(path)); setError(''); } catch (e) { setError(e.message); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, error, reload: load };
}

function OrdersTab({ onChanged }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 350); return () => clearTimeout(t); }, [q]);
  const qs = `status=${status}&q=${encodeURIComponent(debounced)}`;
  const { data, error, reload } = useAdmin(`/admin/orders?${qs}`);
  const drivers = useAdmin('/admin/drivers');
  const [msg, setMsg] = useState('');
  useEffect(() => { const t = setInterval(reload, 15000); return () => clearInterval(t); }, [reload]);

  const run = async (fn) => { setMsg(''); try { await fn(); await reload(); onChanged(); } catch (e) { setMsg(e.message); } };
  const assignable = (drivers.data?.drivers || []).filter((d) => d.status === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order ID, address or sender phone" aria-label="Search orders" className={`${input} w-72`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className={input}>
          {['all', ...Object.keys(STATUS_BADGE)].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_BADGE[s].label}</option>)}
        </select>
        <button onClick={reload} className={`${btn} border-slate-600 text-slate-300 flex items-center gap-1`}><RefreshCw className="w-3 h-3" /> Refresh</button>
        <a href={api.url(`/admin/orders.csv?${qs}`)} className={`${btn} border-slate-600 text-slate-300 flex items-center gap-1`}><Download className="w-3 h-3" /> Export CSV</a>
        <span className="text-[11px] text-slate-500 ml-auto">{data?.total ?? 0} orders</span>
      </div>
      {(msg || error) && <p role="alert" className="text-xs text-rose-400">{msg || error}</p>}
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700"><tr>{['Order', 'Status', 'Route', 'Total', 'Payment', 'Driver', 'Actions'].map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-700/60">
            {(data?.orders || []).map((o) => {
              const b = STATUS_BADGE[o.status];
              const open = !['delivered', 'cancelled'].includes(o.status);
              return (
                <tr key={o.id} className="align-top">
                  <td className="px-3 py-2.5 font-mono font-bold">{o.id}<div className="text-[10px] text-slate-500 font-sans">{new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${b.color}`}>{b.label}</span></td>
                  <td className="px-3 py-2.5 max-w-xs"><div className="truncate">{o.pickup.address}</div><div className="truncate text-slate-400">→ {o.drop.address}</div><div className="text-[10px] text-slate-500">{o.vehicleName}</div></td>
                  <td className="px-3 py-2.5 font-bold">₹{o.total}</td>
                  <td className="px-3 py-2.5">{o.paymentMethod === 'cod' ? 'COD' : 'Online'}<div className="text-[10px] text-slate-400">{o.paymentStatus.replace(/_/g, ' ')}</div></td>
                  <td className="px-3 py-2.5">{o.driver ? <>{o.driver.name}<div className="text-[10px] text-slate-500 font-mono">{o.driver.vehicleNo}</div></> : <span className="text-slate-500">—</span>}</td>
                  <td className="px-3 py-2.5 space-y-1.5">
                    {['searching', 'confirmed', 'scheduled', 'assigned'].includes(o.status) && (
                      <select aria-label={`Assign driver to ${o.id}`} defaultValue="" onChange={(e) => e.target.value && run(() => api.post(`/admin/orders/${o.id}/assign`, { driverId: e.target.value }))} className={`${input} w-36 py-1`}>
                        <option value="">Assign driver…</option>
                        {assignable.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.vehicle_id}</option>)}
                      </select>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {open && <button className={`${btn} border-rose-700 text-rose-300 hover:bg-rose-950`} onClick={() => { const reason = window.prompt(`Cancel ${o.id}? Enter a reason (shown in the audit log):`); if (reason && reason.trim().length >= 3) run(() => api.post(`/admin/orders/${o.id}/cancel`, { reason: reason.trim() })); }}>Cancel</button>}
                      {o.otpAttempts >= 5 && <button className={`${btn} border-amber-700 text-amber-300`} onClick={() => run(() => api.post(`/admin/orders/${o.id}/reset-otp`))}>Reset OTP lock</button>}
                      {o.status === 'cancelled' && o.paymentStatus === 'refund_pending' && <button className={`${btn} border-indigo-600 text-indigo-300`} onClick={() => run(() => api.post(`/admin/orders/${o.id}/refund`))}>Retry refund</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data && data.orders.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriversTab() {
  const { data, error, reload } = useAdmin('/admin/drivers');
  const vehicles = useAdmin('/admin/vehicles');
  const blank = { name: '', phone: '', cityId: 'mumbai', vehicleId: 'tata-ace', vehicleNo: '', licenseNo: '', licenseExpiry: '', rcExpiry: '', insuranceExpiry: '' };
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null); // driver id whose documents are being edited
  const [docs, setDocs] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const docsOf = (f) => (f.licenseNo || f.licenseExpiry || f.rcExpiry || f.insuranceExpiry
    ? { documents: { licenseNo: f.licenseNo, licenseExpiry: f.licenseExpiry, rcExpiry: f.rcExpiry, insuranceExpiry: f.insuranceExpiry } } : {});

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/admin/drivers', { name: form.name, phone: form.phone, cityId: form.cityId, vehicleId: form.vehicleId, vehicleNo: form.vehicleNo, ...docsOf(form) });
      setForm(blank); reload();
    } catch (err) { setMsg(err.message); }
  };
  const setStatus = async (d, status) => {
    setMsg('');
    try { await api.patch(`/admin/drivers/${d.id}`, { status }); reload(); }
    catch (err) { setMsg(err.details?.length ? `${err.message} ${err.details.slice(1).join('. ')}` : err.message); }
  };
  const saveDocs = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api.patch(`/admin/drivers/${editing}/documents`, docs); setEditing(null); reload(); }
    catch (err) { setMsg(err.message); }
  };
  const expired = (d) => d && d < new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className={`${card} p-4 space-y-2`}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input required placeholder="Name" aria-label="Driver name" value={form.name} onChange={set('name')} className={input} />
          <input required placeholder="Mobile (10 digits)" aria-label="Driver mobile" inputMode="numeric" value={form.phone} onChange={set('phone')} className={input} />
          <select aria-label="City" value={form.cityId} onChange={set('cityId')} className={input}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select aria-label="Vehicle" value={form.vehicleId} onChange={set('vehicleId')} className={input}>{(vehicles.data?.vehicles || []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <input required placeholder="Plate e.g. MH02AB1234" aria-label="Vehicle number" value={form.vehicleNo} onChange={set('vehicleNo')} className={input} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <input placeholder="Licence number" aria-label="Licence number" value={form.licenseNo} onChange={set('licenseNo')} className={input} />
          <label className="text-[10px] text-slate-400">Licence expiry<input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} className={`${input} w-full mt-0.5`} /></label>
          <label className="text-[10px] text-slate-400">RC expiry<input type="date" value={form.rcExpiry} onChange={set('rcExpiry')} className={`${input} w-full mt-0.5`} /></label>
          <label className="text-[10px] text-slate-400">Insurance expiry<input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} className={`${input} w-full mt-0.5`} /></label>
          <button className={`${btn} bg-indigo-600 border-indigo-500 text-white py-2.5`}>Add driver (pending)</button>
        </div>
        <p className="text-[11px] text-slate-500">New drivers start as pending. Check the original documents, then approve. A driver cannot go online until approved, and is suspended automatically when a document expires.</p>
        {(msg || error) && <p role="alert" className="text-xs text-rose-400">{msg || error}</p>}
      </form>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700"><tr>{['Driver', 'City / vehicle', 'Documents', 'Status', 'Rating', 'Online', ''].map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-700/60">
            {(data?.drivers || []).map((d) => (
              <React.Fragment key={d.id}>
                <tr className="align-top">
                  <td className="px-3 py-2.5 font-bold">{d.name}<div className="text-[10px] text-slate-500 font-mono">+91 {d.phone}</div></td>
                  <td className="px-3 py-2.5">{d.city_id} · {d.vehicle_id}<div className="text-[10px] text-slate-500 font-mono">{d.vehicle_no}</div></td>
                  <td className="px-3 py-2.5 text-[11px]">
                    <div className="font-mono text-slate-300">{d.license_no || <span className="text-rose-400">no licence no.</span>}</div>
                    {[['Licence', d.license_expiry], ['RC', d.rc_expiry], ['Insurance', d.insurance_expiry]].map(([k, v]) => (
                      <div key={k} className={!v || expired(v) ? 'text-rose-400' : 'text-slate-400'}>{k}: {v || 'missing'}{expired(v) ? ' (expired)' : ''}</div>
                    ))}
                  </td>
                  <td className="px-3 py-2.5">{d.status}{d.verified_at && d.status === 'approved' ? <div className="text-[10px] text-slate-500">verified {new Date(d.verified_at).toLocaleDateString('en-IN')}</div> : null}</td>
                  <td className="px-3 py-2.5">{d.rating_count ? `★ ${Number(d.rating).toFixed(1)} (${d.rating_count})` : '—'}</td>
                  <td className="px-3 py-2.5">{d.online ? <span className="text-emerald-400 font-bold">Online</span> : <span className="text-slate-500">Offline</span>}{d.active_orders ? <div className="text-[10px] text-slate-400">{d.active_orders} active</div> : null}</td>
                  <td className="px-3 py-2.5 space-y-1.5">
                    <button className={`${btn} ${d.status === 'approved' ? 'border-rose-700 text-rose-300' : 'border-emerald-700 text-emerald-300'}`} onClick={() => setStatus(d, d.status === 'approved' ? 'suspended' : 'approved')}>{d.status === 'approved' ? 'Suspend' : d.status === 'pending' ? 'Approve' : 'Reinstate'}</button>
                    <button className={`${btn} border-slate-600 text-slate-300 block`} onClick={() => { setEditing(editing === d.id ? null : d.id); setDocs({ licenseNo: d.license_no || '', licenseExpiry: d.license_expiry || '', rcExpiry: d.rc_expiry || '', insuranceExpiry: d.insurance_expiry || '' }); }}>Documents</button>
                  </td>
                </tr>
                {editing === d.id && (
                  <tr><td colSpan={7} className="px-3 py-3 bg-slate-900/60">
                    <form onSubmit={saveDocs} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                      <input required placeholder="Licence number" aria-label="Licence number" value={docs.licenseNo} onChange={(e) => setDocs({ ...docs, licenseNo: e.target.value })} className={input} />
                      <label className="text-[10px] text-slate-400">Licence expiry<input required type="date" value={docs.licenseExpiry} onChange={(e) => setDocs({ ...docs, licenseExpiry: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
                      <label className="text-[10px] text-slate-400">RC expiry<input required type="date" value={docs.rcExpiry} onChange={(e) => setDocs({ ...docs, rcExpiry: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
                      <label className="text-[10px] text-slate-400">Insurance expiry<input required type="date" value={docs.insuranceExpiry} onChange={(e) => setDocs({ ...docs, insuranceExpiry: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
                      <button className={`${btn} bg-indigo-600 border-indigo-500 text-white py-2.5`}>Save documents</button>
                    </form>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
            {data && data.drivers.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No drivers yet. Add one above; they log in with their mobile number.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingTab() {
  const vehicles = useAdmin('/admin/vehicles');
  const promos = useAdmin('/admin/promos');
  const [msg, setMsg] = useState('');
  const [promo, setPromo] = useState({ code: '', discountPercent: 10, maxDiscount: 50, minFare: 0, maxUsesPerUser: '' });
  const save = async (v, form) => {
    setMsg('');
    try { await api.put(`/admin/vehicles/${v.id}`, { basePrice: Number(form.get('basePrice')), ratePerKm: Number(form.get('ratePerKm')), active: form.get('active') === 'on' }); setMsg(`${v.name} saved.`); vehicles.reload(); }
    catch (e) { setMsg(e.message); }
  };
  const addPromo = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/admin/promos', { code: promo.code, discountPercent: Number(promo.discountPercent), maxDiscount: Number(promo.maxDiscount), minFare: Number(promo.minFare), ...(promo.maxUsesPerUser ? { maxUsesPerUser: Number(promo.maxUsesPerUser) } : {}) });
      setPromo({ ...promo, code: '' }); promos.reload();
    } catch (err) { setMsg(err.message); }
  };
  return (
    <div className="space-y-5">
      {msg && <p role="status" className="text-xs text-indigo-300">{msg}</p>}
      <div className={`${card} p-4 space-y-3`}>
        <h3 className="text-sm font-bold">Vehicle tariffs <span className="text-[11px] font-normal text-slate-400">· changes apply to new quotes immediately</span></h3>
        {(vehicles.data?.vehicles || []).map((v) => (
          <form key={v.id} onSubmit={(e) => { e.preventDefault(); save(v, new FormData(e.currentTarget)); }} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-xs">
            <div className="md:col-span-2"><p className="font-bold">{v.name}</p><p className="text-[10px] text-slate-500">{v.category} · first {v.base_km} km included</p></div>
            <label className="text-[10px] text-slate-400">Base ₹<input name="basePrice" type="number" min="0" required defaultValue={v.base_price} className={`${input} w-full mt-0.5`} /></label>
            <label className="text-[10px] text-slate-400">₹ per km<input name="ratePerKm" type="number" min="0" step="0.5" required defaultValue={v.rate_per_km} className={`${input} w-full mt-0.5`} /></label>
            <label className="text-[11px] flex items-center gap-1.5 text-slate-300"><input name="active" type="checkbox" defaultChecked={v.active} /> Bookable</label>
            <button className={`${btn} bg-indigo-600 border-indigo-500 text-white py-2`}>Save</button>
          </form>
        ))}
      </div>
      <div className={`${card} p-4 space-y-3`}>
        <h3 className="text-sm font-bold">Coupons</h3>
        <form onSubmit={addPromo} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <input required placeholder="CODE" aria-label="Coupon code" value={promo.code} onChange={(e) => setPromo({ ...promo, code: e.target.value.toUpperCase() })} className={input} />
          <label className="text-[10px] text-slate-400">% off<input type="number" min="1" max="100" value={promo.discountPercent} onChange={(e) => setPromo({ ...promo, discountPercent: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
          <label className="text-[10px] text-slate-400">Max ₹<input type="number" min="0" value={promo.maxDiscount} onChange={(e) => setPromo({ ...promo, maxDiscount: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
          <label className="text-[10px] text-slate-400">Min fare ₹<input type="number" min="0" value={promo.minFare} onChange={(e) => setPromo({ ...promo, minFare: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
          <label className="text-[10px] text-slate-400">Uses / user<input type="number" min="1" value={promo.maxUsesPerUser} onChange={(e) => setPromo({ ...promo, maxUsesPerUser: e.target.value })} className={`${input} w-full mt-0.5`} /></label>
          <button className={`${btn} bg-indigo-600 border-indigo-500 text-white py-2`}>Create</button>
        </form>
        <ul className="divide-y divide-slate-700/60 text-xs">
          {(promos.data?.promos || []).map((p) => (
            <li key={p.code} className="py-2 flex items-center justify-between gap-3">
              <span><span className="font-mono font-bold">{p.code}</span> · {p.discount_percent}% up to ₹{p.max_discount}, min ₹{p.min_fare}{p.categories ? ` · ${p.categories.join('/')}` : ''}{p.max_uses_per_user ? ` · ${p.max_uses_per_user}/user` : ''} · used {p.used}×</span>
              <button className={`${btn} border-slate-600 text-slate-300`} onClick={async () => { await api.patch(`/admin/promos/${p.code}`, { active: !p.active }); promos.reload(); }}>{p.active ? 'Disable' : 'Enable'}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LeadsTab() {
  const { data, reload } = useAdmin('/admin/leads');
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-xs text-left">
        <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700"><tr>{['Company', 'Contact', 'Details', 'Received', 'Status'].map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-700/60">
          {(data?.leads || []).map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-bold">{l.company}</td>
              <td className="px-3 py-2.5">{l.contact}<div className="text-[10px] text-slate-500">+91 {l.phone}{l.email ? ` · ${l.email}` : ''}</div></td>
              <td className="px-3 py-2.5 text-slate-400">{Object.entries(l.details || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</td>
              <td className="px-3 py-2.5 text-slate-400">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
              <td className="px-3 py-2.5"><select aria-label={`Status of ${l.company}`} value={l.status} onChange={async (e) => { await api.patch(`/admin/leads/${l.id}`, { status: e.target.value }); reload(); }} className={`${input} py-1`}>{['new', 'contacted', 'won', 'lost'].map((s) => <option key={s}>{s}</option>)}</select></td>
            </tr>
          ))}
          {data && data.leads.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">No enterprise enquiries yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab() {
  const { data } = useAdmin('/admin/audit');
  return (
    <div className={`${card} divide-y divide-slate-700/60 text-xs`}>
      {(data?.entries || []).map((e) => (
        <div key={e.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
          <span><span className="font-mono font-bold">{e.action}</span> <span className="text-slate-400">{e.entity} {e.entity_id}</span></span>
          <span className="text-slate-500 shrink-0">{new Date(e.created_at).toLocaleString('en-IN')}</span>
        </div>
      ))}
      {data && data.entries.length === 0 && <p className="px-4 py-10 text-center text-slate-500">No admin actions recorded yet.</p>}
    </div>
  );
}

const TABS = [['orders', 'Orders'], ['drivers', 'Drivers'], ['pricing', 'Pricing & coupons'], ['leads', 'Enterprise leads'], ['audit', 'Audit log']];

export default function AdminDashboardPage() {
  usePageTitle('Admin console');
  const { user, authReady, requireLogin, logout, setIsLoginModalOpen, setIsProfileModalOpen } = useApp();
  const [tab, setTab] = useState('orders');
  const [tick, setTick] = useState(0);
  const stats = useAdmin('/admin/stats', [tick]);
  const isAdmin = user.role === 'admin' && !user.mfa;

  if (!authReady) return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-14 h-14 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Admin console</h2>
        <p className="text-xs text-gray-500 mt-1">{user.mfa ? 'Two-factor verification is required to continue.' : user.isLoggedIn ? 'This account does not have admin access.' : 'Log in with an administrator account.'}</p>
        {user.mfa ? <button onClick={() => setIsLoginModalOpen(true)} className="mt-4 px-6 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Verify now</button> : user.isLoggedIn ? <button onClick={logout} className="mt-4 px-6 py-2.5 border border-gray-300 text-xs font-bold rounded-xl">Log out</button> : <button onClick={() => requireLogin()} className="mt-4 px-6 py-2.5 bg-porter-blue text-white text-xs font-bold rounded-xl">Admin login</button>}
      </div>
    );
  }

  const s = stats.data;
  const active = (s?.byStatus?.assigned || 0) + (s?.byStatus?.in_transit || 0);
  const kpis = [
    { icon: Banknote, label: "Today's bookings value", value: s ? `₹${s.today.gmv.toLocaleString('en-IN')}` : '—', sub: s ? `${s.today.orders} orders` : '' },
    { icon: Activity, label: 'Active trips', value: s ? active : '—', sub: s ? `${s.byStatus.searching || 0} searching for a driver` : '' },
    { icon: Users, label: 'Drivers online', value: s ? s.drivers.online : '—', sub: s ? `of ${s.drivers.total} registered` : '' },
    { icon: CheckCircle, label: 'Completion rate', value: s?.completionRate != null ? `${s.completionRate}%` : '—', sub: 'delivered vs cancelled' }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Operations</p><h1 className="text-2xl font-black text-white">Admin console</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsProfileModalOpen(true)} className={`${btn} border-indigo-500/60 text-indigo-300 hover:bg-indigo-950/60 flex items-center gap-1.5`}>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Profile & 2FA</span>
            </button>
            <button onClick={logout} className={`${btn} border-slate-600 text-slate-300 hover:bg-slate-800`}>Log out</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`${card} p-4`}>
              <k.icon className="w-5 h-5 text-indigo-400 mb-2" />
              <p className="text-2xl font-black">{k.value}</p>
              <p className="text-[11px] text-slate-400 font-semibold">{k.label}</p>
              <p className="text-[10px] text-slate-500">{k.sub}</p>
            </div>
          ))}
        </div>
        <div role="tablist" className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit overflow-x-auto">
          {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>)}
        </div>
        {tab === 'orders' && <OrdersTab onChanged={() => setTick((t) => t + 1)} />}
        {tab === 'drivers' && <DriversTab />}
        {tab === 'pricing' && <PricingTab />}
        {tab === 'leads' && <LeadsTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
}
