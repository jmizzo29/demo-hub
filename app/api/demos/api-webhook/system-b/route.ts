import { NextResponse } from "next/server";
import { saveCrmRecord, type CrmUpdate } from "@/lib/api-webhook-demo";
import { denyUnlessHubAccess } from "@/lib/hub-api";

export async function POST(request: Request) {
  const denied = await denyUnlessHubAccess();
  if (denied) return denied;
  if (request.headers.get("x-demo-fail") === "1") {
    return NextResponse.json({ error: "Lumen CRM is unavailable." }, { status: 503 });
  }
  const update = (await request.json()) as CrmUpdate;
  const record = saveCrmRecord(update);
  return NextResponse.json({ updated: true, record }, { status: 200 });
}
