import { describe, expect, it, vi } from "vitest";

const { requireAccess, getUser, exists, readObject, registerUpload, maybeSingle } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  getUser: vi.fn(),
  exists: vi.fn(),
  readObject: vi.fn(),
  registerUpload: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/auth/require-access", () => ({ requireScannerAccess: requireAccess }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })),
  })),
}));
vi.mock("@/lib/scanner/storage-adapter", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/scanner/storage-adapter")>()),
  PrivateTicketBucket: vi.fn(function () { return { exists, readObject }; }),
}));
vi.mock("@/lib/scanner/persistence", () => ({ registerScannerUpload: registerUpload }));

import { POST } from "@/app/api/scanner/tickets/[ticketId]/complete-upload/route";

const TICKET = "22222222-2222-4222-8222-222222222222";
const USER = { id: "11111111-1111-4111-8111-111111111111" };
const PATH = `${USER.id}/${TICKET}/33333333-3333-4333-8333-333333333333`;

function request(body: unknown) {
  return new Request("http://localhost/api/scanner/tickets/" + TICKET + "/complete-upload", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

describe("complete scanner upload", () => {
  it("does not register a missing object", async () => {
    requireAccess.mockResolvedValue(undefined);
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    maybeSingle.mockResolvedValue({ data: { id: TICKET, status: "initiated", object_path: null, declared_mime: "image/jpeg", declared_size_bytes: 4, expires_at: null }, error: null });
    exists.mockResolvedValue({ ok: true, exists: false });
    const response = await POST(request({ path: PATH }) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(422);
    expect(registerUpload).not.toHaveBeenCalled();
  });

  it("registers only an object confirmed present in private storage", async () => {
    requireAccess.mockResolvedValue(undefined);
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    maybeSingle.mockResolvedValue({ data: { id: TICKET, status: "initiated", object_path: null, declared_mime: "image/jpeg", declared_size_bytes: 4, expires_at: null }, error: null });
    exists.mockResolvedValue({ ok: true, exists: true });
    readObject.mockResolvedValue({ ok: true, bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]), contentType: "image/jpeg" });
    registerUpload.mockResolvedValue({ ok: true, idempotent: false });
    const response = await POST(request({ path: PATH }) as never, { params: Promise.resolve({ ticketId: TICKET }) });
    expect(response.status).toBe(200);
    expect(registerUpload).toHaveBeenCalledWith(expect.anything(), TICKET, PATH);
    await expect(response.json()).resolves.toMatchObject({ data: { ticketId: TICKET, status: "uploaded", idempotent: false } });
  });
});
