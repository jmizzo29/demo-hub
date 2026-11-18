import { createHmac, timingSafeEqual } from "node:crypto";

export const DEMO_WEBHOOK_FALLBACK = "demo-webhook-secret-not-for-production";

export function webhookSecret() {
  return process.env.WEBHOOK_SIGNING_SECRET?.trim() || DEMO_WEBHOOK_FALLBACK;
}

export type PaymentEvent = {
  eventId: string;
  type: "invoice.paid";
  invoiceId: string;
  customerName: string;
  customerId: string;
  amountPaid: number;
  currency: "USD";
  paidAt: string;
};

export type CrmUpdate = {
  externalInvoiceId: string;
  accountName: string;
  accountExternalId: string;
  amount: number;
  currency: "USD";
  paidOn: string;
  status: "Paid";
};

type Store = {
  seen: Map<string, CrmUpdate>;
  records: CrmUpdate[];
};

const store: Store = ((globalThis as { __webhookDemo?: Store }).__webhookDemo ??= {
  seen: new Map(),
  records: [],
});

export function samplePayment(): PaymentEvent {
  return {
    eventId: `evt_${Date.now().toString(36)}`,
    type: "invoice.paid",
    invoiceId: "INV-1042",
    customerName: "Cedar & Co",
    customerId: "cust_8841",
    amountPaid: 1250,
    currency: "USD",
    paidAt: new Date().toISOString(),
  };
}

export function signBody(raw: string) {
  return `sha256=${createHmac("sha256", webhookSecret()).update(raw).digest("hex")}`;
}

export function signatureMatches(raw: string, header: string) {
  const expected = Buffer.from(signBody(raw));
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function mapPayment(event: PaymentEvent): CrmUpdate {
  return {
    externalInvoiceId: event.invoiceId,
    accountName: event.customerName,
    accountExternalId: event.customerId,
    amount: event.amountPaid,
    currency: event.currency,
    paidOn: event.paidAt,
    status: "Paid",
  };
}

export function alreadyProcessed(eventId: string) {
  return store.seen.get(eventId) ?? null;
}

export function remember(eventId: string, update: CrmUpdate) {
  store.seen.set(eventId, update);
}

export function saveCrmRecord(update: CrmUpdate) {
  store.records.push(update);
  return update;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
