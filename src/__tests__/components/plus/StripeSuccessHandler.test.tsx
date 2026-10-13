import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { intl, text } from "../../helpers/intl-mock";

const routerMock = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/app/subscription",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-intl", async () => await import("../../helpers/intl-mock"));

import StripeSuccessHandler from "@/components/saas/StripeSuccessHandler";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const ok = (access: string) => json(200, { success: true, data: { synced: true, applied: true, access } });
const SID = "cs_test_a1b2c3";
const fast = [0, 5, 5, 5];

beforeEach(() => {
  intl.locale = "es";
  vi.mocked(fetch).mockReset();
  routerMock.refresh.mockClear();
});
afterEach(() => cleanup());

describe("StripeSuccessHandler — retorno de Checkout", () => {
  it("sincroniza con el servidor enviando SOLO el session_id y confirma cuando el servidor confirma Plus", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok("plus_active"));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    expect(screen.getByTestId("stripe-return")).toHaveAttribute("data-phase", "processing");
    expect(screen.queryByText(text("confirmedTitle"))).toBeNull(); // nada de confirmación antes del servidor
    await screen.findByText(text("confirmedTitle"));
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/stripe/sync");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ session_id: SID });
    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalledTimes(1));
  });

  it("webhook todavía pendiente (409): muestra «procesando», reintenta y confirma cuando llega", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json(409, {}))
      .mockResolvedValueOnce(json(409, {}))
      .mockResolvedValueOnce(ok("plus_active"));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    expect(screen.getByText(text("processingTitle"))).toBeInTheDocument();
    await screen.findByText(text("confirmedTitle"));
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });

  it("un 200 que no es Plus (p. ej. sigue en trial) NO se presenta como confirmado", async () => {
    vi.mocked(fetch).mockResolvedValue(ok("trialing"));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    await screen.findByText(text("delayedTitle"));
    expect(screen.queryByText(text("confirmedTitle"))).toBeNull();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("si el pago sigue pendiente tras todos los intentos: aviso «se está procesando» con botón de reintento", async () => {
    vi.mocked(fetch).mockResolvedValue(json(409, {}));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    await screen.findByText(text("delayedTitle"));
    expect(screen.getByText(text("delayedDesc"))).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(fast.length);
    vi.mocked(fetch).mockResolvedValue(ok("plus_canceled_pending"));
    fireEvent.click(screen.getByRole("button", { name: text("retry") }));
    await screen.findByText(text("confirmedTitle"));
  });

  it("estado «delayed»: no afirma que la suscripción esté activa, tranquiliza sobre el pago, ofrece soporte y mantiene el reintento", async () => {
    vi.mocked(fetch).mockResolvedValue(json(409, {}));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    await screen.findByText(text("delayedTitle"));
    const box = screen.getByTestId("stripe-return");
    expect(box).toHaveAttribute("data-phase", "delayed");
    expect(box).toHaveTextContent(text("delayedDesc"));
    expect(box.textContent).toMatch(/no hace falta que vuelvas a pagar/i);
    expect(box.textContent).not.toMatch(/activo|confirmada!|¡Suscripción/i);
    const mail = screen.getByRole("link", { name: "aitor@aitoralmu.xyz" });
    expect(mail).toHaveAttribute("href", "mailto:aitor@aitoralmu.xyz");
    expect(screen.getByRole("button", { name: text("retry") })).toBeInTheDocument();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("estado «delayed» en inglés", async () => {
    intl.locale = "en";
    vi.mocked(fetch).mockResolvedValue(json(409, {}));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    await screen.findByText("We're waiting for your payment confirmation");
    expect(screen.getByText(/You don't need to pay again/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "aitor@aitoralmu.xyz" })).toBeInTheDocument();
  });

  it.each([[403], [401], [503], [422]])("error %s del servidor: aviso de error accesible y reintentable, sin confirmar", async (status) => {
    vi.mocked(fetch).mockResolvedValue(json(status, {}));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text("syncErrorTitle"));
    expect(screen.queryByText(text("confirmedTitle"))).toBeNull();
    expect(screen.getByRole("button", { name: text("retry") })).toBeInTheDocument();
  });

  it("error de red: aviso de error", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(text("syncErrorTitle"));
  });

  it("pago cancelado: informa de que no hay cargo y no llama al servidor", () => {
    render(<StripeSuccessHandler status="cancelled" sessionId={null} />);
    expect(screen.getByText(text("checkoutCancelled"))).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sin parámetros de retorno (o sin session_id) no renderiza nada ni llama al servidor", () => {
    const { container, rerender } = render(<StripeSuccessHandler status={null} sessionId={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<StripeSuccessHandler status="success" sessionId={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("en inglés usa los textos en inglés", async () => {
    intl.locale = "en";
    vi.mocked(fetch).mockResolvedValueOnce(ok("plus_active"));
    render(<StripeSuccessHandler status="success" sessionId={SID} delays={fast} />);
    expect(await screen.findByText("Subscription confirmed!")).toBeInTheDocument();
  });
});
