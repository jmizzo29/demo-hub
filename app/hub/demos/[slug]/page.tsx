import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { demos } from "@/lib/demos";
import { requireHubAccess } from "@/lib/guard";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const demo = demos.find((item) => item.slug === slug);
  return { title: demo ? `${demo.title} · Coming soon` : "Demo" };
}

export default async function ComingSoonDemo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireHubAccess();
  const { slug } = await params;
  const index = demos.findIndex((item) => item.slug === slug);
  const demo = index >= 0 ? demos[index] : undefined;
  if (!demo || demo.live) notFound();

  return (
    <div className="min-h-dvh bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <p className="text-sm font-semibold tracking-tight text-ink">Demo hub</p>
              <SampleLabel />
            </div>
          </div>
          <Link
            href="/hub"
            className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-soft hover:text-ink"
          >
            Hub
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
          Demo {String(index + 1).padStart(2, "0")} · Coming soon
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{demo.title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{demo.problem}</p>
        <p className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-semibold text-ink">
          This demo is not open yet.
        </p>
        <Link
          href="/hub"
          className="mt-8 inline-flex h-12 items-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink hover:bg-soft"
        >
          Back to hub
        </Link>
      </main>
    </div>
  );
}
