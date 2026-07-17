import { describe, it, expect, vi, afterEach } from "vitest";
import { analytics } from "@/lib/analytics";

describe("analytics", () => {
  afterEach(() => {
    delete window.gtag;
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

  it("forwards events to window.gtag when available", () => {
    const gtagMock = vi.fn();
    window.gtag = gtagMock;

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
});
