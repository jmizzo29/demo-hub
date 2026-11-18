import { NextResponse } from "next/server";
import { createAccessRequest } from "@/lib/access";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    company?: string;
    note?: string;
  } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const company = body?.company ?? "";
  const note = body?.note ?? "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter an email address." }, { status: 400 });
  }
  const result = await createAccessRequest({ name, email, company, note });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
