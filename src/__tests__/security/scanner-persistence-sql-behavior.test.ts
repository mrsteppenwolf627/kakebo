// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Persistencia del escáner (Fase 7) — COMPORTAMIENTO SQL REAL en PGlite (Postgres en memoria).
 *
 * Ejecuta la migración y el rollback REALES contra una simulación mínima de Supabase. NO toca ninguna base
 * remota y no usa datos reales. Limitaciones: `months`, `expenses` y `storage.*` son maquetas construidas con
 * las columnas observadas por el propietario en el dashboard; no sustituyen una prueba contra Supabase local
 * (CLI/Docker) ni contra staging, y el motor real de Storage (subida HTTP, límites de tamaño/MIME) no se ejecuta.
 */

const ROOT = process.cwd();
const MIGRATION = fs.readFileSync(
  path.join(ROOT, "supabase", "deferred", "ticket-scanner", "20261027120000_ticket_scanner_persistence.sql"),
  "utf8"
);
const ROLLBACK = fs.readFileSync(
  path.join(ROOT, "supabase", "rollback", "scanner", "20261027120000_ticket_scanner_persistence.rollback.sql"),
  "utf8"
);

const BASE = `
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
-- months: columnas observadas (id, user_id, year, month, status, created_at, closed_at, income)
CREATE TABLE public.months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  year int4 NOT NULL, month int4 NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(), closed_at timestamptz, income numeric);
-- expenses: columnas observadas (SIN month_id). Solo para comprobar que la migración no la toca.
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, date date, amount numeric,
  category text, note text, created_at timestamptz DEFAULT now(), color text);
-- maqueta de Supabase Storage (bucket PRIVADO, 0 políticas)
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean DEFAULT false);
INSERT INTO storage.buckets (id, name, public) VALUES ('kakebo-ticket-temp', 'kakebo-ticket-temp', false);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id), name text, owner uuid);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.objects TO service_role;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  RETURN _parts[1:array_length(_parts, 1) - 1];
END $$;
`;

let db: PGlite;
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const A = uuid();
const B = uuid();
let cycleA = "";
let cycleB = "";

const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;
const reset = () => db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false);`);
const asUser = (id: string) =>
  db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${id}',false); SET ROLE authenticated;`);
const asRole = (role: string) =>
  db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false); SET ROLE ${role};`);
async function denied(sql: string) {
  try {
    await db.exec(sql);
    return "ALLOWED";
  } catch (e) {
    return (e as { code?: string }).code ?? (e as Error).message;
  } finally {
    await reset();
  }
}
const rpc = async (sql: string) => (await q<{ r: Record<string, unknown> }>(`SELECT ${sql} AS r`))[0].r;

/** Crea ticket + subida registrada como el usuario actual; devuelve su id. */
async function uploadedTicket(user: string): Promise<string> {
  await asUser(user);
  const created = await rpc(`public.fn_scanner_create_ticket('${uuid()}')`);
  const id = created.ticketId as string;
  await rpc(`public.fn_scanner_register_upload('${id}', '${user}/${id}/${uuid()}')`);
  await reset();
  return id;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(BASE);
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${A}','a@x.test'),('${B}','b@x.test');`);
  cycleA = (await q<{ id: string }>(`INSERT INTO public.months (user_id,year,month,status) VALUES ('${A}',2026,10,'open') RETURNING id`))[0].id;
  cycleB = (await q<{ id: string }>(`INSERT INTO public.months (user_id,year,month,status) VALUES ('${B}',2026,10,'open') RETURNING id`))[0].id;
  await db.exec(MIGRATION);
});

