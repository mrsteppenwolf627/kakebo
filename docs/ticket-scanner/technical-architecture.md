# Escáner de tickets — Arquitectura técnica (Fase 4)

**Estado: PROPUESTA. No implementada.** Rama `feature/ticket-scanner-fase-4`, base `a42cfeb`. Este documento especifica; no hay código, migraciones, rutas ni dependencias nuevas. Nada aquí describe algo que ya exista salvo donde se marca DEMOSTRADO con ruta.

Etiquetas: **DEMOSTRADO** (visto en el repo, con ruta) · **PROPUESTO** (diseño nuevo) · **NO DEMOSTRADO** (sin evidencia) · **PENDIENTE** (decisión abierta del propietario). Los valores `{…}` son marcadores, no cifras.

Documentos relacionados: Fase 0 [`product-requirements.md`](product-requirements.md), [`state-machine.md`](state-machine.md), [`mvp-scope.md`](mvp-scope.md), [`decision-log.md`](decision-log.md); Fase 1 [`provider-benchmark.md`](provider-benchmark.md); Fase 2 [`privacy-security-architecture.md`](privacy-security-architecture.md), [`data-flow.md`](data-flow.md), [`threat-model.md`](threat-model.md); Fase 3 [`ux-functional-spec.md`](ux-functional-spec.md), [`ux-wireflows.md`](ux-wireflows.md), [`ux-copy-es-en.md`](ux-copy-es-en.md); Fase 4 [`data-model.md`](data-model.md), [`api-contracts.md`](api-contracts.md), [`implementation-plan.md`](implementation-plan.md), [`technical-architecture.json`](technical-architecture.json).

## 0. Resumen no técnico

El escáner necesita seis piezas nuevas que hoy no existen: un permiso propio del escáner, un sitio privado donde guardar el archivo, una cola de trabajo que lo procese, un adaptador intercambiable hacia el servicio de lectura, tablas para el borrador y el estado del ticket, y una operación atómica que cree varios gastos a la vez. Se apoya en lo que sí existe y está probado: sesión de usuario, la función de acceso `fn_my_access`, la creación de gasto `fn_create_expense`, el patrón de acciones de un solo uso de `ai_pending_actions`, las URLs firmadas del pack Premium y las pruebas SQL con PGlite.

Hay decisiones P1 sin cerrar (sección 11). **Mientras sigan abiertas, la Fase 5 de implementación no debe empezar** (veredicto en la sección 12).

## 1. Qué existe hoy y qué hay que construir

