# Escáner de tickets — Plan de implementación (Fase 4)

**Estado: PROPUESTA. No implementada.** Plan para una futura Fase 5. Ninguno de los archivos “probables” existe ni se crea ahora. Las rutas existentes citadas sí existen (DEMOSTRADO).

Etiquetas: **DEMOSTRADO** · **PROPUESTO** · **NO DEMOSTRADO** · **PENDIENTE**. Referencias: [`technical-architecture.md`](technical-architecture.md), [`data-model.md`](data-model.md), [`api-contracts.md`](api-contracts.md), [`decision-log.md`](decision-log.md).

## 0. Reglas del plan

- Cada slice es pequeña, revisable y se despliega **apagada** (sin interruptor activo para usuarios reales).
- Orden obligatorio: el pedido por el coordinador (slices 1–12). Se añade una **slice 0** de preparación sin código de producto.
- Pruebas de SQL con migraciones reales usando PGlite (método **DEMOSTRADO**: `src/__tests__/helpers/plus-pglite.ts`, `src/__tests__/security/`); pruebas de rutas con Vitest (`vitest.config.ts`, `src/__tests__/api/`); pruebas de accesibilidad estructural con axe (`src/__tests__/components/plus/plus-a11y.test.tsx`).
- Ningún slice usa tickets reales ni llama a un proveedor real antes de la slice 12 y de cerrar P1.
- Las migraciones se escriben y se revisan, pero **su aplicación en producción requiere autorización explícita** (el repo ya tiene un procedimiento: `docs/planning/phase3b-migration-runbook.md`).

## 1. Qué no puede empezar hasta resolver P1/P2

| Bloqueo | Prio. | Impide |
|---|---|---|
| Premium = Plus; contenido, nombre y precio | P1 | Slice 1 (permiso), copy final |
| Jerarquía de entitlement | P1 | Slice 1 |
| Esquema real de `expenses` y política de vínculo | P1 | Slice 3 (parte de vínculos), slice 7 |
| Proveedor OCR, DPA, región, retención, entrenamiento | P1 | Cualquier llamada real (slice 5 con proveedor real, slice 12) |
| Almacenamiento privado real: mecanismo, cifrado, claves, backups | P1 | Slice 2 (todo lo que no sea el contrato) |
| Cola y planificador de limpieza | P1 | Slice 5 (disparo) y slice 8 (limpieza) |
| Día de la cuota y momento de consumo | P1 | Slice 8 (cuota) |
| Revisión legal/editorial | P1 | Slice 12 (datos reales) |
| Límites de archivo, antivirus, librerías de imagen/PDF | P2 | Slice 2 (validación) |
| Rate limiting y alertas de coste | P2 | Slices 8, 11 |
| Retención voluntaria y TTL | P2 | Slice 7 |
| Umbrales de confianza y tolerancia de redondeo | P2 | Slice 6 |
| Clasificador (reglas vs LLM) | P2 | Slice 5 (clasificación) |

## 2. Slice 0 — Preparación (sin código de producto)

- **Objetivo:** cerrar lo que desbloquea todo lo demás.
- **Tareas:** obtener en solo lectura el DDL real y las políticas RLS de `expenses`/`months` y la configuración real de Storage (cifrado, límites, políticas); decisiones P1 del propietario; confirmar el mecanismo de cola/limpieza; ejecutar el benchmark sintético de Fase 1 con autorización y credenciales de prueba (no datos reales).
- **Archivos:** solo documentación en `docs/ticket-scanner/`.
- **Aceptación:** bloqueos P1 nº 1–7 cerrados o con decisión documentada en `decision-log.md`.
- **Bloqueos:** autorización del propietario.

## 3. Slices

### Slice 1 — Entitlement seguro

- **Objetivo:** acceso al escáner con **denegación por defecto**, también con `PLUS_SUBSCRIPTIONS_ENABLED` apagado.
- **Archivos probables:** modificar `src/lib/auth/require-access.ts` (nueva característica `ticket_scanner` y wrapper `requireScannerAccess`), `src/lib/auth/access-state.ts` solo si el permiso es nuevo; nueva `src/app/api/v1/scanner/capability/route.ts`; pruebas en `src/__tests__/lib/auth/` y `src/__tests__/api/`.
- **Migración:** ninguna si se reutiliza `can_use_plus_features`; si se crea permiso nuevo, una migración que amplíe `fn_my_access` (`supabase/migrations/20261013113040_plus_access_resolver.sql` como base) con su prueba ACL (`src/__tests__/security/plus-function-acl.test.ts`).
- **API:** `GET /capability`.
- **UI:** ninguna aún.
- **Pruebas:** gratuito → 403; sin sesión → 401; fallo de `fn_my_access` → 503; interruptor apagado → sigue denegando; estados founder/legacy/plus según la jerarquía decidida.
- **Aceptación:** matriz de estados × resultado probada; ninguna ruta del escáner abierta por defecto.
- **Bloqueos:** P1 nº 1 y 2.

### Slice 2 — Almacenamiento y subida privados

