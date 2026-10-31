import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING, BrandLogo } from '../config/branding';
import { 
  MapPin, ChevronDown, User, LogOut, Menu, X, 
  Truck, Bike, Calculator, Navigation, Smartphone, HelpCircle, 
  ShieldCheck, LayoutDashboard, Briefcase, Users 
} from 'lucide-react';

export default function Navbar() {
  const { 
    selectedCity, 
    setIsCityModalOpen, 
    setIsLoginModalOpen, 
    setIsTrackModalOpen, 
    user, 
    logoutUser,
    activeBookings 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-100">
      {/* Top Corporate Header Strip */}
      <div className="bg-[#000000] text-gray-300 text-xs py-2 px-4 sm:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-gray-300 font-medium">
              {BRANDING.tagline} • <span className="text-amber-400 font-bold">{BRANDING.hashtag}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto font-medium">
            <Link to="/admin" className="hover:text-blue-400 transition flex items-center gap-1 text-gray-300">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Console</span>
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/driver" className="hover:text-emerald-400 transition flex items-center gap-1 text-gray-300">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Driver Partner</span>
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/enterprise" className="hover:text-white transition hidden md:flex items-center gap-1 text-gray-400">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Enterprise</span>
            </Link>
            <span className="text-gray-700 hidden md:inline">|</span>
            <a 
              href={`tel:${BRANDING.supportPhone}`} 
              className="hover:text-white transition flex items-center gap-1 text-gray-400"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{BRANDING.supportPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Portex Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & City Selector */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center shrink-0">
            <BrandLogo />
          </Link>

          {/* City selector pill */}
          <button
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-porter-blue/50 rounded-full text-xs font-semibold text-gray-800 transition group"
          >
            <MapPin className="w-3.5 h-3.5 text-porter-blue group-hover:scale-110 transition-transform" />
            <span>{selectedCity?.name || 'Mumbai'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-porter-blue" />
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-gray-700">
          <Link 
            to="/" 
            className={`hover:text-porter-blue transition py-1 ${isActive('/') ? 'text-porter-blue font-bold border-b-2 border-porter-blue' : ''}`}
          >
            Home
          </Link>

          <Link 
            to="/fare-estimate" 
            className={`flex items-center gap-1.5 hover:text-porter-blue transition py-1 ${isActive('/fare-estimate') ? 'text-porter-blue font-bold border-b-2 border-porter-blue' : ''}`}
          >
            <Calculator className="w-4 h-4 text-porter-blue" />
            <span>Fare Estimate</span>
          </Link>

          {/* City Services Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              onMouseEnter={() => setServicesDropdownOpen(true)}
              className="flex items-center gap-1 hover:text-porter-blue transition py-1"
            >
              <span>City Services</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicesDropdownOpen && (
              <div 
                onMouseLeave={() => setServicesDropdownOpen(false)}
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn"
              >
                <Link
                  to="/trucks-mumbai"
                  onClick={() => setServicesDropdownOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-porter-blue flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">City Mini Trucks</p>
                    <p className="text-[11px] text-gray-500">Tata Ace, 3W & 8ft Pickups</p>
                  </div>
                </Link>

                <Link
                  to="/two-wheelers-mumbai"
                  onClick={() => setServicesDropdownOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-emerald-50/50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Two-Wheelers (Courier)</p>
                    <p className="text-[11px] text-gray-500">Fast bike delivery up to 20 kg</p>
                  </div>
                </Link>

                <div className="border-t border-gray-100 my-1 pt-1">
                  <Link
                    to="/packers-and-movers"
                    onClick={() => setServicesDropdownOpen(false)}
                    className="block px-4 py-1.5 text-xs text-gray-600 hover:text-porter-blue hover:bg-gray-50 font-medium"
                  >
                    Packers & Movers (House Shifting)
                  </Link>
                  <Link
                    to="/all-india-parcel"
                    onClick={() => setServicesDropdownOpen(false)}
                    className="block px-4 py-1.5 text-xs text-gray-600 hover:text-porter-blue hover:bg-gray-50 font-medium"
                  >
                    All India Intercity Parcel (Courier)
                  </Link>
                  <Link
                    to="/enterprise"
                    onClick={() => setServicesDropdownOpen(false)}
                    className="block px-4 py-1.5 text-xs text-gray-600 hover:text-porter-blue hover:bg-gray-50 font-medium"
                  >
                    {BRANDING.name} Enterprise (B2B Solutions)
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsTrackModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-porter-blue transition py-1 relative"
          >
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span>Track Orders</span>
            {activeBookings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            )}
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {user.isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-porter-blue text-white text-xs font-bold flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-gray-800 hidden sm:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{user.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">+91 {user.phone}</p>
                  </div>
                  <button
                    onClick={() => { setIsTrackModalOpen(true); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-porter-blue flex items-center gap-2 font-medium"
                  >
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <span>My Trips ({activeBookings.length})</span>
                  </button>
                  <button
                    onClick={() => { logoutUser(); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-porter-blue hover:bg-porter-hover text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Selected City</span>
            <button
              onClick={() => { setIsCityModalOpen(true); setMobileMenuOpen(false); }}
              className="text-xs font-bold text-porter-blue flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedCity?.name} (Change)</span>
            </button>
          </div>

          <div className="space-y-3 font-semibold text-sm">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Home</Link>
            <Link to="/fare-estimate" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Fare Estimate Calculator</Link>
            <Link to="/trucks-mumbai" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">City Mini Trucks (Tata Ace)</Link>
            <Link to="/two-wheelers-mumbai" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Two-Wheelers (Courier)</Link>
            <Link to="/packers-and-movers" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Packers & Movers (Shifting)</Link>
            <Link to="/all-india-parcel" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">All India Intercity Parcel</Link>
            <Link to="/enterprise" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">{BRANDING.name} Enterprise (B2B)</Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-blue-600 font-bold">Admin Dispatch Console</Link>
            <Link to="/driver" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-emerald-600 font-bold">Driver Partner Portal</Link>
            <button
              onClick={() => { setIsTrackModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left py-1 text-emerald-700 font-bold flex items-center justify-between"
            >
              <span>Track Active Orders</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {activeBookings.length} Active
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