| Pieza | Estado | Evidencia |
|---|---|---|
| Sesión de usuario | **DEMOSTRADO** | `src/lib/api/auth.ts` (`requireAuth`, 401) |
| Acceso Plus/Premium en servidor | **DEMOSTRADO** pero **abierto con el interruptor apagado** | `src/lib/auth/require-access.ts` (`enforced:false`), `supabase/migrations/20261013113040_plus_access_resolver.sql` |
| Permiso del escáner | No existe (**PROPUESTO**) | `AccessFeature` solo tiene `ai`, `ai_search`, `export_reports`, `plus_features`, `billing` |
| Creación de gasto | **DEMOSTRADO**: un gasto por llamada, valida propiedad y ciclo cerrado, incrementa contador mensual | `supabase/migrations/20260916_phase3b_monetization_foundation.sql` |
| Resolución de ciclo | **DEMOSTRADO** en TypeScript, no en SQL | `src/lib/months.ts` (`getOpenMonth`, `getOrCreateMonth`), `src/app/api/expenses/route.ts` |
| Creación atómica de N gastos | No existe (**PROPUESTO**) | — |
| Esquema real de `expenses` | **NO DEMOSTRADO** (el DDL de creación no está en `supabase/migrations/`) | solo `ENABLE ROW LEVEL SECURITY` y `GRANT` en `20260217_security_audit.sql`; las políticas no están en el repo |
| `expenses.id` es uuid | **DEMOSTRADO** a nivel de esquema de aplicación | `src/lib/schemas/expense.ts` (`uuidSchema`) |
| Almacenamiento privado de archivos de usuario | No existe (**PROPUESTO**) | solo el bucket del pack: `src/lib/premium/manifest.ts`, `src/app/api/premium/download/route.ts` |
| URL firmada corta + `no-store` | **DEMOSTRADO** como patrón (600 s) | `src/app/api/premium/download/route.ts` |
| Subida directa a Storage desde el navegador | **NO DEMOSTRADO** como mecanismo concreto; el `connect-src` ya permite `https://*.supabase.co` | `next.config.ts` |
| Cola/trabajos en segundo plano | No existe. No hay `vercel.json` ni `.github`; el único «job» es un `fetch` sin esperar | `src/app/api/expenses/route.ts` |
| Planificador de limpieza | **NO DEMOSTRADO** | ausencia de `vercel.json`, `.github` |
| Acción de un solo uso con UPDATE atómico, TTL y service role con `user_id` | **DEMOSTRADO** | `src/lib/agents-v2/pending-actions.ts`, `supabase/migrations/20260914_add_ai_pending_actions.sql` |
| Contador diario/mensual con `ON CONFLICT DO UPDATE` | **DEMOSTRADO** (mensual, Europe/Madrid) | `fn_create_expense` |
| Estructura de rutas | **DEMOSTRADO**: `withLogging` + `requireAuth` + `handleApiError`, esquema `zod` `.strict()`, `dynamic = "force-dynamic"`, envoltorio `{success, data}` / `{success:false, error}` | `src/app/api/stripe/checkout/route.ts`, `src/lib/api/responses.ts`, `src/lib/api/errors.ts` |
| Comprobación de Origin/CSRF en rutas de mutación | **NO DEMOSTRADO**; solo hay una función que valida la URL base del sitio | `src/lib/stripe/plus.ts` (`getSiteUrl`) |
| Rate limiting | **NO DEMOSTRADO** (no se encontró) | `src/` |
| Librerías de imagen/PDF para validar y reencodar | **NO DEMOSTRADO**: `package.json` no declara ninguna; `package-lock.json` contiene binarios de `sharp` como dependencia opcional de Next, no declarada | `package.json`, `package-lock.json` |
| Antivirus | No existe; **NO DEMOSTRADO** que Supabase escanee | — |
| Clasificación de categorías | Existe y **usa GPT como respaldo**; no debe ser la opción por defecto del escáner | `src/lib/agents/tools/utils/category-suggester.ts`, `src/lib/ai/classifier.ts` |
| Logger | `pino`; `logApiError` registra mensaje y *stack* | `src/lib/logger.ts` |
| Pruebas SQL con migraciones reales | **DEMOSTRADO** (PGlite con roles y `auth.uid()`) | `src/__tests__/helpers/plus-pglite.ts`, `src/__tests__/security/plus-function-acl.test.ts` |
| Analytics | Lista cerrada de nombres; propiedades libres; sanitizador solo para calculadoras | `src/lib/analytics.ts` |

## A. Arquitectura extremo a extremo

```
 NAVEGADOR                          SERVIDOR (rutas Next)                       DATOS / TERCEROS
 ─────────                          ─────────────────────                       ────────────────
 1 capacidad  ─GET capability────>  requireAuth + acceso escáner (denegar por defecto)
 2 iniciar    ─POST tickets─────>   cuota NO se consume; crea Ticket(initiated) ─> scanner_tickets
 3 autorizar  ─POST upload-auth─>   ruta aleatoria, de un solo uso, caducidad corta
 4 subir      ═PUT directo (o proxy ≤ límite) ═══════════════════════════════>   BUCKET PRIVADO
 5 completar  ─POST complete────>   validar: magic bytes, tamaño, píxeles, páginas, PDF activo
                                    reencodar sin EXIF · antivirus si se decide ─> ticket_files
                                    Ticket(initiated→uploaded)
 6 procesar   ─POST process─────>   consume cuota (idempotente) + crea OcrAttempt(queued)
                                    Ticket(uploaded→processing)
 7 trabajo                          worker reclama OcrAttempt (lease) ─────────>  PROVEEDOR OCR (PENDIENTE)
                                    adaptador ReceiptOcrProvider → NormalizedReceipt v1
                                    normalizar + confianza por campo + reglas de categoría
                                    guardar borrador · Ticket(processing→needs_review) | failed
 8 estado     ─GET ticket───────>   (sondeo) borrador + versión
 9 revisión   ─PATCH draft──────>   operaciones por campo; el usuario prevalece; invariantes
10 confirmar  ─POST confirm─────>   resolver ciclo (TS) · función SQL atómica: crea N gastos +
                                    ExpenseLink · Ticket(needs_review→confirmed)       ─> expenses
11 borrado    (tarea del sistema)   borrar original · verificar · registrar ─────────>  BUCKET
12 retención  ─PUT retention────>   opcional, con TTL
```