- **Objetivo:** subir un archivo a un bucket privado y validarlo, sin procesarlo.
- **Archivos probables:** `src/lib/scanner/storage.ts`, `src/lib/scanner/validate-file.ts`, rutas `tickets`, `upload-authorization`, `complete-upload`; pruebas con archivos sintéticos hostiles.
- **Migración:** bucket y políticas de Storage (según el mecanismo decidido); tablas `scanner_tickets` y `scanner_ticket_files` pueden ir con la slice 3.
- **API:** contratos 3, 4, 5.
- **UI:** ninguna aún (o una página técnica no enlazada).
- **Pruebas:** firma de bytes, tamaño, píxeles, PDF cifrado/activo, EXIF, acceso anónimo denegado, acceso entre usuarios denegado, URL firmada caduca.
- **Aceptación:** ningún objeto accesible sin sesión ni URL firmada vigente; archivo rechazado → borrado.
- **Bloqueos:** P1 nº 5 (mecanismo, cifrado, políticas); P2 (límites, antivirus, librerías).

### Slice 3 — Modelo y estados

- **Objetivo:** tablas, funciones de transición y control de concurrencia.
- **Archivos probables:** migraciones `supabase/migrations/2026…_scanner_*.sql` (+ rollback en `supabase/rollback/scanner/` como hace Plus), `src/lib/scanner/state-machine.ts`, `src/lib/scanner/invariants.ts`; pruebas PGlite.
- **Migración:** `scanner_tickets`, `scanner_ticket_files`, `scanner_ocr_attempts`, `scanner_receipt_drafts`, `scanner_receipt_lines`, `scanner_line_allocations`, `scanner_retention_requests`, `scanner_audit_events`, funciones de transición y RLS.
- **API:** ninguna (o lecturas internas).
- **Pruebas:** transiciones permitidas y prohibidas; CAS con peticiones concurrentes; RLS con dos usuarios; terminales inmutables; invariantes I1–I16 de `data-model.md`; ACL de funciones.
- **Aceptación:** pruebas SQL verdes con las migraciones reales en PGlite; rollback probado.
- **Bloqueos:** P1 nº 3 para `scanner_expense_links` (se difiere a la slice 7), nº 5.

### Slice 4 — Adaptador *fake*

- **Objetivo:** contrato `ReceiptOcrProvider` y un adaptador determinista.
- **Archivos probables:** `src/lib/scanner/provider/types.ts`, `…/fake.ts`, `…/registry.ts` (selección por configuración), `src/lib/scanner/normalize.ts`; pruebas con los 15 casos de `provider-synthetic-test-cases.md`.
- **Migración:** ninguna. **API:** ninguna. **UI:** ninguna.
- **Pruebas:** salida válida para cada caso; errores `transient/permanent/unsupported/quota/config`; ausencia de campos no listados (minimización); confianza `null` tratada como `unknown`.
- **Aceptación:** el dominio no importa ningún SDK; cambiar de adaptador es solo configuración.
- **Bloqueos:** ninguno técnico (no toca proveedores).

### Slice 5 — Procesamiento

- **Objetivo:** cola, worker, normalización, clasificación por reglas.
- **Archivos probables:** `src/lib/scanner/worker.ts`, `src/lib/scanner/classify-rules.ts`, ruta `process`, ruta interna del worker; tests.
- **Migración:** funciones `fn_scanner_apply_ocr_result` y reclamo de intentos con *lease*.
- **API:** contrato 7 (sin cuota real aún, con *stub* o con la cuota de la slice 8), contrato 6.
- **UI:** ninguna.
- **Pruebas:** reclamar con `SKIP LOCKED`, reanudar tras caída (lease), cancelar en vuelo, resultado descartado si el ticket ya no está en `processing`, prevalencia de ediciones del usuario, *timeouts*, sin logs de contenido.
- **Aceptación:** de `uploaded` a `needs_review` con el adaptador *fake*, sin intervención manual.
- **Bloqueos:** P1 nº 6 (mecanismo de cola); P2 (clasificador por reglas vs LLM: por defecto reglas).

### Slice 6 — Revisión

- **Objetivo:** edición del borrador y reparto.
- **Archivos probables:** `src/lib/scanner/draft-ops.ts`, ruta `PATCH draft`, `fn_scanner_apply_edits`; tests.
- **API:** contratos 6 y 8.
- **UI:** ninguna aún (las pantallas llegan en slice 9).
- **Pruebas:** operaciones, `If-Match`, `VERSION_CONFLICT`, repartos, línea de ajuste, prevalencia `user`, avisos de incoherencia.
- **Aceptación:** todas las invariantes de edición probadas.
- **Bloqueos:** P2 (umbrales de confianza, tolerancia de redondeo).

### Slice 7 — Confirmación idempotente y gastos

