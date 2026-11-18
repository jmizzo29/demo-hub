import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/access";
import { auth } from "@/lib/auth";
import { INVITE_COOKIE } from "@/lib/invite-cookie";
import { inviteCookieIsValid } from "@/lib/invites";

export async function adminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.twoFactorEnabled || !isAdminEmail(session.user.email)) return null;
  return session;
}

export async function inviteSession() {
  const jar = await cookies();
  return inviteCookieIsValid(jar.get(INVITE_COOKIE)?.value);
}

export async function requireHubAccess() {
  if (await adminSession()) return { kind: "admin" as const };
  if (await inviteSession()) return { kind: "invite" as const };
  redirect("/");
}

export async function requireAdmin() {
  const session = await adminSession();
  if (!session) redirect("/admin/sign-in");
  return session;
}
