import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import InteractiveMap from '../components/InteractiveMap';
import { getCoordinatesForAddress } from '../data/geoData';
import { 
  Truck, Users, DollarSign, Activity, CheckCircle, 
  Clock, MapPin, AlertCircle, RefreshCw, Sliders, ShieldCheck, 
  Search, Download, Trash2, CheckSquare 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { activeBookings, selectedCity, fleetTariffs, updateTariff, updateBookingStatus } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute stats
  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.fare || 0), 14250);
  const activeTripsCount = activeBookings.filter(b => b.status === 'in_transit' || b.status === 'assigned').length;

  const currentLiveOrder = activeBookings.find(b => b.status === 'in_transit' || b.status === 'assigned') || activeBookings[0];
  const livePickupCoord = currentLiveOrder ? getCoordinatesForAddress(currentLiveOrder.pickup) : undefined;
  const liveDropCoord = currentLiveOrder ? getCoordinatesForAddress(currentLiveOrder.drop) : undefined;

  const handleUpdate = (id, field, value) => {
    updateTariff(id, field, value);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Pickup', 'Destination', 'Vehicle', 'Fare (INR)', 'Status', 'Driver', 'Payment'];
    const rows = activeBookings.map(b => [
      b.orderId,
      new Date(b.createdAt || Date.now()).toLocaleDateString(),
      `"${b.pickup}"`,
      `"${b.drop}"`,
      `"${b.vehicleName}"`,
      b.fare,
      b.status,
      `"${b.driver?.name || 'Unassigned'}"`,
      b.paymentStatus || 'PAID'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${BRANDING.name}_Dispatch_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = activeBookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.orderId.toLowerCase().includes(search.toLowerCase()) && !b.pickup.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Operations & Dispatch HQ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {BRANDING.name} Dispatch Console
            </h1>
            <p className="text-xs text-slate-400">
              Fleet telemetry, live order queue, and dynamic tariff control ({selectedCity.name})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-porter-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Active In-Transit</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2">{activeTripsCount + 3}</p>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">● 98.4% On-time delivery</span>
          </div>

          <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Today's Platform GMV</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2">₹{totalRevenue.toLocaleString()}</p>
            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">Across {selectedCity.name} Hub</span>
          </div>

          <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Online Drivers</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2">52 Partners</p>
            <span className="text-[11px] text-purple-300 font-semibold mt-1 block">Ready for Instant Dispatch</span>
          </div>

          <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Avg. Arrival ETA</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2">12.4 Mins</p>
            <span className="text-[11px] text-amber-300 font-semibold mt-1 block">Standard city dispatch</span>
          </div>
        </div>

        {/* Live Map Telemetry & Active Fleet Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Live Fleet Routing & Telemetry Radar</span>
              </h3>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
                TELEMETRY ACTIVE
              </span>
            </div>

            <InteractiveMap
              pickupCoord={livePickupCoord}
              dropCoord={liveDropCoord}
              pickupLabel={currentLiveOrder?.pickup || 'Pickup'}
              dropLabel={currentLiveOrder?.drop || 'Destination'}
              height="360px"
              vehicleProgress={0.65}
            />
          </div>

          <div className="lg:col-span-4 bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Active Fleet Partners</h3>
              <div className="space-y-3">
                {[
                  { name: 'Rameshwar Yadav', vehicle: 'Tata Ace', plate: 'MH 02 EE 7418', status: 'In Transit', rating: 4.9 },
                  { name: 'Farhan Shaikh', vehicle: '3 Wheeler', plate: 'MH 01 DE 3319', status: 'Available', rating: 4.8 },
                  { name: 'Kavita Shinde', vehicle: '2-Wheeler EV', plate: 'MH 03 BK 9001', status: 'In Transit', rating: 5.0 },
                  { name: 'Satish Patel', vehicle: 'Pickup 8ft', plate: 'MH 04 ER 5521', status: 'Available', rating: 4.7 }
                ].map((d, i) => (
                  <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{d.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{d.vehicle} • {d.plate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.status === 'Available' ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
              💡 Any trip booked by customer on Homepage or Fare Estimator automatically dispatches here.
            </div>
          </div>
        </div>

        {/* Live Orders Dispatch Table */}
        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Live Dispatch Queue</h3>
              <p className="text-xs text-slate-400">Real customer orders synced in real-time</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl text-xs font-semibold text-slate-400">
              {['all', 'in_transit', 'assigned', 'delivered'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    filter === f ? 'bg-porter-blue text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Pickup & Destination</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4">Driver Partner</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredOrders.map((b) => (
                  <tr key={b.orderId} className="hover:bg-slate-700/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{b.orderId}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="block font-semibold text-white">{b.pickup}</span>
                      <span className="text-[11px] text-slate-400">➔ {b.drop}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{b.vehicleName}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{b.fare}</td>
                    <td className="py-3 px-4">
                      <span className="block font-semibold text-white">{b.driver?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.driver?.vehicleNo}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'delivered' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status !== 'delivered' && (
                          <button
                            onClick={() => updateBookingStatus(b.orderId, 'delivered')}
                            title="Force Mark Delivered"
                            className="p-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-lg text-xs"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => updateBookingStatus(b.orderId, 'cancelled')}
                          title="Cancel Order"
                          className="p-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Tariff & Rate Configurator */}
        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Dynamic Fleet Tariff Configurator</span>
              </h3>
              <p className="text-xs text-slate-400">
                Adjust base fares and per-kilometer rates for {selectedCity.name}. Updates recalculate customer estimates in real-time.
              </p>
            </div>

            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-3.5 h-3.5" /> Rate Updated in Real-Time!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fleetTariffs.slice(0, 3).map((v) => (
              <div key={v.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{v.name}</span>
                  <span className="text-[10px] text-blue-400 font-semibold">{v.capacity}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Base Fare (₹)
                    </label>
                    <input
                      type="number"
                      value={v.basePrice}
                      onChange={(e) => handleUpdate(v.id, 'basePrice', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Per KM Rate (₹)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={v.ratePerKm}
                      onChange={(e) => handleUpdate(v.id, 'ratePerKm', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
