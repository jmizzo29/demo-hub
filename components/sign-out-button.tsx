"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              // A full load so the signed-out page does not reuse the hub session.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session cookie is cleared first
              window.location.assign("/");
            },
          },
        });
      }}
      className="h-10 shrink-0 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-tint"
    >
      Sign out
    </button>
  );
}
