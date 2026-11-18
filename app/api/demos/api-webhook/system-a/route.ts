import { NextResponse } from "next/server";
import { samplePayment, signBody } from "@/lib/api-webhook-demo";
import { denyUnlessHubAccess } from "@/lib/hub-api";

export async function POST() {
  const denied = await denyUnlessHubAccess();
  if (denied) return denied;
  const event = samplePayment();
  const raw = JSON.stringify(event);
  return NextResponse.json({
    event,
    raw,
    signature: signBody(raw),
  });
}
