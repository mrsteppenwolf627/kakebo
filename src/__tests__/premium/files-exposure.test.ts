// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { PREMIUM_PACK_FILES, PREMIUM_PACK_FOLDER } from "@/lib/premium/manifest";

const ROOT = process.cwd();

// Free assets that are intentionally public.
const ALLOWED_PUBLIC_DOCS = new Set(["docs/Plantilla_Kakebo_Simplificada.xlsx"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const publicFiles = walk(path.join(ROOT, "public")).map((f) =>
  path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/")
);

describe("premium files are not exposed in public/", () => {
  it("has no Excel files in public/ other than the free template", () => {
    const excel = publicFiles.filter((f) => /\.(xlsx|xlsm|xls|xlsb|csv)$/i.test(f));
    expect(excel.filter((f) => !ALLOWED_PUBLIC_DOCS.has(f))).toEqual([]);
  });

  it("has no PDF files in public/", () => {
    expect(publicFiles.filter((f) => /\.pdf$/i.test(f))).toEqual([]);
  });

  it("has no archives or premium-named documents in public/", () => {
    const suspicious = publicFiles.filter(
      (f) => /\.(zip|rar|7z)$/i.test(f) || /(premium|master[-_ ]?system|elite)/i.test(f) && !/\.(png|jpe?g|webp|avif)$/i.test(f)
    );
    expect(suspicious).toEqual([]);
  });

  it("only publishes preview images inside the premium product folder", () => {
    const productFiles = publicFiles.filter((f) => f.startsWith("images/products/kakebo-premium/"));
    expect(productFiles.length).toBeGreaterThan(0);
    for (const f of productFiles) expect(f).toMatch(/\.(png|jpe?g|webp|avif)$/i);
  });

  it("keeps the free template download available", () => {
    expect(publicFiles).toContain("docs/Plantilla_Kakebo_Simplificada.xlsx");
  });
});

describe("private/premium is git-ignored", () => {
  function checkIgnore(file: string) {
    return spawnSync("git", ["check-ignore", "-q", file], { cwd: ROOT }).status;
  }

  it.each(["private/premium/Kakebo_Master_System.xlsx", "private/premium/Tutorial.pdf", "private/premium/anything.zip"])(
    "ignores %s",
    (file) => {
      expect(checkIgnore(file)).toBe(0);
    }
  );

  it("does not ignore the allowed README", () => {
    expect(checkIgnore("private/premium/README.md")).toBe(1);
  });

  it("keeps private/ outside public/ (never served by Next.js)", () => {
    expect(fs.existsSync(path.join(ROOT, "public", "private"))).toBe(false);
  });
});

describe("no public route serves premium files", () => {
  it("only exposes the guarded premium API routes (checkout, claim, download)", () => {
    const dir = path.join(ROOT, "src/app/api/premium");
    const routes = walk(dir).map((f) => path.relative(dir, f).split(path.sep).join("/")).sort();
    expect(routes).toEqual(["checkout/route.ts", "claim/route.ts", "download/route.ts"]);
  });

  it("has no catch-all or file-serving routes under /api/premium", () => {
    const dir = path.join(ROOT, "src/app/api/premium");
    const names = walk(dir).map((f) => path.relative(dir, f));
    expect(names.filter((n) => /\[|\.\.\./.test(n))).toEqual([]);
  });
});

describe("the three pack files live only in the private folder", () => {
  const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "private", "coverage", ".vercel", ".codex"]);

  function walkRepo(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) out.push(...walkRepo(path.join(dir, entry.name)));
      } else out.push(path.join(dir, entry.name));
    }
    return out;
  }

  it("has no copy of any pack file (matched by size and sha256) outside private/, e.g. in public/ or docs/", () => {
    const bySize = new Map(PREMIUM_PACK_FILES.map((f) => [f.sizeBytes, f]));
    const copies: string[] = [];
    for (const file of walkRepo(ROOT)) {
      const candidate = bySize.get(fs.statSync(file).size);
      if (!candidate) continue;
      const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
      if (hash === candidate.sha256) copies.push(path.relative(ROOT, file));
    }
    expect(copies).toEqual([]);
  });

  it("has no file named like a pack file anywhere in public/ or docs/", () => {
    const names = PREMIUM_PACK_FILES.flatMap((f) => [f.internalName, f.localFileName, f.downloadFileName].map((n) => n.toLowerCase()));
    const found = walkRepo(ROOT)
      .map((f) => path.relative(ROOT, f).split(path.sep).join("/"))
      .filter((rel) => names.includes(path.basename(rel).toLowerCase()));
    expect(found).toEqual([]);
  });

  it.each(PREMIUM_PACK_FILES.map((f) => [f.id, f.localFileName] as const))(
    "git-ignores the private path of %s",
    (_id, localFileName) => {
      expect(checkIgnoreSafe(`${PREMIUM_PACK_FOLDER}/${localFileName}`)).toBe(0);
    }
  );

  function checkIgnoreSafe(file: string) {
    return spawnSync("git", ["check-ignore", "-q", file], { cwd: ROOT }).status;
  }
});
