import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

import { ChoiceCTA, DownloadCTA, ToolCTA, SimpleCTA, ArticleCTA } from "@/components/mdx/MDXClientCTAs";

beforeEach(() => {
  trackMock.mockClear();
  window.history.pushState({}, "", "/blog/plantilla-kakebo-excel");
});

afterEach(() => {
  cleanup();
});

describe("ChoiceCTA analytics", () => {
  const props = {
    title: "Elige cómo llevar tu Kakebo",
    description: "desc",
    primaryHref: "/app",
    primaryCta: "Usar Kakebo online gratis",
    primaryLocation: "plantilla_excel_intro",
    secondaryHref: "#descarga-plantilla-excel",
    secondaryCta: "Prefiero la plantilla Excel",
  };

  it("fires click_excel_to_app exactly once with the exact payload when the primary CTA is clicked", () => {
    render(<ChoiceCTA {...props} />);

    fireEvent.click(screen.getByRole("link", { name: "Usar Kakebo online gratis" }));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("click_excel_to_app", {
      source_page: "/blog/plantilla-kakebo-excel",
      cta_label: "Usar Kakebo online gratis",
      cta_location: "plantilla_excel_intro",
      destination_path: "/app",
      source: "direct",
    });
  });

  it("propagates the source of the primary link into click_excel_to_app", () => {
    render(<ChoiceCTA {...props} primaryHref="/login?mode=signup&source=blog_excel" />);

    fireEvent.click(screen.getByRole("link", { name: "Usar Kakebo online gratis" }));

    expect(trackMock).toHaveBeenCalledWith(
      "click_excel_to_app",
      expect.objectContaining({ source: "blog_excel" })
    );
  });

  it("does not fire click_cta_login on the same click", () => {
    render(<ChoiceCTA {...props} />);

    fireEvent.click(screen.getByRole("link", { name: "Usar Kakebo online gratis" }));

    const calledEvents = trackMock.mock.calls.map((call) => call[0]);
    expect(calledEvents).not.toContain("click_cta_login");
  });

  it("does not fire click_excel_to_app when the secondary CTA is clicked", () => {
    render(<ChoiceCTA {...props} />);

    fireEvent.click(screen.getByRole("link", { name: "Prefiero la plantilla Excel" }));

    expect(trackMock).not.toHaveBeenCalled();
  });
});

describe("click_cta_login source attribution", () => {
  it("ToolCTA sends the source from its href", () => {
    render(<ToolCTA title="t" description="d" href="/login?source=tool_blog" cta="Empieza gratis" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza gratis" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ source: "tool_blog" }));
  });

  it("ToolCTA falls back to source direct when the href has none", () => {
    render(<ToolCTA title="t" description="d" href="/login" cta="Empieza gratis" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza gratis" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ source: "direct" }));
  });

  it("SimpleCTA sends the source from its href", () => {
    render(<SimpleCTA href="/login?mode=signup&source=blog_simple" cta="Empieza" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ source: "blog_simple" }));
  });

  it("SimpleCTA falls back to source direct", () => {
    render(<SimpleCTA href="/login" cta="Empieza" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ source: "direct" }));
  });

  it("ArticleCTA sends the source from its href and falls back to direct", () => {
    const { unmount } = render(<ArticleCTA href="/login?source=blog_article" cta="Ahora">x</ArticleCTA>);
    fireEvent.click(screen.getByRole("link", { name: "Ahora" }));
    expect(trackMock).toHaveBeenLastCalledWith("click_cta_login", expect.objectContaining({ source: "blog_article" }));
    unmount();

    render(<ArticleCTA href="/login" cta="Ahora">x</ArticleCTA>);
    fireEvent.click(screen.getByRole("link", { name: "Ahora" }));
    expect(trackMock).toHaveBeenLastCalledWith("click_cta_login", expect.objectContaining({ source: "direct" }));
  });
});

describe("other CTA components keep their previous behavior", () => {
  it("DownloadCTA fires only download_template", () => {
    render(<DownloadCTA href="/templates/kakebo.xlsx" cta="Descargar Plantilla" />);

    fireEvent.click(screen.getByRole("link", { name: "Descargar Plantilla" }));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("download_template", {
      template_type: "excel",
      source_page: "/blog/plantilla-kakebo-excel",
      location: "blog_download_cta",
    });
  });

  it("ToolCTA still fires click_cta_login for a login-style href", () => {
    render(<ToolCTA title="t" description="d" href="/login" cta="Empieza gratis" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza gratis" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ cta_label: "Empieza gratis" }));
  });

  it("SimpleCTA still fires click_cta_login", () => {
    render(<SimpleCTA href="/login" cta="Empieza gratis y di adiós al Excel" />);

    fireEvent.click(screen.getByRole("link", { name: "Empieza gratis y di adiós al Excel" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ cta_label: "Empieza gratis y di adiós al Excel" }));
  });

  it("ArticleCTA still fires click_cta_login", () => {
    render(<ArticleCTA href="/login" cta="Empieza ahora">contenido</ArticleCTA>);

    fireEvent.click(screen.getByRole("link", { name: "Empieza ahora" }));

    expect(trackMock).toHaveBeenCalledWith("click_cta_login", expect.objectContaining({ cta_label: "Empieza ahora" }));
  });
});
