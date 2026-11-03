import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRANDING } from '../config/branding';
import { X, Smartphone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginModal() {
  const close = () => { setIsLoginModalOpen(false); setStep('phone'); setOtp(['', '', '', '']); setError(''); };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const { isLoginModalOpen, setIsLoginModalOpen, loginUser } = useApp();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const nextOtp = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) nextOtp[i] = pasted[i];
    setOtp(nextOtp);
    const focusIdx = Math.min(3, pasted.length);
    const el = document.getElementById(`otp-box-${focusIdx}`);
    if (el) el.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-box-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleOtpChange = (index, val) => {
    val = val.replace(/\D/g, '');
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next box
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 4) {
      setError('Please enter complete 4-digit OTP');
      return;
    }
    loginUser(name.trim(), phone);
    setName('');
    setError('');
    setStep('phone');
    setPhone('');
    setOtp(['', '', '', '']);
  };

  return (
    <div role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-porter-navy to-porter-blue text-white p-6 pb-8">
          <button
            onClick={close}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 backdrop-blur-md">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold">Welcome to {BRANDING.name}</h3>
          <p className="text-xs text-blue-100 mt-1">Book mini trucks, 2-wheelers & track orders seamlessly</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ankit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition"
                >
                  <span>Continue with OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Your information is encrypted & 100% secure</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-2">
                <p className="text-sm font-medium text-gray-700">
                  Enter the 4-digit verification code sent to
                </p>
                <p className="text-sm font-bold text-porter-blue mt-0.5">+91 {phone}</p>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-gray-400 underline mt-1 hover:text-gray-600"
                >
                  Change number
                </button>
              </div>

              <div className="flex justify-center gap-3 py-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-box-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-12 h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-porter-blue focus:bg-white transition"
                  />
                ))}
              </div>

              {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

              <p className="text-xs text-center text-gray-400">
                Demo OTP: Enter any 4 digits (e.g. <span className="font-bold text-gray-600">1 2 3 4</span>)
              </p>

              <button
                type="submit"
                className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
