import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

const getSessionMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      exchangeCodeForSession: (...args: unknown[]) => exchangeCodeForSessionMock(...args),
    },
  }),
}));

import AuthCallbackPage from "@/app/[locale]/auth/callback/page";

const NEW_USER = {
  id: "user-new",
  created_at: "2026-09-03T10:00:00.000Z",
  last_sign_in_at: "2026-09-03T10:00:01.000Z",
};

const RETURNING_USER = {
  id: "user-old",
  created_at: "2020-01-01T00:00:00.000Z",
  last_sign_in_at: "2026-09-03T10:00:01.000Z",
};

function setUrl(search: string) {
  window.history.pushState({}, "", `/auth/callback${search}`);
}

describe("AuthCallbackPage sign_up tracking", () => {
  beforeEach(() => {
    trackMock.mockClear();
    replaceMock.mockClear();
    getSessionMock.mockReset();
    exchangeCodeForSessionMock.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("fires sign_up (compat) and sign_up_confirmed with method google and source direct when the callback confirms a new-user signup session", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock).toHaveBeenCalledWith("sign_up", { method: "google" });
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "google", source: "direct" });
  });

  it("recovers the source stored with the Google signup intent in sign_up_confirmed", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    window.sessionStorage.setItem("kakebo_signup_source", "calculadora_ahorro");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "google", source: "calculadora_ahorro" });
    expect(window.sessionStorage.getItem("kakebo_signup_source")).toBeNull();
    expect(window.sessionStorage.getItem("kakebo_signup_intent")).toBeNull();
  });

  it("consumes the intent flag so a reload of the callback does not fire sign_up again", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_USER } }, error: null });

    const { unmount } = render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
    unmount();

    trackMock.mockClear();
    replaceMock.mockClear();

    // Simulate a reload: intent flag is gone from sessionStorage now.
    render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up for a normal Google login (no signup intent set)", async () => {
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: RETURNING_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up when signup intent was set but the account is an existing user", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: RETURNING_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up before a session is confirmed (OAuth error)", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?error=access_denied&error_description=denied");

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("/login?error=")));

    expect(trackMock).not.toHaveBeenCalled();
  });
});


// An email account that signed up at 10:00 and clicked the confirmation link
// 2.5 hours later: created_at and last_sign_in_at are far apart, which is exactly
// what isLikelyNewUser would reject.
const EMAIL_CONFIRMED_USER = {
  id: "user-email",
  email: "new@example.com",
  app_metadata: { provider: "email" },
  created_at: "2026-09-03T10:00:00.000Z",
  email_confirmed_at: "2026-09-03T12:30:00.000Z",
  confirmed_at: "2026-09-03T12:30:00.000Z",
  last_sign_in_at: "2026-09-03T12:30:01.000Z",
};

