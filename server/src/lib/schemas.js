import { z } from 'zod';
import { PHONE_RE } from '../services/auth.js';

export const normalizePhone = (v) => {
  if (typeof v !== 'string') return v;
  let d = v.replace(/[^0-9]/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};
export const phone = z.preprocess(normalizePhone, z.string().regex(PHONE_RE, 'Enter a valid 10-digit Indian mobile number'));
const name = z.string().trim().min(2, 'Enter a name').max(80);
const pin = z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode');

const point = z.object({
  address: z.string().trim().min(3, 'Enter an address').max(300),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
});

export const quoteSchema = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('city'), cityId: z.string().max(40), vehicleId: z.string().max(40), pickup: point, drop: point,
    helperCount: z.number().int().min(0).max(2).default(0), stop: point.optional(),
    promoCode: z.string().trim().max(30).optional().transform((v) => v || undefined)
  }),
  z.object({
    serviceType: z.literal('packers'), cityId: z.string().max(40), planId: z.string().max(20), pickup: point, drop: point,
    hasLiftPickup: z.boolean().default(true), hasLiftDrop: z.boolean().default(true), needDismantling: z.boolean().default(false)
  }),
  z.object({
    serviceType: z.literal('parcel'), cityId: z.string().max(40), mode: z.enum(['air', 'surface']),
    weightKg: z.number().positive().max(50), pickupPincode: pin, dropPincode: pin,
    pickupAddress: z.string().trim().max(200).optional(), dropAddress: z.string().trim().max(200).optional()
  })
]);

export const createOrderSchema = z.object({
  quote: quoteSchema,
  paymentMethod: z.enum(['online', 'cod']),
  expectedTotal: z.number().int().nonnegative().optional(),
  sender: z.object({ name, phone }),
  receiver: z.object({ name, phone }),
  goodsType: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  scheduledFor: z.string().datetime({ offset: true }).optional()
});

export const leadSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(80),
  phone,
  email: z.string().trim().email().max(120).optional().or(z.literal('').transform(() => undefined)),
  details: z.record(z.string().max(500)).default({}),
  website: z.string().max(500).optional() // honeypot: real users leave it empty; the route fakes success if filled
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD').refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Not a real date');
export const driverDocsSchema = z.object({
  licenseNo: z.string().trim().min(5).max(30),
  licenseExpiry: isoDate,
  rcExpiry: isoDate,
  insuranceExpiry: isoDate
});
export const ratingSchema = z.object({ stars: z.number().int().min(1).max(5), comment: z.string().trim().max(300).optional() });
