import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import type { PlusViewReady } from "@/lib/plus/access-view";
import { intl, text } from "../../helpers/intl-mock";

vi.mock("next-intl", async () => await import("../../helpers/intl-mock"));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PlanClient, PlanLoadError } from "@/components/plus/PlanClient";
import { UpgradePanel } from "@/components/plus/UpgradePanel";
import { PortalButton } from "@/components/plus/PortalButton";
import { PlusRequiredNotice } from "@/components/plus/PlusRequiredNotice";
import SubscriptionGuard from "@/components/saas/SubscriptionGuard";

const base: PlusViewReady = {
  status: "ready", state: "free_under_limit", isPremium: false, trialEndsAt: null, trialDaysLeft: null, plusAccessUntil: null,
  cancelAtPeriodEnd: false, planInterval: null, pastDue: false, graceEndsAt: null, freeExpensesUsed: 12, freeExpensesLimit: 30,
  canUseAi: false, canExportReports: false, hasBillingAccount: false,
};
const view = (o: Partial<PlusViewReady>): PlusViewReady => ({ ...base, ...o });

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fetchMock = () => vi.mocked(fetch);

beforeEach(() => {
  intl.locale = "es";
  fetchMock().mockReset();
});
afterEach(() => cleanup());

const buttons = () => screen.queryAllByRole("button").map((b) => b.textContent ?? "");
const hasButton = (name: string) => screen.queryByRole("button", { name }) !== null;

