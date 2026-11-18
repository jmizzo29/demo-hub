import { NextResponse } from "next/server";
import { adminSession } from "@/lib/guard";
import { revokeInvite } from "@/lib/invites";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await adminSession())) {
    return NextResponse.json({ error: "Admin only." }, { status: 401 });
  }
  const { id } = await context.params;
  const revoked = await revokeInvite(id);
  if (!revoked) {
    return NextResponse.json({ error: "That invite is not active." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
