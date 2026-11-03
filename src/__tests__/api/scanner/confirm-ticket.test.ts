import { describe, expect, it, vi } from "vitest";

const { requireAccess, confirm, client } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  confirm: vi.fn(),
  client: {},
}));

vi.mock("@/lib/auth/require-access", () => ({ requireScannerAccess: requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => client) }));
vi.mock("@/lib/scanner/persistence", () => ({ confirmScannerTicket: confirm }));

import { POST } from "@/app/api/scanner/tickets/[ticketId]/confirm/route";

const TICKET = "22222222-2222-4222-8222-222222222222";
const KEY = "44444444-4444-4444-8444-444444444444";

function request(body: unknown) {
  return new Request("http://localhost/api/scanner/tickets/" + TICKET + "/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

describe("scanner ticket confirmation", () => {
  it("requires the explicit confirmation flag", async () => {
    const response = await POST(request({ confirmKey: KEY, draftVersion: 1 }) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(422);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("delegates one explicit confirmation to the atomic persistence function", async () => {
    requireAccess.mockResolvedValue(undefined);
    confirm.mockResolvedValue({ ok: true, status: "confirmed", idempotent: false, expenses: [{ expenseId: "expense", category: "survival", amountCents: 1234 }] });
    const response = await POST(request({ confirmKey: KEY, draftVersion: 1, userConfirmed: true }) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(200);
    expect(confirm).toHaveBeenCalledWith(client, TICKET, KEY, 1);
    await expect(response.json()).resolves.toMatchObject({ data: { ticketId: TICKET, status: "confirmed", idempotent: false } });
  });
});
