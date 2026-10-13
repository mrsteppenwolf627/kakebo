import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";
import { isLiveStripeKey } from "@/lib/stripe/plus";
import { handlePlusEvent, PLUS_EVENT_TYPES } from "@/lib/stripe/plus-webhook";
import { apiLogger } from "@/lib/logger";

/**
 * Webhook de SUSCRIPCIONES Plus. Endpoint independiente del webhook del pack Excel/PDF
 * (/api/webhooks/stripe, STRIPE_WEBHOOK_SECRET): usa su propio secreto STRIPE_SUBSCRIPTION_WEBHOOK_SECRET.
 *
 * Orden: interruptor -> secreto/firma presentes -> VERIFICAR FIRMA sobre el cuerpo en bruto -> entorno (live/test)
 * -> tipo de evento -> procesar. Un fallo al procesar devuelve 500 para que Stripe reintente y se anota con
 * fn_record_webhook_failure; nunca se revoca acceso por un fallo aislado. Nunca se registra el cuerpo, la firma,
 * el secreto ni datos del cliente.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request: Request) {
  if (!isPlusSubscriptionsEnabled()) return reply(503, { received: false, code: "plus_subscriptions_disabled" });

  const secret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
  if (!secret) return reply(503, { received: false, code: "webhook_not_configured" });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return reply(400, { received: false, code: "missing_signature" });

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return reply(400, { received: false, code: "invalid_signature" });
  }

  // Un evento de otro entorno (live vs test) no debe tocar este despliegue.
  if (event.livemode !== isLiveStripeKey()) return reply(200, { received: true, result: "ignored", reason: "environment_mismatch" });
  if (!PLUS_EVENT_TYPES.has(event.type)) return reply(200, { received: true, result: "ignored" });

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
    const outcome = await handlePlusEvent(admin, event);
    return reply(200, { received: true, ...outcome });
  } catch (error) {
    apiLogger.error({ eventId: event.id, eventType: event.type, err: (error as Error).name }, "plus subscription webhook failed");
    try {
      if (admin) {
        await admin.rpc("fn_record_webhook_failure", {
          p_event_id: event.id,
          p_event_type: event.type,
          p_livemode: event.livemode,
          p_error: (error as Error).message?.slice(0, 200) ?? "error",
        });
      }
    } catch {
      /* anotar el fallo es best-effort */
    }
    return reply(500, { received: false, code: "processing_failed" });
  }
}
