import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/expenses/[id]/route";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
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

const EXPENSE_ID = "22222222-2222-4222-8222-222222222222";
const CLOSED_MONTH_ID = "11111111-1111-4111-8111-111111111111";

describe("Closed-cycle write lock on individual expenses (ciclos libres)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH /api/expenses/[id]: rejects editing an expense whose cycle is closed", async () => {
    mockSupabase.single
      // fetch expense -> belongs to a closed cycle
      .mockResolvedValueOnce({
        data: { id: EXPENSE_ID, month_id: CLOSED_MONTH_ID },
        error: null,
      })
      // fetch month status
      .mockResolvedValueOnce({ data: { status: "closed" }, error: null });

    const request = new NextRequest(`http://localhost/api/expenses/${EXPENSE_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ amount: 99 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: EXPENSE_ID }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("CONFLICT");
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it("DELETE /api/expenses/[id]: rejects deleting an expense whose cycle is closed", async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: EXPENSE_ID, month_id: CLOSED_MONTH_ID },
        error: null,
      })
      .mockResolvedValueOnce({ data: { status: "closed" }, error: null });

    const request = new NextRequest(`http://localhost/api/expenses/${EXPENSE_ID}`, {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: EXPENSE_ID }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("CONFLICT");
    expect(mockSupabase.delete).not.toHaveBeenCalled();
  });
});
