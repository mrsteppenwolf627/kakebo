import { describe, it, expect, vi, afterEach } from "vitest";
import { analytics } from "@/lib/analytics";
import { CONSENT_KEY } from "@/lib/consent";

describe("analytics", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.dataLayer;
    window.localStorage.removeItem(CONSENT_KEY);
  });

  it("does not throw when window.gtag is unavailable", () => {
    expect(() =>
      analytics.track("historical_inflation_calculation", {
        start_period: "2002-01",
        end_period: "2025-01",
        interval_months: 276,
        result_type: "inflation",
        source_page: "/herramientas/calculadora-inflacion",
      })
    ).not.toThrow();
  });

  it("does not forward events to window.gtag without analytics consent", () => {
    const gtagMock = vi.fn();
    window.gtag = gtagMock;

    analytics.track("tool_viewed", { tool_name: "x" });
    window.localStorage.setItem(CONSENT_KEY, "false");
    analytics.track("tool_viewed", { tool_name: "x" });

    expect(gtagMock).not.toHaveBeenCalled();
  });

  it("forwards events to window.gtag when available and consent was given", () => {
    const gtagMock = vi.fn();
    window.gtag = gtagMock;
    window.localStorage.setItem(CONSENT_KEY, "true");

    analytics.track("inflation_calculator_mode_change", {
      mode_from: "future",
      mode_to: "historical",
      source_page: "/herramientas/calculadora-inflacion",
    });

    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "inflation_calculator_mode_change",
      expect.objectContaining({ mode_from: "future", mode_to: "historical" })
    );
  });

  it("with consent but before gtag.js loads, it queues the event in dataLayer; without consent it creates nothing", () => {
    analytics.track("tool_viewed", { tool_name: "x" });
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();

    window.localStorage.setItem(CONSENT_KEY, "true");
    analytics.track("tool_viewed", { tool_name: "x" });
    expect(typeof window.gtag).toBe("function");
    expect(window.dataLayer).toHaveLength(1);
    expect(Array.from(window.dataLayer![0] as ArrayLike<unknown>)).toEqual(["event", "tool_viewed", { tool_name: "x" }]);
  });
});
