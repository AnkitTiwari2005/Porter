import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) { console.error('App crashed:', error, info); }

  resetAndReload = () => {
    try {
      ['portex_city', 'porter_city', 'porter_user', 'porter_bookings', 'porter_tariffs'].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#f8fafc]">
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">Try reloading. If it keeps happening, reset the saved data on this device.</p>
        {this.state.error && (
          <p className="text-[11px] text-rose-500 font-mono mt-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 max-w-md break-words">
            {this.state.error.message || String(this.state.error)}
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-porter-blue text-white text-xs font-bold">Reload</button>
          <button onClick={this.resetAndReload} className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700">Reset saved data</button>
        </div>
      </div>
    );
  }
}
