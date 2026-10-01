import { describe, it, expect } from "vitest";
import {
  resolveAccessState,
  getAccessPermissions,
  resolveAccess,
  getExpensePeriodKey,
  type AccessProfile,
} from "@/lib/auth/access-state";

const NOW = new Date("2026-09-16T12:00:00Z");

function baseProfile(overrides: Partial<AccessProfile> = {}): AccessProfile {
  return {
    is_founder: false,
    plus_access_until: null,
    trial_ends_at: null,
    ...overrides,
  };
}

describe("resolveAccessState — prioridad de los 6 estados", () => {
  it("founder gana siempre, aunque el resto de campos digan lo contrario", () => {
    const profile = baseProfile({
      is_founder: true,
      // Plus caducado, trial caducado, límite superado — nada de esto debería importar
      plus_access_until: new Date(NOW.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      trial_ends_at: new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 999, now: NOW })
    ).toBe("founder");
  });

  it("plus_active cuando plus_access_until está en el futuro y no está marcado para cancelar", () => {
    const profile = baseProfile({
      plus_access_until: new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      subscriptionCancelAtPeriodEnd: false,
    });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 0, now: NOW })
    ).toBe("plus_active");
  });

  it("plus_canceled_pending cuando plus_access_until está en el futuro pero cancel_at_period_end es true", () => {
    const profile = baseProfile({
      plus_access_until: new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      subscriptionCancelAtPeriodEnd: true,
    });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 0, now: NOW })
    ).toBe("plus_canceled_pending");
  });

  it("trialing cuando trial_ends_at está en el futuro y no hay founder ni Plus vigente", () => {
    const profile = baseProfile({
      trial_ends_at: new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 0, now: NOW })
    ).toBe("trialing");
  });

  it("un plus_access_until ya vencido no bloquea caer a trialing si el trial sigue vigente", () => {
    const profile = baseProfile({
      plus_access_until: new Date(NOW.getTime() - 1000).toISOString(),
      trial_ends_at: new Date(NOW.getTime() + 1000 * 60 * 60 * 24).toISOString(),
    });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 0, now: NOW })
    ).toBe("trialing");
  });

  it("free_under_limit cuando no hay founder/Plus/trial vigente y quedan menos de 30 gastos este mes", () => {
    const profile = baseProfile();
    expect(
      resolveAccessState(profile, { expensesThisMonth: 29, now: NOW })
    ).toBe("free_under_limit");
  });

  it("free_readonly justo al llegar a 30 gastos este mes", () => {
    const profile = baseProfile();
    expect(
      resolveAccessState(profile, { expensesThisMonth: 30, now: NOW })
    ).toBe("free_readonly");
  });

  it("free_readonly también por encima de 30", () => {
    const profile = baseProfile();
    expect(
      resolveAccessState(profile, { expensesThisMonth: 57, now: NOW })
    ).toBe("free_readonly");
  });

  it("trial recién expirado (now === trial_ends_at) cuenta como expirado, no como trialing", () => {
    const profile = baseProfile({ trial_ends_at: NOW.toISOString() });
    expect(
      resolveAccessState(profile, { expensesThisMonth: 0, now: NOW })
    ).toBe("free_under_limit");
  });
});

describe("resolveAccessState — campos heredados tier/manual_override nunca conceden permisos", () => {
  it("tier='pro' no cambia el resultado si no hay founder ni plus_access_until", () => {
    const withPro = baseProfile({ tier: "pro" });
    const withoutTier = baseProfile();
    const ctx = { expensesThisMonth: 5, now: NOW };
    expect(resolveAccessState(withPro, ctx)).toBe(
      resolveAccessState(withoutTier, ctx)
    );
    expect(resolveAccessState(withPro, ctx)).toBe("free_under_limit");
  });

  it("manual_override=true no cambia el resultado si is_founder es false", () => {
    const withOverride = baseProfile({ manual_override: true });
    const ctx = { expensesThisMonth: 40, now: NOW };
    expect(resolveAccessState(withOverride, ctx)).toBe("free_readonly");
  });

  it("tier y manual_override juntos, sin is_founder ni plus_access_until, siguen sin conceder acceso", () => {
    const legacy = baseProfile({ tier: "pro", manual_override: true });
    expect(
      resolveAccessState(legacy, { expensesThisMonth: 40, now: NOW })
    ).toBe("free_readonly");
  });
});

