import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import MarketingConsentPrompt from "@/components/MarketingConsentPrompt";
import CommunicationPreferencesCard from "@/components/CommunicationPreferencesCard";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="es" messages={esMessages}>{ui}</NextIntlClientProvider>
);

const apiOk = (preferences: unknown) => ({
  ok: true,
  json: async () => ({ success: true, data: { preferences, currentPrivacyPolicyVersion: "2026-11-02" } }),
});

describe("MarketingConsentPrompt (respuesta real { success, data })", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it("no se abre si el reconocimiento de la política vigente ya existe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      apiOk({ privacy_policy_acknowledged_at: "2026-11-03T10:00:00Z", privacy_policy_version: "2026-11-02" })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(wrap(<MarketingConsentPrompt />));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("se abre si no hay reconocimiento", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiOk(null)));
    render(wrap(<MarketingConsentPrompt />));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("no se abre si la API falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    render(wrap(<MarketingConsentPrompt />));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("«continuar sin» envía consentimiento false aunque la casilla esté marcada", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiOk(null))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    render(wrap(<MarketingConsentPrompt />));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText(esMessages.MarketingConsent.continueWithout));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({ marketingEmailConsent: false, privacyPolicyAcknowledged: true });
  });
});

describe("CommunicationPreferencesCard", () => {
  afterEach(() => cleanup());

  it("refleja marketing_email_consent leído de data.preferences", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiOk({ marketing_email_consent: true })));
    render(wrap(<CommunicationPreferencesCard />));
    await waitFor(() => expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true));
  });
});
