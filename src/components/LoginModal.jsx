import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { useFocusTrap } from '../lib/useFocusTrap';
import { X, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const LEN = 6;
const RESEND_SECONDS = 30;

export default function LoginModal() {
  const cardRef = useRef(null);
  const { isLoginModalOpen, setIsLoginModalOpen, requestOtp, verifyOtp, user, refreshAccount, logout } = useApp();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(Array(LEN).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const boxes = useRef([]);
  // Admin second factor (authenticator app): 'setup' on first sign-in, 'verify' afterwards.
  const [totp, setTotp] = useState({ code: '', secret: '', url: '' });
  const mfa = user.mfa;
  useEffect(() => {
    if (!isLoginModalOpen || mfa !== 'setup' || totp.secret) return;
    api.post('/auth/totp/setup').then((r) => setTotp((t) => ({ ...t, secret: r.secret, url: r.otpauthUrl }))).catch((e) => setError(e.message));
  }, [isLoginModalOpen, mfa, totp.secret]);

  const reset = () => { setStep('phone'); setOtp(Array(LEN).fill('')); setError(''); setDevOtp(''); setCooldown(0); };
  const close = () => { setIsLoginModalOpen(false); reset(); };

  useEffect(() => {
    if (!isLoginModalOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginModalOpen]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useFocusTrap(isLoginModalOpen, cardRef);

  if (!isLoginModalOpen) return null;

  const send = async (e) => {
    e?.preventDefault();
    if (!/^[6-9][0-9]{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number'); return; }
    setBusy(true); setError('');
    try {
      const r = await requestOtp(phone);
      setDevOtp(r.devOtp || '');
      setStep('otp');
      setCooldown(RESEND_SECONDS);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const verify = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < LEN) { setError(`Enter the complete ${LEN}-digit code`); return; }
    setBusy(true); setError('');
    try {
      const { user: who, resume } = await verifyOtp(phone, code, name.trim() || undefined);
      if (who.mfa) { setOtp(Array(LEN).fill('')); return; } // continue to the authenticator step
      close();
      setPhone(''); setName('');
      if (typeof resume === 'function') resume();
    } catch (err) {
      setError(err.message);
      if (err.status === 429 || err.code === 'otp_expired') setOtp(Array(LEN).fill(''));
    } finally { setBusy(false); }
  };

  const submitTotp = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(totp.code)) { setError('Enter the 6-digit code from your authenticator app'); return; }
    setBusy(true); setError('');
    try {
      await api.post(mfa === 'setup' ? '/auth/totp/enable' : '/auth/totp/verify', { code: totp.code });
      await refreshAccount();
      setTotp({ code: '', secret: '', url: '' });
      close();
    } catch (err) {
      setError(err.message);
      if (err.status === 429) { await refreshAccount().catch(() => {}); }
    } finally { setBusy(false); }
  };

  const onDigit = (i, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setOtp((o) => o.map((x, j) => (j === i ? d : x)));
    if (d && i < LEN - 1) boxes.current[i + 1]?.focus();
  };
  const onPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (!p) return;
    setOtp(Array.from({ length: LEN }, (_, i) => p[i] || ''));
    boxes.current[Math.min(LEN - 1, p.length)]?.focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) boxes.current[i - 1]?.focus();
  };

  const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div ref={cardRef} tabIndex={-1} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-scaleUp">
        <div className="relative bg-gradient-to-br from-porter-navy to-porter-blue text-white p-6 pb-8">
          <button onClick={close} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 backdrop-blur-md"><Smartphone className="w-6 h-6" /></div>
          <h3 id="login-title" className="text-xl font-bold">Welcome to {BRANDING.name}</h3>
          <p className="text-xs text-blue-100 mt-1">Log in with your mobile number to book and track orders</p>
        </div>

        <div className="p-6">
          {mfa ? (
            <form onSubmit={submitTotp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-gray-900">{mfa === 'setup' ? 'Set up two-factor sign-in' : 'Two-factor verification'}</p>
                <p className="text-xs text-gray-500">{mfa === 'setup' ? 'Administrator accounts require an authenticator app (Google Authenticator, Authy, 1Password…).' : 'Open your authenticator app and enter the current 6-digit code.'}</p>
              </div>
              {mfa === 'setup' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 text-center">
                  <p className="text-[11px] text-gray-500">Add this key to your app, then enter the code it shows:</p>
                  <p className="font-mono text-sm font-bold tracking-wider break-all select-all">{totp.secret || 'Generating…'}</p>
                  {totp.url && <a href={totp.url} className="text-[11px] text-porter-blue font-semibold underline">Open in authenticator app</a>}
                </div>
              )}
              <input value={totp.code} onChange={(e) => setTotp({ ...totp, code: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" autoComplete="one-time-code" aria-label="Authenticator code" placeholder="000000" className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-porter-blue" />
              {error && <p role="alert" className="text-xs text-red-500 font-medium text-center">{error}</p>}
              <button type="submit" disabled={busy} className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{mfa === 'setup' ? 'Enable and continue' : 'Verify'}</span>
              </button>
              <button type="button" onClick={async () => { await logout(); setTotp({ code: '', secret: '', url: '' }); reset(); }} className="w-full text-xs text-gray-400 hover:text-gray-600">Use a different account</button>
            </form>
          ) : step === 'phone' ? (
            <form onSubmit={send} className="space-y-4">
              <div>
                <label htmlFor="login-name" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Your name <span className="normal-case font-normal text-gray-400">(new accounts)</span></label>
                <input id="login-name" type="text" autoComplete="name" placeholder="e.g. Ankit Sharma" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="login-phone" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Mobile number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">+91</span>
                  <input id="login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className={`${inputCls} font-semibold tracking-wider`} autoFocus />
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500 font-medium">{error}</p>}
              <button type="submit" disabled={busy} className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Send OTP</span>
              </button>
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>We only use your number to verify you and update you on orders</span>
              </div>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="text-center py-2">
                <p className="text-sm font-medium text-gray-700">Enter the {LEN}-digit code sent to</p>
                <p className="text-sm font-bold text-porter-blue mt-0.5">+91 {phone}</p>
                <button type="button" onClick={reset} className="text-xs text-gray-400 underline mt-1 hover:text-gray-600">Change number</button>
              </div>
              <div className="flex justify-center gap-2 py-2" onPaste={onPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { boxes.current[i] = el; }} type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={digit} aria-label={`Digit ${i + 1}`}
                    onChange={(e) => onDigit(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition" />
                ))}
              </div>
              {devOtp && <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-1.5">Development mode: your code is <span className="font-bold">{devOtp}</span></p>}
              {error && <p role="alert" className="text-xs text-red-500 font-medium text-center">{error}</p>}
              <button type="submit" disabled={busy} className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Verify & log in</span>
              </button>
              <p className="text-xs text-center text-gray-400">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : <button type="button" onClick={send} className="text-porter-blue font-semibold hover:underline">Resend code</button>}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
