// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type { PGlite } from "@electric-sql/pglite";
import { adminClientOver, createPlusDb, sessionClientOver } from "../../helpers/plus-pglite";

/**
 * Bloque 3 — integración Stripe TEST (simulada): checkout, portal, sync y webhook de suscripciones.
 * Stripe y Supabase de sesión se simulan; la base de datos es REAL (PGlite + migraciones Plus), así que la
 * idempotencia, el orden de eventos y el aislamiento entre usuarios son los de fn_apply_subscription_event.
 */

const h = vi.hoisted(() => ({
  db: null as unknown,
  admin: null as unknown,
  currentUser: null as { id: string; email?: string } | null,
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    subscriptions: { retrieve: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
  adminCreated: { count: 0 },
}));

vi.mock("@/lib/stripe/server", () => ({ getStripe: () => h.stripe }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    h.adminCreated.count++;
    return h.admin;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => sessionClientOver(h.db as PGlite, () => h.currentUser),
}));

import { POST as checkoutPOST } from "@/app/api/stripe/checkout/route";
import { POST as portalPOST } from "@/app/api/stripe/portal/route";
import { POST as syncPOST } from "@/app/api/stripe/sync/route";
import { POST as webhookPOST } from "@/app/api/webhooks/stripe-subscriptions/route";

const PRICE_M = "price_monthlytest123";
const PRICE_Y = "price_annualtest123";
const env = {
  PLUS_SUBSCRIPTIONS_ENABLED: "true",
  STRIPE_SECRET_KEY: "sk_test_dummy_for_unit_tests",
  STRIPE_PLUS_PRICE_MONTHLY_ID: PRICE_M,
  STRIPE_PLUS_PRICE_ANNUAL_ID: PRICE_Y,
  STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: "whsec_dummy_for_unit_tests",
  NEXT_PUBLIC_SITE_URL: "https://kakebo.test",
};

let db: PGlite;
let n = 0;
const uuid = () => `10000000-0000-0000-0000-${String(++n).padStart(12, "0")}`;
const DAY = 86400;
const nowS = () => Math.floor(Date.now() / 1000);

async function newUser(email = "u@x.test") {
  const id = uuid();
  await db.exec(`INSERT INTO auth.users (id,email) VALUES ('${id}','${id}-${email}')`);
  return { id, email: `${id}-${email}` };
}
const endTrial = (id: string) => db.exec(`UPDATE public.profiles SET trial_ends_at = now() - interval '1 day' WHERE id='${id}'`);
const state = async (id: string) =>
  (await db.query<{ s: string }>(`SELECT public.fn_resolve_access_state('${id}', now()) s`)).rows[0].s;
const rows = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;

interface SubOpts {
  id?: string; customer?: string; status?: string; price?: string; user?: string | null;
  start?: number; end?: number; cancel?: boolean; items?: number;
}
const makeSub = (o: SubOpts = {}) => ({
  id: o.id ?? "sub_test1",
  object: "subscription",
  customer: o.customer ?? "cus_test1",
  status: o.status ?? "active",
  cancel_at_period_end: o.cancel ?? false,
  canceled_at: null,
  ended_at: null,
  latest_invoice: "in_test1",
  metadata: o.user === null ? {} : { user_id: o.user ?? "" },
  items: {
    data: Array.from({ length: o.items ?? 1 }, () => ({
      price: { id: o.price ?? PRICE_M },
      current_period_start: o.start ?? nowS(),
      current_period_end: o.end ?? nowS() + 30 * DAY,
    })),
  },
});

const jsonReq = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

let evtN = 0;
const makeEvent = (type: string, object: unknown, o: { id?: string; created?: number; livemode?: boolean } = {}) => ({
  id: o.id ?? `evt_t${++evtN}`,
  type,
  created: o.created ?? nowS(),
  livemode: o.livemode ?? false,
  data: { object },
});
const hook = (event: unknown, signature: string | null = "valid") => {
  h.stripe.webhooks.constructEvent.mockImplementation((raw: string, sig: string) => {
    if (sig !== "valid") throw new Error("bad signature");
    return JSON.parse(raw);
  });
  return webhookPOST(
    new Request("http://localhost/api/webhooks/stripe-subscriptions", {
      method: "POST",
      headers: signature ? { "stripe-signature": signature } : {},
      body: JSON.stringify(event),
    }),
  );
};
const invoiceFor = (subId: string) => ({ object: "invoice", parent: { subscription_details: { subscription: subId } } });

