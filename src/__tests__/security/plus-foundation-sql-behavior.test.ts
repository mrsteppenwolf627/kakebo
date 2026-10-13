// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Plus foundation (Bloque 1) — COMPORTAMIENTO SQL REAL.
 *
 * Ejecuta las migraciones REALES del repo (20261013*_plus_*.sql) contra un Postgres en memoria (PGlite)
 * con una simulación mínima de Supabase (roles anon/authenticated/service_role, auth.uid(), RLS y los
 * privilegios por defecto del esquema `public`). No toca ninguna base remota.
 */

const MIG_DIR = path.join(process.cwd(), "supabase", "migrations");
const plusMigrations = fs
  .readdirSync(MIG_DIR)
  .filter((f) => /^\d{14}_plus_.*\.sql$/.test(f))
  .sort();

const BASE = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
CREATE TYPE subscription_tier AS ENUM ('free','pro');
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tier subscription_tier DEFAULT 'free', trial_started_at timestamptz, trial_ends_at timestamptz,
  stripe_customer_id text, stripe_subscription_id text, manual_override boolean DEFAULT false,
  is_founder boolean DEFAULT false, founder_captured_at timestamptz, plus_access_until timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TABLE public.subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id), stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL, status text NOT NULL, plan_interval text NOT NULL,
  current_period_end timestamptz NOT NULL, cancel_at_period_end boolean NOT NULL DEFAULT false,
  last_event_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id), CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id));
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated; -- como 20260916_phase3b_monetization_foundation.sql
CREATE TABLE public.stripe_webhook_events (stripe_event_id text PRIMARY KEY, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
CREATE TABLE public.expense_monthly_usage (user_id uuid NOT NULL, period text NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, period));
CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid) RETURNS timestamptz LANGUAGE sql AS $$ SELECT NULL::timestamptz $$;
REVOKE ALL ON FUNCTION public.fn_recompute_plus_access_until(uuid) FROM PUBLIC, anon, authenticated; -- como la migración original
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN INSERT INTO public.profiles (id, tier, trial_ends_at) VALUES (new.id, 'free', now() + interval '14 days'); RETURN new; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

let db: PGlite;
const T0 = "2026-10-13T12:00:00Z";
const ids: Record<string, string> = {};
let n = 0;
const uuid = () => `00000000-0000-0000-0000-${String(++n).padStart(12, "0")}`;

async function newUser(name: string) {
  const id = (ids[name] = uuid());
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${id}','${name}@x.test');`);
  return id;
}
const q = async <T = any>(sql: string) => (await db.query<T>(sql)).rows;
const state = async (id: string, at = T0) =>
  (await q<{ s: string }>(`SELECT public.fn_resolve_access_state('${id}','${at}') s`))[0].s;
const asUser = (id: string) =>
  db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${id}',false); SET ROLE authenticated;`);
const asRole = (role: string) =>
  db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false); SET ROLE ${role};`);
const reset = () => db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);`);

let evt = 0;
async function apply(
  user: string | null,
  sub: Record<string, unknown>,
  opts: { id?: string; created?: string } = {},
) {
  const id = opts.id ?? `evt_${++evt}`;
  const payload = JSON.stringify({
    subscription_id: "sub_a",
    customer_id: "cus_a",
    status: "active",
    interval: "monthly",
    current_period_start: "2026-10-13T00:00:00Z",
    current_period_end: "2026-11-13T00:00:00Z",
    cancel_at_period_end: false,
    ...sub,
  });
  const r = await q<{ r: any }>(
    `SELECT public.fn_apply_subscription_event('${id}','customer.subscription.updated',false,'${opts.created ?? T0}',${
      user ? `'${user}'` : "NULL"
    },'${payload}'::jsonb) r`,
  );
  return r[0].r as { applied: boolean; result: string; reason?: string; state?: string };
}
async function denied(sql: string) {
  try {
    await db.exec(sql);
    return "ALLOWED";
  } catch (e: any) {
    return e.code ?? e.message;
  } finally {
    await reset();
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(BASE);
  // usuario previo a las migraciones (sin trial_started_at)
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${(ids.pre = uuid())}','pre@x.test');`);
  for (const f of plusMigrations) await db.exec(fs.readFileSync(path.join(MIG_DIR, f), "utf8"));
}, 60_000);

