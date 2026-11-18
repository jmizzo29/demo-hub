import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const pool = new Pool({ connectionString });

let ready: Promise<void> | null = null;

export function ensureAccessTable() {
  ready ??= pool
    .query(`
      CREATE TABLE IF NOT EXISTS access_request (
        id text PRIMARY KEY,
        name text NOT NULL,
        email text,
        company text,
        note text,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        decided_at timestamptz
      );
      ALTER TABLE access_request ALTER COLUMN email DROP NOT NULL;
      ALTER TABLE access_request ADD COLUMN IF NOT EXISTS company text;
      CREATE TABLE IF NOT EXISTS invite (
        id text PRIMARY KEY,
        name text NOT NULL,
        company text,
        note text,
        token_hash text NOT NULL UNIQUE,
        status text NOT NULL DEFAULT 'active',
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_used_at timestamptz,
        use_count integer NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS invite_session (
        id text PRIMARY KEY,
        invite_id text NOT NULL REFERENCES invite(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `)
    .then(() => undefined);
  return ready;
}
