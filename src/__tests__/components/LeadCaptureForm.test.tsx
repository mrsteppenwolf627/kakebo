import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

import { LeadCaptureForm } from "@/components/mdx/LeadCaptureForm";
import { analytics } from "@/lib/analytics";

describe("LeadCaptureForm", () => {
  beforeEach(() => {
    vi.mocked(analytics.track).mockClear();
  });
  afterEach(() => cleanup());

  it("mantiene el botón desactivado hasta marcar el consentimiento", () => {
    render(<LeadCaptureForm />);
    expect(screen.getByRole("button", { name: "Suscribirme" })).toBeDisabled();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("envía el correo con consentimiento, muestra la confirmación y no manda el correo a analítica", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadCaptureForm source="plantilla_excel" />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@correo.es" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
    await waitFor(() => expect(screen.getByText("Revisa tu correo")).toBeInTheDocument());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ email: "ana@correo.es", consent: true, source: "plantilla_excel" });
    const [name, props] = vi.mocked(analytics.track).mock.calls[0];
    expect(name).toBe("generate_lead");
    expect(JSON.stringify(props)).not.toContain("ana@correo.es");
  });

  it("muestra un error si la API falla y no emite analítica", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }));
    render(<LeadCaptureForm />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@correo.es" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(analytics.track).not.toHaveBeenCalled();
  });
});
