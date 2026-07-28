import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup, fireEvent } from "@testing-library/react";

// Module-level flag so each test can pick which locale the mocked <Link>
// simulates — mirrors next-intl's real `localePrefix: 'as-needed'` behavior
// (verified against production: /herramientas -> /en/herramientas on the
// English locale), without needing next-intl's real client navigation stack
// (which pulls in next/navigation, unresolvable in this Vitest environment).
let mockLocale: "es" | "en" = "es";

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const isHashOrExternal = typeof href === "string" && (href.startsWith("#") || href.startsWith("http"));
    const finalHref = mockLocale === "en" && !isHashOrExternal ? `/en${href}` : href;
    return (
      <a href={finalHref} {...rest}>
        {children}
      </a>
    );
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

const dict: Record<string, string> = {
  tools: "tools",
  toolsMenuToggle: "toolsMenuToggle",
  toolsSavings: "toolsSavings",
  tools503020: "tools503020",
  toolsInflation: "toolsInflation",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => dict[key] ?? key,
}));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }));
vi.mock("@/components/LanguageSwitcher", () => ({ default: () => <div data-testid="lang-switcher" /> }));

import { Navbar } from "@/components/landing/Navbar";

afterEach(() => {
  cleanup();
  mockLocale = "es";
});

describe("Navbar - tools hub link", () => {
  it("renders a real <a href='/herramientas'> for the Spanish locale", () => {
    mockLocale = "es";
    render(<Navbar />);
    const link = screen.getByRole("link", { name: "tools" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/herramientas");
  });

  it("renders a real <a href='/en/herramientas'> for the English locale", () => {
    mockLocale = "en";
    render(<Navbar />);
    const link = screen.getByRole("link", { name: "tools" });
    expect(link).toHaveAttribute("href", "/en/herramientas");
  });

  it("keeps the dropdown toggle as an independent, focusable button", () => {
    render(<Navbar />);
    const button = screen.getByRole("button", { name: "toolsMenuToggle" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-controls", "tools-dropdown-menu");
  });

  it("does not nest a <button> inside the hub link, nor an <a> inside the toggle button", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: "tools" });
    const button = screen.getByRole("button", { name: "toolsMenuToggle" });

    expect(link.querySelector("button")).toBeNull();
    expect(button.querySelector("a")).toBeNull();
    expect(link.contains(button)).toBe(false);
    expect(button.contains(link)).toBe(false);
  });

  it("opens and closes the dropdown via the toggle button only", () => {
    render(<Navbar />);
    const button = screen.getByRole("button", { name: "toolsMenuToggle" });
    const menu = document.getElementById("tools-dropdown-menu")!;

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(menu.className).toContain("opacity-0");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(menu.className).toContain("opacity-100");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(menu.className).toContain("opacity-0");
  });

  it("still shows the 3 individual tool links inside the dropdown", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /toolsSavings/ })).toHaveAttribute(
      "href",
      "/herramientas/calculadora-ahorro"
    );
    expect(screen.getByRole("link", { name: /tools503020/ })).toHaveAttribute(
      "href",
      "/herramientas/regla-50-30-20"
    );
    expect(screen.getByRole("link", { name: /toolsInflation/ })).toHaveAttribute(
      "href",
      "/herramientas/calculadora-inflacion"
    );
  });

  it("closes the dropdown state when the hub link itself is activated", () => {
    render(<Navbar />);
    const button = screen.getByRole("button", { name: "toolsMenuToggle" });
    const link = screen.getByRole("link", { name: "tools" });

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(link);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("renders a real hub link in the mobile menu too", () => {
    render(<Navbar />);
    const mobileToggle = screen.getByRole("button", { name: /menú/i });
    fireEvent.click(mobileToggle);

    const mobileNav = screen.getByLabelText("Menú principal");
    const mobileHubLink = within(mobileNav).getByRole("link", { name: "tools" });
    expect(mobileHubLink.tagName).toBe("A");
    expect(mobileHubLink).toHaveAttribute("href", "/herramientas");
  });
});
