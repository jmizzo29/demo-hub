import type { Metadata } from "next";
import { decide } from "@/app/admin/actions";
import { listPendingRequests } from "@/lib/access";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/guard";

export const instant = false;

export const metadata: Metadata = {
  title: "Access requests",
  description: "Approve or deny requests to enter the demo hub.",
};

export default async function AdminPage() {
  await requireAdmin();
  const requests = await listPendingRequests();

  return (
    <div className="min-h-dvh bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <p className="text-sm font-semibold tracking-tight text-ink">Access requests</p>
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
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Pending requests</h1>
        <p className="mt-2 text-base text-muted">
          Approve someone before they can sign in. A denial keeps them out.
        </p>
        {requests.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-line bg-white px-5 py-6 text-sm text-muted">
            No requests waiting.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <p className="text-lg font-bold tracking-tight text-ink">{request.name}</p>
                <p className="mt-1 text-sm text-muted">{request.email}</p>
                {request.note ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink">{request.note}</p>
                ) : null}
                <form action={decide} className="mt-4 flex gap-2">
                  <input type="hidden" name="id" value={request.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2"
                  >
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="denied"
                    className="h-10 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-soft"
                  >
                    Deny
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