Tramos que **hay que construir** (todos): 1–12 salvo la sesión (**DEMOSTRADA**) y la creación de cada gasto individual (**DEMOSTRADA** en `fn_create_expense`).

Principios:
1. **Denegar por defecto**: cada ruta del escáner exige acceso probado; sin prueba, 403/503 (extiende F2-1 y F3-8).
2. **El archivo nunca pasa por una función si supera el límite de 4,5 MB** (Vercel, https://vercel.com/docs/functions/limitations, consultado 2026-10-27; ver Fase 2). La subida directa privada es **PROPUESTA**; su mecanismo concreto es NO DEMOSTRADO.
3. **El estado vive en servidor** y se cambia solo con actualizaciones condicionales atómicas (patrón `pending-actions.ts`).
4. **El proveedor OCR se aísla** tras una interfaz; ningún tipo del proveedor sale del adaptador.
5. **La cuota se consume en un único punto** (`uploaded→processing`) con libro idempotente.
6. **La confirmación crea los gastos y los vínculos en una sola transacción.**
7. **Nada financiero** en analytics, logs, URLs ni almacenamiento del navegador.

### A.1 Procesamiento («job»)

Opciones (todas **PENDIENTE**; ninguna demostrada en este proyecto):

| Opción | Cómo | Pros | Contras |
|---|---|---|---|
| J1 Procesamiento en línea en la ruta `process` | La ruta llama al adaptador y espera | Sin infraestructura nueva | Depende de la duración máxima de la función (300 s por defecto con Fluid compute, https://vercel.com/docs/functions/limitations, 2026-10-27; plan del proyecto NO DEMOSTRADO); pérdida si se corta la petición; mal para PDF multipágina |
| J2 Tabla de intentos como cola + disparo | `OcrAttempt(queued)` reclamado con `UPDATE … FOR UPDATE SKIP LOCKED` y *lease*; un disparador lo invoca | Reutiliza Postgres; reintentos y reanudación | Hace falta un mecanismo de disparo y de barrido (planificador NO DEMOSTRADO) |
| J3 Cola de plataforma | Servicio gestionado de colas de Vercel | Entrega duradera | **NO DEMOSTRADO** disponibilidad/plan/coste en este proyecto; requiere dependencia; no verificado en esta fase |

**Recomendación provisional: J2**, con J1 solo como disparo opcional. La decisión del mecanismo bloquea la slice 5.

### A.2 Validación de archivos (PROPUESTO)

Orden en `complete`: 1) existe el objeto y es del ticket; 2) tamaño ≤ `{MAX_BYTES}`; 3) tipo por **firma de bytes** (no `Content-Type`/extensión) dentro de la lista; 4) imágenes: dimensiones ≤ `{MAX_PIXELS}` y comprobación de relación píxeles/bytes para descartar *pixel bombs*; 5) PDF: sin cifrado, sin JavaScript/acciones/archivos incrustados, páginas ≤ `{MAX_PAGES}`, tamaño de streams descomprimidos acotado; 6) reencodar imagen sin metadatos (EXIF/GPS); 7) antivirus si se decide; 8) calcular `sha256`. Cualquier fallo borra el objeto y deja el ticket en `deleted` con código. Dependencias para (4)–(6): **NO DEMOSTRADAS** en el repo; elegirlas es una decisión pendiente (no se añaden aquí).

## B. Estados: deltas respecto a Fase 0 y decisiones F2/F3

No se edita `state-machine.md`. Esta sección documenta deltas.

### B.1 Deltas

