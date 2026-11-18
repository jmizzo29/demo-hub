import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/access";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/api/sign-in", "/api/access-request", "/api/gate"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.twoFactorEnabled) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = session ? "enroll=1" : "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !isAdminEmail(session.user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|ico)$).*)"],
};
