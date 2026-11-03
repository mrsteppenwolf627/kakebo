import { describe, expect, it } from "vitest";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";

function request(headers: Record<string, string> = {}) {
  return new Request("https://app.example.test/api/scanner/tickets", { method: "POST", headers }) as never;
}

describe("scanner mutation origin guard", () => {
  it("accepts the request origin", () => {
    expect(() => assertScannerSameOrigin(request({ origin: "https://app.example.test" }))).not.toThrow();
  });

  it("rejects a cross-origin request", () => {
    expect(() => assertScannerSameOrigin(request({ origin: "https://evil.example" }))).toThrow();
  });

  it("requires same-origin fetch metadata when Origin is absent", () => {
    expect(() => assertScannerSameOrigin(request({ "sec-fetch-site": "same-origin" }))).not.toThrow();
    expect(() => assertScannerSameOrigin(request({ "sec-fetch-site": "cross-site" }))).toThrow();
  });
});
