# Escáner de tickets — Requisitos de producto (Fase 0)

Estado: **borrador de especificación**. No hay código, tablas ni dependencias asociados. Rama `feature/ticket-scanner-fase-0`.

Convención: **NO DEMOSTRADO** = no se puede probar con el código del repositorio y requiere verificación o decisión. Las rutas citadas son del repositorio y se revisaron en modo lectura.

## 1. Resumen para una persona no técnica

El usuario hace una foto a un ticket de compra (o sube una imagen o un PDF) desde el móvil, dentro de la web de Kakebo. La aplicación lee el ticket y propone: comercio, fecha, total, IVA, método de pago y la lista de artículos, con una categoría sugerida para cada artículo. El usuario **siempre revisa y corrige** lo propuesto antes de que se cree ningún gasto. Al confirmar, se crean uno o varios gastos y la imagen se borra por defecto, salvo que el usuario pida conservarla. Es una función exclusiva de Premium; los usuarios gratuitos ven la función bloqueada pero no pueden elegir archivos.

## 2. Usuario objetivo

Usuarios de Kakebo en España que gastan en euros, usan el móvil y quieren evitar teclear cada compra. Idiomas: español e inglés.

## 3. Problema que resuelve

Apuntar gastos a mano es lento y la gente lo abandona. Un ticket contiene ya la información (fecha, total, artículos). El escáner convierte el ticket en gastos revisados con el menor esfuerzo posible, sin perder el control del usuario.

## 4. Flujo principal

1. El usuario Premium abre «Escanear ticket» desde la app.
2. Elige: hacer foto, subir imagen o subir PDF.
3. El ticket se sube a almacenamiento privado y pasa a procesamiento.
4. La aplicación propone cabecera (comercio, fecha, total, IVA, método de pago) y artículos con categoría sugerida.
5. El usuario revisa, corrige, reparte artículos entre categorías si quiere, y ve avisos (posible duplicado, datos dudosos).
6. El usuario confirma. Se crean uno o varios gastos vinculados al ticket.
7. La imagen se elimina, salvo que el usuario haya pedido conservarla.

## 5. Funciones incluidas (alcance acordado)

- Experiencia móvil dentro de la web/PWA. Sin app nativa en esta fase.
- Entrada: foto de cámara, imagen, PDF.
- España y euros inicialmente. Español e inglés.
- Extracción de proveedor, fecha, total, IVA, método de pago y artículos.
- Separación automática de artículos y clasificación automática con las categorías existentes.
- Corrección manual y reparto de artículos entre varias categorías.
- Creación de uno o varios gastos vinculados al ticket.
- Detección de posibles duplicados.
- Borrado de la imagen tras confirmar por defecto; conservación voluntaria.
- Almacenamiento privado y cifrado; la imagen nunca se sirve públicamente.
- Cero datos financieros en Analytics.

## 6. Funciones excluidas

- App nativa (App Store / Google Play).
- Otras monedas y otros países.
- Creación de gastos sin revisión manual (nunca automática).
- Elección de proveedor OCR (decisión pendiente, no se toma en esta fase).
- Cualquier código, tabla, migración o dependencia en la Fase 0.

## 7. Reglas Premium

- Solo usuarios con acceso Premium pueden usar el selector de archivos y la cámara.
- Los usuarios gratuitos ven la función bloqueada, con invitación a ver planes. No pueden abrir el selector de archivos.
- El bloqueo debe aplicarse **también en servidor**, no solo ocultando la interfaz.
- Precio inicial 3,99 €/mes para los primeros 100 usuarios; precio posterior previsto 5,99 €/mes (ver `decision-log.md`: hoy no está en el código).
- Qué cuenta como «Premium» es una decisión pendiente (ver sección 17 y `decision-log.md`).

## 8. Reglas de cuota

- Límite inicial: **5 tickets diarios** por usuario.
- «Día» y qué consume cuota (subida, procesamiento, confirmación, fallos) están **pendientes de decidir**. Propuesta provisional en `decision-log.md`.
- El contador debe vivir en servidor; nunca en el cliente.
- Al agotar la cuota, el usuario ve un mensaje claro con cuándo se renueva.

## 9. Reglas de revisión

