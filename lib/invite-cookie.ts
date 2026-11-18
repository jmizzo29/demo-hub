import { createHmac, timingSafeEqual } from "node:crypto";

export const INVITE_COOKIE = "dh_invite";

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters.");
  }
  return value;
}

export function signInviteSession(sessionId: string) {
  const signature = createHmac("sha256", secret()).update(sessionId).digest("base64url");
  return `${sessionId}.${signature}`;
}

export function readInviteSession(cookie: string | undefined) {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot <= 0) return null;
  const sessionId = cookie.slice(0, dot);
  const signature = cookie.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(sessionId).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return sessionId;
}
