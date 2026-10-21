import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import { CONSENT_KEY } from "@/lib/consent";
import { analytics } from "@/lib/analytics";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieBanner } from "@/components/landing/CookieBanner";

// next/script real inyectaría el script en <head>; aquí se sustituye por un marcador observable.
vi.mock("next/script", () => ({
  default: ({ src, id }: { src?: string; id?: string }) => (
    <span data-testid="ga-script" data-src={src ?? ""} data-id={id ?? ""} />
  ),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const GA_ID = "G-TEST123";

const App = () => (
  <NextIntlClientProvider locale="es" messages={esMessages}>
    <GoogleAnalytics />
    <CookieBanner />
  </NextIntlClientProvider>
);

const gaScripts = () => screen.queryAllByTestId("ga-script");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", GA_ID);
  window.localStorage.clear();
  window.gtag = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  delete window.gtag;
});

describe("consentimiento de analítica", () => {
  it("estado inicial: sin consentimiento no se carga Analytics ni se envían eventos, y se muestra el banner", () => {
    render(<App />);
    expect(gaScripts()).toHaveLength(0);
    expect(screen.getByRole("button", { name: esMessages.CookieBanner.accept })).toBeTruthy();
    expect(screen.getByRole("button", { name: esMessages.CookieBanner.reject })).toBeTruthy();

    analytics.track("tool_viewed", { tool_name: "calculadora_ahorro" });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBeNull();
  });

  it("tras aceptar: se carga Analytics (gtag.js con el id) y los eventos no sensibles se envían", () => {
    render(<App />);
    expect(gaScripts()).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: esMessages.CookieBanner.accept }));

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("true");
    const scripts = gaScripts();
    expect(scripts.map((s) => s.getAttribute("data-src"))).toContain(
      `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    );
    expect(scripts.map((s) => s.getAttribute("data-id"))).toContain("ga4-init");
    expect(screen.queryByRole("button", { name: esMessages.CookieBanner.accept })).toBeNull();

    analytics.track("tool_viewed", { tool_name: "calculadora_ahorro", page_path: "/x", page_title: "t" });
    expect(window.gtag).toHaveBeenCalledWith("event", "tool_viewed", {
      tool_name: "calculadora_ahorro",
      page_path: "/x",
      page_title: "t",
    });
  });

  it("tras rechazar: no se carga Analytics ni se envían eventos, y el banner desaparece y no vuelve", () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: esMessages.CookieBanner.reject }));

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("false");
    expect(gaScripts()).toHaveLength(0);
    expect(screen.queryByRole("button", { name: esMessages.CookieBanner.reject })).toBeNull();
    analytics.track("tool_viewed", { tool_name: "calculadora_ahorro" });
    expect(window.gtag).not.toHaveBeenCalled();

    // Persistencia: al recargar sigue rechazado y no se vuelve a preguntar
    unmount();
    render(<App />);
    expect(gaScripts()).toHaveLength(0);
    expect(screen.queryByRole("button", { name: esMessages.CookieBanner.accept })).toBeNull();
    analytics.track("tool_viewed", { tool_name: "calculadora_ahorro" });
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("elección aceptada guardada: al recargar se carga Analytics sin volver a mostrar el banner", () => {
    window.localStorage.setItem(CONSENT_KEY, "true");
    render(<App />);
    expect(gaScripts().length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: esMessages.CookieBanner.accept })).toBeNull();
  });

  it("sin id de medición no se renderiza ningún script aunque haya consentimiento", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    window.localStorage.setItem(CONSENT_KEY, "true");
    render(<App />);
    expect(gaScripts()).toHaveLength(0);
  });

  it("si cambia el consentimiento en otra pestaña (evento storage) se refleja sin recargar", () => {
    render(<App />);
    expect(gaScripts()).toHaveLength(0);
    act(() => {
      window.localStorage.setItem(CONSENT_KEY, "true");
      window.dispatchEvent(new Event("storage"));
    });
    expect(gaScripts().length).toBeGreaterThan(0);
  });
});
