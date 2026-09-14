# Fase 0 — Auditoría técnica de partida (Kakebo)

**Fecha de la auditoría:** 2026-09-14
**Commit base auditado:** `4d7d1abfe1da600e165a55c53aab2a831cade3ba` (`main`, 2026-09-03 — "feat(analytics): track successful expense creation")
**Modo:** auditoría en solo lectura. No se ha modificado ningún componente, ruta, base de datos, configuración de Stripe/IA/despliegue ni código funcional. Este documento y la actualización de `CONTEXT.md` son los únicos artefactos producidos por esta fase.

**Nota de alcance:** el repositorio contiene un subdirectorio `kakebo/` que es un git submodule con un puntero desincronizado (`M kakebo` en `git status`, cambio ajeno preexistente). No se ha auditado ni tocado — es contenido duplicado del propio proyecto y queda fuera del alcance de esta fase.

---

## 1. Estado confirmado (evidencia de código)

### 1.1 Gastos, meses, cierres y bloqueos

- Ciclo mensual modelado como tabla/recurso `months`: `src/app/api/months/route.ts` (GET/POST idempotente, crea el mes en estado `open`), `src/app/api/months/[id]/route.ts` (PATCH cierra el mes vía `status: "closed"`; una vez cerrado no se puede reabrir — devuelve conflicto).
- Bloqueo de escritura tras cierre **ya implementado**: `src/app/api/expenses/route.ts` (creación) y `src/app/api/expenses/[id]/route.ts` (PATCH/DELETE) comprueban `monthData?.status === "closed"` y rechazan la operación.
- No existe una tabla ni concepto de "ciclos libres" independiente de `months`. Hay una tool de IA de solo lectura `getCurrentCycle` (`src/lib/agents-v2/tools/definitions.ts`), pero no gestiona cuotas ni ciclos alternativos.
- **No existe ningún contador ni límite de nº de gastos por mes.** La futura regla de negocio "30 gastos/mes natural + modo consulta" no tiene precedente en código: se debe construir desde cero (contador, umbral, estado "modo consulta", reseteo el día 1).

### 1.2 Arquitectura de IA

- **Dos arquitecturas de agente conviven en el repo:**
  - v1: `src/app/api/ai/agent/route.ts` + `src/lib/ai/prompts.ts`.
  - v2: `src/app/api/ai/agent-v2/route.ts` y `src/app/api/ai/agent-v2/stream/route.ts` + `src/lib/agents-v2/*` (OpenAI Function Calling directo, presentada en comentarios como sucesora de v1 por menor nº de llamadas LLM).
  - **No verificado en esta pasada** cuál está conectada al frontend en producción — requiere una revisión adicional específica antes de tocar el agente.
- Cliente OpenAI: `src/lib/ai/client.ts`. Modelo por defecto `gpt-5-nano`; hay tabla de coste para `gpt-5-nano`, `gpt-4o-mini`, `gpt-4o`.
  - **Riesgo detectado:** el cliente se instancia con `dangerouslyAllowBrowser: true`. Si en algún flujo se importa ese cliente desde código que se ejecuta en el navegador (no confirmado, requiere revisión), existe riesgo de exposición de la API key. A revisar antes de ampliar el uso de IA.
- Prompts hardcodeados en TypeScript (`src/lib/ai/prompts.ts`, `src/lib/agents-v2/prompts.ts`), no en configuración externa.
- Tools v2 (`src/lib/agents-v2/tools/definitions.ts`):
  - Lectura (`requiresConfirmation: false`): `analyzeSpendingPattern`, `getBudgetStatus`, `detectAnomalies`, `predictMonthlySpending`, `getSpendingTrends`, `searchExpenses`, `getCurrentCycle`, `submitFeedback`.
  - Escritura (`requiresConfirmation: true`): `createTransaction`, `updateTransaction`, `calculateWhatIf`, `setBudget`.
- **Confirmación antes de escritura: SÍ implementada**, en `src/lib/agents-v2/function-caller.ts` y `stream-caller.ts` — bloquea la ejecución y devuelve una `confirmationRequest`.
  - **Brecha frente a la decisión de producto:** el flag que activa/desactiva la confirmación es una variable de entorno global (`ENABLE_WRITE_CONFIRMATION`), **no un ajuste por usuario**. No existe ningún campo tipo `ai_confirm_writes` en `src/lib/schemas/settings.ts` ni en la ruta `api/settings`. Es decir, la mecánica existe pero no es "configurable en ajustes" como pide la decisión de producto — falta exponerlo por usuario.
