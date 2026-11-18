import { NextResponse } from "next/server";
import { INVITE_COOKIE, signInviteSession } from "@/lib/invite-cookie";
import { redeemInvite } from "@/lib/invites";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const redeemed = await redeemInvite(token);
  const home = new URL("/", request.url);
  if (!redeemed) return NextResponse.redirect(home);
  const response = NextResponse.redirect(new URL("/hub", request.url));
  response.cookies.set(INVITE_COOKIE, signInviteSession(redeemed.sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    path: "/",
    expires: redeemed.expiresAt,
  });
  return response;
}
