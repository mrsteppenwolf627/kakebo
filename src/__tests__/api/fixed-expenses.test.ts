import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/fixed-expenses/route";

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

describe("Fixed Expenses API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/fixed-expenses", () => {
    it("should return list of fixed expenses", async () => {
      const mockFixedExpenses = [
        {
          id: "fixed-1",
          user_id: "user-123",
          name: "Rent",
          amount: 850,
          category: "survival",
          start_ym: "2025-01",
          active: true,
        },
        {
          id: "fixed-2",
          user_id: "user-123",
          name: "Netflix",
          amount: 15.99,
          category: "culture",
          start_ym: "2024-06",
          active: true,
        },
      ];

      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: typeof mockFixedExpenses; error: null }) => void) =>
          resolve({ data: mockFixedExpenses, error: null }),
      });

      const request = new NextRequest("http://localhost/api/fixed-expenses");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should filter by active status", async () => {
      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: []; error: null }) => void) =>
          resolve({ data: [], error: null }),
      });

      const request = new NextRequest(
        "http://localhost/api/fixed-expenses?active=true"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith("active", true);
    });

    it("should filter by category", async () => {
      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: []; error: null }) => void) =>
          resolve({ data: [], error: null }),
      });

      const request = new NextRequest(
        "http://localhost/api/fixed-expenses?category=survival"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith("category", "survival");
    });
  });

  describe("POST /api/fixed-expenses", () => {
    it("should create a new fixed expense", async () => {
      const newFixedExpense = {
        name: "Gym Membership",
        amount: 40,
        category: "culture",
        start_ym: "2025-01",
        due_day: 15,
      };

      const createdFixedExpense = {
        id: "fixed-new",
        user_id: "user-123",
        ...newFixedExpense,
        active: true,
        end_ym: null,
        created_at: "2025-01-15T10:00:00Z",
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: createdFixedExpense,
        error: null,
      });

      const request = new NextRequest("http://localhost/api/fixed-expenses", {
        method: "POST",
        body: JSON.stringify(newFixedExpense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Gym Membership");
    });

    it("should return 422 for missing required fields", async () => {
      const request = new NextRequest("http://localhost/api/fixed-expenses", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }), // Missing amount, category, start_ym
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 422 for invalid due_day", async () => {
      const request = new NextRequest("http://localhost/api/fixed-expenses", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          amount: 100,
          category: "survival",
          start_ym: "2025-01",
          due_day: 32, // Invalid
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for end_ym before start_ym", async () => {
      const request = new NextRequest("http://localhost/api/fixed-expenses", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          amount: 100,
          category: "survival",
          start_ym: "2025-06",
          end_ym: "2025-01", // Before start
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should accept all valid categories", async () => {
      const categories = ["survival", "optional", "culture", "extra"];

      for (const category of categories) {
        vi.clearAllMocks();

        mockSupabase.single.mockResolvedValueOnce({
          data: {
            id: `fixed-${category}`,
            name: "Test",
            amount: 100,
            category,
            start_ym: "2025-01",
          },
          error: null,
        });

        const request = new NextRequest("http://localhost/api/fixed-expenses", {
          method: "POST",
          body: JSON.stringify({
            name: "Test",
            amount: 100,
            category,
            start_ym: "2025-01",
          }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      }
    });
  });
});
