import type { Metadata } from "next";
import { isAdminEmail } from "@/lib/access";
import { HubHome } from "@/components/hub-home";
import { requireSignedIn } from "@/lib/guard";

export const instant = false;

export const metadata: Metadata = {
  title: "Demo hub",
  description:
    "John David Mitchell's demo hub. Nine live demos, marked coming soon in this preview.",
};

export default async function HubPage() {
  const session = await requireSignedIn();
  return <HubHome isAdmin={isAdminEmail(session.user.email)} />;
}
