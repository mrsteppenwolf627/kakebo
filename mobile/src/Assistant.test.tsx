// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Assistant } from "./Assistant";

describe("Assistant", () => {
  it("sends the message with the bearer token and renders the response", async () => {
    const fetchMock = vi.fn(async () => new Response('data: {"type":"chunk","text":"Has gastado 20 €."}\n\ndata: {"type":"done"}\n\n', { status: 200, headers: { "Content-Type": "text/event-stream" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Assistant accessToken="token" apiBaseUrl="https://api.example" />);
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "¿Cuánto he gastado?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(screen.getByText(/Has gastado/)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/ai/agent-v2/stream", expect.objectContaining({ method: "POST" }));
  });
});
