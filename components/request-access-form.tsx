"use client";

import { useState } from "react";

export function RequestAccessForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/access-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        company: form.get("company"),
        note: form.get("note"),
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "The request could not be saved.");
      return;
    }
    setError("");
    setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-8 text-base text-muted">
        Request saved. John will send an invite link if he approves it.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <p className="text-sm font-semibold text-ink">Request access</p>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Name
        <input name="name" required className="h-12 rounded-xl border border-line px-3.5 text-base font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        <span>
          Company <span className="font-medium text-muted">Optional</span>
        </span>
        <input name="company" className="h-12 rounded-xl border border-line px-3.5 text-base font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        <span>
          Note <span className="font-medium text-muted">Optional</span>
        </span>
        <input name="note" className="h-12 rounded-xl border border-line px-3.5 text-base font-normal" />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <button type="submit" className="h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2">
        Request access
      </button>
    </form>
  );
}
