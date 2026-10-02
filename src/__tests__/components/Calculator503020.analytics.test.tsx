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

vi.mock("recharts", () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
}));

vi.mock("@/components/landing/tools/EmbedModal", () => ({
  EmbedModal: () => null,
}));

import { Calculator503020 } from "@/components/landing/tools/Calculator503020";

beforeEach(() => {
  trackMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("Calculator503020 CTA attribution", () => {
  it("fires click_tool_to_app with the source taken from the CTA link", () => {
    render(<Calculator503020 />);

    fireEvent.click(screen.getByRole("link", { name: "cta.button" }));

    expect(trackMock).toHaveBeenCalledWith("click_tool_to_app", {
      tool_name: "regla_50_30_20",
      cta_location: "calculator_cta",
      source: "calculator_503020",
    });
  });
});
