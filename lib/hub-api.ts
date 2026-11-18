import { NextResponse } from "next/server";
import { adminSession, inviteSession } from "@/lib/guard";

export async function denyUnlessHubAccess() {
  if ((await adminSession()) || (await inviteSession())) return null;
  return NextResponse.json({ error: "This demo hub is private." }, { status: 401 });
}
