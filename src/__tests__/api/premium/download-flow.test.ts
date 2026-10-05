// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

const SIGNED = "https://example.supabase.co/storage/v1/object/sign/kakebo-premium/x?token=SIGNED_SECRET_TOKEN_123";

const createSignedUrl = vi.fn();
const from = vi.fn(() => ({ createSignedUrl }));
const createAdminClient = vi.fn(() => ({ storage: { from } }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));

const logSpy = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }));
vi.mock("@/lib/logger", () => ({ apiLogger: logSpy }));

const verifyPackEntitlement = vi.hoisted(() => vi.fn());
vi.mock("@/lib/premium/delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/premium/delivery")>();
  return { ...actual, verifyPackEntitlement: (...a: unknown[]) => verifyPackEntitlement(...a) };
});

import { GET } from "@/app/api/premium/download/route";
import { getPremiumStorage, PremiumStorageError } from "@/lib/premium/delivery";
import {
  PREMIUM_PACK_FILES,
  PREMIUM_STORAGE_BUCKET,
  PREMIUM_SIGNED_URL_TTL_SECONDS,
} from "@/lib/premium/manifest";

const GRANTED = { granted: true, userId: "user-1", purchaseId: "purchase-1" };
const DENIED = { granted: false, reason: "not_implemented" };

const req = (qs: string) => new Request(`http://localhost:3000/api/premium/download${qs}`);

function everythingLogged() {
  return JSON.stringify([
    ...Object.values(logSpy).flatMap((f) => f.mock.calls),
    ...vi.mocked(console.log).mock.calls,
    ...vi.mocked(console.error).mock.calls,
  ]);
}

