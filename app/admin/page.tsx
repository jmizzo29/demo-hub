import type { Metadata } from "next";
import { listPendingRequests } from "@/lib/access";
import { InviteDesk } from "@/components/invite-desk";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/guard";
import { listInvites } from "@/lib/invites";

export const instant = false;

export const metadata: Metadata = {
  title: "Invites",
  description: "Create and revoke personal invite links for the demo hub.",
};

export default async function AdminPage() {
  await requireAdmin();
  const [invites, requests] = await Promise.all([listInvites(), listPendingRequests()]);

  return (
    <div className="min-h-dvh bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <p className="text-sm font-semibold tracking-tight text-ink">Invites</p>
              <SampleLabel />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/hub"
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-soft hover:text-ink"
            >
              Hub
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <InviteDesk invites={invites} requests={requests} />
      </main>
    </div>
  );
}
