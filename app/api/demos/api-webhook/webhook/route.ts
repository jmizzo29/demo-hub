import { NextResponse } from "next/server";
import {
  alreadyProcessed,
  mapPayment,
  remember,
  signatureMatches,
  sleep,
  type PaymentEvent,
} from "@/lib/api-webhook-demo";
import { denyUnlessHubAccess } from "@/lib/hub-api";

export async function POST(request: Request) {
  const denied = await denyUnlessHubAccess();
  if (denied) return denied;

  const raw = await request.text();
  const signature = request.headers.get("x-signature") ?? "";
  const eventId = request.headers.get("idempotency-key") ?? "";
  const failFirst = request.headers.get("x-demo-fail-first") ?? "0";
  const verified = signatureMatches(raw, signature);

  if (!verified) {
    return NextResponse.json(
      {
        verified: false,
        status: 401,
        message: "Signature did not match. The update was not written.",
      },
      { status: 401 },
    );
  }

  const prior = alreadyProcessed(eventId);
  if (prior) {
    return NextResponse.json({
      verified: true,
      skipped: true,
      status: 200,
      message: "Duplicate event. The idempotency key was already used, so this one was skipped.",
      mapped: prior,
      attempts: [],
    });
  }

  const event = JSON.parse(raw) as PaymentEvent;
  const mapped = mapPayment(event);
  const failBudget = Number(failFirst) || 0;
  const attempts: { attempt: number; status: number; waitedMs: number }[] = [];
  let systemB: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const waitedMs = attempt === 1 ? 0 : 150 * 2 ** (attempt - 2);
    if (waitedMs) await sleep(waitedMs);
    const response = await fetch(new URL("/api/demos/api-webhook/system-b", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": request.headers.get("cookie") ?? "",
        "x-demo-fail": attempt <= failBudget ? "1" : "0",
      },
      body: JSON.stringify(mapped),
    });
    attempts.push({ attempt, status: response.status, waitedMs });
    if (response.ok) {
      systemB = await response.json();
      break;
    }
  }

  if (!systemB) {
    return NextResponse.json(
      {
        verified: true,
        skipped: false,
        status: 502,
        message: "Lumen CRM stayed down.",
        mapped,
        attempts,
      },
      { status: 502 },
    );
  }

  remember(eventId, mapped);
  return NextResponse.json({
    verified: true,
    skipped: false,
    status: 200,
    message: "Signature checked, fields mapped, and Lumen CRM updated.",
    mapped,
    attempts,
    systemB,
  });
}
