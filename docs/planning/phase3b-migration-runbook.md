# Fase 3.B — Runbook de migraciones (MODO COMPATIBLE)

> **Actualización 2026-10-09 (verificación de solo lectura, sustituye a §1):** en Supabase **existen** los objetos de las
> migraciones compatibles (`fn_create_expense`, `fn_recompute_plus_access_until`, `founder_cutoff`, `subscriptions`,
> `expense_monthly_usage`, `stripe_webhook_events`, `first_expense_activations`, trigger `trg_protect_profile_access_columns`)
> y el esquema de backup `phase3b_backup`; no aparecen en el registro de migraciones (aplicadas por SQL Editor), así que su
> aplicación se deduce de los objetos. Las 4 migraciones del pack premium (`20261007000001..04`) constan aplicadas el 2026-10-08.
> **No existen** `fn_resolve_access_state` ni `access_grants` (freemium no activado). Vercel: `www.metodokakebo.com` sirve
> el commit `90c300e` (CLI, 2026-10-08), no `41a4c98`. **Pendiente:** ejecutar §12–13 (`phase3b_verify.sql`, 0 FAIL) y
> registrar el resultado. Detalle: `docs/handoff/ESTADO_2026-10-09.md` §0.
>
> Estado original (2026-10-06, histórico): **preparado y probado en local; NO aplicado a Supabase; NO desplegado**.
> Nada de este documento activa el modelo freemium. Ejecutar cualquier SQL contra Supabase requiere
> autorización explícita del propietario.
> **Limitación de verificación:** el estado de Vercel y Supabase descrito aquí es **evidencia fechada** (2026-10-05),
> no una consulta en tiempo real. No se ha vuelto a verificar en la revisión del 2026-10-06.

## 0. Decisión de producto vigente (capa gratuita)

Decisión del propietario, **todavía NO activada en código ni en producción** (ver ADR-003 en `ADRs.md`):

| Capa gratuita (free) | Detalle |
|---|---|
| Gastos | **Máximo 30 gastos al mes** |
| Chatbot / IA conversacional | **No** disponible |
| Informes PDF | **No** disponibles |
| Funciones premium / Plus | **No** disponibles |
| Trial | **PENDIENTE DE DECISIÓN DEL PROPIETARIO** (si habrá trial y, en su caso, su duración) |
| Usuarios existentes | Conservan sus privilegios actuales (concesión `legacy_full`, script diferido 04) |

**Definición temporal del límite (ya implementada en los scripts, no se cambia):** *mes natural en zona horaria
`Europe/Madrid`*; el periodo es `to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM')` calculado en servidor en el
momento de **crear** el gasto, y el contador (`expense_monthly_usage`) cuenta creaciones: borrar un gasto no lo decrementa.
Es independiente de los ciclos libres de la Fase 1. Réplica TypeScript no cableada: `getExpensePeriodKey` en `src/lib/auth/access-state.ts`.

**Trial — qué NO se afirma.** La duración de 14 días (`supabase_migration_saas.sql`, commit `8346acc`, febrero de 2026) y la
de 30 días (diseño de Fase 3, septiembre de 2026) son valores **históricos o de diseño, no verificados ni vigentes**. No se ha
confirmado la definición actual de `handle_new_user` en producción. El script diferido `01_access_foundation.sql` contiene
`interval '14 days'` como **valor provisional heredado**: debe revisarse (y decidirse si hay trial) **antes** de aplicarlo.

## 1. Evidencia fechada de producción (2026-10-05 — SUPERADA por la verificación del 2026-10-09, ver cabecera)

- **Vercel (comprobación documentada del 2026-10-05):** el dominio público servía el deployment **41a4c98**
  (rollback manual del 2026-10-01, con la nota "Supabase migrations pendientes; rollback temporal hasta aplicar la base de datos").
  Los commits 2153647 → 968d4d1 estaban *Ready* pero **no promovidos** a ese dominio.
