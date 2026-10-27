import { describe, expect, it, vi } from "vitest";
import {
  PrivacyViolationError,
  SCANNER_ANALYTICS_ALLOWLIST,
  assertPrivacySafe,
  findPrivacyViolations,
  isForbiddenKey,
  isUrlPrivacySafe,
  safeBrowserStorageSet,
  sanitizeScannerAnalyticsEvent,
  toSafeLogContext,
} from "@/lib/scanner/privacy";
import { resolveScannerAccess } from "@/lib/scanner/access";
import { parseNormalizedReceipt, describeConfidence } from "@/lib/scanner/ocr-contract";
import { readyDraft, syntheticReceipt } from "./helpers";

describe("claves prohibidas", () => {
  it.each([
    "amount", "amountCents", "total_cents", "taxRate", "vat", "percentage", "merchant", "description", "lines",
    "rawOcrText", "imageBytes", "fileName", "category", "allocations", "signedUrl", "storagePath", "draft", "receipt",
  ])("%s", (key) => expect(isForbiddenKey(key)).toBe(true));

  it.each(["ticketId", "status", "code", "durationMs", "source", "requestId", "private"])("permite %s", (key) =>
    expect(isForbiddenKey(key)).toBe(false)
  );
});

describe("detección de datos financieros", () => {
  it("detecta borrador, recibo OCR, binarios y base64 sin devolver valores", () => {
    expect(findPrivacyViolations({ draft: readyDraft() })).toEqual(["$.draft"]);
    expect(findPrivacyViolations({ ok: 1, nested: { receipt: syntheticReceipt() } })).toEqual(["$.nested.receipt"]);
    expect(findPrivacyViolations({ payload: new Uint8Array([1, 2]) })).toEqual(["$.payload"]);
    expect(findPrivacyViolations({ x: new Uint8Array([1]) })).toEqual(["$.x"]);
    expect(findPrivacyViolations({ x: "A".repeat(300) })).toEqual(["$.x"]);
    expect(findPrivacyViolations({ x: "data:image/png;base64,AAAA" })).toEqual(["$.x"]);
  });

  it("detecta importes y porcentajes dentro de cadenas y arrays", () => {
    expect(findPrivacyViolations({ note: "pagado 12,50 €" })).toEqual(["$.note"]);
    expect(findPrivacyViolations({ list: ["ok", "EUR 3.20"] })).toEqual(["$.list[1]"]);
    expect(findPrivacyViolations({ note: "IVA 21%" })).toEqual(["$.note"]);
  });

  it("tolera ciclos y acepta datos operativos", () => {
    const a: Record<string, unknown> = { ticketId: "7d1f", status: "processing" };
    a.self = a;
    expect(findPrivacyViolations(a)).toEqual([]);
  });

  it("assertPrivacySafe lanza un error con rutas y sin valores", () => {
    try {
      assertPrivacySafe({ total: 12.5 });
      throw new Error("no lanzó");
    } catch (e) {
      expect(e).toBeInstanceOf(PrivacyViolationError);
      expect((e as PrivacyViolationError).paths).toEqual(["$.total"]);
      expect((e as Error).message).toBe("PRIVACY_VIOLATION");
    }
  });
});

describe("Analytics", () => {
  it("rechaza eventos fuera de la lista blanca", () => {
    for (const name of ["expense_created", "scanner_total", "__proto__", "constructor", "toString"]) {
      expect(sanitizeScannerAnalyticsEvent(name, {})).toBeNull();
    }
  });

  it("descarta cualquier parámetro financiero, id o no listado", () => {
    const out = sanitizeScannerAnalyticsEvent("scanner_ticket_confirmed", {
      amountCents: 1250, merchant: "Comercio", category: "survival", ratio: 0.3, ticketId: "abc", source: "camera",
    });
    expect(out).toEqual({ name: "scanner_ticket_confirmed", properties: {} });
  });

  it("solo admite valores enumerados", () => {
    expect(sanitizeScannerAnalyticsEvent("scanner_source_selected", { source: "camera" })?.properties).toEqual({ source: "camera" });
    expect(sanitizeScannerAnalyticsEvent("scanner_source_selected", { source: "12,50 €" })?.properties).toEqual({});
    expect(sanitizeScannerAnalyticsEvent("scanner_error", { code: "QUOTA_EXCEEDED" })?.properties).toEqual({ code: "QUOTA_EXCEEDED" });
    expect(sanitizeScannerAnalyticsEvent("scanner_error", { code: "Total 10 EUR" })?.properties).toEqual({});
  });

  it("ningún evento permitido admite parámetros con claves prohibidas", () => {
    for (const params of Object.values(SCANNER_ANALYTICS_ALLOWLIST)) {
      for (const key of Object.keys(params)) expect(isForbiddenKey(key)).toBe(false);
    }
  });
});

