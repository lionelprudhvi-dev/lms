import path from 'path';
import fs from 'fs';

// Persist singletons on globalThis so Next.js HMR / dev route reloads reuse the same PGlite/Pool instance
const globalForDb = globalThis;

// Determine DB mode
const databaseUrl = process.env.DATABASE_URL;

async function getPgPool() {
  if (globalForDb.__pgPool) return globalForDb.__pgPool;
  const { Pool } = await import('pg');
  globalForDb.__pgPool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return globalForDb.__pgPool;
}

async function getPGlite() {
  if (globalForDb.__pgliteInstance) return globalForDb.__pgliteInstance;
  if (!globalForDb.__pgliteInitPromise) {
    globalForDb.__pgliteInitPromise = (async () => {
      const { PGlite } = await import('@electric-sql/pglite');
      const dbDir = path.resolve(process.cwd(), '.pglite_data');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const instance = new PGlite(dbDir);
      await instance.waitReady;
      globalForDb.__pgliteInstance = instance;
      return instance;
    })();
  }
  return globalForDb.__pgliteInitPromise;
}

export async function exec(sql) {
  if (databaseUrl && databaseUrl.trim().length > 0) {
    try {
      const pool = await getPgPool();
      await pool.query(sql);
      return true;
    } catch (err) {
      console.warn('DATABASE_URL exec failed, falling back to local PGlite engine:', err.message);
    }
  }

  const pglite = await getPGlite();
  await pglite.exec(sql);
  return true;
}

export async function query(text, params = []) {
  if (databaseUrl && databaseUrl.trim().length > 0) {
    try {
      const pool = await getPgPool();
      const result = await pool.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
      };
    } catch (err) {
      // If connecting to external databaseUrl fails, fall back to pglite for local development resilience
      console.warn('DATABASE_URL query failed, falling back to local PGlite engine:', err.message);
    }
  }

  const pglite = await getPGlite();
  const res = await pglite.query(text, params);
  return {
    rows: res.rows || [],
    rowCount: (res.rows && res.rows.length) || res.affectedRows || 0,
    fields: res.fields || [],
  };
}

export async function transaction(callback) {
  if (databaseUrl && databaseUrl.trim().length > 0) {
    try {
      const pool = await getPgPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const res = await callback({
          query: (sql, params) => client.query(sql, params),
        });
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('External PG transaction failed, using local engine:', err.message);
    }
  }

  const pglite = await getPGlite();
  return await pglite.transaction(async (tx) => {
    return await callback({
      query: async (sql, params) => {
        const res = await tx.query(sql, params);
        return {
          rows: res.rows || [],
          rowCount: (res.rows && res.rows.length) || res.affectedRows || 0,
        };
      },
    });
  });
}

export default {
  query,
  transaction,
};