describe("migraciones Plus: orden y aplicación", () => {
  it("hay exactamente 5 migraciones plus con versiones ordenadas y no futuras", () => {
    expect(plusMigrations).toHaveLength(5);
    for (const f of plusMigrations) expect(f.slice(0, 8) <= "20261231").toBe(true);
    const all = fs.readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    expect(all.slice(-5)).toEqual(plusMigrations);
  });
});

describe("trial de 14 días y estados gratuitos", () => {
  it("usuario nuevo: trial_started_at = now() y trial de 14 días", async () => {
    const id = await newUser("trial");
    const [p] = await q<{ d: number; s: boolean }>(
      `SELECT extract(epoch FROM (trial_ends_at - trial_started_at))/86400 d, trial_started_at IS NOT NULL s FROM public.profiles WHERE id='${id}'`,
    );
    expect(p.s).toBe(true);
    expect(Math.round(p.d)).toBe(14);
    const [{ t }] = await q<{ t: string }>(`SELECT public.fn_resolve_access_state('${id}', now()) t`);
    expect(t).toBe("trialing");
  });

  it("usuario previo no se modifica por las migraciones", async () => {
    const [p] = await q<{ s: boolean; t: string }>(`SELECT trial_started_at IS NULL s, tier t FROM public.profiles WHERE id='${ids.pre}'`);
    expect(p.s).toBe(true);
    expect(p.t).toBe("free");
  });

  it("trial terminado -> free_under_limit; con 30 gastos -> free_readonly; mes siguiente -> free_under_limit", async () => {
    const id = await newUser("free");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    expect(await state(id)).toBe("free_under_limit");
    await db.exec(`INSERT INTO public.expense_monthly_usage VALUES ('${id}','2026-10',30)`);
    expect(await state(id)).toBe("free_readonly");
    expect(await state(id, "2026-11-05T12:00:00Z")).toBe("free_under_limit");
  });

  it("el mes se calcula en Europe/Madrid (31 oct 23:30 UTC ya es noviembre)", async () => {
    const id = await newUser("madrid");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await db.exec(`INSERT INTO public.expense_monthly_usage VALUES ('${id}','2026-10',30)`);
    expect(await state(id, "2026-10-31T22:30:00Z")).toBe("free_readonly");
    expect(await state(id, "2026-10-31T23:30:00Z")).toBe("free_under_limit");
  });

  it("perfil inexistente -> error KB002", async () => {
    await expect(state(uuid())).rejects.toThrow(/Perfil no encontrado/);
  });
});

describe("founder y legacy_full", () => {
  it("founder tiene prioridad", async () => {
    const id = await newUser("founder");
    await db.exec(`UPDATE public.profiles SET is_founder = true WHERE id='${id}'`);
    expect(await state(id)).toBe("founder");
  });

  it("legacy_full activo concede acceso permanente; revocado no", async () => {
    const id = await newUser("legacy");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type, metadata) VALUES ('${id}','legacy_full','{"t":1}')`);
    expect(await state(id)).toBe("legacy_full");
    expect(await state(id, "2030-01-01T00:00:00Z")).toBe("legacy_full");
    await db.exec(`UPDATE public.access_grants SET revoked_at = now() WHERE user_id='${id}'`);
    expect(await state(id)).toBe("free_under_limit");
  });

  it("solo un grant activo por usuario y tipo", async () => {
    const id = await newUser("legacy2");
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${id}','legacy_full')`);
    await expect(
      db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${id}','legacy_full')`),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it("founder > legacy_full > plus", async () => {
    const id = await newUser("prio");
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${id}','legacy_full')`);
    await apply(id, { subscription_id: "sub_prio", customer_id: "cus_prio", current_period_end: "2026-12-01T00:00:00Z" });
    expect(await state(id)).toBe("legacy_full");
    await db.exec(`UPDATE public.profiles SET is_founder = true WHERE id='${id}'`);
    expect(await state(id)).toBe("founder");
  });
});