describe("migración: preflight y aislamiento", () => {
  it("es idempotente (segunda ejecución sin error)", async () => {
    await db.exec(MIGRATION);
  });

  it("no altera expenses ni months", async () => {
    const cols = await q<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' ORDER BY ordinal_position`
    );
    expect(cols.map((c) => c.column_name)).toEqual(["id", "user_id", "date", "amount", "category", "note", "created_at", "color"]);
  });

  it("aborta si el bucket es público", { timeout: 30_000 }, async () => {
    const tmp = new PGlite();
    await tmp.exec(BASE);
    await tmp.exec(`UPDATE storage.buckets SET public = true WHERE id = 'kakebo-ticket-temp'`);
    await expect(tmp.exec(MIGRATION)).rejects.toThrow(/PÚBLICO/);
  });

  it("aborta si months.id no es único (no se puede crear la FK)", { timeout: 30_000 }, async () => {
    const tmp = new PGlite();
    await tmp.exec(BASE.replace("id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),\n  year", "id uuid DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),\n  year"));
    await expect(tmp.exec(MIGRATION)).rejects.toThrow(/UNIQUE/);
  });

  it("RLS activada y sin acceso anon", async () => {
    const rls = await q<{ relname: string; relrowsecurity: boolean }>(
      `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('scanner_tickets','scanner_ticket_lines','scanner_quota_ledger') ORDER BY 1`
    );
    expect(rls.every((r) => r.relrowsecurity)).toBe(true);
    for (const sql of [
      `SELECT * FROM public.scanner_tickets`,
      `SELECT * FROM public.scanner_ticket_lines`,
      `SELECT public.fn_scanner_create_ticket('${uuid()}')`,
    ]) {
      await asRole("anon");
      expect(await denied(sql)).toBe("42501");
    }
  });
});

describe("tickets: RLS por usuario y escritura solo por función", () => {
  it("el usuario ve solo sus tickets y no puede escribirlos directamente", async () => {
    const ta = await uploadedTicket(A);
    const tb = await uploadedTicket(B);
    await asUser(A);
    const seen = await q<{ id: string }>(`SELECT id FROM public.scanner_tickets`);
    expect(seen.map((r) => r.id)).toEqual([ta]);
    expect(seen.map((r) => r.id)).not.toContain(tb);
    await reset();
    await asUser(A);
    expect(await denied(`INSERT INTO public.scanner_tickets (user_id,cycle_id,idempotency_key) VALUES ('${A}','${cycleA}','${uuid()}')`)).toBe("42501");
    await asUser(A);
    expect(await denied(`UPDATE public.scanner_tickets SET status='confirmed'`)).toBe("42501");
    await asUser(A);
    expect(await denied(`DELETE FROM public.scanner_tickets`)).toBe("42501");
  });

  it("el libro de cuota no es legible ni escribible por clientes", async () => {
    await asUser(A);
    expect(await denied(`SELECT * FROM public.scanner_quota_ledger`)).toBe("42501");
    await asUser(A);
    expect(await denied(`INSERT INTO public.scanner_quota_ledger (user_id,cycle_id,ticket_id,kind) VALUES ('${A}','${cycleA}','${uuid()}','refund')`)).toBe("42501");
  });

  it("crear ticket es idempotente por clave y usa el ciclo abierto (months.id)", async () => {
    await asUser(A);
    const key = uuid();
    const first = await rpc(`public.fn_scanner_create_ticket('${key}')`);
    const again = await rpc(`public.fn_scanner_create_ticket('${key}')`);
    expect(first).toMatchObject({ ok: true, idempotent: false, cycleId: cycleA });
    expect(again).toMatchObject({ ok: true, idempotent: true, ticketId: first.ticketId });
  });

  it("no hay ciclo abierto → NO_OPEN_CYCLE", async () => {
    await reset();
    const lone = uuid();
    await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${lone}','l@x.test')`);
    await asUser(lone);
    expect(await rpc(`public.fn_scanner_create_ticket('${uuid()}')`)).toEqual({ ok: false, code: "NO_OPEN_CYCLE" });
    await reset();
  });

  it("registrar subida rechaza rutas ajenas o con otro ticket", async () => {
    await asUser(A);
    const created = await rpc(`public.fn_scanner_create_ticket('${uuid()}')`);
    const id = created.ticketId as string;
    expect(await rpc(`public.fn_scanner_register_upload('${id}', '${B}/${id}/x')`)).toMatchObject({ ok: false, code: "INVALID_PATH" });
    expect(await rpc(`public.fn_scanner_register_upload('${id}', '${A}/${uuid()}/x')`)).toMatchObject({ ok: false, code: "INVALID_PATH" });
    await asUser(B);
    expect(await rpc(`public.fn_scanner_register_upload('${id}', '${B}/${id}/x')`)).toMatchObject({ ok: false, code: "TICKET_NOT_FOUND" });
    await reset();
  });
});

