import { NextResponse } from "next/server";
import { adminSession } from "@/lib/guard";
import { issueInvite, listInvites } from "@/lib/invites";

export async function GET() {
  if (!(await adminSession())) {
    return NextResponse.json({ error: "Admin only." }, { status: 401 });
  }
  return NextResponse.json({ invites: await listInvites() });
}

export async function POST(request: Request) {
  if (!(await adminSession())) {
    return NextResponse.json({ error: "Admin only." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    company?: string;
    note?: string;
    days?: number;
  } | null;
  const name = body?.name?.trim() ?? "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Enter a name." }, { status: 400 });
  }
  const days = body?.days == null || Number.isNaN(Number(body.days)) ? 30 : Number(body.days);
  const issued = await issueInvite({
    name,
    company: body?.company,
    note: body?.note,
    days,
  });
  return NextResponse.json(issued);
}
