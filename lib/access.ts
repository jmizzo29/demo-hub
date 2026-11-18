import { randomUUID } from "node:crypto";
import { ensureAccessTable, pool } from "@/lib/db";

export function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email: string) {
  const admin = adminEmail();
  return admin.length > 0 && email.trim().toLowerCase() === admin;
}

export async function isApproved(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (isAdminEmail(normalized)) return true;
  await ensureAccessTable();
  const found = await pool.query<{ status: string }>(
    `SELECT status
     FROM access_request
     WHERE lower(email) = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalized],
  );
  return found.rows[0]?.status === "approved";
}

export async function displayNameFor(email: string) {
  if (isAdminEmail(email)) return "Admin";
  await ensureAccessTable();
  const found = await pool.query<{ name: string }>(
    `SELECT name
     FROM access_request
     WHERE lower(email) = $1 AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  return found.rows[0]?.name || "Approved user";
}

export type AccessRequest = {
  id: string;
  name: string;
  email: string;
  note: string | null;
  createdAt: string;
};

export async function createAccessRequest(input: {
  name: string;
  email: string;
  note: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  await ensureAccessTable();
  if (isAdminEmail(email) || (await isApproved(email))) {
    return { ok: false as const, error: "This email already has access. Sign in." };
  }
  const waiting = await pool.query(
    `SELECT 1
     FROM access_request
     WHERE lower(email) = $1 AND status = 'pending'
     LIMIT 1`,
    [email],
  );
  if (waiting.rowCount) {
    return { ok: false as const, error: "A request for this email is already waiting." };
  }
  await pool.query(
    `INSERT INTO access_request (id, name, email, note)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), name, email, input.note.trim() || null],
  );
  return { ok: true as const };
}

export async function listPendingRequests() {
  await ensureAccessTable();
  const found = await pool.query<{
    id: string;
    name: string;
    email: string;
    note: string | null;
    created_at: Date;
  }>(
    `SELECT id, name, email, note, created_at
     FROM access_request
     WHERE status = 'pending'
     ORDER BY created_at ASC`,
  );
  return found.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function decideRequest(id: string, status: "approved" | "denied") {
  await ensureAccessTable();
  const updated = await pool.query(
    `UPDATE access_request
     SET status = $2, decided_at = now()
     WHERE id = $1 AND status = 'pending'`,
    [id, status],
  );
  return (updated.rowCount ?? 0) > 0;
}
