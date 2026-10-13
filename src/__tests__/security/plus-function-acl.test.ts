// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Permisos de las funciones internas de acceso, incluso en el PEOR caso: un entorno donde
 * `fn_recompute_plus_access_until` existía ya con EXECUTE abierto (privilegios por defecto de Supabase).
 * CREATE OR REPLACE conserva el ACL previo, así que la migración de endurecimiento debe cerrarlo.
 */

const MIG_DIR = path.join(process.cwd(), "supabase", "migrations");
const plus = fs.readdirSync(MIG_DIR).filter((f) => /^\d{14}_plus_.*\.sql$/.test(f)).sort();
const hardening = plus.filter((f) => /harden_function_acl/.test(f));

const BASE = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
CREATE TYPE subscription_tier AS ENUM ('free','pro');
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id), tier subscription_tier DEFAULT 'free',
  trial_started_at timestamptz, trial_ends_at timestamptz, stripe_customer_id text, stripe_subscription_id text,
  manual_override boolean DEFAULT false, is_founder boolean DEFAULT false, founder_captured_at timestamptz, plus_access_until timestamptz);
CREATE TABLE public.subscriptions (user_id uuid NOT NULL REFERENCES auth.users(id), stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL, status text NOT NULL, plan_interval text NOT NULL, current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false, last_event_id text, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, stripe_subscription_id),
  CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id));
CREATE TABLE public.stripe_webhook_events (stripe_event_id text PRIMARY KEY, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.expense_monthly_usage (user_id uuid NOT NULL, period text NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, period));
-- PEOR CASO: función previa con EXECUTE abierto a anon/authenticated (sin REVOKE)
CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid) RETURNS timestamptz LANGUAGE sql AS $$ SELECT NULL::timestamptz $$;
`;

let db: PGlite;
const canExec = async (role: string, sig: string) =>
  (await db.query<{ ok: boolean }>(`SELECT has_function_privilege('${role}', '${sig}', 'EXECUTE') ok`)).rows[0].ok;

describe("permisos de las funciones internas de acceso", () => {
  it("existe la migración de endurecimiento", () => {
    expect(hardening).toHaveLength(1);
  });

  describe("tras migraciones 1-5 en un entorno con ACL abierto (el riesgo)", () => {
    beforeAll(async () => {
      db = new PGlite();
      await db.exec(BASE);
      for (const f of plus.filter((x) => !hardening.includes(x))) await db.exec(fs.readFileSync(path.join(MIG_DIR, f), "utf8"));
    }, 60_000);

    it("demuestra el riesgo: CREATE OR REPLACE conservó EXECUTE para authenticated", async () => {
      expect(await canExec("authenticated", "public.fn_recompute_plus_access_until(uuid)")).toBe(true);
    });
  });

  describe("tras aplicar además la migración de endurecimiento", () => {
    beforeAll(async () => {
      db = new PGlite();
      await db.exec(BASE);
      for (const f of plus) await db.exec(fs.readFileSync(path.join(MIG_DIR, f), "utf8"));
    }, 60_000);

    it("fn_recompute_plus_access_until, resolver y entitlement: solo service_role", async () => {
      for (const sig of [
        "public.fn_recompute_plus_access_until(uuid)",
        "public.fn_resolve_access_state(uuid, timestamptz)",
        "public.fn_subscription_entitlement(uuid, timestamptz)",
        "public.fn_apply_subscription_event(text, text, boolean, timestamptz, uuid, jsonb)",
        "public.fn_record_webhook_failure(text, text, boolean, text)",
      ]) {
        expect(await canExec("anon", sig), `anon ${sig}`).toBe(false);
        expect(await canExec("authenticated", sig), `authenticated ${sig}`).toBe(false);
        expect(await canExec("service_role", sig), `service_role ${sig}`).toBe(true);
      }
    });

    it("fn_my_access: authenticated y service_role sí; anon no", async () => {
      expect(await canExec("authenticated", "public.fn_my_access()")).toBe(true);
      expect(await canExec("service_role", "public.fn_my_access()")).toBe(true);
      expect(await canExec("anon", "public.fn_my_access()")).toBe(false);
    });

    it("la migración es idempotente (segunda ejecución sin error)", async () => {
      await db.exec(fs.readFileSync(path.join(MIG_DIR, hardening[0]), "utf8"));
      expect(await canExec("authenticated", "public.fn_recompute_plus_access_until(uuid)")).toBe(false);
    });

    it("un usuario authenticated no puede ejecutar fn_recompute_plus_access_until (42501)", async () => {
      await db.exec(`INSERT INTO auth.users (id,email) VALUES ('00000000-0000-0000-0000-0000000000aa','x@x.test')`);
      await db.exec(`RESET ROLE; SET ROLE authenticated;`);
      let code = "ALLOWED";
      try {
        await db.exec(`SELECT public.fn_recompute_plus_access_until('00000000-0000-0000-0000-0000000000aa')`);
      } catch (e: unknown) {
        code = (e as { code?: string }).code ?? "ERR";
      } finally {
        await db.exec(`RESET ROLE;`);
      }
      expect(code).toBe("42501");
    });
  });
});
