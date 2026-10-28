# Escáner de tickets — Privacidad, seguridad y arquitectura de datos (Fase 2)

Rama `feature/ticket-scanner-fase-2`. Especificación técnica **revisable**; no es una implementación ni una garantía de cumplimiento legal. No se ha escrito código, esquema ni migraciones.

Convenciones:
- **DEMOSTRADO** = comprobado leyendo el repositorio (se cita ruta). **PROPUESTO** = diseño nuevo, no existe hoy. **NO DEMOSTRADO** = no hay evidencia en el repo ni en las fuentes consultadas.
- Fuentes externas: URL y fecha de consulta (2026-10-27).
- Documentos previos: [`product-requirements.md`](product-requirements.md), [`state-machine.md`](state-machine.md), [`mvp-scope.md`](mvp-scope.md), [`decision-log.md`](decision-log.md) (Fase 0); [`provider-benchmark.md`](provider-benchmark.md), [`provider-benchmark.json`](provider-benchmark.json), [`provider-synthetic-test-cases.md`](provider-synthetic-test-cases.md) (Fase 1). Complementos de esta fase: [`data-flow.md`](data-flow.md), [`threat-model.md`](threat-model.md), [`privacy-security-architecture.json`](privacy-security-architecture.json).

## 0. Resumen no técnico

El escáner manejará datos delicados (fotos de tickets: comercios, importes, a veces tarjeta parcial). Este documento fija **cómo deberían** protegerse: archivo privado desde el primer momento, acceso solo del propietario, cuota contada en servidor, OCR tras una interfaz propia para poder cambiar de proveedor, gastos creados solo tras confirmación, borrado por defecto y nada financiero en analítica ni en logs.

Lo que hoy **no** existe en el repositorio: almacenamiento de archivos de usuario, límite diario, tablas de tickets, tareas programadas, antivirus, backups documentados y cualquier permiso específico del escáner. Hay **bloqueos P1** (sección G) que impiden implementar: qué significa «Premium», el modelo de gastos, el proveedor OCR y su DPA, y la política de retención.

## 1. Evidencia del repositorio (hechos)

