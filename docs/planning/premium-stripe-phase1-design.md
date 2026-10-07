# Premium pack: Stripe fase 1 (TEST + Supabase staging)

Alcance: conectar Stripe **TEST** para `kakebo-master-system-pack` (9,90 € IVA incluido, pago único, compra sin cuenta). Sin LIVE, sin producción.

## Auditoría previa (estado antes de esta fase)
| Necesidad | Estado previo |
|---|---|
| Checkout Session | No existía (`POST /api/premium/checkout` devolvía 501). |
| Validar webhook | No existía (`/api/webhooks/stripe` era un stub 200 vacío). |
| Idempotencia | No existía (`stripe_webhook_events` es del modelo de suscripción). |
| Registro de compra | No existía. |
| Entitlement permanente | `verifyPackEntitlement` denegaba siempre. |
| Entrega desde Storage privado | Existía (`createSignedUrl`, 600 s, allowlist del manifiesto). |
| Bloqueo sin entitlement | Existía (403). |
| Reembolso / cancelación | No existía. |
| SDK de Stripe | No instalado (añadido `stripe`). |

## Diseño
- **Tablas** (migración `20261007000001_premium_pack_purchases.sql` (+ `...02_service_role_grants`, `...03_single_use_claim`, `...04_download_dedupe`, en ese orden)): `premium_purchases`, `premium_access_tokens`, `premium_webhook_events`, `premium_downloads`. Sin FK a `auth.users`; no tocan `profiles`, `subscriptions`, `access_grants` ni Plus.
- **RLS**: activada en las cuatro, **sin políticas** (deny-all para `anon`/`authenticated`) y `revoke all`. Solo el service role, desde rutas de servidor.
- **Relación**: `stripe_session_id` (único) identifica la compra; `stripe_payment_intent_id` (único) permite localizarla en reembolsos/disputas. 1 sesión = 1 compra = N tokens.
- **Compra**: la crea solo el webhook firmado, con `payment_status = paid`, `mode = payment`, `metadata.product_key = kakebo-master-system-pack`, un único line item con `price.id = STRIPE_PREMIUM_PRICE_ID`, `EUR` y `amount_total = 990`. Nada procede del navegador.
- **Acceso sin cuenta (claim de un solo uso)**: `GET /api/premium/claim?session_id=cs_...` (destino del `success_url`) llama a la función SQL `claim_premium_purchase`, que bloquea la fila (`for update`), exige compra `paid` y `claimed_at is null`, crea el token (solo su SHA-256) y marca `claimed_at` en la misma transacción. Un segundo intento, simultáneo o posterior, devuelve `already_claimed` y no crea tokens. Tras el claim se redirige a una URL limpia (sin `session_id`) con `Cache-Control: no-store` y `Referrer-Policy: no-referrer`; el token viaja solo como cookie `HttpOnly; SameSite=Lax; path=/api/premium` (1 año). La descarga lee solo esa cookie.
- **Webhooks repetidos**: se comprueba `premium_webhook_events.stripe_event_id` (PK); además el alta de compra es `upsert` por `stripe_session_id`. Reentrega = 200 sin efectos. El evento se registra tras procesarlo, así un fallo parcial se reintenta.
- **Reembolsos/disputas**: `charge.refunded` y `charge.dispute.created` localizan la compra por `payment_intent`, ponen `status` (`refunded`/`disputed`), `revoked_at` y revocan todos sus tokens. El entitlement exige compra `paid` y token no revocado.
- **Pagos cancelados/rechazados**: no generan compra (no hay `checkout.session.completed` pagado). `checkout.session.expired` y `async_payment_failed` se ignoran.
- **Recuperación de acceso**: **no existe todavía.** Si se pierde la cookie, el `session_id` ya no sirve (un solo uso). Hace falta la fase posterior de recuperación por email (proveedor de email, enlace de un solo uso con caducidad corta, rate limit). Hasta entonces, la única vía es soporte manual.
- **Logs**: el código de aplicación no registra `session_id`, tokens, cookies ni URLs firmadas (test automático). Los logs de acceso del framework/plataforma pueden registrar la ruta de la petición; por eso el id es de un solo uso. Endurecimiento futuro posible: `success_url` con el id en el fragmento (`#`) y canje por POST desde una página cliente.
- **Variables** (solo nombres): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`, `PREMIUM_COMMERCE_ENABLED`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (opcional; base de las URLs de retorno, si no se usa el origen de la petición validado).

## Stripe TEST (no secreto)
- Producto: `prod_VOftXFe2zFYn9E` «Kakebo Master System», metadata `product_key=kakebo-master-system-pack`.
- Precio: `price_1UNsXe3o8LT24HJF3QWfM0SF`, 9,90 EUR, pago único. `tax_behavior` sin especificar (Stripe Tax no está configurado en la cuenta: no se inventa configuración fiscal; pendiente del titular decidir "IVA incluido").

## Rollback de la migración (manual)
`drop table premium_downloads, premium_access_tokens, premium_webhook_events, premium_purchases;`

## Fiscalidad (Stripe TEST) — estado verificado
- Precio `price_1UNsXe3o8LT24HJF3QWfM0SF`: `tax_behavior = inclusive` (fijado en TEST; no se puede cambiar una vez fijado). Checkout TEST: `amount_subtotal = amount_total = 990`, `amount_tax = 0`, `automatic_tax = false`: no se añade IVA por encima de 9,90 €.
- **Stripe Tax NO está operativo**: estado `pending`, falta `head_office` (dirección del negocio) y registros fiscales; sin ello Stripe no desglosa el IVA en recibos/facturas. Pendiente del titular.
- La landing **no** dice "IVA incluido" hasta que el titular/asesor valide el tratamiento (IVA, facturación, desistimiento de contenido digital). No es una afirmación de cumplimiento fiscal.
- El webhook rechaza (sin crear compra) cualquier sesión cuyo total no sea exactamente 990 EUR, por lo que un IVA añadido por encima no concede acceso.

## Registro de descargas (`premium_downloads`)
- Una fila por descarga GET autorizada y entregada (302 emitido). HEAD, 403, 400 y errores de firma no registran.
- Idempotente por `(purchase_id, file_id, request_bucket)` con cubos de 10 s (`insert ... on conflict do nothing`): un reintento técnico de la misma petición no suma filas; una descarga posterior distinta sí.
- Causa de las 24 filas de la prueba anterior: el handler llamaba dos veces a `recordPackDownload` (línea duplicada por una edición mía); cada petición escribía 2 filas (demostrado: 1 `curl` GET = 2 filas). Corregido.
- Solo se guardan `purchase_id`, `file_id`, `request_bucket`, `created_at`: ni token, ni cookie, ni URL.

## Stripe LIVE (cuenta `metodokakebo`) — producto creado, checkout NO activado (2026-10-07)
- Producto LIVE `prod_VOizodYg8Vh9io` «Kakebo Master System», metadata `product_key=kakebo-master-system-pack`, descriptor `METODO KAKEBO` (abreviado de cuenta `KAKEBO`).
- Precio LIVE `price_1UNvXR456JxkGTkVw4vJyAiq`: 9,90 EUR, pago único, `tax_behavior = inclusive`. Distinto del Price ID TEST. No se copió nada del entorno TEST.
- **Categoría fiscal provisional**: «Software descargable - para uso personal» (`txcd_10202000`), la opción disponible más cercana a plantilla Excel + PDF; **no está validada por un asesor** (los ebooks pueden tener un IVA distinto en España). Debe revisarse antes de vender.
- **No hay registro fiscal activo** en Stripe Tax (Tax → Ubicaciones vacío). La sede central es la que ya constaba en la cuenta. Sin registro, Stripe no calcula ni desglosa IVA: la vista previa muestra «IVA 21 % (incluido) 0,00 €» y total 9,90 €. El cobro sería de 9,90 € sin IVA añadido por encima, pero sin desglose de IVA en recibos/facturas hasta que se registre.
- Sin webhook LIVE, sin variables en Vercel Production, checkout de la web sin activar, sin cobros.
