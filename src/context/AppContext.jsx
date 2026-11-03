import React, { createContext, useContext, useState, useEffect } from 'react';
import { CITIES, VEHICLES } from '../data/mockData';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // corrupt data or storage blocked (Safari private mode etc.)
  }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / blocked */ }
};

const PLATE_PREFIX = {
  mumbai: 'MH 02', pune: 'MH 12', nagpur: 'MH 31', delhi: 'DL 1C', bangalore: 'KA 03',
  hyderabad: 'TS 09', chennai: 'TN 01', coimbatore: 'TN 37', kolkata: 'WB 02', ahmedabad: 'GJ 01',
  surat: 'GJ 05', jaipur: 'RJ 14', lucknow: 'UP 32', chandigarh: 'CH 01', indore: 'MP 09'
};

const ALLOWED_TRANSITIONS = {
  assigned: ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

const generateOrderId = (existing = []) => {
  let id;
  do { id = `PRT-${Math.floor(10000 + Math.random() * 90000)}`; }
  while (existing.some((b) => b.orderId === id));
  return id;
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    return readJSON('porter_city', CITIES[0]); // Default: Mumbai
  });

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const [user, setUser] = useState(() => {
    return readJSON('porter_user', { isLoggedIn: false, name: '', phone: '' });
  });

  // Dynamic Fleet Tariffs (Configurable by Admin & synced everywhere)
  const [fleetTariffs, setFleetTariffs] = useState(() => {
    // Merge admin overrides onto the current code defaults so new vehicles/fields still appear.
    const saved = readJSON('porter_tariffs', null);
    if (!Array.isArray(saved)) return VEHICLES;
    return VEHICLES.map((v) => {
      const s = saved.find((x) => x.id === v.id);
      return s ? { ...v, basePrice: s.basePrice, ratePerKm: s.ratePerKm } : v;
    });
  });

  // Active bookings list (shared across Customer, Admin, and Driver)
  const [activeBookings, setActiveBookings] = useState(() => {
    const saved = readJSON('porter_bookings', null);
    return Array.isArray(saved) ? saved : [
      {
        orderId: 'PRT-89412',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        pickup: 'Andheri West Metro Station, Mumbai',
        drop: 'BKC (Bandra Kurla Complex), Mumbai',
        vehicleName: 'Tata Ace (Chota Hathi)',
        vehicleId: 'tata-ace',
        vehicleIcon: '/images/Tata_Ace_5fd23cdaf0.svg',
        fare: 462,
        distance: '14.2 km',
        driver: {
          name: 'Rameshwar Yadav',
          phone: '+91 98201 44521',
          vehicleNo: 'MH 02 EE 7418',
          rating: 4.9,
          otp: '4892'
        },
        status: 'in_transit', // 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
        progress: 65,
        paymentStatus: 'PAID_ONLINE',
        paymentMethod: 'UPI (GPay)',
        goodsType: 'Carton Boxes & Electronics',
        senderName: 'Ankit Sharma',
        senderPhone: '+91 98765 43210',
        receiverName: 'Pooja Verma',
        receiverPhone: '+91 98200 11223'
      }
    ];
  });

  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState('PRT-89412');
  const [driverOnline, setDriverOnline] = useState(true);
  const [driverEarnings, setDriverEarnings] = useState(3280);

  useEffect(() => {
    writeJSON('porter_city', selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    writeJSON('porter_user', user);
  }, [user]);

  useEffect(() => {
    writeJSON('porter_bookings', activeBookings);
  }, [activeBookings]);

  useEffect(() => {
    writeJSON('porter_tariffs', fleetTariffs);
  }, [fleetTariffs]);

  // Keep other tabs (e.g. Admin vs Customer) in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'porter_bookings') setActiveBookings(JSON.parse(e.newValue));
        if (e.key === 'porter_tariffs') setFleetTariffs(JSON.parse(e.newValue));
      } catch { /* ignore malformed */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Add new customer booking
  const addBooking = (bookingData) => {
    const newId = bookingData.orderId || generateOrderId(activeBookings);
    const newBooking = {
      orderId: newId,
      createdAt: new Date().toISOString(),
      pickup: bookingData.pickup,
      drop: bookingData.drop,
      vehicleName: bookingData.vehicle.name,
      vehicleId: bookingData.vehicle.id,
      vehicleIcon: bookingData.vehicle.icon || bookingData.vehicle.image,
      fare: bookingData.fare,
      distance: `${bookingData.distance} km`,
      driver: {
        name: 'Rameshwar Yadav',
        phone: '+91 98201 44521',
        vehicleNo: `${PLATE_PREFIX[selectedCity.id] || 'XX 00'} EE 7418`,
        rating: 4.9,
        otp: Math.floor(1000 + Math.random() * 9000).toString()
      },
      status: 'assigned',
      progress: 25,
      paymentStatus: bookingData.paymentId ? 'PAID_ONLINE' : 'CASH_ON_DELIVERY',
      paymentMethod: bookingData.paymentId ? 'Razorpay Secure' : 'Cash on Delivery (COD)',
      paymentId: bookingData.paymentId || null,
      senderName: bookingData.senderName,
      senderPhone: bookingData.senderPhone,
      receiverName: bookingData.receiverName,
      receiverPhone: bookingData.receiverPhone,
      goodsType: bookingData.goodsType,
      cityId: selectedCity.id,
      pickupCoord: bookingData.pickupCoord || null,
      dropCoord: bookingData.dropCoord || null,
      pricing: bookingData.pricing || null,
      moveDate: bookingData.moveDate || null
    };

    setActiveBookings(prev => [newBooking, ...prev]);
    setActiveTrackingOrderId(newId);
    return newId;
  };

  // Update order status (called by Driver or Admin)
  const updateBookingStatus = (orderId, newStatus) => {
    setActiveBookings(prev => prev.map(b => {
      if (b.orderId === orderId && (ALLOWED_TRANSITIONS[b.status] || []).includes(newStatus)) {
        let prog = b.progress;
        if (newStatus === 'in_transit') prog = 60;
        if (newStatus === 'delivered') prog = 100;
        return { ...b, status: newStatus, progress: prog };
      }
      return b;
    }));
  };

  // Complete delivery with OTP check (called by driver app)
  const verifyDeliveryOtp = (orderId, enteredOtp) => {
    const order = activeBookings.find(b => b.orderId === orderId);
    if (!order) return { success: false, message: 'Order not found' };
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return { success: false, message: 'This trip is already closed.' };
    }
    if (order.driver.otp !== enteredOtp.trim()) {
      return { success: false, message: 'Incorrect OTP. Ask receiver for the 4-digit code.' };
    }

    // Mark delivered
    updateBookingStatus(orderId, 'delivered');
    setDriverEarnings(prev => prev + Math.round(order.fare * 0.82)); // 82% to driver, 18% platform commission
    return { success: true };
  };

  // Admin tariff updater
  const updateTariff = (vehicleId, field, value) => {
    setFleetTariffs(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const n = parseFloat(value);
        return { ...v, [field]: Number.isFinite(n) && n >= 0 ? n : v[field] };
      }
      return v;
    }));
  };

  const resetTariffs = () => setFleetTariffs(VEHICLES);

  const loginUser = (name, phone) => {
    setUser({ isLoggedIn: true, name, phone });
    setIsLoginModalOpen(false);
  };

  const logoutUser = () => {
    setUser({ isLoggedIn: false, name: '', phone: '' });
  };

  return (
    <AppContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        isCityModalOpen,
        setIsCityModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isTrackModalOpen,
        setIsTrackModalOpen,
        user,
        loginUser,
        logoutUser,
        activeBookings,
        addBooking,
        updateBookingStatus,
        verifyDeliveryOtp,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        fleetTariffs,
        updateTariff,
        resetTariffs,
        driverOnline,
        setDriverOnline,
        driverEarnings
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
