import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import axe from "axe-core";
import fs from "node:fs";
import path from "node:path";
import type { PlusViewReady } from "@/lib/plus/access-view";
import { intl, text } from "../../helpers/intl-mock";

/**
 * Comprobación de accesibilidad ESTRUCTURAL con axe-core sobre jsdom (roles, nombres accesibles, etiquetas, ARIA,
 * encabezados). LIMITACIÓN: jsdom no calcula estilos ni layout, así que NO verifica contraste real, foco visible
 * renderizado, modo oscuro ni diseño móvil; eso exige un navegador.
 */

vi.mock("next-intl", async () => await import("../../helpers/intl-mock"));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), usePathname: () => "/app/subscription" }));

import { PlanClient } from "@/components/plus/PlanClient";
import { UpgradePanel } from "@/components/plus/UpgradePanel";
import { PlusRequiredNotice } from "@/components/plus/PlusRequiredNotice";
import StripeSuccessHandler from "@/components/saas/StripeSuccessHandler";

const base: PlusViewReady = {
  status: "ready", state: "free_under_limit", isPremium: false, trialEndsAt: null, trialDaysLeft: null, plusAccessUntil: null,
  cancelAtPeriodEnd: false, planInterval: null, pastDue: false, graceEndsAt: null, freeExpensesUsed: 3, freeExpensesLimit: 30,
  canUseAi: false, canExportReports: false, hasBillingAccount: true,
};
const states: [string, Partial<PlusViewReady>][] = [
  ["founder", { state: "founder", isPremium: true }],
  ["legacy_full", { state: "legacy_full", isPremium: true }],
  ["trialing", { state: "trialing", trialDaysLeft: 5, trialEndsAt: "2026-10-27T12:00:00Z" }],
  ["plus_active", { state: "plus_active", planInterval: "annual", plusAccessUntil: "2027-10-13T00:00:00Z" }],
  ["plus_canceled_pending", { state: "plus_canceled_pending", cancelAtPeriodEnd: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z" }],
  ["past_due", { state: "plus_active", pastDue: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z", graceEndsAt: "2026-10-16T00:00:00Z" }],
  ["free_under_limit", { state: "free_under_limit" }],
  ["free_readonly", { state: "free_readonly", freeExpensesUsed: 30 }],
];

async function violations(container: HTMLElement) {
  const res = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  intl.locale = "es";
  vi.mocked(fetch).mockReset();
});
afterEach(() => cleanup());

describe.each(["es", "en"] as const)("axe — estructura accesible (%s)", (locale) => {
  beforeEach(() => {
    intl.locale = locale;
  });

  it.each(states)("PlanClient · %s sin violaciones", async (_name, o) => {
    const { container } = render(
      <main>
        <h1>x</h1>
        <PlanClient view={{ ...base, ...o }} locale={locale} />
      </main>,
    );
    expect(await violations(container)).toEqual([]);
  });

  it("UpgradePanel con error visible sin violaciones", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json(503));
    const { container } = render(
      <main>
        <h1>x</h1>
        <UpgradePanel locale={locale} redirect={vi.fn()} />
      </main>,
    );
    fireEvent.click(screen.getByRole("button", { name: text("subscribeButton") }));
    await screen.findByRole("alert");
    expect(await violations(container)).toEqual([]);
  });

  it("aviso Plus y retorno de Checkout (processing/delayed/cancelled) sin violaciones", async () => {
    const a = render(<main><h1>x</h1><PlusRequiredNotice /></main>);
    expect(await violations(a.container)).toEqual([]);
    cleanup();

    vi.mocked(fetch).mockResolvedValue(json(409));
    const b = render(<main><h1>x</h1><StripeSuccessHandler status="success" sessionId="cs_test_a1" delays={[0, 1]} /></main>);
    expect(await violations(b.container)).toEqual([]); // processing
    await screen.findByText(text("delayedTitle"));
    expect(await violations(b.container)).toEqual([]); // delayed
    cleanup();

    const c = render(<main><h1>x</h1><StripeSuccessHandler status="cancelled" sessionId={null} /></main>);
    expect(await violations(c.container)).toEqual([]);
  });
});

describe("orden de tabulación y foco", () => {
  const tabbables = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));

  it("UpgradePanel: radios (un grupo) -> botón de suscripción, en orden visual", () => {
    const { container } = render(<UpgradePanel locale="es" redirect={vi.fn()} />);
    const order = tabbables(container).map((el) => (el as HTMLInputElement).value || el.textContent);
    expect(order).toEqual(["month", "year", text("subscribeButton")]);
    expect(container.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')).toHaveLength(0); // sin tabindex positivo
  });

  it("estado de pago fallido: el aviso va antes del botón de actualizar el método de pago", () => {
    const { container } = render(<PlanClient view={{ ...base, state: "plus_active", pastDue: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z", graceEndsAt: "2026-10-16T00:00:00Z" }} locale="es" />);
    const alert = screen.getByRole("alert");
    const update = screen.getByRole("button", { name: text("updatePaymentButton") });
    expect(alert.compareDocumentPosition(update) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
  });

  it("estilos de foco: todos los controles interactivos declaran un anillo de foco visible (focus-visible:ring)", () => {
    const root = process.cwd();
    for (const f of ["src/components/plus/UpgradePanel.tsx", "src/components/plus/PortalButton.tsx", "src/components/plus/PlusRequiredNotice.tsx", "src/components/saas/StripeSuccessHandler.tsx"]) {
      const src = fs.readFileSync(path.join(root, f), "utf8");
      expect(src, f).toMatch(/focus-visible:ring|focus-within:ring/);
      expect(src, f).not.toMatch(/outline-none(?![^"`]*focus-visible)/);
    }
  });

  it("contraste: en modo claro el color primario (#cf8c6c, 2,6:1 sobre el fondo) no se usa como color de texto, borde de botón ni anillo de foco", () => {
    const root = process.cwd();
    for (const f of ["src/components/plus/UpgradePanel.tsx", "src/components/plus/PortalButton.tsx", "src/components/plus/PlusRequiredNotice.tsx", "src/components/plus/PlanClient.tsx", "src/components/saas/StripeSuccessHandler.tsx"]) {
      const src = fs.readFileSync(path.join(root, f), "utf8");
      expect(src, f).not.toMatch(/text-primary(?!-)/);
      expect(src, f).not.toMatch(/ring-primary(?!\/)/);
      expect(src, f).not.toMatch(/border border-primary(?!\/)/);
    }
  });

  it("no depende solo del color: avisos y errores llevan icono textual o texto explícito", () => {
    const { container } = render(<PlanClient view={{ ...base, state: "plus_active", pastDue: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z", graceEndsAt: "2026-10-16T00:00:00Z" }} locale="es" />);
    expect(screen.getByRole("alert")).toHaveTextContent(text("pastDueTitle"));
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull(); // el icono es decorativo; el significado está en el texto
  });
});
