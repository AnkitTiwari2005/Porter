import React from 'react';

export const BRANDING = {
  name: 'Portex',
  fullName: 'Portex Logistics',
  tagline: 'High-Speed Freight & On-Demand City Logistics',
  subTagline: 'Logistics On Demand. Goods Moved Without Friction.',
  hashtag: '#MoveForward',
  deliveryAapki: 'Aapka Saman, Hamari Zimmedari',
  legalName: 'Portex Freight Technologies Pvt. Ltd.',
  appIcon: '/images/portex-app-icon.webp',
  appIconPng: '/images/portex-app-icon.png',
  supportPhone: '1800 572 4000',
  supportEmail: 'support@portex.in',
  colors: {
    primary: '#4338ca',      // Deep Electric Indigo
    primaryHover: '#3730a3',
    primaryLight: '#eef2ff',
    accent: '#6366f1',       // High-speed Indigo
    highlight: '#f59e0b',    // Radiant Solar Amber
    dark: '#0f172a',         // Obsidian Slate
    slate: '#1e293b',
    statusGreen: '#059669',  // Mint Emerald
    dropRed: '#f43f5e'
  }
};

export function BrandLogo({ className = "h-8 w-auto", dark = false, useAppIcon = true }) {
  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
      {useAppIcon ? (
        <img 
          src="/images/portex-app-icon.webp" 
          alt="Portex Emblem" 
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-md ring-1 ring-indigo-500/20 shrink-0 object-cover" 
        />
      ) : (
        <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#6366f1] text-white shadow-md shadow-indigo-500/30 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.25" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
        </div>
      )}

      {/* Modern Wordmark */}
      <div className="flex items-baseline leading-none">
        <span className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${dark ? 'text-white' : 'text-[#0f172a]'}`}>
          port<span className="text-[#4338ca]">ex</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] ml-0.5 inline-block"></span>
      </div>
    </div>
  );
}

// Keep LoadPulseLogo alias for backwards compatibility if referenced
export const LoadPulseLogo = BrandLogo;