| Tema | Hecho | Ruta |
|---|---|---|
| Sesión | `requireAuth()` obtiene el usuario con `supabase.auth.getUser()`; 401 si no hay sesión | `src/lib/api/auth.ts` |
| Entitlement de suscripción | Estados `founder`, `legacy_full`, `plus_active`, `plus_canceled_pending`, `free_under_limit`, `free_readonly` | `src/lib/auth/access-state.ts` |
| Comprobación servidor | `requireAccess(feature, supabase)` llama a `fn_my_access()` con la sesión del usuario; fail-closed (503) si falla | `src/lib/auth/require-access.ts` |
| Interruptor | `PLUS_SUBSCRIPTIONS_ENABLED === "true"` activa restricciones. **Apagado, `requireAccess` devuelve `{enforced:false}` y no restringe nada** | `src/lib/auth/require-access.ts` |
| Características existentes | `ai`, `ai_search`, `export_reports`, `plus_features`, `billing`. **No hay `ticket_scanner`** | `src/lib/auth/require-access.ts` (`AccessFeature`) |
| Permisos en SQL | `fn_my_access()` devuelve `is_premium` y permisos `can_use_ai`, `can_export_reports`, `can_use_plus_features`, `can_manage_billing`, `can_create_expense` | `supabase/migrations/20261013113040_plus_access_resolver.sql` |
| Estado histórico | ADR-003: modelo freemium «preparado, inactivo»; producción conserva acceso completo; verificación de producción fechada 2026-10-05 y no re-verificada | `ADRs.md` (ADR-003) |
| Código antiguo | `canUsePremium(profile)` devuelve `true` para cualquier perfil autenticado | `src/lib/auth/access-control.ts` |
| Precio visible | 3,99 €/mes y 39,90 €/año, solo para mostrar | `src/lib/plus/pricing.ts` |
| Gasto | `date`, `amount`, `category` (4 valores), `note` ≤500, `subcategory` opcional; sin comercio/IVA/pago/artículos/vínculo | `src/lib/schemas/expense.ts`, `src/lib/schemas/common.ts` |
| Creación | Solo vía RPC `fn_create_expense`, un gasto por llamada; incrementa el contador mensual y valida ciclo cerrado | `src/app/api/expenses/route.ts`, `supabase/migrations/20260916_phase3b_monetization_foundation.sql` |
| Contador existente | `expense_monthly_usage` por mes natural `Europe/Madrid`; en modo compatible es solo métrica | mismo archivo SQL |
| DDL de `expenses` | No está en `supabase/migrations/` (solo se altera): **NO DEMOSTRADO** el esquema real y su RLS | `supabase/migrations/*` |
| Patrón de acción de un solo uso | `ai_pending_actions`: id opaco, `UPDATE … WHERE status='pending' … RETURNING` atómico, TTL 10 min, RLS sin políticas, acceso solo con service role + `user_id` explícito, caducidad calculada al leer (sin job) | `src/lib/agents-v2/pending-actions.ts`, `supabase/migrations/20260914_add_ai_pending_actions.sql` |
| Admin client | `createAdminClient()` usa la clave de servicio: **ignora RLS**; cada consulta debe filtrar por `user_id` a mano | `src/lib/supabase/admin.ts` |
| Almacenamiento de archivos | Solo un bucket privado del pack Premium, URL firmada de 600 s, respuesta 302, `Cache-Control: no-store`; `Referrer-Policy: no-referrer` en `/api/premium/*` | `src/app/api/premium/download/route.ts`, `src/lib/premium/manifest.ts`, `next.config.ts` |
| Subidas de usuario | Ninguna: sin `input type="file"`, `capture`, `getUserMedia`, `formData()` ni `storage.from` de subida en `src/` | búsqueda en `src/` |
| Límites propios | Sin `vercel.json`, sin `bodySizeLimit`, sin `maxDuration` en rutas (solo `runtime='edge'` en `src/app/api/og/route.tsx`) | `next.config.ts`, `src/app/api/` |
| Rate limiting | No se encontró ninguno por nombre | `src/` |
| CSP | `connect-src 'self' https://*.supabase.co …google-analytics…`; `img-src 'self' blob: data: https://* …`; `frame-src 'none'`; `object-src 'none'` | `next.config.ts` |
| Jobs/cron | Sin `vercel.json`, sin `.github/`. El único «job» es un `fetch` sin esperar disparado desde `POST /api/expenses` hacia `/api/ai/process-embeddings`, con un secreto interno en la query y un valor por defecto de desarrollo. **No copiar este patrón** | `src/app/api/expenses/route.ts` |
| Backups | Sin configuración en el repo; solo scripts de rollback SQL | `supabase/rollback/`, `supabase/manual-ops/` — backup de DB/Storage: **NO DEMOSTRADO** |
| Logs | `pino` JSON en producción; `withLogging` registra método, ruta, `userId`, estado y duración; `logApiError` registra mensaje y *stack* | `src/lib/logger.ts`, `src/lib/api/withLogging.ts` |
| Precedente a evitar | `tool-executor` registra `params` de herramientas de gasto, que pueden incluir importes | `src/lib/ai/tool-executor.ts:27`, `:78` |
| Observabilidad de terceros | No se demostró ninguna (Sentry, OpenTelemetry, Vercel Analytics) | búsqueda en `package.json` y `src/` |
| Drenaje de logs de Vercel | **NO DEMOSTRADO** |
| Analytics | Lista cerrada de eventos; propiedades de tipo libre; lista blanca solo para la calculadora de ahorro; GA4 solo con consentimiento | `src/lib/analytics.ts`, `src/lib/consent.ts`, `src/components/analytics/GoogleAnalytics.tsx` |
| Evento de gasto actual | `expense_created` con `entry_method:"manual"` (sin importes) | `src/app/[locale]/app/new/NewExpenseClient.tsx` |
| Idiomas | `es`/`en`, `next-intl` | `src/i18n/routing.ts`, `messages/*.json` |
| IA existente | Clasificación con OpenAI (`openai` en dependencias) — subprocesador **no incluido en la evaluación de Fase 1** | `src/lib/ai/classifier.ts`, `package.json` |
| Política de privacidad | Contenido en `messages/*.json` (clave `Privacy`); no revisado en detalle: **NO DEMOSTRADO** que cubra tickets/terceros OCR | `src/app/[locale]/privacy/page.tsx` |

Fuentes externas (consultadas 2026-10-27):
- Vercel Functions: cuerpo de petición/respuesta máximo **4,5 MB** (error 413 `FUNCTION_PAYLOAD_TOO_LARGE`); duración por defecto 300 s con Fluid compute (Hobby: máximo 300 s; Pro/Enterprise: máximo 800 s) — https://vercel.com/docs/functions/limitations (última actualización indicada por Vercel: 2026-08-24). Qué plan usa este proyecto: **NO DEMOSTRADO**.
- Supabase Storage: subida estándar recomendada hasta 6 MB y TUS para archivos mayores; sin políticas RLS no se permite subir; las claves de servicio saltan RLS — https://supabase.com/docs/guides/storage/uploads/standard-uploads y https://supabase.com/docs/guides/storage/security/access-control. Estas páginas **no afirman cifrado en reposo**: NO DEMOSTRADO. Límites de tamaño por plan, URLs firmadas de subida y `allowed_mime_types`: NO DEMOSTRADO en esta consulta.

