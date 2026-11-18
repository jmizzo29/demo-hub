"use client";

import { clearPreviewSignIn } from "@/lib/preview";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        clearPreviewSignIn();
        // Full navigation so the preview cookie is gone before the next document.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cookie must be cleared before the document request
        window.location.assign("/");
      }}
      className="h-10 shrink-0 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-tint"
    >
      Sign out
    </button>
  );
}