| Concepto | Fase 0 (`state-machine.md`) | Fase 4 (PROPUESTO) |
|---|---|---|
| Estados | uploaded, processing, ready_for_review, needs_review, confirmed, discarded, failed, expired, deleted | initiated, uploaded, processing, needs_review, confirmed, failed, expired, deleted |
| `initiated` | no existe | nuevo: ticket creado, sin archivo verificado |
| `ready_for_review` | estado | se elimina; es `needs_review` con `review_flags` vacíos (F2-4, F3) |
| `discarded` | estado | se elimina; es `deleted` con `status_reason = user_discarded` |
| Cuota | no definida | se consume en `uploaded→processing` (F2-3, PENDIENTE) |
| Reintentos | no definidos | `failed→processing` hasta `{MAX_RETRIES}` (propuesta 2), sin nueva cuota |

### B.2 Transiciones autorizadas

Actor: **U** usuario propietario (ruta autenticada), **S** sistema (ruta interna o función programada), **W** worker. Toda transición es una actualización condicional `WHERE id = ? AND user_id = ? AND status = <origen>` en la que gana una sola petición; cualquier otra recibe 409 `ILLEGAL_TRANSITION` o el resultado ya existente si es idempotente.

| Desde | Hacia | Actor | Condición / efecto | Idempotencia |
|---|---|---|---|---|
| — | initiated | U | Acceso + límite de tickets abiertos; clave `Idempotency-Key` | misma clave → mismo ticket |
| initiated | uploaded | U (tras `complete`) | Archivo validado | repetir `complete` devuelve el estado actual |
| initiated | expired | S | Sin archivo tras `{TTL_INITIATED}` (propuesta 15 min) | sí |
| initiated, uploaded | deleted | U | Cancelación; borra objeto | sí |
| uploaded | processing | U (`process`) | Consume cuota; crea intento `queued` | clave única `(ticket_id,'consume')` |
| uploaded | expired | S | `{TTL_UPLOADED}` (propuesta 1 h) | sí |
| processing | needs_review | W | Resultado válido normalizado y guardado | CAS por intento; si el ticket ya no está en `processing`, el resultado se descarta |
| processing | failed | W/S | Error permanente, reintentos agotados o *timeout* `{TTL_PROCESSING}` (propuesta 5 min); reembolso de cuota si el fallo es del sistema | clave `(ticket_id,'refund')` |
| processing | deleted | U | Cancelación: marca el intento `cancelled`; el worker comprueba el estado antes de escribir | sí |
| failed | processing | U (`retry`) | `attempt_count < {MAX_RETRIES}`; sin cuota nueva | clave por intento |
| failed | deleted / expired | U / S | Descarte o `{TTL_FAILED}` (propuesta 1 h) | sí |
| needs_review | confirmed | U (`confirm`) | Invariantes OK; crea gastos y vínculos atómicamente | `Idempotency-Key` de confirmación + `(ticket_id, group_no)` |
| needs_review | deleted | U | Descarte | sí |
| needs_review | expired | S | `{TTL_REVIEW}` (propuesta 24 h) | sí |
| confirmed | deleted | S / U | Borrado del original (por defecto al confirmar) o fin de retención | sí |
| expired | deleted | S | Limpieza | sí |
| deleted | — | — | Terminal | — |

Terminales: `deleted`. `confirmed` y `expired` son terminales de negocio que llevan a `deleted` para el original. No hay transición desde un terminal.

### B.3 Reglas transversales

- **Cancelación en vuelo:** la llamada al proveedor puede completarse tras cancelar; el worker escribe solo si el ticket sigue en `processing` y el intento no está `cancelled`. El coste ya incurrido no se reembolsa (PENDIENTE: texto de cuota).
- **Reintentos automáticos:** solo ante errores de red previos a que el proveedor acepte la petición; el número y la política de facturación del proveedor ante reintentos son NO DEMOSTRADOS. Máximo `{AUTO_RETRIES}` (propuesta 1).
- **Errores:** `error_kind` ∈ `transient`, `permanent`, `unsupported`, `quota`, `config`; nunca texto libre del proveedor.
- **Expiración:** calculada por `expires_at`; además de la lectura perezosa (patrón `ai_pending_actions`), un barrido borra archivos (necesita planificador: NO DEMOSTRADO, bloqueo).
- **Reloj:** las caducidades usan la hora de la base de datos, no del cliente.

