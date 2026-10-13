import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, cleanup, fireEvent, waitFor, renderHook, act } from "@testing-library/react";
import type { PlusView } from "@/lib/plus/access-view";
import { intl, text } from "../../helpers/intl-mock";

const h = vi.hoisted(() => ({ view: { status: "disabled" } as unknown as PlusView, viewCalls: 0 }));

vi.mock("next-intl", async () => await import("../../helpers/intl-mock"));
vi.mock("next-intl/server", async () => {
  const m = await import("../../helpers/intl-mock");
  return { getLocale: async () => m.intl.locale, getTranslations: async (ns: string) => m.useTranslations(ns) };
});
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/plus/access-view", async (orig) => {
  const real = await orig<typeof import("@/lib/plus/access-view")>();
  return { ...real, getPlusAccessView: async () => { h.viewCalls++; return h.view; } };
});
vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "u1", email: "ana@example.test" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
    },
  }),
}));

import SubscriptionPage from "@/app/[locale]/app/subscription/page";
import UserMenu from "@/components/UserMenu";
import { useAgent, useAgentStream } from "@/hooks/useAgent";

const noComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const ready = (o: Record<string, unknown>) =>
  ({ status: "ready", state: "free_under_limit", isPremium: false, trialEndsAt: null, trialDaysLeft: null, plusAccessUntil: null, cancelAtPeriodEnd: false,
    planInterval: null, pastDue: false, graceEndsAt: null, freeExpensesUsed: 3, freeExpensesLimit: 30, canUseAi: false, canExportReports: false,
    hasBillingAccount: false, ...o }) as PlusView;

