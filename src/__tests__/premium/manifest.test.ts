// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  PREMIUM_PACK_ID,
  PREMIUM_PACK_FILES,
  PREMIUM_PACK_FOLDER,
  PREMIUM_STORAGE_BUCKET,
  getPackFile,
} from "@/lib/premium/manifest";

const ROOT = process.cwd();

describe("premium pack manifest", () => {
  it("is a single product with the expected id", () => {
    expect(PREMIUM_PACK_ID).toBe("kakebo-master-system-pack");
  });

  it("includes exactly the three deliverables: Excel, tutorial PDF and ebook", () => {
    expect(PREMIUM_PACK_FILES.map((f) => f.id)).toEqual(["excel", "tutorial", "ebook"]);
    expect(PREMIUM_PACK_FILES.map((f) => f.kind)).toEqual(["xlsx", "pdf", "pdf"]);
    expect(getPackFile("excel")?.displayName).toMatch(/Excel/);
    expect(getPackFile("tutorial")?.displayName).toMatch(/Tutorial/);
    expect(getPackFile("ebook")?.displayName).toMatch(/arte de mirar tu dinero/i);
    expect(getPackFile("unknown")).toBeUndefined();
  });

  it("registers display name, internal name, type, size, description and version for each file", () => {
    for (const f of PREMIUM_PACK_FILES) {
      expect(f.displayName.length).toBeGreaterThan(3);
      expect(f.internalName).toMatch(/\.(xlsx|pdf)$/);
      expect(f.downloadFileName).toMatch(/\.(xlsx|pdf)$/);
      expect(f.mimeType).toBe(
        f.kind === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf"
      );
      expect(f.sizeBytes).toBeGreaterThan(100_000);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.description.length).toBeGreaterThan(10);
      expect(f.version).toBeTruthy();
    }
  });

  it("uses exactly the agreed bucket and storage keys", () => {
    expect(PREMIUM_STORAGE_BUCKET).toBe("kakebo-premium");
    expect(PREMIUM_PACK_FILES.map((f) => f.storageKey)).toEqual([
      "kakebo-master-system-pack/Kakebo_Master_System_v6.xlsx",
      "kakebo-master-system-pack/Kakebo_Master_System_Tutorial.pdf",
      "kakebo-master-system-pack/ebook-kakebo-master-system.pdf",
    ]);
  });

  it("has unique ids, internal names, storage keys, hashes and order", () => {
    for (const key of ["id", "internalName", "storageKey", "sha256", "order"] as const) {
      const values = PREMIUM_PACK_FILES.map((f) => f[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("uses private storage keys, never public paths or URLs", () => {
    expect(PREMIUM_PACK_FOLDER.startsWith("private/premium/")).toBe(true);
    for (const f of PREMIUM_PACK_FILES) {
      expect(f.storageKey).toBe(`${PREMIUM_PACK_ID}/${f.internalName}`);
      expect(f.storageKey).not.toMatch(/^(https?:)?\/\//);
      expect(f.storageKey).not.toMatch(/public|\.\./);
      expect(f.storageKey.startsWith("/")).toBe(false);
    }
  });

  it("does not carry any price, purchase or transaction data", () => {
    const json = JSON.stringify(PREMIUM_PACK_FILES);
    expect(json).not.toMatch(/price|precio|stripe|purchase|transaction|session/i);
  });
});

describe("premium pack files on disk (private folder)", () => {
  const present = PREMIUM_PACK_FILES.every((f) =>
    fs.existsSync(path.join(ROOT, PREMIUM_PACK_FOLDER, f.localFileName))
  );

  // The files are git-ignored: on a machine without them (e.g. a fresh clone) these are skipped.
  describe.skipIf(!present)("when the private files are present locally", () => {
    it.each(PREMIUM_PACK_FILES.map((f) => [f.id, f] as const))(
      "%s exists in the private folder with the registered size and sha256",
      (_id, f) => {
        const full = path.join(ROOT, PREMIUM_PACK_FOLDER, f.localFileName);
        const buf = fs.readFileSync(full);
        expect(buf.length).toBe(f.sizeBytes);
        expect(crypto.createHash("sha256").update(buf).digest("hex")).toBe(f.sha256);
      }
    );

    it("PDFs start with %PDF and end with %%EOF, and the xlsx is a zip (PK)", () => {
      for (const f of PREMIUM_PACK_FILES) {
        const buf = fs.readFileSync(path.join(ROOT, PREMIUM_PACK_FOLDER, f.localFileName));
        if (f.kind === "pdf") {
          expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
          expect(buf.subarray(-32).toString()).toContain("%%EOF");
        } else {
          expect(buf.subarray(0, 2).toString()).toBe("PK");
        }
      }
    });
  });
});
