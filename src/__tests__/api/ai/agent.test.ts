import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/ai/agent/route";

// Mock the dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

vi.mock("@/lib/api", () => ({
  responses: {
    ok: (data: any) => ({
      status: 200,
      json: async () => ({ success: true, data }),
    }),
    unauthorized: (msg: string) => ({
      status: 401,
      json: async () => ({ success: false, error: { code: "UNAUTHORIZED", message: msg } }),
    }),
    validationError: (msg: string, details: any) => ({
      status: 422,
      json: async () => ({
        success: false,
        error: { code: "VALIDATION_ERROR", message: msg, details },
      }),
    }),
  },
  requireAuth: vi.fn(),
  handleApiError: vi.fn((error: any) => ({
    status: error.status || 500,
    json: async () => ({ success: false, error: error.message }),
  })),
  withLogging: (handler: any) => handler,
}));

vi.mock("@/lib/agents", () => ({
  processAgentMessage: vi.fn().mockResolvedValue({
    message: "Test response",
    intent: "analyze_spending",
    toolsUsed: ["analyzeSpendingPattern"],
    metrics: {
      model: "gpt-4o-mini",
      latencyMs: 100,
      inputTokens: 10,
      outputTokens: 50,
      costUsd: 0.001,
      toolCalls: 1,
    },
  }),
}));

describe("POST /api/ai/agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    const { requireAuth } = await import("@/lib/api");
    const { handleApiError } = await import("@/lib/api");

    vi.mocked(requireAuth).mockRejectedValueOnce({
      status: 401,
      message: "Not authenticated",
    });

    const request = new NextRequest("http://localhost/api/ai/agent", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("should validate message field", async () => {
    const { requireAuth } = await import("@/lib/api");

    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost/api/ai/agent", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    });

    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should validate message length", async () => {
    const { requireAuth } = await import("@/lib/api");

    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
    });

    const longMessage = "x".repeat(1001);

    const request = new NextRequest("http://localhost/api/ai/agent", {
      method: "POST",
      body: JSON.stringify({ message: longMessage }),
    });

    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should process valid request", async () => {
    const { requireAuth } = await import("@/lib/api");

    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost/api/ai/agent", {
      method: "POST",
      body: JSON.stringify({
        message: "¿Cuánto he gastado?",
        history: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should accept conversation history", async () => {
    const { requireAuth } = await import("@/lib/api");

    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost/api/ai/agent", {
      method: "POST",
      body: JSON.stringify({
        message: "¿Y en comida?",
        history: [
          { role: "user" as const, content: "¿Cuánto he gastado?" },
          { role: "assistant" as const, content: "Has gastado 500€" },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});

describe("GET /api/ai/agent", () => {
  it("should return health check information", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("ready");
  });

  it("should list available capabilities", async () => {
    const response = await GET();

    const data = await response.json();
    expect(data.data.capabilities).toBeInstanceOf(Array);
    expect(data.data.capabilities.length).toBeGreaterThan(0);
  });

  it("should return model information", async () => {
    const response = await GET();

    const data = await response.json();
    expect(data.data.model).toBeDefined();
  });
});