describe("Plus, cancelación y gracia de 3 días", () => {
  it("active -> plus_active y actualiza plus_access_until", async () => {
    const id = await newUser("plus");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    const r = await apply(id, { subscription_id: "sub_plus", customer_id: "cus_plus" });
    expect(r).toMatchObject({ applied: true, result: "applied" });
    expect(await state(id)).toBe("plus_active");
    const [p] = await q<{ u: string }>(`SELECT plus_access_until::text u FROM public.profiles WHERE id='${id}'`);
    expect(p.u).toContain("2026-11-13");
  });

  it("cancel_at_period_end -> plus_canceled_pending hasta fin de periodo, luego sin acceso", async () => {
    const id = await newUser("cancel");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await apply(id, { subscription_id: "sub_c", customer_id: "cus_c", cancel_at_period_end: true });
    expect(await state(id)).toBe("plus_canceled_pending");
    expect(await state(id, "2026-11-13T00:00:01Z")).toBe("free_under_limit");
  });

  it("un trialing de Stripe cuenta como Plus; incomplete/canceled/unpaid/paused no", async () => {
    const id = await newUser("statuses");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    let t = 0;
    for (const [status, expected] of [
      ["trialing", "plus_active"], ["incomplete", "free_under_limit"], ["canceled", "free_under_limit"],
      ["unpaid", "free_under_limit"], ["paused", "free_under_limit"], ["incomplete_expired", "free_under_limit"],
    ] as const) {
      await apply(id, { subscription_id: "sub_s", customer_id: "cus_s", status }, { created: `2026-10-13T12:00:0${++t}Z` });
      expect(await state(id), status).toBe(expected);
    }
  });

  it("past_due: gracia de 3 días desde current_period_start", async () => {
    const id = await newUser("pastdue");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await apply(id, {
      subscription_id: "sub_pd", customer_id: "cus_pd", status: "past_due",
      current_period_start: "2026-10-11T12:00:00Z", current_period_end: "2026-11-11T12:00:00Z",
    });
    expect(await state(id, "2026-10-14T11:59:59Z")).toBe("plus_active");
    expect(await state(id, "2026-10-14T12:00:01Z")).toBe("free_under_limit");
  });

  it("past_due con inicio de hace 4 días -> sin acceso Plus", async () => {
    const id = await newUser("pastdue2");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await apply(id, {
      subscription_id: "sub_pd2", customer_id: "cus_pd2", status: "past_due",
      current_period_start: "2026-10-09T12:00:00Z", current_period_end: "2026-11-09T12:00:00Z",
    });
    expect(await state(id)).toBe("free_under_limit");
  });

  it("insertar una fila sin estado válido no concede acceso (service_role directo)", async () => {
    const id = await newUser("rowonly");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await db.exec(
      `INSERT INTO public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval, current_period_end)
       VALUES ('${id}','cus_r','sub_r','incomplete','monthly','2027-01-01T00:00:00Z')`,
    );
    expect(await state(id)).toBe("free_under_limit");
  });
});

