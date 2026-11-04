// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import middleware from "@/middleware";
import { getPlantillas } from "@/lib/plantillas";

// The global setup stubs next/navigation; the real routing config needs the real module.
vi.mock("next/navigation", async () => await vi.importActual("next/navigation"));

const BASE = "http://localhost:3000";
const linkOf = (path: string) => middleware(new NextRequest(`${BASE}${path}`)).headers.get("link") ?? "";

describe("middleware Link header (hreflang alternates)", () => {
  it.each(getPlantillas().map((p) => p.slug))("/plantillas/%s does not advertise hreflang=en", (slug) => {
    const link = linkOf(`/plantillas/${slug}`);
    expect(link).not.toContain('hreflang="en"');
    expect(link).not.toContain("/en/plantillas");
  });

  it("an unknown /plantillas/ slug does not advertise hreflang either", () => {
    expect(linkOf("/plantillas/no-existe")).not.toContain('hreflang="en"');
  });

  it.each(["/blog/plantilla-kakebo-excel", "/herramientas", "/"])("%s keeps its es/en/x-default alternates", (path) => {
    const link = linkOf(path);
    expect(link).toContain('hreflang="en"');
    expect(link).toContain('hreflang="es"');
    expect(link).toContain('hreflang="x-default"');
  });

  it("a path that only starts with the same letters is not treated as /plantillas", () => {
    expect(linkOf("/plantillas-otra-cosa")).toContain('hreflang="en"');
  });
});
