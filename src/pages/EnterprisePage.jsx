import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { 
  Briefcase, CheckCircle2, ShieldCheck, TrendingUp, Users, 
  Layers, ArrowRight, PhoneCall, Building2, FileText, Check, Clock 
} from 'lucide-react';

export default function EnterprisePage() {
  const { selectedCity } = useApp();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    workEmail: '',
    phone: '',
    monthlyTrips: '50-200 trips',
    vehicleRequirement: 'Tata Ace & 3-Wheelers'
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactName.trim()) {
      setError('Please provide company name and contact person.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    try {
      const existing = JSON.parse(localStorage.getItem('porter_enterprise_leads') || '[]');
      existing.unshift({ ...formData, submittedAt: new Date().toISOString() });
      localStorage.setItem('porter_enterprise_leads', JSON.stringify(existing));
    } catch { /* storage fallback */ }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Enterprise Hero with FLUX.2 Photorealistic Telemetry Background */}
      <section className="relative bg-slate-950 text-white py-16 px-4 sm:px-8 border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src="/images/enterprise-logistics.webp" 
            alt="Enterprise Logistics Control Center" 
            className="w-full h-full object-cover object-center opacity-30 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-indigo-950/80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>{BRANDING.name} Enterprise Logistics Solutions</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Enterprise Supply Chain & Dedicated Freight Infrastructure
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Empower your enterprise with dedicated fleet management, API automated dispatches, multi-drop route optimization, and consolidated monthly GST billing.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 max-w-lg">
              <div>
                <span className="text-2xl font-black text-white block">99.4%</span>
                <span className="text-xs text-slate-400">On-Time SLA</span>
              </div>
              <div>
                <span className="text-2xl font-black text-white block">30%</span>
                <span className="text-xs text-slate-400">Logistics Cost Savings</span>
              </div>
              <div>
                <span className="text-2xl font-black text-white block">50,000+</span>
                <span className="text-xs text-slate-400">Enterprise Clients</span>
              </div>
            </div>
          </div>

          {/* Enterprise Lead Generation Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-100">
              {error && <p className="text-xs text-rose-500 font-semibold mb-2">{error}</p>}
              {submitted ? (
                <div className="py-10 text-center space-y-3 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Inquiry Received!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    A dedicated enterprise account manager for <strong className="text-slate-800">{formData.companyName}</strong> will contact you within 2 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Partner with {BRANDING.name} Enterprise</h3>
                    <p className="text-xs text-slate-500">Get customized corporate rates & monthly billing</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company / Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reliance Retail / Apex Electronics"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formData.workEmail}
                      onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Delivery Volume</label>
                      <select
                        value={formData.monthlyTrips}
                        onChange={(e) => setFormData({...formData, monthlyTrips: e.target.value})}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                      >
                        <option value="10-50 trips">10 - 50 trips</option>
                        <option value="50-200 trips">50 - 200 trips</option>
                        <option value="200-1000 trips">200 - 1,000 trips</option>
                        <option value="1000+ trips">1,000+ trips (Custom)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Primary Fleet Required</label>
                      <select
                        value={formData.vehicleRequirement}
                        onChange={(e) => setFormData({...formData, vehicleRequirement: e.target.value})}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                      >
                        <option value="Tata Ace & 3-Wheelers">Tata Ace & 3-Wheelers</option>
                        <option value="2-Wheelers Hyperlocal">2-Wheelers (Hyperlocal)</option>
                        <option value="Pickup 8ft & Canter">Pickup 8ft & 14ft Canters</option>
                        <option value="Mixed Fleet">Mixed Fleet</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition mt-2"
                  >
                    <span>Request Custom Enterprise Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Benefits */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-porter-blue bg-blue-50 px-3 py-1 rounded-full">
            Corporate Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Built for Modern Supply Chains
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-porter-blue flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Consolidated Monthly Billing</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Eliminate daily petty cash disbursements. Get a single GST-compliant monthly invoice with complete trip audit logs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Direct REST API Integrations</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Integrate {BRANDING.name} dispatches directly into your Shopify, WooCommerce, ERP, or custom warehouse management system.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Dedicated Key Account Manager</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              A dedicated logistics specialist to ensure zero fleet shortages during festival spikes and month-end dispatch peaks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
