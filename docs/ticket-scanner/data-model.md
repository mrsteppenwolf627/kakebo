# Escáner de tickets — Modelo de datos (Fase 4)

**Estado: PROPUESTA. No implementada.** Ninguna tabla, columna, índice, política ni función de este documento existe. No se han escrito migraciones. Los nombres con prefijo `scanner_` son provisionales.

Etiquetas: **DEMOSTRADO** (repo) · **PROPUESTO** · **NO DEMOSTRADO** · **PENDIENTE**. Ver [`technical-architecture.md`](technical-architecture.md) para el contexto, [`api-contracts.md`](api-contracts.md) para los contratos y [`privacy-security-architecture.md`](privacy-security-architecture.md) (§E) para la versión previa del modelo, que este documento concreta.

## 0. Qué se sabe del esquema real

| Hecho | Estado | Evidencia |
|---|---|---|
| `expenses` tiene RLS activada y permisos `SELECT, INSERT, UPDATE, DELETE` para `authenticated` | **DEMOSTRADO** | `supabase/migrations/20260217_security_audit.sql` |
| `expenses` tiene `user_id`, `month_id`, `date`, `amount`, `category`, `note`, `color`, `subcategory`, `created_at` | **DEMOSTRADO** (por el `INSERT` de `fn_create_expense` y por el esquema de aplicación) | `supabase/migrations/20260916_phase3b_monetization_foundation.sql`, `src/lib/schemas/expense.ts` |
| Tipo y escala de `expenses.amount` | `numeric` como parámetro de `fn_create_expense`; **escala de la columna NO DEMOSTRADA** | idem |
| Tipo de `expenses.id` | `uuid` según `expenseSchema`; **tipo físico NO DEMOSTRADO** | `src/lib/schemas/expense.ts` |
| DDL de creación y políticas RLS de `expenses` | **NO DEMOSTRADO** (no están en `supabase/migrations/`) | — |
| Patrón de función `SECURITY DEFINER` con `search_path` fijo e identidad por `auth.uid()` | **DEMOSTRADO** | `fn_create_expense`, `fn_my_access` |
| Patrón de contador con `ON CONFLICT DO UPDATE` | **DEMOSTRADO** | `fn_create_expense` (`expense_monthly_usage`) |
| Patrón de tabla solo de servidor (RLS activada, sin políticas) | **DEMOSTRADO** | `supabase/migrations/20260914_add_ai_pending_actions.sql` |

Consecuencia: los campos de este modelo que se relacionan con `expenses` (`scanner_expense_links.expense_id`, conversión de céntimos a `amount`) quedan **condicionados a obtener el esquema real** (bloqueo P1 nº 3).

## 1. Convenciones

- `id uuid` con `gen_random_uuid()`; `user_id uuid NOT NULL` referenciando al usuario autenticado (`auth.users`); tipo físico y política de borrado de cuenta: **NO DEMOSTRADO** para el proyecto real (el helper de pruebas usa `auth.users` solo en PGlite: `src/__tests__/helpers/plus-pglite.ts`).
- Fechas y horas `timestamptz` en UTC; la «fecha de negocio» (`quota_day`, fecha del ticket) es `date`.
- Importes en **céntimos enteros** (`bigint`), nunca `float`. Moneda `'EUR'` inicial. Conversión a `expenses.amount` solo en la función de confirmación (`cents / 100`), con escala comprobada contra el esquema real.
- Enumeraciones como `text` + `CHECK` (los valores `PENDIENTE` se completan tras decisión).
- Origen del dato por campo: `*_src` ∈ `ocr`, `user`, `rule`, `calc`. Confianza: `*_conf numeric(4,3)` en 0..1 o `NULL` (= desconocida).
- Sensibilidad: **S1** operativa sin datos personales; **S2** personal; **S3** financiera o archivo. Todo S3 queda fuera de analytics y de logs.
- RLS general: todas las tablas con RLS activada. Lectura por propietario donde se indica; **ninguna política de escritura para `anon`/`authenticated`**; toda escritura por funciones o por servicio con `user_id` explícito (patrón DEMOSTRADO en `src/lib/agents-v2/pending-actions.ts`). `REVOKE ALL … FROM anon, authenticated` y `GRANT` mínimo, como en `20260217_security_audit.sql` y `20261013140000_plus_harden_function_acl.sql`.

## 2. Tablas

