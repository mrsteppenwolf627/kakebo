// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

/**
 * Bloque 2 — control de acceso Plus en las rutas de IA.
 * Se simula Supabase (sesión + fn_my_access) y los procesadores de IA: lo que se comprueba es la decisión de
 * acceso de cada ruta, no el trabajo de la IA.
 */

const h = vi.hoisted(() => ({
  user: { id: "11111111-1111-1111-1111-111111111111", email: "a@x.test" } as { id: string; email: string } | null,
  rpcResult: { data: null as unknown, error: null as unknown },
  rpcCalls: [] as unknown[][],
  worked: { count: 0 },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: h.user }, error: h.user ? null : { message: "no session" } }),
    },
    rpc: async (...args: unknown[]) => {
      h.rpcCalls.push(args);
      return h.rpcResult;
    },
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.single = async () => ({ data: { id: h.user?.id, email: h.user?.email, tier: "free" }, error: null });
      return q;
    },
  })),
}));

const work = () => {
  h.worked.count++;
  return {
    message: "ok", toolsUsed: [], metrics: {}, intent: "x", confirmationRequest: undefined,
    category: "survival", confidence: 1, reasoning: "", logId: "l",
  };
};
vi.mock("@/lib/agents", () => ({ processAgentMessage: vi.fn(async () => work()) }));
vi.mock("@/lib/agents-v2/function-caller", () => ({ processFunctionCalling: vi.fn(async () => work()) }));
vi.mock("@/lib/agents-v2/stream-caller", () => ({
  processFunctionCallingStream: vi.fn(async () => { work(); }),
}));
vi.mock("@/lib/ai", () => ({
  processMessage: vi.fn(async () => work()),
  classifyExpense: vi.fn(async () => ({ ...work(), metrics: {} })),
  classifyExpenses: vi.fn(async () => []),
  logAIInteraction: vi.fn(async () => undefined),
  getAIMetrics: vi.fn(async () => { work(); return {}; }),
  getRecentLogs: vi.fn(async () => []),
  getLearningMetrics: vi.fn(async () => ({})),
  searchExpensesByText: vi.fn(async () => { work(); return { results: [], queryTokens: 0, queryCostUsd: 0 }; }),
  recordCorrection: vi.fn(async () => { work(); return {}; }),
}));

import { POST as agentPOST } from "@/app/api/ai/agent/route";
import { POST as agentV2POST } from "@/app/api/ai/agent-v2/route";
import { POST as streamPOST } from "@/app/api/ai/agent-v2/stream/route";
import { POST as assistantPOST } from "@/app/api/ai/assistant/route";
import { POST as classifyPOST } from "@/app/api/ai/classify/route";
import { GET as metricsGET } from "@/app/api/ai/metrics/route";
import { POST as searchPOST } from "@/app/api/ai/search/route";
import { POST as feedbackPOST } from "@/app/api/ai/feedback/route";
import { POST as cancelConfirmationPOST } from "@/app/api/ai/agent-v2/cancel-confirmation/route";

const mk = (url: string, body?: unknown, method = "POST") =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const routes: [string, () => Promise<Response>][] = [
  ["/api/ai/agent", () => agentPOST(mk("/api/ai/agent", { message: "hola", history: [] }))],
  ["/api/ai/agent-v2", () => agentV2POST(mk("/api/ai/agent-v2", { message: "hola", history: [] }))],
  ["/api/ai/agent-v2/stream", () => streamPOST(mk("/api/ai/agent-v2/stream", { message: "hola", history: [] }))],
  ["/api/ai/assistant", () => assistantPOST(mk("/api/ai/assistant", { message: "hola", history: [] }))],
  ["/api/ai/classify", () => classifyPOST(mk("/api/ai/classify", { text: "café" }))],
  ["/api/ai/metrics", () => metricsGET(mk("/api/ai/metrics", undefined, "GET"))],
  ["/api/ai/search", () => searchPOST(mk("/api/ai/search", { query: "supermercado" }))],
];

// Rutas que DEBEN seguir abiertas a cualquier usuario autenticado (no son funciones Plus).
const openRoutes: [string, () => Promise<Response>][] = [
  ["/api/ai/feedback", () => feedbackPOST(mk("/api/ai/feedback", { logId: "00000000-0000-0000-0000-000000000001", correctedCategory: "optional" }))],
  ["/api/ai/agent-v2/cancel-confirmation", () => cancelConfirmationPOST(mk("/api/ai/agent-v2/cancel-confirmation", { confirmationId: "x" }))],
];

const perms = (premium: boolean) => ({
  can_create_expense: true, can_use_ai: premium, can_export_reports: premium,
  can_use_plus_features: premium, can_manage_billing: false,
});
const access = (state: string, premium: boolean) => ({ data: { state, is_premium: premium, permissions: perms(premium) }, error: null });
const bodyOf = async (r: Response) => r.json().catch(() => null);