## C. Modelo de datos

Resumen aquí; detalle por tabla y campo en [`data-model.md`](data-model.md). Todo **PROPUESTO**; ningún campo existe hoy.

Entidades: `scanner_tickets`, `scanner_ticket_files`, `scanner_ocr_attempts`, `scanner_receipt_drafts` (con confianza por campo), `scanner_receipt_lines`, `scanner_line_allocations`, `scanner_expense_links`, `scanner_quota_counters`, `scanner_quota_ledger`, `scanner_retention_requests`, `scanner_audit_events`.

Invariantes clave (detalle en `data-model.md`): suma de líneas = total; suma de repartos = importe de línea; un gasto por (ticket, grupo); EUR inicial; IVA ≤ total; cuota ≤ límite por día; aislamiento por `user_id` en todas las tablas; terminales inmutables.

## D. Contratos API

Detalle en [`api-contracts.md`](api-contracts.md): base versionada `/api/v1/scanner` (rutas existentes no están versionadas: `src/app/api/expenses/route.ts`), 13 operaciones con auth, entrada, salida, errores, límites, `Idempotency-Key`, Origin/CSRF, permisos y exclusiones de analytics y logs.

## E. Interfaz `ReceiptOcrProvider`

**PROPUESTA**; sin elegir proveedor ni SDK. El dominio nunca importa un SDK concreto.

```ts
// Boceto de contrato. No es código del proyecto.
type ConfidenceLevelInput = number | null; // 0..1; null = el proveedor no la da

interface OcrRequest {
  attemptId: string;            // opaco
  idempotencyKey: string;       // por intento
  bytes: Uint8Array;            // nunca una URL del cliente
  mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"; // lista final PENDIENTE
  pageCount: number;
  locale: "es" | "en";
  hints: { country: "ES"; currency: "EUR" };
  deadlineMs: number;           // tiempo máximo total
}

interface NormalizedReceiptV1 {
  schemaVersion: 1;
  merchant:      { value: string | null; confidence: ConfidenceLevelInput };
  date:          { value: string | null; confidence: ConfidenceLevelInput }; // ISO yyyy-mm-dd
  currency:      { value: string | null; confidence: ConfidenceLevelInput };
  totalCents:    { value: number | null; confidence: ConfidenceLevelInput };
  taxCents:      { value: number | null; confidence: ConfidenceLevelInput };
  paymentMethod: { value: "cash" | "card" | "other" | null; confidence: ConfidenceLevelInput }; // lista final PENDIENTE
  lines: Array<{
    description: { value: string | null; confidence: ConfidenceLevelInput };
    quantity:    { value: number | null; confidence: ConfidenceLevelInput };
    amountCents: { value: number | null; confidence: ConfidenceLevelInput };
  }>;
  pagesBilled: number;
  providerRequestId: string | null;
  versions: { adapter: string; providerModel: string | null };
}

type OcrOutcome =
  | { ok: true; receipt: NormalizedReceiptV1 }
  | { ok: false; kind: "transient" | "permanent" | "unsupported" | "quota" | "config";
      code: string;             // enumerado, sin texto libre del proveedor
      retryable: boolean; retryAfterMs?: number };

interface ReceiptOcrProvider {
  readonly id: string;
  readonly adapterVersion: string;
  analyze(req: OcrRequest): Promise<OcrOutcome>;
}
```

