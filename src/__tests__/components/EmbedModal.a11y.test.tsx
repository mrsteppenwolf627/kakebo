import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { EmbedModal } from "@/components/landing/tools/EmbedModal";

afterEach(() => cleanup());

function Harness({ locale = "es" as "es" | "en" }) {
  const [open, setOpen] = useState(false);
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : esMessages}>
      <button type="button" data-testid="before">
        before
      </button>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        open
      </button>
      <EmbedModal isOpen={open} onClose={() => setOpen(false)} toolPath="/herramientas/calculadora-ahorro" />
    </NextIntlClientProvider>
  );
}

const tab = (shift = false) => fireEvent.keyDown(document, { key: "Tab", shiftKey: shift });

describe("EmbedModal accesibilidad", () => {
  it("expone role=dialog, aria-modal y nombre accesible", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("opener"));
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelId = dialog.getAttribute("aria-labelledby") as string;
    expect(document.getElementById(labelId)?.textContent).toBe(esMessages.Tools.Common.embed.title);
    expect(screen.getByRole("dialog", { name: esMessages.Tools.Common.embed.title })).toBe(dialog);
  });

  it("el botón de cierre tiene etiqueta traducida", () => {
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByTestId("opener"));
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeTruthy();
    unmount();
    render(<Harness locale="en" />);
    fireEvent.click(screen.getByTestId("opener"));
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("al abrir, el foco entra en el diálogo (botón de cierre)", () => {
    render(<Harness />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar" }));
  });

  it("Tab y Shift+Tab ciclan dentro del diálogo", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("opener"));
    const close = screen.getByRole("button", { name: "Cerrar" });
    const copy = screen.getByRole("button", { name: esMessages.Tools.Common.embed.copy });

    expect(document.activeElement).toBe(close);
    // Último → primero con Tab
    copy.focus();
    tab();
    expect(document.activeElement).toBe(close);
    // Primero → último con Shift+Tab
    tab(true);
    expect(document.activeElement).toBe(copy);
    // Si el foco estuviera fuera, vuelve dentro
    screen.getByTestId("before").focus();
    tab();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });

  it("Escape cierra el diálogo y el foco vuelve exactamente al control que lo abrió", () => {
    render(<Harness />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.activeElement).not.toBe(opener);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("cerrar con el botón también devuelve el foco al control de apertura", () => {
    render(<Harness />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("Escape no hace nada cuando el modal está cerrado", () => {
    const onClose = vi.fn();
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <EmbedModal isOpen={false} onClose={onClose} toolPath="/x" />
      </NextIntlClientProvider>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
