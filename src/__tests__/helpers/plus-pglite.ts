import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Postgres en memoria (PGlite) con las migraciones REALES de Plus, para probar las rutas de Stripe contra la
 * lógica SQL de verdad (idempotencia, orden de eventos, aislamiento). Incluye un cliente "tipo Supabase" mínimo
 * (from/select/eq/in/maybeSingle/insert + rpc) que ejecuta SQL parametrizado.
 */

const MIG_DIR = path.join(process.cwd(), "supabase", "migrations");

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
  is_founder boolean DEFAULT false, founder_captured_at timestamptz, plus_access_until timestamptz);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE TABLE public.subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id), stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL, status text NOT NULL, plan_interval text NOT NULL,
  current_period_end timestamptz NOT NULL, cancel_at_period_end boolean NOT NULL DEFAULT false,
  last_event_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id), CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id));
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;
CREATE TABLE public.stripe_webhook_events (stripe_event_id text PRIMARY KEY, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
CREATE TABLE public.expense_monthly_usage (user_id uuid NOT NULL, period text NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, period));
CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid) RETURNS timestamptz LANGUAGE sql AS $$ SELECT NULL::timestamptz $$;
REVOKE ALL ON FUNCTION public.fn_recompute_plus_access_until(uuid) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN INSERT INTO public.profiles (id, tier, trial_ends_at) VALUES (new.id, 'free', now() + interval '14 days'); RETURN new; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

export async function createPlusDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(BASE);
  const files = fs.readdirSync(MIG_DIR).filter((f) => /^\d{14}_plus_.*\.sql$/.test(f)).sort();
  for (const f of files) await db.exec(fs.readFileSync(path.join(MIG_DIR, f), "utf8"));
  return db;
}

type Err = { code?: string; message: string } | null;

/** Cliente service_role mínimo sobre PGlite (superusuario: equivale a service_role en este banco de pruebas). */
export function adminClientOver(db: PGlite, hooks: { onRpc?: (name: string, args: unknown) => void } = {}) {
  const ALLOWED = new Set(["billing_customers", "subscriptions", "profiles", "stripe_webhook_events"]);

  const from = (table: string) => {
    if (!ALLOWED.has(table)) throw new Error(`table not allowed in test client: ${table}`);
    const filters: { col: string; vals: unknown[] }[] = [];
    let cols = "*";
    const run = async (single: boolean): Promise<{ data: unknown; error: Err }> => {
      const params: unknown[] = [];
      const where = filters
        .map((f) => {
          const ph = f.vals.map((v) => { params.push(v); return `$${params.length}`; });
          return `${f.col} IN (${ph.join(",")})`;
        })
        .join(" AND ");
      try {
        const res = await db.query(`SELECT ${cols} FROM public.${table}${where ? ` WHERE ${where}` : ""}`, params);
        return { data: single ? res.rows[0] ?? null : res.rows, error: null };
      } catch (e) {
        return { data: null, error: { code: (e as { code?: string }).code, message: (e as Error).message } };
      }
    };
    const b = {
      select(c = "*") { cols = c; return b; },
      eq(col: string, val: unknown) { filters.push({ col, vals: [val] }); return b; },
      in(col: string, vals: unknown[]) { filters.push({ col, vals }); return b; },
      maybeSingle: () => run(true),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => run(false).then(resolve, reject),
      async insert(row: Record<string, unknown>) {
        const keys = Object.keys(row);
        try {
          await db.query(
            `INSERT INTO public.${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
            keys.map((k) => row[k]),
          );
          return { error: null as Err };
        } catch (e) {
          return { error: { code: (e as { code?: string }).code, message: (e as Error).message } as Err };
        }
      },
    };
    return b;
  };

  const rpc = async (name: string, args: Record<string, unknown>) => {
    hooks.onRpc?.(name, args);
    const keys = Object.keys(args);
    const casts: Record<string, string> = {
      p_livemode: "boolean", p_event_created: "timestamptz", p_user_id: "uuid", p_subscription: "jsonb",
    };
    try {
      const res = await db.query<{ r: unknown }>(
        `SELECT public.${name}(${keys.map((k, i) => `${k} => $${i + 1}${casts[k] ? `::${casts[k]}` : ""}`).join(",")}) AS r`,
        keys.map((k) => (k === "p_subscription" ? JSON.stringify(args[k]) : args[k])),
      );
      return { data: res.rows[0]?.r ?? null, error: null as Err };
    } catch (e) {
      return { data: null, error: { code: (e as { code?: string }).code, message: (e as Error).message } as Err };
    }
  };

  return { from, rpc };
}

/** Cliente "de sesión" (rol authenticated) para fn_my_access del usuario indicado. */
export function sessionClientOver(db: PGlite, getUser: () => { id: string; email?: string } | null) {
  return {
    auth: {
      getUser: async () => {
        const u = getUser();
        return { data: { user: u }, error: u ? null : { message: "no session" } };
      },
    },
    rpc: async (name: string) => {
      const u = getUser();
      if (!u) return { data: null, error: { message: "no session" } };
      try {
        await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${u.id}',false); SET ROLE authenticated;`);
        const res = await db.query<{ r: unknown }>(`SELECT public.${name}() AS r`);
        return { data: res.rows[0]?.r ?? null, error: null as Err };
      } catch (e) {
        return { data: null, error: { code: (e as { code?: string }).code, message: (e as Error).message } as Err };
      } finally {
        await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);`);
      }
    },
  };
}
