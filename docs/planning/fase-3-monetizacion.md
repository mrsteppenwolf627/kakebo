> **ACTUALIZACIÓN 2026-10-06 — MODO COMPATIBLE.** Este documento describe el diseño del modelo freemium completo
> (trial de 30 días, límite de 30 gastos, fundadores). **No es lo que se aplica ahora.** Hoy Kakebo conserva su comportamiento
> actual (trial de 14 días, sin límite de gastos, IA y PDF disponibles) y el modelo freemium vive, inactivo, en
> `supabase/deferred/freemium/`. Procedimiento vigente: `docs/planning/phase3b-migration-runbook.md`. Donde este documento
> diga "30 días de prueba" o "límite activo", léase como diseño futuro, con la prueba de 14 días.

# Fase 3.B — Infraestructura de acceso, fundadores, prueba y límite gratuito

> **IMPLEMENTACIÓN LOCAL PREPARADA, NO APLICADA NI PUBLICADA.**
> Repositorio: `C:\Users\a.alarcon\Desktop\Cursor projects\kakebo` (HEAD `41a4c98` en el
> momento de esta implementación, 2026-09-16). Nada de lo descrito aquí se ha
> commiteado, empujado, aplicado contra Supabase remoto, desplegado en Vercel, ni
> ejecutado contra Stripe.

El contrato de acceso (6 `AccessState`, fundadores permanentes, prueba de 30 días,
límite gratuito de 30 gastos/mes natural Europe/Madrid, IA y exportación
restringidas a prueba/Plus/fundador) se implementó como código y migraciones
**locales**, en el árbol de trabajo de este repositorio, adaptado a la
arquitectura real encontrada aquí (distinta de un intento anterior hecho por
error en `kakebo/kakebo`, un submódulo/repo antiguo — ver nota al final).

## Correcciones aplicadas (2026-09-16, segunda pasada)

**1. Secciones de permisos aplazadas — ya no viven en la migración aplicable.**
Un comentario "pendiente de preflight" dentro de un archivo `.sql` no impide
que sus sentencias se ejecuten al aplicar la migración. Se corrigió: la
migración base (`20260916_phase3b_monetization_foundation.sql`) ya **no**
contiene ningún `REVOKE`/`DROP POLICY` sobre `profiles`/`expenses` — solo
prepara esquema y funciones RPC, y es segura de aplicar sola sin cambiar
ningún comportamiento de acceso existente. El endurecimiento real se movió a
`supabase/manual-ops/phase3b_permission_hardening.sql`, un script aparte que:
empieza con 6 comprobaciones de preflight explícitas (grants reales, triggers,
políticas completas de `profiles`), y mantiene las sentencias `REVOKE`/`DROP
POLICY` **comentadas** dentro de un bloque `-- BEGIN; ... -- COMMIT;` que
requiere descomentarlo a mano tras revisar el preflight — no se ejecuta ni
aunque se corra el archivo entero sin editarlo. Verificado con un test
estático (`src/__tests__/security/migration-permission-hardening.test.ts`) que
lee ambos archivos y confirma, línea por línea, que ninguna sentencia
destructiva sobrevive fuera de un comentario.

