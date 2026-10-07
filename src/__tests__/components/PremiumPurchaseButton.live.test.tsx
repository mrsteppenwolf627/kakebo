import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

import { PremiumPurchaseButton } from "@/components/premium/PremiumPurchaseButton";

const labels = {
  soon: "Disponible ahora",
  soonNote: "Compra disponible ahora.",
  buy: "Comprar Kakebo Master System",
  pending: "Abriendo el pago seguro…",
  unavailable: "No se ha podido iniciar el pago. Inténtalo de nuevo en unos minutos.",
};

const assign = vi.fn();
const realLocation = window.location;

beforeEach(() => {
  vi.mocked(fetch).mockReset();
  assign.mockReset();
  Object.defineProperty(window, "location", { configurable: true, value: { ...realLocation, assign } });
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
});

describe("PremiumPurchaseButton — commerce enabled", () => {
  it("uses the active purchase label and no 'coming soon' text", () => {
    render(<PremiumPurchaseButton enabled labels={labels} />);
    expect(screen.getByRole("button", { name: labels.buy })).toBeInTheDocument();
    expect(screen.queryByText(/próximamente|todavía no/i)).toBeNull();
  });

  it("shows a useful pending state while checkout is created", async () => {
    let resolve!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<PremiumPurchaseButton enabled labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: labels.buy }));

    expect(await screen.findByRole("button", { name: labels.pending })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(labels.pending);
    resolve({ ok: false, status: 502 } as Response);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable));
  });

  it("ignores a second click while pending (one checkout request only)", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(() => {}));
    render(<PremiumPurchaseButton enabled labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    fireEvent.click(await screen.findByRole("button", { name: labels.pending }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows a clear error when checkout fails, and allows retrying", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502, json: async () => ({}) } as Response);
    render(<PremiumPurchaseButton enabled labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable));
    expect(assign).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("shows the error on a network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    render(<PremiumPurchaseButton enabled labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable));
  });

  it("redirects to the Stripe Checkout URL when the API answers correctly", async () => {
    const url = "https://checkout.stripe.com/c/pay/cs_test_abc";
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, url }) } as Response);
    render(<PremiumPurchaseButton enabled labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(url));
    expect(fetch).toHaveBeenCalledWith("/api/premium/checkout", { method: "POST" });
  });

  it("never follows a URL that is not a Stripe-hosted checkout", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, url: "https://evil.example/pay" }) } as Response);
    render(<PremiumPurchaseButton enabled labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.buy }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable));
    expect(assign).not.toHaveBeenCalled();
  });
});
