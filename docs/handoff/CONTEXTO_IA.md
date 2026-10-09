# Contexto del proyecto Kakebo — para trabajar con ChatGPT u otro asistente

> Pega este documento entero al inicio de la conversación. Fecha del contexto: **9 de octubre de 2026** (incluye el commit `dd04464` de la rama `feat/app-visual-refresh`).
> Detalle completo del estado y traspaso entre ordenadores: [`ESTADO_2026-10-09.md`](ESTADO_2026-10-09.md).

---

## 0. Instrucciones para ti (ChatGPT)

Vas a ayudarme a seguir desarrollando **Kakebo** (metodokakebo.com), mi app web de finanzas personales basada en el método japonés Kakebo. Soy el propietario y desarrollador único; trabajo con asistentes de IA (Claude Code, Codex, ChatGPT) sobre el mismo repositorio.

Reglas de trabajo:

1. **No inventes el estado del proyecto.** Si algo no está en este documento, pregúntame o pídeme que te pegue el archivo concreto.
2. **Distingue siempre LOCAL, PREVIEW (Vercel) y PRODUCCIÓN.** El trabajo más reciente (`feat/app-visual-refresh`) está en local y en una Preview, **no** en producción. No afirmes estados de producción sin evidencia fechada.
3. **Nunca propongas aplicar migraciones o promover código a producción sin pasar por el runbook** (`docs/planning/phase3b-migration-runbook.md`): backup → aplicar en orden → verificar → tener rollback.
4. Cambios pequeños, un objetivo por tarea, con commits convencionales (`feat(...)`, `fix(...)`, `docs(...)`).
5. Respóndeme en español.

---

## 1. Qué es Kakebo

- **Producto:** app web gratuita (por ahora) para llevar el método Kakebo: registrar gastos e ingresos por categorías, presupuestos, ciclos mensuales con cierre, histórico, gráficos, informes PDF y un asistente de IA conversacional.
- **Web pública:** landing, blog SEO (ES/EN, MDX), herramientas gratuitas (calculadora de ahorro, calculadora de inflación con serie histórica oficial del IPC), tutorial.
- **Producto de pago único (nuevo):** "Kakebo Master System Pack" = Excel avanzado + tutorial PDF + ebook PDF, vendido por Stripe con compra como invitado.
- **URL producción:** https://www.metodokakebo.com
- **Repo:** github.com/mrsteppenwolf627/kakebo

### Categorías Kakebo
Supervivencia, Opcional, Cultura, Extra (las 4 clásicas del método), con subcategorías (14, catálogo en `src/lib/subcategories.ts`).

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.1 (App Router), React 19.2, TypeScript, React Compiler |
| Estilos | Tailwind CSS 4, shadcn/ui, framer-motion, lucide-react |
| i18n | next-intl (rutas `src/app/[locale]/...`, textos en `messages/es.json` y `messages/en.json`) |
| Auth + BD | Supabase (Postgres + RLS + Auth + Storage privado). Proyecto `fajqfjouqauyfiajfonf` |
| IA | OpenAI (modelo por defecto `gpt-5-nano`), Function Calling directo; restos de LangChain/LangGraph (v1, huérfano) |
| Pagos | Stripe (solo para el pack premium de pago único) |
| PDF | @react-pdf/renderer |
| Gráficos | recharts |
| Blog | MDX (`src/content/blog/*.es.mdx` / `*.en.mdx`), next-mdx-remote, gray-matter |
| Tests | Vitest + Testing Library + PGlite (tests SQL en memoria) |
| Hosting | Vercel |
| Logs | pino |

Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm test`.

### Estructura relevante
```
src/app/[locale]/(public)/   → landing, blog, herramientas, tutorial, landing premium
src/app/[locale]/app/        → app privada: dashboard (page.tsx), new, new-income, history, history/[ym],
                               fixed (gastos fijos), settings, agent (chat IA), ai-metrics,
                               subscription, cancel-subscription, admin
src/app/api/                 → expenses, incomes, months, fixed-expenses, reports, ai, premium,
                               webhooks/stripe, stripe (stubs), admin, settings, health, og
src/lib/                     → months.ts (ciclos), cycles/, agents-v2/ (IA activa), agents/ (tools),
                               auth/access-state.ts, premium/, stripe/, fixed-expenses/, inflation/
