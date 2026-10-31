import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { BRANDING, BrandLogo } from '../config/branding';

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `INV-2026-${order.orderId.replace(/\D/g, '') || '89412'}`;
  const baseFare = Math.round(order.fare * 0.72);
  const distFare = Math.round(order.fare * 0.23);
  const gst = Math.round(order.fare * 0.05);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Official Trip Invoice</span>
            <span className="text-xs font-mono font-bold bg-blue-100 text-porter-blue px-2 py-0.5 rounded">
              {invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-gray-800" id="printable-invoice">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <BrandLogo className="h-9 mb-2" />
              <p className="font-bold text-gray-900">{BRANDING.legalName}</p>
              <p className="text-gray-500">GSTIN: 27AABCS1429B1Z8</p>
              <p className="text-gray-500">CIN: U74999MH2014PTC254891</p>
              <p className="text-gray-500">Helpline: {BRANDING.supportPhone} • {BRANDING.supportEmail}</p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-black text-gray-900">TAX INVOICE</h2>
              <p className="text-gray-500 mt-1">Invoice Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
              <p className="text-gray-500">Order ID: <strong className="font-mono text-gray-900">{order.orderId}</strong></p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                Payment Status: {order.paymentStatus || 'COMPLETED'}
              </span>
            </div>
          </div>

          {/* Billed To / From */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <span className="font-bold uppercase text-gray-400 text-[10px] block mb-1">Customer / Consignor</span>
              <p className="font-bold text-sm text-gray-900">{order.senderName || 'Ankit Sharma'}</p>
              <p className="text-gray-600 font-mono mt-0.5">{order.senderPhone || '+91 98765 43210'}</p>
              <p className="text-gray-500 mt-1"><strong className="text-gray-700">Pickup:</strong> {order.pickup}</p>
            </div>

            <div>
              <span className="font-bold uppercase text-gray-400 text-[10px] block mb-1">Consignee (Receiver)</span>
              <p className="font-bold text-sm text-gray-900">{order.receiverName || 'Pooja Verma'}</p>
              <p className="text-gray-600 font-mono mt-0.5">{order.receiverPhone || '+91 98200 11223'}</p>
              <p className="text-gray-500 mt-1"><strong className="text-gray-700">Drop:</strong> {order.drop}</p>
            </div>
          </div>

          {/* Fleet and Driver */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div>
              <span className="text-[10px] text-porter-blue font-bold uppercase">Vehicle & Driver Partner</span>
              <p className="font-bold text-gray-900">{order.vehicleName} • Driver: {order.driver?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">Registration Number</span>
              <span className="font-mono font-bold text-gray-900">{order.driver?.vehicleNo}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="py-2.5">Description</th>
                <th className="py-2.5">HSN / SAC</th>
                <th className="py-2.5 text-center">Distance</th>
                <th className="py-2.5 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 font-medium text-gray-900">
                  Intra-city Goods Transportation Service ({order.vehicleName})
                </td>
                <td className="py-3 font-mono text-gray-500">996511</td>
                <td className="py-3 text-center">{order.distance || '14.2 km'}</td>
                <td className="py-3 text-right font-mono font-semibold">₹{baseFare + distFare}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Goods and Services Tax (GST @ 5%)</td>
                <td className="py-2 font-mono text-gray-500">CGST (2.5%) + SGST (2.5%)</td>
                <td className="py-2 text-center">-</td>
                <td className="py-2 text-right font-mono font-semibold">₹{gst}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-bold text-sm">
                <td colSpan="3" className="py-3 text-gray-900 text-right pr-4">Total Amount Payable:</td>
                <td className="py-3 text-right text-porter-blue font-black text-base">₹{order.fare}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer note */}
          <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
            <span>This is a computer-generated tax invoice and requires no physical signature.</span>
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Tax Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
