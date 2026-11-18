"use client";

import { useState } from "react";
import { fieldMap } from "@/lib/api-webhook-fields";

type Mode = "success" | "bad-signature" | "duplicate" | "system-b-down";
type BoxState = "idle" | "active" | "done" | "failed" | "retry";

type Step = {
  title: string;
  status: number;
  detail: string;
  payload?: unknown;
};

type WebhookBody = {
  message: string;
  skipped?: boolean;
  mapped?: unknown;
  attempts?: { attempt: number; status: number; waitedMs: number }[];
  systemB?: unknown;
};

const flow = ["Harbor Billing", "Webhook", "Integration service", "Lumen CRM"] as const;

const boxClass: Record<BoxState, string> = {
  idle: "border border-line bg-white text-muted",
  active: "border border-accent bg-accent text-white",
  done: "border border-ink bg-ink text-white",
  failed: "border border-red-700 bg-red-700 text-white",
  retry: "border border-amber-700 bg-amber-700 text-white",
};

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1);
}

function downCountPhrase(count: number) {
  if (count === 1) return "once";
  if (count === 2) return "twice";
  return `${count} times`;
}

export function ApiWebhookDemo() {
  const [running, setRunning] = useState(false);
  const [path, setPath] = useState<BoxState[]>(["idle", "idle", "idle", "idle"]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [banner, setBanner] = useState("");
  const [bannerTone, setBannerTone] = useState<"ok" | "bad">("ok");
  const [error, setError] = useState("");

  async function paint(next: BoxState[]) {
    setPath(next);
    await pause(280);
  }

  async function run(chosen: Mode) {
    setRunning(true);
    setError("");
    setBanner("");
    setSteps([]);
    const started = performance.now();
    try {
      await paint(["active", "idle", "idle", "idle"]);
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
      await paint(["done", "active", "idle", "idle"]);

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
      const elapsed = performance.now() - started;
      next.push(...describeWebhook(first.status, firstBody, chosen === "bad-signature"));

      if (chosen === "bad-signature" || first.status === 401) {
        await paint(["done", "done", "failed", "idle"]);
        setBannerTone("bad");
        setBanner(`Rejected: signature did not match (${first.status}). Nothing was written.`);
        setSteps([...next]);
        return;
      }

      await paint(["done", "done", "active", "idle"]);
      await paint(["done", "done", "done", "idle"]);
      const attempts = firstBody.attempts ?? [];
      for (const attempt of attempts) {
        if (attempt.status === 200) {
          await paint(["done", "done", "done", "done"]);
        } else {
          await paint(["done", "done", "done", "retry"]);
        }
      }
      if (attempts.length === 0) await paint(["done", "done", "done", "done"]);

      if (chosen === "duplicate") {
        const second = await send();
        const secondBody = (await second.json()) as WebhookBody;
        next.push({
          title: "Same event sent again",
          status: second.status,
          detail: secondBody.message,
          payload: { skipped: secondBody.skipped, idempotencyKey: created.event.eventId },
        });
        setBannerTone("ok");
        setBanner("Duplicate skipped. CRM unchanged.");
        setSteps([...next]);
        return;
      }

      if (chosen === "system-b-down") {
        const fails = attempts.filter((attempt) => attempt.status !== 200).length;
        setBannerTone("ok");
        setBanner(
          `CRM was down ${downCountPhrase(fails)}, retried, then synced in ${formatSeconds(elapsed)} seconds.`,
        );
        setSteps([...next]);
        return;
      }

      setBannerTone("ok");
      setBanner(
        `Payment synced in ${formatSeconds(elapsed)} seconds. Signature checked. No duplicates.`,
      );
      setSteps([...next]);
    } catch (caught) {
      setBannerTone("bad");
      setError(caught instanceof Error ? caught.message : "The demo run failed.");
      setPath(["idle", "idle", "idle", "idle"]);
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
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void run("success")}
            disabled={running}
            className="h-14 rounded-xl bg-accent px-6 text-base font-bold text-white hover:bg-[#0956b8] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            {running ? "Running…" : "Run the demo"}
          </button>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void run("bad-signature")}
              disabled={running}
              className="h-12 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:text-muted"
            >
              Bad signature
            </button>
            <button
              type="button"
              onClick={() => void run("duplicate")}
              disabled={running}
              className="h-12 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:text-muted"
            >
              Duplicate event
            </button>
            <button
              type="button"
              onClick={() => void run("system-b-down")}
              disabled={running}
              className="h-12 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:text-muted"
            >
              CRM down
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">The path</h2>
        <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {flow.map((name, index) => (
            <li key={name} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <span
                className={`flex min-h-12 flex-1 items-center justify-center rounded-xl px-3 py-3 text-center text-sm font-semibold transition-colors ${boxClass[path[index]]}`}
              >
                <span>
                  {name}
                  {path[index] === "retry" ? (
                    <span className="mt-1 block text-[11px] font-bold tracking-wide uppercase">
                      Retrying
                    </span>
                  ) : null}
                </span>
              </span>
              {index < flow.length - 1 ? (
                <span className="text-center text-lg font-bold text-accent sm:px-1" aria-hidden="true">
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {banner ? (
        <p
          role="status"
          className={
            bannerTone === "ok"
              ? "rounded-2xl bg-[#e3f6ec] px-4 py-3 text-sm font-semibold leading-relaxed text-[#075c31]"
              : "rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-800"
          }
        >
          {banner}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {steps.length > 0 ? (
        <details className="rounded-2xl border border-line bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            Show the JSON
          </summary>
          <ol className="mt-4 space-y-3">
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
        </details>
      ) : null}

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
        <h2 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">Field mapping</h2>
        <ul className="mt-3 space-y-2 sm:hidden">
          {fieldMap.map(([from, to]) => (
            <li key={from} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Harbor Billing</p>
              <p className="mt-1 text-sm font-semibold text-ink break-words">{from}</p>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Lumen CRM</p>
              <p className="mt-1 text-sm font-semibold text-ink break-words">{to}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 hidden overflow-hidden rounded-2xl border border-line bg-white sm:block">
          <table className="w-full text-left text-sm">
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
