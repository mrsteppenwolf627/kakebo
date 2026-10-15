import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrors, errorResponse, handleApiError, requireAuth, responses, withLogging } from "@/lib/api";
import { getStripe } from "@/lib/stripe/server";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";
import { appUrl, getBillingCustomerId, getPlusPriceIds, getSiteUrl, isLiveStripeKey } from "@/lib/stripe/plus";

/**
 * POST /api/stripe/checkout — inicia el Checkout de Kakebo Plus (suscripción).
 *
 * El navegador SOLO elige el intervalo ("month" | "year") y, opcionalmente, el idioma. El precio, el customer y el
 * usuario se resuelven en el servidor; cualquier otra clave del cuerpo (price_id, user_id, customer_id...) se rechaza.
 * Esta ruta NO concede acceso: el acceso lo decide el webhook / sync tras verificar la suscripción en Stripe.
 * No usa trial de Stripe ni de Kakebo: las cuentas nuevas empiezan en la capa gratuita y Plus se activa al pagar.
 */
const bodySchema = z
  .object({
    interval: z.enum(["month", "year"]),
    locale: z.enum(["es", "en"]).default("es"),
  })
  .strict();

export const dynamic = "force-dynamic";

export const POST = withLogging(async (request: NextRequest) => {
  if (!isPlusSubscriptionsEnabled()) {
    return errorResponse("PLUS_DISABLED", "Las suscripciones Plus no están disponibles todavía.", 503);
  }
  try {
    const user = await requireAuth();
    const input = bodySchema.parse(await request.json().catch(() => ({})));

    const prices = getPlusPriceIds();
    const site = getSiteUrl();
    const stripe = getStripe();
    const admin = createAdminClient();

    // Ya suscrito (o en gracia): se gestiona desde el portal, no se crea una segunda suscripción.
    const { data: subs, error: subsError } = await admin
      .from("subscriptions")
      .select("status,current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"]);
    if (subsError) throw new Error("subscriptions lookup failed");
    const now = Date.now();
    if ((subs ?? []).some((s: { current_period_end: string }) => new Date(s.current_period_end).getTime() > now)) {
      throw apiErrors.conflict("Ya tienes una suscripción Plus. Gestiónala desde el portal de facturación.");
    }

    // Customer: billing_customers es la fuente de verdad (1:1 con el usuario).
    let customerId = await getBillingCustomerId(admin, user.id);
    if (!customerId) {
      const created = await stripe.customers.create(
        { email: user.email, metadata: { user_id: user.id } },
        { idempotencyKey: `kakebo-plus-customer-${user.id}` },
      );
      const { error: insertError } = await admin
        .from("billing_customers")
        .insert({ user_id: user.id, stripe_customer_id: created.id, livemode: isLiveStripeKey() });
      if (insertError && (insertError as { code?: string }).code !== "23505") throw new Error("billing_customers insert failed");
      customerId = await getBillingCustomerId(admin, user.id); // si hubo carrera, gana el ya guardado
      if (!customerId) throw new Error("billing customer missing after insert");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: prices[input.interval], quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan_interval: input.interval },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${appUrl(site, input.locale, "/app/subscription")}?plus=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl(site, input.locale, "/app/subscription")}?plus=cancelled`,
      locale: input.locale,
    });

    if (!session.url) throw new Error("checkout session without url");
    return responses.ok({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
});
