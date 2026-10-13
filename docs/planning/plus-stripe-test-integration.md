# Kakebo Plus — integración Stripe TEST (Bloque 3)

Estado: implementada y probada con Stripe TEST simulado y SQL real (PGlite). **Sin desplegar. `PLUS_SUBSCRIPTIONS_ENABLED` apagado por defecto.**

## Recursos en Stripe TEST (cuenta sandbox `acct_1UNsUn3o8LT24HJF`)

| Recurso | ID | Notas |
|---|---|---|
| Producto Kakebo Plus | `prod_VQxgrVRAVf5P2G` | metadata `kakebo_product=plus` |
| Precio mensual | `price_1UQ5lF3o8LT24HJFD2rLCTB3` | 3,99 EUR / mes, `lookup_key=kakebo_plus_monthly`, IVA incluido |
| Precio anual | `price_1UQ5lF3o8LT24HJF8eVCU63w` | 39,90 EUR / año, `lookup_key=kakebo_plus_annual`, IVA incluido |
| Configuración del portal | `bpc_1UQ5mK3o8LT24HJFJNE5PQjk` | método de pago, cancelar al final del periodo, cambio mensual/anual (prorrateo), facturas |

Los IDs de producto/precio no son secretos. Los de **producción (LIVE) se crearán más adelante**, en una fase aparte y con autorización.

### Ajuste de configuración del portal (Bloque 5)

La validación real contra Stripe TEST detectó que la configuración del portal (`bpc_1UQ5mK3o8LT24HJFJNE5PQjk`) permitía **cambiar la cantidad** de la suscripción (`adjustable_quantity.enabled = true`, sin máximo), es decir, comprar varias unidades de Plus. Se ha desactivado: ahora el portal solo permite cambiar entre los dos precios Plus (mensual y anual) del producto Kakebo Plus, con prorrateo, además de actualizar el método de pago, cancelar al final del periodo y ver facturas. El E2E real lo comprueba (`adjustable_quantity.enabled === false`). Al crear la configuración LIVE hay que aplicar el mismo ajuste.

## Variables de entorno (solo nombres; nunca valores en Git)

| Variable | Uso |
|---|---|
| `PLUS_SUBSCRIPTIONS_ENABLED` | Solo el valor exacto `"true"` activa restricciones y rutas de facturación. Por defecto apagada. |
| `STRIPE_SECRET_KEY` | Clave **TEST** (`sk_test_…`) en staging/desarrollo. |
| `STRIPE_PLUS_PRICE_MONTHLY_ID` | `price_…` mensual. |
| `STRIPE_PLUS_PRICE_ANNUAL_ID` | `price_…` anual. |
| `STRIPE_PLUS_PORTAL_CONFIGURATION_ID` | Opcional: `bpc_…` de la configuración del portal. |
| `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` | `whsec_…` del endpoint `/api/webhooks/stripe-subscriptions` (distinto del del pack). |
| `NEXT_PUBLIC_SITE_URL` | Origen para URLs de retorno (https, o http en localhost). |
| `SUPABASE_SERVICE_ROLE_KEY` | Escrituras de facturación (service_role). |
| `CRON_SECRET` | Solo si se implementa la reconciliación programada (no incluida en este bloque). |

El webhook del pack Excel/PDF sigue usando `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID` y `PREMIUM_COMMERCE_ENABLED`; no se ha modificado.

## Rutas

- `POST /api/stripe/checkout` — sesión obligatoria; cuerpo estricto `{ interval: "month"|"year", locale?: "es"|"en" }`. Precio resuelto en servidor, customer desde `billing_customers`, `client_reference_id` y `metadata.user_id`. Sin trial de Stripe (el trial de 14 días es interno: si paga durante él se cobra de inmediato). **No concede acceso.** 409 si ya hay una suscripción vigente.
- `POST /api/stripe/portal` — sesión obligatoria; customer siempre desde `billing_customers`; no exige estar en estado Plus (para poder arreglar un pago fallido).
- `POST /api/stripe/sync` — `{ session_id }`; recupera sesión y suscripción en Stripe, verifica `client_reference_id`, `metadata.user_id` y customer del propio usuario y aplica con `fn_apply_subscription_event`. Cualquier discrepancia → 403 genérico.
- `POST /api/webhooks/stripe-subscriptions` — firma verificada antes de leer el evento; entorno live/test comprobado; 500 ante fallos (Stripe reintenta); fallos anotados con `fn_record_webhook_failure`.
- `/api/stripe/cancel` sigue siendo el stub 410 (la cancelación se hace en el portal).

## Eventos

`checkout.session.completed` (solo vincula customer↔usuario, no concede acceso), `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`. La suscripción se recupera en Stripe y se normaliza; solo se aceptan suscripciones con un único item cuyo precio sea el mensual o el anual de Plus.

## Pruebas E2E reales (opt-in)

`src/__tests__/e2e/plus-stripe-real.e2e.test.ts` valida contra Stripe TEST real (clientes con test clocks, suscripciones, eventos, portal y Checkout) usando el código real de las rutas y las migraciones reales sobre una base PGlite. No corre en `npm test` (11 pruebas omitidas); se ejecuta con `PLUS_E2E_STRIPE_TEST=1` y `STRIPE_SECRET_KEY` de TEST (aborta con cualquier otra clave). Limpia los test clocks y los clientes que crea. No usa Supabase staging/producción ni Vercel. Limitación: los eventos reales se re-firman en local; no prueba la entrega HTTP de Stripe, la página de Checkout con tarjeta ni la interfaz en navegador.

## Pendiente antes de producción

1. Registrar el endpoint de suscripciones en Stripe (TEST primero) y guardar su `whsec_` solo en variables de entorno.
2. Aplicar las migraciones Plus en producción (solo con autorización) y la política de activación de `legacy_full`.
3. Crear producto/precios/portal LIVE y sus variables.
4. Reconciliación periódica (cron) y UI (Bloque 4).
