import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { SERVER_ONLY_NAMESPACES, pickClientMessages } from "@/i18n/client-messages";

const SRC = path.resolve(__dirname, "..", "..");

const walk = (dir: string, out: string[] = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const files = walk(SRC).map((file) => ({ file, text: fs.readFileSync(file, "utf8") }));
const clientFiles = files.filter(({ text }) => /^\s*(["'])use client\1/.test(text.slice(0, 200)));

describe("mensajes que el layout raíz envía al navegador", () => {
  it.each([
    ["es", esMessages],
    ["en", enMessages],
  ] as const)("(%s) excluye los namespaces solo de servidor y conserva el resto", (_locale, messages) => {
    const picked = pickClientMessages(messages as Record<string, unknown>);
    for (const namespace of SERVER_ONLY_NAMESPACES) expect(picked).not.toHaveProperty(namespace);
    for (const namespace of Object.keys(messages)) {
      if (!(SERVER_ONLY_NAMESPACES as readonly string[]).includes(namespace) && namespace !== "About") {
        expect(picked[namespace]).toEqual((messages as Record<string, unknown>)[namespace]);
      }
    }
    expect(Object.keys(picked.About as object)).toEqual(["contact"]);
  });

  it("ningún componente cliente lee un namespace que no se envía al navegador", () => {
    expect(clientFiles.length).toBeGreaterThan(10);
    const offenders: string[] = [];
    for (const { file, text } of clientFiles) {
      if (/useMessages\(/.test(text)) offenders.push(`${file}: useMessages`);
      for (const [, quoted] of text.matchAll(/useTranslations\(\s*(["'`])([^"'`]+)\1\s*\)/g).map((m) => [m[0], m[2]])) {
        const [root, ...rest] = quoted.split(".");
        if (root === "Tools") continue; // lo entrega ToolMessages (ver tool-messages.test.tsx)
        if ((SERVER_ONLY_NAMESPACES as readonly string[]).includes(root)) offenders.push(`${file}: ${quoted}`);
        if (root === "About" && rest[0] !== "contact") offenders.push(`${file}: ${quoted}`);
      }
      if (/useTranslations\(\s*(?!["'`)])/.test(text)) offenders.push(`${file}: namespace no literal`);
    }
    expect(offenders).toEqual([]);
  });
});
