// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Dashboard } from "./Dashboard";

afterEach(cleanup);

it("calcula el resumen con configuración e ingresos y gastos del ciclo", async () => {
  const from = vi.fn((table: string) => {
    const data = table === "user_settings" ? [{ monthly_income: 1000, monthly_saving_goal: 200, current_balance: 500 }]
      : table === "months" ? { id: "cycle" } : table === "expenses" ? [{ amount: 120 }] : [{ amount: 300 }];
    const query = { select: () => query, eq: () => query, limit: () => Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }), maybeSingle: () => Promise.resolve({ data, error: null }), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }).then(resolve) };
    return query;
  });
  render(<Dashboard client={{ from } as unknown as SupabaseClient} userId="user" />);
  expect(await screen.findByText(/1180,00/)).toBeTruthy();
  expect(screen.getByText(/120,00/)).toBeTruthy();
  expect(screen.getByText(/1300,00/)).toBeTruthy();
});