describe.each(["es", "en"] as const)("PlanClient — estados de acceso (%s)", (locale) => {
  beforeEach(() => {
    intl.locale = locale;
  });
  const T = (k: string, v?: Record<string, string | number>) => text(k, v, locale);

  it("founder: acceso completo, etiqueta adecuada y sin botones de pago", () => {
    render(<PlanClient view={view({ state: "founder", isPremium: true, canUseAi: true, canExportReports: true })} locale={locale} />);
    expect(screen.getByText(T("state_founder"))).toBeInTheDocument();
    expect(screen.getByText(T("founderDesc"))).toBeInTheDocument();
    expect(buttons()).toEqual([]);
  });

  it("legacy_full: «Plus permanente», explicación y sin botón de pago", () => {
    render(<PlanClient view={view({ state: "legacy_full", isPremium: true, canUseAi: true })} locale={locale} />);
    expect(screen.getByText(T("state_legacy_full"))).toBeInTheDocument();
    expect(screen.getByText(T("legacyDesc"))).toBeInTheDocument();
    expect(hasButton(T("subscribeButton"))).toBe(false);
    expect(buttons()).toEqual([]);
  });

  it("trial: etiqueta, días restantes, fecha de fin, botón de suscripción y aviso de cobro inmediato", () => {
    render(<PlanClient view={view({ state: "trialing", isPremium: true, trialDaysLeft: 9, trialEndsAt: "2026-10-27T12:00:00Z" })} locale={locale} />);
    expect(screen.getAllByText(T("state_trialing")).length).toBeGreaterThan(0);
    expect(screen.getByText(T("trialDays", { days: 9 }))).toBeInTheDocument();
    const date = locale === "es" ? "27 de octubre de 2026" : "27 October 2026";
    expect(screen.getByText(T("trialEnds", { date }))).toBeInTheDocument();
    expect(screen.getByText(T("trialChargeNote"))).toBeInTheDocument();
    expect(hasButton(T("subscribeButton"))).toBe(true);
  });

  it("trial con 1 día: texto en singular", () => {
    render(<PlanClient view={view({ state: "trialing", trialDaysLeft: 1, trialEndsAt: "2026-10-14T12:00:00Z" })} locale={locale} />);
    expect(screen.getByText(T("trialDaysOne"))).toBeInTheDocument();
  });

  it.each([["monthly", "planMonthly"], ["annual", "planAnnual"]] as const)("Plus activo %s: plan, fecha de renovación y «Gestionar suscripción»", (interval, key) => {
    render(<PlanClient view={view({ state: "plus_active", isPremium: true, planInterval: interval, plusAccessUntil: "2026-11-13T00:00:00Z" })} locale={locale} />);
    expect(screen.getByText(T(key))).toBeInTheDocument();
    const date = locale === "es" ? "13 de noviembre de 2026" : "13 November 2026";
    expect(screen.getByText(T("renewsOn", { date }))).toBeInTheDocument();
    expect(hasButton(T("manageButton"))).toBe(true);
    expect(hasButton(T("subscribeButton"))).toBe(false);
  });

  it("cancelación pendiente: acceso hasta la fecha de fin y botón para reactivar/gestionar", () => {
    render(<PlanClient view={view({ state: "plus_canceled_pending", isPremium: true, cancelAtPeriodEnd: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z" })} locale={locale} />);
    const date = locale === "es" ? "13 de noviembre de 2026" : "13 November 2026";
    expect(screen.getByText(T("cancelPendingDesc", { date }))).toBeInTheDocument();
    expect(screen.queryByText(T("renewsOn", { date }))).toBeNull();
    expect(hasButton(T("reactivateButton"))).toBe(true);
  });

  it("past_due dentro de gracia: aviso claro, acceso conservado y botón para actualizar el método de pago", () => {
    render(<PlanClient view={view({ state: "plus_active", isPremium: true, pastDue: true, planInterval: "monthly", plusAccessUntil: "2026-11-13T00:00:00Z", graceEndsAt: "2026-10-16T12:00:00Z" })} locale={locale} />);
    const date = locale === "es" ? "16 de octubre de 2026" : "16 October 2026";
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(T("pastDueDesc", { date }))).toBeInTheDocument();
    expect(screen.getAllByText(T("state_past_due")).length).toBeGreaterThan(0);
    expect(hasButton(T("updatePaymentButton"))).toBe(true);
  });

  it("gratis: límite de 30, uso, funciones incluidas, Plus bloqueado y botones de suscripción", () => {
    render(<PlanClient view={view({ state: "free_under_limit", freeExpensesUsed: 12 })} locale={locale} />);
    expect(screen.getByText(T("state_free"))).toBeInTheDocument();
    expect(screen.getByText(T("freeUsage", { used: 12, limit: 30 }))).toBeInTheDocument();
    expect(screen.getAllByText(T("freeIncluded1", { limit: 30 }), { exact: false }).length).toBeGreaterThan(0);
    for (const k of ["plusFeatureAi", "plusFeaturePdf", "plusFeatureSearch", "plusFeatureUnlimited"]) {
      expect(screen.getByText(T(k), { exact: false })).toBeInTheDocument();
    }
    expect(screen.getAllByText(T("plusOnlyBadge"), { exact: false }).length).toBeGreaterThanOrEqual(4);
    expect(hasButton(T("subscribeButton"))).toBe(true);
    expect(screen.queryByText(T("freeLimitReached", { limit: 30 }))).toBeNull();
  });

  it("gratis con el límite alcanzado: lo explica con texto (no solo con color)", () => {
    render(<PlanClient view={view({ state: "free_readonly", freeExpensesUsed: 30 })} locale={locale} />);
    expect(screen.getByText(T("freeLimitReached", { limit: 30 }), { exact: false })).toBeInTheDocument();
  });

  it("gratis con cuenta de facturación previa: ofrece el portal para ver facturas", () => {
    render(<PlanClient view={view({ hasBillingAccount: true })} locale={locale} />);
    expect(hasButton(T("manageButton"))).toBe(true);
  });
});

describe("PlanLoadError", () => {
  it("error temporal: mensaje claro sin detalles técnicos y sin estados falsos", () => {
    render(<PlanLoadError kind="error" locale="es" />);
    expect(screen.getByRole("alert")).toHaveTextContent(text("loadErrorTitle"));
    expect(screen.getByRole("alert")).toHaveTextContent(text("loadErrorDesc"));
  });
  it("sin sesión: pide iniciar sesión", () => {
    render(<PlanLoadError kind="unauthenticated" locale="es" />);
    expect(screen.getByRole("link", { name: text("errLogin") })).toHaveAttribute("href", "/login");
  });
});

describe("UpgradePanel — selector y Checkout", () => {
  const monthlyRadio = () => screen.getByRole("radio", { name: new RegExp(text("monthly")) });
  const annualRadio = () => screen.getByRole("radio", { name: new RegExp(text("annual")) });
  const subscribe = () => screen.getByRole("button", { name: text("subscribeButton") });

  it("muestra 3,99 €/mes, 39,90 €/año y el ahorro equivalente a dos meses", () => {
    render(<UpgradePanel locale="es" />);
    expect(screen.getByText(/3,99\s?€ al mes/)).toBeInTheDocument();
    expect(screen.getByText(/39,90\s?€ al año/)).toBeInTheDocument();
    expect(screen.getByText(/7,98\s?€ al año: equivale a 2 meses gratis/)).toBeInTheDocument();
    cleanup();
    intl.locale = "en";
    render(<UpgradePanel locale="en" />);
    expect(screen.getByText(/€3\.99 per month/)).toBeInTheDocument();
    expect(screen.getByText(/€39\.90 per year/)).toBeInTheDocument();
    expect(screen.getByText(/€7\.98 a year: that's 2 months free/)).toBeInTheDocument();
  });

  it("selector accesible: radios nativos dentro de fieldset con leyenda, anual preseleccionado y cambiable con teclado", () => {
    render(<UpgradePanel locale="es" />);
    expect(screen.getByRole("group", { name: text("intervalLegend") })).toBeInTheDocument();
    expect(annualRadio()).toBeChecked();
    expect(monthlyRadio()).not.toBeChecked();
    monthlyRadio().focus();
    expect(monthlyRadio()).toHaveFocus();
    fireEvent.click(monthlyRadio());
    expect(monthlyRadio()).toBeChecked();
    expect(annualRadio()).not.toBeChecked();
  });

  it("mensual: llama a /api/stripe/checkout SOLO con interval y locale y redirige a Stripe", async () => {
    const redirect = vi.fn();
    fetchMock().mockResolvedValueOnce(json(200, { success: true, data: { url: "https://checkout.stripe.com/c/pay_abc" } }));
    render(<UpgradePanel locale="es" redirect={redirect} />);
    fireEvent.click(monthlyRadio());
    fireEvent.click(subscribe());
    await waitFor(() => expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay_abc"));
    const [url, init] = fetchMock().mock.calls[0];
    expect(url).toBe("/api/stripe/checkout");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ interval: "month", locale: "es" });
  });

  it("anual: envía interval=year (nunca price_id, customer_id ni user_id)", async () => {
    fetchMock().mockResolvedValueOnce(json(200, { success: true, data: { url: "https://checkout.stripe.com/c/pay_y" } }));
    render(<UpgradePanel locale="en" redirect={vi.fn()} />);
    fireEvent.click(subscribe());
    await waitFor(() => expect(fetchMock()).toHaveBeenCalled());
    const body = JSON.parse((fetchMock().mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ interval: "year", locale: "en" });
    expect(Object.keys(body).sort()).toEqual(["interval", "locale"]);
  });

  it("no redirige a URLs que no sean de Stripe", async () => {
    const redirect = vi.fn();
    fetchMock().mockResolvedValueOnce(json(200, { success: true, data: { url: "https://evil.example/phish" } }));
    render(<UpgradePanel locale="es" redirect={redirect} />);
    fireEvent.click(subscribe());
    await screen.findByRole("alert");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("durante la petición el botón queda ocupado (aria-busy) y deshabilitado", async () => {
    let resolve!: (r: Response) => void;
    fetchMock().mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    render(<UpgradePanel locale="es" redirect={vi.fn()} />);
    fireEvent.click(subscribe());
    const busy = await screen.findByRole("button", { name: text("subscribing") });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    resolve(json(200, { data: { url: "https://checkout.stripe.com/x" } }));
  });

  it.each([
    [401, "errUnauthorized"],
    [403, "errForbidden"],
    [409, "errConflict"],
    [422, "errValidation"],
    [503, "errUnavailable"],
    [500, "errGeneric"],
  ] as const)("error %s -> mensaje claro asociado al botón (role=alert + aria-describedby)", async (status, key) => {
    fetchMock().mockResolvedValueOnce(json(status, { success: false, error: { code: "X", message: "detalle técnico interno" } }));
    render(<UpgradePanel locale="es" redirect={vi.fn()} />);
    fireEvent.click(subscribe());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text(key));
    expect(alert).not.toHaveTextContent("detalle técnico interno");
    expect(subscribe()).toHaveAttribute("aria-describedby", alert.id);
    expect(subscribe()).not.toBeDisabled(); // se puede reintentar
  });

  it("401 ofrece volver a iniciar sesión; 409 ofrece abrir el portal", async () => {
    fetchMock().mockResolvedValueOnce(json(401, {}));
    render(<UpgradePanel locale="es" redirect={vi.fn()} loginHref="/login" />);
    fireEvent.click(subscribe());
    expect(await screen.findByRole("link", { name: text("errLogin") })).toHaveAttribute("href", "/login");
    cleanup();
    fetchMock().mockResolvedValueOnce(json(409, {}));
    render(<UpgradePanel locale="es" redirect={vi.fn()} />);
    fireEvent.click(subscribe());
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: text("manageButton") })).toBeInTheDocument();
  });

  it("error de red -> mensaje de conexión", async () => {
    fetchMock().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    intl.locale = "en";
    render(<UpgradePanel locale="en" redirect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: text("subscribeButton", undefined, "en") }));
    expect(await screen.findByRole("alert")).toHaveTextContent(text("errNetwork", undefined, "en"));
  });
});