## A. Decisiones y límites de producto

### A.1 Premium/Plus

- **Hoy el código usa el entitlement Plus**, resuelto por `fn_my_access()`; el permiso genérico para funciones Plus es `can_use_plus_features` y coincide con `is_premium` (`supabase/migrations/20261013113040_plus_access_resolver.sql`). «Premium» en el repo designa además el pack Excel/PDF de pago único (`src/lib/premium/*`), que es otra cosa.
- **No puede asumirse:** (1) que «Premium» del encargo sea Plus; (2) que Plus esté activo en producción: con el interruptor apagado no se restringe nada, y ADR-003 documenta que la producción conservaba acceso completo; (3) que `founder` y `legacy_full` deban incluir el escáner (hoy `is_premium` los cubriría); (4) que existan el precio de 5,99 € o el cupo de 100 usuarios.
- **Decisión que bloquea la implementación (P1):** confirmar la equivalencia Premium = Plus (o definir un nivel nuevo) y el precio. Hasta entonces no se puede definir `AccessFeature` ni permiso.
- **Requisito de seguridad (PROPUESTO):** el escáner debe **denegar por defecto** si no se puede demostrar el entitlement, incluso con `PLUS_SUBSCRIPTIONS_ENABLED` apagado. Es la diferencia clave con las funciones actuales, que quedan abiertas con el interruptor apagado.

### A.2 Usuarios gratuitos

- La interfaz muestra la función bloqueada (patrón existente: `src/components/plus/PlusRequiredNotice.tsx`), **sin renderizar `input type="file"` ni activar la cámara**.
- El bloqueo de UI es solo cosmético. Toda ruta del escáner (iniciar, subir, procesar, confirmar, descargar) comprueba el entitlement **en servidor**, antes de crear ningún registro o URL de subida (PROPUESTO).
- Respuesta consistente para usuarios gratuitos: 403 con el código `PLUS_REQUIRED` existente (`src/lib/api/errors.ts`), sin revelar si existen tickets.

### A.3 Límite de 5 tickets al día: definición del «día»

| Opción | Pros | Contras |
|---|---|---|
| UTC | Simple, sin ambigüedad técnica | El reinicio cae a las 01:00/02:00 en España: confuso |
| Zona del usuario | Intuitivo | Manipulable cambiando la zona; requiere guardarla; viaja con el usuario |
| Zona de negocio (`Europe/Madrid`) | Coherente con el contador mensual existente (`expense_monthly_usage`); no manipulable | Los usuarios en Canarias o fuera de España ven el reinicio desplazado |

- **No está decidido** (P1). **Recomendación provisional:** zona de negocio `Europe/Madrid`, calculada en servidor, igual que `fn_create_expense`. Bloqueo: decisión del propietario.
- Debe poder cambiarse sin migrar datos: guardar `quota_day` (fecha calculada) y la zona usada en cada entrada del libro de cuota.

### A.4 Cuándo se consume cuota

| Momento | Pros | Contras |
|---|---|---|
| Al aceptar la subida | Frena abuso de almacenamiento | Penaliza subidas que luego fallan o se cancelan |
| **Al enviar a OCR** | **Es donde se incurre el coste** | Hay que gestionar reintentos y fallos |
| Al confirmar el gasto | Justo para el usuario | El coste ya se pagó; abre a abuso (subir y no confirmar) |

**Recomendación provisional (idempotente):** consumir **al pasar de `uploaded` a `processing`** (envío a OCR), con una entrada en el libro de cuota con clave única `(ticket_id, 'consume')`. Reintentar el mismo ticket no vuelve a consumir. Si el sistema falla (error del proveedor, tiempo agotado, archivo ilegible) se registra una entrada compensatoria `(ticket_id, 'refund')`, también única. Una subida que nunca llega a OCR no consume cuota pero sí cuenta contra un límite aparte de tickets abiertos (A.7) para frenar el abuso de almacenamiento. El número de reintentos por ticket es limitado (PROPUESTO: 2), porque cada intento se factura al proveedor.

### A.5 Estados del ticket

