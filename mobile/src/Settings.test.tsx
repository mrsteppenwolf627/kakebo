// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Settings } from "./Settings";

afterEach(cleanup);

it("carga y guarda los ajustes mediante Supabase", async () => {
  const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { monthly_income: 1000 }, error: null })) })) })), upsert: vi.fn(async () => ({ error: null })) })) } as never;
  render(<Settings client={client} userId="u1" />);
  const income = await screen.findByDisplayValue("1000");
  fireEvent.change(income, { target: { value: "1200" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar ajustes" }));
  await waitFor(() => expect(screen.getByText("Ajustes guardados.")).toBeTruthy());
});
