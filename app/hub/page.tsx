import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HubHome } from "@/components/hub-home";
import { Locked } from "@/components/locked";
import { PREVIEW_COOKIE } from "@/lib/preview";

export const instant = false;

export const metadata: Metadata = {
  title: "Demo hub",
  description:
    "John David Mitchell's demo hub. Nine live demos, marked coming soon in this preview.",
};

export default async function HubPage() {
  const jar = await cookies();
  const open = jar.get(PREVIEW_COOKIE)?.value === "1";
  return open ? <HubHome /> : <Locked />;
}