beforeEach(() => {
  intl.locale = "es";
  h.viewCalls = 0;
  h.view = { status: "disabled" };
  vi.mocked(fetch).mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("/app/subscription — flag apagado", () => {
  it.each([undefined, "", "false", "TRUE"])("PLUS_SUBSCRIPTIONS_ENABLED=%j: muestra la pantalla actual, sin consultar acceso ni botones de pago", async (v) => {
    if (v !== undefined) vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", v);
    render(await SubscriptionPage({ searchParams: {} }));
    expect(screen.getByText("Acceso Completo Gratuito")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull(); // ningún botón que llame a rutas desactivadas
    expect(screen.queryByText(text("subscribeButton"))).toBeNull();
    expect(h.viewCalls).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("aunque la URL traiga ?plus=success&session_id no llama a /api/stripe/sync", async () => {
    render(await SubscriptionPage({ searchParams: { plus: "success", session_id: "cs_test_abc123" } }));
    expect(screen.queryByTestId("stripe-return")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("/app/subscription — flag encendido", () => {
  beforeEach(() => vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "true"));

  it.each(["es", "en"] as const)("usuario gratuito (%s): título, plan y botón de suscripción", async (locale) => {
    intl.locale = locale;
    h.view = ready({});
    render(await SubscriptionPage({ searchParams: {} }));
    expect(screen.getByRole("heading", { level: 1, name: text("title") })).toBeInTheDocument();
    expect(screen.getByText(text("freeUsage", { used: 3, limit: 30 }))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: text("subscribeButton") })).toBeInTheDocument();
  });

  it("error temporal: aviso de error, no estados inventados ni botones de pago", async () => {
    h.view = { status: "error" };
    render(await SubscriptionPage({ searchParams: {} }));
    expect(screen.getByRole("alert")).toHaveTextContent(text("loadErrorTitle"));
    expect(screen.queryByRole("button", { name: text("subscribeButton") })).toBeNull();
  });

  it.each(["es", "en"] as const)("explica que el pack Excel/PDF de 9,90 € es independiente de Plus (%s)", async (locale) => {
    intl.locale = locale;
    h.view = ready({});
    render(await SubscriptionPage({ searchParams: {} }));
    const note = screen.getByRole("complementary", { name: text("packNoteTitle") });
    expect(note).toHaveTextContent(text("packNoteDesc"));
    expect(note).toHaveTextContent(locale === "es" ? "9,90 €" : "€9.90");
    expect(note.querySelector("button, a")).toBeNull(); // no mezcla acciones de pago con la suscripción
  });

  it("con el flag apagado la nota del pack no aparece (pantalla actual intacta)", async () => {
    vi.unstubAllEnvs();
    render(await SubscriptionPage({ searchParams: {} }));
    expect(screen.queryByText(text("packNoteTitle"))).toBeNull();
  });

  it("?plus=cancelled muestra el aviso de pago cancelado", async () => {
    h.view = ready({});
    render(await SubscriptionPage({ searchParams: { plus: "cancelled" } }));
    expect(screen.getByText(text("checkoutCancelled"))).toBeInTheDocument();
  });

  it("session_id malformado se descarta (no se llama a sync)", async () => {
    h.view = ready({});
    render(await SubscriptionPage({ searchParams: { plus: "success", session_id: "../../etc/passwd" } }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("stripe-return")).toBeNull();
  });

  it("retorno de Checkout: llama a sync y no confirma hasta que el servidor lo hace", async () => {
    h.view = ready({});
    vi.mocked(fetch).mockResolvedValue(json(200, { data: { access: "plus_active" } }));
    render(await SubscriptionPage({ searchParams: { plus: "success", session_id: "cs_test_abc123" } }));
    expect(screen.getByTestId("stripe-return")).toHaveAttribute("data-phase", "processing");
    await screen.findByText(text("confirmedTitle"));
    expect(JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string)).toEqual({ session_id: "cs_test_abc123" });
  });
});

describe("navegación: «Mi plan»", () => {
  const open = async (showPlan?: boolean) => {
    render(<UserMenu {...(showPlan === undefined ? {} : { showPlan })} />);
    fireEvent.click(await screen.findByRole("button", { name: /ana/ }));
  };

  it("sin showPlan (flag apagado) el menú no tiene entrada de plan", async () => {
    await open();
    expect(screen.getByRole("menuitem", { name: "Ajustes de Kakebo" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: text("navPlan") })).toBeNull();
  });

  it("con showPlan aparece «Mi plan» / «My plan» (accesible por teclado: es un botón)", async () => {
    await open(true);
    const item = screen.getByRole("menuitem", { name: text("navPlan") });
    expect(item.tagName).toBe("BUTTON");
  });

  it("en inglés usa «My plan» y el resto del menú también está traducido", async () => {
    intl.locale = "en";
    await open(true);
    expect(screen.getByRole("menuitem", { name: "My plan" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Kakebo settings" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByText("Cerrar sesión")).toBeNull();
    expect(screen.queryByText("Ajustes de Kakebo")).toBeNull();
  });

  it("en español: «Mi plan», «Ajustes de Kakebo» y «Cerrar sesión» salen de messages/es.json", async () => {
    await open(true);
    expect(screen.getByRole("menuitem", { name: "Mi plan" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ajustes de Kakebo" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("UserMenu no contiene textos fijos en español (todo viene de las traducciones)", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/components/UserMenu.tsx"), "utf8");
    expect(src).not.toMatch(/Entrar|Cerrar sesión|Ajustes de Kakebo|"Cuenta"/);
    const es = JSON.parse(fs.readFileSync(path.join(process.cwd(), "messages/es.json"), "utf8")).UserMenu;
    const en = JSON.parse(fs.readFileSync(path.join(process.cwd(), "messages/en.json"), "utf8")).UserMenu;
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const k of ["signIn", "account", "settings", "logout"]) expect(src).toContain(`tMenu("${k}")`);
  });

  it("la variable de entorno nunca llega al navegador: ningún componente de cliente la lee ni usa NEXT_PUBLIC_", () => {
    const root = process.cwd();
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
    const clientFiles = walk(path.join(root, "src")).filter((f) => !f.includes("__tests__") && /^\s*["']use client["']/.test(fs.readFileSync(f, "utf8")));
    expect(clientFiles.length).toBeGreaterThan(10);
    for (const f of clientFiles) {
      const src = noComments(fs.readFileSync(f, "utf8"));
      expect(src, f).not.toMatch(/PLUS_SUBSCRIPTIONS_ENABLED/);
      expect(src, f).not.toMatch(/STRIPE_|SERVICE_ROLE/);
    }
    for (const f of walk(path.join(root, "src")).filter((x) => !x.includes("__tests__"))) {
      expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/NEXT_PUBLIC_PLUS/);
    }
  });

  it("los componentes de interfaz no contienen price IDs ni envían campos de precio/cliente", () => {
    const root = process.cwd();
    for (const f of ["src/components/plus/UpgradePanel.tsx", "src/components/plus/PortalButton.tsx", "src/components/saas/StripeSuccessHandler.tsx", "src/lib/plus/client.ts"]) {
      const src = noComments(fs.readFileSync(path.join(root, f), "utf8"));
      expect(src, f).not.toMatch(/price_[A-Za-z0-9]{6,}|price_id|customer_id|user_id/);
    }
  });
});

describe("bloqueos de IA: 403 PLUS_REQUIRED", () => {
  const plusRequired = () => json(403, { success: false, error: { code: "PLUS_REQUIRED", message: "Necesitas Plus", details: { feature: "ai", state: "free_under_limit", upgrade: true } } });

  it("useAgentStream: marca plusRequired, no muestra error técnico y conserva el mensaje del usuario", async () => {
    vi.mocked(fetch).mockResolvedValue(plusRequired());
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.sendMessage("¿cuánto gasté en comida?");
    });
    expect(result.current.plusRequired).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages.map((m) => m.content)).toEqual(["¿cuánto gasté en comida?"]);
  });

  it("useAgentStream: un 500 sigue siendo un error normal (no confunde con Plus) y el siguiente envío limpia el aviso", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(plusRequired());
    const { result } = renderHook(() => useAgentStream());
    await act(async () => { await result.current.sendMessage("hola"); });
    expect(result.current.plusRequired).toBe(true);
    vi.mocked(fetch).mockResolvedValueOnce(json(500, { success: false, error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } }));
    await act(async () => { await result.current.sendMessage("otra vez"); });
    expect(result.current.plusRequired).toBe(false);
    expect(result.current.error).toBe("Error interno del servidor");
  });

  it("useAgentStream: un 403 que NO es PLUS_REQUIRED no se trata como Plus", async () => {
    vi.mocked(fetch).mockResolvedValue(json(403, { success: false, error: { code: "FORBIDDEN", message: "Acceso denegado" } }));
    const { result } = renderHook(() => useAgentStream());
    await act(async () => { await result.current.sendMessage("hola"); });
    expect(result.current.plusRequired).toBe(false);
    expect(result.current.error).toBe("Acceso denegado");
  });

  it("useAgent (no streaming): igual comportamiento", async () => {
    vi.mocked(fetch).mockResolvedValue(plusRequired());
    const { result } = renderHook(() => useAgent());
    await act(async () => { await result.current.sendMessage("hola"); });
    expect(result.current.plusRequired).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toHaveLength(1);
  });

  it("feedback y cancel-confirmation siguen abiertos: el cliente no los condiciona a Plus", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/hooks/useAgent.ts"), "utf8");
    const cancelBlock = src.slice(src.indexOf("/api/ai/agent-v2/cancel-confirmation") - 200, src.indexOf("/api/ai/agent-v2/cancel-confirmation") + 800);
    expect(cancelBlock).not.toMatch(/PlusRequired|plusRequired/);
    const newExpense = fs.readFileSync(path.join(process.cwd(), "src/app/[locale]/app/new/NewExpenseClient.tsx"), "utf8");
    const fb = newExpense.slice(newExpense.indexOf("/api/ai/feedback") - 100, newExpense.indexOf("/api/ai/feedback") + 600);
    expect(fb).not.toMatch(/PLUS_REQUIRED/);
  });

  it("el aviso de Plus tiene textos reales en es y en (sin claves sin traducir)", () => {
    for (const locale of ["es", "en"] as const) {
      expect(text("plusRequiredTitle", undefined, locale)).not.toMatch(/^Plus\./);
      expect(text("seePlans", undefined, locale)).not.toMatch(/^Plus\./);
    }
  });
});

void waitFor;
