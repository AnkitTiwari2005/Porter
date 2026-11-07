import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDING } from '../config/branding';
import { useApp } from '../context/AppContext';
import { legalPages } from '../content/legal';
import { usePageTitle } from '../lib/usePageTitle';

export default function LegalPage({ kind }) {
  const { catalog } = useApp();
  const pages = legalPages({ brand: BRANDING.name, email: BRANDING.supportEmail, phone: BRANDING.supportPhone, cancelFee: catalog?.cancelFeeRupees ?? 0, gstPercent: Math.round((catalog?.gstRate ?? 0.05) * 100) });
  const page = pages[kind];
  usePageTitle(page?.title);
  if (!page) return null;
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {!BRANDING.legalReviewed && (
        <div role="note" className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          Draft pending legal review. Items marked [CONFIRM] are decisions still to be made by the business.
        </div>
      )}
      <h1 className="text-2xl font-black text-gray-900">{page.title}</h1>
      <div className="mt-6 space-y-6">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-bold text-gray-900">{s.h}</h2>
            {s.p.map((t) => <p key={t} className="mt-2 text-sm text-gray-600 leading-relaxed">{t}</p>)}
          </section>
        ))}
      </div>
      <nav className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-semibold text-porter-blue" aria-label="Policies">
        <Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/refund-policy">Cancellation & refunds</Link><Link to="/safety">Safety</Link>
      </nav>
    </div>
  );
}
