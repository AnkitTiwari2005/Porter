import React, { createContext, useContext, useState, useEffect } from 'react';
import { CITIES, VEHICLES } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    const saved = localStorage.getItem('porter_city');
    return saved ? JSON.parse(saved) : CITIES[0]; // Default: Mumbai
  });

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('porter_user');
    return saved ? JSON.parse(saved) : { isLoggedIn: true, name: 'Ankit Sharma', phone: '9876543210' };
  });

  // Dynamic Fleet Tariffs (Configurable by Admin & synced everywhere)
  const [fleetTariffs, setFleetTariffs] = useState(() => {
    const saved = localStorage.getItem('porter_tariffs');
    return saved ? JSON.parse(saved) : VEHICLES;
  });

  // Active bookings list (shared across Customer, Admin, and Driver)
  const [activeBookings, setActiveBookings] = useState(() => {
    const saved = localStorage.getItem('porter_bookings');
    return saved ? JSON.parse(saved) : [
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
    localStorage.setItem('porter_city', JSON.stringify(selectedCity));
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem('porter_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('porter_bookings', JSON.stringify(activeBookings));
  }, [activeBookings]);

  useEffect(() => {
    localStorage.setItem('porter_tariffs', JSON.stringify(fleetTariffs));
  }, [fleetTariffs]);

  // Add new customer booking
  const addBooking = (bookingData) => {
    const newId = `PRT-${Math.floor(10000 + Math.random() * 90000)}`;
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
        vehicleNo: `${selectedCity.id === 'mumbai' ? 'MH 02' : selectedCity.id === 'delhi' ? 'DL 1C' : 'KA 03'} EE 7418`,
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
      goodsType: bookingData.goodsType
    };

    setActiveBookings(prev => [newBooking, ...prev]);
    setActiveTrackingOrderId(newId);
    return newId;
  };

  // Update order status (called by Driver or Admin)
  const updateBookingStatus = (orderId, newStatus) => {
    setActiveBookings(prev => prev.map(b => {
      if (b.orderId === orderId) {
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
        return { ...v, [field]: parseFloat(value) || 0 };
      }
      return v;
    }));
  };

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
