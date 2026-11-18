"use client";

import { useState } from "react";
import { fieldMap } from "@/lib/api-webhook-fields";

type Mode = "success" | "bad-signature" | "duplicate" | "system-b-down";

type Step = {
  title: string;
  status: number;
  detail: string;
  payload?: unknown;
};

const breaks: { id: Exclude<Mode, "success">; label: string }[] = [
  { id: "bad-signature", label: "Bad signature" },
  { id: "duplicate", label: "Duplicate event" },
  { id: "system-b-down", label: "System B down" },
];

const flow = ["Harbor Billing", "Webhook", "Integration service", "Lumen CRM"];

export function ApiWebhookDemo() {
  const [breakIt, setBreakIt] = useState(false);
  const [mode, setMode] = useState<Exclude<Mode, "success">>("bad-signature");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState("");

  async function run() {
    setRunning(true);
    setError("");
    setSteps([]);
    const chosen: Mode = breakIt ? mode : "success";
    try {
      const createdResponse = await fetch("/api/demos/api-webhook/system-a", { method: "POST" });
      const created = (await createdResponse.json()) as {
        event: { eventId: string };
        raw: string;
        signature: string;
        error?: string;
      };
      if (!createdResponse.ok) throw new Error(created.error || "System A did not create the event.");
      const next: Step[] = [
        {
          title: "System A created a sample payment",
          status: createdResponse.status,
          detail: "Harbor Billing recorded that Cedar & Co paid invoice INV-1042.",
          payload: created.event,
        },
      ];
      setSteps([...next]);

      const signature = chosen === "bad-signature" ? "sha256=not-the-real-signature" : created.signature;
      const send = () =>
        fetch("/api/demos/api-webhook/webhook", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-signature": signature,
            "idempotency-key": created.event.eventId,
            "x-demo-fail-first": chosen === "system-b-down" ? "2" : "0",
          },
          body: created.raw,
        });

      const first = await send();
      const firstBody = (await first.json()) as WebhookBody;
      next.push(...describeWebhook(first.status, firstBody, chosen === "bad-signature"));
      setSteps([...next]);

      if (chosen === "duplicate" && first.ok) {
        const second = await send();
        const secondBody = (await second.json()) as WebhookBody;
        next.push({
          title: "Same event sent again",
          status: second.status,
          detail: secondBody.message,
          payload: { skipped: secondBody.skipped, idempotencyKey: created.event.eventId },
        });
        setSteps([...next]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The demo run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">
          What problem this solves
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink text-pretty">
          Harbor Billing and Lumen CRM have to stay in sync. When Cedar &amp; Co pays an
          invoice in Harbor Billing, Lumen CRM should show that payment without anyone
          retyping it. The names and the invoice are sample data.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">What it proves</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            "A webhook is checked before it is trusted.",
            "Billing fields are mapped onto the CRM.",
            "A repeated event is skipped.",
            "A down CRM is retried, then updated.",
          ].map((item) => (
            <li key={item} className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">The path</h2>
        <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          {flow.map((name, index) => (
            <li key={name} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <span className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white sm:min-w-36">
                {name}
              </span>
              {index < flow.length - 1 ? (
                <span className="text-center text-lg font-bold text-accent" aria-hidden="true">
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">Run the sample</h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={breakIt}
              onChange={(event) => setBreakIt(event.target.checked)}
              className="h-4 w-4 accent-[#0f1b2d]"
            />
            Break it
          </label>
        </div>
        {breakIt ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm text-muted">Choose one failure</legend>
            {breaks.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="break-mode"
                  checked={mode === item.id}
                  onChange={() => setMode(item.id)}
                  className="accent-[#0f1b2d]"
                />
                {item.label}
              </label>
            ))}
          </fieldset>
        ) : null}
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="mt-4 h-12 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {running ? "Running…" : "Run it"}
        </button>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {steps.length > 0 ? (
          <ol className="mt-5 space-y-3">
            {steps.map((step) => (
              <li key={step.title} className="rounded-xl border border-line bg-soft p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {step.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.detail}</p>
                {step.payload ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-ink p-3 text-xs leading-relaxed text-[#d5deea]">
                    {JSON.stringify(step.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">Field mapping</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Harbor Billing</th>
                <th className="px-4 py-3 font-semibold">Lumen CRM</th>
              </tr>
            </thead>
            <tbody>
              {fieldMap.map(([from, to]) => (
                <tr key={from} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{from}</td>
                  <td className="px-4 py-3 text-ink">{to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">How it was built</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Built with AI, reviewed and tested by John. This first version runs in the
          Next.js app as TypeScript API routes. A .NET version of the integration
          service is planned next.
        </p>
      </section>
    </div>
  );
}

type WebhookBody = {
  message: string;
  skipped?: boolean;
  mapped?: unknown;
  attempts?: { attempt: number; status: number; waitedMs: number }[];
  systemB?: unknown;
};

function describeWebhook(status: number, body: WebhookBody, badSignature: boolean): Step[] {
  if (badSignature || status === 401) {
    return [
      {
        title: "Integration service rejected the webhook",
        status,
        detail: body.message,
      },
    ];
  }
  const steps: Step[] = [
    {
      title: "Integration service checked the signature",
      status,
      detail: "The HMAC-SHA256 signature matched.",
    },
    {
      title: "Fields mapped for Lumen CRM",
      status,
      detail: "Harbor Billing names were translated into CRM fields.",
      payload: body.mapped,
    },
  ];
  for (const attempt of body.attempts ?? []) {
    steps.push({
      title: `Lumen CRM attempt ${attempt.attempt}`,
      status: attempt.status,
      detail:
        attempt.status === 200
          ? "The CRM accepted the update."
          : `The CRM was down${attempt.waitedMs ? `. Waited ${attempt.waitedMs} ms, then tried again.` : "."}`,
      payload: attempt.status === 200 ? body.systemB : { error: "Lumen CRM is unavailable." },
    });
  }
  return steps;
}