- **Supabase (comprobación de solo lectura del 2026-10-05):** faltaban `fn_create_expense`, `fn_resolve_access_state`,
  `fn_recompute_plus_access_until` y las tablas `founder_cutoff`, `subscriptions`, `expense_monthly_usage`,
  `stripe_webhook_events` y `first_expense_activations`; la tabla de migraciones de Supabase estaba vacía (no se usa `db push`).
- **Riesgo:** el código posterior a 41a4c98 **llama a `fn_create_expense`** (POST /api/expenses, asistente legado, agent-v2) y lee
  `first_expense_activations`. **Promover ese código sin aplicar antes las migraciones compatibles podría romper la creación de gastos.**
- **Conclusión operativa:** **mantener la producción actual (41a4c98) y NO promover el código posterior** hasta completar las
  migraciones compatibles (§3) y sus verificaciones (§12–13). Decisión de promoción: del propietario.
- Stripe sigue desactivado; el checkout y la descarga premium permanecen cerrados (`PREMIUM_COMMERCE_ENABLED` apagado).

## 2. Modo compatible vs. modelo freemium

| | **Modo compatible** (lo que se aplica ahora) | **Freemium** (diferido, `supabase/deferred/freemium/`) |
|---|---|---|
| Límite de gastos | **Ninguno.** Nunca aparece `KB001` | 30 gastos/mes (mes natural Europe/Madrid) para usuarios free |
| Trial | No se modifica `handle_new_user` (el alta queda como esté en producción) | **PENDIENTE DE DECISIÓN DEL PROPIETARIO** (el script 01 trae 14 días provisionales) |
| IA y PDF | Disponibles para todos (la app no los restringe) | Free: **sin** IA ni PDF; Plus/legacy: con ellos |
| Usuarios existentes | Sin cambios | Conservan todo vía `access_grants` (`legacy_full`) |
| `fn_create_expense` | Valida, inserta y **cuenta** (métrica) | Además aplica el límite |
| INSERT directo en `expenses` | Permitido | Cerrado (05) |
| `handle_new_user` | **No se toca** | Reemplazado (01) |

Hoy la app ya es permisiva por código: `canUsePremium(profile) = profile !== null` (`src/lib/auth/access-control.ts`);
`src/lib/auth/access-state.ts` (6 estados, límite 30) existe pero **no se importa en ninguna parte** de la app. Un test
(`compat-mode-access.test.ts`) vigila que siga así. **Activar el modelo free exige, además de los scripts SQL, cablear en
la app los permisos de IA/chatbot y de informes PDF por estado** (§18).

## 3. Migraciones aplicables AHORA (en orden)

1. `20260916_phase3b_monetization_foundation.sql` — columnas inertes en `profiles`; tablas de infraestructura;
   `fn_create_expense` (sin límite); `fn_recompute_plus_access_until` (sin uso).
2. `20260917_phase3b_profiles_hardening.sql` — trigger que impide a `anon`/`authenticated` modificar
   `is_founder`, `founder_captured_at`, `plus_access_until`, `manual_override`, `tier`, `trial_started_at`,
   `trial_ends_at`; revoca por nombre `EXECUTE` de funciones sensibles. `service_role` y las funciones
   `SECURITY DEFINER` no se ven afectados (`grant-vip` y `list-vip-users` siguen funcionando).
3. `20261001_first_expense_activation.sql` — marca de primera activación (métrica): PK por usuario,
   `ON CONFLICT DO NOTHING`, `expense_id ON DELETE SET NULL` (borrar el primer gasto no reabre la activación).

Hallazgo de seguridad que corrige la 2: la política "Users can update their own profile" (sin `WITH CHECK`) +
`GRANT UPDATE` permite hoy que cualquier usuario se ponga `manual_override = true` desde el navegador.

## 4. Scripts diferidos (NO aplicar) — `supabase/deferred/freemium/`