- Ningún gasto se crea sin confirmación explícita del usuario.
- Todos los campos extraídos son editables: comercio, fecha, total, IVA, método de pago, artículos, categorías.
- Los campos de baja confianza o ausentes se marcan visiblemente y exigen atención (estado `needs_review`).
- La suma de los gastos creados debe poder cuadrar con el total del ticket; si no cuadra, se avisa antes de confirmar.
- El usuario puede descartar el ticket en cualquier momento antes de confirmar.

## 10. Reglas de borrado

- Tras confirmar, la imagen o PDF se elimina por defecto.
- El usuario puede pedir conservarla. Conservada = privada, cifrada, eliminable por el usuario en cualquier momento.
- Si el ticket se descarta, falla o caduca, el archivo se elimina.
- Plazos concretos: pendientes de decidir (ver `state-machine.md`).
- Nunca hay URL pública. El acceso sería solo mediante URL firmada de corta duración (patrón ya usado en `src/app/api/premium/download/route.ts`).

## 11. Reglas de duplicados

- Antes de confirmar se compara con gastos y tickets existentes del mismo usuario (criterio previsto: comercio + fecha + total; el criterio exacto está pendiente).
- Un posible duplicado **avisa**, no bloquea: el usuario decide.
- Debe cubrir también el mismo archivo subido dos veces.

## 12. Reglas de idiomas

- Interfaz en español e inglés con `next-intl` (`src/i18n/routing.ts`, `messages/es.json`, `messages/en.json`). Todo texto nuevo debe existir en ambos.
- El idioma de la interfaz es independiente del idioma del ticket. Tickets esperados en español en la fase inicial.
- Los nombres de categoría usados son los ya existentes (ver sección 16).

## 13. Casos de error

| Caso | Comportamiento esperado |
|---|---|
| Archivo de tipo no admitido o demasiado grande | Rechazo antes de subir, con mensaje claro |
| Imagen ilegible o sin ticket | `failed` con opción de reintentar o introducir a mano |
| Extracción parcial | `needs_review` con campos marcados |
| Cuota diaria agotada | Mensaje con renovación; no se procesa |
| Usuario sin Premium | Función bloqueada; servidor responde denegando |
| Fallo del servicio de lectura | `failed`; la cuota no debería consumirse (por confirmar) |
| Ciclo cerrado en la fecha del ticket | Aviso; el gasto se imputa según las reglas actuales de ciclos |
| Pérdida de conexión | El borrador no se pierde mientras el ticket siga vigente |
| Sin permiso de cámara | Alternativa: subir imagen/PDF |
| Duplicado detectado | Aviso con opción de continuar o descartar |

## 14. Criterios de aceptación

1. Un usuario gratuito no puede abrir el selector de archivos ni llamar a la función por API (denegado en servidor).
2. Un usuario Premium completa el flujo foto → revisión → confirmación y se crean los gastos esperados.
3. Ningún gasto se crea sin confirmación explícita.
4. Se puede repartir un artículo o un conjunto de artículos entre varias categorías existentes y el resultado se refleja en los gastos creados.
5. Tras confirmar, el archivo ya no existe salvo opción de conservar.
6. El archivo nunca es accesible por URL pública.
7. El sexto ticket del día es rechazado con mensaje claro.
8. Un ticket duplicado genera aviso.
9. Textos disponibles en es y en.
10. Ningún evento de Analytics contiene importes, artículos, proveedores, categorías ni otros datos financieros; verificado con test.
11. Flujo utilizable en móvil dentro de la PWA, sin app nativa.

## 15. Estado del código relevante (evidencia)

