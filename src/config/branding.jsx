import React from 'react';

export const BRANDING = {
  name: 'Portex',
  fullName: 'Portex Logistics',
  tagline: 'High-Speed Freight & On-Demand City Logistics',
  subTagline: 'Logistics On Demand. Goods Moved Without Friction.',
  hashtag: '#MoveForward',
  deliveryAapki: 'Aapka Saman, Hamari Zimmedari',
  legalName: 'Portex Freight Technologies Pvt. Ltd.',
  ownerName: 'Shiv Kukreja',
  address: '9, Guru Nanak Market, National Park, New Delhi, Delhi 110024',
  registeredOffice: '9, Guru Nanak Market, National Park, New Delhi, Delhi 110024',
  logo: '/images/portex-emblem.png',
  logoWhite: '/images/portex-emblem.png',
  emblem: '/images/portex-emblem.png',
  appIcon: '/images/portex-emblem.png',
  appIconPng: '/images/portex-app-icon.png',
  supportPhone: '+91 98117 97407',
  supportEmail: 'shivskukreja@gmail.com',
  gstin: '',   // TODO: your real GSTIN
  cin: '',     // TODO: your real CIN
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

export function BrandLogo({ className = "", dark = false }) {
  return (
    <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      <img 
        src="/images/portex-emblem.png" 
        alt="Portex Emblem" 
        className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-sm" 
      />
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${dark ? 'text-white' : 'text-slate-900'}`}>
            port<span className="text-porter-blue">ex</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 inline-block"></span>
        </div>
        <span className={`text-[8px] font-bold tracking-widest uppercase mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          HIGH-SPEED FREIGHT & DELIVERY
        </span>
      </div>
    </div>
  );
}

export function BrandEmblem({ className = "w-8 h-8" }) {
  return (
    <img 
      src="/images/portex-emblem.png" 
      alt="Portex Emblem" 
      className={`object-contain shrink-0 drop-shadow-sm ${className}`} 
    />
  );
}

// Keep LoadPulseLogo alias for backwards compatibility if referenced
export const LoadPulseLogo = BrandLogo;
