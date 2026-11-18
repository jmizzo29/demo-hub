export const fieldMap = [
  ["invoiceId", "externalInvoiceId"],
  ["customerName", "accountName"],
  ["customerId", "accountExternalId"],
  ["amountPaid", "amount"],
  ["currency", "currency"],
  ["paidAt", "paidOn"],
  ["type invoice.paid", "status Paid"],
] as const;
