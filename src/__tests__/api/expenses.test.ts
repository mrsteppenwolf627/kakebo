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
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  // Fase 3.B: la creación de gastos pasa por fn_create_expense (RPC), no por
  // un INSERT directo -- ver docs/planning/fase-3-monetizacion.md §3.B.2.
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
    it("should create a new expense, imputed to the user's currently open cycle", async () => {
      const newExpense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
        note: "Grocery shopping",
      };

      const mockOpenMonth = { id: "month-123", status: "open", year: 2025, month: 1 };
      const mockCreatedExpense = {
        id: "exp-new",
        user_id: "user-123",
        month_id: "month-123",
        ...newExpense,
        created_at: "2025-01-15T10:00:00Z",
      };

      // getOpenMonth(): .eq().eq().order().order().limit() -> resolves with the open cycle
      mockSupabase.limit.mockReturnValueOnce({
        ...mockSupabase,
        then: (
          resolve: (value: { data: (typeof mockOpenMonth)[]; error: null }) => void
        ) => resolve({ data: [mockOpenMonth], error: null }),
      } as never);
      // Insert expense via fn_create_expense RPC
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCreatedExpense, error: null });
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { expense_id: "exp-new" },
        error: null,
      });

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
      expect(data.data.is_first_expense).toBe(true);
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
      const expense = { date: "2025-01-15", amount: 10, category: "survival" };
      const mockOpenMonth = { id: "month-123", status: "open", year: 2025, month: 1 };

      mockSupabase.limit.mockReturnValueOnce({
        ...mockSupabase,
        then: (
          resolve: (value: { data: (typeof mockOpenMonth)[]; error: null }) => void
        ) => resolve({ data: [mockOpenMonth], error: null }),
      } as never);
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
      const expense = { date: "2025-01-15", amount: 10, category: "survival" };
      const mockOpenMonth = { id: "month-123", status: "open", year: 2025, month: 1 };

      mockSupabase.limit.mockReturnValueOnce({
        ...mockSupabase,
        then: (
          resolve: (value: { data: (typeof mockOpenMonth)[]; error: null }) => void
        ) => resolve({ data: [mockOpenMonth], error: null }),
      } as never);
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: "KB002", message: "Ciclo no válido" },
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
      // por la función SQL (que podría filtrar si el ciclo es ajeno o inexistente).
      expect(data.error.message).not.toBe("Ciclo no válido");
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

    it("should return 409 when explicitly targeting a closed cycle (deliberate navigation to a closed cycle)", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
        month_id: "11111111-1111-4111-8111-111111111111",
      };

      // Explicit month_id lookup -> closed
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: "closed" },
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

    it("Fase 1.1: should return 404 and never insert when the explicit month_id does not exist", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
        month_id: "33333333-3333-4333-8333-333333333333",
      };

      // Explicit month_id lookup -> no row found for this id
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("Fase 1.1: should return 404 and never insert when the explicit month_id belongs to another user", async () => {
      const expense = {
        date: "2025-01-15",
        amount: 50,
        category: "survival",
        month_id: "44444444-4444-4444-8444-444444444444",
      };

      // The month exists but the .eq("user_id", user.id) filter excludes it
      // (it belongs to a different user) -> single() resolves with no row.
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("should bootstrap a cycle for the expense's date when the user has no open cycle yet", async () => {
      const expense = {
        date: "2025-02-15",
        amount: 30,
        category: "optional",
      };

      // getOpenMonth(): no open cycle yet
      mockSupabase.limit.mockReturnValueOnce({
        ...mockSupabase,
        then: (resolve: (value: { data: []; error: null }) => void) =>
          resolve({ data: [], error: null }),
      } as never);

      // getOrCreateMonth(): not found (PGRST116), then created
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Row not found" },
        })
        .mockResolvedValueOnce({
          data: { id: "new-month-123", status: "open" },
          error: null,
        });
      // Create expense via fn_create_expense RPC
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

    it("ciclos libres: imputes the expense to the open cycle and preserves its real date, even when that date's calendar month differs from the cycle's label", async () => {
      // El usuario cerró el ciclo de septiembre el día 28; el siguiente ciclo
      // (etiquetado octubre) ya está abierto. Un gasto fechado el 29 de
      // septiembre debe imputarse a ese ciclo abierto, conservando su fecha real.
      const expense = {
        date: "2026-09-29",
        amount: 12.5,
        category: "extra",
        note: "helado",
      };

      const openOctoberCycle = { id: "cycle-october", status: "open", year: 2026, month: 10 };

      mockSupabase.limit.mockReturnValueOnce({
        ...mockSupabase,
        then: (
          resolve: (value: { data: (typeof openOctoberCycle)[]; error: null }) => void
        ) => resolve({ data: [openOctoberCycle], error: null }),
      } as never);

      const createdExpense = {
        id: "exp-after-close",
        user_id: "user-123",
        month_id: "cycle-october",
        ...expense,
      };
      mockSupabase.rpc.mockResolvedValueOnce({ data: createdExpense, error: null });

      const request = new NextRequest("http://localhost/api/expenses", {
        method: "POST",
        body: JSON.stringify(expense),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      // La fecha real nunca se altera y el gasto se asigna al ciclo ABIERTO,
      // no a uno derivado del mes natural de la fecha.
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "fn_create_expense",
        expect.objectContaining({ p_month_id: "cycle-october", p_date: "2026-09-29" })
      );
      expect(data.data.date).toBe("2026-09-29");
      expect(data.data.month_id).toBe("cycle-october");
    });
  });
});