### 2.1 `scanner_tickets` — ticket y metadatos (S2)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención | Notas |
|---|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | vida del ticket | identificador opaco |
| `user_id` | uuid | no | FK usuario | S2 | idem | propietario |
| `status` | text | no | `initiated, uploaded, processing, needs_review, confirmed, failed, expired, deleted` | S1 | idem | cambia solo por función |
| `status_reason` | text | sí | ≤40, enumerado (p. ej. `user_discarded`, `ttl_expired`, `validation_rejected`, `provider_failed`) | S1 | idem | sin texto libre |
| `source` | text | no | `camera, image, pdf` | S1 | idem | |
| `locale` | text | no | `es, en` | S1 | idem | |
| `idempotency_key` | uuid | no | único por usuario | S1 | idem | clave de creación |
| `confirm_key` | uuid | sí | único por usuario cuando no es nulo | S1 | idem | clave de confirmación |
| `attempt_count` | smallint | no | 0..`{MAX_RETRIES}`+1 | S1 | idem | |
| `quota_day` | date | sí | se fija al consumir | S1 | idem | zona del día PENDIENTE |
| `retain_original` | boolean | no | por defecto `false` | S1 | idem | |
| `created_at`, `updated_at` | timestamptz | no | | S1 | idem | |
| `expires_at` | timestamptz | no | > `created_at` | S1 | hasta terminal | según estado (ver B.2 de la arquitectura) |
| `confirmed_at`, `deleted_at` | timestamptz | sí | | S1 | idem | |
| `schema_version` | smallint | no | | S1 | idem | |

- **Índices:** único `(user_id, idempotency_key)`; único parcial `(user_id, confirm_key)` donde no sea nulo; `(user_id, status)`; parcial `(expires_at)` donde `status` no sea `deleted`.
- **Retención de la fila:** al llegar a `deleted`, la fila queda como *tombstone* mínimo (sin datos S3) para trazabilidad y cuota; plazo de purga **PENDIENTE**.
- **RLS:** `SELECT` si `user_id = auth.uid()`. Sin políticas de escritura.

### 2.2 `scanner_ticket_files` — archivo original (S3)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | vida del archivo |
| `ticket_id` | uuid | no | FK `scanner_tickets` ON DELETE CASCADE | S1 | idem |
| `user_id` | uuid | no | desnormalizado para RLS | S2 | idem |
| `storage_bucket` | text | no | ≤63 | S1 | idem |
| `storage_path` | text | no | único; aleatorio generado en servidor; nunca el nombre del usuario | S3 | idem |
| `declared_mime` | text | sí | ≤100 | S1 | idem |
| `detected_mime` | text | sí | lista cerrada por firma de bytes | S1 | idem |
| `size_bytes` | bigint | sí | >0 y ≤ `{MAX_BYTES}` | S1 | idem |
| `page_count` | smallint | sí | ≥1 y ≤ `{MAX_PAGES}` | S1 | idem |
| `width_px`, `height_px` | integer | sí | ≤ `{MAX_PIXELS}` | S1 | idem |
| `sha256` | text | sí | 64 hex | S3 | idem |
| `exif_stripped` | boolean | no | por defecto `false` | S1 | idem |
| `validation_status` | text | no | `pending, passed, rejected` | S1 | idem |
| `rejection_code` | text | sí | enumerado | S1 | idem |
| `scan_status` | text | no | `not_run, clean, infected, error` (antivirus PENDIENTE) | S1 | idem |
| `original_deleted_at`, `deletion_verified_at` | timestamptz | sí | | S1 | idem |
| `created_at` | timestamptz | no | | S1 | idem |

- **Índices:** `(ticket_id)`; `(user_id, sha256)` **no único** (el duplicado es un aviso, no una restricción).
- **RLS:** `SELECT` por propietario. El contenido del objeto nunca se lee con esta tabla; se accede por URL firmada generada en servidor.
- **Nunca se almacena el nombre original del archivo.**