Estados solicitados en esta fase: `initiated`, `uploaded`, `processing`, `needs_review`, `confirmed`, `failed`, `expired`, `deleted`.

Diferencias con Fase 0 (`state-machine.md`): se añade `initiated` (ticket creado, aún sin archivo verificado); `ready_for_review` y `discarded` desaparecen como estados. Propuesta: la revisión limpia o dudosa se distingue con una marca (`review_flags`) dentro de `needs_review`, y el descarte del usuario pasa a `deleted` con motivo `user_discarded`. **Es un cambio de diseño pendiente de aprobación** (ver `decision-log.md`); no se ha editado `state-machine.md`.

| Desde | Hacia | Condición | Notas |
|---|---|---|---|
| `initiated` | `uploaded` | Archivo recibido y validado (tipo real, tamaño, páginas) | |
| `initiated` | `expired` | Sin archivo tras 15 min (PROPUESTO) | |
| `initiated` / `uploaded` | `deleted` | El usuario cancela | |
| `uploaded` | `processing` | Cuota consumida y envío a OCR | Idempotente por `ticket_id` |
| `uploaded` | `expired` | Sin procesar tras 1 h (PROPUESTO) | |
| `processing` | `needs_review` | OCR correcto y normalizado | |
| `processing` | `failed` | Error o tiempo agotado (PROPUESTO: 5 min) | Reembolso de cuota |
| `failed` | `processing` | Reintento del usuario, hasta 2 intentos | No consume cuota nueva |
| `failed` | `deleted` / `expired` | Descarte o 1 h sin reintento | |
| `needs_review` | `confirmed` | Confirmación explícita e idempotente | Crea gastos |
| `needs_review` | `deleted` | Descarte | |
| `needs_review` | `expired` | 24 h sin acción (PROPUESTO) | |
| `confirmed` | `deleted` | Borrado del original por defecto | O al vencer la retención voluntaria |
| `expired` | `deleted` | Limpieza | |
| `deleted` | — | Terminal | |

Reglas: cada transición es una actualización condicional atómica en servidor (patrón de `src/lib/agents-v2/pending-actions.ts`); las demás se rechazan; los plazos son parámetros, no valores fijados; la caducidad requiere un mecanismo de limpieza **que no existe hoy** (ver D.6).

### A.6 Borrado y retención

- **Por defecto:** el original (imagen/PDF) se elimina al confirmar. Tras confirmar no hay recuperación del original.
- **Retención voluntaria:** el usuario puede pedir conservarlo; se crea una `RetentionRequest` con TTL elegido. Valores y máximo: **pendientes** (P1/P2, sección G). Debe poder revocarse en cualquier momento.
- **Antes de confirmar:** el propietario puede ver su borrador y su original (descarga mediante URL firmada de corta duración con `Cache-Control: no-store`, mismo patrón que el pack Premium) y puede borrarlo. Esta es la interpretación de «derecho de recuperación antes de confirmar»; si el encargo se refería a otra cosa, hay que aclararlo.
- **Borrado verificable (PROPUESTO):** tras borrar, se comprueba que el objeto ya no existe en el almacenamiento y se guarda `deletion_verified_at` (sin contenido). Un fallo reintenta y alerta.
- **OCR raw y borrador normalizado:** por defecto no se guarda la respuesta cruda del proveedor; si se guarda para depuración, tiene TTL corto y se borra con el ticket.
- Qué ocurre con el borrador normalizado tras confirmar (conservar para historial o eliminar): **decisión pendiente**; depende del modelo de gastos.
- **Backups:** el original borrado podría persistir en copias de seguridad. Política de backups de Supabase para DB y Storage: **NO DEMOSTRADO**. Condición de salida: documentar la retención máxima de copias y que los originales no entren en ellas o caduquen en un plazo comunicado.

### A.7 Duplicados y multipágina

- **Duplicados (PROPUESTO):** dos señales, solo como aviso, nunca bloqueo: (1) `sha256` del archivo por usuario (detecta el mismo archivo; no detecta una nueva foto del mismo ticket); (2) clave semántica normalizada `(comercio, fecha, total)` frente a gastos y tickets confirmados del mismo usuario. Se compara solo dentro del propio usuario. La comparación semántica se hace tras el OCR.
- **Multipágina:** un ticket = un archivo. PDF con límite de páginas configurable (límites documentados por proveedor en Fase 1: Google 10 págs. online; AWS PDF síncrono 1 pág.; el proveedor no está decidido). Fotos de un ticket largo en varias imágenes: **fuera del MVP**. Cuota: un ticket consume 1 unidad con independencia del nº de páginas, pero el nº de páginas facturadas se registra por intento para el control de coste.
- **Límite de tickets abiertos** por usuario (PROPUESTO, valor pendiente) para frenar subidas sin procesar.

