// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (f: string) => path.relative(process.cwd(), f).split(path.sep).join("/");
const files = walk(SRC).filter((f) => !rel(f).startsWith("src/__tests__/"));
const read = (f: string) => fs.readFileSync(f, "utf8");

// Modules that can reach the Supabase service-role key or sign premium downloads.
const SERVER_ONLY_MODULES = [
  "@/lib/supabase/admin",
  "@/lib/premium/delivery",
  "@/lib/premium/storage",
];

function importsAny(source: string, modules: string[]) {
  return modules.some((m) => new RegExp(`from\\s+["']${m.replace(/[/@]/g, "\\$&")}["']`).test(source));
}

describe("service-role Supabase client stays on the server", () => {
  it("no 'use client' file imports the admin client or the premium delivery layer", () => {
    const offenders = files.filter((f) => /^\s*["']use client["']/m.test(read(f)) && importsAny(read(f), SERVER_ONLY_MODULES));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("only API routes or lib code import the admin client and the premium delivery layer", () => {
    const importers = files.filter((f) => importsAny(read(f), SERVER_ONLY_MODULES)).map(rel);
    for (const f of importers) {
      expect(f.startsWith("src/app/api/") || f.startsWith("src/lib/")).toBe(true);
    }
  });

  it("no component or page imports the premium delivery layer", () => {
    const offenders = files
      .filter((f) => rel(f).startsWith("src/components/") || /page\.tsx$/.test(f))
      .filter((f) => importsAny(read(f), ["@/lib/premium/delivery"]));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("the service-role key is never exposed with a NEXT_PUBLIC_ prefix", () => {
    const offenders = files.filter((f) => /NEXT_PUBLIC_[A-Z_]*SERVICE_ROLE/.test(read(f)));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("the service-role key is only read in server code", () => {
    const readers = files.filter((f) => read(f).includes("SUPABASE_SERVICE_ROLE_KEY")).map(rel);
    for (const f of readers) {
      expect(f.startsWith("src/app/api/") || f.startsWith("src/lib/")).toBe(true);
      expect(/^\s*["']use client["']/m.test(read(path.join(process.cwd(), f)))).toBe(false);
    }
  });
});