### 2.3 `scanner_ocr_attempts` — intentos y cola (S1)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | vida del ticket |
| `ticket_id`, `user_id` | uuid | no | FK cascada / propietario | S1/S2 | idem |
| `attempt_no` | smallint | no | ≥1 | S1 | idem |
| `idempotency_key` | uuid | no | | S1 | idem |
| `status` | text | no | `queued, running, succeeded, failed, cancelled` | S1 | idem |
| `provider_id` | text | no | ≤40; identificador de configuración, no nombre en el dominio | S1 | idem |
| `provider_region` | text | sí | ≤40 | S1 | idem |
| `adapter_version`, `schema_version` | text / smallint | no | | S1 | idem |
| `lease_until` | timestamptz | sí | | S1 | idem |
| `worker_id` | text | sí | ≤40 | S1 | idem |
| `error_kind` | text | sí | `transient, permanent, unsupported, quota, config` | S1 | idem |
| `error_code` | text | sí | ≤40, enumerado; sin texto del proveedor | S1 | idem |
| `provider_request_id` | text | sí | ≤120 | S1 | idem |
| `pages_billed` | smallint | sí | ≥0 | S1 | idem |
| `latency_ms` | integer | sí | ≥0 | S1 | idem |
| `requested_at`, `started_at`, `completed_at` | timestamptz | sí | | S1 | idem |

- **Índices:** único `(ticket_id, attempt_no)`; único `(ticket_id, idempotency_key)`; único parcial `(provider_id, provider_request_id)` donde no sea nulo; parcial `(status, lease_until)` donde `status in ('queued','running')`.
- **RLS:** activada **sin políticas** (solo servidor), como `ai_pending_actions`.
- Las respuestas crudas del proveedor **no se guardan** por defecto. Si se guardaran para depuración (PENDIENTE), irían en almacenamiento privado con TTL corto y no en esta tabla.

### 2.4 `scanner_receipt_drafts` — borrador normalizado y confianza (S3)

Una fila por ticket (borrador vigente). Una fila por campo de cabecera con su origen y su confianza.

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `ticket_id` | uuid | no | PK y FK cascada | S1 | hasta terminal |
| `user_id` | uuid | no | | S2 | idem |
| `version` | integer | no | ≥0; control de concurrencia optimista | S1 | idem |
| `source_attempt_id` | uuid | sí | FK intento | S1 | idem |
| `currency` | char(3) | no | `CHECK = 'EUR'` (inicial) | S1 | idem |
| `merchant` | text | sí | ≤`{MAX_MERCHANT}` (propuesta 120) | S3 | idem |
| `merchant_src`, `merchant_conf` | text, numeric(4,3) | sí | origen; 0..1 o nulo | S3 | idem |
| `txn_date` | date | sí | no futura más de `{FUTURE_TOLERANCE}`; ciclo abierto en la confirmación | S3 | idem |
| `txn_date_src`, `txn_date_conf` | | sí | | S3 | idem |
| `total_cents` | bigint | sí | >0 | S3 | idem |
| `total_src`, `total_conf` | | sí | | S3 | idem |
| `tax_cents` | bigint | sí | ≥0 y ≤ `total_cents` | S3 | idem |
| `tax_src`, `tax_conf` | | sí | | S3 | idem |
| `payment_method` | text | sí | `cash, card, other, unknown` (lista final PENDIENTE) | S3 | idem |
| `payment_method_src`, `payment_method_conf` | | sí | | S3 | idem |
| `review_flags` | text[] | no | códigos técnicos enumerados (p. ej. `LOW_CONF_TOTAL`, `SUM_MISMATCH`, `NOT_EUR`) | S3 | idem |
| `duplicate_ref_kind`, `duplicate_ref_id` | text, uuid | sí | `ticket` o `expense` | S3 | idem |
| `parser_schema_version` | smallint | no | | S1 | idem |
| `created_at`, `updated_at` | timestamptz | no | | S1 | idem |

- **Índices:** PK `(ticket_id)`; `(user_id)`.
- **Retención tras confirmar:** qué se conserva (borrador, líneas, repartos) es **PENDIENTE** (F2-10): la opción conservadora es purgar el borrador a los `{DRAFT_RETENTION_DAYS}` de confirmar y conservar solo `scanner_expense_links`.
- **RLS:** `SELECT` por propietario; escritura solo por función (`fn_scanner_apply_edits`, `fn_scanner_apply_ocr_result`).
- **Regla de prevalencia:** una función de edición con `*_src = 'user'` no puede ser sobrescrita por un resultado `ocr`; el resultado OCR solo rellena campos cuyo origen no sea `user`.

