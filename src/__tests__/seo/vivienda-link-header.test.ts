// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import middleware from "@/middleware";
import { getProvinciasPiloto } from "@/lib/vivienda";

// The global setup stubs next/navigation; the real routing config needs the real module.
vi.mock("next/navigation", async () => await vi.importActual("next/navigation"));

const linkOf = (path: string) => middleware(new NextRequest(`http://localhost:3000${path}`)).headers.get("link") ?? "";

describe("middleware Link header for /ahorro-entrada-vivienda", () => {
  it.each(getProvinciasPiloto().map((p) => p.slug))("/ahorro-entrada-vivienda/%s does not advertise hreflang=en", (slug) => {
    const link = linkOf(`/ahorro-entrada-vivienda/${slug}`);
    expect(link).not.toContain('hreflang="en"');
    expect(link).not.toContain("/en/ahorro-entrada-vivienda");
  });

  it("a path that only starts with the same letters keeps the default alternates", () => {
    expect(linkOf("/ahorro-entrada-vivienda-otra-cosa")).toContain('hreflang="en"');
  });

  it("other sections keep their es/en/x-default alternates", () => {
    const link = linkOf("/herramientas");
    expect(link).toContain('hreflang="en"');
    expect(link).toContain('hreflang="x-default"');
  });
});
