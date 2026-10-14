#!/usr/bin/env node
/**
 * Preflight del entorno Preview/staging de Kakebo Plus (Stripe TEST + Supabase STAGING).
 *
 * Lee SOLO process.env (el propietario exporta las variables en su terminal; no hay que ponerlas en ningún archivo
 * del repositorio). NUNCA imprime valores: solo OK / FALLO y la razón.
 *
 *   node scripts/plus-staging-preflight.mjs                      # comprobaciones locales de formato/entorno
 *   node scripts/plus-staging-preflight.mjs --online             # + Supabase staging (clave válida) y Stripe TEST (precios)
 *   node scripts/plus-staging-preflight.mjs --probe https://<preview>   # + sondeo del webhook desplegado (solo lectura)
 *
 * Sale con código 1 si algo falla. No escribe nada en Supabase ni en Stripe.
 */

export const STAGING_REF = "gqnsanzsdnbufwicjtiw";
export const PRODUCTION_REF = "fajqfjouqauyfiajfonf";
const PRODUCTION_HOSTS = ["metodokakebo.com", "www.metodokakebo.com"];

/** Decodifica el payload de un JWT SIN verificarlo (solo para leer el claim `ref`). Devuelve null si no es un JWT. */
export function jwtRef(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.ref === "string" ? json.ref : null;
  } catch {
    return null;
  }
}

