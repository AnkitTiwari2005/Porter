import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CitySelectorModal from './components/CitySelectorModal';
import LoginModal from './components/LoginModal';
import TrackOrderModal from './components/TrackOrderModal';

import HomePage from './pages/HomePage';
import FareEstimatePage from './pages/FareEstimatePage';
import TrucksPage from './pages/TrucksPage';
import TwoWheelersPage from './pages/TwoWheelersPage';
import PackersMoversPage from './pages/PackersMoversPage';
import AllIndiaParcelPage from './pages/AllIndiaParcelPage';
import EnterprisePage from './pages/EnterprisePage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicTrackingPage from './pages/PublicTrackingPage';
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
              <Route path="/trucks" element={<TrucksPage />} />
              <Route path="/two-wheelers" element={<TwoWheelersPage />} />
              <Route path="/trucks-mumbai" element={<Navigate to="/trucks" replace />} />
              <Route path="/two-wheelers-mumbai" element={<Navigate to="/two-wheelers" replace />} />
              <Route path="/packers-and-movers" element={<PackersMoversPage />} />
              <Route path="/all-india-parcel" element={<AllIndiaParcelPage />} />
              <Route path="/enterprise" element={<EnterprisePage />} />
              <Route path="/track" element={<OrderTrackingPage />} />
              <Route path="/track/:orderId" element={<OrderTrackingPage />} />
              <Route path="/t/:token" element={<PublicTrackingPage />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/safety" element={<LegalPage kind="safety" />} />
              <Route path="/refund-policy" element={<LegalPage kind="refunds" />} />
              <Route path="/security" element={<Navigate to="/safety" replace />} />
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
