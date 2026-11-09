import { describe, it, expect } from "vitest";
import { isoMadrid, quarterInterval, graph, dataset } from "@/lib/seo/jsonld";

describe("isoMadrid: ISO 8601 con zona Europe/Madrid", () => {
  it.each([
    ["2026-02-24", "2026-02-24T00:00:00+01:00"], // invierno
    ["2026-07-15", "2026-07-15T00:00:00+02:00"], // verano
    ["2026-03-28", "2026-03-28T00:00:00+01:00"],
    ["2026-03-29", "2026-03-29T00:00:00+01:00"], // día del cambio a verano: la medianoche aún es +01:00
    ["2026-03-30", "2026-03-30T00:00:00+02:00"],
    ["2026-10-25", "2026-10-25T00:00:00+02:00"], // día del cambio a invierno: la medianoche aún es +02:00
    ["2026-10-26", "2026-10-26T00:00:00+01:00"],
  ])("%s → %s", (input, expected) => {
    expect(isoMadrid(input)).toBe(expected);
  });

  it("respeta las fechas que ya traen hora y zona", () => {
    expect(isoMadrid("2026-01-13T10:00:00Z")).toBe("2026-01-13T10:00:00Z");
    expect(isoMadrid("2026-05-01T08:30:00+02:00")).toBe("2026-05-01T08:30:00+02:00");
  });

  it("añade la zona de Madrid a una hora sin zona y no toca formatos desconocidos", () => {
    expect(isoMadrid("2026-05-01T08:30")).toBe("2026-05-01T08:30:00+02:00");
    expect(isoMadrid("2026-12-01T08:30:15")).toBe("2026-12-01T08:30:15+01:00");
    expect(isoMadrid("mañana")).toBe("mañana");
    expect(isoMadrid(undefined)).toBeUndefined();
  });
});

describe("graph(): normaliza datePublished/dateModified en un único punto", () => {
  it("convierte las fechas de cualquier nodo, también anidado", () => {
    const doc = graph([
      { "@type": "WebPage", "@id": "https://x/#p", dateModified: "2026-11-06", datePublished: "2026-01-13" },
      { "@type": "BlogPosting", "@id": "https://x/#a", datePublished: "2026-07-20", nested: { dateModified: "2026-02-24" } },
    ]) as { "@graph": Array<Record<string, any>> };
    expect(doc["@graph"][0].dateModified).toBe("2026-11-06T00:00:00+01:00");
    expect(doc["@graph"][0].datePublished).toBe("2026-01-13T00:00:00+01:00");
    expect(doc["@graph"][1].datePublished).toBe("2026-07-20T00:00:00+02:00");
    expect(doc["@graph"][1].nested.dateModified).toBe("2026-02-24T00:00:00+01:00");
  });
});

describe("Dataset: cobertura temporal y distribución solo con datos visibles", () => {
  it("quarterInterval convierte «N.º trimestre de AAAA» y no inventa nada si no encaja", () => {
    expect(quarterInterval("2.º trimestre de 2026")).toBe("2026-04-01/2026-06-30");
    expect(quarterInterval("1.º trimestre de 2026")).toBe("2026-01-01/2026-03-31");
    expect(quarterInterval("4.º trimestre de 2025")).toBe("2025-10-01/2025-12-31");
    expect(quarterInterval("primavera de 2026")).toBeUndefined();
  });

  it("dataset() solo emite temporalCoverage/distribution cuando se le dan", () => {
    const base = { id: "https://x/#d", name: "n", description: "d", url: "https://x/f.XLS", creatorName: "Org" };
    const sin = dataset(base);
    expect(sin).not.toHaveProperty("temporalCoverage");
    expect(sin).not.toHaveProperty("distribution");
    const con = dataset({ ...base, temporalCoverage: "2026-04-01/2026-06-30", distribution: { contentUrl: base.url, encodingFormat: "application/vnd.ms-excel" } });
    expect(con.temporalCoverage).toBe("2026-04-01/2026-06-30");
    expect(con.distribution).toEqual({ "@type": "DataDownload", contentUrl: base.url, encodingFormat: "application/vnd.ms-excel" });
  });
});
