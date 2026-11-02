# Premium commerce: preparación técnica (Kakebo Master System)

> Producto único: **`kakebo-master-system-pack`** (una compra → tres archivos). Pack **Kakebo Master System**: plantilla Excel premium + ebook «El arte de mirar tu dinero» (unas 20 páginas) + tutorial PDF.
> Condiciones acordadas: **9,90 € IVA incluido, compra única, acceso permanente, sin registro del comprador.** Independiente de la aplicación: comprar el pack no concede IA, informes de la app, Plus ni suscripciones (ADR-004).

Estado: **preparado, desconectado**. No hay Stripe, ni compra, ni descarga premium.

## Estado actual de Stripe en el repo (no modificado)
- `src/app/api/stripe/checkout|cancel|portal/route.ts`: stubs que devuelven **410** ("Stripe payments have been removed").
- `src/app/api/webhooks/stripe/route.ts`: stub que devuelve **200** vacío.
- `src/lib/stripe/server.ts`: `export const stripe = null`.
- `.env.local` define `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` y `STRIPE_SECRET_KEY` (no usadas por el código actual).
- `docs/planning/fase-3-monetizacion.md` describe un modelo de suscripción distinto (no es esta venta de pago único).

## Flag
`PREMIUM_COMMERCE_ENABLED` (solo servidor, convención `=== "true"`; ausente = desactivado).

| Flag | Landing | `POST /api/premium/checkout` | `GET /api/premium/download` |
|---|---|---|---|
| `false`/ausente | CTA "Próximamente" inerte | 503 `premium_commerce_disabled` | 503 `premium_commerce_disabled` |
| `true` | CTA "Comprar" → llama al checkout | 501 `stripe_not_configured` | 403 `entitlement_not_verified` |

Ninguna ruta llama a Stripe, crea registros ni sirve archivos.

## Archivos
- `src/lib/premium/config.ts`: flag y carpeta privada local.
- `src/app/api/premium/checkout/route.ts`, `src/app/api/premium/download/route.ts`: rutas preparadas (con TODOs).
- `src/components/premium/PremiumPurchaseButton.tsx`: CTA accesible (`aria-disabled`, enfocable, sin `href`).
- `private/premium/`: carpeta local fuera de `public/`; contenido ignorado por git. Solo provisional: destino final = almacenamiento privado (p. ej. Supabase Storage privado).

## Pendientes para conectar Stripe
1. Producto y Price ID en Stripe (`STRIPE_PREMIUM_PRICE_ID`), claves y `STRIPE_WEBHOOK_SECRET` en entorno.
2. Checkout Session (`mode: payment`) con `metadata` (producto + `user_id`/email), `success_url` y `cancel_url` localizadas.
3. Webhook firmado `checkout.session.completed` (idempotente) que escriba la compra/entitlement.
4. Tabla de compras/entitlements en Supabase (+ RLS) y verificación en servidor.
5. Subir Excel y PDF a bucket privado; descarga por token temporal / URL firmada con caducidad y límite de descargas.
6. Eventos: `checkout_started` (cliente, justo antes de redirigir), `purchase` (tras confirmación de pago, en la página de éxito), `digital_product_downloaded` (tras entrega autorizada). Hoy **no** se emiten.
7. Textos legales/condiciones de venta, IVA, factura. (La landing ya es pública e indexable y está en el sitemap; al abrir la compra, añadir `Offer` con disponibilidad real al schema y sustituir "Próximamente".)

## Pack de producto (manifiesto)
`src/lib/premium/manifest.ts` es la única fuente de rutas. Bucket privado de Supabase Storage: **`kakebo-premium`** (proyecto `fajqfjouqauyfiajfonf`, `public = false`). Comprobado en Supabase: los tres objetos existen con el MIME y el tamaño del manifiesto.

