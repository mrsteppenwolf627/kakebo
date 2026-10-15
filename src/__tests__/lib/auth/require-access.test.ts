// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@/lib/api/errors";
import { requireAccess, isPlusSubscriptionsEnabled, type AccessFeature } from "@/lib/auth/require-access";
import { resolveAccessState, getAccessPermissions, type AccessProfile } from "@/lib/auth/access-state";

const fake = (opts: { user?: boolean; rpc?: { data: unknown; error: unknown } }) => {
  const rpc = vi.fn(async () => opts.rpc ?? { data: null, error: null });
  return {
    client: {
      auth: { getUser: async () => ({ data: { user: opts.user === false ? null : { id: "u" } }, error: null }) },
      rpc,
    } as never,
    rpc,
  };
};
const allow = (state: string, p: Record<string, boolean>) => ({ data: { state, permissions: p }, error: null });
const ALL = { can_use_ai: true, can_export_reports: true, can_use_plus_features: true, can_manage_billing: true };
const NONE = { can_use_ai: false, can_export_reports: false, can_use_plus_features: false, can_manage_billing: false };

afterEach(() => vi.unstubAllEnvs());

describe("isPlusSubscriptionsEnabled", () => {
  it("solo el valor exacto \"true\" activa el interruptor", () => {
    expect(isPlusSubscriptionsEnabled({ PLUS_SUBSCRIPTIONS_ENABLED: "true" })).toBe(true);
    for (const v of [undefined, "", "false", "TRUE", "True", "1", "on", "true ", " true"]) {
      expect(isPlusSubscriptionsEnabled({ PLUS_SUBSCRIPTIONS_ENABLED: v })).toBe(false);
    }
  });
  it("no es una variable pública (sin prefijo NEXT_PUBLIC_) y no se usa en componentes de cliente", () => {
    const root = process.cwd();
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []);
    const offenders = walk(path.join(root, "src"))
      .filter((f) => !f.includes("__tests__"))
      .filter((f) => /process\.env\.PLUS_SUBSCRIPTIONS_ENABLED|env\.PLUS_SUBSCRIPTIONS_ENABLED/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f).replace(/\\/g, "/"));
    expect(offenders).toEqual(["src/lib/auth/require-access.ts"]);
    expect(fs.readFileSync(path.join(root, "src/lib/auth/require-access.ts"), "utf8")).not.toMatch(/NEXT_PUBLIC_PLUS/);
  });
});

describe("requireAccess", () => {
  it("flag apagado: no hace nada (ni sesión ni RPC)", async () => {
    const { client, rpc } = fake({ user: false });
    await expect(requireAccess("ai", client)).resolves.toEqual({ enforced: false, access: null });
    expect(rpc).not.toHaveBeenCalled();
  });

  describe("flag encendido", () => {
    const on = () => vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "true");

    it("sin sesión -> 401 UNAUTHORIZED", async () => {
      on();
      const { client, rpc } = fake({ user: false });
      await expect(requireAccess("ai", client)).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
      expect(rpc).not.toHaveBeenCalled();
    });

    for (const state of ["founder", "legacy_full", "plus_active", "plus_canceled_pending"]) {
      it(`${state}: permitido para todas las funciones premium`, async () => {
        on();
        for (const f of ["ai", "export_reports", "plus_features"] as AccessFeature[]) {
          const { client } = fake({ rpc: allow(state, { ...ALL, can_manage_billing: false }) });
          const r = await requireAccess(f, client);
          expect(r.enforced).toBe(true);
          expect(r.access?.state).toBe(state);
        }
      });
    }

    for (const state of ["free_under_limit", "free_readonly"]) {
      it(`${state}: PLUS_REQUIRED (403) para IA, informes y funciones Plus`, async () => {
        on();
        for (const f of ["ai", "export_reports", "plus_features", "billing"] as AccessFeature[]) {
          const { client } = fake({ rpc: allow(state, NONE) });
          const err = (await requireAccess(f, client).catch((e) => e)) as ApiError;
          expect(err).toBeInstanceOf(ApiError);
          expect(err.code).toBe("PLUS_REQUIRED");
          expect(err.status).toBe(403);
          expect(err.details).toEqual({ feature: f, state, upgrade: true });
        }
      });
    }

    it("billing solo para estados con suscripción (permiso can_manage_billing)", async () => {
      on();
      const ok = fake({ rpc: allow("plus_active", ALL) });
      await expect(requireAccess("billing", ok.client)).resolves.toBeTruthy();
      const no = fake({ rpc: allow("legacy_full", { ...ALL, can_manage_billing: false }) });
      await expect(requireAccess("billing", no.client)).rejects.toMatchObject({ code: "PLUS_REQUIRED" });
    });

    it("llama a fn_my_access sin argumentos (nunca con user_id)", async () => {
      on();
      const { client, rpc } = fake({ rpc: allow("plus_active", ALL) });
      await requireAccess("ai", client);
      expect(rpc.mock.calls).toEqual([["fn_my_access"]]);
    });

    it("error de RPC o respuesta rara -> 503 ACCESS_UNAVAILABLE (fail-closed)", async () => {
      on();
      for (const rpc of [
        { data: null, error: { message: "boom" } },
        { data: { state: "root", permissions: ALL }, error: null },
        { data: { state: "plus_active" }, error: null },
        { data: { state: "plus_active", permissions: { can_use_ai: 1 } }, error: null },
      ]) {
        const { client } = fake({ rpc });
        await expect(requireAccess("ai", client)).rejects.toMatchObject({ code: "ACCESS_UNAVAILABLE", status: 503 });
      }
    });
  });
});

describe("access-state.ts (espejo TypeScript): legacy_full y prioridades", () => {
  const NOW = new Date("2026-10-13T12:00:00Z");
  const base: AccessProfile = { is_founder: false, plus_access_until: null, trial_ends_at: null };
  const r = (p: Partial<AccessProfile>, n = 0) => resolveAccessState({ ...base, ...p }, { expensesThisMonth: n, now: NOW });

  it("legacy_full tiene prioridad sobre Plus, trial y free, pero no sobre founder", () => {
    expect(r({ hasLegacyFullGrant: true, trial_ends_at: "2020-01-01T00:00:00Z" }, 99)).toBe("legacy_full");
    expect(r({ hasLegacyFullGrant: true, plus_access_until: "2027-01-01T00:00:00Z" })).toBe("legacy_full");
    expect(r({ hasLegacyFullGrant: true, is_founder: true })).toBe("founder");
  });
  it("legacy_full: acceso premium completo, sin gestionar pago", () => {
    expect(getAccessPermissions("legacy_full")).toEqual({
      canCreateExpense: true, canEditOrDeleteExpense: true, canViewExpenses: true,
      canUseAI: true, canExport: true, canManageBilling: false,
    });
  });
  it("sin trial: trial_ends_at (legado) no concede IA ni informes; manda el contador gratuito", () => {
    expect(r({ trial_ends_at: "2026-10-20T00:00:00Z" }, 0)).toBe("free_under_limit");
    expect(r({ trial_ends_at: "2026-10-01T00:00:00Z" }, 29)).toBe("free_under_limit");
    expect(r({ trial_ends_at: "2026-10-01T00:00:00Z" }, 30)).toBe("free_readonly");
    expect(getAccessPermissions("free_under_limit")).toMatchObject({ canUseAI: false, canExport: false });
  });
});
