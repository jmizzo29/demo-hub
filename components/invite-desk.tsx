"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import type { AccessRequest } from "@/lib/access";
import type { InviteSummary, IssuedInvite } from "@/lib/invites";

function when(value: string | null, empty: string) {
  if (!value) return empty;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function InviteDesk({
  invites: initialInvites,
  requests: initialRequests,
}: {
  invites: InviteSummary[];
  requests: AccessRequest[];
}) {
  const [invites, setInvites] = useState(initialInvites);
  const [requests, setRequests] = useState(initialRequests);
  const [issued, setIssued] = useState<IssuedInvite | null>(null);
  const [error, setError] = useState("");

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const days = Number(form.get("days") || 30);
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        company: form.get("company"),
        note: form.get("note"),
        days,
      }),
    });
    const data = (await response.json()) as IssuedInvite & { error?: string };
    if (!response.ok) {
      setError(data.error || "The invite could not be created.");
      return;
    }
    setError("");
    setIssued(data);
    setInvites((current) => [data.invite, ...current.filter((item) => item.id !== data.invite.id)]);
    event.currentTarget.reset();
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("That invite could not be revoked.");
      return;
    }
    setInvites((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "revoked" } : item)),
    );
  }

  async function decide(id: string, decision: "approved" | "denied") {
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = (await response.json()) as IssuedInvite & { error?: string };
    if (!response.ok) {
      setError(data.error || "That request could not be updated.");
      return;
    }
    setRequests((current) => current.filter((item) => item.id !== id));
    if (decision === "approved") {
      setIssued(data);
      setInvites((current) => [data.invite, ...current]);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Invites</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Create a personal link. The link is shown once. Only a hash is stored.
        </p>
        <form onSubmit={createInvite} className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
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
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink sm:col-span-2">
            <span>
              Note <span className="font-medium text-muted">Optional</span>
            </span>
            <input name="note" className="h-12 rounded-xl border border-line px-3.5 text-base font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Expires in days
            <input
              name="days"
              type="number"
              min={1}
              max={365}
              defaultValue={30}
              className="h-12 rounded-xl border border-line px-3.5 text-base font-normal"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="h-12 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-2">
              Create invite
            </button>
          </div>
        </form>
        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {issued ? <IssuedLink issued={issued} /> : null}
      </section>

      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">Invite list</h2>
        {invites.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-white px-5 py-6 text-sm text-muted">
            No invites yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold tracking-tight text-ink">{invite.name}</p>
                    {invite.company ? <p className="mt-1 text-sm text-muted">{invite.company}</p> : null}
                  </div>
                  <span className="rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted">
                    {invite.status}
                  </span>
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-ink">Created</dt>
                    <dd>{when(invite.createdAt, "")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Last used</dt>
                    <dd>{when(invite.lastUsedAt, "Not used yet")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Use count</dt>
                    <dd>{invite.useCount}</dd>
                  </div>
                </dl>
                {invite.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => void revoke(invite.id)}
                    className="mt-4 h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-soft"
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">Access requests</h2>
        <p className="mt-2 text-sm text-muted">Approving creates an invite link you can copy.</p>
        {requests.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-white px-5 py-6 text-sm text-muted">
            No requests waiting.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {requests.map((request) => (
              <li key={request.id} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-lg font-bold tracking-tight text-ink">{request.name}</p>
                {request.company ? <p className="mt-1 text-sm text-muted">{request.company}</p> : null}
                {request.email ? <p className="mt-1 text-sm text-muted">{request.email}</p> : null}
                {request.note ? <p className="mt-3 text-sm text-ink">{request.note}</p> : null}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(request.id, "approved")}
                    className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(request.id, "denied")}
                    className="h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-soft"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function IssuedLink({ issued }: { issued: IssuedInvite }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-ink">Invite link for {issued.invite.name}</p>
      <p className="mt-1 text-sm text-muted">Copy it now. It is not stored, and it will not be shown again.</p>
      <input
        readOnly
        value={issued.url}
        onFocus={(event) => event.currentTarget.select()}
        className="mt-3 h-12 w-full rounded-xl border border-line px-3.5 text-sm text-ink"
      />
      <div className="mt-4 w-fit rounded-xl border border-line bg-white p-3">
        <QRCode value={issued.url} size={180} />
      </div>
      <a
        href={issued.qrDataUrl}
        download={`${issued.invite.name.replace(/\s+/g, "-").toLowerCase()}-invite.png`}
        className="mt-4 inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-soft"
      >
        Download QR
      </a>
    </div>
  );
}
