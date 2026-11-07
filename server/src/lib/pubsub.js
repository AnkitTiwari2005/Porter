import crypto from 'node:crypto';

// Event hub for Server-Sent Events. Always delivers to this process; with Postgres it also fans out to every other
// API instance through LISTEN/NOTIFY, so a driver's GPS update reaches a customer connected to a different instance.
export function createHub({ db } = {}) {
  const id = crypto.randomUUID();
  const subs = new Map(); // channel -> Set<fn>
  let stopListening = null;

  const deliver = (channel, event) => {
    for (const fn of subs.get(channel) || []) {
      try { fn(event); } catch { /* a dead socket must not break others */ }
    }
  };

  return {
    subscribe(channel, fn) {
      if (!subs.has(channel)) subs.set(channel, new Set());
      subs.get(channel).add(fn);
      return () => {
        const set = subs.get(channel);
        if (!set) return;
        set.delete(fn);
        if (!set.size) subs.delete(channel);
      };
    },
    publish(channel, event) {
      deliver(channel, event);
      if (db?.kind === 'pg') {
        const payload = JSON.stringify({ i: id, c: channel, e: event });
        if (payload.length < 7500) db.query('SELECT pg_notify($1, $2)', ['ptx_events', payload]).catch(() => {});
      }
    },
    async start() {
      if (db?.kind !== 'pg' || stopListening) return;
      stopListening = await db.listen('ptx_events', (payload) => {
        try { const m = JSON.parse(payload); if (m.i !== id) deliver(m.c, m.e); } catch { /* ignore malformed */ }
      });
    },
    stop() { stopListening?.(); stopListening = null; },
    size: () => [...subs.values()].reduce((n, s) => n + s.size, 0)
  };
}
