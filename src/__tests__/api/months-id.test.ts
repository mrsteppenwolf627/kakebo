import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/months/[id]/route";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
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

const SEPTEMBER_CYCLE_ID = "11111111-1111-4111-8111-111111111111";

function patchRequest(id: string, body: unknown) {
  const request = new NextRequest(`http://localhost/api/months/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return PATCH(request, { params: Promise.resolve({ id }) });
}

describe("PATCH /api/months/[id] — ciclos libres", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closing a cycle before day 1 opens the next cycle immediately (idempotent get-or-create)", async () => {
    // Existing cycle: September 2026, still open, closed on day 28.
    mockSupabase.single
      // 1) fetch existing cycle to close
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 9, status: "open" },
        error: null,
      })
      // 2) update -> closed
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 9, status: "closed" },
        error: null,
      })
      // 3) ensureNextCycleOpen -> getOrCreateMonth(2026, 10): not found (PGRST116)
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
      // 4) getOrCreateMonth(2026, 10): insert -> created open
      .mockResolvedValueOnce({
        data: { id: "october-cycle", year: 2026, month: 10, status: "open" },
        error: null,
      });

    const response = await patchRequest(SEPTEMBER_CYCLE_ID, { status: "closed" });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("closed");

    // The next cycle (October) was created open — verify the insert payload.
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026, month: 10, status: "open" })
    );
  });

  it("closing a cycle in December rolls over to January of the next year", async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 12, status: "open" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 12, status: "closed" },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
      .mockResolvedValueOnce({
        data: { id: "january-cycle", year: 2027, month: 1, status: "open" },
        error: null,
      });

    const response = await patchRequest(SEPTEMBER_CYCLE_ID, { status: "closed" });

    expect(response.status).toBe(200);
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2027, month: 1, status: "open" })
    );
  });

  it("reopening a closed cycle is still rejected (write lock preserved)", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 9, status: "closed" },
      error: null,
    });

    const response = await patchRequest(SEPTEMBER_CYCLE_ID, { status: "open" });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("CONFLICT");
    // No update nor next-cycle logic should run once rejected.
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it("closing a cycle never reads or writes the expenses table (no historical expense is touched)", async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 9, status: "open" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: SEPTEMBER_CYCLE_ID, year: 2026, month: 9, status: "closed" },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
      .mockResolvedValueOnce({
        data: { id: "october-cycle", year: 2026, month: 10, status: "open" },
        error: null,
      });

    await patchRequest(SEPTEMBER_CYCLE_ID, { status: "closed" });

    const touchedTables = mockSupabase.from.mock.calls.map((call) => call[0]);
    expect(touchedTables.every((table) => table === "months")).toBe(true);
    expect(touchedTables).not.toContain("expenses");
  });
});
