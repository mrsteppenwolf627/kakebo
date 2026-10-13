// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import type { PGlite } from "@electric-sql/pglite";
import { adminClientOver, createPlusDb, sessionClientOver } from "../helpers/plus-pglite";

/**
 * E2E CONTRA STRIPE TEST REAL (opt-in).
 *
 * CÓMO EJECUTARLO (no corre en `npm test`; se omite sin el opt-in):
 *   PLUS_E2E_STRIPE_TEST=1 STRIPE_SECRET_KEY=<clave sk_test_ del sandbox> npx vitest run src/__tests__/e2e/plus-stripe-real.e2e.test.ts
 * (PowerShell: $env:PLUS_E2E_STRIPE_TEST="1"; $env:STRIPE_SECRET_KEY="<sk_test_...>"; npx vitest run <ruta>)
 * Requiere el catálogo TEST creado (lookup_keys kakebo_plus_monthly / kakebo_plus_annual y la configuración de portal
 * con metadata kakebo_portal=plus). Dura ~2,5 min (test clocks). No imprimir ni commitear la clave.
 * Con PLUS_E2E_STRIPE_TEST=1 y una clave que NO empiece por "sk_test_" aborta.
 * Usa la API REAL de Stripe TEST (productos/precios/portal/clientes/suscripciones/test clocks/eventos reales) y el
 * código REAL de las rutas (checkout, portal, sync, webhook, normalización, fn_apply_subscription_event). Lo único
 * simulado: la base de datos (PGlite con las migraciones reales) y la sesión de Supabase. Los eventos reales de
 * Stripe se re-firman en local con un secreto aleatorio para atravesar la verificación de firma real del SDK; NO es
 * una entrega HTTP de Stripe. No toca Supabase staging/producción, ni Vercel, ni el webhook del pack.
 * Limpieza: borra los test clocks (y con ellos clientes/suscripciones) y los clientes creados por el checkout.
 */

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
const OPTED_IN = process.env.PLUS_E2E_STRIPE_TEST === "1";
// Con el opt-in activo, una clave que no sea de TEST ABORTA la ejecución (nunca se usa Stripe LIVE).
if (OPTED_IN && !KEY.startsWith("sk_test_")) {
  throw new Error("PLUS_E2E_STRIPE_TEST=1 requiere STRIPE_SECRET_KEY de TEST (sk_test_...). Abortado.");
}
const RUN = OPTED_IN;

const h = vi.hoisted(() => ({ db: null as unknown, admin: null as unknown, user: null as { id: string; email?: string } | null }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.admin }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => sessionClientOver(h.db as PGlite, () => h.user),
}));

