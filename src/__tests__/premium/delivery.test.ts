// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  verifyPackEntitlement,
  getPremiumStorage,
  recordPackDownload,
  PremiumStorageNotConfiguredError,
} from "@/lib/premium/delivery";
import { PREMIUM_PACK_ID, PREMIUM_PACK_FILES } from "@/lib/premium/manifest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("premium delivery layer fails closed", () => {
  it("never grants an entitlement, whatever the environment says", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
    vi.stubEnv("PREMIUM_ENTITLEMENT_OVERRIDE", "true");
    const result = await verifyPackEntitlement(PREMIUM_PACK_ID);
    expect(result.granted).toBe(false);
  });

  it("denies without a request (no cookie to check)", async () => {
    expect(await verifyPackEntitlement(PREMIUM_PACK_ID)).toEqual({ granted: false, reason: "no_purchase" });
    expect(verifyPackEntitlement.length).toBe(1);
  });

  it("without service-role credentials it cannot sign anything and never produces a URL", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const storage = getPremiumStorage();
    for (const f of PREMIUM_PACK_FILES) {
      await expect(storage.createDownloadGrant(f, { expiresInSeconds: 60 })).rejects.toBeInstanceOf(
        PremiumStorageNotConfiguredError
      );
    }
  });

  it("never throws when the download log cannot be written", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(
      recordPackDownload({ packId: PREMIUM_PACK_ID, fileId: "excel", purchaseId: "p" })
    ).resolves.toBeUndefined();
  });

  it("does not read files from disk or talk to Stripe", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/lib/premium/delivery.ts"), "utf8");
    const imports = src.split("\n").filter((l) => /^\s*import\s/.test(l)).join("\n");
    expect(imports).not.toMatch(/node:fs|"fs"|stripe/i);
    expect(src).not.toMatch(/readFile|createReadStream/);
  });
});