### A.8 Archivos: tamaño, tipo, PDF y límites de plataforma

- **Límite de Vercel:** 4,5 MB de cuerpo para una función (fuente en la sección 1). Una foto de móvil puede superarlo, así que el diseño no puede depender de pasar el archivo por una función.
- **Subida directa privada (PROPUESTO):** el servidor crea el `Ticket`, comprueba sesión, entitlement y límite de tickets abiertos, y emite una autorización de subida de un solo uso, de corta duración y atada a una ruta generada por el servidor. El navegador sube directamente al almacenamiento. El `connect-src` actual ya permite `https://*.supabase.co`; otro origen exigiría modificar la CSP. El mecanismo concreto de Supabase para URLs firmadas de subida, el límite por plan y `allowed_mime_types`: **NO DEMOSTRADO**; deben verificarse antes de elegirlo.
- **Validación en servidor tras la subida (PROPUESTO), no confiar en el cliente:** detectar el tipo por contenido (firma de bytes), no por `Content-Type` ni extensión; lista de tipos permitidos (JPEG, PNG, WebP, PDF; HEIC: pendiente, depende del proveedor); tamaño máximo (valor pendiente); dimensiones máximas; recuento de páginas; rechazar PDF cifrados o con contraseña, con JavaScript o archivos incrustados; límite de descompresión (zip-bomb de imágenes y de streams del PDF); descartar el archivo si falla cualquier regla.
- **EXIF:** las fotos pueden llevar geolocalización y modelo de dispositivo. Reencodar la imagen sin metadatos antes de enviarla al OCR y antes de conservarla. Las librerías de imagen disponibles en el repo: **NO DEMOSTRADO** (no se añaden dependencias en esta fase).
- **Antivirus:** no hay ningún análisis de malware en el repo ni se demostró en Supabase. Opciones: servicio de escaneo externo (otro subprocesador), análisis en un worker aislado, o aceptar el riesgo si el original solo se rasteriza y nunca se sirve a otros usuarios. Decisión pendiente.
- **Previsualización de PDF en el navegador:** `object-src 'none'` y `frame-src 'none'` impiden incrustarlo; requeriría cambiar la CSP o rasterizar en servidor. Pendiente.

### A.9 Nada financiero fuera del dominio privado

- **Analytics:** ningún evento del escáner con importes, artículos, comercios, categorías, fechas del ticket ni proveedor OCR. Hoy `EventProperties` admite cualquier valor y solo la calculadora de ahorro tiene lista blanca (`src/lib/analytics.ts`); el escáner necesita su propia lista blanca (PROPUESTO) y un test que falle si se añade otra propiedad. Eventos aceptables: conteos y estados no financieros (p. ej. `scanner_opened`, `scanner_blocked_free`).
- **Logs:** solo identificadores (`ticket_id`, `attempt_id`), códigos de error enumerados, estado y duración. Nunca cuerpos, texto OCR, importes ni nombres de archivo. Los mensajes de error de proveedores pueden eco-ar contenido: se registran por código, no por mensaje (hoy `logApiError` registra el mensaje y el *stack* completos).
- **URLs:** ninguna ruta ni parámetro con datos del ticket; identificadores opacos aleatorios; sin secretos en la query.
- **`localStorage`, `sessionStorage` y cookies:** ningún dato del ticket. Un borrador pendiente vive en el servidor (como `ai_pending_actions`), no en el navegador. El único uso permitido del almacenamiento del navegador sigue siendo la preferencia de consentimiento (`src/lib/consent.ts`).

## B. Flujo de datos y fronteras de confianza

Ver [`data-flow.md`](data-flow.md) para el diagrama y la tabla de controles por frontera, con el estado DEMOSTRADO/PROPUESTO de cada tramo.

## C. Seguridad y privacidad

Ver [`threat-model.md`](threat-model.md) para STRIDE completo con mitigaciones, responsable, evidencia y condición de aceptación. Requisitos transversales:

- **Cifrado en tránsito:** HTTPS/TLS en todos los tramos. El repo lo impone en el navegador con HSTS (`next.config.ts`); la verificación del proveedor se documentará.
- **Cifrado en reposo:** requisito. Que Supabase Storage cifre en reposo: **NO DEMOSTRADO** (las páginas consultadas no lo afirman). No se afirma que exista hoy.
- **Gestión de claves:** requisito. Quién las gestiona (proveedor, o cifrado de aplicación con clave propia), rotación y acceso: **decisión pendiente**; no se afirma que exista hoy. La clave de servicio nunca llega al navegador (`src/lib/supabase/admin.ts` es solo servidor).
- **No exposición pública del original:** bucket privado; sin URL pública; sin enlaces permanentes; las URLs firmadas son de un solo propósito y de corta duración; `no-store`; `no-referrer`. La política de acceso del bucket **debe** definirse por usuario/ruta (Supabase deniega por defecto sin políticas, según su documentación).
- **Proveedor OCR:** DPA, subprocesadores, región, retención y uso para entrenamiento son **NO DEMOSTRADOS** según Fase 1 (`provider-benchmark.md`, secciones 5, 9 y 11). Mientras tanto, **solo datos sintéticos**.
- **Subprocesador adicional posible:** el clasificador actual usa OpenAI. Si el texto de los artículos se envía a un LLM para clasificar, se añade un subprocesador que Fase 1 no evaluó. Opción preferida: clasificar con reglas y las categorías existentes sin LLM, o decidirlo tras la revisión de privacidad.
- **Política pública y consentimiento:** cualquier cambio en `messages/*.json` o en la política corresponde a revisión editorial/legal; esta fase no los modifica ni afirma cumplimiento legal.

## D. Arquitectura recomendada (reversible)

### D.1 Interfaz propia del proveedor

```ts
// Boceto de contrato (PROPUESTO, no implementado).
interface ReceiptOcrProvider {
  readonly id: string;               // «provider id», nunca importado desde un SDK concreto en el dominio
  readonly adapterVersion: string;
  analyze(input: { bytes: Uint8Array; mime: string; locale: "es" | "en"; idempotencyKey: string }): Promise<NormalizedReceipt>;
}
```

`NormalizedReceipt` es un JSON versionado (`schemaVersion`) con `merchant`, `date`, `currency`, `total`, `tax[]`, `paymentMethod` e `items[]`, y **confianza por campo** (0–1 o ausente). Si el proveedor no da confianza por campo (Google: NO DEMOSTRADO en Fase 1), el adaptador devuelve `null` y el campo se trata como baja confianza. Ningún tipo del proveedor sale del adaptador.

- **Proveedor no decidido:** hasta tener las pruebas sintéticas y la revisión de privacidad, el proveedor se selecciona por configuración. Sin nombre de proveedor en el dominio, las tablas ni los eventos.
- Los dos finalistas de Fase 1 (Google Expense Parser UE, AWS Textract UE) son **candidatos, no decisión**.

### D.2 Subida, procesamiento y consistencia

- **Subida directa privada** (A.8). Ninguna ruta de función recibe el archivo si supera el límite de 4,5 MB.
- **Síncrono frente a asíncrono:** depende del proveedor y del tamaño. El diseño usa siempre estado persistido en servidor: el cliente consulta el estado del ticket (sondeo con intervalo creciente, límite de duración y solo para el propietario); no depende de que una petición HTTP larga sobreviva. Plan de Vercel y límites de duración: NO DEMOSTRADO para este proyecto (ver sección 1).
- **Webhook del proveedor (si se usa):** autenticado por firma, con comprobación de que el ticket está en `processing`, idempotente por `provider_request_id` y sin confiar en el contenido para decidir identidad. Si el proveedor no firma webhooks, se usa sondeo.
- **Idempotencia:** clave de idempotencia por ticket aportada por el cliente, única por usuario; la confirmación es una operación única por ticket (`ExpenseLink` único); el libro de cuota tiene clave única.
- **Rate limiting:** no existe hoy. Debe haber un límite por usuario en iniciar/subir/consultar estado, aparte de la cuota diaria (mecanismo pendiente: la plataforma y el almacén para el contador no están demostrados).
- **Limpieza:** necesita un planificador. **NO DEMOSTRADO** (sin `vercel.json` ni workflows). Opciones: tareas programadas de plataforma, `pg_cron` en la base de datos (disponibilidad en este proyecto: NO DEMOSTRADO), o limpieza perezosa al acceder (como `ai_pending_actions`, pero no borra archivos huérfanos). Sin planificador, la expiración no se puede garantizar: **bloqueo**.
- **Separación de datos (PROPUESTO):** identidad (usuario/ticket), original (bucket), OCR crudo (opcional, corta vida), resultado normalizado (borrador) y gastos (tablas existentes) viven en lugares distintos con permisos distintos; los gastos nunca incluyen el archivo.
- **Versionado y auditoría:** cada intento guarda `adapter_version`, `parser_version` y `schema_version`. La auditoría registra quién hizo qué y cuándo (`ReviewAction`), pero **no valores financieros**: solo la ruta del campo y la acción.
- **Compatibilidad con Next/Vercel:** hay rutas de handler y SSR en App Router con `next-intl`; no se demostró ningún mecanismo de subida, de tareas en segundo plano ni de límites de duración por ruta. Todo lo anterior se considera diseño hasta verificarlo.