describe("cuota: 5 por ciclo (months.id), sin depender de la fecha", () => {
  it("permite 5, rechaza el 6.º, es idempotente por ticket y no cruza usuarios", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) ids.push(await uploadedTicket(B));
    await asUser(B);
    // el ticket B anterior (de otro test) ya pudo consumir; partimos de cero en el ciclo B salvo lo ya usado
    const before = (await rpc(`public.fn_scanner_quota_status()`)) as { used: number };
    let used = before.used;
    const results: string[] = [];
    for (const id of ids) {
      const r = await rpc(`public.fn_scanner_start_processing('${id}')`);
      results.push(r.ok ? "ok" : (r.code as string));
      if (r.ok) used++;
    }
    expect(used).toBe(5);
    expect(results.filter((r) => r === "ok")).toHaveLength(5 - before.used);
    expect(results).toContain("QUOTA_EXCEEDED");
    // repetir un ticket ya consumido no consume de nuevo
    const okId = ids[results.indexOf("ok")];
    expect(await rpc(`public.fn_scanner_start_processing('${okId}')`)).toMatchObject({ ok: true, idempotent: true });
    expect(await rpc(`public.fn_scanner_quota_status()`)).toMatchObject({ ok: true, cycleId: cycleB, limit: 5, used: 5, remaining: 0 });
    await asUser(A);
    const a = (await rpc(`public.fn_scanner_quota_status()`)) as { used: number };
    expect(a.used).toBeLessThan(5);
    await reset();
  });

  it("un ciclo nuevo reinicia la cuota; el ciclo cerrado no admite procesar", async () => {
    const old = await uploadedTicket(B); // ticket del ciclo B actual (abierto, cuota agotada)
    await db.exec(`UPDATE public.months SET status='closed', closed_at=now() WHERE id='${cycleB}'`);
    await asUser(B);
    expect(await rpc(`public.fn_scanner_start_processing('${old}')`)).toMatchObject({ ok: false, code: "CYCLE_CLOSED" });
    // el siguiente ciclo (otra fila de months) parte de cero, sin importar la fecha
    await reset();
    const next = (await q<{ id: string }>(`INSERT INTO public.months (user_id,year,month,status) VALUES ('${B}',2026,11,'open') RETURNING id`))[0].id;
    await asUser(B);
    expect(await rpc(`public.fn_scanner_quota_status()`)).toMatchObject({ cycleId: next, used: 0, remaining: 5 });
    const fresh = await uploadedTicket(B);
    await asUser(B);
    expect(await rpc(`public.fn_scanner_start_processing('${fresh}')`)).toMatchObject({ ok: true, idempotent: false, used: 1 });
    await reset();
  });

  it("un ticket caducado no puede iniciar procesado", async () => {
    const t = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET created_at = now() - interval '30 hours', expires_at = now() - interval '1 hour' WHERE id='${t}'`);
    await asUser(A);
    expect(await rpc(`public.fn_scanner_start_processing('${t}')`)).toMatchObject({ ok: false, code: "TICKET_EXPIRED" });
    await reset();
  });
});

describe("líneas editables", () => {
  it("solo el propietario y solo con el ticket en needs_review", async () => {
    const t = await uploadedTicket(A);
    await asUser(A);
    expect(await denied(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents) VALUES ('${t}','${A}',0,'item',100)`)).toBe("42501");
    await db.exec(`UPDATE public.scanner_tickets SET status='needs_review', has_draft=true WHERE id='${t}'`); // como servidor
    await asUser(A);
    await db.exec(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents,category) VALUES ('${t}','${A}',0,'item',100,'survival')`);
    // B no ve ni inserta en ticket ajeno
    await asUser(B);
    expect(await q(`SELECT * FROM public.scanner_ticket_lines`)).toHaveLength(0);
    expect(await denied(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents) VALUES ('${t}','${B}',1,'item',100)`)).toBe("42501");
    await asUser(B);
    expect(await denied(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents) VALUES ('${t}','${A}',2,'item',100)`)).toBe("42501");
    // categoría fuera de las cuatro: rechazada por CHECK
    await asUser(A);
    expect(await denied(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents,category) VALUES ('${t}','${A}',3,'item',100,'otra')`)).toBe("23514");
  });
});

