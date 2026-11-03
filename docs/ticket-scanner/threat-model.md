# Escáner de tickets — Modelo de amenazas (Fase 2)

Metodología: STRIDE sobre los tramos de [`data-flow.md`](data-flow.md). Todo es análisis de diseño **PROPUESTO**; no hay implementación que probar. «Responsable» es un rol genérico, no una persona. «Evidencia» indica qué prueba cerrará el riesgo o qué hecho del repo lo respalda. «Aceptación» es la condición para darlo por mitigado. Ver [`privacy-security-architecture.md`](privacy-security-architecture.md) para el contexto y los bloqueos.

Activos: originales (S3), resultado normalizado (S3), gastos, cuota, credenciales de servicio y del proveedor, metadatos de ticket (S2).

Atacantes: usuario gratuito curioso o abusivo; usuario Premium malicioso; usuario autenticado que intenta ver datos ajenos; actor externo sin cuenta; documento malicioso; proveedor OCR comprometido o con retención indebida; operador con acceso a logs/backups.

## Tabla de amenazas

| ID | Amenaza (STRIDE) | Activo / tramo | Mitigación | Responsable | Evidencia / prueba | Aceptación |
|---|---|---|---|---|---|---|
| T01 | **S** Suplantación: usar una sesión ajena para iniciar subidas | Sesión (TB1) | `requireAuth` en cada ruta; cookies de Supabase | Backend | `src/lib/api/auth.ts` (patrón DEMOSTRADO) · prueba de ruta sin sesión → 401 | Ninguna ruta del escáner responde sin sesión |
| T02 | **E** Usuario gratuito usa el escáner (bypass de UI) | Entitlement | Comprobación en servidor, denegar por defecto; no basar el acceso en la UI | Backend | `src/lib/auth/require-access.ts`: con interruptor apagado **no restringe** → riesgo real hoy · test: gratuito recibe 403 en todas las rutas, también con interruptor apagado | Test automático por ruta |
| T03 | **E** IDOR: leer o confirmar el ticket de otro | Tickets, archivos | Filtro por `user_id` en cada consulta; identificadores aleatorios; 404 uniforme; RLS de solo lectura donde aplique; el cliente de servicio solo con filtro explícito | Backend | Patrón `pending-actions.ts` (filtra `user_id`) · prueba con dos usuarios | Dos usuarios nunca acceden a datos del otro |
| T04 | **I** Enumeración de IDs o de rutas de almacenamiento | Tickets, bucket | UUID aleatorios; rutas aleatorias no derivables; respuestas iguales para «no existe» y «no es tuyo» | Backend | Prueba de respuestas indistinguibles | Sin diferencia observable |
| T05 | **I** Exposición pública del original | Bucket | Bucket privado; sin URL pública; URL firmada corta y de un solo propósito, `no-store`, `no-referrer`; políticas por usuario | Backend/Infra | Patrón `src/app/api/premium/download/route.ts`; Supabase deniega por defecto sin políticas (https://supabase.com/docs/guides/storage/security/access-control, consultado 2026-10-27) · prueba: petición anónima → denegada | Ninguna lectura sin sesión ni URL firmada vigente |
| T06 | **T** Replay de subida o confirmación | Confirmar, subir | Idempotencia por ticket; actualización condicional de estado; autorizaciones de subida de un solo uso y con caducidad | Backend | Patrón atómico `pending-actions.ts` · prueba concurrente de doble confirmación | Una sola creación de gastos |
| T07 | **D** Abuso de cuota (varias pestañas, carreras) | Cuota | Libro de cuota con clave única `(ticket_id,kind)`; consumo y cambio de estado en la misma transacción; pruebas concurrentes | Backend/DB | Test de carrera: 20 peticiones simultáneas no superan el límite | Nunca se superan 5/día |
| T08 | **D** Abuso de almacenamiento (subir sin procesar) | Bucket | Límite de tickets abiertos; expiración; tamaño máximo; limpieza | Backend/Infra | Planificador de limpieza: NO DEMOSTRADO · prueba de caducidad | Los huérfanos desaparecen en el plazo definido |
| T09 | **D** Abuso económico (coste de OCR) | Proveedor | Cuota, límite de reintentos y páginas, tope diario global con corte, alertas | Producto/Backend | `provider-benchmark.md` §3 (150 tickets/mes puede superar el margen con Google) · simulación de coste | Coste máximo teórico documentado y aceptado |
| T10 | **T** Archivo malicioso (malware embebido) | Validación (TB3) | Validar por contenido; reencodar imagen; para PDF rasterizar o rechazar elementos activos; proceso aislado; antivirus si se decide | Backend/Seguridad | Antivirus: NO DEMOSTRADO · corpus de archivos de prueba maliciosos | Ningún archivo activo llega al proveedor ni se sirve a otros |
| T11 | **D** PDF zip-bomb / imagen gigante / muchas páginas | Validación | Límites de bytes, dimensiones, páginas y descompresión; tiempo y memoria acotados; abortar | Backend | Corpus de PDF/imagen hostiles | Rechazo seguro sin agotar recursos |
| T12 | **T** PDF con contraseña o cifrado | Validación | Rechazar con mensaje claro; no solicitar contraseña | Backend | Prueba con PDF cifrado | Rechazado y borrado |
| T13 | **I** EXIF con geolocalización y modelo de dispositivo | Original | Reencodar sin metadatos antes de OCR y de conservar | Backend | Librería de imagen disponible: NO DEMOSTRADO · prueba con foto con GPS sintético | El objeto almacenado no contiene EXIF |
| T14 | **T** Inyección en el texto OCR (instrucciones dentro del ticket) | Normalizador, LLM | Tratar el texto como dato; esquema estricto; categorías contra lista cerrada; si hay LLM, sin herramientas ni acciones y salida estructurada; nada del OCR se ejecuta | Backend | `src/lib/ai/classifier.ts` usa LLM (precedente) · prueba con ticket sintético con texto «ignora las instrucciones» | La salida nunca altera categorías fuera de la lista ni crea gastos |
| T15 | **T** Contenido OCR malicioso renderizado (XSS en la revisión o exportes) | Revisión | Render de texto escapado; no `dangerouslySetInnerHTML`; saneado en exportes | Frontend | Revisión de código en implementación | Sin ejecución de HTML en campos OCR |
| T16 | **I** Datos financieros en logs y errores | Observabilidad | Registrar solo IDs, códigos y duración; no cuerpos ni texto; no registrar mensajes de proveedor; redactar | Backend | `src/lib/logger.ts` registra mensaje y stack; `src/lib/ai/tool-executor.ts:27,:78` registra `params` (precedente a no repetir) · test de logs sin importes | Test que falla si aparecen importes |
| T17 | **I** Datos financieros en analytics | Analytics | Lista blanca de eventos y propiedades del escáner; sin importes, comercios, categorías | Frontend | `src/lib/analytics.ts` solo sanea la calculadora de ahorro · test de lista blanca | Ninguna propiedad fuera de la lista |
| T18 | **I** Datos del ticket en URL, `localStorage` o cookies | Cliente | Identificadores opacos; borradores en servidor | Frontend | Revisión + test | Nada financiero en almacenamiento del navegador |
| T19 | **I** Proveedor OCR retiene o entrena con los tickets | Tercero (TB4) | DPA; región UE; contrato de no entrenamiento y retención mínima; borrado bajo petición; solo datos sintéticos hasta cerrar | Legal/Producto | Fase 1: DPA, retención y entrenamiento **NO DEMOSTRADOS** (`provider-benchmark.md` §5) | Documentos firmados antes de datos reales |
| T20 | **I** Subprocesadores desconocidos (incluye OpenAI si clasifica) | Tercero | Lista de subprocesadores revisada; clasificar sin LLM o decidir su uso | Legal/Producto | `package.json` incluye `openai`; subprocesador no evaluado en Fase 1 | Lista aprobada |
| T21 | **I** Backups con originales borrados | Backups | Política de retención de copias; excluir originales o caducarlos; informar el plazo | Infra/Legal | Backups de DB/Storage: NO DEMOSTRADO | Plazo máximo documentado |
| T22 | **I** Claves expuestas (servicio, proveedor, firma de URLs) | Secretos | Solo variables de entorno de servidor; clave de servicio nunca al cliente; rotación; sin secretos en queries | Infra | `src/lib/supabase/admin.ts` es servidor; el precedente de secreto en query (`src/app/api/expenses/route.ts`) no se repite | Revisión de secretos sin hallazgos |
| T23 | **E** Uso indebido del cliente de servicio (ignora RLS) | DB | Funciones de servidor con `user_id` explícito y pruebas de propiedad | Backend | Documentado en `pending-actions.ts` | Pruebas cruzadas sin fugas |
| T24 | **T** Webhook del proveedor falsificado | Webhook | Firma obligatoria, estado esperado, idempotencia; si no hay firma, sondeo | Backend | Pruebas con firma inválida (patrón de webhooks: `src/app/api/webhooks/stripe-subscriptions/route.ts`) | Firma inválida → rechazado |
| T25 | **E** SSRF mediante URLs aportadas por el cliente | Backend→red | No aceptar URLs; rutas generadas por servidor; lista cerrada de hosts del proveedor | Backend | Revisión de código | Ninguna ruta del escáner hace *fetch* a una URL del usuario |
| T26 | **R** Repudio: el usuario niega haber confirmado | Auditoría | `ReviewAction` con tiempo y usuario, sin valores | Backend | Prueba de registro | Cada confirmación deja rastro |
| T27 | **T** Duplicados que inflan gastos | Gastos | Hash de archivo y clave semántica con aviso; confirmación idempotente | Backend | Casos S01–S15 + duplicados | Aviso mostrado; no doble creación por reintento |
| T28 | **D** Fallo del proveedor deja tickets colgados | Procesamiento | Tiempo máximo; paso a `failed`; reembolso de cuota; reintento limitado | Backend | Prueba con proveedor simulado caído | Sin estados atascados |
| T29 | **I** Cachés intermedios (CDN/navegador) con datos del ticket | Respuestas | `Cache-Control: no-store`; `no-referrer` | Backend | Patrón del pack en `next.config.ts` y la ruta de descarga | Cabeceras verificadas |
| T30 | **E** Eludir la cuota cambiando la zona horaria | Cuota | Día en zona de negocio, no del cliente | Backend | Decisión A.3 pendiente | Test: cambiar zona no cambia el día |

## Riesgos residuales aceptados provisionalmente

Ninguno se acepta aún. Quedan **abiertos**: antivirus (T10), backups (T21), DPA y entrenamiento del proveedor (T19) y subprocesadores (T20). Mientras sigan abiertos, solo datos sintéticos.

## Pruebas mínimas antes de implementar el MVP

1. Acceso cruzado entre dos usuarios (T03, T04, T05).
2. Gratuito frente a Premium en todas las rutas, con interruptor encendido y apagado (T02).
3. Carreras de cuota y de confirmación (T06, T07).
4. Corpus hostil de archivos (T10–T13).
5. Logs y analytics sin importes (T16, T17).
6. Expiración y borrado verificado (T08, T21).