beforeAll(async () => {
  db = await createPlusDb();
  h.db = db;
  h.admin = adminClientOver(db);
}, 60_000);

beforeEach(() => {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.stubEnv("STRIPE_PLUS_PORTAL_CONFIGURATION_ID", "");
  h.adminCreated.count = 0;
  h.currentUser = null;
  vi.clearAllMocks();
  h.stripe.subscriptions.retrieve.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/stripe/checkout", () => {
  let cusN = 0;
  beforeEach(() => {
    h.stripe.customers.create.mockImplementation(async () => ({ id: `cus_new${++cusN}x` }));
    h.stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.test/c/pay_x" });
  });

  it.each([["month", PRICE_M], ["year", PRICE_Y]] as const)("checkout %s: precio resuelto en servidor, sin trial de Stripe y sin conceder acceso", async (interval, price) => {
    const u = await newUser();
    h.currentUser = u;
    const res = await checkoutPOST(jsonReq("/api/stripe/checkout", { interval }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.url).toContain("checkout.stripe.test");

    const params = h.stripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.mode).toBe("subscription");
    expect(params.line_items).toEqual([{ price, quantity: 1 }]);
    expect(params.client_reference_id).toBe(u.id);
    expect(params.metadata.user_id).toBe(u.id);
    expect(params.subscription_data.metadata.user_id).toBe(u.id);
    // Pago durante el trial interno => cobro inmediato: NO hay trial de Stripe ni recogida diferida del método de pago.
    expect(params.subscription_data.trial_period_days).toBeUndefined();
    expect(params.subscription_data.trial_end).toBeUndefined();
    expect(params.payment_method_collection).toBeUndefined();
    expect(params.success_url).toMatch(/^https:\/\/kakebo\.test\/es\/settings\?plus=success&session_id=\{CHECKOUT_SESSION_ID\}$/);
    expect(params.cancel_url).toBe("https://kakebo.test/es/settings?plus=cancelled");

    // El customer queda guardado en billing_customers, pero NO se concede acceso (sigue en trial).
    expect(await rows(`SELECT stripe_customer_id FROM billing_customers WHERE user_id='${u.id}'`)).toHaveLength(1);
    expect(await rows(`SELECT 1 FROM subscriptions WHERE user_id='${u.id}'`)).toHaveLength(0);
    expect(await state(u.id)).toBe("trialing");
  });

  it("reutiliza el customer propio (no crea otro)", async () => {
    const u = await newUser();
    h.currentUser = u;
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_mine123')`);
    await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month" }));
    expect(h.stripe.customers.create).not.toHaveBeenCalled();
    expect(h.stripe.checkout.sessions.create.mock.calls[0][0].customer).toBe("cus_mine123");
  });

  it("customer ajeno: el cuerpo no puede aportar customer, precio ni user_id (422) y no se llama a Stripe", async () => {
    const owner = await newUser();
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${owner.id}','cus_someoneelse')`);
    const u = await newUser();
    h.currentUser = u;
    for (const extra of [{ customer_id: "cus_someoneelse" }, { customer: "cus_someoneelse" }, { price_id: "price_evil1" }, { price: "price_evil1" }, { user_id: owner.id }, { userId: owner.id }]) {
      const res = await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month", ...extra }));
      expect(res.status, JSON.stringify(extra)).toBe(422);
    }
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
    // Y con cuerpo válido usa SU propio customer, nunca el ajeno.
    await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month" }));
    expect(h.stripe.checkout.sessions.create.mock.calls[0][0].customer).not.toBe("cus_someoneelse");
  });

  it("intervalo inválido -> 422", async () => {
    h.currentUser = await newUser();
    for (const interval of ["week", "monthly", "annual", "", 12, null]) {
      expect((await checkoutPOST(jsonReq("/api/stripe/checkout", { interval }))).status).toBe(422);
    }
    expect((await checkoutPOST(jsonReq("/api/stripe/checkout", "not json"))).status).toBe(422);
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("sin sesión -> 401 y sin llamadas a Stripe", async () => {
    h.currentUser = null;
    expect((await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month" }))).status).toBe(401);
    expect(h.stripe.customers.create).not.toHaveBeenCalled();
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("flag apagado -> 503 PLUS_DISABLED", async () => {
    vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "false");
    h.currentUser = await newUser();
    const res = await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("PLUS_DISABLED");
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("ya suscrito -> 409 (se gestiona desde el portal)", async () => {
    const u = await newUser();
    h.currentUser = u;
    await db.exec(`SELECT public.fn_apply_subscription_event('evt_pre${u.id.slice(-6)}','x',false,now(),'${u.id}',
      '{"subscription_id":"sub_pre${u.id.slice(-6)}","customer_id":"cus_pre${u.id.slice(-6)}","status":"active","interval":"monthly","current_period_end":"${new Date(Date.now() + 20 * DAY * 1000).toISOString()}"}'::jsonb)`);
    expect((await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "year" }))).status).toBe(409);
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("locale en -> URLs en /en/", async () => {
    h.currentUser = await newUser();
    await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "year", locale: "en" }));
    expect(h.stripe.checkout.sessions.create.mock.calls[0][0].success_url).toContain("https://kakebo.test/en/settings");
  });

  it("NEXT_PUBLIC_SITE_URL no seguro (http no local) -> error y sin llamar a Stripe", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://evil.example");
    h.currentUser = await newUser();
    const res = await checkoutPOST(jsonReq("/api/stripe/checkout", { interval: "month" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/portal", () => {
  beforeEach(() => h.stripe.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.test/p/session_x" }));

  it("usa el customer del propio usuario (billing_customers) y devuelve la URL", async () => {
    const u = await newUser();
    h.currentUser = u;
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_portalmine1')`);
    vi.stubEnv("STRIPE_PLUS_PORTAL_CONFIGURATION_ID", "bpc_test123");
    const res = await portalPOST(jsonReq("/api/stripe/portal", {}));
    expect(res.status).toBe(200);
    expect((await res.json()).data.url).toContain("billing.stripe.test");
    expect(h.stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_portalmine1",
      return_url: "https://kakebo.test/es/settings",
      configuration: "bpc_test123",
    });
  });

  it("nunca acepta customer_id del navegador (422)", async () => {
    const u = await newUser();
    h.currentUser = u;
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_portalmine2')`);
    const res = await portalPOST(jsonReq("/api/stripe/portal", { customer_id: "cus_victim" }));
    expect(res.status).toBe(422);
    expect(h.stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("sin cuenta de facturación -> 404; sin sesión -> 401; flag apagado -> 503", async () => {
    h.currentUser = await newUser();
    expect((await portalPOST(jsonReq("/api/stripe/portal", {}))).status).toBe(404);
    h.currentUser = null;
    expect((await portalPOST(jsonReq("/api/stripe/portal", {}))).status).toBe(401);
    vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "no");
    expect((await portalPOST(jsonReq("/api/stripe/portal", {}))).status).toBe(503);
    expect(h.stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("un usuario sin Plus activo (pago fallido, caducado) también puede abrir el portal", async () => {
    const u = await newUser();
    h.currentUser = u;
    await endTrial(u.id);
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_portalfree')`);
    expect(await state(u.id)).toBe("free_under_limit");
    expect((await portalPOST(jsonReq("/api/stripe/portal", {}))).status).toBe(200);
  });
});

describe("POST /api/stripe/sync", () => {
  const session = (u: string, customer: string, o: Record<string, unknown> = {}) => ({
    id: "cs_test_sync1", mode: "subscription", client_reference_id: u, metadata: { user_id: u }, customer,
    payment_status: "paid", subscription: "sub_sync1", livemode: false, ...o,
  });
  const sid = "cs_test_sync1abc";

  it("sincroniza la sesión de Checkout PROPIA: aplica la suscripción verificada y concede Plus", async () => {
    const u = await newUser();
    h.currentUser = u;
    await endTrial(u.id);
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_sync_own')`);
    h.stripe.checkout.sessions.retrieve.mockResolvedValue(session(u.id, "cus_sync_own"));
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_sync1", customer: "cus_sync_own", user: u.id }));
    expect(await state(u.id)).toBe("free_under_limit");
    const res = await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ synced: true, applied: true, access: "plus_active" });
    // Repetir es idempotente.
    const again = await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }));
    expect((await again.json()).data).toMatchObject({ applied: false, access: "plus_active" });
  });

  it("sesión AJENA (client_reference_id de otro usuario) -> 403 y no se aplica nada", async () => {
    const victim = await newUser();
    const attacker = await newUser();
    h.currentUser = attacker;
    await endTrial(attacker.id);
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${attacker.id}','cus_att_own')`);
    h.stripe.checkout.sessions.retrieve.mockResolvedValue(session(victim.id, "cus_victim_x", { subscription: "sub_victim1" }));
    const res = await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }));
    expect(res.status).toBe(403);
    expect(h.stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(await state(attacker.id)).toBe("free_under_limit");
    expect(JSON.stringify(await res.json())).not.toContain(victim.id);
  });

  it("sesión con el customer de otro (aunque el user_id sea el propio) -> 403", async () => {
    const attacker = await newUser();
    h.currentUser = attacker;
    await endTrial(attacker.id);
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${attacker.id}','cus_att_own2')`);
    h.stripe.checkout.sessions.retrieve.mockResolvedValue(session(attacker.id, "cus_not_mine"));
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(403);
    expect(h.stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("suscripción con metadata de otro usuario o precio ajeno al catálogo Plus -> 403", async () => {
    const u = await newUser();
    h.currentUser = u;
    await endTrial(u.id);
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_sync_own3')`);
    h.stripe.checkout.sessions.retrieve.mockResolvedValue(session(u.id, "cus_sync_own3"));
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_sync1", customer: "cus_sync_own3", user: uuid() }));
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(403);
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_sync1", customer: "cus_sync_own3", user: u.id, price: "price_other_product" }));
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(403);
    expect(await state(u.id)).toBe("free_under_limit");
  });

  it("pago no completado -> 409 sin aplicar; session_id malformado -> 422; sin sesión -> 401; sin customer -> 403", async () => {
    const u = await newUser();
    h.currentUser = u;
    await endTrial(u.id);
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(403); // aún sin billing_customers
    await db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','cus_sync_own4')`);
    h.stripe.checkout.sessions.retrieve.mockResolvedValue(session(u.id, "cus_sync_own4", { payment_status: "unpaid" }));
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(409);
    expect(await state(u.id)).toBe("free_under_limit");
    for (const bad of ["sub_123", "cs_test_", "../../x", "", 5]) {
      expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: bad }))).status).toBe(422);
    }
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid, user_id: u.id }))).status).toBe(422);
    h.currentUser = null;
    expect((await syncPOST(jsonReq("/api/stripe/sync", { session_id: sid }))).status).toBe(401);
  });
});

