import { describe, expect, it, vi } from "vitest";
import { azureReceiptIsExplicitlyEnabled } from "@/lib/scanner/azure-receipt-provider";
import { proposeScannerCategory } from "@/lib/scanner/category-proposal";

describe("scanner processing guards", () => {
  it("stays disabled unless both explicit OCR gates are true", () => {
    expect(azureReceiptIsExplicitlyEnabled({})).toBe(false);
    expect(azureReceiptIsExplicitlyEnabled({ SCANNER_OCR_ENABLED: "true" })).toBe(false);
    expect(azureReceiptIsExplicitlyEnabled({ SCANNER_OCR_REAL_DATA_APPROVED: "true" })).toBe(false);
    expect(azureReceiptIsExplicitlyEnabled({ SCANNER_OCR_ENABLED: "true", SCANNER_OCR_REAL_DATA_APPROVED: "true" })).toBe(true);
  });

  it("only proposes a category and leaves unknown lines for human review", () => {
    expect(proposeScannerCategory("Leche entera")).toBe("survival");
    expect(proposeScannerCategory("Entrada cine")).toBe("culture");
    expect(proposeScannerCategory("Concepto desconocido")).toBeNull();
  });

  it("does not import a provider or send data while disabled", () => {
    const fetchImpl = vi.fn();
    expect(azureReceiptIsExplicitlyEnabled({ SCANNER_OCR_ENABLED: "false", SCANNER_OCR_REAL_DATA_APPROVED: "true" })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
