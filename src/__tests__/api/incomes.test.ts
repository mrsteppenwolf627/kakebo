import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/incomes/route";

const CLOSED_ID = "11111111-1111-4111-8111-111111111111";
const OPEN_ID = "22222222-2222-4222-8222-222222222222";
const FOREIGN_ID = "33333333-3333-4333-8333-333333333333";

// Per-table query builder: `months` lookups resolve from a queue, `incomes` inserts are captured.
const state: { monthsSingle: unknown[]; inserted: Record<string, unknown> | null } = {
  monthsSingle: [],
  inserted: null,
};

function builder(table: string) {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit"]) b[m] = vi.fn(() => b);
  b.insert = vi.fn((row: Record<string, unknown>) => {
    if (table === "incomes") state.inserted = row;
    return b;
  });
  b.single = vi.fn(() =>
    Promise.resolve(
      table === "months"
        ? state.monthsSingle.shift()
        : { data: { id: "income-1", ...state.inserted }, error: null }
    )
  );
  return b;
}

const mockSupabase = { from: vi.fn((table: string) => builder(table)) };

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

const getOpenMonthMock = vi.fn();
vi.mock("@/lib/months", () => ({
  getOpenMonth: (...args: unknown[]) => getOpenMonthMock(...args),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: "user-123", email: "test@example.com" })),
}));

vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/incomes", {
      method: "POST",
      body: JSON.stringify({ category: "general", amount: 100, ...body }),
    })
  );
}

describe("POST /api/incomes — ciclos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.monthsSingle = [];
    state.inserted = null;
  });

  it("fecha en un ciclo cerrado -> imputa el ingreso al ciclo abierto actual", async () => {
    state.monthsSingle = [{ data: { id: CLOSED_ID, status: "closed" }, error: null }];
    getOpenMonthMock.mockResolvedValue({ id: OPEN_ID, year: 2026, month: 12, status: "open" });

    const response = await post({ date: "2026-11-20" });

    expect(response.status).toBe(201);
    expect(getOpenMonthMock).toHaveBeenCalledWith(mockSupabase, "user-123");
    expect(state.inserted).toMatchObject({ month_id: OPEN_ID, date: "2026-11-20", user_id: "user-123" });
  });

  it("fecha en un ciclo cerrado y sin ciclo abierto -> 409", async () => {
    state.monthsSingle = [{ data: { id: CLOSED_ID, status: "closed" }, error: null }];
    getOpenMonthMock.mockResolvedValue(null);

    const response = await post({ date: "2026-11-20" });

    expect(response.status).toBe(409);
    expect(state.inserted).toBeNull();
  });

  it("fecha en un ciclo abierto -> usa ese ciclo sin consultar el abierto actual", async () => {
    state.monthsSingle = [{ data: { id: OPEN_ID, status: "open" }, error: null }];

    const response = await post({ date: "2026-12-02" });

    expect(response.status).toBe(201);
    expect(getOpenMonthMock).not.toHaveBeenCalled();
    expect(state.inserted).toMatchObject({ month_id: OPEN_ID });
  });

  it("month_id ajeno o inexistente -> 404 y no inserta", async () => {
    state.monthsSingle = [{ data: null, error: { code: "PGRST116" } }];

    const response = await post({ date: "2026-11-20", month_id: FOREIGN_ID });

    expect(response.status).toBe(404);
    expect(state.inserted).toBeNull();
  });

  it("month_id de un ciclo cerrado -> 409 y no inserta", async () => {
    state.monthsSingle = [{ data: { status: "closed" }, error: null }];

    const response = await post({ date: "2026-11-20", month_id: CLOSED_ID });

    expect(response.status).toBe(409);
    expect(state.inserted).toBeNull();
  });

  it("month_id de un ciclo abierto propio -> 201 con ese ciclo", async () => {
    state.monthsSingle = [{ data: { status: "open" }, error: null }];

    const response = await post({ date: "2026-12-02", month_id: OPEN_ID });

    expect(response.status).toBe(201);
    expect(state.inserted).toMatchObject({ month_id: OPEN_ID });
  });
});
