# Escáner de tickets — Fase 7: persistencia privada y cuota por ciclo (solo local)

Estado: **código y migración locales, revisables y reversibles. Nada se ha ejecutado en remoto.** Sin SQL remoto,
sin políticas creadas en el dashboard, sin despliegue, sin datos reales, sin imágenes enviadas a terceros. No se
tocan Analytics, Stripe ni Premium.

## 1. Evidencia observada (verificada por el propietario en el dashboard, 2026-10-27)

| Hecho | Valor |
|---|---|
| Proyecto Supabase | `kakebo-ahorro`, región `eu-central-1`, ref `fajqfjouqauyfiajfonf` |
| Entorno / salud | Producción, aparece como **unhealthy**; **sin backups visibles** |
| `months` | `id uuid, user_id uuid, year int4, month int4, status text, created_at timestamptz, closed_at timestamptz, income numeric` |
| `expenses` | `id uuid, user_id uuid, date date, amount numeric, category text, note text, created_at timestamptz, color text`. **`month_id` no visible** |
| Bucket | **`kakebo-ticket-temp`**: privado, límite 5 MB, MIME `image/jpeg`, `image/png`, `image/heic`, `image/heif`, 0 políticas abiertas (creado a mano) |
| Azure | Suscripción activa, **ningún recurso OCR creado**, sin credenciales; portal con carga defectuosa |

Esta evidencia es de captura manual, no se ha consultado la base de datos desde el repo. Discrepancias con el
repositorio (ver §6): el código usa `expenses.month_id`/`subcategory`, `months.savings_done` y `fn_create_expense`,
que no aparecen en lo observado.

## 2. Qué se ha implementado

| Pieza | Archivo |
|---|---|
| Migración (no ejecutada; en `deferred/` para que `db push` no la aplique y para no romper las guardas de orden de las migraciones Plus) | `supabase/deferred/ticket-scanner/20261027120000_ticket_scanner_persistence.sql` |
| Rollback (no ejecutado) | `supabase/rollback/scanner/20261027120000_ticket_scanner_persistence.rollback.sql` |
| Adaptador de Storage privado | `src/lib/scanner/storage-adapter.ts` |
| Envoltorios de las funciones SQL | `src/lib/scanner/persistence.ts` |
| Servicio de limpieza | `src/lib/scanner/cleanup.ts` |
| Endpoint de limpieza protegido | `src/app/api/scanner/cleanup/route.ts` |
| Contrato de creación de gastos | `src/lib/scanner/expense-contract.ts` |
| Tests | `src/__tests__/security/scanner-persistence-sql-behavior.test.ts`, `src/__tests__/lib/scanner/phase7.test.ts` |

### 2.1 Migración

- `scanner_tickets`: `id uuid`, `user_id → auth.users` (CASCADE), `cycle_id → months(id)` (NO ACTION), estado y motivo
  (mismos valores que `ticket-state.ts`), `original_storage`, `object_path` opaco `<user>/<ticket>/<uuid>`,
  `idempotency_key`, `confirm_key`, `expires_at` (24 h), `confirmed_at`, `deleted_at`, `deletion_verified_at`.
  `CHECK`: `deleted` solo con original ausente (`none`/`deleted_verified`) y sin ruta ni borrador (invariante I16).
- `scanner_ticket_lines`: líneas editables (importe en céntimos, 4 categorías, reparto en `jsonb`).
- `scanner_quota_ledger`: libro `consume`/`refund`, único por `(ticket_id, kind)`, **clave `cycle_id` = `months.id`**.
  No existe ninguna columna de fecha de cuota.
- **FK solo donde hay evidencia:** `auth.users` (patrón de todas las migraciones del repo) y `months(id)` (uuid
  observado). Como la restricción UNIQUE/PK de `months.id` no se ha podido observar, un **preflight aborta** la migración
  (sin cambios) si `months.id` no es uuid único, si faltan `user_id`/`status` o si el bucket es público.
- **RLS:** `scanner_tickets` solo `SELECT` propio; `scanner_ticket_lines` `SELECT` propio y escritura propia solo con el
  ticket en `needs_review`; `scanner_quota_ledger` sin acceso de clientes. `anon` sin nada.
