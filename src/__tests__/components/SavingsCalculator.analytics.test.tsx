import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    return t;
  },
}));

vi.mock("@/components/landing/tools/EmbedModal", () => ({
  EmbedModal: () => null,
}));

import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";

const callsOf = (name: string) => trackMock.mock.calls.filter((c) => c[0] === name);

beforeEach(() => {
  trackMock.mockClear();
  document.title = "Calculadora de ahorro";
  window.history.pushState({}, "", "/herramientas/calculadora-ahorro?utm=x#hash");
});

afterEach(() => {
  cleanup();
});

describe("SavingsCalculator analytics funnel", () => {
  it("fires tool_viewed once on mount with page context", () => {
    render(<SavingsCalculator />);
    expect(callsOf("tool_viewed")).toHaveLength(1);
    expect(callsOf("tool_viewed")[0][1]).toEqual({
      tool_name: "calculadora_ahorro",
      page_path: "/herramientas/calculadora-ahorro",
      page_title: "Calculadora de ahorro",
    });
  });

  it("fires use_savings_calculator once and savings_calculator_calculate on blur, without financial values", () => {
    render(<SavingsCalculator />);
    const income = document.getElementById("sc-income") as HTMLInputElement;

    fireEvent.change(income, { target: { value: "2345" } });
    fireEvent.change(income, { target: { value: "2346" } });
    expect(callsOf("use_savings_calculator")).toHaveLength(1);
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);

    fireEvent.blur(income);
    fireEvent.blur(income);
    const calc = callsOf("savings_calculator_calculate");
    expect(calc).toHaveLength(1);
    expect(calc[0][1]).toMatchObject({
      tool_name: "calculadora_ahorro",
      page_path: "/herramientas/calculadora-ahorro",
      page_title: "Calculadora de ahorro",
    });

    const serialized = JSON.stringify(trackMock.mock.calls);
    expect(serialized).not.toContain("2345");
    expect(serialized).not.toContain("2346");
    expect(serialized).not.toContain("800");
  });

  it("fires click_tool_to_app once per CTA click with page context and CTA origin", () => {
    render(<SavingsCalculator />);
    fireEvent.click(screen.getByRole("link", { name: "results.ctaButton" }));
    const clicks = callsOf("click_tool_to_app");
    expect(clicks).toHaveLength(1);
    expect(clicks[0][1]).toEqual({
      tool_name: "calculadora_ahorro",
      page_path: "/herramientas/calculadora-ahorro",
      page_title: "Calculadora de ahorro",
      cta_location: "calculator_results",
      source: "calculadora_ahorro",
    });
  });
});
