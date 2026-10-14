# Kakebo Plus — Preview/staging para la prueba real con Stripe TEST (Bloque 6A)

Objetivo: que el propietario pueda probar **desde el navegador** la suscripción Plus completa (Stripe **TEST** + Supabase **staging**), sin tocar producción.

> **Reglas de esta prueba**
> - Solo Stripe **TEST** (`sk_test_…`). Nunca claves LIVE.
> - Solo Supabase **staging** `gqnsanzsdnbufwicjtiw`. Nunca `fajqfjouqauyfiajfonf` (producción).
> - Las variables van **solo** en el entorno **Preview** de Vercel (limitadas a la rama), jamás en Production y jamás en archivos del repositorio.
> - Este documento solo contiene **nombres** de variables, nunca valores. No pegues valores en chats, issues ni commits.
> - No se toca el webhook del pack Excel/PDF (`/api/webhooks/stripe`, `STRIPE_WEBHOOK_SECRET`).
> - No se activa el límite de 30 gastos ni `legacy_full`.

## 0. Estado (lo que ya está listo)

| Elemento | Estado |
|---|---|
| Código Plus (bloques 1–5) | En la rama `feat/plus-subscriptions-staging` (incluye `feat/plus-subscriptions-e2e-test`). |
| Migraciones Plus 1–6 | Aplicadas en **staging** (registro `20261013112936` … `20261013125438`). **No** en producción. |
| Stripe TEST | Producto `prod_VQxgrVRAVf5P2G`; precios `price_1UQ5lF3o8LT24HJFD2rLCTB3` (3,99 €/mes) y `price_1UQ5lF3o8LT24HJF8eVCU63w` (39,90 €/año); portal `bpc_1UQ5mK3o8LT24HJFJNE5PQjk` (sin cambio de cantidad). |
| Lógica contra Stripe TEST real | Validada (E2E opt-in, ver `plus-stripe-test-integration.md`). |
| Preview desplegada | **No**: requiere acceso a Vercel y a las claves, que debe poner el propietario. |
| Endpoint de webhook en Stripe | **No registrado** (necesita la URL de la Preview). |

## 1. Variables del entorno Preview

Vercel → proyecto `kakebo` → Settings → Environment Variables → *Add*. En **Environments** marca **solo Preview** y, en *Select a custom Git branch*, pon `feat/plus-subscriptions-staging`. **No marques Production.**