supabase/migrations/         → migraciones "compatibles" (aplicables)
supabase/deferred/freemium/  → modelo freemium preparado e INACTIVO (no son migraciones)
supabase/manual-ops/, rollback/, verification/, tests/ → scripts de operación
```

### Documentación clave del repo
- `CONTEXT.md` (raíz): estado técnico. **Leer primero el bloque "Estado operativo vigente"**; lo demás es histórico.
- `PROJECT_STATUS.md` (raíz) y `docs/PROJECT_STATUS.md`: SEO, contenido, UI.
- `ADRs.md`: ADR-001 (SaaS → gratuito), ADR-002 (mantener Supabase Auth), ADR-003 (capa gratuita limitada, no activada).
- `docs/planning/`: fase-0 a fase-3, `phase3b-migration-runbook.md`, `premium-commerce-architecture.md`.

---

## 3. Historia del proyecto (resumen cronológico)

- **Enero 2026:** arranque. Auth Supabase, gastos, sistema mensual con cierre de mes e histórico, dashboard con gráficos, presupuestos por categoría, separación landing/app.
- **Febrero 2026 (~200 commits):** fase SaaS con Stripe y suscripciones; asistente IA (v1 LangGraph y luego v2 Function Calling), embeddings, i18n, auditoría de seguridad. Después se decide **pasar a herramienta gratuita** (ADR-001): Stripe se elimina (rutas `/api/stripe/*` quedan como stubs 410).
- **Marzo–mayo 2026:** mantenimiento.
- **Junio–julio 2026 (~190 commits):** foco en **SEO y contenido**: sprints SEO técnicos (metadata, sitemap, canonical, breadcrumbs, OG, identidad de autor), artículos (fondo de emergencia, regla 50/30/20, cuentas remuneradas, alternativas a Fintonic…), calculadora de ahorro v2, calculadora de inflación con datos históricos del IPC, experimento CRO en el artículo de la plantilla Excel, optimización de imágenes. Todo documentado y validado en producción.
- **Septiembre 2026 — fases de producto:**
  - **Fase 0 (14/09):** auditoría técnica completa del producto.
  - **Fase 1 — Ciclos libres (14/09):** el usuario puede cerrar su ciclo cualquier día y se abre el siguiente; el gasto conserva su fecha real pero se imputa al **ciclo abierto** (`month_id`), no al mes natural. Helpers en `src/lib/months.ts`.
  - **Fase 2 — IA fiable (15/09):** el chat activo (`FloatingAgentChat` → `useAgentStream` → `POST /api/ai/agent-v2/stream` → `stream-caller.ts`) analiza siempre por ciclo real, exige ámbito explícito, confirma escrituras con token de un solo uso en servidor (`ai_pending_actions`), aísla el aprendizaje por usuario y guarda métricas sin contenido (`ai_logs`). **Hotfix 2.1:** "ciclo anterior" se resuelve por la tabla `months` (antes la IA inventaba un mes). **En código; no consta como desplegado.**
  - **Fase 3.B — monetización (16–17/09):** diseño de estados de acceso, fundadores, Plus, límite gratuito… preparado en local.
- **Octubre 2026:**
  - 01–02/10: tracking de activación (primer gasto) y atribución de registro confirmado.
  - 05–06/10: Fase 3.B reconvertida a **"modo compatible"** (migraciones que no imponen límites); entrega del pack premium desde Storage privado; ADR-003 documentado.
  - 06–07/10: **Stripe conectado para el pack premium** (ver §5).
  - 08/10: SEO de la landing premium + **gran pasada de UX en la app** + **informes premium por ciclo** (ver §4).
  - 09/10: **rediseño visual de la app interna** + **corrección de `/api/reports`** en la rama `feat/app-visual-refresh` (ver §4.6).

---

## 4. Lo último hecho (6–9 octubre 2026) — ramas `feat/premium-pack-landing` y `feat/app-visual-refresh`

> `feat/premium-pack-landing` tiene 27 commits por encima de `main`. `feat/app-visual-refresh` parte de ella y añade el trabajo del 09/10. **Ninguna está fusionada en `main`.** Producción sirve un commit intermedio de `feat/premium-pack-landing` (`90c300e`, desplegado por CLI el 08/10), **no** el trabajo de `feat/app-visual-refresh`. La más reciente es `feat/app-visual-refresh`.

### 4.1 Pack premium + Stripe (07/10, commit `306bfbd`)
- `POST /api/premium/checkout`: crea Checkout Session de Stripe (pago único) solo con config del servidor (price id por env).
- Webhook firmado `/api/webhooks/stripe`: `checkout.session.completed`, `async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`. Valida producto, precio, importe, moneda y cantidad; idempotente; único sitio que crea la compra. Reembolsos y disputas revocan el acceso.
- `GET /api/premium/claim`: canjea el id de la sesión por una cookie HttpOnly **una sola vez** (función SQL atómica) y redirige a URL limpia.
- `GET /api/premium/download`: requiere token válido de compra pagada; URLs firmadas del bucket privado `kakebo-premium`; log por archivo entregado.
- Landing `/plantilla-kakebo-excel-premium`: copia "disponible ya" + JSON-LD Product/Offer **solo si** `PREMIUM_COMMERCE_ENABLED=true`; si no, "Próximamente".
- Migraciones nuevas `20261007000001..04` (purchases, grants service_role, claim de un solo uso, dedupe de descargas) → **aplicadas en producción el 08/10** (registro de migraciones de Supabase, verificado el 09/10).
- **El comercio está desactivado por defecto en código.** El valor real de `PREMIUM_COMMERCE_ENABLED` en Vercel no se ha verificado.

### 4.2 SEO landing premium (07–08/10)
Metadata, headings y keyword targeting de la landing premium; ajustes en blog (plantilla Excel, guía método Kakebo), herramientas y sitemap. Tests de regresión SEO.

### 4.3 Gastos fijos (06/10)
Validación extraída a `src/lib/fixed-expenses/validation.ts`; se acepta "2026-1" y se normaliza a "2026-01". Ruta canónica de gastos fijos unificada (`/app/fixed`).

### 4.4 Pasada de UX en la app (08/10, por la tarde)
- Ciclos Kakebo explicados con más claridad; etiquetas de ciclo y resúmenes por categoría alineados.
- **Totales del dashboard alineados con la asignación por ciclo** (`month_id`). Excepción temporal: **octubre 2026 (`2026-10`) se mantiene por fecha de calendario** porque ya se llevaba manualmente así (`src/lib/cycles/ledger-scope.ts`, `MANUAL_CALENDAR_CYCLE_YM`).
- Asignación de ingresos a ciclo más clara; formularios de gasto/ingreso más claros.
- Navegación: sección **Historial** añadida y secciones de la app más claras; menú de cuenta accesible.
- Histórico de ciclos más legible; pantallas de ajustes, plan, asistente y métricas IA clarificadas; mensaje de cancelación clarificado.

### 4.5 Informes premium por ciclo (08/10)
- Nueva `POST /api/reports` (rangos: `cycle`, `day`, `week`, `month`, `year`), vista previa del resumen y PDF (`ReportDialog`, `ReportPDF`), incluye todos los movimientos.
- **Control de acceso en servidor:** permitido si `is_admin`, `is_founder`, concesión `legacy_full` en `access_grants`, o `plus_access_until` vigente. Si no → 403 `premium_required`. **Modo compatible (09/10):** si la tabla `access_grants` no existe, todos los usuarios autenticados tienen acceso (antes devolvía 503).

### 4.6 Rediseño visual de la app interna + fix de informes (09/10, commit `dd04464`, rama `feat/app-visual-refresh`)
- Navegación nueva (`TopNav`, `UserMenu`): icono de cartera junto a "Kakebo", iconos en "Nuevo gasto"/"Nuevo ingreso", escritorio y móvil.
- Dashboard: tarjetas con nuevo estilo y gráfico "Distribución por categoría" con las **categorías reales** normalizadas (supervivencia/opcional/cultura/extra), respetando el ciclo.
- Retirados los botones flotantes (`FloatingAddButton`, `FloatingAgentChat`); el agente IA sigue en `/app/agent`.
- Onboarding, agente IA y accesibilidad, y resto de pantallas internas alineadas con los tokens del tema. No se tocó la web pública, temas, `messages/` ni `supabase/`.
- **Fix `/api/reports`:** pedía `profiles.is_admin`, columna que **no existe** en la BD → 500. Ahora usa `.select("*")`. Verificado en local: el informe del ciclo 2026-10 se prepara y el PDF se descarga.
- Validaciones: lint 0 errores; build OK; tests 1444 OK y 2 fallos preexistentes (`ai-logs-migration`, `calculate-whatif`).
- Preview Vercel READY: https://kakebo-git-feat-app-visual-refresh-aitors-projects-b90cd59c.vercel.app (no promovido a producción).

---

## 5. Estado actual y decisiones vigentes

### Decisión de producto (ADR-003, 06/10/2026) — NO activada
- Capa gratuita: **máx. 30 gastos/mes** (mes natural Europe/Madrid, contado en servidor; borrar no descuenta), **sin IA conversacional, sin informes PDF, sin funciones Plus**.
- Usuarios existentes conservan todo (`legacy_full`).
- **Trial: pendiente de decisión del propietario** (el valor de 14 días en `01_access_foundation.sql` es provisional).
- Hoy el código y producción dan acceso completo. El modelo vive inactivo en `supabase/deferred/freemium/` (orden: 01 → 02 → 04 → 03; solo el 03 activa el límite; requieren `SET kakebo.freemium_activation = 'confirmed'`).

### Producción (verificado en solo lectura el 09/10/2026 — sustituye la evidencia del 05/10)
- `www.metodokakebo.com` sirve el deployment `dpl_A7TBxEEJGddr1nSvFXePAV6dGsFS`, commit **`90c300e`** (rama `feat/premium-pack-landing`), desplegado por **CLI** el 08/10 09:15 UTC. **Ya no es `41a4c98`.**
- En Supabase **existen**: `fn_create_expense`, `fn_recompute_plus_access_until`, tablas `founder_cutoff`, `subscriptions`, `expense_monthly_usage`, `stripe_webhook_events`, `first_expense_activations`, trigger `trg_protect_profile_access_columns`, esquema de backup `phase3b_backup`, tablas del pack premium y de Fase 2 (`ai_pending_actions`).
- **No existen**: `fn_resolve_access_state` ni `access_grants` (freemium diferido, no activado) ni la columna `profiles.is_admin`.
- **No verificado:** `phase3b_verify.sql`, `handle_new_user`, `PREMIUM_COMMERCE_ENABLED` en Vercel, ni la creación de gastos en producción.
- Detalle: `docs/handoff/ESTADO_2026-10-09.md` §0.

### Ramas
- `main` (GitHub): último commit `c3a7300` (06/10).
- `feat/premium-pack-landing`: último commit `578a540` (08/10 16:12), sin fusionar.
- `feat/app-visual-refresh`: parte de `578a540` y añade el commit `dd04464` (09/10) y la documentación de traspaso — **la más reciente, sin fusionar**. Trabajar sobre esta.
- En el ordenador original existe además la rama local `backup/local-main-2a079fa` (commit antiguo de migraciones del 05/10, sustituido por `408a741` en GitHub; no está en GitHub).

---

## 6. Riesgos y pendientes detectados

1. **Informes PDF — resuelto el 09/10:** `/api/reports` funciona en modo compatible (sin `access_grants` → acceso para todos los autenticados) y ya no pide la columna inexistente `profiles.is_admin`. Pendiente menor: sin sesión devuelve 500 en vez de 401.
2. **Verificación antes de fusionar:** las migraciones compatibles 3.B y las del pack premium ya constan en la BD (09/10), pero falta ejecutar `supabase/verification/phase3b_verify.sql` (0 FAIL) siguiendo el runbook. No aplicar nada de `supabase/deferred/freemium/`.
3. **Fusionar `feat/app-visual-refresh` en `main`** (incluye `feat/premium-pack-landing`), solo después de verificar y de probar la Preview con sesión. Ver "Punto exacto de reanudación" en `docs/handoff/ESTADO_2026-10-09.md` §8.
4. **Activar comercio premium:** configurar en Vercel `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price id del pack, endpoint de webhook en Stripe, `PREMIUM_COMMERCE_ENABLED=true`; probar compra real/test de punta a punta; textos legales, IVA y factura.
5. **Fase 2 IA**: sus tablas/columnas existen en la BD (09/10); falta confirmar el comportamiento en producción.
6. **Decisión de trial** (sí/no y duración) antes de aplicar el freemium.
7. **Cablear permisos IA/PDF por estado de acceso** en la app (`src/lib/auth/access-state.ts` existe pero no está conectado; `canUsePremium` devuelve siempre true).
8. Excepción de octubre 2026 en `ledger-scope.ts`: quitarla cuando el ciclo de octubre se cierre.
9. Tests: 2 fallos preexistentes (`ai-logs-migration`, `calculate-whatif`) y 2 errores de `tsc` en tests (`process-embeddings`, `months-id`).
10. Deuda: arquitectura IA v1 y `/api/ai/agent-v2` no-streaming están huérfanas; subdirectorio `kakebo/` es un submódulo antiguo desincronizado (no tocar).

---

## 7. Cómo quiero que me ayudes

Cuando te pida una tarea:
1. Dime qué archivos necesitas ver si no los tienes.
2. Propón un plan corto y los riesgos (especialmente BD/producción).
3. Da el código o los cambios concretos, y cómo probarlos (`npm test`, `npm run build`, SQL de verificación).
4. Indica qué documentación hay que actualizar (`CONTEXT.md`, runbook, `PROJECT_STATUS.md`).

**Primera tarea que quiero abordar:** _[escribe aquí lo que quieras hacer]_