`01_access_foundation` · `02_usage_backfill` · `04_legacy_access_grants` · `03_enforce_expense_limit` (**único que
activa el límite de 30 gastos**) · `05_close_direct_expense_insert` · `rollback_freemium`. Cada uno aborta salvo
`SET kakebo.freemium_activation = 'confirmed';` (el rollback: `kakebo.freemium_rollback`) y va en una sola transacción.
Orden futuro: 01 → 02 → 04 → 03 → 05. El 03 se niega a ejecutarse si algún usuario existente no tiene `legacy_full`.
Antes del 01 hay que **resolver la decisión de trial** (§0).

## 5. Qué NO se debe ejecutar todavía

Todo lo de `supabase/deferred/`; `supabase/manual-ops/founder_capture_activation.sql` (captura de fundadores: ligada
a la activación comercial); `supabase/manual-ops/phase3b_permission_hardening.sql` (REVOKE manual comentado; el 05 lo
sustituye en la activación); cualquier script de Stripe; `supabase/rollback/phase3b_rollback.sql` salvo emergencia.
`supabase/tests/phase3b_security_checks.sql` contiene secciones del modelo freemium (`fn_resolve_access_state`, límite):
solo son válidas **después** de 01–03.

## 6–8. Trial, límite, IA y PDF (estado actual y decisión)

- **Trial:** **PENDIENTE DE DECISIÓN DEL PROPIETARIO.** No se confirma duración alguna en producción. Antes de aplicar nada,
  ejecutar `supabase/tests/phase3b_prod_baseline.sql` §2 para conocer la definición real de `handle_new_user`. Además, hoy la app
  no usa el trial para restringir nada. El modo compatible no redefine `handle_new_user`, así que no cambia el comportamiento de alta.
- **Límite de 30 gastos/mes:** decisión vigente para la capa gratuita, **no activa**. No existe en ninguna migración aplicable
  (tests estático y SQL real: 45 gastos sin `KB001` en modo compatible). Solo lo activa `03_enforce_expense_limit.sql`.
- **IA/chatbot y PDF:** decisión vigente = **no** para free. **Hoy** están disponibles para todos los usuarios autenticados
  (`canUsePremium` siempre true; `ReportButton`/`ReportDialog` no consultan acceso).

## 9–10. Usuarios existentes y estrategia legacy (futura)

No se modifica ningún dato de usuario. Cuando llegue freemium, el script 04 inserta `legacy_full` para **todos** los
perfiles existentes en ese momento (idempotente), cubriendo:

| Caso | Tratamiento futuro |
|---|---|
| Usuarios actuales | `legacy_full` → conservan todo |
| `tier = 'pro'` | `legacy_full`; el dato `tier` no se toca |
| `manual_override = true` (VIP) | `legacy_full` (motivo registrado); `manual_override` no se toca |
| `trial_ends_at` NULL | `legacy_full` (nunca quedan como free limitado) |
| Suscripciones Stripe | `legacy_full`; `subscriptions`/`plus_access_until` los gestiona 3.C |
| Entran antes de activar | Cubiertos por 04 (se repite justo antes del 03 por si entra alguien) |
| Entran después de activar | Free: 30 gastos/mes, sin IA ni PDF. **Trial: PENDIENTE DE DECISIÓN DEL PROPIETARIO** |

Nadie se convierte ahora en fundador ni Pro (`is_founder` y `plus_access_until` quedan en su valor neutro).

## 11. Backup (obligatorio antes de aplicar)

1. `supabase/tests/phase3b_prod_baseline.sql` (solo lectura): guardar resultados (definición de `handle_new_user`, columnas, políticas, recuentos).
2. `supabase/manual-ops/phase3b_pre_apply_snapshot.sql`: crea `phase3b_backup.*` (perfiles, resúmenes de gastos, funciones, privilegios, políticas, triggers), con RLS y sin acceso para clientes.
3. Backup/PITR de Supabase propio del proveedor.

## 12–13. Orden de aplicación y verificación

