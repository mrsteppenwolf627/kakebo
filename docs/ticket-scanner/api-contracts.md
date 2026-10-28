# Escáner de tickets — Contratos API (Fase 4)

**Estado: PROPUESTA. Ninguna ruta de este documento existe ni está implementada.** No se han creado rutas, esquemas ni código. Los contratos son versionables: cualquier cambio incompatible genera `/api/v2/…`.

Etiquetas: **DEMOSTRADO** (repo) · **PROPUESTO** · **NO DEMOSTRADO** · **PENDIENTE**. Contexto: [`technical-architecture.md`](technical-architecture.md), [`data-model.md`](data-model.md), [`privacy-security-architecture.md`](privacy-security-architecture.md), [`ux-functional-spec.md`](ux-functional-spec.md).

## 0. Convenciones comunes

| Aspecto | Contrato | Estado |
|---|---|---|
| Base | `/api/v1/scanner` (las rutas actuales no están versionadas: `src/app/api/expenses/route.ts`) | PROPUESTO |
| Estructura de ruta | `withLogging` + `requireAuth` + `handleApiError`; `export const dynamic = "force-dynamic"`; cuerpo validado con `zod` `.strict()` (claves desconocidas rechazadas) | **DEMOSTRADO** en `src/app/api/stripe/checkout/route.ts`, `src/lib/api/index.ts` |
| Éxito | `{ "success": true, "data": … }` | **DEMOSTRADO** (`src/lib/api/responses.ts`) |
| Error | `{ "success": false, "error": { "code", "message", "details?" } }` | **DEMOSTRADO** (`src/lib/api/responses.ts`, `src/lib/api/errors.ts`) |
| Autenticación | Sesión de Supabase por cookie (`requireAuth`, 401 `UNAUTHORIZED`) | **DEMOSTRADO** (`src/lib/api/auth.ts`) |
| Acceso al escáner | `requireScannerAccess` PROPUESTO: **deniega por defecto**; usa `fn_my_access()` (`src/lib/auth/require-access.ts`); 403 `PLUS_REQUIRED`, 503 `ACCESS_UNAVAILABLE`. Permiso: reutilizar `can_use_plus_features` o crear uno nuevo según P1; **no** puede quedar abierto con `PLUS_SUBSCRIPTIONS_ENABLED` apagado | PROPUESTO (la base es DEMOSTRADA) |
| Identificadores | `ticketId` UUID aleatorio opaco; ajeno o inexistente → 404 uniforme `NOT_FOUND` (`apiErrors.notFound`) | PROPUESTO |
| Caché | Todas las respuestas `Cache-Control: no-store` | PROPUESTO (patrón DEMOSTRADO en `src/app/api/premium/download/route.ts`) |
| Idempotencia | Cabecera `Idempotency-Key` (UUID v4) obligatoria donde se indica; misma clave y mismo cuerpo → misma respuesta; misma clave y otro cuerpo → 422 `IDEMPOTENCY_KEY_REUSED` | PROPUESTO |
| Origin/CSRF | En todo `POST/PUT/PATCH/DELETE`: exigir `Content-Type: application/json` y que `Origin` coincida con el origen de la URL base del sitio (precedente de configuración: `getSiteUrl` en `src/lib/stripe/plus.ts`); si falta `Origin`, exigir `Sec-Fetch-Site: same-origin`. Las rutas `GET` no tienen efectos secundarios. Atributos de la cookie de sesión (SameSite): **NO DEMOSTRADO**. Ninguna ruta actual valida Origin: **NO DEMOSTRADO** | PROPUESTO |
| Límite de cuerpo JSON | ≤ `{MAX_JSON_BYTES}` (propuesta 16 KB). El archivo no viaja por estas rutas salvo el modo `proxy` de la autorización de subida | PROPUESTO |
| Límite de Vercel | 4,5 MB de cuerpo por función (https://vercel.com/docs/functions/limitations, consultado 2026-10-27); plan del proyecto: NO DEMOSTRADO | externo |
| Rate limiting | Por usuario y operación; mecanismo y valores **PENDIENTES**; 429 `RATE_LIMITED` con `Retry-After` | PROPUESTO (no hay rate limiting hoy: NO DEMOSTRADO) |
| Logs | `withLogging` registra método, ruta, estado y duración; **la ruta incluye `ticketId`** (opaco). No se registran cuerpos, borradores, importes, comercio, descripciones, nombres de archivo ni URLs firmadas. `logApiError` actual registra mensaje y *stack*: se necesita un envoltorio que sustituya mensajes por códigos | PROPUESTO |
| Analytics | Ningún endpoint emite analytics; el cliente puede enviar eventos de la lista blanca con consentimiento (ver arquitectura §G). **Prohibido** incluir ticket IDs, importes, líneas, comercio, fecha, categorías, ratios o estados derivados | PROPUESTO |
| Códigos nuevos | `SCANNER_DISABLED`, `QUOTA_EXCEEDED`, `UPLOAD_EXPIRED`, `FILE_REJECTED`, `ILLEGAL_TRANSITION`, `VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`, `CYCLE_CLOSED`, `RETRY_LIMIT`, `TOO_MANY_OPEN_TICKETS`, `RATE_LIMITED` | PROPUESTO |
| Códigos reutilizados | `UNAUTHORIZED` 401, `FORBIDDEN` 403, `PLUS_REQUIRED` 403, `NOT_FOUND` 404, `CONFLICT` 409, `VALIDATION_ERROR` 422, `BAD_REQUEST` 400, `ACCESS_UNAVAILABLE` 503 | **DEMOSTRADO** (`src/lib/api/errors.ts`) |

Los textos de `message` son neutros y de servidor; la interfaz muestra su propio copy (`ux-copy-es-en.md`).

## 1. Capacidad y derecho de acceso

`GET /api/v1/scanner/capability`

- **Auth:** sesión. **Permisos:** cualquier usuario autenticado puede preguntar (la respuesta no revela datos de otros). **Idempotency-Key:** no. **CSRF/Origin:** no aplica (GET sin efectos).
- **Salida 200:**
  ```json
  { "success": true, "data": {
      "contractVersion": 1,
      "enabled": true,
      "access": { "allowed": false, "reason": "plan_required" },
      "quota": { "limit": null, "used": null, "remaining": null, "day": null },
      "limits": { "maxBytes": null, "maxPages": null, "mimeTypes": [], "maxOpenTickets": null }
  } }
  ```
  `reason` ∈ `allowed, plan_required, quota_reached, disabled, unavailable`. Los valores de `limits` y `quota.limit` salen de configuración (PENDIENTES); mientras no estén decididos se devuelven `null`, nunca cifras inventadas.
- **Errores:** 401, 503 `ACCESS_UNAVAILABLE`. **Límites:** sin cuerpo.
- **Logs/analytics:** no se registra `reason` con el usuario en analytics; el cliente puede enviar el estado técnico `locked` si hay consentimiento.
- La respuesta de un usuario sin acceso **no** incluye URLs de subida ni identificadores de tickets.

## 2. Cuota

`GET /api/v1/scanner/quota`

- **Auth:** sesión + acceso. Sin `Idempotency-Key`.
- **Salida 200:** `{ "limit": n, "used": n, "remaining": n, "day": "YYYY-MM-DD", "tz": "…" }`. Definición del día: **PENDIENTE** (F2-2, F3-4).
- **Errores:** 401, 403 `PLUS_REQUIRED`, 503. **Logs:** sin cuerpo.
- El consumo **no** se hace aquí; ocurre en `process` (sección 7).

## 3. Iniciar ticket

`POST /api/v1/scanner/tickets`

- **Auth:** sesión + acceso. **Idempotency-Key:** obligatoria (UUID). **CSRF/Origin:** sí.
- **Entrada (`.strict()`):**
  ```json
  { "source": "camera|image|pdf", "locale": "es|en",
    "declaredMime": "string", "declaredSizeBytes": 0 }
  ```
  `declaredMime` y `declaredSizeBytes` son orientativos y se **revalidan** tras la subida; no se confía en ellos.
- **Salida 201 (o 200 si la clave ya existía):** `{ "ticketId": "uuid", "status": "initiated", "expiresAt": "ISO" }`.
- **Errores:** 401, 403 `PLUS_REQUIRED`, 409 `TOO_MANY_OPEN_TICKETS`, 422 `VALIDATION_ERROR` (tipo declarado fuera de lista, tamaño declarado > límite), 422 `IDEMPOTENCY_KEY_REUSED`, 429 `RATE_LIMITED`, 503.
- **Efectos:** crea `scanner_tickets(initiated)`; **no consume cuota**.
- **Exclusiones:** no se registra `declaredMime`/tamaño con el usuario en analytics.

## 4. Autorización de subida privada

`POST /api/v1/scanner/tickets/{ticketId}/upload-authorization`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** no (devuelve la autorización vigente si existe). **CSRF/Origin:** sí.
- **Entrada:** `{}` (vacía; todo se deduce del ticket).
- **Salida 200:**
  ```json
  { "mode": "direct|proxy",
    "upload": { "method": "PUT", "url": "…", "headers": {}, "expiresAt": "ISO", "maxBytes": 0 } }
  ```
  - `direct`: URL firmada de un solo uso hacia el bucket privado, atada a una ruta generada por el servidor. **Mecanismo concreto de Supabase y límites por plan: NO DEMOSTRADOS** (bloqueo P1 nº 5). El `connect-src` actual permite `https://*.supabase.co` (`next.config.ts`).
  - `proxy`: el archivo se envía a una ruta del propio servidor; solo viable si `maxBytes` < 4,5 MB (límite de Vercel). Una foto de móvil puede superarlo, por lo que `proxy` no basta como única vía.
- **Errores:** 401, 403, 404, 409 `ILLEGAL_TRANSITION` (ticket no está en `initiated`), 410/409 `UPLOAD_EXPIRED`, 429.
- **Exclusiones:** la `url` firmada **nunca** se registra ni se envía a analytics; respuesta `no-store` y `Referrer-Policy: no-referrer` (como `/api/premium/*` en `next.config.ts`).

## 5. Confirmar subida

`POST /api/v1/scanner/tickets/{ticketId}/complete-upload`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** no (idempotente por estado). **CSRF/Origin:** sí.
- **Entrada:** `{}`.
- **Efectos:** validación en servidor (arquitectura §A.2): existencia del objeto, tamaño, firma de bytes, píxeles, páginas, PDF activo/cifrado, reencodado sin EXIF, antivirus (PENDIENTE), `sha256`. Éxito → `uploaded`. Fallo → borra el objeto y `deleted` con código.
- **Salida 200:** `{ "status": "uploaded", "file": { "mime": "…", "pageCount": 1, "sizeBytes": 0 } }`; en fallo, 422 `FILE_REJECTED` con `details.reasonCode` ∈ `unsupported_type, too_large, too_many_pages, protected, corrupt, not_receipt`.
- **Errores:** 401, 403, 404, 409 `ILLEGAL_TRANSITION`, 422 `FILE_REJECTED`, 429, 503.
- **Límites:** cuerpo vacío.
- **Exclusiones:** no se registra el nombre del archivo (nunca se guarda) ni `sha256` fuera del almacén privado.

## 6. Estado del ticket

`GET /api/v1/scanner/tickets/{ticketId}`

- **Auth:** sesión + acceso + propiedad. **Sin** `Idempotency-Key`. **CSRF/Origin:** no (GET).
- **Salida 200:**
  ```json
  { "ticketId": "uuid", "status": "processing", "expiresAt": "ISO",
    "attemptCount": 0, "retryAllowed": false,
    "draftVersion": 0,
    "draft": null }
  ```
  `draft` solo cuando `status = needs_review` (cabecera, líneas, repartos, `fieldMeta` con `src` y nivel de confianza `unknown|low|medium|high`, `reviewFlags`, aviso de duplicado). Los niveles se derivan de umbrales PENDIENTES.
- **Sondeo:** el servidor devuelve `Retry-After` y el cliente espera con intervalo creciente y duración máxima; sin conexiones largas.
- **Errores:** 401, 403, 404 (uniforme para ajeno), 503.
- **Exclusiones:** el borrador (S3) viaja solo en esta respuesta autenticada, `no-store`; no se registra ni se envía a analytics.

## 7. Procesar (enviar a OCR)

`POST /api/v1/scanner/tickets/{ticketId}/process`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** obligatoria. **CSRF/Origin:** sí.
- **Entrada:** `{}`.
- **Efectos (una transacción):** consume cuota con clave `(ticketId,'consume')`; crea `OcrAttempt(queued)`; `uploaded→processing`.
- **Salida 202:** `{ "status": "processing" }`. Repetición con la misma clave → 202 sin nuevo consumo.
- **Errores:** 401, 403, 404, 409 `ILLEGAL_TRANSITION`, 403/429 `QUOTA_EXCEEDED` (con `details.resetsAt` solo si el día está decidido), 503 (proveedor no configurado: `SCANNER_DISABLED`).
- **Exclusiones:** el proveedor no se menciona en la respuesta.

## 8. Revisión y correcciones

`PATCH /api/v1/scanner/tickets/{ticketId}/draft`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** no (control de concurrencia con `If-Match`). **CSRF/Origin:** sí.
- **Cabecera:** `If-Match: "<draftVersion>"` obligatoria; si no coincide → 409 `VERSION_CONFLICT` con la versión actual.
- **Entrada (`.strict()`):** lista acotada de operaciones (≤ `{MAX_OPS}`, propuesta 50):
  ```json
  { "ops": [
    { "op": "setHeader", "field": "merchant|date|total|tax|paymentMethod", "value": "…|null" },
    { "op": "upsertLine", "lineId": "uuid|null", "description": "…", "quantity": 1, "amountCents": 0 },
    { "op": "removeLine", "lineId": "uuid" },
    { "op": "setLineCategory", "lineId": "uuid", "category": "survival|optional|culture|extra", "subcategory": "…|null" },
    { "op": "setAllocations", "lineId": "uuid", "parts": [ { "category": "…", "subcategory": "…|null", "amountCents": 0 } ] },
    { "op": "addAdjustment", "amountCents": 0 }
  ] }
  ```
- **Reglas:** todo valor editado queda con `src = 'user'` y no lo sobrescribe el OCR; importes en céntimos enteros; moneda fija EUR; categorías de la lista cerrada; los límites de longitud de campos son `{MAX_MERCHANT}`, `{MAX_DESC}`, `{MAX_LINES}`, `{MAX_SPLITS}` (PENDIENTES).
- **Salida 200:** `{ "draftVersion": n, "issues": [ { "code": "SUM_MISMATCH|MISSING_MERCHANT|…", "path": "…" } ] }`. Las incoherencias son **avisos**; solo `confirm` las bloquea.
- **Errores:** 401, 403, 404, 409 `VERSION_CONFLICT` / `ILLEGAL_TRANSITION` (no está en `needs_review`), 422 `VALIDATION_ERROR`, 429.
- **Exclusiones:** el cuerpo contiene datos S3: nunca se registra; la auditoría guarda solo `field_path`.

## 9. Reintento

`POST /api/v1/scanner/tickets/{ticketId}/retry`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** obligatoria. **CSRF/Origin:** sí.
- **Efectos:** `failed→processing` creando `OcrAttempt` nuevo si `attemptCount < {MAX_RETRIES}`; **no** consume cuota nueva.
- **Salida 202:** `{ "status": "processing", "attemptCount": n }`.
- **Errores:** 401, 403, 404, 409 `ILLEGAL_TRANSITION`, 409 `RETRY_LIMIT`, 429, 503.

## 10. Descartar

`POST /api/v1/scanner/tickets/{ticketId}/discard` (alternativa: `DELETE /tickets/{ticketId}`)

- **Auth:** sesión + propiedad (no exige cuota ni acceso vigente si el ticket ya existe, para que el usuario pueda borrar sus datos aunque pierda el plan). **Idempotency-Key:** no (idempotente: descartar un `deleted` devuelve 200). **CSRF/Origin:** sí.
- **Efectos:** `→ deleted` con `status_reason = user_discarded`; borra borrador y original; verifica la eliminación antes de marcarla.
- **Salida 200:** `{ "status": "deleted" }`.
- **Errores:** 401, 404, 409 `ILLEGAL_TRANSITION` (ya `confirmed` con retención: se usa la sección 12).

## 11. Confirmar y crear gastos

`POST /api/v1/scanner/tickets/{ticketId}/confirm`

- **Auth:** sesión + acceso + propiedad. **Idempotency-Key:** obligatoria (`confirm_key`). **CSRF/Origin:** sí.
- **Entrada (`.strict()`):**
  ```json
  { "draftVersion": 0,
    "retention": { "keepOriginal": false, "ttlDays": null },
    "acknowledgedWarnings": ["DUPLICATE_POSSIBLE"] }
  ```
  `ttlDays` solo si `keepOriginal` es `true`; sus valores válidos son `{RETENTION_OPTIONS}` (PENDIENTES).
- **Efectos (una transacción tras resolver el ciclo en TypeScript, `src/lib/months.ts`):** valida I1–I7 (modelo de datos §4); crea uno o varios gastos y sus vínculos de forma atómica; `needs_review→confirmed`; programa el borrado del original (o la retención).
- **Salida 200 (también para repeticiones con la misma clave):**
  ```json
  { "status": "confirmed",
    "expenses": [ { "expenseId": "uuid", "category": "survival", "amountCents": 0 } ],
    "original": { "state": "scheduled_for_deletion|kept", "keepUntil": null } }
  ```
  El texto «eliminado» solo se muestra tras verificación (`deletion_verified_at`); `scheduled_for_deletion` no equivale a «eliminado».
- **Errores:** 401, 403, 404, 409 `VERSION_CONFLICT`, 409 `ILLEGAL_TRANSITION`, 409 `CYCLE_CLOSED` (DEMOSTRADO como regla en `src/app/api/expenses/route.ts`), 422 `VALIDATION_ERROR` con `details.issues` (suma distinta, categoría ausente, moneda no EUR, reparto incompleto), 422 `IDEMPOTENCY_KEY_REUSED`, 429, 503.
- **Límites:** nº máximo de gastos por ticket `{MAX_EXPENSES_PER_TICKET}` (PENDIENTE).
- **Exclusiones:** la respuesta lleva importes (dominio privado) y no se registra; ningún evento de analytics lleva el número de gastos ni importes. La nota de cada gasto (≤500 caracteres: `src/lib/schemas/expense.ts`) se decide en F3-5.
- **Dependencias:** esquema real de `expenses` y función atómica de creación (bloqueo P1 nº 3).

## 12. Retención y borrado del original

- `PUT /api/v1/scanner/tickets/{ticketId}/retention` — fija o cambia la conservación voluntaria (`{ "keepOriginal": true, "ttlDays": n }`). Solo en `confirmed` con original aún presente, o durante `needs_review`. Salida: `{ "state": "kept", "keepUntil": "ISO" }`.
- `DELETE /api/v1/scanner/tickets/{ticketId}/original` — borra ahora el original (idempotente). Salida: `{ "state": "deletion_pending|deleted" }`; `deleted` solo si el objeto ya se verificó ausente.
- **Auth:** sesión + propiedad (el acceso vigente no es necesario para borrar). **Idempotency-Key:** no (idempotente por estado). **CSRF/Origin:** sí.
- **Errores:** 401, 404, 409 `ILLEGAL_TRANSITION`, 422 (`ttlDays` fuera de las opciones), 503.
- **Exclusiones:** sin nombres de archivo ni URLs.

## 13. Acceso al original (recuperación antes de confirmar)

`GET /api/v1/scanner/tickets/{ticketId}/original-url`

- **Auth:** sesión + propiedad. **Sin** `Idempotency-Key`.
- **Salida 200:** `{ "url": "…", "expiresAt": "ISO" }` — URL firmada de corta duración (patrón de 600 s DEMOSTRADO en el pack, valor PENDIENTE aquí). Solo si el original existe (antes de confirmar o si se conservó).
- **Errores:** 401, 404, 410 `NOT_FOUND` si ya se borró.
- **Exclusiones:** la URL no se registra, no va a analytics ni a `Referer` (`Referrer-Policy: no-referrer`).

## 14. Resumen

| # | Operación | Método y ruta | Idempotency-Key | Cambia estado |
|---|---|---|---|---|
| 1 | Capacidad | `GET …/capability` | no | no |
| 2 | Cuota | `GET …/quota` | no | no |
| 3 | Iniciar | `POST …/tickets` | sí | → initiated |
| 4 | Autorizar subida | `POST …/tickets/{id}/upload-authorization` | no | no |
| 5 | Confirmar subida | `POST …/tickets/{id}/complete-upload` | no | initiated→uploaded |
| 6 | Estado | `GET …/tickets/{id}` | no | no |
| 7 | Procesar | `POST …/tickets/{id}/process` | sí | uploaded→processing |
| 8 | Corregir | `PATCH …/tickets/{id}/draft` | `If-Match` | no |
| 9 | Reintentar | `POST …/tickets/{id}/retry` | sí | failed→processing |
| 10 | Descartar | `POST …/tickets/{id}/discard` | no | → deleted |
| 11 | Confirmar gastos | `POST …/tickets/{id}/confirm` | sí | needs_review→confirmed |
| 12 | Retención/borrado | `PUT …/retention`, `DELETE …/original` | no | no / original |
| 13 | Original | `GET …/tickets/{id}/original-url` | no | no |

Interno (no expuesto): trigger del worker y barrido de caducados. Autenticación de esas invocaciones (secreto, firma de plataforma): PENDIENTE; no se acepta un secreto en la query (precedente a no repetir en `src/app/api/expenses/route.ts`).
