import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NewsletterConfirmationNotice } from "@/components/mdx/NewsletterConfirmationNotice";

describe("NewsletterConfirmationNotice", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("muestra la confirmación y limpia el parámetro", () => {
    window.history.replaceState(null, "", "/blog/plantilla-kakebo-excel?newsletter=confirmed");
    render(<NewsletterConfirmationNotice />);
    expect(screen.getByText("Suscripción confirmada")).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("muestra aviso de enlace no válido", () => {
    window.history.replaceState(null, "", "/x?newsletter=invalid");
    render(<NewsletterConfirmationNotice />);
    expect(screen.getByRole("alert").textContent).toContain("Enlace no válido");
  });

  it("muestra aviso de error", () => {
    window.history.replaceState(null, "", "/x?newsletter=error");
    render(<NewsletterConfirmationNotice />);
    expect(screen.getByRole("alert").textContent).toContain("No hemos podido");
  });

  it("no renderiza nada sin parámetro o con valor desconocido", () => {
    window.history.replaceState(null, "", "/x?newsletter=otro");
    const { container } = render(<NewsletterConfirmationNotice />);
    expect(container.innerHTML).toBe("");
  });
});
