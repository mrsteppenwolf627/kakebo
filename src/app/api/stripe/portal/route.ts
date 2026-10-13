import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrors, errorResponse, handleApiError, requireAuth, responses, withLogging } from "@/lib/api";
import { getStripe } from "@/lib/stripe/server";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";
import { getBillingCustomerId, getSiteUrl } from "@/lib/stripe/plus";

/**
 * POST /api/stripe/portal — abre el Customer Portal de Stripe del PROPIO usuario.
 *
 * El customer sale siempre de billing_customers (clave: el usuario de la sesión); el cuerpo solo puede llevar
 * `locale`. No se exige estar en un estado Plus: quien tiene un pago fallido o una suscripción caducada debe poder
 * actualizar su método de pago. La configuración del portal (método de pago, cancelar al final del periodo, cambio
 * mensual/anual, facturas) vive en Stripe y se selecciona con STRIPE_PLUS_PORTAL_CONFIGURATION_ID.
 */
const bodySchema = z.object({ locale: z.enum(["es", "en"]).default("es") }).strict();

export const dynamic = "force-dynamic";

export const POST = withLogging(async (request: NextRequest) => {
  if (!isPlusSubscriptionsEnabled()) {
    return errorResponse("PLUS_DISABLED", "Las suscripciones Plus no están disponibles todavía.", 503);
  }
  try {
    const user = await requireAuth();
    const input = bodySchema.parse(await request.json().catch(() => ({})));

    const admin = createAdminClient();
    const customerId = await getBillingCustomerId(admin, user.id);
    if (!customerId) throw apiErrors.notFound("Cuenta de facturación");

    const configuration = process.env.STRIPE_PLUS_PORTAL_CONFIGURATION_ID;
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl()}/${input.locale}/settings`,
      ...(configuration ? { configuration } : {}),
    });
    return responses.ok({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
});
