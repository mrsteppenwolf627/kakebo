import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: { track: (...args: unknown[]) => trackMock(...args) },
}));

import { PremiumPurchaseButton } from "@/components/premium/PremiumPurchaseButton";

const es = {
  soon: "Próximamente",
  soonNote: "El acceso premium estará disponible pronto.",
  buy: "Comprar Kakebo Master System",
  pending: "Procesando…",
  unavailable: "El checkout todavía no está disponible: el pago aún no está configurado.",
};
const en = {
  soon: "Coming soon",
  soonNote: "Premium access will be available soon.",
  buy: "Buy Kakebo Master System",
  pending: "Processing…",
  unavailable: "Checkout is not available yet: payments are not configured.",
};

function emittedEventNames() {
  return trackMock.mock.calls.map((c) => c[0]);
}

beforeEach(() => {
  trackMock.mockClear();
  vi.mocked(fetch).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("PremiumPurchaseButton — commerce disabled", () => {
  it("shows 'Próximamente' in Spanish and 'Coming soon' in English", () => {
    const { unmount } = render(<PremiumPurchaseButton enabled={false} labels={es} />);
    expect(screen.getByRole("button", { name: "Próximamente" })).toBeInTheDocument();
    unmount();
    render(<PremiumPurchaseButton enabled={false} labels={en} />);
    expect(screen.getByRole("button", { name: "Coming soon" })).toBeInTheDocument();
  });

  it('has aria-disabled="true", is described by the note and is not a link', () => {
    render(<PremiumPurchaseButton enabled={false} labels={es} />);
    const button = screen.getByRole("button", { name: "Próximamente" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription(es.soonNote);
    expect(button).not.toHaveAttribute("href");
    expect(button.closest("a")).toBeNull();
  });

  it("is reachable with the keyboard (focusable, not natively disabled)", () => {
    render(<PremiumPurchaseButton enabled={false} labels={es} />);
    const button = screen.getByRole("button", { name: "Próximamente" });
    expect(button).not.toBeDisabled();
    expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("does not navigate, call the API or emit analytics when activated", () => {
    const before = window.location.href;
    render(<PremiumPurchaseButton enabled={false} labels={es} />);
    const button = screen.getByRole("button", { name: "Próximamente" });

    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: " " });

    expect(window.location.href).toBe(before);
    expect(fetch).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
    expect(emittedEventNames()).not.toContain("checkout_started");
  });
});

describe("PremiumPurchaseButton — commerce enabled, Stripe not configured", () => {
  it("shows the purchase CTA", () => {
    render(<PremiumPurchaseButton enabled labels={es} />);
    expect(screen.getByRole("button", { name: es.buy })).toBeInTheDocument();
    expect(screen.queryByText("Próximamente")).toBeNull();
  });

  it("calls /api/premium/checkout and shows a clear message on a 501", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 501 } as Response);
    render(<PremiumPurchaseButton enabled labels={en} />);

    fireEvent.click(screen.getByRole("button", { name: en.buy }));

    await waitFor(() => expect(screen.getByText(en.unavailable)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/premium/checkout", { method: "POST" });
    expect(screen.getByRole("status")).toHaveTextContent(en.unavailable);
  });

  it("handles a network failure without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    render(<PremiumPurchaseButton enabled labels={es} />);

    fireEvent.click(screen.getByRole("button", { name: es.buy }));

    await waitFor(() => expect(screen.getByText(es.unavailable)).toBeInTheDocument());
  });

  it("does not emit purchase or checkout_started", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 501 } as Response);
    render(<PremiumPurchaseButton enabled labels={es} />);

    fireEvent.click(screen.getByRole("button", { name: es.buy }));
    await waitFor(() => expect(screen.getByText(es.unavailable)).toBeInTheDocument());

    expect(emittedEventNames()).not.toContain("purchase");
    expect(emittedEventNames()).not.toContain("checkout_started");
    expect(trackMock).not.toHaveBeenCalled();
  });
});