const DAY = 86400;
const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe.skipIf(!RUN)("Plus ↔ Stripe TEST real", () => {
  let db: PGlite;
  let stripe: any;
  let secret: string;
  let routes: { checkout: any; portal: any; sync: any; webhook: any };
  let prices: { month: any; year: any };
  const clocks: string[] = [];
  const looseCustomers: string[] = [];
  const startedAt = Math.floor(Date.now() / 1000) - 5;
  let n = 0;
  const uuid = () => { n++; return crypto.randomUUID(); }; // aleatorio: evita reutilizar claves de idempotencia de Stripe entre ejecuciones

  const newUser = async () => {
    const id = uuid();
    await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${id}','${id}@e2e.example.invalid')`);
    return { id, email: `${id}@e2e.example.invalid` };
  };
  const state = async (id: string, at: Date) =>
    (await db.query<{ s: string }>(`SELECT public.fn_resolve_access_state('${id}', '${at.toISOString()}') s`)).rows[0].s;
  const endTrial = (id: string) => db.exec(`UPDATE public.profiles SET trial_ends_at = now() - interval '1 day' WHERE id='${id}'`);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function waitClock(id: string) {
    for (let i = 0; i < 60; i++) {
      const c = await stripe.testHelpers.testClocks.retrieve(id);
      if (c.status === "ready") return c;
      await sleep(1500);
    }
    throw new Error("test clock not ready");
  }
  async function advance(clockId: string, seconds: number) {
    const c = await stripe.testHelpers.testClocks.retrieve(clockId);
    const next = await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: c.frozen_time + seconds });
    await waitClock(next.id);
    await sleep(2500); // deja que Stripe genere los eventos
    return new Date((await stripe.testHelpers.testClocks.retrieve(clockId)).frozen_time * 1000);
  }

  /** Cliente de Stripe en un test clock + billing_customers (equivale a lo que hace /api/stripe/checkout). */
  async function clockCustomer(userId: string, card = "pm_card_visa") {
    const clock = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000), name: `kakebo-e2e-${n}` });
    clocks.push(clock.id);
    const customer = await stripe.customers.create({ test_clock: clock.id, metadata: { user_id: userId } });
    const pm = await stripe.paymentMethods.attach(card, { customer: customer.id });
    await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } });
    await db.query(`INSERT INTO billing_customers (user_id, stripe_customer_id, livemode) VALUES ($1,$2,false)`, [userId, customer.id]);
    return { clockId: clock.id, customerId: customer.id };
  }

  async function subscribe(customerId: string, userId: string, price: string) {
    return stripe.subscriptions.create({ customer: customerId, items: [{ price }], metadata: { user_id: userId } });
  }

  const subOfEvent = (e: any): string | null => {
    const o = e.data.object;
    if (o.object === "subscription") return o.id;
    if (o.object === "invoice") return o.parent?.subscription_details?.subscription ?? null;
    return null;
  };

  /** Eventos REALES de Stripe para una suscripción (los tipos que maneja el webhook), del más antiguo al más reciente. */
  async function realEvents(subId: string, want: string[], timeoutMs = 40000): Promise<any[]> {
    const types = ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"];
    const deadline = Date.now() + timeoutMs;
    let found: any[] = [];
    while (Date.now() < deadline) {
      const list = await stripe.events.list({ limit: 100, created: { gte: startedAt }, types });
      found = list.data.filter((e: any) => subOfEvent(e) === subId).sort((a: any, b: any) => a.created - b.created);
      if (want.every((t) => found.some((e: any) => e.type === t))) return found;
      await sleep(2500);
    }
    throw new Error(`events missing for ${subId}: have ${found.map((e) => e.type).join(",")} want ${want.join(",")}`);
  }

  const deliver = async (event: any, opts: { secret?: string; badSignature?: boolean } = {}) => {
    const payload = JSON.stringify(event);
    const header = opts.badSignature ? "t=1,v1=deadbeef" : stripe.webhooks.generateTestHeaderString({ payload, secret: opts.secret ?? secret });
    const res: Response = await routes.webhook(
      new Request("http://localhost/api/webhooks/stripe-subscriptions", { method: "POST", headers: { "stripe-signature": header }, body: payload }),
    );
    return { status: res.status, body: await res.json() };
  };
  const deliverAll = async (events: any[]) => {
    const out = [];
    for (const e of events) out.push(await deliver(e));
    return out;
  };
  const subRow = async (subId: string) =>
    (await db.query<any>(`SELECT status, plan_interval, current_period_start, current_period_end, cancel_at_period_end FROM subscriptions WHERE stripe_subscription_id='${subId}'`)).rows[0];

  beforeAll(async () => {
    const Stripe = (await import("stripe")).default;
    stripe = new Stripe(KEY);
    secret = "whsec_" + Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("hex");

    const found = await stripe.prices.list({ lookup_keys: ["kakebo_plus_monthly", "kakebo_plus_annual"], active: true, expand: ["data.product"] });
    prices = { month: found.data.find((p: any) => p.lookup_key === "kakebo_plus_monthly"), year: found.data.find((p: any) => p.lookup_key === "kakebo_plus_annual") };
    const portals = await stripe.billingPortal.configurations.list({ limit: 100 });
    const portal = portals.data.find((c: any) => c.metadata?.kakebo_portal === "plus" && c.active);

    vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "true");
    vi.stubEnv("STRIPE_PLUS_PRICE_MONTHLY_ID", prices.month.id);
    vi.stubEnv("STRIPE_PLUS_PRICE_ANNUAL_ID", prices.year.id);
    vi.stubEnv("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET", secret);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.kakebo.example");
    vi.stubEnv("STRIPE_PLUS_PORTAL_CONFIGURATION_ID", portal?.id ?? "");

    db = await createPlusDb();
    h.db = db;
    h.admin = adminClientOver(db);
    routes = {
      checkout: (await import("@/app/api/stripe/checkout/route")).POST,
      portal: (await import("@/app/api/stripe/portal/route")).POST,
      sync: (await import("@/app/api/stripe/sync/route")).POST,
      webhook: (await import("@/app/api/webhooks/stripe-subscriptions/route")).POST,
    };
  }, 120_000);

  afterAll(async () => {
    for (const c of clocks) await stripe.testHelpers.testClocks.del(c).catch(() => undefined);
    for (const c of looseCustomers) await stripe.customers.del(c).catch(() => undefined);
  }, 120_000);

  it("catálogo TEST: producto Kakebo Plus, 3,99 €/mes, 39,90 €/año (IVA incluido) y portal configurado", async () => {
    expect(prices.month.unit_amount).toBe(399);
    expect(prices.month.currency).toBe("eur");
    expect(prices.month.recurring.interval).toBe("month");
    expect(prices.year.unit_amount).toBe(3990);
    expect(prices.year.recurring.interval).toBe("year");
    expect(prices.month.product.name).toBe("Kakebo Plus");
    expect(prices.month.product.id).toBe(prices.year.product.id);
    expect(prices.month.livemode).toBe(false);
    const portals = await stripe.billingPortal.configurations.list({ limit: 100 });
    const cfg = portals.data.find((c: any) => c.metadata?.kakebo_portal === "plus" && c.active);
    expect(cfg).toBeTruthy();
    expect(cfg.features.payment_method_update.enabled).toBe(true);
    expect(cfg.features.invoice_history.enabled).toBe(true);
    expect(cfg.features.subscription_cancel).toMatchObject({ enabled: true, mode: "at_period_end" });
    expect(cfg.features.subscription_update.enabled).toBe(true);
    const full = await stripe.billingPortal.configurations.retrieve(cfg.id, { expand: ["features.subscription_update.products"] });
    const products = full.features.subscription_update.products;
    expect(products).toHaveLength(1);
    expect([...products[0].prices].sort()).toEqual([prices.month.id, prices.year.id].sort());
    expect(products[0].adjustable_quantity.enabled).toBe(false); // el usuario no puede comprar varias unidades
  });

  it.each([["month", 399], ["year", 3990]] as const)("POST /api/stripe/checkout (%s) crea una Checkout Session REAL: suscripción, cobro inmediato, sin trial", async (interval, cents) => {
    const u = await newUser();
    h.user = u;
    const res = await routes.checkout(req("/api/stripe/checkout", { interval }));
    expect(res.status).toBe(200);
    const url: string = (await res.json()).data.url;
    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

    const mapping = await db.query<any>(`SELECT stripe_customer_id FROM billing_customers WHERE user_id='${u.id}'`);
    const customerId = mapping.rows[0].stripe_customer_id;
    looseCustomers.push(customerId);
    const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 });
    const session = await stripe.checkout.sessions.retrieve(sessions.data[0].id, { expand: ["line_items"] });
    expect(session.mode).toBe("subscription");
    expect(session.client_reference_id).toBe(u.id);
    expect(session.metadata.user_id).toBe(u.id);
    expect(session.amount_total).toBe(cents); // se cobra YA el importe completo: no hay trial de Stripe
    expect(session.line_items.data).toHaveLength(1);
    expect(session.line_items.data[0].price.id).toBe(interval === "month" ? prices.month.id : prices.year.id);
    expect(session.payment_status).toBe("unpaid"); // aún no pagada; el acceso no se concede
    expect(session.success_url).toBe("https://staging.kakebo.example/app/subscription?plus=success&session_id={CHECKOUT_SESSION_ID}");
    expect(await state(u.id, new Date())).toBe("trialing"); // sin cambios: nada concedido por crear el Checkout

    // sync con la sesión REAL sin pagar -> 409 (no concede); con la sesión de OTRO usuario -> 403
    const sync = await routes.sync(req("/api/stripe/sync", { session_id: session.id }));
    expect(sync.status).toBe(409);
    const other = await newUser();
    await db.query(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ($1,$2)`, [other.id, "cus_notmine" + n]);
    h.user = other;
    expect((await routes.sync(req("/api/stripe/sync", { session_id: session.id }))).status).toBe(403);
    h.user = null;
  }, 60_000);

  it("POST /api/stripe/portal crea una sesión REAL del Customer Portal con la configuración de Kakebo", async () => {
    const u = await newUser();
    const { customerId } = await clockCustomer(u.id);
    h.user = u;
    const res = await routes.portal(req("/api/stripe/portal", { locale: "en" }));
    expect(res.status).toBe(200);
    const url: string = (await res.json()).data.url;
    expect(url).toMatch(/^https:\/\/billing\.stripe\.com\//);
    expect(customerId).toMatch(/^cus_/);
    h.user = null;
  }, 60_000);

  it("MENSUAL: la suscripción real se cobra al instante, los eventos reales activan plus_active y se desbloquean IA/búsqueda", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const { customerId } = await clockCustomer(u.id);
    expect(await state(u.id, new Date())).toBe("free_under_limit");

    const sub = await subscribe(customerId, u.id, prices.month.id);
    expect(sub.status).toBe("active");
    expect(sub.trial_end).toBeNull(); // sin trial de Stripe
    const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
    expect(invoice.status).toBe("paid");
    expect(invoice.amount_paid).toBe(399); // cobro inmediato

    const events = await realEvents(sub.id, ["customer.subscription.created", "invoice.paid"]);
    const results = await deliverAll(events);
    for (const r of results) expect(r.status).toBe(200);

    const row = await subRow(sub.id);
    expect(row).toMatchObject({ status: "active", plan_interval: "monthly", cancel_at_period_end: false });
    const periodEnd = sub.items.data[0].current_period_end;
    expect(Math.floor(new Date(row.current_period_end).getTime() / 1000)).toBe(periodEnd);
    expect(periodEnd - sub.items.data[0].current_period_start).toBeGreaterThanOrEqual(28 * DAY);
    expect(periodEnd - sub.items.data[0].current_period_start).toBeLessThanOrEqual(31 * DAY);
    expect(await state(u.id, new Date())).toBe("plus_active");

    // fn_my_access del propio usuario: permisos de IA y búsqueda (misma lógica de requireAccess)
    h.user = u;
    const access = (await sessionClientOver(db, () => u).rpc("fn_my_access")).data as any;
    expect(access).toMatchObject({ state: "plus_active", is_premium: true });
    expect(access.permissions.can_use_ai).toBe(true);
    expect(new Date(access.plus_access_until).getTime() / 1000).toBe(periodEnd);
    h.user = null;
  }, 120_000);

  it("ANUAL: 39,90 € cobrados al instante, intervalo anual y renovación a un año", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const { customerId } = await clockCustomer(u.id);
    const sub = await subscribe(customerId, u.id, prices.year.id);
    const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
    expect(invoice.amount_paid).toBe(3990);
    await deliverAll(await realEvents(sub.id, ["customer.subscription.created", "invoice.paid"]));
    const row = await subRow(sub.id);
    expect(row.plan_interval).toBe("annual");
    const span = (new Date(row.current_period_end).getTime() - new Date(row.current_period_start).getTime()) / 1000;
    expect(span).toBeGreaterThanOrEqual(364 * DAY);
    expect(span).toBeLessThanOrEqual(366 * DAY);
    expect(await state(u.id, new Date())).toBe("plus_active");
  }, 120_000);

  it("PAGO DURANTE EL TRIAL: un usuario en trial que paga pasa a plus_active sin esperar al fin del trial", async () => {
    const u = await newUser();
    expect(await state(u.id, new Date())).toBe("trialing");
    const { customerId } = await clockCustomer(u.id);
    const sub = await subscribe(customerId, u.id, prices.month.id);
    expect((await stripe.invoices.retrieve(sub.latest_invoice)).amount_paid).toBe(399);
    await deliverAll(await realEvents(sub.id, ["customer.subscription.created"]));
    expect(await state(u.id, new Date())).toBe("plus_active");
    const [{ t }] = (await db.query<any>(`SELECT (trial_ends_at > now()) t FROM profiles WHERE id='${u.id}'`)).rows;
    expect(t).toBe(true); // el trial interno seguía vigente: pagar no lo espera
  }, 120_000);

  it("CANCELACIÓN al final del periodo: plus_canceled_pending, acceso hasta current_period_end, después gratuito; y reactivación", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const { clockId, customerId } = await clockCustomer(u.id);
    const sub = await subscribe(customerId, u.id, prices.month.id);
    await deliverAll(await realEvents(sub.id, ["customer.subscription.created"]));

    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    let events = await realEvents(sub.id, ["customer.subscription.updated"]);
    await deliverAll(events);
    const periodEnd = new Date((await stripe.subscriptions.retrieve(sub.id)).items.data[0].current_period_end * 1000);
    expect((await subRow(sub.id)).cancel_at_period_end).toBe(true);
    expect(await state(u.id, new Date(periodEnd.getTime() - 3600_000))).toBe("plus_canceled_pending");

    // reactivar antes del final
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
    await sleep(3000);
    events = await realEvents(sub.id, ["customer.subscription.updated"]);
    await deliverAll(events);
    expect((await subRow(sub.id)).cancel_at_period_end).toBe(false);
    expect(await state(u.id, new Date())).toBe("plus_active");

    // volver a cancelar y dejar pasar el periodo
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    await sleep(3000);
    const clockNow = await advance(clockId, 32 * DAY);
    events = await realEvents(sub.id, ["customer.subscription.deleted"]);
    await deliverAll(events);
    expect((await subRow(sub.id)).status).toBe("canceled");
    expect(await state(u.id, clockNow)).toBe("free_under_limit");
  }, 240_000);

  it("CAMBIO DE PLAN mensual→anual→mensual: subscriptions se actualiza y el acceso se conserva", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const { customerId } = await clockCustomer(u.id);
    const sub = await subscribe(customerId, u.id, prices.month.id);
    await deliverAll(await realEvents(sub.id, ["customer.subscription.created"]));
    expect((await subRow(sub.id)).plan_interval).toBe("monthly");

    const itemId = sub.items.data[0].id;
    const preview = await stripe.invoices.createPreview({ customer: customerId, subscription: sub.id, subscription_details: { items: [{ id: itemId, price: prices.year.id }], proration_behavior: "create_prorations" } });
    expect(preview.lines.data.length).toBeGreaterThan(0); // Stripe informa del prorrateo

    await stripe.subscriptions.update(sub.id, { items: [{ id: itemId, price: prices.year.id }], proration_behavior: "create_prorations" });
    await sleep(3000);
    await deliverAll(await realEvents(sub.id, ["customer.subscription.updated"]));
    let row = await subRow(sub.id);
    expect(row.plan_interval).toBe("annual");
    expect(row.status).toBe("active");
    expect(await state(u.id, new Date())).toBe("plus_active");

    const live = await stripe.subscriptions.retrieve(sub.id);
    await stripe.subscriptions.update(sub.id, { items: [{ id: live.items.data[0].id, price: prices.month.id }], proration_behavior: "create_prorations" });
    await sleep(3000);
    const evts = await realEvents(sub.id, ["customer.subscription.updated"]);
    await deliverAll(evts.slice(-1));
    row = await subRow(sub.id);
    expect(row.plan_interval).toBe("monthly");
    expect(await state(u.id, new Date())).toBe("plus_active");
  }, 240_000);

  it("PAGO FALLIDO en la renovación: past_due con 3 días de gracia; recuperación; y pérdida de Plus al agotar la gracia", async () => {
    // --- A) fallo -> gracia -> se agota
    const a = await newUser();
    await endTrial(a.id);
    const ca = await clockCustomer(a.id);
    const subA = await subscribe(ca.customerId, a.id, prices.month.id);
    await deliverAll(await realEvents(subA.id, ["customer.subscription.created"]));
    const failCard = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: ca.customerId });
    await stripe.customers.update(ca.customerId, { invoice_settings: { default_payment_method: failCard.id } });
    await stripe.subscriptions.update(subA.id, { default_payment_method: failCard.id });

    const periodEndA = (await stripe.subscriptions.retrieve(subA.id)).items.data[0].current_period_end;
    const clockA = await stripe.testHelpers.testClocks.retrieve(ca.clockId);
    const afterRenewal = await advance(ca.clockId, periodEndA - clockA.frozen_time + 3600); // 1 h después de la renovación
    const liveA = await stripe.subscriptions.retrieve(subA.id);
    expect(liveA.status).toBe("past_due");
    const eventsA = await realEvents(subA.id, ["invoice.payment_failed"]);
    const resA = await deliverAll(eventsA);
    for (const r of resA) expect(r.status).toBe(200);
    expect((await subRow(subA.id)).status).toBe("past_due");
    const startA = new Date(liveA.items.data[0].current_period_start * 1000);
    expect(await state(a.id, new Date(startA.getTime() + 2 * DAY * 1000))).toBe("plus_active"); // dentro de la gracia
    expect(await state(a.id, new Date(startA.getTime() + 4 * DAY * 1000))).toBe("free_under_limit"); // gracia agotada
    expect(afterRenewal.getTime()).toBeGreaterThan(startA.getTime() - 1);

    // --- B) fallo -> recuperación dentro de la gracia
    const b = await newUser();
    await endTrial(b.id);
    const cb = await clockCustomer(b.id);
    const subB = await subscribe(cb.customerId, b.id, prices.month.id);
    await deliverAll(await realEvents(subB.id, ["customer.subscription.created"]));
    const failB = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: cb.customerId });
    await stripe.customers.update(cb.customerId, { invoice_settings: { default_payment_method: failB.id } });
    await stripe.subscriptions.update(subB.id, { default_payment_method: failB.id });
    const pe = (await stripe.subscriptions.retrieve(subB.id)).items.data[0].current_period_end;
    const clk = await stripe.testHelpers.testClocks.retrieve(cb.clockId);
    await advance(cb.clockId, pe - clk.frozen_time + 3600);
    const failedSub = await stripe.subscriptions.retrieve(subB.id);
    expect(failedSub.status).toBe("past_due");
    await deliverAll(await realEvents(subB.id, ["invoice.payment_failed"]));
    expect((await subRow(subB.id)).status).toBe("past_due");

    const good = await stripe.paymentMethods.attach("pm_card_visa", { customer: cb.customerId });
    await stripe.customers.update(cb.customerId, { invoice_settings: { default_payment_method: good.id } });
    await stripe.subscriptions.update(subB.id, { default_payment_method: good.id });
    const openInvoice = failedSub.latest_invoice as string;
    await stripe.invoices.pay(openInvoice, { payment_method: good.id });
    await sleep(3000);
    const all = await realEvents(subB.id, ["invoice.paid"]);
    await deliverAll(all);
    const recovered = await subRow(subB.id);
    expect(recovered.status).toBe("active");
    const startB = new Date(failedSub.items.data[0].current_period_start * 1000);
    expect(await state(b.id, new Date(startB.getTime() + 10 * DAY * 1000))).toBe("plus_active"); // acceso conservado tras recuperar
  }, 360_000);

  it("WEBHOOK con eventos reales: duplicados, fuera de orden, firma inválida/ajena y evento live", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const { customerId } = await clockCustomer(u.id);
    const sub = await subscribe(customerId, u.id, prices.month.id);
    const events = await realEvents(sub.id, ["customer.subscription.created", "invoice.paid"]);
    const created = events.find((e) => e.type === "customer.subscription.created");

    // firma inválida / secreto ajeno -> 400 y nada se aplica
    expect((await deliver(created, { badSignature: true })).status).toBe(400);
    expect((await deliver(created, { secret: "whsec_" + "a".repeat(48) })).status).toBe(400);
    expect(await state(u.id, new Date())).toBe("free_under_limit");

    // evento live firmado correctamente en un endpoint con clave TEST -> ignorado
    const live = { ...created, id: "evt_live_" + n, livemode: true };
    const liveRes = await deliver(live);
    expect(liveRes.status).toBe(200);
    expect(liveRes.body.reason).toBe("environment_mismatch");
    expect(await state(u.id, new Date())).toBe("free_under_limit");

    // entrega normal, duplicado y evento antiguo después de uno nuevo
    const first = await deliver(created);
    expect(first.body.result).toBe("applied");
    const dup = await deliver(created);
    expect(dup.body.result).toBe("duplicate");
    const newer = { ...events[events.length - 1], id: "evt_newer_" + n, created: Math.floor(Date.now() / 1000) + 600 };
    expect((await deliver(newer)).body.result).toBe("applied");
    const older = { ...created, id: "evt_older_" + n, created: Math.floor(Date.now() / 1000) - 600 };
    expect((await deliver(older)).body.result).toBe("stale");
    expect(await state(u.id, new Date())).toBe("plus_active");
  }, 120_000);
});