1. Backup (§11). 2. Aplicar 20260916 → 20260917 → 20261001 (SQL Editor, cada una en su pestaña; son idempotentes).
3. Ejecutar `supabase/verification/phase3b_verify.sql`: **0 filas FAIL**. (La comprobación "handle_new_user conserva el trial de 14 días"
asume el valor histórico: si falla o no aplica, revisar la definición real — no es en sí un fallo de la migración, y el resultado **no**
confirma la política de trial.) 4. Comparar con la foto: `profiles` sin diferencias en `tier`, `manual_override`, `trial_ends_at`.
5. Crear un gasto de prueba por cada canal (web, asistente legado, agente) en un entorno de preview. 6. Solo entonces, valorar la promoción (§16).

## 14. Rollback

- **Compatible**: `supabase/rollback/phase3b_rollback.sql` (`SET kakebo.phase3b_rollback = 'confirmed'`). Se niega si freemium está o estuvo activo;
  solo borra tablas **vacías** (conserva `expense_monthly_usage`/`first_expense_activations` con datos); no toca `profiles` ni `expenses`.
  **Antes**, volver Vercel a un deployment que no use `fn_create_expense` (p. ej. 41a4c98).
- **Freemium → compatible**: `supabase/deferred/freemium/rollback_freemium.sql` (sin borrar datos; deja `access_grants` como registro inerte).

## 15. Riesgos

- PGlite (Postgres en memoria) valida la lógica, no es Supabase: `phase3b_verify.sql` en staging/producción es la verificación final.
- `handle_new_user` real en producción **no verificada**; si el propietario decide trial, el valor debe fijarse explícitamente (el 01 trae 14 días provisionales).
- El trigger de `profiles` rechaza a `authenticated` cualquier cambio de `tier`/`trial_*`: ningún código de la app los escribe desde sesión de usuario (verificado por búsqueda en `src/`), pero revisar integraciones externas.
- `20261001`: si la tabla ya existía con `expense_id NOT NULL ON DELETE CASCADE`, la migración la corrige.
- **Promover Vercel antes de aplicar las migraciones puede romper la creación de gastos.**
- Desfase documental: parte de la documentación histórica (README v4.0.0, ADR-001, CONTEXT) describe el producto como gratuito sin límites; prevalece la nota vigente de cada documento.

## 16. Antes de promocionar Vercel

- **No promover hasta** aplicar las migraciones compatibles y obtener `phase3b_verify.sql` sin FAIL. Variables de entorno de Vercel: `SUPABASE_SERVICE_ROLE_KEY` definida.
- `PREMIUM_COMMERCE_ENABLED` sin definir (apagado). Probar el preview (`*.vercel.app`) con un gasto real de cada canal.
- Reactivar "auto-assign custom domains" o **Promote to Production** del deployment verificado (decisión del propietario). Volver a comprobar el estado actual de Vercel y Supabase, porque la evidencia de §1 está fechada.

## 17. Pendiente para Stripe

Producto/Price, webhook firmado + `stripe_webhook_events`, `subscriptions` + `fn_recompute_plus_access_until`, tabla de compras/entitlements,
entrega protegida del pack premium, textos legales (ver auditoría legal), eventos de analítica de compra.

## 18. Pendiente para freemium

- **Decisión del trial** (existencia y duración) — PENDIENTE DE DECISIÓN DEL PROPIETARIO — y ajuste del script 01 en consecuencia.
- Reflejar `legacy_full` en `access-state.ts` y cablear los permisos por estado: **sin chatbot/IA conversacional y sin informes PDF para free**
  (hoy no están cableados), con su copy/UX de límite (KB001).
- Aplicar 01 → 02 → 04 → 03 → 05 con backup y verificación; comunicar el cambio a los usuarios.

## Pruebas de esta fase

`src/__tests__/security/phase3b-sql-behavior.test.ts` ejecuta migraciones, hardening, scripts diferidos, rollbacks, verify y snapshot en un Postgres real en memoria
(`@electric-sql/pglite`, devDependency). `migration-permission-hardening.test.ts`, `compat-mode-access.test.ts`, `auth-users.test.ts` y
`vip-admin-pagination.test.ts` completan la cobertura. `grant-vip`/`list-vip-users` ahora paginan `auth.admin.listUsers()` (antes solo veían los primeros 50 usuarios).
