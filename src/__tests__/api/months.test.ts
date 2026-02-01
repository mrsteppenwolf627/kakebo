import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/months/route";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock auth
const mockUser = { id: "user-123", email: "test@example.com" };
vi.mock("@/lib/api/auth", () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockUser)),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("Months API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/months", () => {
    it("should return list of months", async () => {
      const mockMonths = [
        { id: "month-1", year: 2025, month: 1, status: "open" },
        { id: "month-2", year: 2024, month: 12, status: "closed" },
      ];

      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        order: vi.fn().mockReturnValueOnce({
          then: (resolve: (value: { data: typeof mockMonths; error: null }) => void) =>
            resolve({ data: mockMonths, error: null }),
        }),
      });

      const request = new NextRequest("http://localhost/api/months");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should filter by status", async () => {
      // Chain: from -> select -> eq(user_id) -> order(year) -> order(month) -> eq(status)
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order
        .mockReturnValueOnce(mockSupabase) // first order
        .mockReturnValueOnce({
          ...mockSupabase,
          eq: vi.fn().mockReturnValueOnce({
            then: (resolve: (value: { data: []; error: null }) => void) =>
              resolve({ data: [], error: null }),
          }),
        });

      const request = new NextRequest(
        "http://localhost/api/months?status=open"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should filter by year", async () => {
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order
        .mockReturnValueOnce(mockSupabase) // first order
        .mockReturnValueOnce({
          ...mockSupabase,
          eq: vi.fn().mockReturnValueOnce({
            then: (resolve: (value: { data: []; error: null }) => void) =>
              resolve({ data: [], error: null }),
          }),
        });

      const request = new NextRequest(
        "http://localhost/api/months?year=2025"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/months", () => {
    it("should return existing month if found", async () => {
      const existingMonth = {
        id: "month-123",
        year: 2025,
        month: 1,
        status: "open",
        user_id: "user-123",
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: existingMonth,
        error: null,
      });

      const request = new NextRequest("http://localhost/api/months", {
        method: "POST",
        body: JSON.stringify({ ym: "2025-01" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("month-123");
    });

    it("should create new month if not found", async () => {
      const newMonth = {
        id: "new-month-123",
        year: 2025,
        month: 2,
        status: "open",
        savings_done: false,
        user_id: "user-123",
      };

      // Month not found
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        // Create new month
        .mockResolvedValueOnce({
          data: newMonth,
          error: null,
        });

      const request = new NextRequest("http://localhost/api/months", {
        method: "POST",
        body: JSON.stringify({ ym: "2025-02" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("new-month-123");
    });

    it("should return 422 for invalid ym format", async () => {
      const request = new NextRequest("http://localhost/api/months", {
        method: "POST",
        body: JSON.stringify({ ym: "2025/01" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