- Embeddings: sí se usan activamente — `src/lib/ai/embeddings.ts`, rutas `api/ai/process-embeddings`, `api/ai/migrate-embeddings`, `api/ai/search`, y auto-embedding asíncrono al crear un gasto (`src/lib/ai/auto-embeddings.ts`, invocado desde `api/expenses/route.ts`). El estado real de la extensión `pgvector` y de los índices en Supabase **no es verificable desde el código**.
- Telemetría de coste/tokens: `src/lib/ai/metrics.ts` + `api/ai/metrics/route.ts` calculan coste, pero no se ha confirmado en qué tabla se persiste ni si hay rate-limiting por usuario — requiere revisión adicional (incluyendo `middleware.ts`, que hoy solo hace enrutado i18n, sin lógica de auth ni rate limit).
- Memoria/aprendizaje: existe `src/lib/ai/learning-metrics.ts`, pero no se ha confirmado si implementa memoria individual, colectiva, o solo métricas de uso — **no asumir, pendiente de revisión dedicada** antes de decidir cómo encaja con "memoria individual por defecto, aprendizaje colectivo opcional y anonimizado".

### 1.3 Control de acceso, perfiles, suscripciones, pruebas y Stripe

- No hay middleware de autenticación a nivel de rutas: `src/middleware.ts` solo hace enrutado i18n (next-intl).
- El control de acceso real vive en `src/lib/auth/access-control.ts`: modelo de datos con `SubscriptionTier = 'free' | 'pro'`, `Profile` con `tier`, `trial_ends_at`, `stripe_customer_id/subscription_id`, `is_admin`, `manual_override`.
  - **`canUsePremium()` devuelve `true` para cualquier perfil autenticado** (comentario explícito en el código: la herramienta es gratuita, todo usuario tiene acceso completo). `canUseAI` es un alias de `canUsePremium`. `getTrialDaysLeft()` devuelve siempre `0`.
  - Conclusión: el **modelo de datos** para tiers/trial/Stripe sigue en el esquema y en el tipo `Profile`, pero la **lógica de aplicación está neutralizada** — hoy todo usuario autenticado tiene acceso completo gratis, sin distinción de plan.
- **Stripe está desmantelado, no solo desactivado por flag:**
  - `src/lib/stripe/server.ts` → `export const stripe = null`.
  - `src/app/api/webhooks/stripe/route.ts` → responde 200 vacío sin procesar nada.
  - `src/app/api/stripe/checkout/route.ts` y `src/app/api/stripe/portal/route.ts` → responden 410 Gone ("Payment processing has been removed. Kakebo is now free.").
  - No hay dependencia `stripe` en `package.json`.
  - Coherente con `ADRs.md` (ADR-001: "Cambio de modelo SaaS a herramienta gratuita") y con `CHANGELOG.md` (`[4.0.0] - 2026-06-15`, cambio de modelo de negocio a gratuito).
- Existe un sistema propio de administración de acceso al margen de Stripe: `src/app/api/admin/list-vip-users/route.ts`, `src/app/api/admin/grant-vip/route.ts`, `src/app/[locale]/app/admin/AdminClient.tsx` — probablemente para conceder `tier`/`manual_override` manualmente.
- No hay lógica de "modo consulta" ni contador de límite de gastos por plan en `src/`.
- **Implicación directa para la reintroducción de Plus:** no se trata de "reactivar" Stripe — hay que reconstruir la integración de pagos y reintroducir la lógica de tiers en `access-control.ts`, que hoy está deliberadamente apagada.

### 1.4 Correos transaccionales

- **No existe ninguna integración de email propia.** No hay dependencia de Resend, SendGrid, Postmark, nodemailer ni `@react-email` en `package.json`, ni rutas de envío de correo en el repo.
- Los únicos correos que pueden llegar a los usuarios hoy son las plantillas por defecto de Supabase Auth (confirmación de email, recuperación de contraseña), **si están configuradas así en el dashboard de Supabase** — esto no es verificable desde el código, requiere comprobación externa.
- No hay correo de bienvenida, de aviso de límite alcanzado, de cambio de suscripción, de factura ni de cancelación. Todos estos son necesarios para las fases de monetización y quedan pendientes de construir desde cero (proveedor + plantillas + disparadores).