describe("AuthCallbackPage sign_up_confirmed tracking for email signups", () => {
  beforeEach(() => {
    trackMock.mockClear();
    replaceMock.mockClear();
    getSessionMock.mockReset();
    exchangeCodeForSessionMock.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  function setPendingEmailSignup(email = "new@example.com", source = "blog_excel") {
    window.sessionStorage.setItem("kakebo_email_signup_pending", email);
    window.sessionStorage.setItem("kakebo_email_signup_source", source);
  }

  function mockSessionUser(user: Record<string, unknown>) {
    getSessionMock.mockResolvedValue({ data: { session: { user } }, error: null });
  }

  async function renderAndWaitForRedirect() {
    render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
  }

  function confirmedEvents() {
    return trackMock.mock.calls.filter((call) => call[0] === "sign_up_confirmed");
  }

  it("confirms an email signup several hours after created_at, using the sessionStorage source as fallback", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "blog_excel" });
  });

  it("does not use isLikelyNewUser for email: a confirmation days after signup still counts", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser({
      ...EMAIL_CONFIRMED_USER,
      created_at: "2026-08-01T10:00:00.000Z",
    });

    await renderAndWaitForRedirect();

    expect(confirmedEvents()).toHaveLength(1);
  });

  it("accepts confirmed_at when email_confirmed_at is null", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser({ ...EMAIL_CONFIRMED_USER, email_confirmed_at: null });

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "blog_excel" });
  });

  it("confirms in another browser using the source carried by the callback URL (no sessionStorage)", async () => {
    setUrl("?source=calculator_503020&code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "calculator_503020" });
  });

  it("prefers the URL source over the sessionStorage source", async () => {
    setPendingEmailSignup("new@example.com", "stale_source");
    setUrl("?source=calculadora_ahorro&code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "calculadora_ahorro" });
  });

  it("also confirms when the session is created by exchangeCodeForSession", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    // The session only exists once the code has been exchanged (state-based so it
    // does not depend on how many times the effect re-runs).
    let exchanged = false;
    exchangeCodeForSessionMock.mockImplementation(async () => {
      exchanged = true;
      return { error: null };
    });
    getSessionMock.mockImplementation(async () => ({
      data: { session: exchanged ? { user: EMAIL_CONFIRMED_USER } : null },
      error: null,
    }));

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "blog_excel" });
  });

  it("does not fire for an unconfirmed email user", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser({ ...EMAIL_CONFIRMED_USER, email_confirmed_at: null, confirmed_at: null });

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire for an unconfirmed user even when the URL carries a source", async () => {
    setUrl("?source=blog_excel&code=abc123");
    mockSessionUser({ ...EMAIL_CONFIRMED_USER, email_confirmed_at: null, confirmed_at: null });

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire for an existing confirmed user logging in long after confirming, and still consumes the marks", async () => {
    setPendingEmailSignup("new@example.com");
    setUrl("?code=abc123");
    mockSessionUser({
      ...EMAIL_CONFIRMED_USER,
      created_at: "2020-01-01T00:00:00.000Z",
      email_confirmed_at: "2020-01-01T00:05:00.000Z",
      confirmed_at: "2020-01-01T00:05:00.000Z",
      last_sign_in_at: "2026-09-03T10:00:01.000Z",
    });

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
  });

  it("does not fire for a normal login without any signup mark or URL source", async () => {
    setUrl("?code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire when the session email differs from the pending signup email", async () => {
    setPendingEmailSignup("someone-else@example.com");
    setUrl("?code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not report an email confirmation for a Google account that has a stale email mark", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser({
      ...EMAIL_CONFIRMED_USER,
      app_metadata: { provider: "google" },
    });

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("still tracks a new Google user with the Google heuristic (not the email path)", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    window.sessionStorage.setItem("kakebo_signup_source", "calculadora_ahorro");
    setUrl("?code=abc123");
    mockSessionUser({
      ...NEW_USER,
      app_metadata: { provider: "google" },
      email_confirmed_at: NEW_USER.created_at,
    });

    await renderAndWaitForRedirect();

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock).toHaveBeenCalledWith("sign_up", { method: "google" });
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "google", source: "calculadora_ahorro" });
  });

  it("does not track an existing Google user even with Google signup intent", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?code=abc123");
    mockSessionUser({ ...RETURNING_USER, app_metadata: { provider: "google" } });

    await renderAndWaitForRedirect();

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("consumes the pending marks and does not fire again when the callback is reloaded", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    const { unmount } = render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
    unmount();

    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
    expect(window.sessionStorage.getItem("kakebo_email_signup_source")).toBeNull();

    trackMock.mockClear();
    replaceMock.mockClear();

    render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire twice when the URL still carries the source on a second run (duplicate guard)", async () => {
    setUrl("?source=blog_excel&code=abc123");
    mockSessionUser(EMAIL_CONFIRMED_USER);

    const { unmount } = render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
    unmount();
    expect(confirmedEvents()).toHaveLength(1);

    trackMock.mockClear();
    replaceMock.mockClear();

    // Same URL (source still present), no sessionStorage marks left.
    render(<AuthCallbackPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire any confirmation when the callback returns an OAuth error", async () => {
    setPendingEmailSignup();
    setUrl("?source=blog_excel&error=access_denied&error_description=denied");

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("/login?error=")));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("fires a single sign_up_confirmed when both Google intent and an email mark are present for a Google user", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setPendingEmailSignup();
    setUrl("?code=abc123");
    mockSessionUser({ ...NEW_USER, email: "new@example.com" });

    await renderAndWaitForRedirect();

    expect(confirmedEvents()).toHaveLength(1);
    expect(confirmedEvents()[0][1]).toMatchObject({ method: "google" });
  });
});
