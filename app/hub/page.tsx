import type { Metadata } from "next";
import { HubHome } from "@/components/hub-home";
import { requireHubAccess } from "@/lib/guard";

export const instant = false;

export const metadata: Metadata = {
  title: "Demo hub",
  description:
    "John David Mitchell's demo hub. Nine live demos, marked coming soon in this preview.",
};

export default async function HubPage() {
  const access = await requireHubAccess();
  return <HubHome isAdmin={access.kind === "admin"} />;
}
