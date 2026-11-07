import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRANDING, BrandLogo } from '../config/branding';
import { 
  MapPin, ChevronDown, User, LogOut, Menu, X, 
  Truck, Bike, Calculator, Navigation, Smartphone, HelpCircle, 
  ShieldCheck, LayoutDashboard, Briefcase, Users, FileText 
} from 'lucide-react';

export default function Navbar() {
  const { 
    selectedCity, 
    setIsCityModalOpen, 
    setIsLoginModalOpen, 
    setIsTrackModalOpen, 
    isProfileModalOpen,
    setIsProfileModalOpen,
    user, 
    logout,
    orders
  } = useApp();
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const location = useLocation();

  // Close menus on Escape and whenever the route changes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setServicesDropdownOpen(false); setProfileDropdownOpen(false); setMobileMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    setServicesDropdownOpen(false); setProfileDropdownOpen(false); setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-100 overflow-x-clip">
      {/* Top Corporate Header Strip - Hidden on mobile to protect viewport width */}
      <div className="hidden sm:block bg-[#000000] text-gray-300 text-xs py-2 px-4 sm:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-gray-300 font-medium">
              {BRANDING.tagline} • <span className="text-amber-400 font-bold">{BRANDING.hashtag}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto font-medium">
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="hover:text-blue-400 transition flex items-center gap-1 text-gray-300">
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Console</span>
                </Link>
                <span className="text-gray-700">|</span>
              </>
            )}
            {user.role === 'driver' && (
              <>
                <Link to="/driver" className="hover:text-emerald-400 transition flex items-center gap-1 text-gray-300">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Driver Portal</span>
                </Link>
                <span className="text-gray-700">|</span>
              </>
            )}
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
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & City Selector */}
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          <Link to="/" className="flex items-center shrink-0">
            <BrandLogo />
          </Link>

          {/* City selector pill - shown on tablet and desktop; on mobile it is accessible in the menu and hero section */}
          <button
            onClick={() => setIsCityModalOpen(true)}
            className="hidden sm:flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-porter-blue/50 rounded-full text-[11px] sm:text-xs font-semibold text-gray-800 transition group shrink-0"
          >
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-porter-blue group-hover:scale-110 transition-transform" />
            <span className="max-w-[75px] sm:max-w-none truncate">{selectedCity?.name || 'Mumbai'}</span>
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
          <div className="relative" onMouseLeave={() => setServicesDropdownOpen(false)}>
            <button 
              onClick={() => setServicesDropdownOpen(true)}
              onMouseEnter={() => setServicesDropdownOpen(true)}
              className="flex items-center gap-1 hover:text-porter-blue transition py-1"
            >
              <span>City Services</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicesDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn"
              >
                <Link
                  to="/trucks"
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
                  to="/two-wheelers"
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
            {orders.some(b => b.status === 'assigned' || b.status === 'in_transit') && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            )}
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user.isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border transition shrink-0 ${
                  user.role === 'admin'
                    ? 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-950'
                    : user.role === 'driver'
                    ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 relative shadow-sm ${
                    user.role === 'admin'
                      ? 'bg-indigo-600 ring-2 ring-indigo-400/30'
                      : user.role === 'driver'
                      ? 'bg-emerald-600 ring-2 ring-emerald-400/30'
                      : 'bg-porter-blue'
                  }`}
                >
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-100" />
                  ) : user.role === 'driver' ? (
                    <Truck className="w-3.5 h-3.5 text-emerald-100" />
                  ) : (
                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <div className="text-left hidden md:block">
                  <span className="text-xs font-bold block leading-tight">
                    {user.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider block ${
                      user.role === 'admin'
                        ? 'text-indigo-600'
                        : user.role === 'driver'
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Partner' : 'Customer'}
                  </span>
                </div>

                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
              </button>

              {/* ROLE-SPECIFIC DROPDOWN MENUS */}
              {profileDropdownOpen && (
                <>
                  {/* 1. ADMIN DROPDOWN */}
                  {user.role === 'admin' && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-indigo-100 py-2 z-50 animate-scaleUp">
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-indigo-50/40">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                            Admin
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">+91 {user.phone}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-indigo-900 hover:bg-indigo-50 flex items-center gap-2.5 font-bold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                          <span>Admin Console</span>
                        </Link>
                        <button
                          onClick={() => { setIsProfileModalOpen(true); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />
                          <span>Admin Profile & 2FA</span>
                        </button>
                        <Link
                          to="/enterprise"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>Enterprise Inquiries</span>
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. DRIVER PARTNER DROPDOWN */}
                  {user.role === 'driver' && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-2 z-50 animate-scaleUp">
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-emerald-50/40">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
                            Driver
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">+91 {user.phone}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/driver"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-emerald-900 hover:bg-emerald-50 flex items-center gap-2.5 font-bold transition"
                        >
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span>Driver Portal (Active Duty)</span>
                        </Link>
                        <button
                          onClick={() => { setIsProfileModalOpen(true); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>Vehicle & Compliance Docs</span>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. CUSTOMER DROPDOWN */}
                  {(!user.role || user.role === 'customer') && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-scaleUp">
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-blue-50/30">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                            Customer
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">+91 {user.phone}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { setIsProfileModalOpen(true); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-porter-blue flex items-center gap-2.5 font-medium transition"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span>My Profile & Account</span>
                        </button>
                        <button
                          onClick={() => { setIsTrackModalOpen(true); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-porter-blue flex items-center gap-2.5 font-medium transition"
                        >
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span>My Trips ({activeOrders.length} active)</span>
                        </button>
                        <Link
                          to="/fare-estimate"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-porter-blue flex items-center gap-2.5 font-medium transition"
                        >
                          <Calculator className="w-4 h-4 text-gray-400" />
                          <span>Book Delivery</span>
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-porter-blue hover:bg-porter-hover text-white text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login / Register</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-4 animate-fadeIn">
          {/* User Account Card on Mobile */}
          {user.isLoggedIn ? (
            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${
                      user.role === 'admin'
                        ? 'bg-indigo-600 ring-2 ring-indigo-400/30'
                        : user.role === 'driver'
                        ? 'bg-emerald-600 ring-2 ring-emerald-400/30'
                        : 'bg-porter-blue'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : user.role === 'driver' ? (
                      <Truck className="w-4 h-4" />
                    ) : (
                      <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">+91 {user.phone}</p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : user.role === 'driver'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Driver' : 'Customer'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                <button
                  onClick={() => { setIsProfileModalOpen(true); setMobileMenuOpen(false); }}
                  className="flex-1 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-100 text-center transition"
                >
                  My Profile
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="py-1.5 px-3 text-xs font-bold text-rose-600 bg-white border border-gray-200 rounded-lg hover:bg-rose-50 transition"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setIsLoginModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full py-2.5 bg-porter-blue text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Login / Register
            </button>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Selected City</span>
            <button
              onClick={() => { setIsCityModalOpen(true); setMobileMenuOpen(false); }}
              className="text-xs font-bold text-porter-blue flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full hover:bg-blue-100 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedCity?.name} (Change)</span>
            </button>
          </div>

          <div className="space-y-3 font-semibold text-sm">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Home</Link>
            <Link to="/fare-estimate" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Fare Estimate Calculator</Link>
            <Link to="/trucks" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">City Mini Trucks (Tata Ace)</Link>
            <Link to="/two-wheelers" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Two-Wheelers (Courier)</Link>
            <Link to="/packers-and-movers" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">Packers & Movers (Shifting)</Link>
            <Link to="/all-india-parcel" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">All India Intercity Parcel</Link>
            <Link to="/enterprise" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-gray-800">{BRANDING.name} Enterprise (B2B)</Link>
            {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-indigo-600 font-bold">Admin Console</Link>}
            {user.role === 'driver' && <Link to="/driver" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-emerald-600 font-bold">Driver Portal</Link>}
            {(!user.role || user.role === 'customer') && (
              <button
                onClick={() => { setIsTrackModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full text-left py-1 text-emerald-700 font-bold flex items-center justify-between"
              >
                <span>Track Active Orders</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {activeOrders.length} Active
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
