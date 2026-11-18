import { NextResponse, type NextRequest } from "next/server";
import { adminSessionFromRequest, inviteCookieFromRequest } from "@/lib/session-request";

const PUBLIC_PATHS = new Set([
  "/",
  "/admin/sign-in",
  "/api/sign-in",
  "/api/access-request",
  "/api/gate",
  "/api/invite-session",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/_next") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const admin = await adminSessionFromRequest(request);
  const invite = admin ? false : await inviteCookieFromRequest(request);

  if (pathname.startsWith("/api/admin")) {
    if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!admin && !invite) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|ico)$).*)"],
};
