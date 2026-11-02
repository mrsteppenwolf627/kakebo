// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Movements } from "./Movements";

afterEach(cleanup);

function fakeClient(options: { empty?: boolean; fail?: boolean } = {}) {
  const filters: string[] = [];
  const rows: Record<string, unknown[]> = {
    expenses: [{ id: "e", date: "2026-10-05", amount: 12, category: "culture", note: "Libro" }],
    incomes: [{ id: "i", date: "2026-10-03", amount: 100, description: "Nómina" }],
  };
  const from = vi.fn((table: string) => {
    const query = {
      select: () => query,
      eq: (field: string, value: string) => { filters.push(`${table}:${field}=${value}`); return query; },
      order: () => query,
      limit: async () => ({ data: rows[table], error: options.fail ? new Error("offline") : null }),
      maybeSingle: async () => ({ data: options.empty ? null : { id: "cycle", year: 2026, month: 10 }, error: null }),
    };
    return query;
  });
  return { client: { from } as unknown as SupabaseClient, filters };
}

describe("movimientos del ciclo", () => {
  it("muestra los movimientos y filtra ambas tablas por usuario y ciclo", async () => {
    const { client, filters } = fakeClient();
    render(<Movements client={client} userId="user-1" accessToken="token" />);
    expect(await screen.findByText(/Libro/)).toBeTruthy();
    expect(screen.getByText(/Nómina/)).toBeTruthy();
    expect(screen.getByText(/Ciclo abierto: 10\/2026/)).toBeTruthy();
    expect(filters).toEqual(expect.arrayContaining([
      "months:user_id=user-1", "months:status=open", "expenses:user_id=user-1", "expenses:month_id=cycle",
      "incomes:user_id=user-1", "incomes:month_id=cycle",
    ]));
  });

  it("informa cuando no existe un ciclo abierto", async () => {
    const { client } = fakeClient({ empty: true });
    render(<Movements client={client} userId="user-1" accessToken="token" />);
    expect(await screen.findByText("No hay ningún ciclo abierto.")).toBeTruthy();
  });

  it("muestra el error y permite reintentar", async () => {
    const { client } = fakeClient({ fail: true });
    render(<Movements client={client} userId="user-1" accessToken="token" />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(client.from).toHaveBeenCalledTimes(6));
  });
});
