import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrors, errorResponse, handleApiError, requireAuth, responses, withLogging } from "@/lib/api";
import { getStripe } from "@/lib/stripe/server";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";
import {
  applySubscription,
  getBillingCustomerId,
  getPlusPriceIds,
  idOf,
  normalizeSubscription,
  syncEventId,
} from "@/lib/stripe/plus";

/**
 * POST /api/stripe/sync — sincroniza la suscripción tras volver de Checkout.
 *
 * Volver de Stripe NO concede nada: el servidor recupera la sesión y la suscripción en Stripe y verifica que
 * pertenecen al usuario de la sesión (client_reference_id, metadata.user_id y customer de billing_customers) antes
 * de aplicar el estado con fn_apply_subscription_event. Cualquier discrepancia devuelve un 403 genérico que no
 * revela a quién pertenece la sesión.
 */
const bodySchema = z.object({ session_id: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/) }).strict();

export const dynamic = "force-dynamic";

export const POST = withLogging(async (request: NextRequest) => {
  if (!isPlusSubscriptionsEnabled()) {
    return errorResponse("PLUS_DISABLED", "Las suscripciones Plus no están disponibles todavía.", 503);
  }
  try {
    const user = await requireAuth();
    const input = bodySchema.parse(await request.json().catch(() => ({})));

    const admin = createAdminClient();
    const stripe = getStripe();

    const customerId = await getBillingCustomerId(admin, user.id);
    const deny = () => apiErrors.forbidden();
    if (!customerId) throw deny();

    const session = await stripe.checkout.sessions.retrieve(input.session_id);
    if (
      session.mode !== "subscription" ||
      session.client_reference_id !== user.id ||
      session.metadata?.user_id !== user.id ||
      idOf(session.customer as string | { id: string } | null) !== customerId
    ) {
      throw deny();
    }
    if (session.payment_status !== "paid") {
      throw apiErrors.conflict("El pago todavía no se ha completado.");
    }

    const subscriptionId = idOf(session.subscription as string | { id: string } | null);
    if (!subscriptionId) throw apiErrors.conflict("La suscripción todavía no está disponible.");

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (idOf(sub.customer as string | { id: string }) !== customerId || sub.metadata?.user_id !== user.id) throw deny();

    const normalized = normalizeSubscription(sub, getPlusPriceIds());
    if (!normalized) throw deny();

    const result = await applySubscription(admin, {
      eventId: syncEventId(normalized),
      eventType: "kakebo.checkout.sync",
      livemode: Boolean(session.livemode),
      createdAt: new Date(),
      userId: user.id,
      subscription: normalized,
    });
    if (result.result === "ignored") throw deny();

    // Estado final tal y como lo ve el propio usuario (fn_my_access sobre su sesión).
    const supabase = await createClient();
    const { data: access } = await supabase.rpc("fn_my_access");
    return responses.ok({ synced: true, applied: result.applied, access: (access as { state?: string } | null)?.state ?? null });
  } catch (error) {
    return handleApiError(error);
  }
});