/** Comprobaciones locales (puras). Devuelve [{ name, ok, detail }] sin incluir nunca valores. */
export function evaluateEnv(env) {
  const out = [];
  const add = (name, ok, detail = "") => out.push({ name, ok: Boolean(ok), detail });
  const has = (k) => typeof env[k] === "string" && env[k].length > 0;

  add("PLUS_SUBSCRIPTIONS_ENABLED es exactamente \"true\"", env.PLUS_SUBSCRIPTIONS_ENABLED === "true", "solo ese valor exacto activa Plus");

  const key = env.STRIPE_SECRET_KEY ?? "";
  add("STRIPE_SECRET_KEY presente", has("STRIPE_SECRET_KEY"));
  add("STRIPE_SECRET_KEY es de TEST (sk_test_)", key.startsWith("sk_test_"), /^(sk|rk)_live_/.test(key) ? "ES UNA CLAVE LIVE: NO USAR" : "");

  add("STRIPE_PLUS_PRICE_MONTHLY_ID con formato price_…", /^price_[A-Za-z0-9]+$/.test(env.STRIPE_PLUS_PRICE_MONTHLY_ID ?? ""));
  add("STRIPE_PLUS_PRICE_ANNUAL_ID con formato price_…", /^price_[A-Za-z0-9]+$/.test(env.STRIPE_PLUS_PRICE_ANNUAL_ID ?? ""));
  add("los dos price IDs son distintos", has("STRIPE_PLUS_PRICE_MONTHLY_ID") && env.STRIPE_PLUS_PRICE_MONTHLY_ID !== env.STRIPE_PLUS_PRICE_ANNUAL_ID);

  const wh = env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET ?? "";
  add("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET con formato whsec_…", /^whsec_[A-Za-z0-9+/=_-]{16,}$/.test(wh));
  add(
    "el secreto de suscripciones es DISTINTO del del pack Excel/PDF (STRIPE_WEBHOOK_SECRET)",
    !has("STRIPE_WEBHOOK_SECRET") || env.STRIPE_WEBHOOK_SECRET !== wh,
    "cada endpoint tiene su propio secreto",
  );

  let host = "";
  try {
    host = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    /* vacío */
  }
  add("NEXT_PUBLIC_SUPABASE_URL apunta a STAGING", host === `${STAGING_REF}.supabase.co`, host.startsWith(PRODUCTION_REF) ? "APUNTA A PRODUCCIÓN: NO USAR" : "");
  add("NEXT_PUBLIC_SUPABASE_ANON_KEY presente", has("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const anonRef = jwtRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  add("la anon key pertenece a STAGING", anonRef === null || anonRef === STAGING_REF, anonRef === PRODUCTION_REF ? "ES LA DE PRODUCCIÓN" : anonRef === null ? "no es un JWT: no verificable" : "");

  add("SUPABASE_SERVICE_ROLE_KEY presente", has("SUPABASE_SERVICE_ROLE_KEY"));
  const svcRef = jwtRef(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  add(
    "la service role key pertenece a STAGING",
    svcRef === null || svcRef === STAGING_REF,
    svcRef === PRODUCTION_REF ? "ES LA DE PRODUCCIÓN: NO USAR" : svcRef === null ? "formato sin claim ref: usa --online para validarla" : "",
  );

  let siteHost = "";
  let siteProto = "";
  try {
    const u = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
    siteHost = u.hostname;
    siteProto = u.protocol;
  } catch {
    /* vacío */
  }
  add("NEXT_PUBLIC_SITE_URL es https (o http en localhost)", siteProto === "https:" || (siteProto === "http:" && siteHost === "localhost"));
  add("NEXT_PUBLIC_SITE_URL NO es el dominio de producción", Boolean(siteHost) && !PRODUCTION_HOSTS.includes(siteHost), "debe ser la URL de la Preview/staging");
  return out;
}

async function online(env) {
  const out = [];
  const add = (name, ok, detail = "") => out.push({ name, ok: Boolean(ok), detail });
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/billing_customers?select=user_id&limit=1`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    add("[online] la service role key es válida en STAGING y existe billing_customers (migraciones Plus)", res.status === 200, `HTTP ${res.status}`);
  } catch {
    add("[online] Supabase staging accesible", false, "error de red");
  }
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    for (const [k, cents, interval] of [["STRIPE_PLUS_PRICE_MONTHLY_ID", 399, "month"], ["STRIPE_PLUS_PRICE_ANNUAL_ID", 3990, "year"]]) {
      const p = await stripe.prices.retrieve(env[k], { expand: ["product"] });
      add(
        `[online] ${k}: Kakebo Plus, ${(cents / 100).toFixed(2)} EUR/${interval}, modo TEST`,
        p.livemode === false && p.unit_amount === cents && p.currency === "eur" && p.recurring?.interval === interval && p.product?.name === "Kakebo Plus",
      );
    }
  } catch (e) {
    add("[online] Stripe TEST accesible y precios correctos", false, e?.code ?? "error");
  }
  return out;
}

async function probe(base) {
  const out = [];
  const add = (name, ok, detail = "") => out.push({ name, ok: Boolean(ok), detail });
  const url = `${base.replace(/\/$/, "")}/api/webhooks/stripe-subscriptions`;
  try {
    const a = await fetch(url, { method: "POST", body: "{}" });
    const ja = await a.json().catch(() => ({}));
    add("[probe] sin firma -> 400 missing_signature", a.status === 400 && ja.code === "missing_signature", `HTTP ${a.status} ${ja.code ?? ""}`.trim());
    const b = await fetch(url, { method: "POST", headers: { "stripe-signature": "t=1,v1=deadbeef" }, body: "{}" });
    const jb = await b.json().catch(() => ({}));
    add("[probe] firma inválida -> 400 invalid_signature", b.status === 400 && jb.code === "invalid_signature", `HTTP ${b.status} ${jb.code ?? ""}`.trim());
    if (a.status === 401 || a.status === 403) add("[probe] la Preview no está bloqueando a Stripe (Vercel Authentication)", false, `HTTP ${a.status}: configura el bypass de protección`);
    if (a.status === 503) add("[probe] el endpoint está configurado", false, `${ja.code ?? "503"}: falta PLUS_SUBSCRIPTIONS_ENABLED o el secreto en esa Preview`);
  } catch {
    add("[probe] endpoint accesible", false, "error de red");
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  let results = evaluateEnv(process.env);
  if (args.includes("--online")) results = results.concat(await online(process.env));
  const i = args.indexOf("--probe");
  if (i >= 0 && args[i + 1]) results = results.concat(await probe(args[i + 1]));
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? "OK   " : "FALLO"}  ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log(failed ? `\n${failed} comprobación(es) fallida(s). No sigas con la prueba real hasta corregirlas.` : "\nTodo correcto.");
  process.exit(failed ? 1 : 0);
}

import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
