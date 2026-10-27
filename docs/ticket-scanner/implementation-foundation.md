# Escáner de tickets — Base de implementación (Fase 5)

**Estado: implementado solo como lógica pura y testeable.** No hay rutas, tablas, migraciones, pantallas, proveedor OCR ni imágenes reales. Decisiones: [`decision-log.md`](decision-log.md) §10. Código en `src/lib/scanner/`; tests en `src/__tests__/lib/scanner/`.

## Contratos reales

| Módulo | Exporta (resumen) |
|---|---|
| `ocr-contract.ts` | `ReceiptOcrProvider`, `OcrRequest`, `OcrOutcome`, `NormalizedReceiptV1` (importes en céntimos, confianza `0..1` o `null`), `normalizedReceiptV1Schema` (zod estricto), `parseNormalizedReceipt` (el error no contiene contenido), `describeConfidence` (sin umbrales: pendientes) |
| `ticket-state.ts` | `TicketState` (`id`, `status`, `attemptCount`, `originalStorage`, `hasDraft`, `confirmKey`), `ALLOWED_TRANSITIONS`, `transitionTicket`, `requestOriginalDeletion`, `recordOriginalDeletionVerified` |
| `quota.ts` | `SCANNER_CYCLE_TICKET_LIMIT = 5`, `consumeQuota`, `refundQuota`, `getQuotaStatus`, `QuotaLedger` (idempotente por `(ticketId, kind)`) |
| `workflow.ts` | `startProcessing` (consume cuota y pasa a `processing`, o no hace nada), `failProcessing` (reembolso si el fallo es del sistema) |
| `draft.ts` | `draftFromReceipt`, `assignLineCategory`, `acceptProposal`, `splitLine`, `categoryTotals`, `validateDraft`, `buildExpensePlan`, `confirmDraft` |
| `privacy.ts` | `findPrivacyViolations`, `assertPrivacySafe`, `sanitizeScannerAnalyticsEvent`, `toSafeLogContext`, `isUrlPrivacySafe`, `safeBrowserStorageSet` |
| `access.ts` | `resolveScannerAccess(AccessState)` → `allowed`, `plan_required`, `undecided` o `unavailable` |

## Estados

`initiated → uploaded → processing → needs_review → confirmed → deleted`, más `failed` y `expired` (lista de Fase 4). No existe estado de imagen conservada. `deleted` exige `originalStorage` en `none` o `deleted_verified`; confirmar o caducar deja el original en `deletion_pending`, y solo quien verifique la ausencia real del objeto llama a `recordOriginalDeletionVerified`.

## Cuota

5 tickets aceptados por `cycleId`. Se consume al pasar `uploaded → processing`; reintentar no consume; un fallo del sistema reembolsa una vez. Un `cycleId` nuevo parte de 0; el módulo no recibe fechas. Persistencia: bloqueada (decision-log §10.4).

## Revisión y confirmación

Cada línea se asigna a una de las cuatro categorías de `src/lib/schemas/common.ts` o se divide en 2 o más partes con suma exacta. La propuesta (`categoryProposal`) no cuenta hasta que la persona fija la categoría. `confirmDraft` exige `userConfirmed === true`, versión vigente, ciclo abierto (lo resuelve el llamador) y borrador válido; devuelve un plan de grupos por categoría y no crea gastos.

## Privacidad

Se prohíben claves, binarios y cadenas con importes, porcentajes o URLs firmadas en analytics, logs, URL y almacenamiento del navegador; los resultados dan rutas, nunca valores. Lista blanca de analytics: `scanner_opened`, `scanner_blocked_viewed`, `scanner_source_selected` (`source`), `scanner_ticket_submitted`, `scanner_ticket_confirmed`, `scanner_error` (`code`). **Aún no está conectada** a `analytics.ts` ni a `logger.ts`.

## Límites de esta fase y reversibilidad

Sin migraciones, endpoints, UI, SDK ni secretos, y sin tocar Stripe ni Premium. Revertir = borrar `src/lib/scanner/`, `src/__tests__/lib/scanner/` y las dos secciones de docs.
