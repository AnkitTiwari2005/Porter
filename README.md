# 🚚 Porter — On-Demand Goods Transportation & Logistics Platform

An authentic, production-grade clone of **[Porter.in](https://porter.in)** built with **React 18**, **Vite 5**, **Tailwind CSS**, and **Leaflet / OpenStreetMap**. It faithfully replicates the original Porter UI/UX design language (*"Delivery Aapki, Transport Hamara"*, `#HoJayega`, Porter Royal Blue `#0a57ff`), incorporates all original media assets, and provides a fully functional, market-ready logistics ecosystem.

---

## 🚀 Live Application URLs

The application is actively running on:
- **Homepage:** [http://localhost:3000/](http://localhost:3000/)
- **Fare Estimate & Booking:** [http://localhost:3000/fare-estimate](http://localhost:3000/fare-estimate)
- **Packers & Movers (House Shifting):** [http://localhost:3000/packers-and-movers](http://localhost:3000/packers-and-movers)
- **All India Parcel Courier:** [http://localhost:3000/all-india-parcel](http://localhost:3000/all-india-parcel)
- **Porter Enterprise (B2B):** [http://localhost:3000/enterprise](http://localhost:3000/enterprise)
- **City Mini Trucks (Tata Ace):** [http://localhost:3000/trucks-mumbai](http://localhost:3000/trucks-mumbai)
- **Two-Wheelers (Instant Courier):** [http://localhost:3000/two-wheelers-mumbai](http://localhost:3000/two-wheelers-mumbai)
- **Live Order Tracking & GPS Telemetry:** [http://localhost:3000/track](http://localhost:3000/track)
- **Admin Dispatch Console:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Driver Partner Portal:** [http://localhost:3000/driver](http://localhost:3000/driver)

---

## 🌟 Market-Ready Features & UX Architecture

### 1. 🎯 Faithful Porter UI & UX
- **Design Tokens:** Porter Royal Blue (`#0a57ff`), top black bar (`#000000`), green pickup indicator (`#0d8154`), red drop indicator (`#e03748`), and Titillium Web / Inter typography.
- **Authentic Assets:** Extracted vehicle illustrations (Tata Ace, 3-Wheeler, 2-Wheeler EV, Scooty), banners (`IND_desktop_banner_d08506ac6f.webp`), store badges, and logos.
- **Taglines & Copy:** *"Delivery Aapki, Transport Hamara"*, *"Delivery hai? #HoJayega"*, and verified FAQ accordions from the original site.

### 2. 🗺️ Real Interactive Map & Route Calculation
- **OpenStreetMap & Leaflet Integration:** Real-world map tiles with zero paid API keys required.
- **Dynamic Geo Distance Engine:** Computes real road distances between pickup and drop points using Haversine calculation and road tortuosity factors.
- **Interactive Multi-Drop (+ Add Stop):** Add intermediate drop points with automatic distance and fare adjustments.
- **Helper for Loading/Unloading:** Choose 0, 1 (+₹150), or 2 (+₹300) loading helpers for mini truck bookings.

### 3. 🏡 Dedicated Packers & Movers (`/packers-and-movers`)
- **House Size Selection:** 1 RK / Studio, 1 BHK, 2 BHK, 3 BHK / Villa, and Mini Shift.
- **Logistics Add-ons:** Elevator availability checkboxes (pickup & drop) and carpenter dismantling/assembly options (+₹600).
- **Moving Date Picker:** Select preferred relocation schedule with ₹50,000 transit insurance guarantee.

### 4. 💳 Razorpay Checkout & Tax Invoice
- **Payment Modes:** Instant UPI (with live QR code & VPA suffixes), Debit/Credit Cards, Net Banking, and Cash on Delivery (COD).
- **Official GST Tax Invoice:** Generates printable, compliant tax invoices with HSN code (996511), GSTIN, CIN, and itemized breakdown.

### 5. 📊 Admin Dispatch & Real-time Tariff Control (`/admin`)
- **Operations Console:** Live order dispatch queue with real-time status filtering.
- **Dynamic Tariff Configurator:** Tune vehicle base fares (₹) and per-km rates on the fly—updates propagate instantly across customer fare estimators.
- **Fleet Radar:** Live telemetry view of active vehicles across the city.

### 6. 📱 Driver Partner Portal (`/driver`)
- **Online / Offline Toggle:** Switch availability to accept incoming dispatches.
- **Audio Chime Alerts:** Web Audio API sound alert on incoming orders.
- **Delivery OTP Security Gate:** 4-digit customer OTP required to complete trip, credit driver wallet, and update customer tracking screen.

---

## 📁 Directory Structure

```text
PORTER/
├── dist/                     # Optimized production bundle
├── public/
│   └── images/               # Authentic Porter SVGs, WebPs, PNGs, and QR codes
├── src/
│   ├── components/
│   │   ├── InteractiveMap.jsx   # Real OpenStreetMap Leaflet component
│   │   ├── RazorpayModal.jsx    # Complete Razorpay payment checkout
│   │   ├── InvoiceModal.jsx     # Printable GST Tax Invoice modal
│   │   ├── Navbar.jsx           # Authentic Porter header & sticky navigation
│   │   ├── Footer.jsx           # Porter corporate footer & links
│   │   ├── CitySelectorModal.jsx# 15+ Indian metros selector
│   │   ├── LoginModal.jsx       # Mobile OTP verification
│   │   └── TrackOrderModal.jsx  # Live order tracking pop-up
│   ├── config/
│   │   └── branding.jsx         # Porter brand settings & logo
│   ├── context/
│   │   └── AppContext.jsx       # Global state (city, orders, user, tariffs)
│   ├── data/
│   │   ├── mockData.js          # Vehicle fleet, locations, promo codes, FAQs
│   │   └── geoData.js           # Real coordinates & distance engine
│   ├── pages/
│   │   ├── HomePage.jsx         # Flagship Porter landing page
│   │   ├── FareEstimatePage.jsx # Route calculator with Leaflet map & helpers
│   │   ├── PackersMoversPage.jsx# Complete house shifting quote & booking flow
│   │   ├── TrucksMumbaiPage.jsx # Dedicated city mini trucks page
│   │   ├── TwoWheelersMumbaiPage.jsx # 2-wheeler courier page
│   │   ├── OrderTrackingPage.jsx# Live route tracking & movement simulator
│   │   ├── AdminDashboardPage.jsx # Admin dispatch & tariff control
│   │   └── DriverPortalPage.jsx # Driver acceptance & OTP verification
│   ├── App.jsx                  # Main routing & layout
│   └── index.css                # Leaflet & Tailwind styles
```

---

## 🏃 Run Commands

```bash
# Start Vite development server
npm run dev

# Build production bundle with optimized chunking
npm run build
```
