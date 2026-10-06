# Fase 3.B — Runbook de migraciones (MODO COMPATIBLE)

> Estado: **preparado y probado en local; NO aplicado a Supabase; NO desplegado**. Última revisión: 2026-10-06.
> Nada de este documento activa el modelo freemium. Ejecutar cualquier SQL contra Supabase requiere
> autorización explícita del propietario.

## 1. Estado actual de producción (a 2026-10-06)

- Vercel sirve **41a4c98** (rollback manual del 1-oct: "Supabase migrations pendientes"). Los commits
  2153647 → 968d4d1 están desplegados (Ready) pero **no promovidos**.
- La base de datos de producción **no tiene** `fn_create_expense`, `fn_resolve_access_state`,
  `fn_recompute_plus_access_until`, ni las tablas `founder_cutoff`, `subscriptions`,
  `expense_monthly_usage`, `stripe_webhook_events`, `first_expense_activations` (comprobado el 2026-10-05
  con consultas de solo lectura; la tabla de migraciones de Supabase está vacía: no se usa `db push`).
- El código desde 2153647 **llama a `fn_create_expense`** (POST /api/expenses, asistente legado, agent-v2) y lee
  `first_expense_activations`. Por eso **no se debe promover** hasta aplicar las migraciones compatibles.
- Stripe sigue desactivado; el checkout y la descarga premium permanecen cerrados (`PREMIUM_COMMERCE_ENABLED` apagado).

## 2. Modo compatible vs. modelo freemium

| | **Modo compatible** (lo que se aplica ahora) | **Freemium** (diferido, `supabase/deferred/freemium/`) |
|---|---|---|
| Límite de gastos | **Ninguno.** Nunca aparece `KB001` | 30 gastos/mes para usuarios free nuevos |
| Trial | **14 días** (alta de usuarios sin tocar) | 14 días (misma duración) |
| IA y PDF | Disponibles para todos | Solo trial / Pro / legacy |
| Usuarios existentes | Sin cambios | Conservan todo vía `access_grants` (`legacy_full`) |
| `fn_create_expense` | Valida, inserta y **cuenta** (métrica) | Además aplica el límite |
| INSERT directo en `expenses` | Permitido | Cerrado (05) |
| `handle_new_user` | **No se toca** | Reemplazado (01), trial 14 d + `trial_started_at` |

Hoy la app ya es permisiva por código: `canUsePremium(profile) = profile !== null`
(`src/lib/auth/access-control.ts`); `src/lib/auth/access-state.ts` (6 estados, límite 30) existe pero **no se importa
en ninguna parte** de la app. Un test (`compat-mode-access.test.ts`) vigila que siga así.

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
activa el límite**) · `05_close_direct_expense_insert` · `rollback_freemium`. Cada uno aborta salvo
`SET kakebo.freemium_activation = 'confirmed';` (el rollback: `kakebo.freemium_rollback`) y va en una sola transacción.
Orden futuro: 01 → 02 → 04 → 03 → 05. El 03 se niega a ejecutarse si algún usuario existente no tiene `legacy_full`.

## 5. Qué NO se debe ejecutar todavía

Todo lo de `supabase/deferred/`; `supabase/manual-ops/founder_capture_activation.sql` (captura de fundadores: ligada
a la activación comercial); `supabase/manual-ops/phase3b_permission_hardening.sql` (REVOKE manual comentado; el 05 lo
sustituye en la activación); cualquier script de Stripe; `supabase/rollback/phase3b_rollback.sql` salvo emergencia.
`supabase/tests/phase3b_security_checks.sql` contiene secciones del modelo freemium (`fn_resolve_access_state`, límite):
solo son válidas **después** de 01–03.

## 6–8. Trial, límite, IA y PDF (confirmaciones)

- **Trial de 14 días**: la definición histórica de `handle_new_user` (`supabase_migration_saas.sql`, commit 8346acc:
  `now() + interval '14 days'`) se conserva porque el modo compatible **no la redefine**. ⚠️ No se ha podido verificar la
  definición *actual* en producción (no se ejecutó SQL): **ejecutar `supabase/tests/phase3b_prod_baseline.sql` §2** antes de aplicar.
  Además, hoy la app no usa el trial para restringir nada.
- **Sin límite de 30 gastos**: no existe en ninguna migración aplicable (test estático + test SQL real: 45 gastos sin `KB001`).
- **IA y PDF sin restricciones**: ver §2.

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
| Entran después de activar | Free con trial de 14 días y luego límite de 30 |

