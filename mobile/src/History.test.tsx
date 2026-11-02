// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { History } from "./History";

afterEach(cleanup);

describe("historial de ciclos", () => {
  it("muestra un ciclo cerrado y sus movimientos filtrados por usuario", async () => {
    const filters: string[] = [];
    const from = vi.fn((table: string) => {
      const result = table === "months"
        ? [{ id: "closed", year: 2026, month: 9, status: "closed" }]
        : table === "expenses" ? [{ id: "e", date: "2026-09-10", amount: 10, category: "culture", note: "Libro" }]
        : [];
      const query = {
        select: () => query,
        eq: (field: string, value: string) => { filters.push(`${table}:${field}=${value}`); return query; },
        order: () => query,
        limit: () => Promise.resolve({ data: result, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: result, error: null }).then(resolve),
      };
      return query;
    });
    render(<History client={{ from } as unknown as SupabaseClient} userId="u1" />);
    const select = await screen.findByLabelText("Ciclo cerrado");
    fireEvent.change(select, { target: { value: "closed" } });
    expect(await screen.findByText(/Libro/)).toBeTruthy();
    expect(screen.getByText("No hay ingresos en este ciclo.")).toBeTruthy();
    expect(filters).toEqual(expect.arrayContaining([
      "months:user_id=u1", "months:status=closed", "expenses:user_id=u1", "expenses:month_id=closed", "incomes:user_id=u1", "incomes:month_id=closed",
    ]));
  });
});
