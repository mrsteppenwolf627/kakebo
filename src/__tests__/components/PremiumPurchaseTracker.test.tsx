import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { analytics } from "@/lib/analytics";
import { PremiumPurchaseTracker } from "@/components/premium/PremiumTracking";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const PATH = "/herramientas/plantilla-kakebo-excel-premium";

describe("PremiumPurchaseTracker", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });
  afterEach(() => cleanup());

  it("emite purchase una vez con valor 9,90 EUR y limpia el parámetro", () => {
    const spy = vi.spyOn(analytics, "track").mockReturnValue(true);
    window.history.replaceState(null, "", `${PATH}?checkout=success`);
    render(<PremiumPurchaseTracker />);
    expect(spy).toHaveBeenCalledTimes(1);
    const [name, props] = spy.mock.calls[0];
    expect(name).toBe("purchase");
    expect(props).toMatchObject({ value: 9.9, currency: "EUR" });
    expect(window.location.search).toBe("");
    cleanup();
    window.history.replaceState(null, "", `${PATH}?checkout=success`);
    render(<PremiumPurchaseTracker />);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it.each(["already_claimed", "cancelled", "pending", "error"])("no emite con checkout=%s", (v) => {
    const spy = vi.spyOn(analytics, "track").mockReturnValue(true);
    window.history.replaceState(null, "", `${PATH}?checkout=${v}`);
    render(<PremiumPurchaseTracker />);
    expect(spy).not.toHaveBeenCalled();
  });

  it("no emite sin el parámetro", () => {
    const spy = vi.spyOn(analytics, "track").mockReturnValue(true);
    window.history.replaceState(null, "", PATH);
    render(<PremiumPurchaseTracker />);
    expect(spy).not.toHaveBeenCalled();
  });
});