describe("limpieza: caducados 24 h y ciclos cerrados (solo service_role)", () => {
  it("los clientes no pueden invocar las funciones de limpieza", async () => {
    for (const role of ["anon", "authenticated"]) {
      await asRole(role);
      expect(await denied(`SELECT * FROM public.fn_scanner_cleanup_candidates(now(), 10)`)).toBe("42501");
      await asRole(role);
      expect(await denied(`SELECT public.fn_scanner_finalize_deletion('${uuid()}','ttl_expired')`)).toBe("42501");
      await asRole(role);
      expect(await denied(`SELECT public.fn_scanner_mark_deletion_pending('${uuid()}','ttl_expired')`)).toBe("42501");
    }
  });

  it("selecciona caducados exactamente a las 24 h y pendientes de ciclo cerrado; ignora lo demás", async () => {
    await reset();
    const fresh = await uploadedTicket(A);
    const stale = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET created_at = now() - interval '25 hours', expires_at = now() - interval '1 hour' WHERE id='${stale}'`);
    await asRole("service_role");
    const ids = (await q<{ ticket_id: string; reason: string }>(`SELECT ticket_id, reason FROM public.fn_scanner_cleanup_candidates(now(), 500)`));
    expect(ids.find((r) => r.ticket_id === stale)?.reason).toBe("ttl_expired");
    expect(ids.find((r) => r.ticket_id === fresh)).toBeUndefined();
    // los de B (ciclo cerrado) salen como cycle_closed
    const closed = ids.filter((r) => r.reason === "cycle_closed");
    expect(closed.length).toBeGreaterThan(0);
    await reset();
  });

  it("el borrado exige verificación: pending → finalize; idempotente; elimina líneas", async () => {
    const t = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET status='needs_review', has_draft=true WHERE id='${t}'`);
    await db.exec(`INSERT INTO public.scanner_ticket_lines (ticket_id,user_id,position,kind,amount_cents) VALUES ('${t}','${A}',0,'item',250)`);
    // sin pasar por finalize no se puede marcar deleted con el original presente (CHECK I16)
    expect(await denied(`UPDATE public.scanner_tickets SET status='deleted' WHERE id='${t}'`)).toBe("23514");
    await asRole("service_role");
    expect(await rpc(`public.fn_scanner_mark_deletion_pending('${t}','ttl_expired')`)).toMatchObject({ ok: true });
    const mid = (await q<{ status: string; original_storage: string }>(`SELECT status, original_storage FROM public.scanner_tickets WHERE id='${t}'`))[0];
    expect(mid).toEqual({ status: "expired", original_storage: "deletion_pending" });
    expect(await rpc(`public.fn_scanner_finalize_deletion('${t}','ttl_expired')`)).toMatchObject({ ok: true, idempotent: false });
    expect(await rpc(`public.fn_scanner_finalize_deletion('${t}','ttl_expired')`)).toMatchObject({ ok: true, idempotent: true });
    const end = (await q<Record<string, unknown>>(`SELECT status, original_storage, object_path, has_draft FROM public.scanner_tickets WHERE id='${t}'`))[0];
    expect(end).toEqual({ status: "deleted", original_storage: "deleted_verified", object_path: null, has_draft: false });
    expect(await q(`SELECT 1 FROM public.scanner_ticket_lines WHERE ticket_id='${t}'`)).toHaveLength(0);
    // ya no es candidato: la limpieza es idempotente
    const again = await q<{ ticket_id: string }>(`SELECT ticket_id FROM public.fn_scanner_cleanup_candidates(now(), 500)`);
    expect(again.find((r) => r.ticket_id === t)).toBeUndefined();
    await reset();
  });

  it("no finaliza un ticket confirmado", async () => {
    const t = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET status='confirmed', has_draft=true, original_storage='deletion_pending' WHERE id='${t}'`);
    await asRole("service_role");
    expect(await rpc(`public.fn_scanner_finalize_deletion('${t}','ttl_expired')`)).toMatchObject({ ok: false, code: "ILLEGAL_TRANSITION" });
    await reset();
  });
});

describe("storage.objects: políticas del bucket kakebo-ticket-temp", () => {
  it("solo crea políticas para ese bucket y ninguna para anon ni UPDATE", async () => {
    const pol = await q<{ policyname: string; cmd: string; roles: string; qual: string | null; with_check: string | null }>(
      `SELECT policyname, cmd, roles::text, qual, with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects'`
    );
    expect(pol.map((p) => p.cmd).sort()).toEqual(["DELETE", "INSERT", "SELECT"]);
    for (const p of pol) {
      expect(p.roles).toBe("{authenticated}");
      expect(`${p.qual ?? ""}${p.with_check ?? ""}`).toContain("kakebo-ticket-temp");
      expect(`${p.qual ?? ""}${p.with_check ?? ""}`).toContain("auth.uid()");
    }
  });

  it("el propietario sube/lee en su carpeta con ticket propio; nadie más", async () => {
    const t = await uploadedTicket(A);
    const mine = `${A}/${t}/${uuid()}`;
    await db.exec(`UPDATE public.scanner_tickets SET status='initiated', original_storage='none', object_path=NULL WHERE id='${t}'`);
    await asUser(A);
    await db.exec(`INSERT INTO storage.objects (bucket_id,name) VALUES ('kakebo-ticket-temp','${mine}')`);
    expect(await q(`SELECT 1 FROM storage.objects WHERE bucket_id='kakebo-ticket-temp'`)).toHaveLength(1);
    await asUser(B);
    expect(await q(`SELECT 1 FROM storage.objects`)).toHaveLength(0);
    await asRole("anon");
    expect(await q(`SELECT 1 FROM storage.objects`)).toHaveLength(0);
    await reset();
  });

  it("rechaza carpetas ajenas, tickets ajenos/inexistentes, otro bucket, rutas planas y UPDATE", async () => {
    const tA = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET status='initiated', original_storage='none', object_path=NULL WHERE id='${tA}'`);
    const ins = (name: string, bucket = "kakebo-ticket-temp") =>
      `INSERT INTO storage.objects (bucket_id,name) VALUES ('${bucket}','${name}')`;
    await asUser(B);
    expect(await denied(ins(`${A}/${tA}/x`))).toBe("42501"); // carpeta de otro usuario
    await asUser(B);
    expect(await denied(ins(`${B}/${tA}/x`))).toBe("42501"); // ticket de otro usuario en carpeta propia
    await asUser(A);
    expect(await denied(ins(`${A}/${uuid()}/x`))).toBe("42501"); // ticket inexistente
    await asUser(A);
    expect(await denied(ins(`${A}/${tA}/a/b/x`))).toBe("42501"); // profundidad distinta
    await asUser(A);
    expect(await denied(ins(`${A}/x`))).toBe("42501"); // sin carpeta de ticket
    await reset();
    await db.exec(`INSERT INTO storage.buckets (id,name,public) VALUES ('otro','otro',false)`);
    await asUser(A);
    expect(await denied(ins(`${A}/${tA}/x`, "otro"))).toBe("42501"); // otro bucket
    await asUser(A);
    expect(await denied(`UPDATE storage.objects SET name = name || 'z' WHERE bucket_id='kakebo-ticket-temp'`)).toBe("ALLOWED"); // 0 filas visibles/permitidas
    await reset();
    const renamed = await q(`SELECT 1 FROM storage.objects WHERE name LIKE '%z'`);
    expect(renamed).toHaveLength(0); // sin política UPDATE ninguna fila se modifica
  });

  it("DELETE solo en la carpeta propia", async () => {
    const tA = await uploadedTicket(A);
    await db.exec(`UPDATE public.scanner_tickets SET status='initiated', original_storage='none', object_path=NULL WHERE id='${tA}'`);
    const name = `${A}/${tA}/${uuid()}`;
    await asUser(A);
    await db.exec(`INSERT INTO storage.objects (bucket_id,name) VALUES ('kakebo-ticket-temp','${name}')`);
    await asUser(B);
    await db.exec(`DELETE FROM storage.objects WHERE name='${name}'`);
    await reset();
    expect(await q(`SELECT 1 FROM storage.objects WHERE name='${name}'`)).toHaveLength(1);
    await asUser(A);
    await db.exec(`DELETE FROM storage.objects WHERE name='${name}'`);
    await reset();
    expect(await q(`SELECT 1 FROM storage.objects WHERE name='${name}'`)).toHaveLength(0);
  });
});

describe("rollback", () => {
  it("aborta si hay originales en storage y, tras purgar, elimina todo sin tocar months/expenses", async () => {
    await reset();
    await expect(db.exec(ROLLBACK)).rejects.toThrow(/purga el bucket/);
    await db.exec(`UPDATE public.scanner_tickets SET object_path = NULL, original_storage='none', status='initiated'`);
    await db.exec(ROLLBACK);
    const left = await q<{ n: string }>(
      `SELECT count(*)::text n FROM pg_class WHERE relname LIKE 'scanner_%' AND relkind = 'r'`
    );
    expect(left[0].n).toBe("0");
    const fns = await q(`SELECT 1 FROM pg_proc WHERE proname LIKE 'fn_scanner_%'`);
    expect(fns).toHaveLength(0);
    const pol = await q(`SELECT 1 FROM pg_policies WHERE schemaname='storage'`);
    expect(pol).toHaveLength(0);
    expect(await q(`SELECT 1 FROM public.months`)).toHaveLength(3);
    // y se puede volver a aplicar
    await db.exec(MIGRATION);
  });
});