## E. Modelo de datos propuesto

Sin migraciones. Nombres y campos son propuestas. Clases de sensibilidad: **S1** interno no personal; **S2** personal; **S3** financiero/sensible. Todas las tablas son de servidor: lectura por el propietario mediante RLS de solo lectura donde proceda y toda escritura mediante funciones de servidor (patrón de `fn_create_expense` y `ai_pending_actions`). El esquema real de `expenses` y su RLS son NO DEMOSTRADOS: los vínculos con `expenses` quedan pendientes.

| Entidad | Campos mínimos | Sens. | Propiedad | Índices / unicidad | Cascada | TTL |
|---|---|---|---|---|---|---|
| **Ticket** | `id` (uuid), `user_id`, `status`, `source` (camera/upload), `locale`, `idempotency_key`, `quota_day`, `retain_original`, `created_at`, `updated_at`, `expires_at`, `confirmed_at`, `deleted_at`, `deletion_reason` | S2 | `user_id` | Único `(user_id, idempotency_key)`; `(user_id, status)`; parcial `(expires_at)` donde `status` no es terminal | Borrar cuenta → borra el ticket y todo lo dependiente | `expires_at` por estado (A.5) |
| **TicketFile** | `id`, `ticket_id`, `storage_path` (aleatorio generado por el servidor), `mime_detected`, `size_bytes`, `page_count`, `sha256`, `exif_stripped`, `scan_status`, `deleted_at`, `deletion_verified_at` | S3 | por ticket | `(ticket_id)`; `(sha256)` por usuario para duplicados | Se borra con el ticket; el objeto del almacenamiento se borra primero y se verifica | Según estado o retención |
| **OcrAttempt** | `id`, `ticket_id`, `attempt_no`, `provider_id`, `provider_region`, `adapter_version`, `parser_version`, `status`, `error_code` (enumerado), `provider_request_id`, `pages_billed`, `latency_ms`, `requested_at`, `completed_at`, `raw_ref` (opcional) | S1 (+S3 si guarda crudo) | por ticket | Único `(ticket_id, attempt_no)`; único `(provider_id, provider_request_id)` | Con el ticket | `raw_ref` corto; el resto como el ticket |
| **NormalizedReceipt** (campos OCR) | `ticket_id`, `attempt_id`, `schema_version`, `merchant`, `date`, `currency`, `total`, `tax[]`, `payment_method`, `items[]` (descripción, cantidad, importe, categoría y subcategoría sugeridas), `field_confidence`, `review_flags` | S3 | por ticket | Único `(ticket_id)` del borrador vigente | Con el ticket | Hasta confirmar/descartar/caducar; después, pendiente de P1 |
| **ReviewAction** | `id`, `ticket_id`, `user_id`, `action` (edit/split/assign/confirm/discard/retention), `field_path`, `created_at` — **sin valores** | S2 | `user_id` | `(ticket_id, created_at)` | Con el ticket | Política de auditoría pendiente |
| **ExpenseLink** | `ticket_id`, `expense_id`, `allocation_index`, `item_ids[]`, `user_id`, `created_at` | S2 | `user_id` | Único `(ticket_id, allocation_index)` (idempotencia); único `(expense_id)` | Borrar el gasto elimina el vínculo; borrar el ticket no borra el gasto | Vive mientras viva el gasto |
| **QuotaLedger** | `id`, `user_id`, `ticket_id`, `quota_day`, `tz`, `kind` (consume/refund), `units`, `created_at` | S1 | `user_id` | Único `(ticket_id, kind)`; `(user_id, quota_day)` | Sobrevive a `deleted` del ticket (referencia sin FK dura) o se anonimiza | Retención de métrica pendiente |
| **RetentionRequest** | `id`, `ticket_id`, `user_id`, `requested_ttl`, `status`, `requested_at`, `expires_at`, `executed_at`, `deletion_verified_at` | S2 | `user_id` | Único `(ticket_id)` activo; `(expires_at)` | Con el ticket | Hasta ejecutar y verificar |