### 2.5 `scanner_receipt_lines` — líneas (S3)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | con el borrador |
| `ticket_id`, `user_id` | uuid | no | FK cascada / propietario | S1/S2 | idem |
| `position` | smallint | no | 1..`{MAX_LINES}` | S1 | idem |
| `kind` | text | no | `item, adjustment` | S1 | idem |
| `description` | text | sí | ≤`{MAX_DESC}` (propuesta 200); obligatorio para `item` | S3 | idem |
| `description_src`, `description_conf` | | sí | | S3 | idem |
| `quantity` | numeric(10,3) | sí | >0 | S3 | idem |
| `amount_cents` | bigint | no | puede ser negativo (descuentos); nunca 0 | S3 | idem |
| `amount_src`, `amount_conf` | | sí | | S3 | idem |
| `category` | text | sí | `survival, optional, culture, extra` | S3 | idem |
| `subcategory` | text | sí | uno de `SUBCATEGORY_IDS` (`src/lib/subcategories.ts`) | S3 | idem |
| `category_src` | text | sí | `rule, user` (nunca `ocr`) | S3 | idem |

- **Índices:** único `(ticket_id, position)`; `(ticket_id)`.
- **Una línea `adjustment`** representa explícitamente la diferencia aceptada entre suma de artículos y total (F3 C.3); nunca se crea sola.
- Categorías: solo las 4 existentes (`src/lib/schemas/common.ts`); la subcategoría es opcional.

### 2.6 `scanner_line_allocations` — repartos por categoría (S3)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | con la línea |
| `line_id` | uuid | no | FK `scanner_receipt_lines` ON DELETE CASCADE | S1 | idem |
| `ticket_id`, `user_id` | uuid | no | | S1/S2 | idem |
| `part_no` | smallint | no | 1..`{MAX_SPLITS}` | S1 | idem |
| `category` | text | no | 4 categorías | S3 | idem |
| `subcategory` | text | sí | | S3 | idem |
| `amount_cents` | bigint | no | >0 | S3 | idem |

- **Índices:** único `(line_id, part_no)`.
- Una línea sin repartos usa su `category` como reparto único implícito; con repartos (≥2), `category` de la línea queda nula.

### 2.7 `scanner_expense_links` — relación ticket-gastos (S2)

| Campo | Tipo lógico | Null | Límites | Sens. | Retención |
|---|---|---|---|---|---|
| `id` | uuid | no | PK | S1 | vida del gasto |
| `ticket_id` | uuid | no | FK cascada (borrar el ticket no borra el gasto) | S1 | idem |
| `user_id` | uuid | no | | S2 | idem |
| `expense_id` | uuid | no | **único**; FK a `expenses(id)` con `ON DELETE CASCADE` — condicionado al esquema real (NO DEMOSTRADO) | S2 | hasta que se borre el gasto |
| `group_no` | smallint | no | 1..`{MAX_EXPENSES_PER_TICKET}` | S1 | idem |
| `category` | text | no | | S2 | idem |
| `amount_cents` | bigint | no | >0 | S2 | idem |
| `created_at` | timestamptz | no | | S1 | idem |

- **Índices:** único `(ticket_id, group_no)` (idempotencia por grupo); único `(expense_id)`; `(user_id, created_at)`.
- Un grupo = una categoría; el agrupado definitivo es **PENDIENTE** (F3-5).

### 2.8 `scanner_quota_counters` y `scanner_quota_ledger` (S1)

**Contador** (consulta rápida y control atómico):

| Campo | Tipo | Null | Límites |
|---|---|---|---|
| `user_id` | uuid | no | PK parte 1 |
| `quota_day` | date | no | PK parte 2 |
| `used` | smallint | no | 0..`{DAILY_LIMIT}` |
| `tz` | text | no | zona usada para calcular el día |
| `updated_at` | timestamptz | no | |

**Libro** (idempotencia y auditoría de cuota):

| Campo | Tipo | Null | Límites |
|---|---|---|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | |
| `ticket_id` | uuid | no | sin FK dura para sobrevivir al *tombstone* |
| `quota_day` | date | no | |
| `tz` | text | no | |
| `kind` | text | no | `consume, refund` |
| `units` | smallint | no | `CHECK = 1` |
| `created_at` | timestamptz | no | |

