// DRAFT legal text describing how the system actually behaves. Items marked [CONFIRM] are business decisions that the
// code cannot make for you. Have a lawyer review everything, then set BRANDING.legalReviewed = true to remove the banner.
export function legalPages({ brand, email, phone, cancelFee, gstPercent }) {
  const fee = cancelFee > 0 ? `a cancellation fee of ₹${cancelFee} applies` : 'no cancellation fee applies';
  return {
    terms: {
      title: 'Terms of Service',
      sections: [
        { h: '1. About these terms', p: [`These terms govern your use of the ${brand} website and booking service. By creating an account or placing an order you agree to them. Our service arranges transport and delivery between you and independent driver partners. [CONFIRM: legal entity name, registered address and CIN]`] },
        { h: '2. Your account', p: ['You log in with a one-time code sent to your mobile number. You are responsible for activity on your account and for keeping your number and codes private. Never share an OTP with anyone other than the delivery driver at the time of delivery.'] },
        { h: '3. Bookings and prices', p: [`The fare is calculated by us from the route distance, vehicle type, any helpers or extra stop you choose, and any coupon you apply. The total, including GST at ${gstPercent}%, is shown before you confirm and is the amount you pay. If the price changes between viewing and confirming, we show you the new price and ask you to confirm again. [CONFIRM: treatment of tolls, parking and waiting charges]`] },
        { h: '4. Goods you may send', p: ['You must not send illegal items, hazardous or flammable materials, weapons, live animals, cash or valuables, or anything restricted by law. You are responsible for accurate item descriptions. We and the driver may refuse a booking or a pickup if the goods appear unsafe or prohibited. [CONFIRM: final prohibited-goods list and any value limits]'] },
        { h: '5. Delivery and OTP', p: ['A 4-digit delivery OTP is shown to you in the app and sent to the receiver by SMS when the goods are picked up. The driver completes delivery by entering the OTP the receiver gives them. Delivery is treated as complete when a valid OTP is entered.'] },
        { h: '6. Payment', p: ['You can pay online (UPI, cards, netbanking, wallets) through Razorpay, or in cash to the driver where Cash on Delivery is offered. We do not see or store your card details. Intercity parcels and home shifting must be paid online.'] },
        { h: '7. Cancellation and refunds', p: ['See our Cancellation & Refund Policy, which forms part of these terms.'] },
        { h: '8. Liability', p: ['[CONFIRM WITH COUNSEL: liability for loss or damage to goods, any declared-value or insurance arrangements, claim procedure and time limits, and limitation of liability.] We do not currently offer transit insurance on orders.'] },
        { h: '9. Suspension', p: ['We may suspend or close accounts that misuse the service, provide false information, or put drivers at risk.'] },
        { h: '10. Governing law', p: ['[CONFIRM: governing law and courts. Typically the laws of India and the courts at your registered office city.]'] },
        { h: '11. Contact', p: [`Questions: ${email}${phone ? `, ${phone}` : ''}.`] }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      sections: [
        { h: 'What we collect', p: ['Account: your mobile number and name.', 'Orders: pickup, drop and stop addresses and map coordinates, sender and receiver names and phone numbers, goods description, notes, fare and payment status.', 'Location: your device location only when you tap “Use GPS” while entering an address. Drivers share their live location while online and during trips.', 'Technical: a login cookie, request logs (IP address, time, page) and security logs.'] },
        { h: 'Why we use it', p: ['To verify you and keep your account secure, to price, dispatch and deliver orders, to let customers and receivers track a delivery, to take payment and issue invoices, to send OTP and order SMS, to prevent fraud and to meet legal and tax obligations.'] },
        { h: 'Who receives it', p: [`Drivers see the pickup and drop details and the sender and receiver contact numbers for the trips they are assigned. Our service providers process data for us: Razorpay (payments), an SMS provider (codes and notifications), a mapping provider (address search and routes) and our hosting and database provider. A receiver with your tracking link can see the route, status, the driver's first name and vehicle number, and live location during the trip, but not phone numbers or the OTP. We do not sell personal data.`] },
        { h: 'How long we keep it', p: ['We keep order, payment and invoice records for as long as tax and accounting law requires [CONFIRM: retention period, commonly several years]. Login codes are deleted after 24 hours and expired sessions after 7 days.'] },
        { h: 'Your rights', p: [`You can ask us to access, correct or delete your personal data, withdraw consent, or raise a grievance, by writing to ${email}. Some records must be kept by law even after deletion. [CONFIRM: name and contact of your grievance officer, as required under Indian law]`] },
        { h: 'Security', p: ['Login codes are stored only as hashes, sessions can be revoked, administrator accounts require two-factor sign-in, and all traffic should be served over HTTPS. No system is perfectly secure; tell us at once if you suspect misuse of your account.'] },
        { h: 'Changes', p: ['We will update this page when our practices change.'] }
      ]
    },
    refunds: {
      title: 'Cancellation & Refund Policy',
      sections: [
        { h: 'Cancelling an order', p: [`You can cancel from the Track page any time before the driver picks up your goods. Before a driver is assigned, no cancellation fee applies. After a driver is assigned, ${fee}. Once the goods are on the way, the order can no longer be cancelled in the app; contact support.`] },
        { h: 'Refunds for online payments', p: ['If you paid online and the order is cancelled, we refund the amount paid less any cancellation fee to your original payment method. Refunds are started immediately; banks typically take 5 to 7 working days to show them [CONFIRM: your provider’s timelines].'] },
        { h: 'No driver available', p: ['If we cannot find a driver within the search period, the order is cancelled automatically and any online payment is refunded in full.'] },
        { h: 'Payments that do not complete', p: ['If your payment window is closed or fails, the order is saved as “payment pending” and cancelled automatically if payment is not completed within the allowed time. If money was debited, it is matched to your order or refunded.'] },
        { h: 'Cash on delivery', p: ['Nothing is charged if you cancel before pickup.'] },
        { h: 'Damaged or lost goods', p: ['Contact support as soon as possible with your order number. [CONFIRM: claim process and compensation policy]'] }
      ]
    },
    safety: {
      title: 'Safety & Security',
      sections: [
        { h: 'Verified delivery', p: ['Every order has a 4-digit delivery OTP. The driver can only mark an order delivered with the receiver’s code, and the code locks after repeated wrong attempts.'] },
        { h: 'Driver checks', p: ['Before a driver can receive trips, our team records and checks their driving licence, vehicle registration and insurance. Drivers are suspended automatically when a document expires. [CONFIRM: any additional background verification you carry out before describing it here]'] },
        { h: 'Tracking', p: ['You can follow your driver live on the Track page and share a read-only tracking link with the receiver.'] },
        { h: 'Account security', p: ['Logins use one-time codes, administrators use two-factor authentication, and sessions can be ended at any time by logging out.'] },
        { h: 'Report a problem', p: [`Write to ${email}. Include the order number.`] }
      ]
    }
  };
}
