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

  it("fires sign_up with method google once when the callback confirms a new-user signup session", async () => {
    window.sessionStorage.setItem("kakebo_signup_intent", "google");
    setUrl("?code=abc123");
    getSessionMock.mockResolvedValue({ data: { session: { user: NEW_USER } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up", { method: "google" });
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
