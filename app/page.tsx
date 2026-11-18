import type { Metadata } from "next";
import { LockedPage } from "@/components/locked-page";
import { adminSession, inviteSession } from "@/lib/guard";

export const instant = false;

export const metadata: Metadata = {
  title: "Private demo hub",
  description: "This demo hub is private. Ask John for an invite link.",
};

export default async function HomePage() {
  const signedIn = Boolean((await adminSession()) || (await inviteSession()));
  return <LockedPage signedIn={signedIn} />;
}
