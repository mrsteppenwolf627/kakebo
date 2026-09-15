import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Fase 2.E (corrección de seguridad): ai_pending_actions es una tabla
 * exclusiva de servidor, accesible únicamente vía el cliente administrador
 * (createAdminClient(), service role key). Este test estático asegura que
 * NINGÚN módulo marcado "use client" (componente, hook) importa ese cliente
 * ni referencia la clave de servicio — si alguno lo hiciera, Next.js lo
 * empaquetaría para el navegador y filtraría credenciales de service role.
 */

const SRC_ROOT = path.resolve(__dirname, "..", "..");
const FORBIDDEN_PATTERNS = [
  /@\/lib\/supabase\/admin/,
  /createAdminClient/,
  /SUPABASE_SERVICE_ROLE_KEY/,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function isClientMarked(content: string): boolean {
  // The "use client" directive must be the first statement in the file
  // (ignoring blank lines and comments) for Next.js to treat it as a
  // Client Component/hook boundary.
  const firstStatementMatch = content.match(/^(?:\s*\/\/.*\n|\s*\/\*[\s\S]*?\*\/\s*\n|\s*\n)*\s*(['"])use client\1/);
  return !!firstStatementMatch;
}

describe("Aislamiento del cliente administrador (Fase 2.E — corrección de seguridad)", () => {
  const allFiles = walk(SRC_ROOT);
  const clientFiles = allFiles.filter((f) => isClientMarked(fs.readFileSync(f, "utf8")));

  it("hay al menos un módulo 'use client' en el proyecto (sanity check de que el escaneo funciona)", () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it("ningún módulo 'use client' (hook o componente) importa el cliente administrador ni la clave de service role", () => {
    const offenders: Array<{ file: string; pattern: string }> = [];

    for (const file of clientFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          offenders.push({ file: path.relative(SRC_ROOT, file), pattern: pattern.source });
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("useAgent.ts (hook activo del chat) y los componentes de AIChat están marcados 'use client' y no importan el cliente admin", () => {
    const mustBeClientFiles = [
      path.join(SRC_ROOT, "hooks", "useAgent.ts"),
      path.join(SRC_ROOT, "components", "AIChat", "AIChat.tsx"),
      path.join(SRC_ROOT, "components", "AIChat", "ConfirmationModal.tsx"),
    ];

    for (const file of mustBeClientFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(isClientMarked(content)).toBe(true);
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(pattern.test(content)).toBe(false);
      }
    }
  });

  it("pending-actions.ts (servidor) SÍ usa createAdminClient — confirma que el escaneo distingue servidor de cliente", () => {
    const serverFile = path.join(SRC_ROOT, "lib", "agents-v2", "pending-actions.ts");
    const content = fs.readFileSync(serverFile, "utf8");
    expect(isClientMarked(content)).toBe(false);
    expect(content).toMatch(/createAdminClient/);
  });
});
