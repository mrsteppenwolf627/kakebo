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

describe("AuthCallbackPage sign_up_confirmed tracking for email signups", () => {
  const NEW_EMAIL_USER = { ...NEW_USER, email: "new@example.com" };

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

  it("fires sign_up_confirmed with method email and the stored source for a new account after a pending email signup", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_EMAIL_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "blog_excel" });
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
      data: { session: exchanged ? { user: NEW_EMAIL_USER } : null },
      error: null,
    }));

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "blog_excel" });
  });

  it("defaults the source to direct when only the pending email mark is present", async () => {
    window.sessionStorage.setItem("kakebo_email_signup_pending", "new@example.com");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_EMAIL_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledWith("sign_up_confirmed", { method: "email", source: "direct" });
  });

  it("consumes the pending marks so a reload does not fire sign_up_confirmed again", async () => {
    setPendingEmailSignup();
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_EMAIL_USER } }, error: null });

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

  it("does not fire sign_up_confirmed for an existing user even with a pending email mark, and still consumes the marks", async () => {
    setPendingEmailSignup("old@example.com");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: { ...RETURNING_USER, email: "old@example.com" } } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
  });

  it("does not fire sign_up_confirmed for a normal login without pending marks", async () => {
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: RETURNING_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up_confirmed when the session email differs from the pending signup email", async () => {
    setPendingEmailSignup("someone-else@example.com");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_EMAIL_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire any confirmation when the callback returns an OAuth error", async () => {
    setPendingEmailSignup();
    setUrl("?error=access_denied&error_description=denied");

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("/login?error=")));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("fires a single sign_up_confirmed when both Google intent and an email mark are present", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setPendingEmailSignup();
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_EMAIL_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    const confirmed = trackMock.mock.calls.filter((call) => call[0] === "sign_up_confirmed");
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0][1]).toMatchObject({ method: "google" });
  });
});
