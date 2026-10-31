import React from 'react';

export const BRANDING = {
  name: 'Portex',
  fullName: 'Portex Logistics',
  tagline: 'High-Speed Freight & On-Demand City Logistics',
  subTagline: 'Logistics On Demand. Goods Moved Without Friction.',
  hashtag: '#MoveForward',
  deliveryAapki: 'Aapka Saman, Hamari Zimmedari',
  legalName: 'Portex Freight Technologies Pvt. Ltd.',
  logo: '/images/portex-logo.png',
  logoWhite: '/images/portex-logo-white.png',
  emblem: '/images/portex-emblem.png',
  appIcon: '/images/portex-emblem.png',
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

export function BrandLogo({ className = "h-8 w-auto", dark = false }) {
  if (dark) {
    return (
      <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
        <img 
          src="/images/portex-emblem.png" 
          alt="Portex Emblem" 
          className="w-8 h-8 rounded-lg object-contain shrink-0" 
        />
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-tight font-sans text-white">
              port<span className="text-blue-500">ex</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 inline-block"></span>
          </div>
          <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
            HIGH-SPEED FREIGHT & DELIVERY
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center select-none shrink-0 ${className}`}>
      <img 
        src="/images/portex-logo.png" 
        alt="Portex - High-Speed Freight & Delivery" 
        className="h-7 sm:h-9 w-auto object-contain shrink-0" 
      />
    </div>
  );
}

export function BrandEmblem({ className = "w-8 h-8" }) {
  return (
    <img 
      src="/images/portex-emblem.png" 
      alt="Portex Emblem" 
      className={`object-contain shrink-0 ${className}`} 
    />
  );
}

// Keep LoadPulseLogo alias for backwards compatibility if referenced
export const LoadPulseLogo = BrandLogo;
