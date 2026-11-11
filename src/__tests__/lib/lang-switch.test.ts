// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { englishEquivalentLinkable, BLOG_SLUGS_WITHOUT_LINKABLE_EN } from "@/lib/lang-switch";

const DIR = join(process.cwd(), "src", "content", "blog");
const files = readdirSync(DIR);
const slugs = (suffix: string) => files.filter((f) => f.endsWith(suffix)).map((f) => f.slice(0, -suffix.length));
const es = slugs(".es.mdx");
const en = new Set(slugs(".en.mdx"));
const enNoindex = new Set([...en].filter((s) => /^noindex:\s*true\s*$/m.test(readFileSync(join(DIR, `${s}.en.mdx`), "utf8"))));

describe("lang-switch: qué páginas enlazan a su versión EN", () => {
  it("la lista de artículos sin EN enlazable coincide con los .mdx (sin EN, o EN noindex)", () => {
    const expected = new Set([...es.filter((s) => !en.has(s)), ...enNoindex]);
    expect([...BLOG_SLUGS_WITHOUT_LINKABLE_EN].sort()).toEqual([...expected].sort());
  });

  it.each(["/", "/blog", "/herramientas", "/herramientas/calculadora-ahorro", "/sobre-nosotros", "/tutorial"])("%s enlaza", (p) => {
    expect(englishEquivalentLinkable(p)).toBe(true);
  });

  it("los artículos con EN indexable enlazan; los demás no", () => {
    for (const s of es) expect(englishEquivalentLinkable(`/blog/${s}`), s).toBe(en.has(s) && !enNoindex.has(s));
  });

  it("las secciones solo en español (plantillas, vivienda) no enlazan a /en (darían 404)", () => {
    for (const p of ["/plantillas", "/plantillas/kakebo-2027", "/ahorro-entrada-vivienda", "/ahorro-entrada-vivienda/madrid"]) {
      expect(englishEquivalentLinkable(p), p).toBe(false);
    }
  });
});
