import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import manifest from "@/app/manifest";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SRC = path.join(ROOT, "src");

// Dimensiones reales leídas de la cabecera IHDR del PNG (sin depender de librerías de imagen).
const pngSize = (file: string) => {
  const b = fs.readFileSync(file);
  expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

const publicFile = (url: string) => path.join(ROOT, "public", url.replace(/^\//, ""));

describe("iconos y manifest", () => {
  const icons = manifest().icons ?? [];

  it("cada icono del manifest existe y su tamaño declarado coincide con el archivo real", () => {
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) {
      const file = publicFile(icon.src);
      expect(fs.existsSync(file), `${icon.src} no existe en public/`).toBe(true);
      const [w, h] = String(icon.sizes).split("x").map(Number);
      expect(pngSize(file)).toEqual({ width: w, height: h });
    }
  });

  it("icon-512.png es realmente 512×512 y está optimizado (< 40 KB)", () => {
    const file = publicFile("/icon-512.png");
    expect(pngSize(file)).toEqual({ width: 512, height: 512 });
    expect(fs.statSync(file).size).toBeLessThan(40 * 1024);
  });

  it("icon.png (favicon / apple-touch-icon / manifest) es 192×192 y ligero (< 15 KB)", () => {
    const file = publicFile("/icon.png");
    expect(pngSize(file)).toEqual({ width: 192, height: 192 });
    expect(fs.statSync(file).size).toBeLessThan(15 * 1024);
  });

  it("src/app/icon.png y public/icon.png son el mismo archivo (sin divergencias)", () => {
    expect(fs.readFileSync(path.join(SRC, "app", "icon.png")).equals(fs.readFileSync(publicFile("/icon.png")))).toBe(true);
  });

  it("logo.png (logo de Organization/publisher) existe y es 512×512", () => {
    expect(pngSize(publicFile("/logo.png"))).toEqual({ width: 512, height: 512 });
  });

  it("la metadata del layout declara icon y apple-touch-icon con el tamaño real", () => {
    const layout = fs.readFileSync(path.join(SRC, "app", "[locale]", "layout.tsx"), "utf8");
    const declared = [...layout.matchAll(/url: "\/icon\.png", sizes: "(\d+)x(\d+)"/g)];
    expect(declared.length).toBe(2); // icon + apple
    for (const [, w, h] of declared) {
      expect({ width: Number(w), height: Number(h) }).toEqual(pngSize(publicFile("/icon.png")));
    }
  });

  it("toda URL pública de icon.png / icon-512.png / logo.png en el código (schema, metadata) apunta a un archivo existente", () => {
    const hits = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(full);
        } else if (/\.(ts|tsx|mdx)$/.test(entry.name)) {
          const text = fs.readFileSync(full, "utf8");
          for (const m of text.matchAll(/(?:https:\/\/www\.metodokakebo\.com)?\/(icon|icon-512|logo)\.png/g)) hits.add(`/${m[1]}.png`);
        }
      }
    };
    walk(SRC);
    expect(hits.size).toBeGreaterThanOrEqual(3);
    for (const url of hits) expect(fs.existsSync(publicFile(url)), `${url} referenciado pero no existe`).toBe(true);
  });
});
