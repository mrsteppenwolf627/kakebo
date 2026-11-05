import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pages = [
  { file: "src/app/[locale]/privacy/page.tsx", ns: "Privacy" },
  { file: "src/app/[locale]/terms/page.tsx", ns: "Terms" },
  { file: "src/app/[locale]/cookies/page.tsx", ns: "Cookies" },
];

function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

describe("páginas legales: todas las claves de traducción existen en es y en", () => {
  for (const locale of ["es", "en"]) {
    const messages = JSON.parse(readFileSync(join(root, `messages/${locale}.json`), "utf-8"));
    for (const { file, ns } of pages) {
      it(`${ns} (${locale})`, () => {
        const source = readFileSync(join(root, file), "utf-8");
        const keys = [...source.matchAll(/t(?:\.raw)?\(\s*"([^"]+)"/g)].map((m) => m[1]).filter((k) => k.startsWith("sections.") || k === "lastUpdate" || k === "controller");
        expect(keys.length).toBeGreaterThan(5);
        const missing = keys.filter((k) => typeof resolve(messages[ns], k) !== "string");
        expect(missing).toEqual([]);
      });
    }
  }

  it("la política publicada y la versión de consentimiento coinciden en es y en", () => {
    const es = JSON.parse(readFileSync(join(root, "messages/es.json"), "utf-8"));
    const en = JSON.parse(readFileSync(join(root, "messages/en.json"), "utf-8"));
    expect(Object.keys(es.Privacy.sections)).toEqual(Object.keys(en.Privacy.sections));
    expect(Object.keys(es.Terms.sections)).toEqual(Object.keys(en.Terms.sections));
  });
});