**2. Acceso Plus con múltiples suscripciones — recálculo agregado, no copia ciega.**
El diseño anterior de 3.C escribía `profiles.plus_access_until` copiando
directamente el `current_period_end` de la suscripción que el webhook acababa
de procesar — con dos suscripciones por usuario (una antigua y otra vigente),
un webhook tardío de la antigua podría pisar el acceso concedido por la
vigente. Corregido: se añadió `CONSTRAINT subscriptions_stripe_subscription_id_key
UNIQUE (stripe_subscription_id)` (un `stripe_subscription_id` nunca puede
pertenecer a dos usuarios) y `idx_subscriptions_user_id`, más la función
`fn_recompute_plus_access_until(user_id)`, que **siempre** recalcula
`plus_access_until` como el `MAX(current_period_end)` entre todas las
suscripciones locales del usuario cuyo periodo no ha terminado — nunca copia
una sola fila. El diseño futuro de 3.C queda documentado dentro de la propia
migración (comentario junto a la función): serializar por
`stripe_subscription_id` **y** por `user_id`, actualizar la fila tocada con el
estado canónico de Stripe, y llamar siempre a esta función en vez de escribir
`plus_access_until` a mano. Qué valores de `status` de Stripe cuentan
exactamente como "con derecho de acceso" queda deliberadamente sin fijar —
decisión explícita de 3.C — mientras que el criterio mínimo ya implementado
(`current_period_end > now()`) es correcto independientemente de esa decisión
futura. Verificado con tests estáticos adicionales en el mismo archivo de
seguridad, y con un escenario documentado (no ejecutado, sin Postgres local)
en `supabase/tests/phase3b_security_checks.sql` §9.

## Archivos nuevos/modificados

| Archivo | Qué es |
|---|---|
| `src/lib/auth/access-state.ts` | Resolvedor central de acceso (puro, sin UI ni red) — los 6 `AccessState` + matriz de permisos |
| `src/__tests__/lib/auth/access-state.test.ts` | 22 tests del resolvedor |
| `supabase/migrations/20260916_phase3b_monetization_foundation.sql` | Migración completa: columnas nuevas en `profiles`, tablas `founder_cutoff`/`subscriptions`/`expense_monthly_usage`/`stripe_webhook_events`, `handle_new_user` con lock advisory + trial 30 días, `fn_resolve_access_state`, `fn_create_expense` (incluye `p_subcategory`), `fn_recompute_plus_access_until`. **Ya no contiene ningún `REVOKE`/`DROP POLICY`** — solo esquema y RPC, segura de aplicar sola |
| `supabase/manual-ops/founder_capture_activation.sql` | Procedimiento manual de activación de fundadores (`LOCK TABLE` + captura + verificación en una transacción) — **no ejecutado, no se ejecuta hasta el lanzamiento real** |
| `supabase/manual-ops/phase3b_permission_hardening.sql` | **Nuevo**: endurecimiento de permisos (`REVOKE INSERT` en `expenses`, `REVOKE UPDATE`/`DROP POLICY` en `profiles`), con 6 comprobaciones de preflight y las sentencias destructivas comentadas — requiere edición manual explícita para ejecutarse |
| `supabase/tests/phase3b_security_checks.sql` | Comprobaciones SQL de seguridad — documentadas, no ejecutables en este entorno (sin Postgres local); incluye §9 (UNIQUE + recálculo multi-suscripción) |
| `src/__tests__/security/migration-permission-hardening.test.ts` | **Nuevo**: test estático real (ejecutado, en verde) que verifica que la migración base no tiene `REVOKE`/`DROP POLICY` activos, que el script de endurecimiento los mantiene comentados, y que `fn_recompute_plus_access_until` existe, agrega por `user_id` y no está expuesta a `authenticated` |
| `src/app/api/expenses/route.ts` | Ruta manual migrada a `fn_create_expense` (RPC), preservando la resolución de ciclo libre (Fase 1) ya existente en este repo |
| `src/lib/ai/tool-executor.ts` | Asistente legado (`/api/ai/assistant`) migrado a la misma RPC — conserva su resolución de mes natural preexistente, sin cambios de comportamiento |
| `src/lib/agents/tools/create-transaction.ts` | Compartido por agent-v2 (chat y streaming) — rama de gasto migrada a la RPC (incluye `subcategory`, Fase 2.B); rama de ingreso sin cambios |
| `src/lib/api/errors.ts` | Mapeo de los códigos `KB001` (límite alcanzado → 409) y `KB002` (validación/propiedad → 400 genérico, sin fuga de datos) |
| `src/__tests__/api/expenses.test.ts` | Adaptado a `.rpc()`; añadidos casos de límite alcanzado y error genérico |
| `src/__tests__/agents/tools/create-transaction.test.ts` | Adaptado a `.rpc()` en los casos de gasto; añadido caso de límite alcanzado |
| `src/__tests__/lib/ai/tool-executor-create-expense.test.ts` | Nuevo — cubre el canal del asistente legado usando la RPC |

