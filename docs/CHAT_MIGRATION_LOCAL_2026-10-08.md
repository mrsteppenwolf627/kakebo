# Traspaso de Kakebo a un chat Work local

Fecha: 2026-10-08  
Proyecto: Kakebo  
Repositorio: `https://github.com/mrsteppenwolf627/kakebo.git`  
Rama de trabajo: `feat/premium-pack-landing`

## Objetivo del nuevo chat

Continuar el trabajo de Kakebo desde un chat Work ejecutado en el ordenador local, con acceso directo al repositorio y al entorno de trabajo de Windows. No usar un entorno cloud ni depender de Claude Code para cada operación local.

El nuevo chat debe trabajar desde:

```text
C:\Users\a.alarcon\Desktop\Cursor projects\kakebo
```

## Estado actual confirmado

### Git y GitHub

- Rama: `feat/premium-pack-landing`.
- Commit remoto actual: `90c300e3e217b871e78f9c8224bdea035f2011b1`.
- Mensaje: `feat(seo): optimize premium landing keyword targeting`.
- Remoto: `https://github.com/mrsteppenwolf627/kakebo.git`.
- `main` no se ha modificado y permanece en el estado anterior conocido.
- El commit SEO ya está publicado en GitHub.
- El árbol local contiene cambios y archivos ajenos no publicados; deben conservarse y no deben eliminarse ni mezclarse automáticamente.

### Producción web

- Dominio: `https://www.metodokakebo.com`.
- Proyecto Vercel: `kakebo`.
- Equipo: `aitors-projects-b90cd59c`.
- Las mejoras SEO del commit `90c300e3` están desplegadas en Production.
- La landing premium responde correctamente en español e inglés.
- El comercio premium está activo en Production.

### Stripe LIVE

- Producto y precio LIVE creados.
- Precio: 9,90 EUR, pago único, con comportamiento fiscal inclusivo.
- La clave secreta LIVE está configurada en Vercel Production como variable sensible.
- El webhook LIVE está activo en:

```text
https://www.metodokakebo.com/api/webhooks/stripe
```

- Eventos configurados: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` y `charge.dispute.created`.
- No incluir claves, secretos, cookies ni tokens en este documento.

### Supabase Production

- Proyecto de producción: `fajqfjouqauyfiajfonf`.
- Las cuatro migraciones premium están aplicadas y verificadas en orden:

```text
20261007000001_premium_pack_purchases.sql
20261007000002_premium_pack_service_role_grants.sql
20261007000003_premium_pack_single_use_claim.sql
20261007000004_premium_pack_download_dedupe.sql
```

- Las tablas premium, RLS, permisos del service role, claim de un solo uso y deduplicación de descargas están preparados.
- No tocar producción con SQL sin una autorización específica.

## Qué está terminado

- Landing premium publicada y accesible.
- Checkout LIVE preparado.
- Webhook LIVE registrado.
- Entrega privada de los tres archivos preparada.
- Claim de acceso de un solo uso.
- Revocación tras reembolso o disputa preparada.
- SEO técnico y on-page de las landing premium actualizado.
- Sitemap actualizado con las URLs ES y EN, alternates y `x-default`.
- Enlazado interno premium mejorado.
- Terminología inglesa `kakeibo` incorporada de forma localizada.
- Tutorial inglés corregido para no mostrar claves de traducción en bruto.
- Mejoras publicadas en GitHub y desplegadas en producción.

## Verificaciones ya realizadas

- Build correcto.
- Tests específicos SEO/premium/checkout correctos: 283 tests.
- Suite completa: un único fallo ajeno en `calculate-whatif.test.ts`, causado por una fecha objetivo ya pasada (`2026-08-01`). No modificarlo automáticamente.
- `git diff --check` limpio en la fase SEO.
- URLs premium en producción con HTTP 200.
- Canonicals, hreflang, robots, JSON-LD Product/Offer/Breadcrumb/FAQ y sitemap comprobados.
- No se detectaron secretos ni rutas privadas en el HTML público.
- Las dos URLs premium están indexadas según la última comprobación de Search Console.

## Pendientes reales

1. Observar la primera compra LIVE real y verificar webhook, claim, descarga y registro.
2. Revisar Search Console después del siguiente rastreo de Google.
3. Revisar la validez fiscal del tratamiento de IVA y completar Stripe Tax si procede.
4. Revocar la antigua clave LIVE que ya no se usa en Production, después de confirmar que no la necesita ningún entorno.
5. Considerar recuperación de acceso por email para clientes que pierdan la cookie.
6. Revisar en una fase separada las mejoras de rendimiento pendientes: cache, imagen LCP y redirección doble sin `www`.

## Reglas de trabajo para el nuevo chat

- Trabajar localmente en el directorio indicado.
- Antes de editar, comprobar rama, HEAD, remoto y `git status --short --untracked-files=all`.
- Preservar todos los cambios ajenos existentes.
- No usar `git reset --hard`, `git checkout --`, `git clean`, rebase ni stash.
- No usar `git add .` ni `git add -A`.
- Añadir archivos individualmente y revisar el diff antes de cualquier commit.
- No mostrar ni copiar secretos, claves, tokens, cookies, JWT ni variables sensibles.
- No tocar producción, Stripe, Supabase, Vercel o `main` salvo autorización expresa para esa acción concreta.
- Separar siempre hechos verificados, inferencias y puntos no comprobados.
- No hacer commit, push o deploy automáticamente: pedir autorización cuando una fase llegue a ese punto.

## Primer arranque recomendado

El nuevo chat local debe empezar con una comprobación de continuidad, sin modificar archivos:

1. Confirmar que la ruta de trabajo es la correcta.
2. Confirmar rama, HEAD y remoto.
3. Comparar HEAD con `origin/feat/premium-pack-landing`.
4. Mostrar el estado local completo, incluidos archivos sin seguimiento.
5. Identificar qué cambios son ajenos y preservarlos.
6. Leer este documento y `CONTEXT.md` antes de proponer nuevas acciones.

Después debe esperar una instrucción concreta del usuario.

## Datos que no forman parte de este documento

No se incluyen deliberadamente:

- `.env.local`, `.env.staging.local` ni cualquier `.env*`.
- Claves secretas de Stripe, Supabase o Vercel.
- Secretos de webhook.
- Cookies, tokens de acceso o credenciales de Search Console.
- Archivos privados del pack.
- El contenido completo de informes temporales o scripts de prueba no versionados.

## Mensaje inicial sugerido para el nuevo chat

> Trabajamos en Kakebo desde el ordenador local, no en la nube. Lee `docs/CHAT_MIGRATION_LOCAL_2026-10-08.md` y `CONTEXT.md`. Antes de hacer nada, verifica la raíz del repositorio, rama, HEAD, remoto, estado completo de Git y divergencia con `origin/feat/premium-pack-landing`. No modifiques archivos ni servicios todavía. Conserva todos los cambios locales ajenos y devuélveme únicamente el estado de continuidad y los bloqueos reales.