### 1.5 Eventos de Analytics

- Integración: Google Analytics vía `window.gtag` (`src/components/analytics/GoogleAnalytics.tsx`), con un wrapper singleton en `src/lib/analytics.ts` (clase `Analytics`, método `.track(name, properties)`, log en consola en dev, `gtag` en producción). Tiene test unitario (`src/__tests__/lib/analytics.test.ts`).
- No hay PostHog, Mixpanel ni Plausible — solo GA4.
- Eventos ya tipados e implementados (`EventName` en `src/lib/analytics.ts`):
  `tool_viewed`, `tool_interaction`, `signup_click`, `sign_up`, `download_template`, `click_cta_login`, `click_tool_to_app`, `click_excel_to_app`, `expense_created`, `use_savings_calculator`, `use_inflation_calculator`, `use_503020_calculator`, `savings_calculator_calculate`, `savings_calculator_goal_result`, `inflation_calculator_mode_change`, `historical_inflation_calculation`, `historical_inflation_error`.
- Disparadores confirmados: creación de gasto (`NewExpenseClient.tsx` → `expense_created`), CTAs de contenido (`MDXClientCTAs.tsx`), login/signup (`auth/callback/page.tsx`, `login/page.tsx`), calculadoras de la landing (`components/landing/tools/*`).
- No hay eventos de negocio para el futuro modelo de monetización (inicio de trial, fin de trial, alcanzar el límite de 30 gastos, alta/baja Plus, uso de IA) — quedan por definir e implementar en la fase correspondiente.

### 1.6 Migraciones y esquema local

- `migrations/` (raíz): solo `auto_embeddings_setup.sql`.
- `supabase/migrations/`: solo `20260217_security_audit.sql`.
- Este historial es claramente insuficiente para reconstruir el esquema real (que incluye, como mínimo, `months`, `expenses`, `user_settings`, `profiles`, `fixed-expenses`, `incomes` según los nombres de tabla usados en las rutas API y los tipos en `src/lib/schemas/`). **El esquema real vive mayormente en Supabase remoto, no en migraciones locales versionadas.**
- **No verificable sin consultar Supabase directamente (recomendado antes de tocar nada de acceso/monetización/IA):**
  - Políticas RLS reales sobre `profiles`, `expenses`, `months`, etc.
  - Si `20260217_security_audit.sql` está aplicado en producción.
  - Estado de la extensión `pgvector` y de los índices de embeddings.
  - Triggers, funciones y extensiones instaladas.
  - Volumen real de datos y usuarios existentes (relevante para la decisión "usuarios existentes: acceso completo gratuito permanente" — hay que poder identificarlos de forma fiable).

### 1.7 Documentación y archivo de contexto existente

Inventario y estado, por fecha declarada de última actualización:

| Archivo | Propósito | Última actualización declarada | Estado |
|---|---|---|---|
| `PROJECT_STATUS.md` (raíz) | Bitácora operativa de tareas (SEO, tests, lint, imágenes) | 2026-07-28 | Activo, el más reciente |
| `docs/PROJECT_STATUS.md` | Fuente de verdad del SEO Sprint / frontend público-indexable; se autodeclara distinto del de raíz y remite a `CONTEXT.md` para el historial SaaS→gratuito y a `ADRs.md` para arquitectura | 2026-07-28 | Activo, ámbito SEO/frontend |
| `CONTEXT.md` (raíz) | Documento técnico de arquitectura e historial de infraestructura (agente IA, tests, TypeScript) | 2026-06-15 (v3.5) | Desactualizado ~3 meses, pero es el que `docs/PROJECT_STATUS.md` señala como dueño del "historial de la migración SaaS→gratuito" |
| `.ai/CONTEXT.md` | Documento de contexto antiguo, contenido distinto (Fase 3 RAG y Memoria) | 2025-02-02 | Obsoleto, superado por `CONTEXT.md` de raíz |
| `ADRs.md` | Decisiones arquitectónicas (ADR-001: paso de SaaS a herramienta gratuita) | — | Vigente, coherente con el desmantelamiento de Stripe encontrado en código |
| `CHANGELOG.md` | Historial de versiones | `[4.0.0] - 2026-06-15` (cambio a modelo gratuito) | Vigente |
| `CLAUDE.md` (raíz) | — | — | **Vacío (0 bytes)** |
| `INSTRUCCIONES.md` | Guía de proceso (cuándo usar Claude Code vs Antigravity) | 2026-02-05 | Guía de herramientas, no de estado de producto |
| `README.md` | Documentación pública del repo | — | Genérico |