beforeEach(() => {
  h.user = { id: "11111111-1111-1111-1111-111111111111", email: "a@x.test" };
  h.rpcResult = access("free_under_limit", false);
  h.rpcCalls.length = 0;
  h.worked.count = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("flag apagado: comportamiento actual intacto", () => {
  for (const value of [undefined, "", "false", "TRUE", "True", "1", "yes", " true", "true "]) {
    it(`PLUS_SUBSCRIPTIONS_ENABLED=${JSON.stringify(value)} no restringe ni consulta fn_my_access`, async () => {
      if (value !== undefined) vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", value);
      for (const [name, call] of routes) {
        const res = await call();
        expect(res.status, name).not.toBe(403);
        expect(res.status, name).not.toBe(503);
      }
      expect(h.rpcCalls).toHaveLength(0);
    });
  }
});

describe("flag encendido (valor exacto \"true\")", () => {
  beforeEach(() => vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "true"));

  for (const state of ["free_under_limit", "free_readonly"]) {
    it(`usuario gratuito (${state}): las 7 rutas de IA devuelven 403 PLUS_REQUIRED y no ejecutan nada`, async () => {
      h.rpcResult = access(state, false);
      for (const [name, call] of routes) {
        const res = await call();
        expect(res.status, name).toBe(403);
        const body = await bodyOf(res);
        expect(body.success, name).toBe(false);
        expect(body.error.code, name).toBe("PLUS_REQUIRED");
        expect(body.error.details).toEqual(expect.objectContaining({ upgrade: true, state }));
      }
      expect(h.worked.count).toBe(0);
    });
  }

  for (const state of ["trialing", "legacy_full", "plus_active", "plus_canceled_pending", "founder"]) {
    it(`usuario ${state}: las 7 rutas de IA le dejan pasar`, async () => {
      h.rpcResult = access(state, true);
      for (const [name, call] of routes) {
        const res = await call();
        expect(res.status, name).not.toBe(403);
        expect(res.status, name).not.toBe(503);
        expect(res.status, name).not.toBe(401);
      }
    });
  }

  it("/api/ai/search: bloqueada para gratis; permitida para trial, Plus, legacy_full y founder", async () => {
    h.rpcResult = access("free_under_limit", false);
    expect((await searchPOST(mk("/api/ai/search", { query: "super" }))).status).toBe(403);
    expect(h.worked.count).toBe(0);
    for (const state of ["trialing", "plus_active", "plus_canceled_pending", "legacy_full", "founder"]) {
      h.rpcResult = access(state, true);
      const res = await searchPOST(mk("/api/ai/search", { query: "super" }));
      expect(res.status, state).toBe(200);
    }
  });

  it("/api/ai/feedback y cancel-confirmation siguen abiertas para un usuario gratuito (sin consultar acceso)", async () => {
    h.rpcResult = access("free_readonly", false);
    for (const [name, call] of openRoutes) {
      const res = await call();
      expect(res.status, name).not.toBe(403);
      expect(res.status, name).not.toBe(503);
    }
    expect(h.rpcCalls).toHaveLength(0);
  });

  it("las rutas de mantenimiento de embeddings no usan requireAccess", () => {
    for (const f of ["migrate-embeddings", "process-embeddings", "feedback", "agent-v2/cancel-confirmation"]) {
      const src = fs.readFileSync(path.join(process.cwd(), "src/app/api/ai", f, "route.ts"), "utf8");
      expect(src, f).not.toMatch(/requireAccess/);
    }
  });

  it("sin sesión: 401 en todas las rutas y no se consulta el acceso", async () => {
    h.user = null;
    for (const [name, call] of routes) {
      const res = await call();
      expect(res.status, name).toBe(401);
    }
    expect(h.rpcCalls).toHaveLength(0);
    expect(h.worked.count).toBe(0);
  });

  it("fn_my_access falla: fail-closed 503 ACCESS_UNAVAILABLE sin filtrar detalles", async () => {
    h.rpcResult = { data: null, error: { code: "42501", message: "permission denied for table secret_table" } };
    for (const [name, call] of routes) {
      const res = await call();
      expect(res.status, name).toBe(503);
      const text = JSON.stringify(await bodyOf(res));
      expect(text, name).toContain("ACCESS_UNAVAILABLE");
      expect(text, name).not.toMatch(/secret_table|42501/);
    }
    expect(h.worked.count).toBe(0);
  });

  it("respuesta inesperada de fn_my_access (estado desconocido o permisos no booleanos): deniega", async () => {
    for (const data of [{ state: "hacker", permissions: perms(true) }, { state: "plus_active", permissions: { can_use_ai: "yes" } }, null, "x"]) {
      h.rpcResult = { data, error: null };
      const res = await agentV2POST(mk("/api/ai/agent-v2", { message: "hola", history: [] }));
      expect(res.status).toBe(503);
    }
  });

  it("user_id manipulado (cuerpo, query y cabeceras): fn_my_access se llama sin argumentos y el user_id se ignora", async () => {
    h.rpcResult = access("free_under_limit", false);
    const victim = "99999999-9999-9999-9999-999999999999";
    const req = new NextRequest(`http://localhost/api/ai/agent-v2?user_id=${victim}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": victim },
      body: JSON.stringify({ message: "hola", history: [], user_id: victim, userId: victim }),
    });
    const res = await agentV2POST(req);
    expect(res.status).toBe(403);
    expect(h.rpcCalls).toEqual([["fn_my_access"]]);
    expect(JSON.stringify(h.rpcCalls)).not.toContain(victim);
    expect(JSON.stringify(await bodyOf(res))).not.toContain(victim);
  });

  it("la denegación solo describe al propio usuario (sin datos de otros)", async () => {
    h.rpcResult = access("free_readonly", false);
    const res = await assistantPOST(mk("/api/ai/assistant", { message: "hola", history: [] }));
    const body = await bodyOf(res);
    expect(Object.keys(body.error.details).sort()).toEqual(["feature", "state", "upgrade"]);
  });
});