describe("eventos: duplicados, desorden, aislamiento", () => {
  it("evento duplicado: no se vuelve a aplicar", async () => {
    const id = await newUser("dup");
    expect((await apply(id, { subscription_id: "sub_d", customer_id: "cus_d" }, { id: "evt_dup" })).result).toBe("applied");
    const second = await apply(id, { subscription_id: "sub_d", customer_id: "cus_d", status: "canceled" }, { id: "evt_dup" });
    expect(second).toMatchObject({ applied: false, result: "duplicate" });
    const [s] = await q<{ status: string }>(`SELECT status FROM public.subscriptions WHERE stripe_subscription_id='sub_d'`);
    expect(s.status).toBe("active");
    const [{ c }] = await q<{ c: number }>(`SELECT count(*)::int c FROM public.stripe_webhook_events WHERE stripe_event_id='evt_dup'`);
    expect(c).toBe(1);
  });

  it("evento desordenado: uno anterior no pisa el estado más reciente", async () => {
    const id = await newUser("ooo");
    await db.exec(`UPDATE public.profiles SET trial_ends_at = '2026-10-01T00:00:00Z' WHERE id='${id}'`);
    await apply(id, { subscription_id: "sub_o", customer_id: "cus_o" }, { created: "2026-10-13T12:00:10Z" });
    const old = await apply(id, { subscription_id: "sub_o", customer_id: "cus_o", status: "canceled" }, { created: "2026-10-13T12:00:05Z" });
    expect(old).toMatchObject({ applied: false, result: "stale" });
    expect(await state(id)).toBe("plus_active");
    const newer = await apply(id, { subscription_id: "sub_o", customer_id: "cus_o", status: "canceled" }, { created: "2026-10-13T12:00:20Z" });
    expect(newer.applied).toBe(true);
    expect(await state(id)).toBe("free_under_limit");
  });

  it("usuario inexistente: se ignora sin crear nada", async () => {
    const r = await apply(uuid(), { subscription_id: "sub_g", customer_id: "cus_g" });
    expect(r).toMatchObject({ applied: false, result: "ignored", reason: "user_not_found" });
    expect(await q(`SELECT 1 FROM public.subscriptions WHERE stripe_subscription_id='sub_g'`)).toHaveLength(0);
    expect((await apply(null, { subscription_id: "sub_g2", customer_id: "cus_g2" })).reason).toBe("user_not_found");
  });

  it("la suscripción de otro usuario se ignora y no cambia de propietario", async () => {
    const a = await newUser("ownerA");
    const b = await newUser("otherB");
    await apply(a, { subscription_id: "sub_own", customer_id: "cus_ownA" });
    const r = await apply(b, { subscription_id: "sub_own", customer_id: "cus_ownB" });
    expect(r).toMatchObject({ applied: false, result: "ignored", reason: "subscription_belongs_to_other_user" });
    const [s] = await q<{ user_id: string }>(`SELECT user_id FROM public.subscriptions WHERE stripe_subscription_id='sub_own'`);
    expect(s.user_id).toBe(a);
    expect(await state(b)).not.toMatch(/^plus/);
  });

  it("un cliente de Stripe de otro usuario se ignora; un usuario con otro cliente también", async () => {
    const a = await newUser("custA");
    const b = await newUser("custB");
    await apply(a, { subscription_id: "sub_ca", customer_id: "cus_shared" });
    expect((await apply(b, { subscription_id: "sub_cb", customer_id: "cus_shared" })).reason).toBe("customer_belongs_to_other_user");
    expect((await apply(a, { subscription_id: "sub_ca2", customer_id: "cus_other" })).reason).toBe("user_has_other_customer");
  });

  it("payload inválido: excepción y el evento no queda registrado (rollback)", async () => {
    const id = await newUser("badpayload");
    await expect(
      db.exec(`SELECT public.fn_apply_subscription_event('evt_bad','x',false,'${T0}','${id}','{"subscription_id":"bad"}'::jsonb)`),
    ).rejects.toThrow(/Datos de suscripción inválidos/);
    expect(await q(`SELECT 1 FROM public.stripe_webhook_events WHERE stripe_event_id='evt_bad'`)).toHaveLength(0);
  });

  it("un fallo registrado no revoca el acceso Plus y no degrada un evento procesado", async () => {
    const id = await newUser("failsafe");
    await apply(id, { subscription_id: "sub_f", customer_id: "cus_f" }, { id: "evt_ok" });
    await db.exec(`SELECT public.fn_record_webhook_failure('evt_boom','invoice.paid',false,'boom')`);
    await db.exec(`SELECT public.fn_record_webhook_failure('evt_ok','invoice.paid',false,'late failure')`);
    expect(await state(id)).toMatch(/^plus/);
    const rows = await q<{ stripe_event_id: string; status: string }>(
      `SELECT stripe_event_id, status FROM public.stripe_webhook_events WHERE stripe_event_id IN ('evt_boom','evt_ok') ORDER BY 1`,
    );
    expect(rows).toEqual([
      { stripe_event_id: "evt_boom", status: "failed" },
      { stripe_event_id: "evt_ok", status: "processed" },
    ]);
  });

  it("un evento fallido puede reintentarse y aplicarse", async () => {
    const id = await newUser("retry");
    await db.exec(`SELECT public.fn_record_webhook_failure('evt_retry','x',false,'boom')`);
    const r = await apply(id, { subscription_id: "sub_rt", customer_id: "cus_rt" }, { id: "evt_retry" });
    expect(r.applied).toBe(true);
    const [row] = await q<{ attempts: number; status: string }>(`SELECT attempts, status FROM public.stripe_webhook_events WHERE stripe_event_id='evt_retry'`);
    expect(row).toEqual({ attempts: 2, status: "processed" });
  });
});