| Variable | Valor (de dónde sale) |
|---|---|
| `PLUS_SUBSCRIPTIONS_ENABLED` | `true` (exactamente) |
| `STRIPE_SECRET_KEY` | Clave secreta de **TEST** de la cuenta sandbox (`sk_test_…`): Stripe Dashboard (modo de prueba) → Developers → API keys |
| `STRIPE_PLUS_PRICE_MONTHLY_ID` | `price_1UQ5lF3o8LT24HJFD2rLCTB3` |
| `STRIPE_PLUS_PRICE_ANNUAL_ID` | `price_1UQ5lF3o8LT24HJF8eVCU63w` |
| `STRIPE_PLUS_PORTAL_CONFIGURATION_ID` | `bpc_1UQ5mK3o8LT24HJFJNE5PQjk` (opcional pero recomendado) |
| `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` | `whsec_…` del endpoint nuevo (paso 4). **Distinto** del `STRIPE_WEBHOOK_SECRET` del pack |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gqnsanzsdnbufwicjtiw.supabase.co` (staging; es público) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave **anon** del proyecto **kakebo-staging** (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **service_role** del proyecto **kakebo-staging** (misma pantalla). Secreta |
| `NEXT_PUBLIC_SITE_URL` | URL https estable de la Preview de esa rama (paso 2). **No** `metodokakebo.com` |
| `OPENAI_API_KEY` (y las demás que use la IA) | Solo si quieres probar el asistente IA/búsqueda de verdad; si ya existen en Preview se heredan |

Importante:
- Las variables `NEXT_PUBLIC_*` se incrustan **al construir**: tras añadirlas o cambiarlas hay que **redesplegar** la Preview.
- Si Preview ya tiene `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` apuntando a producción, la variable por rama **las sustituye** para esa rama; comprueba con el preflight (paso 3) que el resultado final es staging.

## 2. URL de la Preview y rutas de retorno

1. Tras hacer push de `feat/plus-subscriptions-staging` (o redesplegar), Vercel crea una Preview. Copia la **URL estable de la rama** (Deployments → la del dominio `…-git-feat-plus-subscriptions-staging-….vercel.app`; si Vercel la abrevia por longitud, usa la que muestre el panel).
2. Ponla en `NEXT_PUBLIC_SITE_URL` (sin barra final) y **redespliega**.
3. Con eso, el servidor construye:
   - Éxito de Checkout: `<SITE_URL>/app/subscription?plus=success&session_id={CHECKOUT_SESSION_ID}` (en inglés `<SITE_URL>/en/app/subscription…`)
   - Cancelación: `<SITE_URL>/app/subscription?plus=cancelled`
   - Retorno del portal: `<SITE_URL>/app/subscription`
4. **Supabase staging → Authentication → URL Configuration**: añade esa URL a *Site URL/Redirect URLs* (con `/**`) para que el inicio de sesión funcione en la Preview.
5. Usuario de prueba: regístrate en la Preview con un correo tuyo o crea uno en Supabase staging (Authentication → Users). Los usuarios nuevos empiezan con **trial de 14 días**.

## 3. Verificación local de entorno (sin imprimir secretos)

En tu terminal, exporta las mismas variables que pusiste en Preview (solo en esa sesión de terminal) y ejecuta:

```
node scripts/plus-staging-preflight.mjs            # formato y entorno: TEST vs LIVE, staging vs producción, dominio
node scripts/plus-staging-preflight.mjs --online   # además: la service role funciona en staging y los 2 precios son Kakebo Plus 3,99/39,90 en modo TEST
```

Solo imprime `OK`/`FALLO`, nunca valores. Debe terminar con «Todo correcto». Rechaza: claves LIVE, URL/anon/service role de producción, dominio de producción como `NEXT_PUBLIC_SITE_URL`, mismo secreto de webhook que el del pack.

## 4. Registrar el webhook en Stripe TEST

URL esperada: **`<SITE_URL>/api/webhooks/stripe-subscriptions`**

1. Stripe Dashboard en **modo de prueba** (sandbox `acct_1UNsUn3o8LT24HJF`) → Developers → Webhooks → *Add endpoint*.
2. *Endpoint URL*: la de arriba. **Escucha eventos de tu cuenta** (no de cuentas conectadas).
3. Eventos (exactamente estos 6):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. *Add endpoint* → *Signing secret* → *Reveal* → cópialo **directamente** a la variable `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` de Vercel (Preview, rama). No lo pegues en ningún chat. Redespliega.
5. **No reutilices ni edites** el endpoint del pack Excel/PDF; tiene su propio secreto.
6. **Vercel Deployment Protection**: una Preview protegida devuelve 401 a Stripe. Opciones:
   - *(Recomendada)* Settings → Deployment Protection → **Protection Bypass for Automation** → copia el secreto y registra el endpoint como `<SITE_URL>/api/webhooks/stripe-subscriptions?x-vercel-protection-bypass=<secreto>`. Ese secreto quedará guardado en la configuración del endpoint de Stripe TEST: trátalo como sensible y rótalo al terminar.
   - Alternativa: desactivar temporalmente *Vercel Authentication* para Previews (menos segura).

### Comprobar firma y entorno TEST

- `node scripts/plus-staging-preflight.mjs --probe <SITE_URL>` — comprueba que el endpoint desplegado responde **400 `missing_signature`** sin firma y **400 `invalid_signature`** con firma falsa (no modifica nada). `503` = falta el flag o el secreto en esa Preview; `401/403` = protección de Vercel bloqueando a Stripe.
- Stripe → el endpoint → *Send test webhook* con `customer.subscription.created`: debe responder **200** (se ignora porque no es una suscripción Plus real). En *Event deliveries* comprueba `livemode: false`.
- Un evento LIVE enviado a este endpoint se ignora (200, `environment_mismatch`) porque la clave configurada es TEST.

## 5. Pruebas manuales (propietario, en navegador)

Tarjetas de prueba de Stripe (solo en Checkout/portal de **TEST**; las introduces tú): pago correcto `4242 4242 4242 4242`; pago rechazado `4000 0000 0000 0002`; se acepta al guardar pero falla al cobrar `4000 0000 0000 0341`; con 3-D Secure `4000 0025 0000 3155`. Cualquier fecha futura y CVC.

Consulta de estado (SQL Editor de Supabase **staging**, nunca el de producción):
```sql
select s.status, s.plan_interval, s.current_period_start, s.current_period_end, s.cancel_at_period_end
from subscriptions s join auth.users u on u.id = s.user_id where u.email = '<tu correo de prueba>';
select event_type, status, attempts, last_error from stripe_webhook_events order by received_at desc limit 10;
```

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Entrar con el usuario nuevo → *Mi plan* | «Prueba Plus», días restantes y fecha de fin; aviso «si te suscribes durante la prueba se cobra de inmediato»; botón de suscripción |
| 2 | **Checkout mensual** | Stripe muestra 3,99 € a pagar **hoy** (sin «prueba gratuita»). Pagas con `4242…` |
| 3 | **Retorno y sync** | Vuelves a `/app/subscription?plus=success…`: «Estamos confirmando tu pago» → «¡Suscripción confirmada!» solo cuando el servidor lo confirma. La URL se limpia. Estado: Plan mensual, fecha de renovación ≈ +1 mes. SQL: `status = active`, `plan_interval = monthly` |
| 4 | IA y búsqueda | El asistente IA responde; `/api/ai/search` funciona (con Plus). Con un usuario gratuito daría el aviso Plus |
| 5 | **Portal** | «Gestionar suscripción» abre el portal de Stripe: plan correcto, método de pago editable, facturas, **sin** selector de cantidad |
| 6 | **Cambio de plan** | En el portal, mensual → anual (Stripe muestra el prorrateo) → confirmar. En unos segundos *Mi plan* dice «Plan anual»; acceso sin interrupción. Repite anual → mensual |
| 7 | **Cancelación** | Portal → cancelar al final del periodo. *Mi plan*: «Tu suscripción se cancelará» con la fecha; conserva el acceso. Reactiva desde el portal y vuelve a «Plus activo» |
| 8 | **Checkout anual** | Con **otro** usuario de prueba (o tras cancelar al instante la suscripción en Stripe → *Cancel immediately*): 39,90 € hoy, «Plan anual», renovación ≈ +1 año |
| 9 | **Pago inicial fallido** | Checkout con `4000 0000 0000 0002` o `…0341`: Stripe rechaza el pago; al volver no hay Plus (sigues en trial/gratuito) |
| 10 | **Impago en renovación** | Solo reproducible de forma práctica con *test clocks*; ya está validado por el E2E real (gracia de 3 días, recuperación y pérdida de Plus). No es necesario repetirlo a mano |
| 11 | Mensaje «pago procesándose» | Si el webhook tarda, debe verse «Estamos esperando la confirmación…» con el reintento y el correo de soporte, sin decir que está activo |

### Revisión visual (anota capturas)
- Escritorio y móvil (≈375 px): `/app/subscription` en trial, Plus, cancelación pendiente y error; Checkout y retorno.
- Modo claro y oscuro: legibilidad del texto, botones y avisos.
- Teclado: Tab recorre el selector mensual/anual → botón; el foco se ve en todos los controles; Enter/Espacio funcionan; los errores se anuncian.
- Español e inglés (`/en/app/subscription`): sin textos mezclados; el menú de usuario también traducido.
- La nota «El pack Excel/PDF es independiente» aparece y no mezcla pagos.

### Regresión
- El pack Excel/PDF y su webhook siguen igual (no se toca su endpoint ni su secreto).
- `/api/ai/feedback` sigue abierto; `/api/ai/search` exige Plus.
- Producción sigue sin las migraciones Plus ni el flag.

## 6. Cierre y limpieza
- Cancela en Stripe TEST las suscripciones de prueba (*Cancel immediately*).
- Rota/borra el secreto de bypass de Vercel si lo usaste.
- Si dejas la Preview, mantén `PLUS_SUBSCRIPTIONS_ENABLED=true` **solo** en su ámbito de rama.
- Para volver atrás: borra las variables de la rama en Vercel y desactiva el endpoint en Stripe TEST.

## 7. Si algo falla
Anota el mensaje visible, la hora y la fila de `stripe_webhook_events` (`status`, `last_error`), **sin** copiar claves ni secretos, y compártelo. Códigos útiles del webhook: `400 invalid_signature` (secreto equivocado), `503` (falta flag/secreto), `500 processing_failed` (Stripe reintenta; revisa `last_error`).
