import React from 'react';

const TITLES = { terms: 'Terms of Service', privacy: 'Privacy Policy', security: 'Security' };

// PLACEHOLDER: replace the body with text reviewed by your lawyer before launch.
export default function LegalPage({ kind }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-2xl font-black text-gray-900">{TITLES[kind]}</h1>
      <p className="mt-4 text-sm text-gray-600">
        This page is a placeholder. Add your legally reviewed {TITLES[kind].toLowerCase()} here.
      </p>
    </div>
  );
}