| id (`?file=`) | Storage key exacta | MIME | Tamaño |
|---|---|---|---|
| `excel` | `kakebo-master-system-pack/Kakebo_Master_System_v6.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 8.781.203 B |
| `tutorial` | `kakebo-master-system-pack/Kakebo_Master_System_Tutorial.pdf` | `application/pdf` | 3.437.085 B |
| `ebook` | `kakebo-master-system-pack/ebook-kakebo-master-system.pdf` | `application/pdf` | 4.237.502 B |

Copia local de preparación (git-ignorada, fuera de `public/`, nunca servida): `private/premium/kakebo-master-system-pack/` con nombres locales distintos (`localFileName` en el manifiesto).

## Descarga protegida (`GET /api/premium/download?file=excel|tutorial|ebook`)
Orden fail-closed:
1. `PREMIUM_COMMERCE_ENABLED` exactamente `"true"`; si no, **503**.
2. `verifyPackEntitlement()` concede; si no, **403** (hoy siempre deniega: no hay compras ni Stripe).
3. `file` validado contra el manifiesto (allowlist); si no, **400**.
4. Solo entonces `createSignedUrl()` (600 s, `download` = nombre de descarga) y **302** a esa URL, con `Cache-Control: no-store`. Sin streaming desde Vercel (el Excel pesa 8,4 MB).

La URL firmada nunca se registra, ni se renderiza, ni se devuelve antes de los pasos 1–3. Los errores devuelven 503 genérico (sin claves, rutas ni URLs). Parámetros como `?paid=true` o `?token=x` se ignoran.

## Capa de entrega (`src/lib/premium/delivery.ts`, solo servidor)
1. `verifyPackEntitlement(packId)`: hoy siempre `granted: false`. Después de Stripe: token de acceso de invitado (sin cuenta) ligado a una compra `paid` escrita solo por el webhook firmado (`metadata.product = kakebo-master-system-pack`); una compra concede los tres archivos con acceso permanente (ver "Compra de invitado" más abajo).
2. `getPremiumStorage().createDownloadGrant(file, { expiresInSeconds })`: **conectado** a Supabase Storage (cliente de servicio existente `src/lib/supabase/admin.ts`), pero inalcanzable sin entitlement. Solo firma entradas del manifiesto; TTL máximo 600 s.
3. `recordPackDownload(...)`: no-op. Después: una fila por archivo, límite de descargas por compra y evento `digital_product_downloaded`.

## Variables de entorno (solo nombres; no hay `.env.example` porque `.gitignore` ignora `.env*`)
| Variable | Dónde | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | local y Vercel | URL del proyecto (pública por diseño; es la que ya usa el proyecto). |
| `SUPABASE_SERVICE_ROLE_KEY` | local y **Vercel (necesaria en el despliegue)** | Solo servidor. Nunca con prefijo `NEXT_PUBLIC_`. Ya la usan `/api/admin/*` y los embeddings. |
| `PREMIUM_COMMERCE_ENABLED` | local y Vercel | Solo `"true"` activa; ausente = desactivado. |

Antes de activar el flag en producción confirmar que `SUPABASE_SERVICE_ROLE_KEY` está definida en Vercel (Production/Preview) y que el bucket sigue privado.

## Landing pública (estado en la rama `feat/premium-pack-landing`, no publicada)
`/herramientas/plantilla-kakebo-excel-premium` (ES/EN): pública, indexable (sin `noindex`; la indexación la gobierna el layout y solo se activa en el dominio de producción) y en el sitemap.
Presenta las tres piezas, 9,90 € IVA incluido, compra única, acceso permanente y sin cuenta, y avisa de que **la compra aún no está disponible** (CTA inactivo). El schema (`Product`, `FAQPage`,
`BreadcrumbList`) **no declara oferta, precio ni disponibilidad** mientras no se pueda comprar. Enlazado interno: desde la plantilla gratuita (`PremiumCTA` tras su descarga + enlace en el cuerpo, ES/EN),
desde el hub `/herramientas` y de vuelta hacia ambos.

## Compra de invitado con acceso permanente (DISEÑO PENDIENTE — no implementado, no conectado a Stripe)
Requisito: comprar **sin crear cuenta** y poder volver a los archivos **siempre**, sin conceder nada de la aplicación. La entrega actual (`delivery.ts`) está preparada para firmar URLs de 600 s, pero
`verifyPackEntitlement` aún no existe. Diseño propuesto para cuando se conecte Stripe:
1. **Pago de invitado** con Stripe Checkout (recoge el email). El webhook firmado `checkout.session.completed` (idempotente) crea una **compra** (`status = paid`, `product = kakebo-master-system-pack`, email, id de sesión).
2. **Credencial de acceso sin cuenta**: token aleatorio largo (se guarda solo su hash) ligado a la compra, **sin caducidad** (acceso permanente), revocable (reembolso/abuso). Se entrega por email y en la página de éxito.
3. **Página privada de descarga** (`noindex`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`) que lista los tres archivos por separado. Cada botón pide la descarga al servidor, que verifica el token **en servidor** (nunca por parámetros como `?paid=true`), firma la URL de 600 s y registra la descarga.
4. **Recuperación**: "Reenviar mi enlace" por email (rate-limited) emite un token nuevo y puede invalidar el anterior. Es lo que da el acceso permanente sin registro.
5. **Separación de la app**: la compra del pack **no** toca `profiles`, `access_grants`, `plus_access_until` ni `subscriptions`; el entitlement del pack vive en su propia tabla.
6. Pendiente: tablas y RLS (solo `service_role`), límites de descarga y antiabuso, textos legales (desistimiento de contenido digital, IVA, factura) y eventos `purchase`/`digital_product_downloaded`.
