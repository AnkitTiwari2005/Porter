import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CITIES, VEHICLES } from '../data/mockData';
import { api } from '../lib/api';
import { payForOrder } from '../lib/checkout';

const AppContext = createContext();

const readCity = () => {
  try {
    const id = JSON.parse(localStorage.getItem('portex_city') || 'null')?.id;
    return CITIES.find((c) => c.id === id) || CITIES[0];
  } catch { return CITIES[0]; }
};

export function AppProvider({ children }) {
  const [selectedCity, setSelectedCityState] = useState(readCity);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState(null);              // { id, phone, name, role } | null
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const pending = useRef(null); // action to resume after login

  const setSelectedCity = useCallback((city) => {
    setSelectedCityState(city);
    try { localStorage.setItem('portex_city', JSON.stringify({ id: city.id })); } catch { /* storage blocked */ }
  }, []);

  // Bootstrap: who am I, and what does the catalogue cost right now?
  useEffect(() => {
    api.get('/me').then((r) => setAccount(r.user)).catch(() => setAccount(null)).finally(() => setAuthReady(true));
    api.get('/catalog').then(setCatalog).catch(() => setCatalogError('Live prices are unavailable right now. Please refresh.'));
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!account || account.role !== 'customer') { setOrders([]); return []; }
    setOrdersLoading(true);
    try {
      const r = await api.get('/orders');
      setOrders(r.orders);
      return r.orders;
    } catch { return []; } finally { setOrdersLoading(false); }
  }, [account]);

  useEffect(() => { refreshOrders(); }, [refreshOrders]);

  // An admin who passed the SMS code but not the authenticator code must finish signing in: reopen the dialog.
  useEffect(() => { if (account?.mfa) setIsLoginModalOpen(true); }, [account]);
  const refreshAccount = useCallback(async () => { const r = await api.get('/me'); setAccount(r.user); return r.user; }, []);

  const requestOtp = (phone) => api.post('/auth/otp/request', { phone });
  const verifyOtp = async (phone, code, name) => {
    const r = await api.post('/auth/otp/verify', { phone, code, name });
    setAccount(r.user);
    const resume = pending.current;
    pending.current = null;
    return { user: r.user, resume };
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* cookie is cleared server-side on next request anyway */ }
    setAccount(null);
    setOrders([]);
  };

  // Opens the login modal and remembers what the user was trying to do.
  const requireLogin = useCallback((resumeFn) => {
    pending.current = resumeFn || null;
    setIsLoginModalOpen(true);
  }, []);

  // Live prices from the API override the static defaults; vehicles the admin disabled disappear.
  const fleetTariffs = useMemo(() => {
    if (!catalog) return VEHICLES;
    return VEHICLES.filter((v) => catalog.vehicles.some((x) => x.id === v.id)).map((v) => {
      const live = catalog.vehicles.find((x) => x.id === v.id);
      return { ...v, basePrice: live.basePrice, baseKm: live.baseKm, ratePerKm: live.ratePerKm, etaMinutes: live.etaMinutes };
    });
  }, [catalog]);

  // Creates the order on the server; for online payments, opens Razorpay and verifies the result server-side.
  // Resolves { order, paymentPending } - paymentPending is true if the customer closed the payment window.
  const bookOrder = useCallback(async (payload, idempotencyKey) => {
    const res = await api.post('/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } });
    let order = res.order;
    let paymentPending = false;
    if (payload.paymentMethod === 'online' && res.payment) {
      try {
        order = await payForOrder({ order, payment: res.payment, user: account, brand: catalog?.brand || 'Portex' });
      } catch (e) {
        if (e.dismissed || e.failed) paymentPending = true; else throw e;
      }
    }
    setActiveTrackingOrderId(order.id);
    await refreshOrders();
    return { order, paymentPending };
  }, [account, catalog, refreshOrders]);

  const payPending = useCallback(async (orderId) => {
    const { payment } = await api.get(`/orders/${orderId}/payment`);
    const order = orders.find((o) => o.id === orderId) || { id: orderId };
    const paid = await payForOrder({ order, payment, user: account, brand: catalog?.brand || 'Portex' });
    await refreshOrders();
    return paid;
  }, [account, catalog, orders, refreshOrders]);

  const cancelOrder = useCallback(async (orderId, reason) => {
    const r = await api.post(`/orders/${orderId}/cancel`, { reason });
    await refreshOrders();
    return r.order;
  }, [refreshOrders]);

  const user = useMemo(() => ({
    isLoggedIn: !!account, mfa: account?.mfa || null, id: account?.id, name: account?.name || '', phone: account?.phone || '', role: account?.role || null
  }), [account]);

  const value = {
    selectedCity, setSelectedCity,
    isCityModalOpen, setIsCityModalOpen, isLoginModalOpen, setIsLoginModalOpen, isTrackModalOpen, setIsTrackModalOpen,
    authReady, user, requestOtp, verifyOtp, logout, requireLogin, refreshAccount,
    catalog, catalogError, fleetTariffs, gstRate: catalog?.gstRate ?? 0.05, paymentsEnabled: !!catalog?.paymentsEnabled, cancelFee: catalog?.cancelFeeRupees ?? 0,
    orders, ordersLoading, refreshOrders, bookOrder, payPending, cancelOrder,
    activeTrackingOrderId, setActiveTrackingOrderId
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
