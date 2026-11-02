// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NewExpense } from "./NewExpense";

afterEach(cleanup);

describe("nuevo gasto", () => {
  it("envía el ciclo abierto y los datos a la función de gastos", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { id: "expense" }, error: null });
    const saved = vi.fn();
    render(<NewExpense client={{ rpc } as unknown as SupabaseClient} monthId="cycle" accessToken="token" onSaved={saved} />);
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-10-20" } });
    fireEvent.change(screen.getByLabelText("Importe (€)"), { target: { value: "12.5" } });
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "culture" } });
    fireEvent.change(screen.getByLabelText("Nota"), { target: { value: "Libro" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(rpc).toHaveBeenCalledWith("fn_create_expense", {
      p_month_id: "cycle", p_date: "2026-10-20", p_amount: 12.5, p_category: "culture", p_note: "Libro", p_subcategory: null,
    });
  });

  it("bloquea reenvíos si la respuesta no confirma el resultado", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("network"));
    const review = vi.fn();
    render(<NewExpense client={{ rpc } as unknown as SupabaseClient} monthId="cycle" accessToken="token" onSaved={review} />);
    fireEvent.change(screen.getByLabelText("Importe (€)"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
    expect((await screen.findByRole("alert")).textContent).toContain("No se puede confirmar");
    expect((screen.getByRole("button", { name: "Guardar gasto" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Revisar movimientos" }));
    expect(review).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
