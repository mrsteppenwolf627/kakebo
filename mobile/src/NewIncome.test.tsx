// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewIncome } from "./NewIncome";

afterEach(cleanup);

describe("nuevo ingreso", () => {
  it("envía el ingreso al API con el ciclo y el token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { id: "income" } }), { status: 201 }));
    const saved = vi.fn();
    render(<NewIncome monthId="cycle" accessToken="token" apiBaseUrl="https://api.example" onSaved={saved} />);
    fireEvent.change(screen.getByLabelText("Importe (€)"), { target: { value: "1200" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Nómina" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar ingreso" }));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/incomes", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
    fetchMock.mockRestore();
  });
});
