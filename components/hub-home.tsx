import { demos } from "@/lib/demos";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { SignOutButton } from "@/components/sign-out-button";

export function HubHome() {
  return (
    <div className="min-h-dvh bg-soft">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Mark />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-ink">
                  Demo hub
                </p>
                <div className="hidden sm:block">
                  <SampleLabel />
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <a
                href="https://johndavidmitchell.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center rounded-lg px-2 text-sm font-semibold text-muted hover:bg-soft hover:text-ink sm:px-3"
              >
                Portfolio
              </a>
              <SignOutButton />
            </div>
          </div>
          <div className="mt-2 sm:hidden">
            <SampleLabel />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            John David Mitchell
          </h1>
          <p className="mt-2 text-lg font-semibold text-accent">
            Solutions Architect &amp; Integration Leader
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            Live demos of integrations, data, cloud, identity, AI, ML, and
            agents.
          </p>
        </header>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo, index) => (
            <li key={demo.title}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-[#c5d0e0]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold tracking-[0.14em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted">
                    Coming soon
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight text-ink text-pretty">
                  {demo.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink text-pretty">
                  {demo.problem}
                </p>
                <div className="mt-auto pt-4">
                  <p className="border-t border-line pt-3 text-sm leading-relaxed text-muted text-pretty">
                    <span className="font-semibold text-ink">Proves</span>
                    <span className="px-1.5 text-line" aria-hidden="true">
                      ·
                    </span>
                    {demo.proves}
                  </p>
                  <p className="mt-4">
                    <span className="inline-flex rounded-full bg-tint px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent">
                      {demo.tag}
                    </span>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