**Decisión sobre el archivo canónico:** `docs/PROJECT_STATUS.md` remite explícitamente a `CONTEXT.md` como dueño del historial de infraestructura/modelo de negocio SaaS→gratuito, que es exactamente el ámbito de las decisiones de producto de esta fase (pricing, trial, acceso, IA, monetización). Por eso el resumen de decisiones y el enlace a este informe se han añadido a **`CONTEXT.md`** (raíz), y no a `PROJECT_STATUS.md`, que es la bitácora operativa de SEO/frontend. No se ha creado ningún archivo de contexto nuevo.

- No existe carpeta `memory/` de Claude Code dentro del repositorio del proyecto (el sistema de memoria activo en esta sesión es el global de usuario, fuera del repo).

### 1.8 Dependencias relevantes (`package.json`)

- IA: `openai@^6.17.0`, `@langchain/core@^1.1.18`, `@langchain/langgraph@^1.1.2`, `@langchain/openai@^1.2.4`.
- Supabase: `@supabase/supabase-js@^2.91.0`, `@supabase/ssr@^0.8.0`, `@supabase/auth-helpers-nextjs@^0.15.0` (este último está deprecado en favor de `@supabase/ssr` — mezcla de ambos paquetes, deuda técnica a revisar).
- Stripe: ninguna dependencia (eliminado).
- Email: ninguna dependencia.
- Analytics: ninguna librería dedicada, solo `gtag` propio.
- `@react-pdf/renderer` presente — relevante para la futura "exportación de informes" de Plus.

No se detectaron secretos ni claves hardcodeadas en los archivos revisados.

---

## 2. Riesgos y deuda técnica (priorizados)

1. **Alto — Confirmación de escritura de IA no configurable por usuario.** El mecanismo existe pero se activa por variable de entorno global, no por ajuste. Bloquea directamente la decisión de producto "confirmación antes de acciones de escritura, configurable en ajustes". Necesario antes de ampliar el uso de IA con escritura real de datos.
2. **Alto — `dangerouslyAllowBrowser: true` en el cliente OpenAI.** Riesgo de exposición de API key si el cliente llega a ejecutarse en el navegador. Requiere confirmar el flujo real antes de tocar el agente.
3. **Alto — Ausencia total de correos transaccionales.** Ningún proveedor de email integrado. Bloquea trial, avisos de límite, facturación y cancelación — piezas necesarias para la fase de monetización.
4. **Medio-alto — Dos arquitecturas de agente IA conviviendo (v1 y v2)** sin confirmar cuál está activa en producción. Riesgo de mantener/duplicar lógica muerta o de tocar la versión equivocada.
5. **Medio — Modelo de acceso "apagado" en vez de ausente.** `access-control.ts` conserva el tipo `Profile` con campos de Stripe/tier/trial, pero la lógica los ignora. Hay que decidir si se reutiliza ese esquema o se rediseña para las nuevas reglas (30 gastos/mes, modo consulta, trial de 30 días).
6. **Medio — Migraciones locales insuficientes para reconstruir el esquema real.** Solo 2 archivos de migración versionados frente a un esquema con al menos 6 tablas en uso. Alto riesgo de desincronización entre lo que se audita en código y lo que hay realmente en Supabase.
7. **Medio — Documentación fragmentada y parcialmente duplicada.** Dos `PROJECT_STATUS.md` (raíz y `docs/`), dos `CONTEXT.md` (raíz y `.ai/`), y un `CLAUDE.md` vacío. Riesgo de que futuras sesiones/agentes editen el archivo equivocado.
8. **Bajo-medio — Mezcla de `@supabase/auth-helpers-nextjs` (deprecado) y `@supabase/ssr`.** Deuda técnica de dependencias, no bloqueante a corto plazo pero a resolver antes de tocar auth.
9. **Bajo — No hay rate-limiting confirmado en las rutas de IA.** Relevante para controlar costes de OpenAI antes de escalar uso; pendiente de confirmar en revisión adicional de `middleware.ts` y rutas.
10. **Bajo — No hay eventos de Analytics para el futuro modelo de negocio** (trial, límite alcanzado, alta/baja Plus). Fácil de añadir siguiendo el patrón ya existente en `src/lib/analytics.ts`, pero hay que definir el listado antes de implementar.

