import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, CreditCard, Smartphone, Building2, Banknote, ArrowRight, Lock, QrCode } from 'lucide-react';
import { BRANDING } from '../config/branding';

export default function RazorpayModal({
  isOpen,
  onClose,
  amount = 450,
  orderId = 'PRT-89412',
  customerName = 'Ankit Sharma',
  customerPhone = '9876543210',
  onPaymentSuccess
}) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [upiId, setUpiId] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [payError, setPayError] = useState('');

  // Reset on close so a second booking never shows the previous receipt.
  useEffect(() => {
    if (!isOpen) { setReceipt(null); setProcessing(false); setShowQr(false); setPayError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = (e) => {
    e.preventDefault();
    if (method === 'upi' && !showQr && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      setPayError('Enter a valid UPI ID, e.g. name@okhdfcbank');
      return;
    }
    setPayError('');
    setProcessing(true);

    setTimeout(() => {
      // COD has no online payment, so no payment id (otherwise it is stored as PAID_ONLINE).
      const paymentId = method === 'cod' ? null : `pay_PRT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setProcessing(false);
      const paymentData = {
        paymentId,
        orderId,
        amount,
        method: method.toUpperCase(),
        paidAt: new Date().toISOString()
      };
      setReceipt(paymentData); // booking is created only when the user taps Continue
    }, 1500);
  };

  return (
    <div role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && !processing && onClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight">Razorpay Trusted</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-blue-200">{BRANDING.name} Checkout • Order #{orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receipt ? (
          /* Payment Success & Receipt View */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">{receipt.method === 'COD' ? 'Booking Confirmed!' : 'Payment Successful!'}</h3>
              <p className="text-xs text-gray-500 mt-1">Your transaction has been securely processed</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono font-bold text-gray-800">{receipt.paymentId || 'Pay driver on delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{receipt.method === 'COD' ? 'Amount Due:' : 'Amount Paid:'}</span>
                <span className="font-bold text-emerald-600 text-sm">₹{receipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode:</span>
                <span className="font-bold text-gray-800">{receipt.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-700">{new Date(receipt.paidAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <button
              onClick={() => onPaymentSuccess && onPaymentSuccess(receipt)}
              className="w-full py-3.5 bg-porter-blue hover:bg-porter-hover text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition"
            >
              Continue to Live Order Tracking
            </button>
          </div>
        ) : (
          /* Payment Selection Form */
          <form onSubmit={handlePay} className="p-6 space-y-5">
            {/* Amount banner */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
              <div>
                <span className="text-[11px] text-blue-950 font-bold block uppercase tracking-wider">Amount Payable</span>
                <span className="text-xs text-blue-800">Trip Fare & GST included</span>
              </div>
              <span className="text-2xl font-black text-porter-blue">₹{amount}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Choose Payment Option
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setMethod('upi'); setShowQr(false); }}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                    method === 'upi'
                      ? 'border-porter-blue bg-blue-50/70 text-porter-blue font-bold shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-porter-blue shrink-0" />
                  <span className="truncate">Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                    method === 'card'
                      ? 'border-porter-blue bg-blue-50/70 text-porter-blue font-bold shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Credit/Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('netbanking')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                    method === 'netbanking'
                      ? 'border-porter-blue bg-blue-50/70 text-porter-blue font-bold shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('cod')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                    method === 'cod'
                      ? 'border-porter-blue bg-blue-50/70 text-porter-blue font-bold shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">Pay on Drop (Cash)</span>
                </button>
              </div>
            </div>

            {/* Method Details Input */}
            {method === 'upi' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Pay via VPA or QR</span>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-porter-blue font-bold hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? 'Enter UPI ID' : 'Show UPI QR Code'}</span>
                  </button>
                </div>

                {showQr ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                    <img
                      src="/images/qr_code_6ac327e0fa.png"
                      alt="UPI QR Code"
                      className="w-32 h-32 mx-auto rounded-xl border border-gray-200 p-1 bg-white"
                    />
                    <p className="text-[11px] text-gray-500 font-semibold">
                      Scan with Google Pay, PhonePe, Paytm, or BHIM UPI
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@upi"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-porter-blue"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      {['@okhdfcbank', '@okaxis', '@ybl', '@paytm'].map(suffix => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => setUpiId(`${upiId.split('@')[0] || 'yourname'}${suffix}`)}
                          className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (4111 2222 3333 4444)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <input
                    type="password"
                    maxLength={3}
                    placeholder="CVV"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {method === 'cod' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <p className="font-bold">Pay Cash or UPI directly to driver on arrival</p>
                <p className="text-[11px] text-amber-800 mt-0.5">Please ensure exact change is available at the drop destination.</p>
              </div>
            )}

            {payError && <p className="text-xs text-rose-600 font-medium">{payError}</p>}

            {/* Action button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-porter-blue hover:bg-porter-hover text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming Transaction...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{method === 'cod' ? 'Confirm Booking with Cash' : `Pay ₹${amount} Securely`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Demo checkout — no real payment is taken</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
