# Escáner de tickets — Flujo de datos y fronteras de confianza (Fase 2)

Complementa [`privacy-security-architecture.md`](privacy-security-architecture.md). Todo el flujo es **diseño PROPUESTO**: no existe ningún tramo del escáner en el repositorio. Se indica qué piezas de apoyo están DEMOSTRADAS.

## 1. Diagrama

```
 [F0 NAVEGADOR]  ── TB1 ──>  [F1 API de la app]  ── TB2 ──>  [F2 ALMACENAMIENTO PRIVADO]
  cámara / archivo            sesión · entitlement ·          objeto con ruta aleatoria,
  (no confiable)              cuota · límites                 sin URL pública, cifrado*
        │                          │                                   │
        │ subida directa           │ crea Ticket (initiated)           │ lectura solo desde servidor
        └──────────────────────────┴──────────────────────────────────┘
                                   │
                          [F3 VALIDADOR/WORKER]  (tipo real, tamaño, páginas, PDF, EXIF, antivirus*)
                                   │ TB3
                                   ▼
                          [F4 ADAPTADOR ReceiptOcrProvider]  ── TB4 ──>  [F5 PROVEEDOR OCR]  (tercero)
                                   │ <────────── JSON del proveedor (no confiable) ───────────┘
                                   ▼
                          [F6 NORMALIZADOR]  esquema versionado · validación · confianza
                                   │ TB5
                                   ▼
                          [F7 REVISIÓN]  navegador del propietario  (edita, reparte, confirma)
                                   │ TB6  confirmación idempotente
                                   ▼
                          [F8 CREACIÓN DE GASTOS]  fn_create_expense (existente) o función atómica nueva*
                                   │
                                   ▼
                          [F9 BORRADO / RETENCIÓN]  borrar original · verificar · TTL opcional
 * = requisito, no demostrado
```

Trust boundaries (TB): TB1 navegador→servidor; TB2 servidor→almacenamiento; TB3 almacenamiento→procesamiento de archivos no confiables; TB4 servidor→tercero; TB5 salida de tercero→dominio propio; TB6 usuario→escritura de gastos.

## 2. Tramos y controles