---

## 3. Dependencias externas que debe revisar el propietario

Estos puntos **no se han verificado ni se pueden verificar desde el código** en esta auditoría; requieren acceso directo del propietario a los paneles correspondientes:

- **Supabase:** estado real de RLS, si `20260217_security_audit.sql` está aplicado en producción, extensión `pgvector` e índices de embeddings, volumen de usuarios/datos existentes (necesario para poder identificar de forma fiable a los "usuarios existentes" que conservan acceso gratuito permanente), configuración de las plantillas de email de Supabase Auth.
- **Stripe:** no hay cuenta/integración activa en código; hay que decidir si se reutiliza una cuenta Stripe existente (con productos/precios históricos) o se crea de cero para los planes Plus (2,99 €/mes, 29,99 €/año, impuestos incluidos).
- **Fiscalidad:** el precio se define como "impuestos incluidos" — el propietario debe confirmar tratamiento de IVA/impuestos digitales según país del cliente (relevante para Stripe Tax u obligaciones similares) y el proceso de devoluciones manuales anunciado en las decisiones de producto.
- **Correos:** elección de proveedor (p. ej. Resend, Postmark) y verificación de dominio de envío — no arrancado.
- **AdSense y afiliados:** no hay ninguna integración en el código auditado (ni AdSense ni programas de afiliados). Al estar restringidos a "contenido público, nunca dentro de la app", probablemente corresponden al sitio de contenido/blog más que a `src/app` — pendiente de decidir ubicación técnica en la fase correspondiente.
- **Amazon (afiliados):** sin integración existente; a evaluar en la fase de publicidad/afiliación, después de ciclos libres, IA e integración de pagos, según el orden de prioridad ya decidido.

---

## 4. Propuesta de orden de implementación por fases (sin código)

Sigue el orden de prioridad ya decidido: **ciclos libres → IA afinada → pagos → publicidad/afiliación**, con la documentación/contexto y la validación como parte de cada fase, y un único commit selectivo + push al cierre de cada una.

**Fase 1 — Ciclos libres y control de gastos**
Implementar el contador de 30 gastos por mes natural, el "modo consulta" al alcanzarlo, y el reseteo el día 1. Reutilizar el bloqueo de mes cerrado ya existente como base. Decidir cómo conviven "ciclos libres" (decisión de producto para el plan gratuito) con el límite de 30 gastos.

**Fase 2 — IA afinada**
Resolver primero cuál arquitectura de agente (v1/v2) queda como única activa y retirar la otra. Exponer la confirmación de escritura como ajuste de usuario (hoy es solo variable de entorno). Confirmar y, si procede, corregir el uso de `dangerouslyAllowBrowser`. Añadir el paso "preguntar el ciclo antes de analizar" a los flujos de análisis. Definir memoria individual por defecto y diseñar el opt-in explícito y anonimizado para aprendizaje colectivo (hoy no existe distinción). Revisar/añadir límites de uso y telemetría de coste ya con datos reales de `learning-metrics.ts` y `metrics.ts`.

**Fase 3 — Pagos (Plus)**
Reintroducir Stripe (cuenta, productos, precios 2,99 €/mes y 29,99 €/año impuestos incluidos, checkout, portal, webhook) y reactivar la lógica de tiers en `access-control.ts` (hoy neutralizada). Implementar la regla de trial de 30 días sin tarjeta para usuarios nuevos y el acceso gratuito permanente para usuarios existentes (requiere el corte de fecha/lista de usuarios existentes, ver dependencia de Supabase en la sección 3). Añadir correos transaccionales (bienvenida, fin de trial, cobro, cancelación) — hoy inexistentes. Implementar cancelación con acceso hasta fin de periodo y proceso de devoluciones manual.

**Fase 4 — Publicidad y afiliación**
Integrar Amazon Afiliados primero, en contenido público únicamente (nunca dentro de la app). Evaluar AdSense u otras redes después. Ubicar técnicamente esta integración fuera de `src/app` (zona autenticada) para respetar la decisión de producto.

