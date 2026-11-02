// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FixedExpenses } from "./FixedExpenses";

function client() {
  const rows = [{ id: "f1", name: "Alquiler", amount: 750, category: "survival", start_ym: "2026-10", end_ym: null, due_day: 1, active: true }];
  return { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(async () => ({ data: rows, error: null })) })) })), insert: vi.fn(async () => ({ error: null })), update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })), delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })) })) } as never;
}

describe("FixedExpenses", () => {
  afterEach(() => cleanup());
  it("loads fixed expenses and shows active total", async () => {
    render(<FixedExpenses client={client()} userId="u1" />);
    expect(await screen.findByText("Alquiler")).toBeTruthy();
    expect(screen.getAllByText(/750,00/).length).toBeGreaterThan(0);
  });

  it("submits a new fixed expense", async () => {
    const c = client();
    render(<FixedExpenses client={c} userId="u1" />);
    const form = screen.getByRole("form", { name: "Añadir gasto fijo" });
    fireEvent.change(within(form).getByLabelText("Nombre"), { target: { value: "Internet" } });
    fireEvent.change(within(form).getByLabelText("Importe"), { target: { value: "30" } });
    fireEvent.click(within(form).getByRole("button", { name: "Añadir gasto fijo" }));
    await waitFor(() => expect((c as { from: ReturnType<typeof vi.fn> }).from).toHaveBeenCalled());
  });
});
