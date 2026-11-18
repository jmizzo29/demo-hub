import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const pool = new Pool({ connectionString });

let ready: Promise<void> | null = null;

export function ensureAccessTable() {
  ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS access_request (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      note text,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      decided_at timestamptz
    )
  `).then(() => undefined);
  return ready;
}
