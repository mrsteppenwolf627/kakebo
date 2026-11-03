/**
 * Adaptador HTTP para Azure Document Intelligence Receipt v4.
 *
 * Está desactivado por defecto. Para que una petición salga del servidor deben
 * existir endpoint/clave y estar activadas explícitamente las dos puertas:
 * SCANNER_OCR_ENABLED=true y SCANNER_OCR_REAL_DATA_APPROVED=true. Esta segunda
 * puerta evita que un secreto configurado por accidente envíe tickets reales
 * antes de cerrar el piloto, el DPA y el benchmark.
 *
 * El adaptador no registra bytes, respuestas, nombres de comercio, importes ni
 * URLs de operación. La URL de operación solo vive en memoria durante el
 * sondeo y nunca se devuelve al navegador.
 */
import type { NormalizedReceiptV1, OcrOutcome, OcrRequest, ReceiptOcrProvider } from "./ocr-contract";
import { parseNormalizedReceipt } from "./ocr-contract";
import { azureReceiptDisabledAdapter, AZURE_RECEIPT_ADAPTER_VERSION, AZURE_RECEIPT_PROVIDER_ID } from "./azure-receipt-contract";
import { Buffer } from "node:buffer";

const API_VERSION = "2024-11-30";
const MAX_F0_BYTES = 4 * 1024 * 1024;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type AzureValue = {
  confidence?: unknown;
  valueString?: unknown;
  valueDate?: unknown;
  valueNumber?: unknown;
  valueCurrency?: { amount?: unknown; currencyCode?: unknown };
  valueArray?: AzureValue[];
  valueObject?: Record<string, AzureValue>;
};
type AzureAnalyzeResult = {
  pages?: unknown[];
  documents?: Array<{ fields?: Record<string, AzureValue> }>;
};

export interface AzureReceiptConfig {
  endpoint: string;
  key: string;
  apiVersion: string;
  pollIntervalMs: number;
}

function normalizedEndpoint(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function readAzureReceiptConfig(
  env: Record<string, string | undefined> = process.env
): AzureReceiptConfig | null {
  const endpoint = normalizedEndpoint(env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT);
  const key = env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key || key.length < 16) return null;
  return {
    endpoint,
    key,
    apiVersion: env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION || API_VERSION,
    pollIntervalMs: Math.min(Math.max(Number(env.AZURE_DOCUMENT_INTELLIGENCE_POLL_MS) || 250, 100), 2000),
  };
}

export function azureReceiptIsExplicitlyEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.SCANNER_OCR_ENABLED === "true" && env.SCANNER_OCR_REAL_DATA_APPROVED === "true";
}

function field<T>(value: T | null, confidence: unknown): { value: T | null; confidence: number | null } {
  return { value, confidence: typeof confidence === "number" && Number.isFinite(confidence) ? confidence : null };
}

function cents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const result = Math.round(value * 100);
  return Number.isSafeInteger(result) ? result : null;
}

function objectFields(value: unknown): Record<string, AzureValue> {
  if (!value || typeof value !== "object") return {};
  const fields = (value as { valueObject?: unknown }).valueObject;
  return fields && typeof fields === "object" ? fields as Record<string, AzureValue> : {};
}

function stringValue(value: AzureValue | undefined): string | null {
  return typeof value?.valueString === "string" ? value.valueString : null;
}

function dateValue(value: AzureValue | undefined): string | null {
  return typeof value?.valueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.valueDate) ? value.valueDate : null;
}

function numberValue(value: AzureValue | undefined): number | null {
  return typeof value?.valueNumber === "number" && Number.isFinite(value.valueNumber) ? value.valueNumber : null;
}

function currencyValue(value: AzureValue | undefined): { amount: number | null; code: string | null } {
  const currency = value?.valueCurrency;
  if (!currency || typeof currency !== "object") return { amount: null, code: null };
  return {
    amount: typeof currency.amount === "number" && Number.isFinite(currency.amount) ? currency.amount : null,
    code: typeof currency.currencyCode === "string" ? currency.currencyCode : null,
  };
}

