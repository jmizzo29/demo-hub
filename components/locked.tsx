import Link from "next/link";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";

export function Locked() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-soft px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white px-6 py-8 shadow-sm sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Mark />
          <SampleLabel />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink">
          Approved access required
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          This hub is not public. Sign in with an approved account, then
          confirm with an authenticator or a passkey. There is no guest pass.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-2"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