- **Funciones** (`SECURITY DEFINER`, `search_path` fijo, identidad solo por `auth.uid()`, ACL explícita):
  usuario: `fn_scanner_create_ticket`, `fn_scanner_register_upload`, `fn_scanner_start_processing`,
  `fn_scanner_quota_status`; solo `service_role`: `fn_scanner_cleanup_candidates`, `fn_scanner_mark_deletion_pending`,
  `fn_scanner_finalize_deletion`.
- Idempotente (`IF NOT EXISTS`/`DROP POLICY IF EXISTS`). **Reversible:** el rollback aborta si quedan tickets con original
  en Storage (para no dejar archivos huérfanos) y no archiva líneas (son datos financieros que la privacidad manda borrar).

### 2.2 Políticas de `storage.objects` (bucket `kakebo-ticket-temp` únicamente)

Se formulan en la migración porque el patrón es seguro y demostrable: carpeta `<auth.uid()>/<ticket_id>/<objeto>`.

| Política | Rol | Condición |
|---|---|---|
| INSERT | `authenticated` | bucket exacto, 2 niveles de carpeta, carpeta 1 = `auth.uid()`, carpeta 2 = id de un ticket **propio en `initiated`** |
| SELECT | `authenticated` | bucket exacto, carpeta 1 = `auth.uid()`, ticket propio no `deleted` |
| DELETE | `authenticated` | bucket exacto, carpeta 1 = `auth.uid()` |

Sin política UPDATE (no hay sobrescritura), sin política para `anon`, el bucket nunca se publica ni se modifica. El borrado de
caducados lo hace el servidor con `service_role` (omite RLS). **Pendiente de comprobar en Supabase real:** que el rol que ejecute
la migración pueda crear políticas sobre `storage.objects` (es lo habitual en Supabase) y el comportamiento de subida/límites.

### 2.3 Adaptador de Storage

`PrivateTicketBucket` implementa `PrivateTicketStorage` (`retention.ts`). Recibe el cliente Supabase **inyectado**: sesión del
usuario para subir/leer, cliente de servicio solo para la limpieza. No importa el cliente de servicio, no lee `process.env` y
no usa `getPublicUrl`. Ruta generada en servidor, `upsert: false`, valida MIME y 5 MB antes de la red, lecturas por URL firmada
de 60 s (tope 120 s) y `exists()` independiente listando la carpeta. Un test garantiza que estos módulos no contienen
`getPublicUrl`, `SERVICE_ROLE`, `process.env` ni referencias a Azure.

### 2.4 Cuota (5 por ciclo)

`fn_scanner_start_processing` bloquea la fila de `months` del ciclo, cuenta el libro de ese `cycle_id`, inserta `consume` y pasa
`uploaded → processing` en **una transacción**. Repetir con el mismo ticket no vuelve a consumir; un ciclo cerrado rechaza
(`CYCLE_CLOSED`); un ciclo nuevo (otra fila de `months`) parte de cero sin mirar fecha. Los 5 de SQL y de TypeScript se
comprueban iguales en tests. **No implementado:** reembolso por fallo del sistema (`refund`) y reintentos `failed → processing`
(el límite de reintentos sigue pendiente, §10.4 del decision-log).

## 3. Limpieza (24 h y ciclo cerrado)

`runScannerCleanup` pide candidatos a `fn_scanner_cleanup_candidates` (caducados por `expires_at` **o** pendientes de un
`months.status = 'closed'`), reutiliza `deleteWithVerification` y solo llama a `fn_scanner_finalize_deletion` cuando la ausencia
del objeto se comprobó; si no, `fn_scanner_mark_deletion_pending` y se reintenta en la siguiente ejecución. Es idempotente.

Endpoint `GET|POST /api/scanner/cleanup`: exige `Authorization: Bearer <CRON_SECRET>` (comparación en tiempo constante, mínimo 16
caracteres). Falla cerrado: sin secreto configurado → 401 sin tocar nada. No acepta el secreto por query string. Devuelve solo
recuentos. `CRON_SECRET` es la variable que Vercel Cron envía automáticamente; **no se ha configurado ni añadido a ningún entorno**.

## 4. Enganche al cierre de ciclo (documentado, endpoint NO modificado)

