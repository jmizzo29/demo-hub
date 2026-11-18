import { NextResponse } from "next/server";
import { INVITE_COOKIE } from "@/lib/invite-cookie";

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge: 0,
  });
  return response;
}
