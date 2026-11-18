import { NextResponse } from "next/server";
import { decideRequest, getPendingRequest } from "@/lib/access";
import { adminSession } from "@/lib/guard";
import { issueInvite } from "@/lib/invites";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await adminSession())) {
    return NextResponse.json({ error: "Admin only." }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { decision?: string } | null;
  if (body?.decision === "denied") {
    const denied = await decideRequest(id, "denied");
    if (!denied) return NextResponse.json({ error: "That request is already closed." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  if (body?.decision !== "approved") {
    return NextResponse.json({ error: "Choose approve or deny." }, { status: 400 });
  }
  const pending = await getPendingRequest(id);
  if (!pending) {
    return NextResponse.json({ error: "That request is already closed." }, { status: 409 });
  }
  const approved = await decideRequest(id, "approved");
  if (!approved) {
    return NextResponse.json({ error: "That request is already closed." }, { status: 409 });
  }
  const issued = await issueInvite({
    name: pending.name,
    company: pending.company ?? undefined,
    note: pending.note ?? undefined,
  });
  return NextResponse.json(issued);
}
