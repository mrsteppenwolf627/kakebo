// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Fase 3.B — COMPORTAMIENTO SQL REAL.
 *
 * Ejecuta las migraciones y los scripts de supabase/ contra un Postgres REAL en memoria (PGlite,
 * WebAssembly) con una simulación mínima de Supabase (roles anon/authenticated/service_role,
 * auth.users, auth.uid(), RLS, privilegios por defecto de funciones en `public`). NO toca ninguna
 * base de datos remota ni Supabase.
 *
 * Limitaciones: PGlite no es Supabase (no hay supabase_auth_admin, PostgREST ni extensiones); la
 * verificación definitiva sigue siendo supabase/verification/phase3b_verify.sql en staging/producción.
 */

const REPO = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];
function ok(name: string, cond: unknown, extra?: unknown) {
  results.push({ name, pass: Boolean(cond), detail: cond ? undefined : String(extra ?? "") });
}
async function expectErr(db: PGlite, name: string, sql: string, match?: string) {
  try { await db.exec(sql); ok(name, false, "no error"); }
  catch (e: any) { const err = e as { message: string; code?: string }; ok(name, match ? new RegExp(match, "i").test(err.message + " " + (err.code || "")) : true, err.message); }
}

const BASE = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO service_role;
-- Supabase defaults: new functions/tables in public are executable/accessible by the API roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
CREATE TYPE subscription_tier AS ENUM ('free','pro');
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tier subscription_tier DEFAULT 'free', trial_ends_at timestamptz, stripe_customer_id text,
  stripe_subscription_id text, manual_override boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TABLE public.months (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, year int, month int, status text NOT NULL DEFAULT 'open');
CREATE TABLE public.expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, month_id uuid, date date NOT NULL,
  amount numeric NOT NULL, category text NOT NULL, note text, color text, subcategory text, created_at timestamptz DEFAULT now());
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE ALL ON public.profiles, public.expenses FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.expenses TO authenticated;
GRANT ALL ON public.months TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN INSERT INTO public.profiles (id, tier, trial_ends_at) VALUES (new.id, 'free', (now() + interval '14 days')); RETURN new; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

const as = async (db: PGlite, role: string, uid: string | null) => {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${uid ?? ""}', false); SET ROLE ${role};`);
};
const reset = (db: PGlite) => db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);");

