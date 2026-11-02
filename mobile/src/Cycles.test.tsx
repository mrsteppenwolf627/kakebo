// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cycles } from "./Cycles";

describe("Cycles", () => {
  it("lists cycles and closes an open cycle through the API", async () => {
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => options?.method === "PATCH" ? new Response(JSON.stringify({ data: {} }), { status: 200 }) : new Response(JSON.stringify({ data: [{ id: "m1", year: 2026, month: 10, status: "open" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Cycles accessToken="token" apiBaseUrl="https://api.example" />);
    expect(await screen.findByText(/2026-10/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar ciclo" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/months/m1", expect.objectContaining({ method: "PATCH" })));
  });
});
