import { describe, expect, it, vi } from "vitest";

const { requireAccess, maybeSingle, linesResult } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  maybeSingle: vi.fn(),
  linesResult: vi.fn(),
}));

vi.mock("@/lib/auth/require-access", () => ({ requireScannerAccess: requireAccess }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => table === "scanner_tickets"
      ? { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) }
      : { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: linesResult })) })) }),
  })),
}));

import { GET } from "@/app/api/scanner/tickets/[ticketId]/route";

const TICKET = "22222222-2222-4222-8222-222222222222";

describe("scanner ticket status", () => {
  it("returns only the owner draft and never the storage path", async () => {
    requireAccess.mockResolvedValue(undefined);
    maybeSingle.mockResolvedValue({ data: {
      id: TICKET, status: "needs_review", status_reason: null, source: "image", locale: "es",
      has_draft: true, draft_version: 1, merchant: "Tienda", receipt_date: "2026-10-27",
      total_cents: 1234, currency: "EUR", original_storage: "present", expires_at: null, updated_at: "2026-10-27T12:00:00Z",
      object_path: "must-not-be-selected",
    }, error: null });
    linesResult.mockResolvedValue({ data: [{ id: "line", position: 0, kind: "item", description: "Pan", amount_cents: 1234, category_proposal: "survival", category: null, allocations: [], include_in_expenses: true }], error: null });

    const response = await GET(new Request("http://localhost/api/scanner/tickets/" + TICKET) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.ticket.lines[0]).toMatchObject({ amountCents: 1234, categoryProposal: "survival", includeInExpenses: true });
    expect(JSON.stringify(body)).not.toContain("object_path");
    expect(JSON.stringify(body)).not.toContain("must-not-be-selected");
  });

  it("does not reveal whether an invalid ticket exists", async () => {
    maybeSingle.mockClear();
    const response = await GET(new Request("http://localhost/api/scanner/tickets/not-a-uuid") as never, { params: Promise.resolve({ ticketId: "not-a-uuid" }) });
    expect(response.status).toBe(404);
    expect(maybeSingle).not.toHaveBeenCalled();
  });
});