Nadie se convierte ahora en fundador ni Pro (`is_founder` y `plus_access_until` quedan en su valor neutro).

## 11. Backup (obligatorio antes de aplicar)

1. `supabase/tests/phase3b_prod_baseline.sql` (solo lectura): guardar resultados (definición de `handle_new_user`, columnas, políticas, recuentos).
2. `supabase/manual-ops/phase3b_pre_apply_snapshot.sql`: crea `phase3b_backup.*` (perfiles, resúmenes de gastos, funciones, privilegios, políticas, triggers), con RLS y sin acceso para clientes.
3. Backup/PITR de Supabase propio del proveedor.

## 12–13. Orden de aplicación y verificación

1. Backup (§11). 2. Aplicar 20260916 → 20260917 → 20261001 (SQL Editor, cada una en su pestaña; son idempotentes).
3. Ejecutar `supabase/verification/phase3b_verify.sql`: **0 filas FAIL**. (Si "handle_new_user conserva 14 días" falla, comprobar
la definición real: puede estar escrita de otra forma sin ser un problema.) 4. Comparar con la foto: `profiles` sin diferencias en
`tier`, `manual_override`, `trial_ends_at`. 5. Crear un gasto de prueba por cada canal (web, asistente legado, agente) en un entorno
de preview. 6. Solo entonces, promover el deployment (§16).

## 14. Rollback

- **Compatible**: `supabase/rollback/phase3b_rollback.sql` (`SET kakebo.phase3b_rollback = 'confirmed'`). Se niega si freemium está o estuvo activo;
  solo borra tablas **vacías** (conserva `expense_monthly_usage`/`first_expense_activations` con datos); no toca `profiles` ni `expenses`.
  **Antes**, volver Vercel a un deployment que no use `fn_create_expense` (p. ej. 41a4c98).
- **Freemium → compatible**: `supabase/deferred/freemium/rollback_freemium.sql` (sin borrar datos; deja `access_grants` como registro inerte).

## 15. Riesgos

- PGlite (Postgres en memoria) valida la lógica, no es Supabase: `phase3b_verify.sql` en staging/producción es la verificación final.
- Si producción tiene una `handle_new_user` distinta de la histórica, el 14 días podría no coincidir (revisar baseline §2). El modo compatible no la toca.
- El trigger de `profiles` rechaza a `authenticated` cualquier cambio de `tier`/`trial_*`: ningún código de la app los escribe desde sesión de usuario (verificado por búsqueda en `src/`), pero revisar integraciones externas.
- `20261001`: si la tabla ya existía con `expense_id NOT NULL ON DELETE CASCADE`, la migración la corrige.
- Promover Vercel **antes** de aplicar las migraciones rompe la creación de gastos.

## 16. Antes de promocionar Vercel

- Migraciones aplicadas y `phase3b_verify.sql` sin FAIL. Variables de entorno de Vercel: `SUPABASE_SERVICE_ROLE_KEY` definida.
- `PREMIUM_COMMERCE_ENABLED` sin definir (apagado). Probar el preview (`*.vercel.app`) con un gasto real de cada canal.
- Reactivar "auto-assign custom domains" o **Promote to Production** del deployment verificado (decisión del propietario).

## 17. Pendiente para Stripe

Producto/Price, webhook firmado + `stripe_webhook_events`, `subscriptions` + `fn_recompute_plus_access_until`, tabla de compras/entitlements,
entrega protegida del pack premium, textos legales (ver auditoría legal), eventos de analítica de compra.

## 18. Pendiente para freemium

Decisión de producto y fecha; reflejar `legacy_full` en `access-state.ts`; cablear los permisos de IA/PDF por estado; copy y UX del límite (KB001);
aplicar 01 → 02 → 04 → 03 → 05 con backup y verificación; comunicar el cambio a los usuarios.

## Pruebas de esta fase

`src/__tests__/security/phase3b-sql-behavior.test.ts` ejecuta migraciones, hardening, scripts diferidos, rollbacks, verify y snapshot en un Postgres real en memoria
(`@electric-sql/pglite`, devDependency). `migration-permission-hardening.test.ts`, `compat-mode-access.test.ts`, `auth-users.test.ts` y
`vip-admin-pagination.test.ts` completan la cobertura. `grant-vip`/`list-vip-users` ahora paginan `auth.admin.listUsers()` (antes solo veían los primeros 50 usuarios).