Reglas:
- **Entrada/salida:** bytes de entrada, JSON normalizado de salida; los importes se normalizan a céntimos enteros; el adaptador descarta direcciones, últimos dígitos de tarjeta, NIF y cualquier campo no listado (minimización, F3 B.13).
- **Confianza:** `null` si el proveedor no la da; la aplicación la trata como `unknown`. Los umbrales entre niveles son PENDIENTES. Para Google, la confianza por campo es NO DEMOSTRADA (Fase 1).
- **Timeouts:** `deadlineMs` global y *timeout* de conexión; al agotarse devuelve `transient`.
- **Reintentos:** solo operaciones idempotentes; `idempotencyKey` por intento; máximo `{AUTO_RETRIES}`; el reintento del usuario crea un intento nuevo.
- **Coste:** el adaptador informa `pagesBilled`; el coste en moneda se calcula fuera, con tarifa configurable (no hardcodeada). No hay importes de coste en analytics.
- **Redacción de logs:** el adaptador no registra bytes, texto ni mensajes del proveedor; solo `attemptId`, `code`, `kind`, latencia y `pagesBilled`.
- **Versionado:** `schemaVersion` del contrato y `adapterVersion`; cada intento guarda ambos (`scanner_ocr_attempts`).
- **Fallback:** **desactivado por defecto.** Un segundo proveedor implica otro subprocesador con DPA propio (Fase 1 §5). Si se activa, es una lista ordenada por configuración y solo para `unsupported`/`transient`, nunca para `permanent`.
- **Proveedor y región** salen de configuración de servidor; las credenciales solo en variables de entorno de servidor.
- **Pruebas:** un adaptador *fake* determinista reproduce los casos de `provider-synthetic-test-cases.md` (slice 4) y permite probar todo el flujo sin llamar a ningún proveedor.

### E.1 Clasificación (separada del OCR)

`ReceiptClassifier` es otra interfaz: entrada = líneas ya normalizadas; salida = categoría (una de las 4 existentes) y subcategoría opcional con `source: "rule" | "none"`. **Por defecto, sin LLM:** reglas deterministas sobre diccionarios y las categorías de `src/lib/schemas/common.ts` y `src/lib/subcategories.ts`. El clasificador actual `src/lib/ai/classifier.ts` y el sugeridor con respaldo GPT (`category-suggester.ts`) **no se reutilizan** por defecto: enviarían texto de tickets a OpenAI, subprocesador no evaluado (F2-9). Un clasificador LLM, si llega, es una implementación aparte, tras revisión de privacidad, sin herramientas, con salida estructurada y categorías validadas contra la lista cerrada.

## F. Seguridad

Resumen de controles. Amenazas y pruebas en [`threat-model.md`](threat-model.md); contexto en `privacy-security-architecture.md`. **No se declara cumplimiento legal.**

| Área | Requisito (PROPUESTO) | Estado base |
|---|---|---|
| Autorización | Denegar por defecto; 403 `PLUS_REQUIRED` para sin acceso; 503 `ACCESS_UNAVAILABLE` si no se puede comprobar | Base `requireAccess` DEMOSTRADA, abierta con interruptor apagado |
| Tenancy | `user_id` en cada tabla; RLS de lectura por propietario; escrituras solo por funciones; el cliente de servicio siempre con filtro explícito por `user_id` | Patrón DEMOSTRADO en `pending-actions.ts` |
| IDOR/enumeración | IDs aleatorios; 404 uniforme para ajeno/inexistente | PROPUESTO |
| Archivos | Magic bytes, tamaño, píxeles, páginas, PDF activo/cifrado, reencodado sin EXIF, antivirus si se decide | NO DEMOSTRADO en repo |
| URLs | Nunca públicas; firmadas, de corta duración, un solo propósito, `no-store`, `no-referrer` | Patrón DEMOSTRADO (pack) |
| SSRF | Sin URLs aportadas por el cliente; rutas generadas en servidor; el proveedor recibe bytes | PROPUESTO |
| Cifrado | **Solo como requisito.** Cifrado en reposo y gestión de claves de Supabase Storage: NO DEMOSTRADO | NO DEMOSTRADO |
| Retención y borrado | Borrado del objeto verificado (`deletion_verified_at`); sin afirmar borrado hasta verificarlo | PROPUESTO |
| Backups | Política de copias de DB y Storage: NO DEMOSTRADA | NO DEMOSTRADO |
| Logs | Solo IDs y códigos; sin cuerpos, texto OCR, importes ni mensajes de proveedor | `logApiError` actual registra mensaje y *stack*: requiere envoltorio |
| Abuso/costes | Cuota diaria idempotente, límite de tickets abiertos, límite de ritmo, límite de reintentos y páginas, tope global de gasto con corte | Rate limiting NO DEMOSTRADO |
| Acceso al proveedor | Credencial solo servidor; región UE configurada; solo datos sintéticos hasta cerrar DPA | Proveedor PENDIENTE |
| Origin/CSRF | Validar `Origin` frente a la URL base del sitio y exigir `application/json` en mutaciones | NO DEMOSTRADO en rutas actuales |

