import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { describe, it, expect } from "vitest";

// The FAQPage JSON-LD schema (src/app/[locale]/(public)/blog/[slug]/page.tsx)
// is generated exclusively from `frontmatter.faq`, while the visible FAQ is
// rendered from separate <FaqItem question="..."> blocks in the MDX body.
// Nothing enforces these two lists staying in sync, so a question added,
// removed, or reordered in one place but not the other silently desyncs the
// visible page from what Google/AI Overviews read as structured data.
// Scoped to this single URL — does not touch the shared MDXComponents or
// the blog page template.
const MDX_PATH = path.join(
  process.cwd(),
  "src/content/blog/alternativas-a-app-bancarias.es.mdx"
);

function extractBodyFaqQuestions(content: string): string[] {
  const matches = [...content.matchAll(/<FaqItem question="([^"]+)">/g)];
  return matches.map((m) => m[1]);
}

describe("alternativas-a-app-bancarias.es.mdx FAQ sync", () => {
  const fileContent = fs.readFileSync(MDX_PATH, "utf8");
  const { data, content } = matter(fileContent);
  const frontmatterQuestions: string[] = (data.faq ?? []).map(
    (item: { question: string }) => item.question
  );
  const bodyQuestions = extractBodyFaqQuestions(content);

  it("has the same number of questions in frontmatter and in the visible FaqSection", () => {
    expect(bodyQuestions.length).toBe(frontmatterQuestions.length);
  });

  it("has no duplicated questions in either source", () => {
    expect(new Set(frontmatterQuestions).size).toBe(frontmatterQuestions.length);
    expect(new Set(bodyQuestions).size).toBe(bodyQuestions.length);
  });

  it("lists the exact same questions, in the same order, in frontmatter (FAQPage schema) and in the visible FaqSection", () => {
    expect(bodyQuestions).toEqual(frontmatterQuestions);
  });
});
