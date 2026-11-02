// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Reports } from "./Reports";

describe("Reports", () => {
  it("generates a report through the authenticated API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { dateRange: "Ciclo: 2026-10", totalSpent: 10, totalIncome: 100, fixedTotal: 0, savingGoal: 0, budgetBeforeExpenses: 100, availableReal: 90, expenses: [], incomes: [], expensesByCategory: { survival: 10 } } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Reports accessToken="token" apiBaseUrl="https://api.example" />);
    fireEvent.click(screen.getByRole("button", { name: "Generar informe" }));
    await waitFor(() => expect(screen.getByText("Ciclo: 2026-10")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/reports", expect.objectContaining({ method: "POST" }));
  });
});
