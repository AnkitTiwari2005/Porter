import React from 'react';

export const BRANDING = {
  name: 'Porter',
  tagline: 'Reliable & Hassle-Free Goods Transportation in India',
  hashtag: '#HoJayega',
  deliveryAapki: 'Delivery Aapki, Transport Hamara',
  legalName: 'Smartshift Logistics Solutions Pvt. Ltd.',
  supportPhone: '022 4410 4410',
  supportEmail: 'help@porter.in',
  colors: {
    primary: '#0a57ff',      // Iconic Porter Royal Blue
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
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/images/header_logo_f22422636f.svg"
        alt="Porter"
        className={`h-7 sm:h-8 w-auto object-contain ${dark ? 'brightness-0 invert' : ''}`}
        onError={(e) => {
          e.target.style.display = 'none';
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div className="hidden items-center">
        <span className="text-2xl font-black tracking-tight text-blue-600">
          PORTER
        </span>
      </div>
    </div>
  );
}

// Keep LoadPulseLogo alias for backwards compatibility if referenced
export const LoadPulseLogo = BrandLogo;
