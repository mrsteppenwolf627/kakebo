// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { plain, visibleFaq, withVisibleAnswers, type FaqItem } from "@/lib/seo/jsonld";
import { INFLATION_FORMULA } from "@/components/landing/tools/inflation-formula";

const norm = (s: string) => plain(s).toLowerCase().replace(/[“”«»"']/g, "").replace(/\s+/g, " ").trim();

describe("withVisibleAnswers", () => {
  it("usa la respuesta de <FaqItem> cuando difiere de la del frontmatter", () => {
    const body = '<FaqItem question="¿Cuánto?">\nDepende **mucho** del [caso](/x).\n</FaqItem>';
    const out = withVisibleAnswers([{ question: "¿Cuánto?", answer: "Resumen distinto." }], body);
    expect(out).toEqual([{ question: "¿Cuánto?", answer: "Depende mucho del caso." }]);
  });

  it("usa la respuesta de una pregunta en negrita hasta el siguiente bloque", () => {
    const body = "## FAQ\n\n**How long?**\n\nFirst line.\n\nSecond line.\n\n**Next?**\n\nOther.";
    const out = withVisibleAnswers([{ question: "How long?", answer: "Summary." }], body);
    expect(out[0].answer).toBe("First line. Second line.");
  });

  it("no toca la respuesta si ya figura en el cuerpo ni si la pregunta no está", () => {
    const same: FaqItem = { question: "¿A?", answer: "Texto idéntico." };
    expect(withVisibleAnswers([same], '<FaqItem question="¿A?">Texto idéntico.</FaqItem>')).toEqual([same]);
    const missing: FaqItem = { question: "¿B?", answer: "Resumen." };
    expect(withVisibleAnswers([missing], "Nada relevante")).toEqual([missing]);
  });
});

describe("FAQ del JSON-LD de los artículos auditados = texto visible", () => {
  const cases = ["alternativas-a-app-bancarias.es", "como-hacer-un-presupuesto-personal.en"] as const;
  it.each(cases)("%s: cada respuesta emitida figura en el cuerpo", (name) => {
    const { data, content } = matter(readFileSync(join(process.cwd(), "src/content/blog", `${name}.mdx`), "utf8"));
    const fm = (data.faq ?? []) as FaqItem[];
    const faq = withVisibleAnswers(visibleFaq(fm, content), content);
    expect(faq.length).toBeGreaterThan(0);
    const visible = norm(content);
    for (const item of faq) expect(visible, item.question).toContain(norm(item.answer));
  });
});

describe("calculadora de inflación", () => {
  it("la fórmula visible es la constante compartida con el JSON-LD", () => {
    expect(INFLATION_FORMULA).toContain("IPC Final");
  });
});