describe("logs", () => {
  it("proyecta solo ids/códigos opacos y números", () => {
    const out = toSafeLogContext({
      ticketId: "5b0c2f0e-1111-4222-8333-444455556666",
      status: "needs_review",
      code: "VERSION_CONFLICT",
      durationMs: 42,
      draft: readyDraft(),
      rawOcrText: "TOTAL 10,00",
      merchant: "Comercio",
      eventType: "total 12,50 €",
      attemptCount: Number.NaN,
    });
    expect(out).toEqual({ ticketId: "5b0c2f0e-1111-4222-8333-444455556666", status: "needs_review", code: "VERSION_CONFLICT", durationMs: 42 });
  });

  it("descarta cadenas con espacios o importes aunque la clave sea permitida", () => {
    expect(toSafeLogContext({ code: "pagado 3 €" })).toEqual({});
    expect(toSafeLogContext({ code: "a b" })).toEqual({});
  });
});

describe("URL", () => {
  it("acepta URLs con ids opacos", () => {
    expect(isUrlPrivacySafe("/es/app/scan/5b0c2f0e-1111-4222-8333-444455556666")).toBe(true);
    expect(isUrlPrivacySafe("https://kakebo.example/app?locale=es")).toBe(true);
  });
  it("rechaza importes, claves financieras, hash y URLs firmadas", () => {
    expect(isUrlPrivacySafe("/app/scan?total=12.50")).toBe(false);
    expect(isUrlPrivacySafe("/app/scan?q=12,50%20%E2%82%AC")).toBe(false);
    expect(isUrlPrivacySafe("/app/scan#merchant=Foo")).toBe(false);
    expect(isUrlPrivacySafe("/app/scan?next=https://x.supabase.co/o?token=abc")).toBe(false);
    expect(isUrlPrivacySafe("/app/scan?category=extra")).toBe(false);
  });
});

describe("localStorage / sessionStorage", () => {
  it("no escribe datos del ticket ni claves financieras", () => {
    const storage = { setItem: vi.fn() };
    expect(() => safeBrowserStorageSet(storage, "scanner-draft", "x")).toThrow(PrivacyViolationError);
    expect(() => safeBrowserStorageSet(storage, "pref", { totalCents: 100 })).toThrow(PrivacyViolationError);
    expect(() => safeBrowserStorageSet(storage, "pref", "importe 9,99 €")).toThrow(PrivacyViolationError);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("escribe valores no sensibles", () => {
    const storage = { setItem: vi.fn() };
    safeBrowserStorageSet(storage, "scanner-hint-seen", { seen: true });
    expect(storage.setItem).toHaveBeenCalledWith("scanner-hint-seen", '{"seen":true}');
  });
});

describe("acceso (entitlement existente, solo lectura)", () => {
  it("solo los estados de pago permiten el escáner", () => {
    expect(resolveScannerAccess("plus_active")).toEqual({ allowed: true, reason: "allowed" });
    expect(resolveScannerAccess("plus_canceled_pending").allowed).toBe(true);
  });
  it("gratuitos ven la función bloqueada", () => {
    expect(resolveScannerAccess("free_under_limit")).toEqual({ allowed: false, reason: "plan_required" });
    expect(resolveScannerAccess("free_readonly")).toEqual({ allowed: false, reason: "plan_required" });
  });
  it("founder/legacy quedan sin decidir y lo desconocido se deniega", () => {
    expect(resolveScannerAccess("founder")).toEqual({ allowed: false, reason: "undecided" });
    expect(resolveScannerAccess("legacy_full")).toEqual({ allowed: false, reason: "undecided" });
    expect(resolveScannerAccess(null)).toEqual({ allowed: false, reason: "unavailable" });
    expect(resolveScannerAccess("otro" as never)).toEqual({ allowed: false, reason: "unavailable" });
  });
});

describe("contrato OCR normalizado", () => {
  it("acepta un resultado válido", () => {
    expect(parseNormalizedReceipt(syntheticReceipt()).ok).toBe(true);
  });
  it("rechaza claves desconocidas (minimización), confianza fuera de rango y céntimos no enteros", () => {
    expect(parseNormalizedReceipt({ ...syntheticReceipt(), rawText: "x" })).toEqual({ ok: false, code: "INVALID_RECEIPT_SHAPE" });
    const r = syntheticReceipt();
    r.totalCents = { value: 10.5, confidence: 0.5 };
    expect(parseNormalizedReceipt(r).ok).toBe(false);
    const c = syntheticReceipt();
    c.merchant = { value: "x", confidence: 1.5 };
    expect(parseNormalizedReceipt(c).ok).toBe(false);
  });
  it("el error de parseo no filtra el contenido", () => {
    const r = parseNormalizedReceipt({ ...syntheticReceipt(), merchant: { value: "Secreto S.L.", confidence: 9 } });
    expect(JSON.stringify(r)).not.toContain("Secreto");
  });
  it("confianza nula o inválida = unknown", () => {
    expect(describeConfidence(null)).toBe("unknown");
    expect(describeConfidence(undefined)).toBe("unknown");
    expect(describeConfidence(Number.NaN)).toBe("unknown");
    expect(describeConfidence(2)).toBe("unknown");
    expect(describeConfidence(0.4)).toBe("known");
  });
});
