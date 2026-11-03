import { describe, expect, it, vi } from "vitest";

const { requireAccess, replace, client } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  replace: vi.fn(),
  client: {},
}));

vi.mock("@/lib/auth/require-access", () => ({ requireScannerAccess: requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => client) }));
vi.mock("@/lib/scanner/persistence", () => ({ replaceScannerDraft: replace }));

import { PATCH } from "@/app/api/scanner/tickets/[ticketId]/draft/route";

const TICKET = "22222222-2222-4222-8222-222222222222";
const DRAFT = { draftVersion: 1, merchant: "Tienda", date: "2026-10-27", totalCents: 100, lines: [{ kind: "item", description: "Pan", amountCents: 100, categoryProposal: "survival", category: "survival", allocations: [] }] };

function request(body: unknown) {
  return new Request("http://localhost/api/scanner/tickets/" + TICKET + "/draft", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

describe("scanner draft editing", () => {
  it("rejects a line whose category and allocations conflict", async () => {
    const response = await PATCH(request({ ...DRAFT, lines: [{ ...DRAFT.lines[0], category: "survival", allocations: [{ category: "survival", amountCents: 100 }, { category: "optional", amountCents: 0 }] }] }) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(422);
    expect(replace).not.toHaveBeenCalled();
  });

  it("delegates a valid replacement with its version", async () => {
    requireAccess.mockResolvedValue(undefined);
    replace.mockResolvedValue({ ok: true, draftVersion: 2 });
    const response = await PATCH(request(DRAFT) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(200);
    expect(replace).toHaveBeenCalledWith(client, TICKET, 1, DRAFT);
    await expect(response.json()).resolves.toMatchObject({ data: { ticketId: TICKET, status: "needs_review", draftVersion: 2 } });
  });
});