export function normalizeAzureReceipt(input: unknown): NormalizedReceiptV1 | null {
  if (!input || typeof input !== "object") return null;
  const result = (input as { analyzeResult?: unknown }).analyzeResult as AzureAnalyzeResult | undefined;
  const document = result?.documents?.[0];
  if (!document || typeof document !== "object") return null;
  const fields = document.fields ?? {};
  const total = currencyValue(fields.Total);
  const tax = currencyValue(fields.TotalTax ?? fields.Tax);
  const rawItems = Array.isArray(fields.Items?.valueArray) ? fields.Items.valueArray : [];
  const lines = rawItems.flatMap((item: unknown) => {
    const itemFields = objectFields(item);
    const price = currencyValue(itemFields.TotalPrice ?? itemFields.Price);
    const description = stringValue(itemFields.Description ?? itemFields.Name);
    const amountCents = cents(price.amount);
    if (amountCents === null) return [];
    return [{
      description: field(description, itemFields.Description?.confidence),
      quantity: field(numberValue(itemFields.Quantity), itemFields.Quantity?.confidence),
      amountCents: field(amountCents, itemFields.TotalPrice?.confidence ?? itemFields.Price?.confidence),
    }];
  });
  const normalized: NormalizedReceiptV1 = {
    schemaVersion: 1,
    merchant: field(stringValue(fields.MerchantName), fields.MerchantName?.confidence),
    date: field(dateValue(fields.TransactionDate), fields.TransactionDate?.confidence),
    currency: field(total.code, fields.Total?.confidence),
    totalCents: field(cents(total.amount), fields.Total?.confidence),
    taxCents: field(cents(tax.amount), fields.TotalTax?.confidence ?? fields.Tax?.confidence),
    paymentMethod: field(null, null),
    lines,
    pagesBilled: Array.isArray(result.pages) ? result.pages.length : 0,
    providerRequestId: null,
    versions: { adapter: AZURE_RECEIPT_ADAPTER_VERSION, providerModel: "prebuilt-receipt" },
  };
  return parseNormalizedReceipt(normalized).ok ? normalized : null;
}

function configError(code: string): OcrOutcome {
  return { ok: false, kind: "config", code };
}

export function createAzureReceiptProvider(
  options: { env?: Record<string, string | undefined>; fetchImpl?: FetchLike } = {}
): ReceiptOcrProvider {
  const env = options.env ?? process.env;
  const config = readAzureReceiptConfig(env);
  if (!config || !azureReceiptIsExplicitlyEnabled(env)) return azureReceiptDisabledAdapter;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    id: AZURE_RECEIPT_PROVIDER_ID,
    adapterVersion: AZURE_RECEIPT_ADAPTER_VERSION,
    async analyze(request: OcrRequest): Promise<OcrOutcome> {
      if (request.bytes.byteLength > MAX_F0_BYTES) return configError("FILE_TOO_LARGE_FOR_FREE_TIER");
      const controller = new AbortController();
      const durationMs = Math.max(100, request.deadlineMs);
      const deadline = Date.now() + durationMs;
      const timeout = setTimeout(() => controller.abort(), durationMs);
      try {
        const analyzeUrl = `${config.endpoint}/documentintelligence/documentModels/prebuilt-receipt:analyze?api-version=${encodeURIComponent(config.apiVersion)}`;
        const submitted = await fetchImpl(analyzeUrl, {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": config.key, "Content-Type": request.mime },
          body: Buffer.from(request.bytes),
          signal: controller.signal,
        });
        if (submitted.status !== 202 && submitted.status !== 200) return configError("PROVIDER_REJECTED");
        const operation = submitted.headers.get("Operation-Location");
        if (submitted.status === 200) {
          const receipt = normalizeAzureReceipt(await submitted.json().catch(() => null));
          return receipt ? { ok: true, receipt } : configError("INVALID_PROVIDER_RESPONSE");
        }
        if (!operation) return configError("MISSING_OPERATION_LOCATION");

        while (Date.now() < deadline) {
          const polled = await fetchImpl(operation, { headers: { "Ocp-Apim-Subscription-Key": config.key }, signal: controller.signal });
          if (!polled.ok) return configError("PROVIDER_POLL_FAILED");
          const body = await polled.json().catch(() => null) as { status?: string } | null;
          if (body?.status === "succeeded") {
            const receipt = normalizeAzureReceipt(body);
            return receipt ? { ok: true, receipt } : configError("INVALID_PROVIDER_RESPONSE");
          }
          if (body?.status === "failed" || body?.status === "cancelled") return configError("PROVIDER_ANALYSIS_FAILED");
          await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
        }
        return { ok: false, kind: "transient", code: "PROVIDER_TIMEOUT" };
      } catch (error) {
        return { ok: false, kind: error instanceof DOMException && error.name === "AbortError" ? "transient" : "config", code: "PROVIDER_UNAVAILABLE" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