Cada fase debería cerrar con: actualización de `CONTEXT.md` (o `PROJECT_STATUS.md` si el cambio es de ámbito SEO/frontend), validación (build, lint, tests), y un commit selectivo con mensaje descriptivo + push, siguiendo el flujo de trabajo ya decidido.

---

## 5. Criterios de aceptación y pruebas por fase

**Fase 1 — Ciclos libres**
- Un usuario free no puede crear el gasto nº 31 del mes natural; la UI/API responde en "modo consulta" (lectura permitida, escritura bloqueada) hasta el día 1 o hasta que se suscriba.
- El contador se resetea correctamente al cambiar de mes natural, sin depender del cierre manual de mes ya existente.
- Test automatizado que cubra: gasto 29 (permitido), gasto 30 (permitido, límite alcanzado), gasto 31 (bloqueado), reseteo el día 1.
- Sin regresión en el bloqueo de mes cerrado ya existente (`status === "closed"`).

**Fase 2 — IA afinada**
- Una sola arquitectura de agente activa; la otra retirada o marcada explícitamente como no usada, con test o comprobación manual de que el frontend solo llama a la vigente.
- Ajuste de usuario visible y persistente para activar/desactivar la confirmación de escritura; una acción de escritura de IA sin confirmación previa nunca se ejecuta si el ajuste está activado.
- `dangerouslyAllowBrowser` confirmado como innecesario y eliminado, o justificado documentalmente si hay un uso legítimo en cliente.
- El asistente pregunta el ciclo/mes antes de responder a un análisis, verificable con una conversación de prueba.
- Memoria individual funcionando por defecto; aprendizaje colectivo desactivado por defecto y solo activable explícitamente, con los datos agregados de forma anonimizada verificable.

**Fase 3 — Pagos**
- Checkout y portal de Stripe funcionando en modo test antes de producción; webhook actualiza `tier`/`stripe_customer_id`/`subscription_id` correctamente en `profiles`.
- Usuario nuevo: 30 días de trial completo sin pedir tarjeta, verificable desde el registro.
- Usuario existente (según corte definido con el propietario): acceso completo permanente sin trial ni cobro.
- Al expirar trial sin suscripción: pasa a plan gratuito con el límite de 30 gastos/mes ya implementado en la Fase 1.
- Cancelación: el usuario conserva acceso Plus hasta el final del periodo ya pagado, verificable con fecha de expiración correcta.
- Correos transaccionales de bienvenida, aviso de fin de trial, confirmación de cobro y cancelación, entregados y con contenido correcto (verificar en bandeja de pruebas antes de producción).

**Fase 4 — Publicidad y afiliación**
- Enlaces de afiliados de Amazon visibles solo en páginas de contenido público (blog/landing), ausentes en cualquier ruta de `src/app` autenticada — verificable por inspección de rutas.
- Evento de Analytics de clic en afiliado implementado, siguiendo el patrón de `src/lib/analytics.ts`.

---

## 6. Decisiones de producto ya cerradas (registradas para referencia de las siguientes fases)

- Usuarios existentes: acceso completo gratuito permanente.
- Nuevos usuarios: 30 días de prueba completa sin tarjeta.
- Después del trial: versión gratuita con 30 gastos por mes natural.
- Al llegar a 30 gastos: modo consulta hasta el día 1 o suscripción.
- Plus: 2,99 €/mes y 29,99 €/año, impuestos incluidos. Incluye gastos ilimitados, IA y exportación de informes.
- Gratis conserva ciclos libres, análisis básicos, ajustes y consulta.
- Cancelación: acceso hasta el final del periodo pagado. Devoluciones: gestión manual y personalizada.
- IA inicialmente en español. Prioridades: registro natural, búsqueda/corrección/edición, consultas fiables sobre datos, análisis de hábitos.
- Confirmación antes de acciones de escritura, configurable en ajustes. Análisis de IA: preguntar el ciclo antes de analizar.
- Aprendizaje: memoria individual por defecto; aprendizaje colectivo solo opcional y anonimizado.
- Anuncios y afiliados solo en contenido público, nunca dentro de la app. Amazon primero; bancos/fintech después.
- Prioridad de desarrollo: ciclos libres → IA afinada → pagos → publicidad/afiliación.
- Flujo de trabajo: una fase completa, documentación/contexto actualizado, validación, un único commit selectivo y push.