describe("POST /api/webhooks/stripe-subscriptions", () => {
  const link = async (u: { id: string }, customer: string) =>
    db.exec(`INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ('${u.id}','${customer}')`);

  it("firma inválida o ausente -> 400 y no se procesa ni se abre el cliente admin", async () => {
    const ev = makeEvent("customer.subscription.created", makeSub({ user: uuid() }));
    expect((await hook(ev, "forged")).status).toBe(400);
    expect((await hook(ev, null)).status).toBe(400);
    expect(h.adminCreated.count).toBe(0);
    expect(h.stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("la firma se verifica con STRIPE_SUBSCRIPTION_WEBHOOK_SECRET sobre el cuerpo en bruto", async () => {
    await hook(makeEvent("ping.unknown", {}));
    const [raw, sig, secret] = h.stripe.webhooks.constructEvent.mock.calls[0];
    expect(typeof raw).toBe("string");
    expect(sig).toBe("valid");
    expect(secret).toBe(env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET);
  });

  it("sin secreto configurado o con el flag apagado -> 503", async () => {
    vi.stubEnv("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET", "");
    expect((await hook(makeEvent("invoice.paid", {}))).status).toBe(503);
    vi.stubEnv("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET", env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET);
    vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "false");
    expect((await hook(makeEvent("invoice.paid", {}))).status).toBe(503);
  });

  it("checkout.session.completed vincula customer y usuario pero NO concede acceso", async () => {
    const u = await newUser();
    await endTrial(u.id);
    const ev = makeEvent("checkout.session.completed", {
      object: "checkout.session", mode: "subscription", client_reference_id: u.id, metadata: { user_id: u.id },
      customer: "cus_linked1", payment_status: "paid", subscription: "sub_linked1",
    });
    const res = await hook(ev);
    expect(res.status).toBe(200);
    expect((await res.json()).result).toBe("linked");
    expect(await rows(`SELECT stripe_customer_id FROM billing_customers WHERE user_id='${u.id}'`)).toEqual([{ stripe_customer_id: "cus_linked1" }]);
    expect(await rows(`SELECT 1 FROM subscriptions WHERE user_id='${u.id}'`)).toHaveLength(0);
    expect(await state(u.id)).toBe("free_under_limit");
  });

  it("checkout.session.completed con customer ya ligado a otro usuario o sesión sin metadata -> ignorado", async () => {
    const owner = await newUser();
    await link(owner, "cus_owned1");
    const u = await newUser();
    const mk = (extra: Record<string, unknown>) => makeEvent("checkout.session.completed", { mode: "subscription", client_reference_id: u.id, metadata: { user_id: u.id }, customer: "cus_owned1", ...extra });
    expect((await (await hook(mk({}))).json()).reason).toBe("customer_conflict");
    expect((await (await hook(mk({ metadata: {} }))).json()).reason).toBe("session_without_user");
    expect((await (await hook(mk({ mode: "payment" }))).json()).reason).toBe("not_subscription_session");
    expect(await rows(`SELECT 1 FROM billing_customers WHERE user_id='${u.id}'`)).toHaveLength(0);
  });

  it("customer.subscription.created concede Plus (estado verificado en Stripe)", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_c1");
    const sub = makeSub({ id: "sub_c1", customer: "cus_c1", user: u.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    const res = await hook(makeEvent("customer.subscription.created", sub));
    expect(res.status).toBe(200);
    expect((await res.json()).result).toBe("applied");
    expect(await state(u.id)).toBe("plus_active");
    expect((await rows<{ plan_interval: string }>(`SELECT plan_interval FROM subscriptions WHERE user_id='${u.id}'`))[0].plan_interval).toBe("monthly");
  });

  it("pago durante el trial: el usuario en trial que paga pasa a plus_active de inmediato (y conserva el trial sin límite de gasto)", async () => {
    const u = await newUser();
    await link(u, "cus_trialpay");
    expect(await state(u.id)).toBe("trialing");
    const sub = makeSub({ id: "sub_trialpay", customer: "cus_trialpay", user: u.id, price: PRICE_Y, end: nowS() + 365 * DAY });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    await hook(makeEvent("customer.subscription.created", sub));
    expect(await state(u.id)).toBe("plus_active");
    expect((await rows<{ plan_interval: string }>(`SELECT plan_interval FROM subscriptions WHERE user_id='${u.id}'`))[0].plan_interval).toBe("annual");
  });

  it("evento duplicado: no cambia nada", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_dup1");
    const sub = makeSub({ id: "sub_dup1", customer: "cus_dup1", user: u.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    const ev = makeEvent("customer.subscription.created", sub, { id: "evt_dupfixed1" });
    expect((await (await hook(ev)).json()).result).toBe("applied");
    // Entre medias Stripe "cambia"; el duplicado del evento original no debe aplicar ese cambio.
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_dup1", customer: "cus_dup1", user: u.id, status: "canceled" }));
    expect((await (await hook(ev)).json()).result).toBe("duplicate");
    expect(await state(u.id)).toBe("plus_active");
    expect(await rows(`SELECT 1 FROM stripe_webhook_events WHERE stripe_event_id='evt_dupfixed1'`)).toHaveLength(1);
  });

  it("evento fuera de orden: uno anterior no pisa el estado nuevo", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_ooo1");
    const t = nowS();
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_ooo1", customer: "cus_ooo1", user: u.id }));
    const sub = makeSub({ id: "sub_ooo1", customer: "cus_ooo1", user: u.id });
    expect((await (await hook(makeEvent("customer.subscription.updated", sub, { created: t, id: "evt_newer2" }))).json()).result).toBe("applied");
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_ooo1", customer: "cus_ooo1", user: u.id, status: "canceled" }));
    const old = await (await hook(makeEvent("customer.subscription.updated", sub, { created: t - 600, id: "evt_older1" }))).json();
    expect(old.result).toBe("stale");
    expect(await state(u.id)).toBe("plus_active");
  });

  it("invoice.paid actualiza el periodo", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_paid1");
    const t = nowS();
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_paid1", customer: "cus_paid1", user: u.id, end: t + 5 * DAY }));
    await hook(makeEvent("customer.subscription.created", {}, { created: t - 100 }));
    const first = makeSub({ id: "sub_paid1", customer: "cus_paid1", user: u.id, end: t + 5 * DAY });
    await hook(makeEvent("customer.subscription.created", first, { created: t - 90 }));
    const renewedEnd = t + 35 * DAY;
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_paid1", customer: "cus_paid1", user: u.id, start: t, end: renewedEnd }));
    const res = await hook(makeEvent("invoice.paid", invoiceFor("sub_paid1"), { created: t }));
    expect((await res.json()).result).toBe("applied");
    const [{ e }] = await rows<{ e: string }>(`SELECT extract(epoch FROM current_period_end)::bigint::text e FROM subscriptions WHERE stripe_subscription_id='sub_paid1'`);
    expect(Number(e)).toBe(renewedEnd);
  });

  it("invoice.payment_failed: mantiene acceso dentro de la gracia y lo pierde fuera de ella", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_pf1");
    const t = nowS();
    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_pf1", customer: "cus_pf1", user: u.id, status: "past_due", start: t - 1 * DAY, end: t + 29 * DAY }));
    expect((await (await hook(makeEvent("invoice.payment_failed", invoiceFor("sub_pf1"), { created: t }))).json()).result).toBe("applied");
    expect(await state(u.id)).toBe("plus_active"); // dentro de los 3 días de gracia

    h.stripe.subscriptions.retrieve.mockResolvedValue(makeSub({ id: "sub_pf1", customer: "cus_pf1", user: u.id, status: "past_due", start: t - 5 * DAY, end: t + 25 * DAY }));
    await hook(makeEvent("invoice.payment_failed", invoiceFor("sub_pf1"), { created: t + 1 }));
    expect(await state(u.id)).toBe("free_under_limit"); // gracia agotada
  });

  it("cancel_at_period_end conserva el acceso hasta current_period_end", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_cp1");
    const t = nowS();
    const sub = makeSub({ id: "sub_cp1", customer: "cus_cp1", user: u.id, cancel: true, end: t + 10 * DAY });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    await hook(makeEvent("customer.subscription.updated", sub, { created: t }));
    expect(await state(u.id)).toBe("plus_canceled_pending");
    expect((await db.query<{ s: string }>(`SELECT public.fn_resolve_access_state('${u.id}', now() + interval '11 days') s`)).rows[0].s).toBe("free_under_limit");
  });

  it("customer.subscription.deleted retira Plus", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_del1");
    const t = nowS();
    const active = makeSub({ id: "sub_del1", customer: "cus_del1", user: u.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(active);
    await hook(makeEvent("customer.subscription.created", active, { created: t - 10 }));
    expect(await state(u.id)).toBe("plus_active");
    const gone = makeSub({ id: "sub_del1", customer: "cus_del1", user: u.id, status: "canceled" });
    h.stripe.subscriptions.retrieve.mockResolvedValue(gone);
    await hook(makeEvent("customer.subscription.deleted", gone, { created: t }));
    expect(await state(u.id)).toBe("free_under_limit");
  });

  it("suscripción eliminada en Stripe (retrieve 404): usa el objeto del evento", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_del2");
    const gone = makeSub({ id: "sub_del2", customer: "cus_del2", user: u.id, status: "canceled" });
    h.stripe.subscriptions.retrieve.mockRejectedValue(Object.assign(new Error("No such subscription"), { code: "resource_missing" }));
    const res = await hook(makeEvent("customer.subscription.deleted", gone));
    expect(res.status).toBe(200);
    expect(await state(u.id)).toBe("free_under_limit");
  });

  it("fallo al procesar -> 500 (Stripe reintenta), se anota y NO se revoca el acceso existente", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_fail1");
    const t = nowS();
    const sub = makeSub({ id: "sub_fail1", customer: "cus_fail1", user: u.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    await hook(makeEvent("customer.subscription.created", sub, { created: t - 10 }));
    expect(await state(u.id)).toBe("plus_active");

    h.stripe.subscriptions.retrieve.mockRejectedValue(Object.assign(new Error("stripe down"), { code: "api_connection_error" }));
    const res = await hook(makeEvent("customer.subscription.updated", sub, { created: t, id: "evt_failing1" }));
    expect(res.status).toBe(500);
    expect(await state(u.id)).toBe("plus_active");
    expect(await rows(`SELECT status FROM stripe_webhook_events WHERE stripe_event_id='evt_failing1'`)).toEqual([{ status: "failed" }]);

    // Stripe reintenta el mismo evento y ahora se procesa.
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    const retry = await hook(makeEvent("customer.subscription.updated", sub, { created: t, id: "evt_failing1" }));
    expect(retry.status).toBe(200);
    expect(await rows(`SELECT status, attempts FROM stripe_webhook_events WHERE stripe_event_id='evt_failing1'`)).toEqual([{ status: "processed", attempts: 2 }]);
  });

  it("suscripción cuyo metadata apunta a otro usuario que el dueño del customer -> no concede nada a nadie", async () => {
    const owner = await newUser();
    const other = await newUser();
    await endTrial(owner.id);
    await endTrial(other.id);
    await link(owner, "cus_mix1");
    const sub = makeSub({ id: "sub_mix1", customer: "cus_mix1", user: other.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
    const res = await (await hook(makeEvent("customer.subscription.created", sub))).json();
    expect(res.result).toBe("ignored");
    expect(await state(owner.id)).toBe("free_under_limit");
    expect(await state(other.id)).toBe("free_under_limit");
  });

  it("suscripción ajena ya registrada para otro usuario no cambia de propietario", async () => {
    const a = await newUser();
    const b = await newUser();
    await endTrial(a.id);
    await endTrial(b.id);
    await link(a, "cus_own_a");
    await link(b, "cus_own_b");
    const t = nowS();
    const subA = makeSub({ id: "sub_shared1", customer: "cus_own_a", user: a.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(subA);
    await hook(makeEvent("customer.subscription.created", subA, { created: t - 5 }));
    // Evento "para B" que reutiliza el id de la suscripción de A.
    const forged = makeSub({ id: "sub_shared1", customer: "cus_own_b", user: b.id });
    h.stripe.subscriptions.retrieve.mockResolvedValue(forged);
    const res = await (await hook(makeEvent("customer.subscription.updated", forged, { created: t }))).json();
    expect(res).toMatchObject({ result: "ignored", reason: "subscription_belongs_to_other_user" });
    expect(await state(a.id)).toBe("plus_active");
    expect(await state(b.id)).toBe("free_under_limit");
  });

  it("suscripciones que no son Plus (otro precio, varios items) o eventos irrelevantes se ignoran", async () => {
    const u = await newUser();
    await endTrial(u.id);
    await link(u, "cus_np1");
    for (const sub of [makeSub({ id: "sub_np1", customer: "cus_np1", user: u.id, price: "price_pack_other" }), makeSub({ id: "sub_np2", customer: "cus_np1", user: u.id, items: 2 })]) {
      h.stripe.subscriptions.retrieve.mockResolvedValue(sub);
      expect((await (await hook(makeEvent("customer.subscription.created", sub))).json()).reason).toBe("not_plus_subscription");
    }
    expect((await (await hook(makeEvent("charge.refunded", {}))).json()).result).toBe("ignored");
    expect((await (await hook(makeEvent("invoice.paid", { parent: null }))).json()).reason).toBe("invoice_without_subscription");
    expect(await state(u.id)).toBe("free_under_limit");
  });

  it("evento de otro entorno (live con clave test) se ignora", async () => {
    const u = await newUser();
    const sub = makeSub({ id: "sub_live1", customer: "cus_live1", user: u.id });
    const res = await (await hook(makeEvent("customer.subscription.created", sub, { livemode: true }))).json();
    expect(res.reason).toBe("environment_mismatch");
    expect(h.stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("el pack Excel/PDF (checkout mode=payment) que llegue a este endpoint se ignora", async () => {
    const u = await newUser();
    const ev = makeEvent("checkout.session.completed", { mode: "payment", payment_status: "paid", client_reference_id: u.id, metadata: { user_id: u.id }, customer: "cus_pack1" });
    expect((await (await hook(ev)).json()).reason).toBe("not_subscription_session");
    expect(await rows(`SELECT 1 FROM billing_customers WHERE stripe_customer_id='cus_pack1'`)).toHaveLength(0);
  });
});
