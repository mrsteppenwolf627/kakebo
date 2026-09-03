import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const dict: Record<string, string> = {
  "leftPanel.title": "leftPanel.title",
  "leftPanel.subtitle": "leftPanel.subtitle",
  "leftPanel.features.free": "leftPanel.features.free",
  "leftPanel.features.ai": "leftPanel.features.ai",
  "leftPanel.features.privacy": "leftPanel.features.privacy",
  "form.backToHome": "Volver al inicio",
  "form.login.title": "Acceso",
  "form.login.subtitle": "Entra para ver tu calendario y gastos",
  "form.signup.title": "Crear cuenta",
  "form.signup.subtitle": "Regístrate y empieza a ahorrar gratis",
  "form.googleBtn": "Continuar con Google",
  "form.divider": "O con email",
  "form.emailLabel": "Email",
  "form.passwordLabel": "Contraseña",
  "form.submitLogin": "Entrar",
  "form.submitSignup": "Crear cuenta",
  "form.toggleToSignup": "¿No tienes cuenta? Créala aquí",
  "form.toggleToLogin": "¿Ya tienes cuenta? Entra aquí",
  "form.resendBtn": "Reenviar confirmación",
  "form.success.signup": "Cuenta creada, confirma tu email",
  "form.success.resend": "Email reenviado",
  "form.errors.unknown": "Ha ocurrido un error",
  "form.errors.notConfirmed": "Debes confirmar tu email",
};

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => dict[key] ?? key;
    t.rich = (key: string) => dict[key] ?? key;
    return t;
  },
}));

const signUpMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signInWithOAuthMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
    },
  }),
}));

import LoginPage from "@/app/[locale]/login/page";

function fillEmailPassword(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: password } });
}

describe("LoginPage sign_up tracking", () => {
  beforeEach(() => {
    trackMock.mockClear();
    signUpMock.mockReset();
    signInWithPasswordMock.mockReset();
    signInWithOAuthMock.mockClear();
    mockSearchParams = new URLSearchParams();
    window.sessionStorage.clear();
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" } as unknown as Location;
  });

  afterEach(() => {
    cleanup();
  });

  it("opens in signup mode when ?mode=signup is present", () => {
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("opens in login mode by default", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Acceso" })).toBeInTheDocument();
  });

  it("fires sign_up with method email exactly once after a successful email signup", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(trackMock).toHaveBeenCalled());

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_up", { method: "email" });
  });

  it("does not fire sign_up when email signup fails", async () => {
    signUpMock.mockResolvedValue({ error: { message: "Email already registered" } });
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("existing@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await screen.findByText("Email already registered");

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up on a normal email login", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    render(<LoginPage />);

    fillEmailPassword("existing@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(window.location.href).toBe("/app"));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not fire sign_up merely from clicking the signup submit button before Supabase resolves", () => {
    signUpMock.mockReturnValue(new Promise(() => {})); // never resolves during this test
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("marks Google signup intent in sessionStorage when signing up via Google in signup mode", async () => {
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/ }));

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("kakebo_signup_intent")).toBe("google");
  });

  it("does not mark Google signup intent when using Google from login mode", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/ }));

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("kakebo_signup_intent")).toBeNull();
  });
});
