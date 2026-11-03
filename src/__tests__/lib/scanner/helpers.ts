import type { NormalizedReceiptV1 } from "@/lib/scanner/ocr-contract";
import type { DraftLine, ReceiptDraft } from "@/lib/scanner/draft";

export const field = <T>(value: T | null, confidence: number | null = 0.9) => ({ value, confidence });

/** Ticket 100 % ficticio. */
export function syntheticReceipt(): NormalizedReceiptV1 {
  return {
    schemaVersion: 1,
    merchant: field("Supermercado Ejemplo S.L."),
    date: field("2026-03-14"),
    currency: field("EUR"),
    totalCents: field(1000),
    taxCents: field<number>(null, null),
    paymentMethod: field<"cash" | "card" | "other">("card"),
    lines: [
      { description: field("Articulo A"), quantity: field(1), amountCents: field(600) },
      { description: field("Articulo B"), quantity: field(1), amountCents: field(400) },
      { description: field("Ilegible"), quantity: field<number>(null, null), amountCents: field<number>(null, null) },
    ],
    pagesBilled: 1,
    providerRequestId: null,
    versions: { adapter: "fake-1", providerModel: null },
  };
}

export const line = (id: string, amountCents: number, over: Partial<DraftLine> = {}): DraftLine => ({
  id,
  kind: "item",
  description: null,
  amountCents,
  categoryProposal: null,
  category: null,
  allocations: [],
  ...over,
});

export function readyDraft(): ReceiptDraft {
  return {
    version: 3,
    merchant: "Comercio Ficticio",
    date: "2026-03-14",
    currency: "EUR",
    totalCents: 1000,
    lines: [line("l1", 600, { category: "survival" }), line("l2", 400, { category: "culture" })],
  };
}
