// In-process pub/sub for Server-Sent Events. Single-instance by design:
// to run several API instances, replace publish/subscribe with Redis pub/sub or Postgres LISTEN/NOTIFY.
export function createHub() {
  const subs = new Map(); // channel -> Set<fn>
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
      for (const fn of subs.get(channel) || []) {
        try { fn(event); } catch { /* a dead socket must not break others */ }
      }
    },
    size: () => [...subs.values()].reduce((n, s) => n + s.size, 0)
  };
}