describe("PortalButton", () => {
  it("llama a /api/stripe/portal solo con el idioma y redirige", async () => {
    const redirect = vi.fn();
    fetchMock().mockResolvedValueOnce(json(200, { success: true, data: { url: "https://billing.stripe.com/p/session_abc" } }));
    render(<PortalButton label="Gestionar" locale="es" redirect={redirect} />);
    fireEvent.click(screen.getByRole("button", { name: "Gestionar" }));
    await waitFor(() => expect(redirect).toHaveBeenCalledWith("https://billing.stripe.com/p/session_abc"));
    const [url, init] = fetchMock().mock.calls[0];
    expect(url).toBe("/api/stripe/portal");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ locale: "es" });
  });

  it.each([[401, "errUnauthorized"], [404, "errPortal"], [503, "errPortal"]] as const)("error %s -> mensaje accesible", async (status, key) => {
    fetchMock().mockResolvedValueOnce(json(status, {}));
    render(<PortalButton label="Gestionar" locale="es" redirect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Gestionar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(text(key));
    expect(screen.getByRole("button", { name: "Gestionar" })).toHaveAttribute("aria-describedby");
  });
});

describe("PlusRequiredNotice y SubscriptionGuard", () => {
  it("el aviso explica que es de Plus, conserva los datos y ofrece ver planes (sin errores técnicos)", () => {
    render(<PlusRequiredNotice />);
    expect(screen.getByRole("status")).toHaveTextContent(text("plusRequiredTitle"));
    expect(screen.getByText(text("plusRequiredDesc"))).toBeInTheDocument();
    const link = screen.getByRole("link", { name: text("seePlans") });
    expect(link).toHaveAttribute("href", "/app/subscription");
    expect(screen.getByRole("status").textContent).not.toMatch(/PLUS_REQUIRED|403|error/i);
  });

  it("SubscriptionGuard: por defecto (flag apagado) deja pasar el contenido", () => {
    render(<SubscriptionGuard><p>contenido</p></SubscriptionGuard>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByTestId("plus-required-notice")).toBeNull();
  });

  it("SubscriptionGuard bloqueado: muestra el bloqueo de IA y no el contenido", () => {
    render(<SubscriptionGuard allowed={false} title="ai"><p>contenido</p></SubscriptionGuard>);
    expect(screen.queryByText("contenido")).toBeNull();
    expect(screen.getByRole("heading", { name: text("aiBlockedTitle") })).toBeInTheDocument();
    expect(screen.getByTestId("plus-required-notice")).toBeInTheDocument();
  });
});
