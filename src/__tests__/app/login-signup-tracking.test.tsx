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
const resendMock = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      resend: (...args: unknown[]) => resendMock(...args),
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

function callsNamed(name: string) {
  return trackMock.mock.calls.filter((call) => call[0] === name);
}

describe("LoginPage sign_up tracking", () => {
  beforeEach(() => {
    trackMock.mockClear();
    signUpMock.mockReset();
    signInWithPasswordMock.mockReset();
    signInWithOAuthMock.mockClear();
    resendMock.mockReset();
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

  it("fires login_view once on load with mode signup and the source from ?source=", () => {
    mockSearchParams = new URLSearchParams("mode=signup&source=calculadora_ahorro");
    render(<LoginPage />);

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("login_view", { mode: "signup", source: "calculadora_ahorro" });
  });

  it("fires login_view with mode login and source direct when no params are present", () => {
    render(<LoginPage />);

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("login_view", { mode: "login", source: "direct" });
  });

  it("does not fire login_view again when the user toggles between login and signup", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "¿No tienes cuenta? Créala aquí" }));

    expect(callsNamed("login_view")).toHaveLength(1);
  });

  it("fires sign_up with method email and source exactly once after a successful email signup", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup&source=blog_excel");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(callsNamed("sign_up")).toHaveLength(1));

    expect(callsNamed("sign_up")[0]).toEqual(["sign_up", { method: "email", source: "blog_excel" }]);
    expect(callsNamed("sign_up_confirmed")).toHaveLength(0);
  });

  it("uses source direct on sign_up when the page has no ?source=", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(callsNamed("sign_up")).toHaveLength(1));

    expect(callsNamed("sign_up")[0]).toEqual(["sign_up", { method: "email", source: "direct" }]);
  });

  it("includes the source in the emailRedirectTo callback URL so it survives confirming in another browser", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup&source=calculator_inflation");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalled());

    const options = signUpMock.mock.calls[0][0].options;
    expect(options.emailRedirectTo).toMatch(/\/auth\/callback\?source=calculator_inflation$/);
  });

  it("uses source=direct in emailRedirectTo when the page has no ?source=", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalled());

    expect(signUpMock.mock.calls[0][0].options.emailRedirectTo).toMatch(/\/auth\/callback\?source=direct$/);
  });

  it("keeps the source in emailRedirectTo when resending the confirmation email", async () => {
    signUpMock.mockResolvedValue({ error: null });
    resendMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup&source=blog_excel");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reenviar confirmación" }));

    await waitFor(() => expect(resendMock).toHaveBeenCalled());

    expect(resendMock.mock.calls[0][0].options.emailRedirectTo).toMatch(/\/auth\/callback\?source=blog_excel$/);
  });

  it("stores the pending email signup email and source in sessionStorage after a successful signup", async () => {
    signUpMock.mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams("mode=signup&source=blog_excel");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(callsNamed("sign_up")).toHaveLength(1));

    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBe("new@example.com");
    expect(window.sessionStorage.getItem("kakebo_email_signup_source")).toBe("blog_excel");
  });

  it("does not fire sign_up nor store pending marks when email signup fails", async () => {
    signUpMock.mockResolvedValue({ error: { message: "Email already registered" } });
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("existing@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await screen.findByText("Email already registered");

    expect(callsNamed("sign_up")).toHaveLength(0);
    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
    expect(window.sessionStorage.getItem("kakebo_email_signup_source")).toBeNull();
  });

  it("does not fire sign_up nor store pending marks on a normal email login", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    render(<LoginPage />);

    fillEmailPassword("existing@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(window.location.href).toBe("/app"));

    expect(callsNamed("sign_up")).toHaveLength(0);
    expect(callsNamed("sign_up_confirmed")).toHaveLength(0);
    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
  });

  it("does not fire sign_up merely from clicking the signup submit button before Supabase resolves", () => {
    signUpMock.mockReturnValue(new Promise(() => {})); // never resolves during this test
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fillEmailPassword("new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(callsNamed("sign_up")).toHaveLength(0);
    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBeNull();
  });

  it("marks Google signup intent and its source in sessionStorage when signing up via Google in signup mode", async () => {
    mockSearchParams = new URLSearchParams("mode=signup&source=calculator_503020");
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/ }));

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("kakebo_signup_intent")).toBe("google");
    expect(window.sessionStorage.getItem("kakebo_signup_source")).toBe("calculator_503020");
  });

  it("stores source direct with the Google signup intent when the page has no ?source=", async () => {
    mockSearchParams = new URLSearchParams("mode=signup");
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/ }));

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("kakebo_signup_source")).toBe("direct");
  });

  it("does not mark Google signup intent when using Google from login mode", async () => {
    mockSearchParams = new URLSearchParams("source=calculator_503020");
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar con Google/ }));

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("kakebo_signup_intent")).toBeNull();
    expect(window.sessionStorage.getItem("kakebo_signup_source")).toBeNull();
  });
});
