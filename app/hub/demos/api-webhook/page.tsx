import type { Metadata } from "next";
import Link from "next/link";
import { ApiWebhookDemo } from "@/components/api-webhook-demo";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { SignOutButton } from "@/components/sign-out-button";
import { requireHubAccess } from "@/lib/guard";

export const instant = false;

export const metadata: Metadata = {
  title: "API and webhook integration",
  description: "A sample signed webhook from Harbor Billing into Lumen CRM.",
};

export default async function ApiWebhookPage() {
  const access = await requireHubAccess();

  return (
    <div className="min-h-dvh bg-soft">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Mark />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-ink">Demo hub</p>
              <SampleLabel />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/hub"
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-soft hover:text-ink"
            >
              Hub
            </Link>
            {access.kind === "admin" ? (
              <Link
                href="/admin"
                className="hidden h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-soft hover:text-ink sm:inline-flex"
              >
                Access
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">Demo 01 · Live</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          API and webhook integration
        </h1>
        <p className="mt-3 text-lg font-semibold text-accent">Harbor Billing to Lumen CRM</p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          A customer pays an invoice in the billing system. A signed webhook reaches
          the integration service, which checks it, maps the fields, and updates the
          CRM through its REST API.
        </p>
        <div className="mt-8">
          <ApiWebhookDemo />
        </div>
      </main>
    </div>
  );
}
