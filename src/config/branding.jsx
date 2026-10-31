import React from 'react';

export const BRANDING = {
  name: 'Portex',
  fullName: 'Portex Logistics',
  tagline: 'Reliable & Hassle-Free Goods Transportation in India',
  hashtag: '#HoJayega',
  deliveryAapki: 'Delivery Aapki, Transport Hamara',
  legalName: 'Portex Logistics Solutions Pvt. Ltd.',
  supportPhone: '022 4810 4810',
  supportEmail: 'help@portex.in',
  colors: {
    primary: '#0a57ff',      // Iconic Royal Blue
    primaryHover: '#0047e0',
    primaryLight: '#f0f4ff',
    dark: '#1e2432',         // Corporate dark slate
    slate: '#2d2f34',
    accent: '#0d8154',       // Emerald status green
    dropRed: '#e03748'
  }
};

export function BrandLogo({ className = "h-8 w-auto", dark = false }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Logistics Emblem */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#0a57ff] to-[#003bb5] text-white shadow-md shadow-blue-500/25 shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 18H3c-.6 0-1-.4-1-1V9c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1h-2" />
          <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
      </div>

      {/* Brand Wordmark matching original aesthetic */}
      <div className="flex items-baseline leading-none">
        <span className={`text-2xl font-black tracking-tight font-sans ${dark ? 'text-white' : 'text-[#1e2432]'}`}>
          port<span className="text-[#0a57ff]">ex</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#0a57ff] ml-0.5 inline-block"></span>
      </div>
    </div>
  );
}

// Keep LoadPulseLogo alias for backwards compatibility if referenced
export const LoadPulseLogo = BrandLogo;