`PATCH /api/months/[id]` cierra con dos operaciones independientes (UPDATE de `months` y luego `ensureNextCycleOpen`); no es
transaccional y la tabla `months` no está definida en el repo. Por eso **no se ha modificado** ni se ha creado un trigger sobre
`months`. En su lugar, la garantía es *derivada del estado*:

1. `fn_scanner_start_processing` rechaza ciclos cerrados → un ciclo cerrado no admite tickets nuevos en proceso.
2. `fn_scanner_cleanup_candidates` selecciona todo pendiente de un ciclo cerrado, sea cual sea la forma en que se cerró.

Consecuencia: tras el cierre pueden quedar tickets pendientes **hasta la siguiente ejecución del job** (como mucho su intervalo,
y siempre ≤ 24 h por la caducidad). Para cerrar esa ventana cuando se decida: invocar `runScannerCleanup` justo después del
UPDATE de cierre (best-effort), o un trigger `AFTER UPDATE OF status ON months` que solo marque `deletion_pending`. Ambos
requieren decisión del propietario y no se han aplicado, por lo que **no se añadieron** tests de "el cierre no deja tickets
activos" sobre el endpoint (no se tocó); sí hay tests de que la limpieza cancela los pendientes de un ciclo cerrado
(SQL y servicio).

## 5. Cron

No existe `vercel.json` ni cron. No se ha creado. Cuando se autorice, configuración mínima (ejemplo, no aplicado):

```json
{ "crons": [{ "path": "/api/scanner/cleanup", "schedule": "0 * * * *" }] }
```

Requiere `CRON_SECRET` definido en el entorno. En plan Hobby de Vercel los crons solo pueden ser diarios: con intervalo diario la
retención real puede superar 24 h (hasta ~48 h); decisión a confirmar.

## 6. Creación de gastos tras confirmación — BLOQUEADO

`expense-contract.ts` fija solo la proyección plan → entradas (`createExpenseSchema`: una por categoría > 0, `amount` en euros,
`month_id` = ciclo) y la interfaz `ScannerExpenseWriter`. **No hay ruta ni escritura.** Bloqueos:

1. El esquema extraído del backup local demuestra `expenses.month_id`, `expenses.subcategory`, `months.id` y `fn_create_expense`; la evidencia reproducible está en `docs/ticket-scanner/production-schema-evidence.md`.
2. `expenses` no tiene columna de trazabilidad hacia el ticket. Debe añadirse una tabla de vínculo y una función de confirmación atómica antes de crear gastos desde el escáner. La migración de Fase 7 se mantiene sin esa escritura hasta probarla en staging.
3. Debe ser una función atómica única (gastos + `confirmed` + vínculo), que respete el límite gratuito de `fn_create_expense`.

## 7. Azure Receipt

Sigue **desactivado** (`azureReceiptDisabledAdapter`, `PILOT_NOT_ENABLED`): sin SDK, sin credenciales, sin red. Requisitos
previos sin cumplir: DPA, región, subprocesadores, retención, benchmark sintético y creación del recurso.

## 8. Pruebas y limitaciones

- PGlite ejecuta la migración y el rollback **reales** con maquetas de `months`, `expenses` y `storage.*` construidas con las columnas
  observadas: RLS de dos usuarios, `anon` sin acceso, ACL de funciones, cuota 5/ciclo, reinicio por ciclo, caducidad 24 h, cierre
  de ciclo, borrado verificado, políticas de storage (carpetas ajenas, ticket ajeno, otro bucket, profundidad, UPDATE) y rollback.
- **Limitación:** no hay Supabase local (CLI/Docker) en el repo; PGlite no ejecuta el motor real de Storage (subida HTTP, límite
  5 MB, MIME), ni `storage.foldername` real (se usa una maqueta equivalente), ni el esquema real de `months`. Antes de aplicar en
  ningún sitio: probar contra Supabase local o una rama de staging con la misma estructura y **resolver el estado "unhealthy" y la
  ausencia de backups del proyecto de producción**.

## 9. Pendientes de decisión / siguientes pasos

DPA/región/subprocesadores de Azure; cron y `CRON_SECRET`; ventana entre cierre de ciclo y limpieza (§4); trazabilidad
ticket→gasto (§6); reembolso de cuota y límite de reintentos; flag/ruta de usuario del escáner y acceso Plus
(`access.ts` sigue sin enganchar a ninguna ruta).