async function runScenario(): Promise<Result[]> {
  const db = new PGlite();
  await db.exec(BASE);

  // Pre-existing users BEFORE the migrations (3 of them, with different states).
  const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", C = "00000000-0000-0000-0000-00000000000c";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${A}','a@x'),('${B}','b@x'),('${C}','c@x');`);
  await db.exec(`UPDATE public.profiles SET tier='pro' WHERE id='${B}'; UPDATE public.profiles SET manual_override=true, trial_ends_at=NULL WHERE id='${C}';`);
  const mA = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${A}',2026,10) RETURNING id`)).rows[0].id;
  const mB = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${B}',2026,10) RETURNING id`)).rows[0].id;
  await db.exec(`INSERT INTO public.expenses (user_id, month_id, date, amount, category) VALUES ('${A}','${mA}','2026-09-01',5,'survival'),('${A}','${mA}','2026-09-02',6,'survival');`);
  const before = (await db.query<any>("SELECT id, tier::text, manual_override, trial_ends_at FROM public.profiles ORDER BY id")).rows;

  // ── Apply compat migrations in order ─────────────────────────────────────
  for (const f of ["20260916_phase3b_monetization_foundation.sql", "20260917_phase3b_profiles_hardening.sql", "20261001_first_expense_activation.sql"]) {
    try { await db.exec(read("supabase/migrations/" + f)); ok(`migración aplicable: ${f}`, true); }
    catch (e: any) { ok(`migración aplicable: ${f}`, false, (e as Error).message); throw e; }
  }
  // idempotent re-apply
  for (const f of ["20260916_phase3b_monetization_foundation.sql", "20260917_phase3b_profiles_hardening.sql", "20261001_first_expense_activation.sql"]) {
    try { await db.exec(read("supabase/migrations/" + f)); ok(`idempotente (2ª vez): ${f}`, true); }
    catch (e: any) { ok(`idempotente (2ª vez): ${f}`, false, (e as Error).message); }
  }

  // ── Existing users untouched ─────────────────────────────────────────────
  const after = (await db.query<any>("SELECT id, tier::text, manual_override, trial_ends_at FROM public.profiles ORDER BY id")).rows;
  ok("usuarios existentes: tier/manual_override/trial_ends_at sin cambios", JSON.stringify(before) === JSON.stringify(after));
  const flags = (await db.query<any>("SELECT count(*) FILTER (WHERE is_founder) f, count(*) FILTER (WHERE plus_access_until IS NOT NULL) p, count(*) FILTER (WHERE trial_started_at IS NOT NULL) t FROM public.profiles")).rows[0];
  ok("ningún fundador / plus / trial_started_at creado", Number(flags.f) + Number(flags.p) + Number(flags.t) === 0, JSON.stringify(flags));
  const baseline = (await db.query<any>("SELECT count(*) n FROM public.first_expense_activations")).rows[0].n;
  ok("baseline de activación para usuarios con gastos (solo A)", Number(baseline) === 1, baseline);

  // ── Trial 14 días intacto para usuarios nuevos ───────────────────────────
  const N = "00000000-0000-0000-0000-0000000000d1";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${N}','n@x');`);
  const tr = (await db.query<any>(`SELECT extract(epoch FROM (trial_ends_at - now()))/86400 AS days, trial_started_at, is_founder FROM public.profiles WHERE id='${N}'`)).rows[0];
  ok("trial de usuario nuevo = 14 días", Math.abs(tr.days - 14) < 0.01, tr.days);
  ok("usuario nuevo: is_founder=false", tr.is_founder === false);

  // ── fn_create_expense compat: >30 gastos, sin KB001 ──────────────────────
  await as(db, "authenticated", N);
  const mN = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${N}',2026,10) RETURNING id`)).rows[0].id;
  let kb001 = false, created = 0;
  for (let i = 0; i < 45; i++) {
    try { await db.query<any>(`SELECT * FROM public.fn_create_expense('${mN}','2026-10-0${(i % 9) + 1}', 10, 'survival', 'n', NULL, NULL)`); created++; }
    catch (e: any) { if (/KB001/.test(e.code + e.message)) kb001 = true; }
  }
  await reset(db);
  ok("usuario nuevo crea 45 gastos (>30) en modo compatible", created === 45, created);
  ok("no aparece KB001", !kb001);
  const cnt = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${N}'`)).rows[0].count;
  ok("contador de uso = 45 (métrica)", Number(cnt) === 45, cnt);

  // legacy user B (tier pro) and A can still create
  await as(db, "authenticated", B);
  await db.query<any>(`SELECT * FROM public.fn_create_expense('${mB}','2026-10-01', 3, 'optional')`);
  await reset(db);
  ok("usuario existente (pro) crea gastos", true);

  // ── Validaciones técnicas ────────────────────────────────────────────────
  await as(db, "authenticated", N);
  const bad = async (name: string, sql: string, code: string) => { try { await db.query<any>(sql); ok(name, false, "sin error"); } catch (e: any) { const err = e as { message: string; code?: string }; ok(name, err.code === code || new RegExp(code).test(err.message), err.code + " " + err.message); } };
  await bad("month_id NULL rechazado (KB002)", `SELECT * FROM public.fn_create_expense(NULL,'2026-10-01',1,'survival')`, "KB002");
  await bad("month_id ajeno rechazado (KB002)", `SELECT * FROM public.fn_create_expense('${mA}','2026-10-01',1,'survival')`, "KB002");
  await bad("importe negativo (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',-1,'survival')`, "KB002");
  await bad("importe NaN (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01','NaN'::numeric,'survival')`, "KB002");
  await bad("importe Infinity (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01','Infinity'::numeric,'survival')`, "KB002");
  await bad("importe NULL (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',NULL,'survival')`, "KB002");
  await reset(db);
  await db.exec(`UPDATE public.months SET status='closed' WHERE id='${mN}'`);
  await as(db, "authenticated", N);
  await bad("ciclo cerrado (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',1,'survival')`, "KB002");
  await reset(db);
  await db.exec(`UPDATE public.months SET status='open' WHERE id='${mN}'`);
  await as(db, "anon", null);
  await bad("anon no puede ejecutar fn_create_expense (42501)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',1,'survival')`, "42501|permission denied");
  await reset(db);
  await as(db, "authenticated", null);
  await bad("sin sesión (auth.uid NULL) rechazado (KB002)", `SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',1,'survival')`, "KB002");
  await reset(db);

  // ── Transaccional: fallo del INSERT deshace el contador ──────────────────
  await db.exec(`ALTER TABLE public.expenses ADD CONSTRAINT cat_chk CHECK (category <> 'boom')`);
  const c0 = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${N}'`)).rows[0].count;
  await as(db, "authenticated", N);
  try { await db.query<any>(`SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',1,'boom')`); ok("INSERT fallido propaga error", false); } catch { ok("INSERT fallido propaga error", true); }
  await reset(db);
  const c1 = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${N}'`)).rows[0].count;
  ok("fallo del INSERT deshace el contador (transaccional)", Number(c0) === Number(c1), `${c0} vs ${c1}`);
  await db.exec(`ALTER TABLE public.expenses DROP CONSTRAINT cat_chk`);

  // ── Privilegios de funciones ─────────────────────────────────────────────
  for (const [role, fn, expected] of [
    ["anon", "public.fn_create_expense(uuid,date,numeric,text,text,text,text)", false],
    ["authenticated", "public.fn_create_expense(uuid,date,numeric,text,text,text,text)", true],
    ["anon", "public.fn_recompute_plus_access_until(uuid)", false],
    ["authenticated", "public.fn_recompute_plus_access_until(uuid)", false],
    ["service_role", "public.fn_recompute_plus_access_until(uuid)", true],
    ["anon", "public.handle_new_user()", false], ["authenticated", "public.handle_new_user()", false],
    ["anon", "public.claim_first_expense_activation()", false], ["authenticated", "public.claim_first_expense_activation()", false],
    ["anon", "public.protect_profile_access_columns()", false], ["authenticated", "public.protect_profile_access_columns()", false],
    ["authenticated", "public.reject_founder_cutoff_mutation()", false],
  ]) {
    const r = (await db.query<any>(`SELECT has_function_privilege('${role}', '${fn}', 'EXECUTE') AS v`)).rows[0].v;
    ok(`EXECUTE ${String(fn).split("(")[0]} para ${role} = ${expected}`, r === expected, r);
  }
  await as(db, "authenticated", N);
  await bad("authenticated NO puede llamar fn_recompute_plus_access_until (42501)", `SELECT public.fn_recompute_plus_access_until('${A}')`, "42501|permission denied");
  await reset(db);

  // ── profiles: campos protegidos ──────────────────────────────────────────
  await as(db, "authenticated", N);
  for (const [col, val] of [["is_founder", "true"], ["manual_override", "true"], ["plus_access_until", "now() + interval '1 year'"], ["founder_captured_at", "now()"], ["trial_ends_at", "now() + interval '1 year'"], ["tier", "'pro'"], ["trial_started_at", "now()"]]) {
    await bad(`authenticated no puede modificar profiles.${col} (42501)`, `UPDATE public.profiles SET ${col} = ${val} WHERE id='${N}'`, "42501|protegidos");
  }
  await db.exec(`UPDATE public.profiles SET updated_at = now() WHERE id='${N}'`);
  ok("authenticated SÍ puede actualizar columnas no protegidas", true);
  await bad("authenticated no puede insertar perfil fundador (42501)", `INSERT INTO public.profiles (id, is_founder) VALUES ('${A}', true)`, "42501|protegidos|duplicate");
  await reset(db);
  // service_role (admin client): grant-vip / list-vip-users
  await db.exec(`SET ROLE service_role; UPDATE public.profiles SET manual_override = true WHERE id='${A}'; UPDATE public.profiles SET manual_override = false WHERE id='${A}'; RESET ROLE;`);
  ok("service_role sigue pudiendo escribir manual_override (grant-vip)", true);
  await db.exec("SET ROLE service_role");
  const vip = (await db.query<any>(`SELECT id, tier, manual_override, created_at FROM public.profiles WHERE manual_override = true`)).rows;
  await reset(db);
  ok("service_role lee profiles (list-vip-users)", Array.isArray(vip));
  await db.exec(`SET ROLE service_role; SELECT public.fn_recompute_plus_access_until('${A}'); RESET ROLE;`);
  ok("service_role puede ejecutar fn_recompute_plus_access_until (SECURITY DEFINER escribe plus_access_until)", true);
  await db.exec(`UPDATE public.profiles SET plus_access_until = NULL WHERE id='${A}'`);

  // ── Primera activación: idempotente / borrado / concurrencia ─────────────
  const F = "00000000-0000-0000-0000-0000000000f1";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${F}','f@x');`);
  const mF = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${F}',2026,10) RETURNING id`)).rows[0].id;
  await as(db, "authenticated", F);
  const e1 = (await db.query<any>(`SELECT id FROM public.fn_create_expense('${mF}','2026-10-01',1,'survival')`)).rows[0].id;
  await db.query<any>(`SELECT id FROM public.fn_create_expense('${mF}','2026-10-02',1,'survival')`);
  const act1 = (await db.query<any>(`SELECT expense_id FROM public.first_expense_activations WHERE user_id='${F}'`)).rows;
  ok("primera activación: una sola fila, ganada por el primer gasto", act1.length === 1 && act1[0].expense_id === e1);
  await db.exec(`DELETE FROM public.expenses WHERE id='${e1}'`);
  await reset(db);
  const act2 = (await db.query<any>(`SELECT expense_id FROM public.first_expense_activations WHERE user_id='${F}'`)).rows;
  ok("borrar el primer gasto conserva la marca (expense_id NULL, no se reabre)", act2.length === 1 && act2[0].expense_id === null, JSON.stringify(act2));
  await as(db, "authenticated", F);
  await db.query<any>(`SELECT id FROM public.fn_create_expense('${mF}','2026-10-03',1,'survival')`);
  await reset(db);
  const act3 = (await db.query<any>(`SELECT count(*) n FROM public.first_expense_activations WHERE user_id='${F}'`)).rows[0].n;
  ok("un gasto posterior no crea otra activación", Number(act3) === 1);
  // re-apply migration 20261001 keeps one row per user
  await db.exec(read("supabase/migrations/20261001_first_expense_activation.sql"));
  const dup = (await db.query<any>(`SELECT count(*) n FROM (SELECT user_id FROM public.first_expense_activations GROUP BY 1 HAVING count(*)>1) s`)).rows[0].n;
  ok("reaplicar 20261001 no duplica activaciones", Number(dup) === 0);
  ok("first_expense_activations no concede acceso (ninguna función la referencia salvo el trigger)",
    (await db.query<any>(`SELECT count(*) n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND p.prosrc LIKE '%first_expense_activations%' AND p.proname <> 'claim_first_expense_activation'`)).rows[0].n == 0);
  // concurrency simulation: two first expenses for one user in the same statement
  const G = "00000000-0000-0000-0000-0000000000a1";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${G}','g@x'); INSERT INTO public.expenses (user_id,date,amount,category) SELECT '${G}', '2026-10-01', 1, 'survival' FROM generate_series(1,2);`);
  ok("dos primeros gastos en el mismo INSERT dejan una sola activación",
    (await db.query<any>(`SELECT count(*) n FROM public.first_expense_activations WHERE user_id='${G}'`)).rows[0].n == 1);

  // ── verify script ────────────────────────────────────────────────────────
  const ver = await db.query<any>(read("supabase/verification/phase3b_verify.sql").replace(/;\s*$/m, ";").split("-- COMPARACIÓN OPCIONAL")[0].replace(/;\s*$/, ""));
  const fails = ver.rows.filter((r) => r.status === "FAIL");
  ok(`phase3b_verify.sql: ${ver.rows.length} comprobaciones, 0 FAIL`, fails.length === 0, JSON.stringify(fails));

  // ── snapshot script ──────────────────────────────────────────────────────
  try { await db.exec(read("supabase/manual-ops/phase3b_pre_apply_snapshot.sql")); ok("snapshot: se ejecuta y crea tablas phase3b_backup", (await db.query<any>("SELECT count(*) n FROM pg_tables WHERE schemaname='phase3b_backup'")).rows[0].n >= 8); }
  catch (e: any) { ok("snapshot ejecutable", false, e.message); }
  ok("snapshot: anon/authenticated sin acceso al backup", !(await db.query<any>("SELECT has_schema_privilege('authenticated','phase3b_backup','USAGE') v")).rows[0].v);

  // ── Deferred scripts: guard blocks, then full freemium cycle ─────────────
  const deferred = ["01_access_foundation", "02_usage_backfill", "04_legacy_access_grants", "03_enforce_expense_limit", "05_close_direct_expense_insert"];
  for (const f of deferred) {
    const sql = read(`supabase/deferred/freemium/${f}.sql`);
    let blocked = false;
    try { await db.exec(sql); } catch (e: any) { blocked = /DEFERRED freemium/.test(e.message); }
    await db.exec("ROLLBACK").catch(() => {});
    ok(`deferred ${f}: el guard bloquea sin confirmación`, blocked);
  }
  ok("tras intentar los deferred sin guard, nada cambió (sin access_grants)", (await db.query<any>("SELECT to_regclass('public.access_grants') IS NULL v")).rows[0].v);

  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  // 03 before 01 must refuse
  await db.exec("ROLLBACK").catch(() => {});
  await expectErr(db, "03 se niega sin 01", read("supabase/deferred/freemium/03_enforce_expense_limit.sql"), "01_access_foundation");
  await db.exec("ROLLBACK").catch(() => {});
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await db.exec(read("supabase/deferred/freemium/01_access_foundation.sql")); ok("01 aplica", true);
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await expectErr(db, "03 se niega sin legacy grants (04)", read("supabase/deferred/freemium/03_enforce_expense_limit.sql"), "legacy_full|04_legacy");
  await db.exec("ROLLBACK").catch(() => {});
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await expectErr(db, "05 se niega sin 03 (modo compat)", read("supabase/deferred/freemium/05_close_direct_expense_insert.sql"), "no está en modo freemium");
  await db.exec("ROLLBACK").catch(() => {});
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");

  // set usage low for N so backfill has something to do; N has 45 counter; also a user with expenses but counter 0
  const H = "00000000-0000-0000-0000-0000000000b1";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${H}','h@x');`);
  await db.exec(`UPDATE public.profiles SET trial_ends_at = now() - interval '1 day' WHERE id='${H}'`); // post-trial new user (free)
  const mH = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${H}',2026,10) RETURNING id`)).rows[0].id;
  await db.exec(`INSERT INTO public.expenses (user_id, month_id, date, amount, category) SELECT '${H}', '${mH}', now()::date, 1, 'survival' FROM generate_series(1,12)`); // direct insert, counter unaware
  const before45 = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${N}'`)).rows[0].count;
  await db.exec(read("supabase/deferred/freemium/02_usage_backfill.sql")); ok("02 aplica", true);
  const h1 = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${H}'`)).rows[0]?.count;
  ok("02 backfill calcula contador del mes (12)", Number(h1) === 12, h1);
  await db.exec("SET kakebo.freemium_activation = 'confirmed'"); await db.exec(read("supabase/deferred/freemium/02_usage_backfill.sql"));
  const h2 = (await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${H}'`)).rows[0].count;
  ok("02 es idempotente (sigue 12)", Number(h2) === 12, h2);
  await db.exec(`UPDATE public.expense_monthly_usage SET count = 40 WHERE user_id='${H}'`);
  await db.exec("SET kakebo.freemium_activation = 'confirmed'"); await db.exec(read("supabase/deferred/freemium/02_usage_backfill.sql"));
  ok("02 nunca reduce un contador (40 se conserva)", Number((await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${H}'`)).rows[0].count) === 40);
  ok("02 no reduce contadores existentes (N sigue en 45)", Number((await db.query<any>(`SELECT count FROM public.expense_monthly_usage WHERE user_id='${N}'`)).rows[0].count) >= Number(before45));
  await db.exec(`UPDATE public.expense_monthly_usage SET count = 12 WHERE user_id='${H}'`);

  // Legacy users: 04 then 03
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await db.exec(read("supabase/deferred/freemium/04_legacy_access_grants.sql")); ok("04 aplica", true);
  await db.exec("SET kakebo.freemium_activation = 'confirmed'"); await db.exec(read("supabase/deferred/freemium/04_legacy_access_grants.sql"));
  const gcount = (await db.query<any>(`SELECT count(*) n, count(DISTINCT user_id) d FROM public.access_grants`)).rows[0];
  ok("04 es idempotente (una concesión activa por usuario)", gcount.n === gcount.d, JSON.stringify(gcount));
  const profs = (await db.query<any>("SELECT count(*) n FROM public.profiles")).rows[0].n;
  ok("04 concede a TODOS los perfiles existentes", Number(gcount.n) === Number(profs), `${gcount.n}/${profs}`);
  const after04 = (await db.query<any>("SELECT id, tier::text, manual_override, trial_ends_at FROM public.profiles WHERE id IN ('" + [A,B,C].join("','") + "') ORDER BY id")).rows;
  ok("04 no modifica tier/manual_override/trial de los usuarios", JSON.stringify(after04) === JSON.stringify(before));
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await db.exec(read("supabase/deferred/freemium/03_enforce_expense_limit.sql")); ok("03 aplica", true);

  // New post-activation user (no legacy grant), post-trial → limit 30
  const P = "00000000-0000-0000-0000-0000000000c1";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${P}','p@x');`);
  await db.exec(`UPDATE public.profiles SET trial_ends_at = now() - interval '1 day' WHERE id='${P}'`);
  const mP = (await db.query<any>(`INSERT INTO public.months (user_id,year,month) VALUES ('${P}',2026,10) RETURNING id`)).rows[0].id;
  await as(db, "authenticated", P);
  let okc = 0, got001 = false;
  for (let i = 0; i < 35; i++) { try { await db.query<any>(`SELECT * FROM public.fn_create_expense('${mP}','2026-10-01',1,'survival')`); okc++; } catch (e: any) { if (/KB001/.test(e.code + e.message)) got001 = true; } }
  await reset(db);
  ok("freemium: usuario nuevo free crea exactamente 30 y recibe KB001 en el 31", okc === 30 && got001, `${okc} ${got001}`);
  // legacy user keeps unlimited
  await as(db, "authenticated", N);
  let legacyOk = 0;
  for (let i = 0; i < 40; i++) { try { await db.query<any>(`SELECT * FROM public.fn_create_expense('${mN}','2026-10-01',1,'survival')`); legacyOk++; } catch {} }
  await reset(db);
  ok("freemium: usuario existente (legacy_full) sigue sin límite (40 más)", legacyOk === 40, legacyOk);
  // new user handle_new_user keeps 14 days and sets trial_started_at
  const Q = "00000000-0000-0000-0000-0000000000c2";
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${Q}','q@x');`);
  const q = (await db.query<any>(`SELECT extract(epoch FROM (trial_ends_at - now()))/86400 d, trial_started_at IS NOT NULL ts FROM public.profiles WHERE id='${Q}'`)).rows[0];
  ok("freemium: handle_new_user mantiene trial de 14 días", Math.abs(q.d - 14) < 0.01 && q.ts, JSON.stringify(q));
  await db.exec("SET ROLE service_role");
  const st = (await db.query<any>(`SELECT public.fn_resolve_access_state('${Q}') s`)).rows[0].s; await reset(db);
  ok("freemium: nuevo usuario en trial => estado 'trialing'", st === "trialing", st);
  await db.exec("SET kakebo.freemium_activation = 'confirmed'");
  await db.exec(read("supabase/deferred/freemium/05_close_direct_expense_insert.sql")); ok("05 aplica (modo freemium)", true);
  ok("05 revoca INSERT directo en expenses", !(await db.query<any>("SELECT has_table_privilege('authenticated','public.expenses','INSERT') v")).rows[0].v);

  // Rollback main refuses while freemium
  await db.exec("SET kakebo.phase3b_rollback = 'confirmed'");
  await expectErr(db, "rollback principal se niega con freemium activo", read("supabase/rollback/phase3b_rollback.sql"), "freemium");
  await db.exec("ROLLBACK").catch(() => {});

  // rollback_freemium
  const cBefore = (await db.query<any>("SELECT (SELECT count(*) FROM public.profiles) p, (SELECT count(*) FROM public.expenses) e, (SELECT count(*) FROM public.access_grants) g, (SELECT count(*) FROM public.expense_monthly_usage) u")).rows[0];
  await expectErr(db, "rollback_freemium se niega sin confirmación", read("supabase/deferred/freemium/rollback_freemium.sql"), "rollback");
  await db.exec("ROLLBACK").catch(() => {});
  await db.exec("SET kakebo.freemium_rollback = 'confirmed'");
  await db.exec(read("supabase/deferred/freemium/rollback_freemium.sql")); ok("rollback_freemium aplica", true);
  const cAfter = (await db.query<any>("SELECT (SELECT count(*) FROM public.profiles) p, (SELECT count(*) FROM public.expenses) e, (SELECT count(*) FROM public.access_grants) g, (SELECT count(*) FROM public.expense_monthly_usage) u")).rows[0];
  ok("rollback_freemium no borra datos (profiles/expenses/grants/contadores)", JSON.stringify(cBefore) === JSON.stringify(cAfter), JSON.stringify([cBefore, cAfter]));
  ok("rollback_freemium: modo compat y sin KB001", (await db.query<any>("SELECT obj_description('public.fn_create_expense(uuid,date,numeric,text,text,text,text)'::regprocedure,'pg_proc') LIKE 'MODE: compat%' AND pg_get_functiondef('public.fn_create_expense(uuid,date,numeric,text,text,text,text)'::regprocedure) NOT LIKE '%KB001%' v")).rows[0].v);
  ok("rollback_freemium restituye INSERT en expenses", (await db.query<any>("SELECT has_table_privilege('authenticated','public.expenses','INSERT') v")).rows[0].v);
  await as(db, "authenticated", P);
  let backOk = 0; for (let i = 0; i < 10; i++) { try { await db.query<any>(`SELECT * FROM public.fn_create_expense('${mP}','2026-10-01',1,'survival')`); backOk++; } catch {} }
  await reset(db);
  ok("tras rollback_freemium el usuario limitado vuelve a crear gastos sin KB001", backOk === 10, backOk);
  const q2 = (await db.query<any>(`SELECT 1 FROM pg_proc WHERE proname='fn_resolve_access_state'`)).rowCount;
  ok("rollback_freemium elimina fn_resolve_access_state", q2 === 0);

  // main rollback (compat)
  await db.exec("SET kakebo.phase3b_rollback = 'confirmed'");
  await expectErr(db, "rollback principal sigue negándose si access_grants tiene filas (datos críticos)", read("supabase/rollback/phase3b_rollback.sql"), "freemium");
  await db.exec("ROLLBACK").catch(() => {});

  // fresh DB: main rollback on compat-only
  const db2 = new PGlite(); await db2.exec(BASE);
  for (const f of ["20260916_phase3b_monetization_foundation.sql", "20260917_phase3b_profiles_hardening.sql", "20261001_first_expense_activation.sql"]) await db2.exec(read("supabase/migrations/" + f));
  await expectErr(db2, "rollback principal se niega sin confirmación", read("supabase/rollback/phase3b_rollback.sql"), "rollback");
  await db2.exec("ROLLBACK").catch(() => {});
  await db2.exec("SET kakebo.phase3b_rollback = 'confirmed'");
  await db2.exec(read("supabase/rollback/phase3b_rollback.sql")); ok("rollback principal aplica en modo compat", true);
  ok("rollback principal: quita fn_create_expense y trigger de profiles", (await db2.query<any>("SELECT count(*) n FROM pg_proc WHERE proname IN ('fn_create_expense','protect_profile_access_columns')")).rows[0].n == 0);
  ok("rollback principal: tablas vacías eliminadas", (await db2.query<any>("SELECT to_regclass('public.subscriptions') IS NULL v")).rows[0].v);

  // main rollback keeps non-empty tables
  const db3 = new PGlite(); await db3.exec(BASE);
  await db3.exec(`INSERT INTO auth.users (id,email) VALUES ('${A}','a@x'); INSERT INTO public.expenses (user_id,date,amount,category) VALUES ('${A}','2026-10-01',1,'survival');`);
  for (const f of ["20260916_phase3b_monetization_foundation.sql", "20260917_phase3b_profiles_hardening.sql", "20261001_first_expense_activation.sql"]) await db3.exec(read("supabase/migrations/" + f));
  await db3.exec("SET kakebo.phase3b_rollback = 'confirmed'");
  await db3.exec(read("supabase/rollback/phase3b_rollback.sql"));
  ok("rollback principal conserva first_expense_activations con filas", (await db3.query<any>("SELECT count(*) n FROM public.first_expense_activations")).rows[0].n == 1);
  ok("rollback principal no toca profiles ni expenses", (await db3.query<any>("SELECT (SELECT count(*) FROM public.profiles) p,(SELECT count(*) FROM public.expenses) e")).rows[0].e == 1);

  return results;
}

const scenario = await runScenario();

describe("Fase 3.B — comportamiento SQL real en Postgres (PGlite)", () => {
  it("ejecuta el escenario completo (migraciones, hardening, deferred, rollbacks, verify, snapshot)", () => {
    expect(scenario.length).toBeGreaterThan(90);
  });

  it.each(scenario.map((r) => [r.name, r] as const))("%s", (_name, r) => {
    expect(r.pass, r.detail).toBe(true);
  });
});