- **Índices:** único `(ticket_id, kind)`; `(user_id, quota_day)`.
- **Atomicidad (PROPUESTA, patrón DEMOSTRADO en `fn_create_expense`):** una sola función inserta en el libro y hace `INSERT … ON CONFLICT (user_id, quota_day) DO UPDATE SET used = used + 1 WHERE used < limit`, en la misma transacción que el cambio de estado a `processing`. Si no se actualiza ninguna fila, devuelve `QUOTA_EXCEEDED`. El reembolso decrementa en la misma transacción que `processing→failed`. El valor del límite viene de configuración de servidor (5 es el límite acordado; el día es PENDIENTE).
- **Retención:** plazo de las filas del libro **PENDIENTE** (abuso y coste agregado); no contienen datos financieros.
- **RLS:** solo servidor; el usuario ve su cuota por el endpoint de capacidad.

### 2.9 `scanner_retention_requests` — retención y borrado (S2)

| Campo | Tipo lógico | Null | Límites |
|---|---|---|---|
| `id` | uuid | no | PK |
| `ticket_id`, `user_id` | uuid | no | |
| `kind` | text | no | `keep_original, delete_now` |
| `requested_ttl_days` | smallint | sí | opciones `{RETENTION_OPTIONS}` PENDIENTES |
| `status` | text | no | `pending, active, executed, revoked, failed` |
| `requested_at`, `expires_at`, `executed_at`, `deletion_verified_at` | timestamptz | sí | |
| `attempts` | smallint | no | ≥0 |
| `last_error_code` | text | sí | enumerado |

- **Índices:** único parcial `(ticket_id)` donde `status in ('pending','active')`; `(status, expires_at)` para el barrido.
- **RLS:** `SELECT` por propietario; escritura por función.
- El borrado por defecto tras confirmar crea una solicitud `delete_now` del sistema.

### 2.10 `scanner_audit_events` — auditoría técnica (S1, sin datos financieros)

| Campo | Tipo | Null | Límites |
|---|---|---|---|
| `id` | bigint identity | no | PK |
| `ticket_id` | uuid | sí | sin FK (sobrevive al borrado) |
| `user_id` | uuid | no | |
| `event_type` | text | no | lista cerrada: `ticket_created, upload_authorized, upload_completed, validation_rejected, quota_consumed, quota_refunded, ocr_started, ocr_succeeded, ocr_failed, draft_field_edited, confirmed, discarded, expired, original_deleted, deletion_verified, retention_set, retention_revoked` |
| `actor` | text | no | `user, system, worker` |
| `code` | text | sí | enumerado |
| `field_path` | text | sí | solo para `draft_field_edited`; **sin valores** |
| `created_at` | timestamptz | no | |

- **Prohibido en esta tabla y en logs:** importes, comercio, fecha del ticket, descripciones, categorías, texto OCR, nombres de archivo, URLs.
- **Índices:** `(ticket_id, created_at)`; `(created_at)`.
- **Retención:** plazo **PENDIENTE**; sin carga útil libre.
- **RLS:** solo servidor.

## 3. Funciones propuestas (sin código)

| Función | Efecto | Acceso |
|---|---|---|
| `fn_scanner_create_ticket` | Crea ticket `initiated` de forma idempotente | `authenticated` (identidad de `auth.uid()`) |
| `fn_scanner_transition` | Transición CAS genérica con las reglas de B.2 | servidor |
| `fn_scanner_consume_quota` | Libro + contador + paso a `processing` | servidor |
| `fn_scanner_apply_ocr_result` | Guarda borrador respetando `src='user'` y pasa a `needs_review` | servidor (worker) |
| `fn_scanner_apply_edits` | Operaciones de revisión con control de versión | `authenticated` |
| `fn_scanner_confirm` | Valida invariantes, crea N gastos y vínculos, pasa a `confirmed`, todo en una transacción | `authenticated` |
| `fn_scanner_discard` / `fn_scanner_sweep` | Descarte y barrido de expirados | usuario / servidor |

Todas con `SECURITY DEFINER`, `search_path = public, pg_temp`, `REVOKE … FROM PUBLIC, anon` y `GRANT` explícito (patrón DEMOSTRADO en `fn_create_expense` y `20261013140000_plus_harden_function_acl.sql`).

**Creación de gastos dentro de la confirmación:** el ciclo (`month_id`) se resuelve en TypeScript (`src/lib/months.ts`, `src/app/api/expenses/route.ts`, DEMOSTRADO) y se pasa como parámetro. Dentro de `fn_scanner_confirm`, cada gasto se crea **llamando a `fn_create_expense`** para reutilizar sus validaciones de propiedad y de ciclo cerrado, y su contador mensual. Que una función `SECURITY DEFINER` pueda llamar a otra usando `auth.uid()` de la sesión es **NO DEMOSTRADO** en este proyecto y debe probarse con PGlite antes de adoptarlo (precedente de método: `src/__tests__/helpers/plus-pglite.ts`). Alternativa: insertar directamente en `expenses` replicando las validaciones, lo que exigiría conocer el esquema real.

