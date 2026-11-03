import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CitySelectorModal from './components/CitySelectorModal';
import LoginModal from './components/LoginModal';
import TrackOrderModal from './components/TrackOrderModal';

import HomePage from './pages/HomePage';
import FareEstimatePage from './pages/FareEstimatePage';
import TrucksMumbaiPage from './pages/TrucksMumbaiPage';
import TwoWheelersMumbaiPage from './pages/TwoWheelersMumbaiPage';
import PackersMoversPage from './pages/PackersMoversPage';
import AllIndiaParcelPage from './pages/AllIndiaParcelPage';
import EnterprisePage from './pages/EnterprisePage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import NotFoundPage from './pages/NotFoundPage';
import LegalPage from './pages/LegalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DriverPortalPage from './pages/DriverPortalPage';

// Scroll to top upon route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e2432]">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/fare-estimate" element={<FareEstimatePage />} />
              <Route path="/trucks-mumbai" element={<TrucksMumbaiPage />} />
              <Route path="/two-wheelers-mumbai" element={<TwoWheelersMumbaiPage />} />
              <Route path="/packers-and-movers" element={<PackersMoversPage />} />
              <Route path="/all-india-parcel" element={<AllIndiaParcelPage />} />
              <Route path="/enterprise" element={<EnterprisePage />} />
              <Route path="/track" element={<OrderTrackingPage />} />
              <Route path="/track/:orderId" element={<OrderTrackingPage />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/security" element={<LegalPage kind="security" />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/driver" element={<DriverPortalPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />

          {/* Global Dialogs & Modals */}
          <CitySelectorModal />
          <LoginModal />
          <TrackOrderModal />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