## Diferencias reales encontradas frente al repo equivocado (auditadas antes de tocar nada)

Este repositorio está más avanzado que el árbol donde se implementó 3.B por error:
- **Ciclos libres (Fase 1)**: `POST /api/expenses` y `create-transaction.ts` ya
  usan `src/lib/months.ts` (`getOpenMonth`/`getOrCreateMonth`) — un gasto se
  imputa al ciclo *abierto* del usuario, no al mes natural de su fecha. El
  asistente legado (`tool-executor.ts`) **no** usa este modelo todavía (resuelve
  por mes natural) — divergencia preexistente, no corregida aquí por no ser
  parte del alcance de esta tarea.
- **Fase 1.1** (ya corregida en este repo, no en el otro): `POST /api/expenses`
  ya validaba propiedad y cierre de un `month_id` explícito antes de mi cambio.
  `fn_create_expense` revalida lo mismo como defensa en profundidad, sin
  duplicar lógica de negocio nueva.
- **Fase 2.B (subcategoría)**: `expenses.subcategory` existe de verdad en este
  esquema (migración `20260914_add_expense_subcategory.sql`, con `CHECK`
  restringido al catálogo de `src/lib/subcategories.ts`). `fn_create_expense`
  incluye `p_subcategory`; no se revalida el catálogo en SQL porque el `CHECK`
  ya existente lo hace.
- Grants confirmados también aquí por `supabase/migrations/20260217_security_audit.sql`
  (línea 24-25: `GRANT ... ON public.profiles/expenses TO authenticated`) —
  refuerza, sin sustituir, la necesidad de la verificación remota puntual antes
  de ejecutar `supabase/manual-ops/phase3b_permission_hardening.sql` (ver
  corrección 1 más abajo).

## Qué requerirá tu aprobación manual más adelante

1. **Aplicar la migración base** (`20260916_phase3b_monetization_foundation.sql`)
   contra un entorno de prueba real (no hay Postgres local configurado en este
   repo) — segura de aplicar sola, no cambia el comportamiento de acceso
   existente (no toca ningún grant).
2. **Desplegar el código de las 3 rutas junto con la migración**, nunca por
   separado.
3. **Verificar en producción que las 3 rutas ya usan `fn_create_expense`**
   (creando un gasto de prueba real por cada canal).
4. **Preflight remoto y ejecución de `supabase/manual-ops/phase3b_permission_hardening.sql`**
   — solo después de 1-3, y solo tras revisar sus 6 comprobaciones de
   preflight; las sentencias `REVOKE`/`DROP POLICY` están comentadas dentro
   del script y requieren edición manual explícita para aplicarse.
5. **Ejecutar `founder_capture_activation.sql`** — una sola vez, manualmente,
   el día real de activación, después de que Stripe (3.C) esté operativo.
6. **3.C completo** (Checkout, webhooks reales, `stripe.subscriptions.retrieve`,
   serialización por `stripe_subscription_id` **y** `user_id`, y uso exclusivo
   de `fn_recompute_plus_access_until` para actualizar el acceso) — el esquema
   (`subscriptions`, `stripe_webhook_events`) está preparado pero sin ninguna
   lógica de Stripe implementada todavía.

## Nota sobre el intento anterior en el repositorio equivocado

Una implementación anterior de esta misma Fase 3.B se hizo por error en
`C:\Users\a.alarcon\Desktop\Cursor projects\kakebo\kakebo` (un submódulo/repo
antiguo, historial de SEO/Fintonic, no el repo de la app). Esos cambios se
dejaron **intactos y sin tocar** por instrucción explícita del propietario —
no se leyeron, copiaron, movieron ni borraron durante esta reimplementación.
Este documento y los archivos listados arriba son la única implementación
válida de 3.B.