## 4. Invariantes

| # | Invariante | Dónde se garantiza |
|---|---|---|
| I1 | `sum(lines.amount_cents) = total_cents` (las diferencias aceptadas se representan con una línea `adjustment`) | validación en edición (aviso) y **bloqueo** en `fn_scanner_confirm` |
| I2 | Para cada línea con repartos: `sum(allocations.amount_cents) = line.amount_cents`, y ≥2 partes | `fn_scanner_apply_edits` y `fn_scanner_confirm` |
| I3 | `sum(expense_links.amount_cents) = total_cents` | `fn_scanner_confirm` (misma transacción) |
| I4 | Un gasto por `(ticket_id, group_no)` y un vínculo por gasto | índices únicos |
| I5 | Moneda `EUR`; un ticket con otra moneda no se confirma | `CHECK` y validación |
| I6 | `0 ≤ tax_cents ≤ total_cents`; IVA opcional; el total incluye IVA (no se suma) | `CHECK` y validación |
| I7 | `total_cents > 0`; `txn_date` válida y ciclo abierto en la confirmación | validación; ciclo cerrado → 409 (DEMOSTRADO en `src/app/api/expenses/route.ts`) |
| I8 | `quota used ≤ {DAILY_LIMIT}` por usuario y día; un consumo y un reembolso como máximo por ticket | contador atómico + índice único del libro |
| I9 | Sin duplicado silencioso: duplicado = aviso, nunca bloqueo ni borrado automático | diseño; `sha256` no único |
| I10 | Los campos con `*_src = 'user'` no se sobrescriben por OCR | `fn_scanner_apply_ocr_result` |
| I11 | Confirmar es idempotente: misma `confirm_key` devuelve el mismo resultado; otra clave sobre un ticket ya `confirmed` devuelve 409 con los vínculos existentes | `confirm_key` único + CAS |
| I12 | Estados: solo las transiciones de B.2; `deleted` no cambia | `fn_scanner_transition` |
| I13 | Aislamiento: ninguna fila es legible o escribible por otro usuario | RLS + `user_id` en toda consulta de servicio; pruebas con dos usuarios |
| I14 | Sin importes, comercio ni texto OCR en `scanner_audit_events`, logs ni analytics | restricciones de columnas y pruebas |
| I15 | Borrar un gasto elimina su vínculo y no afecta al ticket ni a su original | FK y diseño |
| I16 | `deletion_verified_at` solo se fija tras comprobar que el objeto no existe | proceso de limpieza |

## 5. RLS propuesta (resumen)

| Tabla | `SELECT` propietario | Escritura |
|---|---|---|
| `scanner_tickets`, `scanner_ticket_files`, `scanner_receipt_drafts`, `scanner_receipt_lines`, `scanner_line_allocations`, `scanner_expense_links`, `scanner_retention_requests` | Sí | Solo funciones |
| `scanner_ocr_attempts`, `scanner_quota_counters`, `scanner_quota_ledger`, `scanner_audit_events` | No (solo servidor) | Solo funciones/servidor |

Reglas: `user_id = auth.uid()` en cada política; sin políticas para `anon`; sin acceso directo `INSERT/UPDATE/DELETE` para `authenticated`; el cliente de servicio añade siempre `user_id` a mano. La verificación se hace con pruebas SQL de dos usuarios (método DEMOSTRADO: `src/__tests__/security/plus-foundation-sql-behavior.test.ts`).

## 6. Almacenamiento (objeto)

- Bucket privado dedicado al escáner (distinto del bucket del pack), sin lectura pública. Ruta: `<user_id>/<ticket_id>/<random>` generada en servidor. Mecanismos de subida directa, cifrado en reposo y políticas del bucket: **NO DEMOSTRADOS** (bloqueo P1 nº 5).
- Acceso solo mediante URL firmada de corta duración (patrón DEMOSTRADO del pack, 600 s) y `no-store`.

## 7. Qué no se modifica

`expenses` no se altera en esta propuesta: el vínculo vive en `scanner_expense_links`. Si el esquema real obligara a otra solución, se documentará en una versión posterior de este documento.
