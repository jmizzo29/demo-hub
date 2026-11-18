import type { NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/access";
import { auth } from "@/lib/auth";
import { INVITE_COOKIE } from "@/lib/invite-cookie";
import { inviteCookieIsValid } from "@/lib/invites";

export async function adminSessionFromRequest(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return Boolean(session?.user.twoFactorEnabled && isAdminEmail(session.user.email));
}

export async function inviteCookieFromRequest(request: NextRequest) {
  return inviteCookieIsValid(request.cookies.get(INVITE_COOKIE)?.value);
}