Bloqueos legales y de proveedor (no resueltos): DPA y subprocesadores; región efectiva; retención y entrenamiento del proveedor; política de privacidad; configuración real de Supabase (cifrado, backups, límites). Ver `decision-log.md`.

## G. Analytics (opcional y con consentimiento)

- Solo con consentimiento explícito (`src/lib/consent.ts`, `analyticsAllowed()`), nunca desde el servidor.
- Lista blanca de parámetros: `tool_name`, `page_path`, `page_title`, `source` (`camera`/`image`/`pdf`) y un estado técnico no financiero (`locked`, `quota_reached`, `offline`, `error`).
- Eventos solo si son necesarios (nombres PROPUESTOS): `scanner_opened`, `scanner_blocked_viewed`, `scanner_source_selected`, `scanner_ticket_submitted`, `scanner_ticket_confirmed`, `scanner_error`. Se reutiliza `expense_created` con `entry_method` existente si procede.
- **Prohibido:** importes, líneas, comercio, fecha, categorías, ratios, estados derivados de datos financieros (duplicado, discrepancia de totales, confianza), texto OCR, **ticket IDs**, URLs de archivo, nombre de proveedor y cualquier dato financiero.
- Hace falta un sanitizador por lista blanca para el escáner (hoy solo existe para calculadoras) y un test que falle ante parámetros fuera de lista.
- Las métricas de operación (colas, fallos, coste agregado) salen del servidor sin pasar por analytics del navegador.

## H. Plan

Ver [`implementation-plan.md`](implementation-plan.md).

## 11. Resumen de bloqueos P1/P2

| # | Bloqueo | Prio. | Qué lo cierra |
|---|---|---|---|
| 1 | Equivalencia Premium/Plus; contenido, nombre y precio del plan | P1 | Decisión del propietario |
| 2 | Jerarquía de entitlement para el escáner (founder, legacy_full, plus_*) | P1 | Decisión del propietario |
| 3 | Esquema real de `expenses` (columnas, tipos, escala de `amount`, RLS) y política de vínculo ticket↔gasto | P1 | Volcado del esquema de producción/staging en solo lectura |
| 4 | Proveedor OCR, DPA, región, retención y entrenamiento | P1 | Benchmark sintético + documentos del proveedor |
| 5 | Almacenamiento privado real: mecanismo de subida, cifrado en reposo, claves, backups | P1 | Prueba en staging + documentación del proveedor de Storage |
| 6 | Mecanismo de cola y de planificador de limpieza | P1 | Decisión técnica (J2 recomendada) y prueba en staging |
| 7 | Día de la cuota y momento de consumo | P1 | Decisión del propietario |
| 8 | Revisión legal/editorial (política de privacidad, consentimiento, copy) | P1 | Revisión externa; no se afirma cumplimiento |
| 9 | Límites de archivo/páginas/formatos; antivirus; librerías de imagen/PDF | P2 | Medición + decisión |
| 10 | Rate limiting y alertas de coste | P2 | Mecanismo elegido |
| 11 | Política de retención opcional y TTL | P2 | Decisión del propietario |
| 12 | Tolerancia de redondeo y umbrales de confianza | P2 | Pruebas sintéticas |
| 13 | Clasificador (reglas vs LLM) | P2 | Revisión de privacidad |

## 12. ¿Puede empezar la Fase 5?

**No debe empezar la implementación de producto.** Los bloqueos 1–8 son P1 y afectan a la base: el modelo de datos depende de 3, el acceso de 1–2, la subida de 5, el procesamiento de 6, la cuota de 7 y el uso de datos reales de 4 y 8.

Lo que sí podría hacerse **si el coordinador lo autoriza expresamente**, sin tocar datos reales ni exponer nada: trabajo de preparación sin dependencia de P1, descrito como «slice 0» en `implementation-plan.md` (obtener el esquema real en solo lectura y cerrar decisiones). Ninguna ruta, tabla ni cambio de interfaz debe desplegarse.
