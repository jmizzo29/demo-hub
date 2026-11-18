import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, googleSignInEnabled } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const jar = await cookies();
  const pendingMfa = jar.getAll().some((cookie) => cookie.name.includes("two_factor"));
  const state = session?.user.twoFactorEnabled
    ? "ready"
    : session
      ? "enroll"
      : pendingMfa
        ? "mfa"
        : "signed-out";
  return NextResponse.json({
    state,
    email: session?.user.email ?? "",
    google: googleSignInEnabled(),
  });
}