describe("getAccessPermissions — permisos de IA y exportación", () => {
  it("founder: IA y exportación permitidas", () => {
    const perms = getAccessPermissions("founder");
    expect(perms.canUseAI).toBe(true);
    expect(perms.canExport).toBe(true);
  });

  it("plus_active y plus_canceled_pending: IA y exportación permitidas, idénticos entre sí", () => {
    expect(getAccessPermissions("plus_active")).toEqual(
      getAccessPermissions("plus_canceled_pending")
    );
    expect(getAccessPermissions("plus_active").canExport).toBe(true);
  });

  it("trialing: IA permitida, exportación NO permitida", () => {
    const perms = getAccessPermissions("trialing");
    expect(perms.canUseAI).toBe(true);
    expect(perms.canExport).toBe(false);
  });

  it("free_under_limit: sin IA, sin exportación, pero puede crear/editar gastos", () => {
    const perms = getAccessPermissions("free_under_limit");
    expect(perms.canUseAI).toBe(false);
    expect(perms.canExport).toBe(false);
    expect(perms.canCreateExpense).toBe(true);
    expect(perms.canEditOrDeleteExpense).toBe(true);
  });

  it("free_readonly: modo consulta — sin crear/editar/borrar, sin IA, sin exportación, pero puede consultar", () => {
    const perms = getAccessPermissions("free_readonly");
    expect(perms.canCreateExpense).toBe(false);
    expect(perms.canEditOrDeleteExpense).toBe(false);
    expect(perms.canUseAI).toBe(false);
    expect(perms.canExport).toBe(false);
    expect(perms.canViewExpenses).toBe(true);
  });

  it("ningún estado permite gestionar pago salvo los dos estados Plus", () => {
    const states = [
      "founder",
      "plus_active",
      "plus_canceled_pending",
      "trialing",
      "free_under_limit",
      "free_readonly",
    ] as const;
    for (const state of states) {
      const canManage = getAccessPermissions(state).canManageBilling;
      const expected = state === "plus_active" || state === "plus_canceled_pending";
      expect(canManage).toBe(expected);
    }
  });
});

describe("resolveAccess — conveniencia estado + permisos", () => {
  it("combina resolveAccessState y getAccessPermissions coherentemente", () => {
    const profile = baseProfile({ is_founder: true });
    const result = resolveAccess(profile, { expensesThisMonth: 0, now: NOW });
    expect(result.state).toBe("founder");
    expect(result.permissions).toEqual(getAccessPermissions("founder"));
  });
});

describe("getExpensePeriodKey — periodo mensual Europe/Madrid", () => {
  it("devuelve YYYY-MM en zona horaria Europe/Madrid", () => {
    // 2026-01-01T00:30:00Z es 2026-01-01 01:30 en Madrid (CET, UTC+1) — mismo mes
    expect(getExpensePeriodKey(new Date("2026-01-01T00:30:00Z"))).toBe("2026-01");
  });

  it("una fecha cercana a medianoche que cruza el cambio de mes en Madrid usa el mes de Madrid, no el de UTC", () => {
    // 2026-01-31T23:30:00Z es 2026-02-01 00:30 en Madrid (CET, UTC+1) -> febrero
    expect(getExpensePeriodKey(new Date("2026-01-31T23:30:00Z"))).toBe("2026-02");
  });

  it("respeta el horario de verano (CEST, UTC+2)", () => {
    // 2026-06-30T22:30:00Z es 2026-07-01 00:30 en Madrid (CEST, UTC+2) -> julio
    expect(getExpensePeriodKey(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07");
  });
});