| Tramo | Qué ocurre | Controles obligatorios | Estado |
|---|---|---|---|
| **F0→F1 (TB1)** iniciar | El navegador pide crear un ticket | 1) Sesión válida (`requireAuth`, 401). 2) Entitlement del escáner en servidor (denegar por defecto, 403 `PLUS_REQUIRED`). 3) Límite de tickets abiertos y ritmo. 4) Clave de idempotencia. 5) Origen de la petición/CSRF según el patrón de cookies de Supabase (verificación concreta: NO DEMOSTRADO) | Sesión: **DEMOSTRADA** (`src/lib/api/auth.ts`). Entitlement de escáner, límites: **PROPUESTO**. Entitlement base: **DEMOSTRADO** pero abierto si el interruptor está apagado (`src/lib/auth/require-access.ts`) |
| **F1→F2** autorización de subida | El servidor emite permiso de subida de un solo uso | Ruta generada por servidor (nunca el nombre del cliente); caducidad corta; atada a `ticket_id` y `user_id`; tamaño y tipo máximos si el almacenamiento lo permite | **PROPUESTO**. Mecanismo de Supabase: NO DEMOSTRADO. CSP permite `*.supabase.co` (`next.config.ts`) |
| **F0→F2** subida directa | El archivo va directo al bucket privado | Bucket privado; políticas por usuario/ruta; sin lectura pública. Solo se usa si el archivo >4,5 MB (límite de función de Vercel, https://vercel.com/docs/functions/limitations, consultado 2026-10-27) | **PROPUESTO** |
| **F2→F3 (TB3)** validación | El servidor lee el objeto y valida | Firma de bytes real; lista de tipos; tamaño; dimensiones; páginas; PDF sin cifrado/JS/adjuntos; límite de descompresión; reencodado sin EXIF; antivirus si se decide; ejecución en proceso aislado con tiempo y memoria acotados; si falla → borrado inmediato y estado `deleted`/`failed` | **PROPUESTO** |
| **F3→F4** cuota y envío | Paso `uploaded→processing` | Cuota consumida de forma idempotente `(ticket_id,'consume')` en la misma transacción que el cambio de estado; reintentos limitados | **PROPUESTO** |
| **F4→F5 (TB4)** llamada a OCR | Los bytes se envían al proveedor | Se envían bytes desde nuestro servidor; **nunca** una URL aportada por el cliente (SSRF); host del proveedor en lista cerrada; TLS; región UE configurada; clave del proveedor solo en variables de entorno de servidor; no se envían identificadores de usuario; tiempo máximo; reintento acotado | **PROPUESTO**. Proveedor, DPA, región, retención, entrenamiento: **NO DEMOSTRADOS** |
| **F5→F6 (TB5)** respuesta | La respuesta del proveedor es **no confiable** | Validar contra un esquema estricto; limitar longitudes; descartar campos desconocidos; no ejecutar ni interpretar el texto; tratar el texto de artículos como datos (inyección en texto OCR); si hay LLM de clasificación, salida estructurada y categorías validadas contra la lista cerrada (`src/lib/schemas/common.ts`) | **PROPUESTO** |
| **F6→F7** guardado del borrador | Se guarda el resultado normalizado | Escritura solo por servidor; propiedad por `user_id`; sin copia a analítica ni a logs | **PROPUESTO** (patrón: `ai_pending_actions`, **DEMOSTRADO**) |
| **F7** revisión | El propietario edita | Toda lectura/escritura comprueba propiedad (evitar IDOR); respuestas `404` uniformes para tickets ajenos; `Cache-Control: no-store`; la descarga del original usa URL firmada corta (patrón del pack: `src/app/api/premium/download/route.ts`, **DEMOSTRADO** como patrón) | **PROPUESTO** |
| **F7→F8 (TB6)** confirmar | El usuario confirma | Confirmación explícita; actualización condicional `needs_review→confirmed` (un solo ganador); `ExpenseLink` único por asignación; validar ciclo abierto, fechas, importes, categorías contra los esquemas existentes (`src/lib/schemas/expense.ts`); **ninguna creación sin confirmar** | **PROPUESTO**. Validaciones de gasto: **DEMOSTRADAS** (`createExpenseSchema`, `fn_create_expense`). Creación atómica de N gastos: **NO EXISTE** |
| **F8→F9** borrado | Tras confirmar se borra el original | Borrar objeto, verificar su ausencia, anotar `deletion_verified_at`; si hay retención voluntaria, TTL y revocación; borrar OCR crudo y borrador según política | **PROPUESTO**. Planificador: NO DEMOSTRADO |

## 3. Qué dato vive dónde

| Dato | Dónde (PROPUESTO) | Quién lo ve | Sale a |
|---|---|---|---|
| Imagen/PDF original | Bucket privado | Solo el servidor; el propietario con URL firmada corta | Proveedor OCR (bytes) |
| Texto OCR crudo | No se guarda por defecto | — | — |
| Resultado normalizado | Tabla privada de servidor | Propietario | Interfaz de revisión |
| Gastos | Tablas existentes | Propietario | Aplicación |
| Cuota | `QuotaLedger` | Servidor | Métricas agregadas sin S3 |
| Auditoría | `ReviewAction` sin valores | Servidor | — |

## 4. Prohibido en cualquier tramo

- Datos del ticket en analytics (`src/lib/analytics.ts`), logs (`src/lib/logger.ts`), URLs, `localStorage`/cookies o mensajes de error.
- Servir el original por una URL pública o permanente.
- Aceptar URLs de archivo desde el cliente.
- Usar el cliente de servicio (`createAdminClient`, ignora RLS) sin filtro explícito por `user_id`.
- Secretos en la query (precedente a no repetir: llamada interna en `src/app/api/expenses/route.ts`).
