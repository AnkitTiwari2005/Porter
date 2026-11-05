import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, ShieldCheck, Loader2 } from 'lucide-react';

// Chooses how to pay. Online payments open Razorpay's own window, so card/UPI details never touch this app.
export default function PaymentModal({ isOpen, onClose, total, codAllowed, onlineAvailable, busy, error, onConfirm }) {
  const [method, setMethod] = useState('online');

  useEffect(() => {
    if (!isOpen) return undefined;
    setMethod(onlineAvailable ? 'online' : 'cod');
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onlineAvailable, busy, onClose]);

  if (!isOpen) return null;
  const options = [
    { id: 'online', icon: CreditCard, title: 'Pay online', desc: 'UPI, cards, netbanking and wallets', enabled: onlineAvailable },
    { id: 'cod', icon: Banknote, title: 'Cash on delivery', desc: 'Pay the driver after delivery', enabled: codAllowed }
  ].filter((o) => o.enabled);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.target === e.currentTarget && !busy && onClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 id="pay-title" className="text-sm font-bold text-gray-900">Choose payment method</h3>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {options.length === 0 && <p className="text-sm text-rose-600">No payment method is available for this service right now. Please try again later.</p>}
          {options.map((o) => (
            <label key={o.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${method === o.id ? 'border-porter-blue bg-blue-50/60' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="pay-method" value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} className="accent-porter-blue" />
              <o.icon className="w-5 h-5 text-porter-blue shrink-0" />
              <span>
                <span className="block text-sm font-bold text-gray-900">{o.title}</span>
                <span className="block text-xs text-gray-500">{o.desc}</span>
              </span>
            </label>
          ))}
          {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
          <button
            type="button"
            disabled={busy || options.length === 0}
            onClick={() => onConfirm(method)}
            className="w-full py-3 bg-porter-blue hover:bg-porter-hover disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{method === 'online' ? `Pay ₹${total}` : `Confirm booking · ₹${total} on delivery`}</span>
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Online payments are processed by Razorpay. We never see your card details.
          </p>
        </div>
      </div>
    </div>
  );
}