describe("RLS y protección de campos de acceso", () => {
  it("fn_my_access devuelve solo el estado propio y no acepta parámetros", async () => {
    const a = await newUser("meA");
    const b = await newUser("meB");
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${b}','legacy_full')`);
    await asUser(a);
    const [mine] = await q<{ r: any }>(`SELECT public.fn_my_access() r`);
    expect(mine.r.state).toBe("trialing");
    expect(mine.r.permissions.can_manage_billing).toBe(false);
    expect(await denied(`SELECT public.fn_my_access('${b}')`)).not.toBe("ALLOWED");
    await asUser(b);
    const [theirs] = await q<{ r: any }>(`SELECT public.fn_my_access() r`);
    expect(theirs.r.state).toBe("legacy_full");
    await reset();
  });

  it("anon no puede llamar a fn_my_access; sin sesión falla", async () => {
    await asRole("anon");
    expect(await denied(`SELECT public.fn_my_access()`)).toBe("42501");
  });

  it("access_grants: un usuario solo ve los suyos y no puede escribir", async () => {
    const a = await newUser("rlsA");
    const b = await newUser("rlsB");
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${b}','legacy_full')`);
    await asUser(a);
    expect(await q(`SELECT 1 FROM public.access_grants`)).toHaveLength(0);
    expect(await denied(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${a}','legacy_full')`)).toBe("42501");
    await asUser(a);
    expect(await denied(`UPDATE public.access_grants SET revoked_at = now()`)).toBe("42501");
    await asUser(b);
    expect(await q(`SELECT 1 FROM public.access_grants`)).toHaveLength(1);
    await reset();
  });

  it("tablas de facturación y funciones internas no son accesibles para authenticated ni anon", async () => {
    const a = await newUser("denyA");
    const stmts = [
      `SELECT count(*) FROM public.subscriptions`,
      `INSERT INTO public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval, current_period_end) VALUES ('${a}','cus_x','sub_x','active','monthly', now() + interval '30 days')`,
      `SELECT count(*) FROM public.billing_customers`,
      `INSERT INTO public.billing_customers (user_id, stripe_customer_id) VALUES ('${a}','cus_evil')`,
      `SELECT count(*) FROM public.stripe_webhook_events`,
      `SELECT public.fn_resolve_access_state('${a}')`,
      `SELECT public.fn_subscription_entitlement('${a}')`,
      `SELECT public.fn_recompute_plus_access_until('${a}')`,
      `SELECT public.fn_record_webhook_failure('evt_zz','x',false,'y')`,
      `SELECT public.fn_apply_subscription_event('evt_zz','x',false,now(),'${a}','{}'::jsonb)`,
    ];
    for (const role of ["authenticated", "anon"]) {
      for (const s of stmts) {
        if (role === "authenticated") await asUser(a); else await asRole("anon");
        expect(await denied(s), `${role}: ${s.slice(0, 60)}`).toBe("42501");
      }
    }
  });

  it("un usuario no puede modificar tier, trial, plus_access_until, IDs de Stripe ni flags de founder", async () => {
    const a = await newUser("prot");
    const upd = (set: string) => `UPDATE public.profiles SET ${set} WHERE id='${a}'`;
    for (const set of [
      `tier = 'pro'`,
      `trial_started_at = now() + interval '1 day'`,
      `trial_ends_at = now() + interval '400 days'`,
      `plus_access_until = now() + interval '400 days'`,
      `stripe_customer_id = 'cus_robado'`,
      `stripe_subscription_id = 'sub_robada'`,
      `is_founder = true`,
      `founder_captured_at = now()`,
      `manual_override = true`,
    ]) {
      await asUser(a);
      expect(await denied(upd(set)), set).toBe("42501");
    }
    await asUser(a);
    expect(await denied(`INSERT INTO public.profiles (id, stripe_customer_id) VALUES ('${uuid()}','cus_x')`)).not.toBe("ALLOWED");
    const [p] = await q<{ tier: string; c: string | null }>(`SELECT tier, stripe_customer_id c FROM public.profiles WHERE id='${a}'`);
    expect(p).toEqual({ tier: "free", c: null });
  });

  it("un usuario no puede leer el perfil de otro", async () => {
    const a = await newUser("peekA");
    const b = await newUser("peekB");
    await asUser(a);
    expect(await q(`SELECT 1 FROM public.profiles WHERE id='${b}'`)).toHaveLength(0);
    await reset();
  });

  it("service_role puede operar sobre las tablas de acceso", async () => {
    const a = await newUser("svc");
    await asRole("service_role");
    await db.exec(`INSERT INTO public.access_grants (user_id, grant_type) VALUES ('${a}','legacy_full')`);
    expect(await q(`SELECT 1 FROM public.billing_customers`)).toBeDefined();
    await reset();
  });
});

describe("rollbacks", () => {
  it("los rollbacks se ejecutan en orden inverso sin error y conservan datos archivados", async () => {
    const files = fs
      .readdirSync(path.join(process.cwd(), "supabase", "rollback", "plus"))
      .filter((f) => f.endsWith(".rollback.sql"))
      .sort()
      .reverse();
    expect(files).toHaveLength(5);
    const before = (await q<{ c: number }>(`SELECT count(*)::int c FROM public.billing_customers`))[0].c;
    expect(before).toBeGreaterThan(0);
    for (const f of files) await db.exec(fs.readFileSync(path.join(process.cwd(), "supabase", "rollback", "plus", f), "utf8"));
    const archived = (await q<{ c: number }>(`SELECT count(*)::int c FROM public._rollback_billing_customers`))[0].c;
    expect(archived).toBe(before);
    expect(await q(`SELECT to_regclass('public.billing_customers') t`)).toEqual([{ t: null }]);
    expect(await q(`SELECT to_regclass('public.access_grants') t`)).toEqual([{ t: null }]);
    expect(await q(`SELECT 1 FROM pg_proc WHERE proname IN ('fn_my_access','fn_resolve_access_state','fn_apply_subscription_event')`)).toHaveLength(0);
    // las filas de subscriptions se conservan
    expect((await q<{ c: number }>(`SELECT count(*)::int c FROM public.subscriptions`))[0].c).toBeGreaterThan(0);
  });
});
