"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          await fetch("/api/invite-session", { method: "DELETE" });
          await authClient.signOut();
          // A full load so the next page does not reuse a session.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cookies are cleared first
          window.location.assign("/");
        })();
      }}
      className="h-10 shrink-0 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-tint"
    >
      Sign out
    </button>
  );
}
