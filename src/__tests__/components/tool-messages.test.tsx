import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next-intl/server", () => ({
  getMessages: async ({ locale }: { locale: string }) => (locale === "en" ? enMessages : esMessages),
}));
vi.mock("recharts", () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}));

import { ToolMessages } from "@/components/i18n/ToolMessages";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import { Calculator503020 } from "@/components/landing/tools/Calculator503020";
import { CalculatorInflation } from "@/components/landing/tools/CalculatorInflation";

afterEach(() => cleanup());

const SRC = path.resolve(__dirname, "..", "..");
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), "utf8");

// El layout raíz envía al navegador los mensajes SIN `Tools`
const rootMessages = (locale: "es" | "en") => {
  const all = locale === "en" ? enMessages : esMessages;
  return Object.fromEntries(Object.entries(all).filter(([k]) => k !== "Tools"));
};

const renderWithRoot = async (locale: "es" | "en", tools: Record<string, readonly string[] | true>, child: React.ReactNode) => {
  const onError = vi.fn();
  const element = await ToolMessages({ locale, tools, children: child });
  const utils = render(
    <NextIntlClientProvider locale={locale} messages={rootMessages(locale)} onError={onError}>
      {element}
    </NextIntlClientProvider>
  );
  return { ...utils, onError };
};

describe("ToolMessages: las calculadoras reciben sus mensajes aunque el layout raíz no envíe `Tools`", () => {
  it.each(["es", "en"] as const)("SavingsCalculator (%s): sin errores de mensajes y con texto traducido", async (locale) => {
    const { onError } = await renderWithRoot(locale, { Savings: true }, <SavingsCalculator />);
    expect(onError).not.toHaveBeenCalled();
    const m = (locale === "en" ? enMessages : esMessages).Tools.Savings;
    expect(screen.getByText(m.header.title)).toBeTruthy();
    expect(screen.getByRole("button", { name: m.inputs.goalToggle })).toBeTruthy();
  });

  it.each(["es", "en"] as const)("Calculator503020 (%s)", async (locale) => {
    const { onError, container } = await renderWithRoot(locale, { Rule503020: true }, <Calculator503020 />);
    expect(onError).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(/Tools\./);
  });

  it.each(["es", "en"] as const)("CalculatorInflation (%s)", async (locale) => {
    const { onError, container } = await renderWithRoot(locale, { Inflation: true }, <CalculatorInflation />);
    expect(onError).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(/Tools\./);
  });

  it("sin ToolMessages, la calculadora fallaría: el layout raíz ya no lleva Tools", () => {
    const onError = vi.fn();
    render(
      <NextIntlClientProvider locale="es" messages={rootMessages("es")} onError={onError}>
        <SavingsCalculator />
      </NextIntlClientProvider>
    );
    expect(onError).toHaveBeenCalled();
  });

  it("entrega solo Tools.Common y los namespaces/claves pedidos", async () => {
    const element = await ToolMessages({ locale: "es", tools: { Savings: ["inputs", "results"] }, children: null });
    const messages = (element.props as { messages: { Tools: Record<string, Record<string, unknown>> } }).messages;
    expect(Object.keys(messages.Tools).sort()).toEqual(["Common", "Savings"]);
    expect(Object.keys(messages.Tools.Savings).sort()).toEqual(["inputs", "results"]);
    expect(messages.Tools.Savings.inputs).toEqual(esMessages.Tools.Savings.inputs);
  });
});

describe("guardas de código", () => {
  it("el layout raíz excluye el namespace Tools de los mensajes del cliente", () => {
    const layout = read("app", "[locale]", "layout.tsx");
    expect(layout).toMatch(/filter\(\(\[namespace\]\) => namespace !== "Tools"\)/);
    expect(layout).toMatch(/<NextIntlClientProvider messages=\{messages\}>/);
  });

  it.each([
    ["(public)/herramientas/calculadora-ahorro/page.tsx", "Savings"],
    ["(landing)/herramientas/calculadora-inflacion/page.tsx", "Inflation"],
    ["(landing)/herramientas/regla-50-30-20/page.tsx", "Rule503020"],
  ])("la página %s envuelve la calculadora con ToolMessages (%s)", (file, tool) => {
    const page = read("app", "[locale]", ...file.split("/"));
    expect(page).toMatch(new RegExp(`<ToolMessages[^>]*tools=\\{\\{ ${tool}:`));
  });

  it("solo estos componentes cliente usan el namespace Tools; uno nuevo debe entregarse vía ToolMessages", () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && /useTranslations\(\s*["'`]Tools/.test(fs.readFileSync(full, "utf8"))) {
          found.push(path.relative(SRC, full).replace(/\\/g, "/"));
        }
      }
    };
    walk(SRC);
    expect(found.sort()).toEqual([
      "components/landing/tools/Calculator503020.tsx",
      "components/landing/tools/CalculatorInflation.tsx",
      "components/landing/tools/EmbedModal.tsx",
      "components/landing/tools/SavingsCalculator.tsx",
    ]);
  });
});