| Tema | Hallazgo | Fuente |
|---|---|---|
| Autenticación | `requireAuth()` en rutas API; sesión Supabase | `src/app/api/expenses/route.ts`, `src/lib/api/auth.ts`, `src/lib/supabase/server.ts` |
| Acceso | Estados `founder`, `legacy_full`, `plus_active`, `plus_canceled_pending`, `free_under_limit`, `free_readonly`. Resuelto en SQL con `fn_my_access()` | `src/lib/auth/access-state.ts`, `src/lib/auth/require-access.ts`, `supabase/migrations/20261013113040_plus_access_resolver.sql` |
| Puerta Premium en servidor | `requireAccess(feature, supabase)` fail-closed; solo activa con `PLUS_SUBSCRIPTIONS_ENABLED === "true"`. Características actuales: `ai`, `ai_search`, `export_reports`, `plus_features`, `billing`. **No existe característica de escáner** | `src/lib/auth/require-access.ts` |
| Aviso de bloqueo | Componente reutilizable `PlusRequiredNotice` | `src/components/plus/PlusRequiredNotice.tsx` |
| Gastos | Un gasto = fecha, importe, categoría, nota (≤500), subcategoría opcional. Se crea solo vía RPC `fn_create_expense`, uno por llamada | `src/lib/schemas/expense.ts`, `src/app/api/expenses/route.ts`, `supabase/migrations/20260916_phase3b_monetization_foundation.sql` |
| Campos que el gasto NO tiene | Comercio, IVA, método de pago, artículos, vínculo a ticket | `src/lib/schemas/expense.ts` |
| Categorías | 4 Kakebo: `survival`, `optional`, `culture`, `extra`; más 14 subcategorías opcionales | `src/lib/schemas/common.ts`, `src/lib/subcategories.ts` |
| Límite gratuito | 30 gastos/mes natural, zona Europe/Madrid; cada llamada a `fn_create_expense` cuenta | `src/lib/auth/access-state.ts`, `fn_create_expense` |
| Almacenamiento de archivos de usuario | **No existe.** Solo hay un bucket privado para el pack Premium (URL firmada 600 s) | `src/lib/premium/manifest.ts`, `src/app/api/premium/download/route.ts` |
| Subidas | Ningún `input type="file"`, `capture=` ni `getUserMedia` en `src/` | búsqueda en `src/` |
| Límite de tamaño | Sin configuración propia (`vercel.json` no existe, sin `bodySizeLimit`). El límite de plataforma es **NO DEMOSTRADO** desde el repo | `next.config.ts` |
| Rate limiting | No se encontró ninguno por nombre en `src/` | búsqueda en `src/` |
| PWA | Existe manifiesto (`display: standalone`, `start_url: /app`). No hay service worker en `public/` | `src/app/manifest.ts`, `public/` |
| CSP | `img-src` incluye `blob:` y `data:`; `connect-src` incluye `*.supabase.co` | `next.config.ts` |
| Analytics | GA4 solo tras consentimiento; lista cerrada de nombres de evento; propiedades de tipo libre. La sanitización por lista blanca existe solo para la calculadora de ahorro | `src/lib/analytics.ts`, `src/lib/consent.ts`, `src/components/analytics/GoogleAnalytics.tsx` |
| Evento actual de gasto | `expense_created` con `entry_method: "manual"`, sin importes | `src/app/[locale]/app/new/NewExpenseClient.tsx` |
| Idiomas | `es` (por defecto) y `en`, sin detección automática | `src/i18n/routing.ts`, `messages/*.json` |
| IA existente | Clasificación con OpenAI, ejemplos de correcciones | `src/lib/ai/classifier.ts`, `src/lib/ai/client.ts` |
| Aprendizaje colectivo | Contribución global desactivada por completo | `src/lib/agents/tools/utils/collective-learning-consent.ts` |

## 16. Categorías disponibles

El escáner debe usar las categorías **existentes**: `survival`, `optional`, `culture`, `extra` y, opcionalmente, las subcategorías de `src/lib/subcategories.ts`. Nota: `src/lib/types.ts` define otro conjunto antiguo (`general`, `wants`, `culture`, `extras`) que parece heredado de la versión con `localStorage` (`src/lib/storage.ts`); su uso actual es **NO DEMOSTRADO** y no debe usarse.

## 17. Puntos NO DEMOSTRADOS

- Que «Premium» del encargo equivalga a «Plus» del código (el código no usa «Premium» para la suscripción; ver `decision-log.md`).
- Cifrado en reposo del almacenamiento (depende de la configuración de Supabase, no del repo).
- Esquema real de la tabla `expenses` y de sus políticas RLS: el DDL de creación no está en `supabase/migrations/`.
- Límite real de tamaño de petición en el despliegue.
- Soporte de captura de cámara en la PWA instalada en iOS y Android.
- Que la política de privacidad cubra el envío de tickets a un tercero (la búsqueda de términos no devolvió coincidencias en `src/app/[locale]/privacy/page.tsx`; el texto puede estar en `messages/*.json`, no verificado).
- Retención de imágenes en proveedores externos.
