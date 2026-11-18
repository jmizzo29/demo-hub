import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/access";
import { auth } from "@/lib/auth";

export async function requireSignedIn() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.twoFactorEnabled) redirect("/");
  return session;
}

export async function requireAdmin() {
  const session = await requireSignedIn();
  if (!isAdminEmail(session.user.email)) redirect("/hub");
  return session;
}