- **Objetivo:** crear uno o varios gastos atómicamente y vincularlos.
- **Archivos probables:** `fn_scanner_confirm`, tabla `scanner_expense_links`, ruta `confirm`, reutilización de `src/lib/months.ts` para el ciclo; tests de integración con `fn_create_expense`.
- **Migración:** `scanner_expense_links` y `fn_scanner_confirm` (verificar contra el esquema real de `expenses`).
- **API:** contrato 11, 12.
- **Pruebas:** doble confirmación concurrente → un solo conjunto de gastos; ciclo cerrado → 409; suma ≠ total → 422; rollback íntegro si falla un gasto; contador mensual coherente; borrar un gasto elimina el vínculo; llamada anidada a `fn_create_expense` (**NO DEMOSTRADO**, probar primero).
- **Aceptación:** invariantes I1–I4, I11, I15 verdes.
- **Bloqueos:** P1 nº 3 (esquema real, agrupado, nota); P2 (retención).

### Slice 8 — Cuota y limpieza

- **Objetivo:** cuota diaria idempotente, reembolso, caducidad y borrado verificado.
- **Archivos probables:** `fn_scanner_consume_quota`, tablas `scanner_quota_*`, `fn_scanner_sweep`, ruta/trabajo de barrido, límite de ritmo, tope de gasto global.
- **API:** contratos 2, 7 (cuota real), 10, 13.
- **Pruebas:** carrera de 20 peticiones no supera el límite; un consumo y un reembolso por ticket; el día cambia según la zona decidida; caducados se borran y se verifica; el barrido es idempotente.
- **Aceptación:** invariantes I8, I16; borrado verificable.
- **Bloqueos:** P1 nº 6 (planificador) y nº 7 (día y consumo); P2 (rate limiting).

### Slice 9 — i18n y accesibilidad

- **Objetivo:** pantallas S1–S15 con ES/EN y requisitos de accesibilidad.
- **Archivos probables:** `src/app/[locale]/app/scan/…`, `src/components/scanner/…`, `messages/es.json` y `messages/en.json` (espacio `Scanner`), tests de paridad de claves y axe.
- **UI:** según `ux-functional-spec.md`; pantalla bloqueada sin `input type=file` en el DOM para gratuitos.
- **Pruebas:** paridad ES/EN; foco y *aria-live*; navegación por teclado; el DOM del gratuito no contiene selector ni `capture`; textos **[COND]** ocultos hasta verificación; manual con lector de pantalla y contraste real.
- **Aceptación:** pruebas estructurales verdes; revisión manual documentada (sin afirmar cumplimiento).
- **Bloqueos:** P1 nº 1 (nombre y contenido del plan); P2 (patrón de diálogo accesible, límites).

### Slice 10 — Analytics con consentimiento

- **Objetivo:** eventos mínimos y lista blanca.
- **Archivos probables:** `src/lib/analytics.ts` (sanitizador del escáner), eventos en componentes del escáner; tests siguiendo `src/__tests__/lib/analytics.test.ts`.
- **Pruebas:** sin consentimiento no se envía nada; parámetros fuera de lista descartados; ningún importe, línea, comercio, fecha, categoría, ratio, ticket ID ni URL.
- **Aceptación:** test de lista blanca verde.
- **Bloqueos:** ninguno técnico.

### Slice 11 — Integración y seguridad

- **Objetivo:** pruebas de extremo a extremo con el adaptador *fake* y revisión de seguridad.
- **Pruebas:** dos usuarios nunca cruzan datos (IDOR/enumeración); gratuito rechazado en todas las rutas; abuso de cuota; corpus hostil; logs sin datos financieros; límites de cuerpo (4,5 MB); caducidad y borrado; Origin/CSRF.
- **Aceptación:** `threat-model.md` con cada amenaza T01–T30 con prueba o riesgo aceptado por escrito.
- **Bloqueos:** P2 (rate limiting, antivirus).

### Slice 12 — Closed beta

- **Objetivo:** grupo cerrado, con interruptor de corte.
- **Condiciones de entrada:** P1 cerrado (proveedor, DPA, región, retención, entrenamiento, política de privacidad actualizada, revisión legal), precio y plan decididos, backups y borrado documentados, autorización del propietario.
- **Alcance:** lista de invitados, cuota baja, tope de gasto, métricas agregadas no sensibles, procedimiento de baja y de borrado a petición.
- **Aceptación:** criterios de `provider-synthetic-test-cases.md` cumplidos; sin incidentes de privacidad; margen de coste aceptado.
- **Bloqueos:** todos los P1.

## 4. Dependencias entre slices

```
0 ──> 1 ──> 2 ──> 3 ──> 4 ──> 5 ──> 6 ──> 7 ──> 8 ──> 9 ──> 10 ──> 11 ──> 12
            └──────── (3 requiere 2 para el archivo) ────────┘
```

Las slices 4 (adaptador *fake*) y 10 (analytics) tienen pocas dependencias y podrían adelantarse si el coordinador lo decide.

## 5. Veredicto

La implementación (Fase 5) **no debe comenzar** hasta cerrar los P1 de la tabla de la sección 1 que bloquean la slice 1 (permiso) y la slice 3 (modelo): premium/Plus, jerarquía de entitlement, esquema real de `expenses` y almacenamiento real. Solo la **slice 0** puede hacerse ahora, y requiere autorización para leer esquemas reales en solo lectura.
