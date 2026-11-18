import { createHash, randomBytes, randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { ensureAccessTable, pool } from "@/lib/db";
import { readInviteSession } from "@/lib/invite-cookie";

export type InviteSummary = {
  id: string;
  name: string;
  company: string | null;
  note: string | null;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  lastUsedAt: string | null;
  useCount: number;
  expiresAt: string;
};

export type IssuedInvite = {
  invite: InviteSummary;
  url: string;
  qrDataUrl: string;
};

function appOrigin() {
  return (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function mapInvite(row: {
  id: string;
  name: string;
  company: string | null;
  note: string | null;
  status: string;
  created_at: Date;
  last_used_at: Date | null;
  use_count: number;
  expires_at: Date;
}): InviteSummary {
  const expired = row.expires_at.getTime() <= Date.now();
  const status =
    row.status === "revoked" ? "revoked" : expired ? "expired" : "active";
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    note: row.note,
    status,
    createdAt: row.created_at.toISOString(),
    lastUsedAt: row.last_used_at?.toISOString() ?? null,
    useCount: row.use_count,
    expiresAt: row.expires_at.toISOString(),
  };
}

export async function issueInvite(input: {
  name: string;
  company?: string;
  note?: string;
  days?: number;
}) {
  const name = input.name.trim();
  const days = Math.min(365, Math.max(1, input.days ?? 30));
  const token = randomBytes(32).toString("base64url");
  const id = randomUUID();
  await ensureAccessTable();
  const created = await pool.query<{
    id: string;
    name: string;
    company: string | null;
    note: string | null;
    status: string;
    created_at: Date;
    last_used_at: Date | null;
    use_count: number;
    expires_at: Date;
  }>(
    `INSERT INTO invite (id, name, company, note, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6::int * interval '1 day'))
     RETURNING id, name, company, note, status, created_at, last_used_at, use_count, expires_at`,
    [
      id,
      name,
      input.company?.trim() || null,
      input.note?.trim() || null,
      hashToken(token),
      days,
    ],
  );
  const url = `${appOrigin()}/invite/${token}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 280, margin: 1 });
  return { invite: mapInvite(created.rows[0]), url, qrDataUrl };
}

export async function listInvites() {
  await ensureAccessTable();
  const found = await pool.query<{
    id: string;
    name: string;
    company: string | null;
    note: string | null;
    status: string;
    created_at: Date;
    last_used_at: Date | null;
    use_count: number;
    expires_at: Date;
  }>(
    `SELECT id, name, company, note, status, created_at, last_used_at, use_count, expires_at
     FROM invite
     ORDER BY created_at DESC`,
  );
  return found.rows.map(mapInvite);
}

export async function revokeInvite(id: string) {
  await ensureAccessTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE invite SET status = 'revoked' WHERE id = $1 AND status = 'active'`,
      [id],
    );
    await client.query(`DELETE FROM invite_session WHERE invite_id = $1`, [id]);
    await client.query("COMMIT");
    return (updated.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function redeemInvite(token: string) {
  if (!token || token.length < 32) return null;
  await ensureAccessTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query<{ id: string; expires_at: Date }>(
      `SELECT id, expires_at
       FROM invite
       WHERE token_hash = $1 AND status = 'active' AND expires_at > now()
       FOR UPDATE`,
      [hashToken(token)],
    );
    const invite = found.rows[0];
    if (!invite) {
      await client.query("ROLLBACK");
      return null;
    }
    const sessionId = randomUUID();
    await client.query(
      `INSERT INTO invite_session (id, invite_id) VALUES ($1, $2)`,
      [sessionId, invite.id],
    );
    await client.query(
      `UPDATE invite
       SET use_count = use_count + 1, last_used_at = now()
       WHERE id = $1`,
      [invite.id],
    );
    await client.query("COMMIT");
    return { sessionId, expiresAt: invite.expires_at };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function inviteCookieIsValid(cookie: string | undefined) {
  const sessionId = readInviteSession(cookie);
  if (!sessionId) return false;
  await ensureAccessTable();
  const found = await pool.query(
    `SELECT 1
     FROM invite_session s
     JOIN invite i ON i.id = s.invite_id
     WHERE s.id = $1 AND i.status = 'active' AND i.expires_at > now()`,
    [sessionId],
  );
  return (found.rowCount ?? 0) > 0;
}
