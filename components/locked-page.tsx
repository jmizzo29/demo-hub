import { Mark } from "@/components/mark";
import { RequestAccessForm } from "@/components/request-access-form";
import { SampleLabel } from "@/components/sample-label";

export function LockedPage({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white lg:grid lg:grid-cols-2">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink px-5 py-3 text-white lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Mark tone="ghost" />
            <p className="text-sm font-semibold">John David Mitchell</p>
          </div>
          <SampleLabel tone="light" />
        </div>
      </header>
      <aside className="hidden bg-ink bg-linear-to-b from-ink to-ink-2 px-5 text-white sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:px-14">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center justify-between gap-4">
            <Mark tone="ghost" />
            <SampleLabel tone="light" />
          </div>
          <p className="mt-10 text-xs font-bold tracking-[0.16em] text-mist uppercase">
            Private demo hub
          </p>
          <p className="mt-4 text-sm font-semibold">John David Mitchell</p>
          <p className="mt-1 text-sm text-mist">Solutions Architect &amp; Integration Leader</p>
          <p className="mt-6 max-w-[12ch] text-5xl font-extrabold tracking-tight">
            A resume you can demo.
          </p>
        </div>
      </aside>
      <main className="flex flex-1 items-center bg-white px-5 py-10 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            This demo hub is private.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Ask John for an invite link.
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink">
            Have an invite? Scan your QR code or open your invite link again.
          </p>
          <a
            href="https://johndavidmitchell.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-12 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-2"
          >
            Public portfolio
          </a>
          {signedIn ? (
            <a href="/hub" className="mt-4 block text-sm font-semibold text-accent hover:underline">
              Open the hub
            </a>
          ) : null}
          <RequestAccessForm />
          <p className="mt-8 text-sm text-muted">
            <a href="/admin/sign-in" className="hover:text-ink hover:underline">
              John? Admin sign in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
