import PDFDocument from 'pdfkit';
import { cityById } from '../../../shared/cities.js';
import { notFound } from '../lib/errors.js';

// Indian financial year (1 Apr - 31 Mar), evaluated in IST.
export function financialYear(date) {
  const ist = new Date(new Date(date).getTime() + 5.5 * 3_600_000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

const rupees = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

function buildLines(order) {
  const p = order.pricing;
  const lines = [];
  if (p.kind === 'city') {
    lines.push({ label: `Goods transport - ${order.vehicle_name} (first ${p.baseKm} km)`, amount: p.baseFare });
    if (p.distanceCharge > 0) lines.push({ label: `Distance charge (${p.extraKm} km @ Rs. ${p.ratePerKm}/km)`, amount: p.distanceCharge });
    if (p.helperCharge > 0) lines.push({ label: 'Loading helper assistance', amount: p.helperCharge });
    if (p.stopCharge > 0) lines.push({ label: 'Additional stop', amount: p.stopCharge });
    if (p.discount > 0) lines.push({ label: `Discount${order.promo_code ? ` (${order.promo_code})` : ''}`, amount: -p.discount });
  } else if (p.kind === 'packers') {
    lines.push({ label: `Packing & moving - ${p.planLabel} (GST-inclusive package, tax shown separately)`, amount: p.taxable });
  } else {
    lines.push({ label: `Parcel service (${p.mode === 'air' ? 'Air' : 'Surface'}) - base`, amount: p.baseFare });
    lines.push({ label: `Weight charge (${p.weightKg} kg)`, amount: p.weightCharge });
  }
  return lines;
}

export function buildInvoiceData(order, config) {
  const p = order.pricing;
  const placeState = cityById(order.city_id)?.state || config.SUPPLIER_STATE;
  const intra = placeState.trim().toLowerCase() === config.SUPPLIER_STATE.trim().toLowerCase();
  const cgst = intra ? Math.floor(p.gst / 2) : 0;
  const sgst = intra ? p.gst - cgst : 0;
  return {
    supplier: { name: config.SUPPLIER_NAME, address: config.SUPPLIER_ADDRESS, state: config.SUPPLIER_STATE, gstin: config.SUPPLIER_GSTIN || null, sac: config.SUPPLIER_SAC },
    customer: { name: order.sender_name, phone: order.sender_phone },
    placeOfSupply: placeState,
    orderId: order.id,
    route: { pickup: order.pickup_address, drop: order.drop_address },
    lines: buildLines(order),
    taxable: p.taxable,
    gstRate: p.gstRate,
    cgst, sgst, igst: intra ? 0 : p.gst,
    total: p.total,
    paymentMethod: order.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online',
    deliveredAt: order.delivered_at
  };
}

export function createInvoices({ db, config, clock }) {
  async function issue(q, order) {
    const have = (await q.query('SELECT number FROM invoices WHERE order_id = $1', [order.id])).rows[0];
    if (have) return have.number;
    const fy = financialYear(order.delivered_at || clock.now());
    // Atomic counter inside the delivery transaction: no gaps and no duplicates, even under concurrency.
    const seq = (await q.query(
      `INSERT INTO invoice_counters (fy, last_seq) VALUES ($1, 1)
       ON CONFLICT (fy) DO UPDATE SET last_seq = invoice_counters.last_seq + 1 RETURNING last_seq`, [fy])).rows[0].last_seq;
    const number = `PTX/${fy}/${String(seq).padStart(6, '0')}`;
    await q.query('INSERT INTO invoices (order_id, number, issued_at, data) VALUES ($1,$2,$3,$4)', [order.id, number, clock.now(), JSON.stringify(buildInvoiceData(order, config))]);
    return number;
  }

  async function getForOrder(orderId) {
    const r = (await db.query('SELECT number, issued_at, data FROM invoices WHERE order_id = $1', [orderId])).rows[0];
    if (!r) throw notFound('Invoice is available after delivery.');
    return r;
  }

  function renderPdf(inv) {
    const d = inv.data;
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise((res) => doc.on('end', () => res(Buffer.concat(chunks))));

    doc.fontSize(18).font('Helvetica-Bold').text(d.supplier.name);
    doc.fontSize(9).font('Helvetica').fillColor('#444').text(d.supplier.address);
    if (d.supplier.gstin) doc.text(`GSTIN: ${d.supplier.gstin}`);
    doc.moveDown(0.8).fillColor('#000').fontSize(14).font('Helvetica-Bold').text(d.supplier.gstin ? 'TAX INVOICE' : 'INVOICE');
    doc.fontSize(9).font('Helvetica')
      .text(`Invoice no: ${inv.number}`).text(`Date: ${new Date(inv.issued_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
      .text(`Order: ${d.orderId}`).text(`Place of supply: ${d.placeOfSupply}`).text(`SAC: ${d.supplier.sac}`);
    doc.moveDown().font('Helvetica-Bold').text('Billed to').font('Helvetica').text(`${d.customer.name} (${d.customer.phone})`);
    doc.moveDown(0.5).text(`From: ${d.route.pickup}`).text(`To: ${d.route.drop}`);

    doc.moveDown();
    const y0 = doc.y;
    doc.font('Helvetica-Bold').text('Description', 48, y0).text('Amount', 440, y0, { width: 100, align: 'right' });
    doc.moveTo(48, y0 + 14).lineTo(547, y0 + 14).stroke('#999');
    doc.font('Helvetica');
    let y = y0 + 20;
    for (const l of d.lines) {
      doc.text(l.label, 48, y, { width: 380 }).text(l.amount < 0 ? `-${rupees(-l.amount)}` : rupees(l.amount), 440, y, { width: 100, align: 'right' });
      y = doc.y + 4;
    }
    doc.moveTo(48, y).lineTo(547, y).stroke('#999');
    y += 8;
    const row = (label, v, bold) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label, 300, y, { width: 130 }).text(rupees(v), 440, y, { width: 100, align: 'right' });
      y += 15;
    };
    row('Taxable value', d.taxable);
    const pct = (d.gstRate * 100) / 2;
    if (d.cgst || d.sgst) { row(`CGST @ ${pct}%`, d.cgst); row(`SGST @ ${pct}%`, d.sgst); }
    else row(`IGST @ ${d.gstRate * 100}%`, d.igst);
    row('Total', d.total, true);
    doc.font('Helvetica').fontSize(9).text(`Payment: ${d.paymentMethod}`, 48, y + 10);
    doc.fontSize(8).fillColor('#666').text('This is a computer-generated invoice and does not require a signature.', 48, 760, { width: 500, align: 'center' });
    doc.end();
    return done;
  }

  return { issue, getForOrder, renderPdf };
}
