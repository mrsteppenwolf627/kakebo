import { describe, expect, it, vi } from "vitest";
import { PrivateTicketBucket, SCANNER_TICKET_BUCKET } from "@/lib/scanner/storage-adapter";

const USER = "11111111-1111-4111-8111-111111111111";
const TICKET = "22222222-2222-4222-8222-222222222222";

describe("private ticket signed upload", () => {
  it("generates an opaque path and returns only a private signed upload", async () => {
    const createSignedUploadUrl = vi.fn(async (path: string) => ({ data: { signedUrl: "https://signed.invalid/upload", token: "opaque-token", path }, error: null }));
    const from = vi.fn(() => ({ createSignedUploadUrl }));
    const bucket = new PrivateTicketBucket({ storage: { from } } as unknown as ConstructorParameters<typeof PrivateTicketBucket>[0]);
    const result = await bucket.createUploadUrl(USER, TICKET);

    expect(result).toMatchObject({ ok: true, url: "https://signed.invalid/upload", token: "opaque-token", maxBytes: 5 * 1024 * 1024 });
    expect(result.ok && result.path).toMatch(new RegExp(`^${USER}/${TICKET}/[0-9a-f-]{36}$`));
    expect(from).toHaveBeenCalledWith(SCANNER_TICKET_BUCKET);
  });

  it("fails closed when the storage client has no signed-upload support", async () => {
    const bucket = new PrivateTicketBucket({ storage: { from: vi.fn(() => ({})) } } as unknown as ConstructorParameters<typeof PrivateTicketBucket>[0]);
    await expect(bucket.createUploadUrl(USER, TICKET)).resolves.toEqual({ ok: false, code: "STORAGE_ERROR" });
  });
});
