import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { EmbedModal } from "@/components/landing/tools/EmbedModal";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
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

afterEach(() => cleanup());

type Locale = "es" | "en";
const messagesFor = (locale: Locale) => (locale === "en" ? enMessages : esMessages);

function Harness({ locale = "es" as Locale }) {
  const [open, setOpen] = useState(false);
  return (
    <NextIntlClientProvider locale={locale} messages={messagesFor(locale)}>
      <main data-testid="background">
        <button type="button" data-testid="before">
          before
        </button>
        <input data-testid="field" />
        <a href="https://example.com/" data-testid="link">
          link
        </a>
        <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
          open
        </button>
      </main>
      <EmbedModal isOpen={open} onClose={() => setOpen(false)} toolPath="/herramientas/calculadora-ahorro" />
    </NextIntlClientProvider>
  );
}

const tab = (shift = false) => fireEvent.keyDown(document, { key: "Tab", shiftKey: shift });
const embed = esMessages.Tools.Common.embed;
const openModal = () => {
  const opener = screen.getByTestId("opener");
  opener.focus();
  fireEvent.click(opener);
  return opener;
};
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

describe("EmbedModal accesibilidad", () => {
  it("expone role=dialog, aria-modal y nombre accesible", () => {
    render(<Harness />);
    openModal();
    const dialog = screen.getByRole("dialog", { name: embed.title });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby") as string)?.textContent).toBe(embed.title);
  });

  it.each(["es", "en"] as const)("el botón de cierre tiene etiqueta accesible traducida (%s)", (locale) => {
    render(<Harness locale={locale} />);
    openModal();
    const label = messagesFor(locale).Tools.Common.embed.close;
    expect(label).toBeTruthy();
    expect(screen.getByRole("button", { name: label }).getAttribute("aria-label")).toBe(label);
  });

  it("se renderiza fuera del contenido (portal a body) y no existe cuando está cerrado", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).toBeNull();
    openModal();
    const dialog = screen.getByRole("dialog");
    expect(screen.getByTestId("background").contains(dialog)).toBe(false);
    expect(dialog.closest("body")).toBe(document.body);
  });

  it("al abrir, el foco entra en el diálogo y va al botón de cierre", () => {
    render(<Harness />);
    openModal();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: embed.close }));
  });

  it("mientras está abierto, el resto de la página es inert y ningún control de fondo queda operable con teclado", () => {
    render(<Harness />);
    openModal();
    const dialog = screen.getByRole("dialog");
    const background = screen.getByTestId("background");
    expect(background.closest("[inert]")).not.toBeNull();
    for (const id of ["before", "field", "link", "opener"]) {
      expect(screen.getByTestId(id).closest("[inert]")).not.toBeNull();
    }
    const outside = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !dialog.contains(el));
    expect(outside.length).toBeGreaterThan(0);
    expect(outside.every((el) => el.closest("[inert]") !== null)).toBe(true);
    expect(dialog.closest("[inert]")).toBeNull();
  });

  it("Tab y Shift+Tab ciclan dentro del diálogo (y solo interceptan en los extremos)", () => {
    render(<Harness />);
    openModal();
    const close = screen.getByRole("button", { name: embed.close });
    const copy = screen.getByRole("button", { name: embed.copy });
    expect(document.activeElement).toBe(close);

    // En el medio no se intercepta (devuelve true = no se llamó a preventDefault)
    expect(tab()).toBe(true);
    // Último → primero con Tab
    copy.focus();
    expect(tab()).toBe(false);
    expect(document.activeElement).toBe(close);
    // Primero → último con Shift+Tab
    expect(tab(true)).toBe(false);
    expect(document.activeElement).toBe(copy);
    // Si el foco estuviera fuera, vuelve dentro
    screen.getByTestId("before").focus();
    tab();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });

  it("Escape cierra el diálogo, retira inert y el foco vuelve exactamente al control que lo abrió", () => {
    render(<Harness />);
    const opener = openModal();
    expect(document.activeElement).not.toBe(opener);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[inert]")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("cerrar con el botón o pulsando el fondo también devuelve el foco al control de apertura", () => {
    render(<Harness />);
    let opener = openModal();
    fireEvent.click(screen.getByRole("button", { name: embed.close }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);

    opener = openModal();
    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("Escape no hace nada con el modal cerrado ni después de cerrarlo", () => {
    const onClose = vi.fn();
    const wrap = (isOpen: boolean) => (
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <EmbedModal isOpen={isOpen} onClose={onClose} toolPath="/x" />
      </NextIntlClientProvider>
    );
    const { rerender } = render(wrap(false));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    rerender(wrap(true));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(wrap(false));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("si el modal se desmonta abierto, retira inert del resto de la página", () => {
    const { unmount } = render(<Harness />);
    openModal();
    expect(document.querySelector("[inert]")).not.toBeNull();
    unmount();
    expect(document.querySelector("[inert]")).toBeNull();
  });
});

describe("EmbedModal en las demás calculadoras que lo reutilizan", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const cases = [
    { name: "Calculator503020", load: async () => (await import("@/components/landing/tools/Calculator503020")).Calculator503020 },
    { name: "CalculatorInflation", load: async () => (await import("@/components/landing/tools/CalculatorInflation")).CalculatorInflation },
  ];

  it.each(cases)("$name: abre el modal accesible, atrapa el foco, cierra con Escape y devuelve el foco", async ({ load }) => {
    const Calculator = await load();
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <Calculator />
      </NextIntlClientProvider>
    );
    const buttonText = embed.button.replace("💻 ", "");
    const opener = screen.getAllByRole("button").find((b) => b.textContent?.includes(buttonText)) as HTMLElement;
    expect(opener).toBeTruthy();
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole("dialog", { name: embed.title });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.body.querySelector("[inert]")).not.toBeNull();

    const close = screen.getByRole("button", { name: embed.close });
    const copy = screen.getByRole("button", { name: embed.copy });
    copy.focus();
    expect(tab()).toBe(false);
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[inert]")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

describe("EmbedModal: ES/EN, ciclo completo y limpieza", () => {
  it.each(["es", "en"] as const)("(%s) texto traducido, Tab y Shift+Tab cíclicos, Escape y foco al invocador", (locale) => {
    const t = messagesFor(locale).Tools.Common.embed;
    render(<Harness locale={locale} />);
    const opener = openModal();
    const dialog = screen.getByRole("dialog", { name: t.title });
    expect(dialog.textContent).toContain(t.desc);
    const close = screen.getByRole("button", { name: t.close });
    const copy = screen.getByRole("button", { name: t.copy });
    expect(document.activeElement).toBe(close);
    copy.focus();
    expect(tab()).toBe(false);
    expect(document.activeElement).toBe(close);
    expect(tab(true)).toBe(false);
    expect(document.activeElement).toBe(copy);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(opener);
  });

  it("al desmontarse abierto retira el listener de teclado e inert y devuelve el foco", () => {
    const onClose = vi.fn();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { unmount } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <EmbedModal isOpen onClose={onClose} toolPath="/x" />
      </NextIntlClientProvider>
    );
    expect(outside.hasAttribute("inert")).toBe(true);
    unmount();
    expect(outside.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(outside);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    outside.remove();
  });
});

describe("embed: no se presenta como funcional un destino no verificable", () => {
  it("la calculadora de ahorro no ofrece el embed y no referencia el modal ni el dominio de destino", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "..", "..", "components", "landing", "tools", "SavingsCalculator.tsx"),
      "utf8"
    );
    expect(src).not.toMatch(/EmbedModal|Tools\.Common\.embed|kakebo\.ai/);
  });
});
