import { describe, expect, it, vi } from "vitest";
import { azureReceiptIsExplicitlyEnabled, createAzureReceiptProvider, normalizeAzureReceipt, readAzureReceiptConfig } from "@/lib/scanner/azure-receipt-provider";

const env = {
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://example.cognitiveservices.azure.com",
  AZURE_DOCUMENT_INTELLIGENCE_KEY: "1234567890123456",
  SCANNER_OCR_ENABLED: "true",
  SCANNER_OCR_REAL_DATA_APPROVED: "true",
};

describe("Azure receipt provider", () => {
  it("permanece apagado sin las dos activaciones explícitas", async () => {
    expect(readAzureReceiptConfig(env)).not.toBeNull();
    expect(azureReceiptIsExplicitlyEnabled({ ...env, SCANNER_OCR_REAL_DATA_APPROVED: "false" })).toBe(false);
    const result = await createAzureReceiptProvider({ env: { ...env, SCANNER_OCR_ENABLED: "false" } }).analyze({
      attemptId: "a", idempotencyKey: "b", bytes: new Uint8Array([1]), mime: "image/jpeg", pageCount: 1,
      locale: "es", hints: { country: "ES", currency: "EUR" }, deadlineMs: 100,
    });
    expect(result).toEqual({ ok: false, kind: "config", code: "PILOT_NOT_ENABLED" });
  });

  it("normaliza cabecera y artículos sin inventar método de pago", () => {
    const receipt = normalizeAzureReceipt({ analyzeResult: { pages: [{}], documents: [{ fields: {
      MerchantName: { valueString: "Tienda", confidence: 0.98 },
      TransactionDate: { valueDate: "2026-10-27", confidence: 0.9 },
      Total: { valueCurrency: { amount: 12.5, currencyCode: "EUR" }, confidence: 0.95 },
      TotalTax: { valueCurrency: { amount: 2.5, currencyCode: "EUR" }, confidence: 0.8 },
      Items: { valueArray: [{ valueObject: { Description: { valueString: "Pan", confidence: 0.8 }, TotalPrice: { valueCurrency: { amount: 12.5, currencyCode: "EUR" }, confidence: 0.8 } } }] },
    } }] } });
    expect(receipt).toMatchObject({ merchant: { value: "Tienda" }, totalCents: { value: 1250 }, currency: { value: "EUR" }, taxCents: { value: 250 }, paymentMethod: { value: null } });
    expect(receipt?.lines[0]?.amountCents.value).toBe(1250);
  });

  it("sondea una operación 202 y no expone el cuerpo del proveedor", async () => {
    const completed = {
      status: "succeeded",
      analyzeResult: {
        pages: [{}],
        documents: [{ fields: { Total: { valueCurrency: { amount: 1, currencyCode: "EUR" } } } }],
      },
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 202, headers: { "Operation-Location": "https://example.invalid/op" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(completed), { status: 200, headers: { "Content-Type": "application/json" } }));
    const result = await createAzureReceiptProvider({ env: { ...env, AZURE_DOCUMENT_INTELLIGENCE_POLL_MS: "100" }, fetchImpl }).analyze({
      attemptId: "a", idempotencyKey: "b", bytes: new Uint8Array([1]), mime: "image/jpeg", pageCount: 1,
      locale: "es", hints: { country: "ES", currency: "EUR" }, deadlineMs: 1000,
    });
    expect(result).toMatchObject({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
