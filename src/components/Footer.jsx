import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDING, LoadPulseLogo } from '../config/branding';
import { Truck, ShieldCheck, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      {/* 3 Core Value Props */}
      <div className="border-b border-slate-800/80 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">50,000+ Verified Fleet</h4>
              <p className="text-xs text-slate-400 mt-0.5">Tata Ace, 3-Wheelers & EV bikes on demand</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Insured Transit</h4>
              <p className="text-xs text-slate-400 mt-0.5">Real-time GPS telemetry & OTP delivery verification</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">{BRANDING.supportPhone} (Toll-Free)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-1 sm:col-span-2 space-y-4">
            <LoadPulseLogo dark={true} />
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              {BRANDING.name} is a high-speed logistics and freight automation platform powering intra-city goods movement, retail distribution, and heavy transport across India.
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2">
              <Link to="/admin" className="text-indigo-400 hover:underline">Admin Console</Link>
              <span>•</span>
              <Link to="/driver" className="text-emerald-400 hover:underline">Driver App</Link>
              <span>•</span>
              <Link to="/fare-estimate" className="text-white hover:underline">Instant Quote</Link>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Fleet & Services</h5>
            <ul className="space-y-2.5">
              <li><Link to="/trucks" className="hover:text-white transition">Tata Ace (Chota Hathi)</Link></li>
              <li><Link to="/trucks" className="hover:text-white transition">3-Wheeler Auto Cargo</Link></li>
              <li><Link to="/two-wheelers" className="hover:text-white transition">2-Wheeler Instant Parcel</Link></li>
              <li><Link to="/all-india-parcel" className="hover:text-white transition">All India Parcel Courier</Link></li>
              <li><Link to="/packers-and-movers" className="hover:text-white transition">Packers & Movers (Shifting)</Link></li>
              <li><Link to="/enterprise" className="hover:text-white transition">{BRANDING.name} Enterprise Logistics</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Technology</h5>
            <ul className="space-y-2.5">
              <li><Link to="/admin" className="hover:text-white transition">Dispatch Algorithm</Link></li>
              <li><Link to="/driver" className="hover:text-white transition">Driver Telematics</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Contact & Head Office</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="text-slate-500 block">Registered Office:</span>
                <span className="text-slate-300 font-medium leading-relaxed block">{BRANDING.address}</span>
              </li>
              <li>
                <span className="text-slate-500 block">Proprietor / Contact:</span>
                <span className="text-white font-semibold">{BRANDING.ownerName}</span>
              </li>
              <li>
                <span className="text-slate-500 block">Direct Email:</span>
                <a href={`mailto:${BRANDING.supportEmail}`} className="text-indigo-400 hover:text-indigo-300 underline font-medium">
                  {BRANDING.supportEmail}
                </a>
              </li>
              <li>
                <span className="text-slate-500 block">Helpline & WhatsApp:</span>
                <a href={`tel:${BRANDING.supportPhone}`} className="text-indigo-400 hover:text-indigo-300 underline font-medium">
                  {BRANDING.supportPhone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {BRANDING.legalName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <span>•</span>
            <Link to="/safety" className="hover:text-slate-300">Safety</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-slate-300">Cancellation & Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
