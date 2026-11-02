// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AIMetrics } from "./AIMetrics";

describe("AIMetrics", () => {
  it("loads metrics using the bearer token", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { metrics: { totalRequests: 4 }, learning: {}, logs: [] } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AIMetrics accessToken="token" apiBaseUrl="https://api.example" />);
    await waitFor(() => expect(screen.getByText("totalRequests")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/ai/metrics?includeLogs=true&logsLimit=10", expect.objectContaining({ headers: { Authorization: "Bearer token" } }));
  });
});
