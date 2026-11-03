import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <p className="text-6xl font-black text-porter-blue">404</p>
      <h1 className="text-xl font-bold text-gray-900 mt-2">Page not found</h1>
      <p className="text-sm text-gray-500 mt-1">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-5 px-5 py-2.5 rounded-xl bg-porter-blue text-white text-xs font-bold">Back to home</Link>
    </div>
  );
}
