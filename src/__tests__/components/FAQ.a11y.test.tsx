import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { FAQ } from "@/components/landing/FAQ";

afterEach(cleanup);

const renderFaq = (locale: "es" | "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "es" ? esMessages : enMessages}>
      <FAQ />
    </NextIntlClientProvider>,
  );

describe("FAQ de la home: accesibilidad del acordeón", () => {
  it.each(["es", "en"] as const)("5 botones con aria-expanded=false al inicio y aria-controls hacia un panel existente (%s)", (locale) => {
    const { container } = renderFaq(locale);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    for (const b of buttons) {
      expect(b.getAttribute("aria-expanded")).toBe("false");
      const panelId = b.getAttribute("aria-controls");
      expect(panelId).toBeTruthy();
      const panel = container.querySelector(`[id="${panelId}"]`);
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute("role")).toBe("region");
      expect(panel?.getAttribute("aria-labelledby")).toBe(b.id);
    }
  });

  it("al hacer clic pasa a aria-expanded=true y solo ese botón; otro clic lo cierra", () => {
    renderFaq("es");
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(second.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("ids únicos entre las 5 preguntas y entre dos instancias (ES y EN a la vez)", () => {
    const { container } = render(
      <>
        <NextIntlClientProvider locale="es" messages={esMessages}><FAQ /></NextIntlClientProvider>
        <NextIntlClientProvider locale="en" messages={enMessages}><FAQ /></NextIntlClientProvider>
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((n) => n.id).filter((id) => id !== "faq");
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it("las 5 respuestas siguen en el DOM aunque estén colapsadas (criterio del audit)", () => {
    const { container } = renderFaq("es");
    const panels = container.querySelectorAll('[role="region"]');
    expect(panels).toHaveLength(5);
    for (const p of panels) expect((p.textContent ?? "").trim().length).toBeGreaterThan(20);
  });
});