Notas de diseño:
- Importes en el mismo tipo que `expenses.amount` (hoy `numeric` en `fn_create_expense`); la unidad (euros/céntimos) se decide con el esquema real.
- Creación de varios gastos: hoy `fn_create_expense` crea uno por llamada y cada llamada incrementa `expense_monthly_usage`. Crear N gastos de forma atómica con `ExpenseLink` exige una función de servidor nueva; su diseño depende de P1 (modelo de gastos) y no se especifica aquí.
- Separación analítica: ninguna de estas tablas se copia a eventos de analítica; las métricas agregadas (sección F) salen de `QuotaLedger` y `OcrAttempt` sin campos S3.

## F. Costes y control de abuso

- Fase 1 (`provider-benchmark.md`, sección 3): con el precio de referencia de Google (0,10 $ por ticket de una página), 5 tickets al día son hasta **0,50 $ por usuario activo y día** y ~15 $ al mes con 150 tickets; ese volumen **puede superar el ingreso de 3,99 €/mes**. Con la referencia de AWS (0,01 $), ~1,50 $ al mes con 150 tickets. Las cifras no están verificadas en la región UE.
- El **máximo teórico** de coste = usuarios activos × cuota diaria × días × coste por página × páginas por ticket × (1 + reintentos). Depende de: definición del día (A.3), cuántos usuarios usan la cuota completa, límite de páginas y de reintentos.
- **No se fija** cuota mensual ni precio: siguen pendientes (P1/P2).
- Controles (PROPUESTO): cuota diaria en servidor con libro idempotente; reembolso solo por fallos del sistema; límite de reintentos; límite de páginas; límite de tickets abiertos; límite de ritmo por usuario; tope diario global de gasto OCR con interruptor de corte; alerta al superar umbrales.
- Métricas agregadas **no sensibles** (sin importes, comercios ni categorías): nº de tickets por estado, tasa de fallos por código de error, latencia p50/p95, páginas facturadas, coste estimado agregado por día, nº de usuarios que alcanzan la cuota, nº de bloqueos de usuarios gratuitos.

## G. Condiciones de salida y bloqueos

| # | Bloqueo | Cierra con | Prio. |
|---|---|---|---|
| 1 | Equivalencia Premium/Plus y precio (3,99 € → 5,99 €, cupo de 100) | Decisión del propietario; definir permiso/`AccessFeature` y comportamiento con el interruptor apagado | P1 |
| 2 | Zona del día y consumo de cuota | Elegir opción de A.3 y A.4 y probar idempotencia con pruebas concurrentes | P1 |
| 3 | Modelo de gastos y vínculo con ticket | Obtener el esquema real de `expenses` y su RLS; decidir tablas nuevas y creación atómica de N gastos | P1 |
| 4 | Proveedor OCR, DPA, región, retención y entrenamiento | Benchmark sintético (Fase 1), DPA y subprocesadores por escrito, región UE efectiva, no entrenamiento y borrado | P1 |
| 5 | Almacenamiento privado real, cifrado, limpieza y backup | Prueba de bucket privado con políticas por usuario; evidencia de cifrado en reposo; planificador de limpieza; política de backups | P1 |
| 6 | Autorización gratuito/premium | Permiso específico probado en servidor, denegación por defecto, pruebas de acceso entre usuarios | P1 |
| 7 | Límites de archivos y antivirus | Valores de tamaño/páginas/MIME, análisis de PDF malicioso, decisión sobre antivirus, verificación del límite de Vercel y del plan | P2 |
| 8 | Política de retención opcional | TTL máximo, qué se conserva, cómo se revoca | P2 |
| 9 | Revisión editorial/legal | Revisión de la política de privacidad, consentimiento y base legal; **este documento no afirma cumplimiento legal** | P1 |
| 10 | Rate limiting y alertas de coste | Mecanismo y almacén elegidos | P2 |
| 11 | Subprocesador del clasificador (OpenAI) | Decidir si se usa con texto de tickets | P2 |

Para salir de la fase de especificación a implementación: todos los P1 cerrados o con decisión documentada, y los P2 con plan.

## H. Qué NO se ha demostrado

Plan de Vercel y límites efectivos; planificador de limpieza; cifrado en reposo y gestión de claves de Supabase Storage; URLs firmadas de subida y `allowed_mime_types`; backups de DB y Storage; antivirus; esquema y RLS de `expenses`; contenido de la política de privacidad; librerías de imagen disponibles; drenajes de logs; DPA y subprocesadores de cualquier proveedor OCR; estado real del interruptor de Plus en producción.
