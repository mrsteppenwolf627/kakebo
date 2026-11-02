import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/expenses/route";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(),
  // Fase 3.B: la creación de gastos pasa por fn_create_expense (RPC), no por
  // un INSERT directo -- ver docs/planning/phase-3-monetizacion.md §3.B.2.
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

// Mock auth
const mockUser = { id: "user-123", email: "test@example.com" };
vi.mock("@/lib/api/auth", () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockUser)),
  getOptionalAuth: vi.fn(() => Promise.resolve(mockUser)),
}));

// Mock logger to avoid console output in tests
vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("Expenses API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/expenses", () => {
    it("should return list of expenses", async () => {
      const mockExpenses = [
        {
          id: "exp-1",
          user_id: "user-123",
          date: "2025-01-15",
          amount: 25.5,
          category: "survival",
          note: "Test expense",
        },
      ];

      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: typeof mockExpenses; error: null }) => void) =>
          resolve({ data: mockExpenses, error: null }),
      } as never);

      const request = new NextRequest("http://localhost/api/expenses");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExpenses);
    });

    it("should filter by year-month", async () => {
      mockSupabase.lt.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: []; error: null }) => void) =>
          resolve({ data: [], error: null }),
      } as never);

      const request = new NextRequest(
        "http://localhost/api/expenses?ym=2025-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.gte).toHaveBeenCalled();
      expect(mockSupabase.lt).toHaveBeenCalled();
    });

    it("should filter by category", async () => {
      mockSupabase.order.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: []; error: null }) => void) =>
          resolve({ data: [], error: null }),
      } as never);

      const request = new NextRequest(
        "http://localhost/api/expenses?category=survival"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Verify category filter was applied
      expect(mockSupabase.eq).toHaveBeenCalledWith("category", "survival");
    });

    it("should return 422 for invalid query params", async () => {
      const request = new NextRequest(
        "http://localhost/api/expenses?category=invalid_category"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/expenses", () => {
    it("should create a new expense", async () => {
      const newExpense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
        note: "Grocery shopping",
      };

      const mockMonth = { id: "month-123", status: "open" };
      const mockCreatedExpense = {
        id: "exp-new",
        user_id: "user-123",
        month_id: "month-123",
        ...newExpense,
        created_at: "2025-01-15T10:00:00Z",
      };

      // Mock finding existing month
      mockSupabase.single.mockResolvedValueOnce({ data: mockMonth, error: null });
      // Mock creating expense via fn_create_expense RPC
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCreatedExpense, error: null });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(newExpense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("exp-new");
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "fn_create_expense",
        expect.objectContaining({
          p_month_id: "month-123",
          p_date: newExpense.date,
          p_amount: newExpense.amount,
          p_category: newExpense.category,
        })
      );
    });

    it("should return 409 when fn_create_expense reports the monthly free-tier limit", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 10,
        category: "survival",
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "month-123", status: "open" },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: "KB001", message: "Límite mensual de gastos alcanzado" },
      });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("CONFLICT");
      expect(data.error.message).toMatch(/límite de 30 gastos/i);
    });

    it("should map any other fn_create_expense failure to a generic error without leaking DB details", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 10,
        category: "survival",
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "month-123", status: "open" },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: "KB002", message: "Mes no válido" },
      });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      // El mensaje debe ser el genérico de errors.ts, no el texto crudo devuelto
      // por la función SQL (que podría filtrar si el mes es ajeno o inexistente).
      expect(data.error.message).not.toBe("Mes no válido");
      expect(data.error.message).toMatch(/no se pudo crear el gasto/i);
    });

    it("should return 422 for invalid body", async () => {
      const invalidExpense = {
        date: "invalid-date",
        amount: -10,
        category: "survival",
      };

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(invalidExpense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 409 when trying to add expense to closed month", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
      };

      // Mock finding closed month
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "month-123", status: "closed" },
        error: null,
      });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("CONFLICT");
    });

    it("should create month if not exists", async () => {
      const expense = {
        date: "2025-02-15",
        amount: 30,
        category: "optional",
      };

      // Mock: month not found (PGRST116)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Row not found" },
        })
        // Mock: create month
        .mockResolvedValueOnce({
          data: { id: "new-month-123" },
          error: null,
        });
      // Mock: create expense via fn_create_expense RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: "exp-new",
          user_id: "user-123",
          month_id: "new-month-123",
          ...expense,
        },
        error: null,
      });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      // Verify month was created
      expect(mockSupabase.insert).toHaveBeenCalled();
      // Verify the expense creation went through the RPC, not a direct insert
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "fn_create_expense",
        expect.objectContaining({ p_month_id: "new-month-123" })
      );
    });
  });
});
