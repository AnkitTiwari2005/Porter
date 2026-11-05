# Go-live checklist

## You must provide (code cannot do these)
- [ ] Domain, TLS, managed PostgreSQL with automated backups and a tested restore
- [ ] Razorpay live keys (KYC complete), webhook registered, one real ₹1 payment and one refund tested end to end
- [ ] SMS provider account with DLT-registered sender ID and templates (OTP, driver assigned, delivery OTP, delivered, cancelled)
- [ ] Mapbox (or similar) token; map tile provider for production traffic (the default OSM tile server is for light use)
- [ ] Business facts in env: SUPPLIER_NAME / ADDRESS / STATE / GSTIN, SAC code, GST rate (confirm with your accountant,
      including inter-state supply and packers/parcel treatment), driver payout %, cancellation fee
- [ ] Counsel-reviewed Terms, Privacy, Refund/Cancellation; consent wording; prohibited-goods list
- [ ] Remove or substantiate marketing claims and statistics in the page copy (see "Content" below)
- [ ] Driver onboarding: documents/KYC, vehicle papers, insurance - currently admins create drivers by phone number only

## Verify in a real environment
- [ ] Click through every flow in Chrome + Safari + a mid-range Android phone (the UI has not been run in a browser yet)
- [ ] Live SMS delivery, live Razorpay checkout/webhook/refund, live Mapbox autocomplete and routing
- [ ] Load test dispatch, SSE connections and booking bursts; set DB pool size and API instance sizing from the result
- [ ] Monitoring and alerting (uptime, 5xx rate, webhook failures, failed refunds, dispatch backlog); error tracking (e.g. Sentry)
- [ ] Rate limits are in-memory per instance: move to a shared store before running more than one API instance
- [ ] Security review / penetration test; admin 2FA; secret rotation process

## Content still to fix in the web copy
Home, Trucks, Two-Wheeler, Enterprise and Footer pages still contain unverified statistics and some city-specific (Mumbai)
copy; the legal pages are placeholders; per-route page titles are not set.
