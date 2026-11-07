import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { STATUS_BADGE } from './TrackOrderModal';
import {
  X, User, ShieldCheck, Truck, MapPin, Download,
  ExternalLink, Power, AlertTriangle, Key, Copy, Check, Edit2,
  LogOut, RefreshCw, FileText, Phone, Banknote, Briefcase, Eye,
  Lock, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function ProfileModal() {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    user,
    logout,
    updateUserName,
    refreshAccount,
    orders,
    selectedCity,
    setIsCityModalOpen,
    setIsTrackModalOpen,
    setActiveTrackingOrderId,
    setViewingInvoice,
    driverDuty,
    toggleDriverDuty
  } = useApp();

  const navigate = useNavigate();

  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Driver data
  const [driverData, setDriverData] = useState(null);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Admin 2FA
  const [totpSetup, setTotpSetup] = useState({ open: false, reset: false, secret: '', url: '', code: '', busy: false });
  const [totpDisable, setTotpDisable] = useState({ open: false, code: '', busy: false });

  // Customer order filter tab
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'delivered' | 'active'

  const modalRef = useRef(null);

  // Keep name synced
  useEffect(() => {
    if (user.name) setNameVal(user.name);
  }, [user.name]);

  // Load Driver data if user is a driver
  useEffect(() => {
    if (isProfileModalOpen && user.role === 'driver') {
      setLoadingDriver(true);
      api.get('/driver/me')
        .then((res) => setDriverData(res))
        .catch((err) => setStatusMsg({ type: 'error', text: err.message }))
        .finally(() => setLoadingDriver(false));
    }
  }, [isProfileModalOpen, user.role]);

  // Handle escape key
  useEffect(() => {
    if (!isProfileModalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsProfileModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isProfileModalOpen, setIsProfileModalOpen]);

  if (!isProfileModalOpen || !user.isLoggedIn) return null;

  const close = () => {
    setIsProfileModalOpen(false);
    setEditName(false);
    setStatusMsg({ type: '', text: '' });
    setTotpSetup({ open: false, reset: false, secret: '', url: '', code: '', busy: false });
    setTotpDisable({ open: false, code: '', busy: false });
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed.length < 2) {
      setStatusMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }
    setSavingName(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await updateUserName(trimmed);
      setEditName(false);
      setStatusMsg({ type: 'success', text: 'Display name updated successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingName(false);
    }
  };

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard?.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDriverToggleOnline = async () => {
    setTogglingOnline(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const nextOnline = await toggleDriverDuty();
      if (driverData?.driver) {
        setDriverData((prev) => ({
          ...prev,
          driver: { ...prev.driver, online: nextOnline }
        }));
      }
      setStatusMsg({
        type: 'success',
        text: nextOnline ? 'You are now Online and receiving trip requests.' : 'You went Offline.'
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleStartTotp = async (reset = false) => {
    setTotpSetup((t) => ({ ...t, busy: true, reset }));
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await api.post('/auth/totp/setup', { reset });
      setTotpSetup({ open: true, reset, secret: res.secret, url: res.otpauthUrl, code: '', busy: false });
    } catch (err) {
      setTotpSetup((t) => ({ ...t, busy: false }));
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleConfirmTotp = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(totpSetup.code)) {
      setStatusMsg({ type: 'error', text: 'Enter the 6-digit code from your authenticator app.' });
      return;
    }
    setTotpSetup((t) => ({ ...t, busy: true }));
    try {
      await api.post('/auth/totp/enable', { code: totpSetup.code });
      await refreshAccount();
      setTotpSetup({ open: false, reset: false, secret: '', url: '', code: '', busy: false });
      setStatusMsg({ type: 'success', text: 'Two-factor authentication successfully enabled!' });
    } catch (err) {
      setTotpSetup((t) => ({ ...t, busy: false }));
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDisableTotp = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(totpDisable.code)) {
      setStatusMsg({ type: 'error', text: 'Enter the 6-digit code from your authenticator app to confirm.' });
      return;
    }
    setTotpDisable((t) => ({ ...t, busy: true }));
    try {
      await api.post('/auth/totp/disable', { code: totpDisable.code });
      await refreshAccount();
      setTotpDisable({ open: false, code: '', busy: false });
      setStatusMsg({ type: 'success', text: 'Two-factor authentication has been disabled.' });
    } catch (err) {
      setTotpDisable((t) => ({ ...t, busy: false }));
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const navigateToAdminTab = (tab) => {
    close();
    navigate(`/admin?tab=${tab}`);
  };

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const filteredCustomerOrders = orders.filter((o) => {
    if (orderFilter === 'active') return !['delivered', 'cancelled'].includes(o.status);
    if (orderFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onClick={(e) => e.target === e.currentTarget && close()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scaleUp"
      >
        {/* Top Header Strip - Themed by role */}
        <div
          className={`px-6 py-5 flex items-center justify-between text-white ${
            user.role === 'admin'
              ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50'
              : user.role === 'driver'
              ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-900 border-b border-emerald-700/50'
              : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 border-b border-blue-600/50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                user.role === 'admin'
                  ? 'bg-indigo-600/80 text-white ring-2 ring-indigo-400/40'
                  : user.role === 'driver'
                  ? 'bg-emerald-600/80 text-white ring-2 ring-emerald-400/40'
                  : 'bg-white/20 text-white ring-2 ring-white/30'
              }`}
            >
              {user.role === 'admin' ? (
                <ShieldCheck className="w-6 h-6 text-indigo-200" />
              ) : user.role === 'driver' ? (
                <Truck className="w-6 h-6 text-emerald-200" />
              ) : (
                <User className="w-6 h-6 text-blue-100" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="profile-title" className="text-lg font-black tracking-tight">
                  {user.name || 'Account Profile'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                      : user.role === 'driver'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                      : 'bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {user.role === 'admin' ? 'Administrator' : user.role === 'driver' ? 'Driver Partner' : 'Customer'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-mono mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-white/60" /> +91 {user.phone}
              </p>
            </div>
          </div>

          <button
            onClick={close}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status feedback alerts */}
          {statusMsg.text && (
            <div
              role="alert"
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                statusMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              <span>{statusMsg.text}</span>
              <button onClick={() => setStatusMsg({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Account Details Card (Common to all roles with editable name) */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Credentials</span>
              <button
                onClick={handleCopyId}
                className="text-[11px] font-mono text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-gray-200 transition"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                <span>ID: {user.id ? user.id.slice(0, 8) + '…' : '—'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex-1 mr-2">
                <p className="text-[10px] uppercase font-bold text-gray-400">Display Name</p>
                {editName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-porter-blue rounded-lg font-bold text-gray-900 focus:outline-none w-full max-w-xs"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="px-2.5 py-1 bg-porter-blue text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50 shrink-0"
                    >
                      {savingName ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditName(false); setNameVal(user.name); }}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 shrink-0"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <p className="text-sm font-bold text-gray-900">{user.name || 'Not set'}</p>
                )}
              </div>
              {!editName && (
                <button
                  onClick={() => setEditName(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition shrink-0"
                  title="Edit Name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* 1. ADMINISTRATOR SPECIFIC SECTION                               */}
          {/* ============================================================== */}
          {user.role === 'admin' && (
            <div className="space-y-4">
              {/* TOTP 2FA Security Section */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Two-Factor Authentication (TOTP)
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      user.totpEnabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.totpEnabled ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                    {user.totpEnabled ? '2FA Active' : '2FA Not Configured'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {user.totpEnabled
                    ? 'Your administrator account is protected with a time-based authenticator app (Google Authenticator, Authy, or 1Password).'
                    : 'Add an extra layer of security. Require a 6-digit code from your authenticator app on every admin sign-in.'}
                </p>

                {/* Setup / Enable Form */}
                {totpSetup.open ? (
                  <form onSubmit={handleConfirmTotp} className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <p className="text-xs font-bold text-indigo-900">1. Scan QR code or copy this setup key into your Authenticator app:</p>
                    <div className="bg-slate-900 text-amber-300 p-2.5 rounded-lg font-mono text-xs select-all break-all text-center">
                      {totpSetup.secret}
                    </div>
                    {totpSetup.url && (
                      <a
                        href={totpSetup.url}
                        className="text-[11px] text-porter-blue font-semibold hover:underline block text-center"
                      >
                        Open directly in Authenticator App
                      </a>
                    )}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">2. Enter verification code from app to activate:</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={totpSetup.code}
                        onChange={(e) => setTotpSetup({ ...totpSetup, code: e.target.value.replace(/\D/g, '') })}
                        placeholder="000000"
                        className="w-full text-center text-lg font-mono font-bold tracking-widest px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTotpSetup({ open: false, reset: false, secret: '', url: '', code: '', busy: false })}
                        className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={totpSetup.busy || totpSetup.code.length !== 6}
                        className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {totpSetup.busy ? 'Verifying…' : 'Activate 2FA'}
                      </button>
                    </div>
                  </form>
                ) : totpDisable.open ? (
                  /* Disable Form */
                  <form onSubmit={handleDisableTotp} className="bg-white border border-rose-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <p className="text-xs font-bold text-rose-900">Enter code from your authenticator app to disable 2FA:</p>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpDisable.code}
                      onChange={(e) => setTotpDisable({ ...totpDisable, code: e.target.value.replace(/\D/g, '') })}
                      placeholder="000000"
                      className="w-full text-center text-lg font-mono font-bold tracking-widest px-3 py-2 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTotpDisable({ open: false, code: '', busy: false })}
                        className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={totpDisable.busy || totpDisable.code.length !== 6}
                        className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition"
                      >
                        {totpDisable.busy ? 'Disabling…' : 'Confirm Disable'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.totpEnabled ? (
                      <>
                        <button
                          onClick={() => handleStartTotp(true)}
                          disabled={totpSetup.busy}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reconfigure 2FA Device</span>
                        </button>
                        <button
                          onClick={() => setTotpDisable({ open: true, code: '', busy: false })}
                          className="py-2.5 px-3 bg-white border border-gray-300 hover:bg-rose-50 hover:text-rose-600 text-gray-700 text-xs font-bold rounded-xl transition"
                        >
                          Disable 2FA
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartTotp(false)}
                        disabled={totpSetup.busy}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Enable Two-Factor Authentication</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Jump Cards */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Console Navigation</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToAdminTab('orders')}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-500" />
                      <span>Live Orders</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigateToAdminTab('drivers')}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>Drivers & KYC</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigateToAdminTab('pricing')}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-indigo-500" />
                      <span>Pricing & Coupons</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigateToAdminTab('leads')}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      <span>Enterprise Leads</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigateToAdminTab('audit')}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition group text-left col-span-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>System Audit Trail & Security Logs</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. DRIVER PARTNER SPECIFIC SECTION                             */}
          {/* ============================================================== */}
          {user.role === 'driver' && (
            <div className="space-y-4">
              {loadingDriver && !driverData ? (
                <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading driver telemetry…</span>
                </div>
              ) : driverData ? (
                <>
                  {/* Vehicle & Duty Strip */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Assigned Vehicle</span>
                        <p className="text-sm font-black text-gray-900 font-mono mt-0.5">{driverData.driver.vehicleNo || 'Not Assigned'}</p>
                        <p className="text-xs text-gray-500 capitalize">{driverData.driver.vehicleId || 'City Freight'} · {driverData.driver.cityId || 'Mumbai'}</p>
                      </div>

                      <button
                        onClick={handleDriverToggleOnline}
                        disabled={togglingOnline || driverData.driver.status !== 'approved'}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
                          driverData.driver.online
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{driverData.driver.online ? 'Online' : 'Go Online'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-center">
                      <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-semibold text-gray-500">Rating</p>
                        <p className="text-xs font-black text-gray-900">★ {Number(driverData.driver.rating || 5).toFixed(1)}</p>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-semibold text-gray-500">Today</p>
                        <p className="text-xs font-black text-emerald-700">₹{driverData.earnings?.today || 0}</p>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-semibold text-gray-500">Total Trips</p>
                        <p className="text-xs font-black text-gray-900">{driverData.earnings?.trips || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents & KYC Compliance */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance & KYC Documents</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        driverData.driver.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {driverData.driver.status === 'approved' ? 'Verified Driver' : driverData.driver.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400">Driving Licence</p>
                        <p className="font-mono font-bold text-gray-800 text-[11px] truncate">{driverData.driver.documents?.licenseNo || 'On file'}</p>
                        <p className="text-[10px] text-gray-500">Exp: {driverData.driver.documents?.licenseExpiry || 'Lifetime'}</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400">RC Book</p>
                        <p className="font-bold text-gray-800 text-[11px]">Registration</p>
                        <p className="text-[10px] text-gray-500">Exp: {driverData.driver.documents?.rcExpiry || 'Valid'}</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400">Insurance</p>
                        <p className="font-bold text-gray-800 text-[11px]">Commercial</p>
                        <p className="text-[10px] text-gray-500">Exp: {driverData.driver.documents?.insuranceExpiry || 'Active'}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/driver"
                    onClick={close}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Launch Active Driver Portal</span>
                  </Link>
                </>
              ) : null}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. CUSTOMER SPECIFIC SECTION                                   */}
          {/* ============================================================== */}
          {user.role === 'customer' && (
            <div className="space-y-4">
              {/* Trip Statistics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Total Orders</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">{orders.length}</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Active Trips</p>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{activeOrders.length}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Delivered</p>
                  <p className="text-xl font-black text-gray-800 mt-0.5">{completedOrders.length}</p>
                </div>
              </div>

              {/* City Preference */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-porter-blue" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{selectedCity?.name || 'Mumbai'}</p>
                    <p className="text-[10px] text-gray-500">Selected Operating Region</p>
                  </div>
                </div>
                <button
                  onClick={() => { close(); setIsCityModalOpen(true); }}
                  className="px-3 py-1 bg-white hover:bg-blue-50 border border-gray-200 text-xs font-bold text-porter-blue rounded-lg transition"
                >
                  Change City
                </button>
              </div>

              {/* Orders & Invoices List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders & Trip Receipts</span>
                  <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={`px-2 py-0.5 rounded transition ${orderFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                      All ({orders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('delivered')}
                      className={`px-2 py-0.5 rounded transition ${orderFilter === 'delivered' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                      Invoices ({completedOrders.length})
                    </button>
                  </div>
                </div>

                {filteredCustomerOrders.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-500">
                    {orderFilter === 'delivered' ? 'No delivered orders eligible for invoice download yet.' : "You haven't placed any orders yet."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredCustomerOrders.map((o) => {
                      const badge = STATUS_BADGE[o.status] || STATUS_BADGE.searching;
                      return (
                        <div key={o.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs hover:border-gray-300 transition">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">{o.id}</span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {o.pickup?.address || 'Pickup'} → {o.drop?.address || 'Drop'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-gray-900">₹{o.total}</span>
                            {o.status === 'delivered' ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setViewingInvoice(o)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-porter-blue text-[11px] font-bold flex items-center gap-1 transition"
                                  title="View Itemized Tax Invoice"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Invoice</span>
                                </button>
                                <a
                                  href={api.url(`/orders/${o.id}/invoice.pdf`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Download PDF"
                                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  close();
                                  setActiveTrackingOrderId(o.id);
                                  setIsTrackModalOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 text-porter-blue font-bold text-[11px] rounded-lg hover:bg-blue-100 transition"
                              >
                                Track Live
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Strip */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => { logout(); close(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={close}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-xs font-bold text-gray-700 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