beforeEach(() => {
  createSignedUrl.mockReset().mockResolvedValue({ data: { signedUrl: SIGNED }, error: null });
  from.mockClear();
  createAdminClient.mockClear();
  verifyPackEntitlement.mockReset().mockResolvedValue(DENIED);
  Object.values(logSpy).forEach((f) => f.mockClear());
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("premium download — gate order (storage is never touched before entitlement)", () => {
  it.each([undefined, "false", "TRUE", "1", ""])("flag=%j -> 503 and nothing else runs", async (flag) => {
    if (flag === undefined) delete process.env.PREMIUM_COMMERCE_ENABLED;
    else vi.stubEnv("PREMIUM_COMMERCE_ENABLED", flag);
    verifyPackEntitlement.mockResolvedValue(GRANTED); // even if it "would" be granted

    const res = await GET(req("?file=excel"));

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("premium_commerce_disabled");
    expect(verifyPackEntitlement).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  describe("flag on, no entitlement", () => {
    beforeEach(() => vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true"));

    it.each([
      "",
      "?file=excel",
      "?file=excel&paid=true",
      "?purchase=true",
      "?token=x",
      "?entitlement=true&file=ebook",
      "?file=../../.env.local",
    ])("%s -> 403, no signed URL, no storage client", async (qs) => {
      const res = await GET(req(qs));
      const text = await res.text();

      expect(res.status).toBe(403);
      expect(JSON.parse(text).code).toBe("entitlement_not_verified");
      expect(res.headers.get("Location")).toBeNull();
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(text).not.toContain("token=");
      expect(createAdminClient).not.toHaveBeenCalled();
      expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it("the real entitlement check (unmocked) never grants", async () => {
      const actual = await vi.importActual<typeof import("@/lib/premium/delivery")>("@/lib/premium/delivery");
      expect((await actual.verifyPackEntitlement("kakebo-master-system-pack")).granted).toBe(false);
    });
  });
});

describe("premium download — entitled buyer (future state, simulated)", () => {
  beforeEach(() => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
    verifyPackEntitlement.mockResolvedValue(GRANTED);
  });

  it.each(PREMIUM_PACK_FILES.map((f) => [f.id, f.storageKey, f.downloadFileName] as const))(
    "file=%s -> 302 to a 600 s signed URL for exactly %s",
    async (id, storageKey, downloadName) => {
      const res = await GET(req(`?file=${id}`));

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe(SIGNED);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(from).toHaveBeenCalledWith("kakebo-premium");
      expect(createSignedUrl).toHaveBeenCalledTimes(1);
      expect(createSignedUrl).toHaveBeenCalledWith(storageKey, 600, { download: downloadName });
    }
  );

  it("uses exactly the agreed bucket, keys and TTL", () => {
    expect(PREMIUM_STORAGE_BUCKET).toBe("kakebo-premium");
    expect(PREMIUM_SIGNED_URL_TTL_SECONDS).toBe(600);
    expect(PREMIUM_PACK_FILES.map((f) => f.storageKey)).toEqual([
      "kakebo-master-system-pack/Kakebo_Master_System_v6.xlsx",
      "kakebo-master-system-pack/Kakebo_Master_System_Tutorial.pdf",
      "kakebo-master-system-pack/ebook-kakebo-master-system.pdf",
    ]);
  });

  it.each([
    "",
    "?file=",
    "?file=nope",
    "?file=EXCEL",
    "?file=excel,ebook",
    "?file=excel/../../x",
    "?file=../../.env.local",
    "?file=..%2F..%2F.env.local",
    "?file=kakebo-master-system-pack/Kakebo_Master_System_v6.xlsx",
    "?file=Kakebo_Master_System_v6.xlsx",
    "?file=%2Fetc%2Fpasswd",
  ])("invalid file selector %j -> 400 and no signing", async (qs) => {
    const res = await GET(req(qs));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid_file");
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("the storage layer refuses any object that is not a manifest entry (no path traversal)", async () => {
    const forged = { ...PREMIUM_PACK_FILES[0], storageKey: "../../.env.local" };
    await expect(getPremiumStorage().createDownloadGrant(forged, { expiresInSeconds: 600 })).rejects.toBeInstanceOf(
      PremiumStorageError
    );
    const forgedId = { ...PREMIUM_PACK_FILES[0], id: "x" as never };
    await expect(getPremiumStorage().createDownloadGrant(forgedId, { expiresInSeconds: 600 })).rejects.toBeInstanceOf(
      PremiumStorageError
    );
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("never signs for longer than 600 seconds", async () => {
    await getPremiumStorage().createDownloadGrant(PREMIUM_PACK_FILES[0], { expiresInSeconds: 86400 });
    expect(createSignedUrl).toHaveBeenCalledWith(PREMIUM_PACK_FILES[0].storageKey, 600, expect.anything());
  });

  it("does not log the signed URL, the token or storage keys on success", async () => {
    await GET(req("?file=excel"));
    const logged = everythingLogged();
    expect(logged).not.toContain("SIGNED_SECRET_TOKEN_123");
    expect(logged).not.toContain("token=");
    expect(logged).not.toContain("kakebo-master-system-pack/");
  });

  it("a signing failure returns a generic 503 and leaks neither keys, paths nor URLs", async () => {
    createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: `Object not found: kakebo-premium/kakebo-master-system-pack/x ${SIGNED}` },
    });
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_SECRET_KEY";
    try {
      const res = await GET(req("?file=excel"));
      const text = await res.text();
      expect(res.status).toBe(503);
      expect(JSON.parse(text).code).toBe("download_unavailable");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      for (const secret of ["SIGNED_SECRET_TOKEN_123", "service_role_SECRET_KEY", "kakebo-master-system-pack", "kakebo-premium", "Object not found"]) {
        expect(text).not.toContain(secret);
        expect(everythingLogged()).not.toContain(secret);
      }
    } finally {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });

  it("a missing service-role configuration returns a generic 503", async () => {
    createAdminClient.mockImplementationOnce(() => {
      throw new Error("Missing Supabase credentials for Admin Client");
    });
    const res = await GET(req("?file=excel"));
    const text = await res.text();
    expect(res.status).toBe(503);
    expect(text).not.toMatch(/credentials|SERVICE_ROLE|Supabase/i);
  });
});
