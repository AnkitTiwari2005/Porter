import pg from 'pg';

// Return ints and floats as JS numbers (the schema avoids NUMERIC/BIGINT on purpose).
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
pg.types.setTypeParser(1700, (v) => parseFloat(v));

// pg reports rowCount for every command; PGlite reports affectedRows = 0 for SELECT, so fall back to rows.length.
const shape = (r) => ({ rows: r.rows, rowCount: r.rowCount ?? (r.affectedRows || r.rows.length) });

export async function createDb(url) {
  if (url.startsWith('pglite://')) {
    // In-process Postgres: used for local development and automated tests only.
    const { PGlite } = await import('@electric-sql/pglite');
    const dir = url.slice('pglite://'.length);
    const client = new PGlite(!dir || dir === 'memory' ? undefined : dir);
    await client.waitReady;
    return {
      kind: 'pglite',
      query: async (text, params = []) => shape(await client.query(text, params)),
      exec: (sql) => client.exec(sql),
      listen: async (channel, handler) => client.listen(channel, handler),
      tx: (fn) => client.transaction(async (t) => fn({ query: async (text, params = []) => shape(await t.query(text, params)) })),
      close: () => client.close()
    };
  }

  const pool = new pg.Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  pool.on('error', (e) => console.error('pg pool error', e.message));
  return {
    kind: 'pg',
    query: async (text, params = []) => shape(await pool.query(text, params)),
    exec: (sql) => pool.query(sql),
    tx: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn({ query: async (text, params = []) => shape(await client.query(text, params)) });
        await client.query('COMMIT');
        return out;
      } catch (e) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw e;
      } finally {
        client.release();
      }
    },
    // Dedicated connection (LISTEN cannot use the pool); reconnects itself if the connection drops.
    listen: async (channel, handler) => {
      let client;
      let stopped = false;
      const connect = async () => {
        client = new pg.Client({ connectionString: url });
        client.on('error', () => {});
        client.on('notification', (m) => handler(m.payload));
        client.on('end', () => { if (!stopped) setTimeout(() => connect().catch(() => {}), 2000).unref?.(); });
        await client.connect();
        await client.query(`LISTEN ${channel}`);
      };
      await connect().catch(() => { if (!stopped) setTimeout(() => connect().catch(() => {}), 2000).unref?.(); });
      return () => { stopped = true; client?.end().catch(() => {}); };
    },
    close: () => pool.end()
  };
}
