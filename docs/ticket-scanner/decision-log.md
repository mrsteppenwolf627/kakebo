# Escáner de tickets — Registro de decisiones (Fase 0)

Solo se registran como **cerradas** las decisiones indicadas expresamente en el alcance acordado. Todo lo demás es pendiente.

## 1. Decisiones cerradas (alcance acordado)

| # | Decisión |
|---|---|
| C1 | Experiencia móvil dentro de la web/PWA; sin app nativa en esta fase |
| C2 | Entradas: foto de cámara, subida de imagen, subida de PDF |
| C3 | España y euros inicialmente; español e inglés |
| C4 | Función exclusiva para usuarios Premium |
| C5 | Usuarios gratuitos ven la función bloqueada pero no usan el selector de archivos |
| C6 | Precio inicial Premium 3,99 €/mes para los primeros 100 usuarios; precio posterior previsto 5,99 €/mes |
| C7 | Límite inicial: 5 tickets diarios |
| C8 | Revisión y confirmación manual obligatoria antes de crear gastos |
| C9 | Extracción de proveedor, fecha, total, IVA, método de pago y artículos |
| C10 | Separación automática de artículos y clasificación con categorías existentes |
| C11 | Corrección manual y reparto de artículos entre varias categorías |
| C12 | Creación de uno o varios gastos vinculados al ticket |
| C13 | Detección de posibles duplicados |
| C14 | Imagen eliminada tras confirmar por defecto; conservación voluntaria |
| C15 | Almacenamiento privado y cifrado; nunca servir la imagen públicamente |
| C16 | No enviar importes, artículos, proveedores, categorías ni otros datos financieros a Analytics |
| C17 | No elegir proveedor OCR en la Fase 0 |

## 2. Decisiones pendientes

| # | Pendiente | Alternativas | Recomendación provisional |
|---|---|---|---|
| P1 | ¿«Premium» es el plan «Plus» existente o un nivel nuevo? En el código, la suscripción se llama Plus (`src/lib/plus/pricing.ts`, `src/lib/auth/access-state.ts`); «premium» designa el pack Excel/PDF de pago único (`src/lib/premium/*`) y el permiso `can_use_plus_features` se llama `is_premium` en `fn_my_access` | (a) Plus existente; (b) pack Premium; (c) nivel nuevo | (a) Reutilizar Plus y `requireAccess`; evita un segundo sistema de acceso |
| P2 | Precio: los primeros 100 usuarios a 3,99 € y luego 5,99 €. El código ya tiene Plus a 3,99 €/mes y 39,90 €/año | (a) Mantener Plus a 3,99 € y subir después; (b) crear precio nuevo en Stripe; (c) cupo de 100 con contador | Aclarar con el usuario si el escáner cambia el precio de Plus o es un plan aparte |
| P3 | Definición de «día» para la cuota de 5 tickets | Medianoche Europe/Madrid (como el contador mensual existente), 24 h móviles | Europe/Madrid, coherente con `expense_monthly_usage` |
| P4 | Qué consume cuota | Subida, procesamiento, confirmación | Consumir al iniciar el procesamiento; no consumir en fallos del sistema |
| P5 | Caducidad de tickets pendientes y de fallidos | 1 h, 24 h, 7 días | 24 h pendientes; 1 h fallidos |
| P6 | Criterio de duplicado | Hash de archivo; comercio+fecha+total; ambos | Ambos, solo como aviso |
| P7 | Dónde se guardan datos de ticket y artículos | Tablas nuevas; ampliar `expenses`; JSON en nota | Tablas nuevas vinculadas a gastos (decisión de Fase 1) |
| P8 | Qué pasa con los gastos si se deshace una confirmación | No permitir; permitir borrando gastos vinculados | No permitir en MVP |
| P9 | Cuánto se conserva una imagen guardada voluntariamente | Hasta que el usuario la borre; plazo fijo | Hasta que el usuario la borre o cierre la cuenta |
| P10 | Qué ocurre con los IVA múltiples y el método de pago si no es legible | Campo opcional; obligar | Opcionales, editables |
| P11 | Mecanismo de borrado y caducidad programados | Tarea programada; borrado al siguiente acceso | Tarea programada; verificar disponibilidad |
| P12 | Idioma del ticket admitido | Solo español; español e inglés | Solo español al inicio |
| P13 | Límite de tamaño y páginas de archivos | A definir con pruebas | Fijar tras medir; requiere conocer el límite de plataforma |

## 3. Alternativas consideradas

- **Compartir categorías con el escáner o crear nuevas:** se descarta crear categorías nuevas; el alcance exige usar las existentes.
- **Crear gastos automáticamente cuando la confianza es alta:** descartada por C8.
- **Servir la imagen con URL pública:** descartada por C15.
- **Medir uso del escáner con eventos de importes:** descartada por C16. Eventos aceptables: solo conteos y estados no financieros (p. ej. `scanner_opened`), a validar con lista blanca.

## 4. Información que falta

- Esquema real de `expenses`, `months` y sus políticas RLS (el DDL de creación no está en `supabase/migrations/`; las migraciones revisadas solo lo alteran).
- Configuración real de cifrado en reposo del almacenamiento.
- Límite de tamaño de petición del despliegue.
- Comportamiento de la cámara en la PWA instalada.
- Si la política de privacidad actual menciona proveedores de tratamiento (`src/app/[locale]/privacy/page.tsx`, `messages/*.json`).
- Cómo se está usando hoy el conjunto de categorías antiguo de `src/lib/types.ts`.
- Estado del interruptor `PLUS_SUBSCRIPTIONS_ENABLED` en entornos reales (la memoria del proyecto indica que está apagado en las fases de prueba).
- Si existe infraestructura de tareas programadas.
- Si hay una vía de pago real activa para Plus en producción.

## 5. Bloqueos

| Bloqueo | Impacto |
|---|---|
| P1: ambigüedad Premium/Plus | Impide definir la puerta de acceso |
| P2: modelo de precios | Impide definir producto y migración de precios |
| P7: modelo de datos | Impide el diseño técnico de Fase 1 |
| Falta de esquema real de `expenses` | Impide diseñar vínculo ticket↔gasto con seguridad |
| Revisión de privacidad | Puede bloquear el uso de un tercero |
| Elección de proveedor OCR (diferida a propósito) | No bloquea Fase 0; sí el diseño técnico |

## 6. Hallazgos del código que afectan a las decisiones

- `requireAccess` solo activa restricciones con `PLUS_SUBSCRIPTIONS_ENABLED === "true"`. Con el interruptor apagado, **ninguna comprobación de Premium se aplica** (`src/lib/auth/require-access.ts`). El escáner no debería quedar abierto con el interruptor apagado: decisión pendiente (recomendación: denegar siempre si no se puede probar Premium).
- `ACCESS_PERMISSIONS` en `src/lib/auth/access-state.ts` no incluye permiso de escáner; habría que añadir uno o reutilizar `can_use_plus_features`.
- Los estados `founder` y `legacy_full` también tienen acceso total; habría que decidir si el escáner está incluido para ellos.

## 7. Decisiones derivadas de la Fase 2 (privacidad, seguridad y arquitectura)

Añadido en la rama `feature/ticket-scanner-fase-2`. No se ha borrado ni modificado nada de lo anterior. Detalle en [`privacy-security-architecture.md`](privacy-security-architecture.md), [`data-flow.md`](data-flow.md) y [`threat-model.md`](threat-model.md). Ninguna de estas entradas es una decisión cerrada del propietario: son propuestas o pendientes.

| # | Tema | Estado | Propuesta / recomendación provisional | Bloquea |
|---|---|---|---|---|
| F2-1 | Escáner denegado por defecto si no se puede probar el entitlement, incluso con `PLUS_SUBSCRIPTIONS_ENABLED` apagado (hoy `requireAccess` no restringe con el interruptor apagado: `src/lib/auth/require-access.ts`) | Propuesta (refina la recomendación de la sección 6) | Denegar por defecto | Implementación |
| F2-2 | Zona del «día» de los 5 tickets | Pendiente | `Europe/Madrid` calculada en servidor (coherente con `expense_monthly_usage`). Alternativas: UTC, zona del usuario | Implementación (P1) |
| F2-3 | Momento de consumo de cuota (refina P4) | Pendiente | Al pasar de `uploaded` a `processing`, con libro idempotente `(ticket_id, kind)` y reembolso por fallos del sistema | Implementación (P1) |
| F2-4 | Lista de estados: añadir `initiated`; sustituir `ready_for_review` y `discarded` por una marca dentro de `needs_review` y por `deleted` con motivo | Pendiente de aprobación. **No se ha editado `state-machine.md`** | Adoptar la lista de Fase 2 | Implementación |
| F2-5 | Subida directa privada para archivos que superen los 4,5 MB de cuerpo de función de Vercel (https://vercel.com/docs/functions/limitations, consultado 2026-10-27) | Propuesta | Subida directa con autorización de un solo uso; mecanismo de Supabase NO DEMOSTRADO | Implementación (P2) |
| F2-6 | Interfaz propia `ReceiptOcrProvider` con JSON normalizado y confianza por campo; proveedor sin hardcodear | Propuesta | Adoptar | — |
| F2-7 | Planificador de limpieza/expiración | Pendiente; NO DEMOSTRADO que exista | Elegir entre tareas de plataforma, `pg_cron` o limpieza perezosa | Implementación (P1) |
| F2-8 | Antivirus y reencodado sin EXIF | Pendiente; NO DEMOSTRADO | Decidir antes de aceptar archivos | Implementación (P2) |
| F2-9 | Clasificación de artículos: reglas con categorías existentes frente a LLM (OpenAI es un subprocesador no evaluado en Fase 1) | Pendiente | Preferir sin LLM hasta la revisión de privacidad | Revisión legal |
| F2-10 | Qué se conserva del borrador normalizado tras confirmar | Pendiente | Depende del modelo de gastos (P7) | Modelo de datos |
| F2-11 | Lista blanca de eventos de analítica del escáner y test | Propuesta | Solo conteos y estados no financieros | — |
| F2-12 | Tope diario global de coste OCR con corte | Propuesta | Adoptar; valor pendiente | Coste |

### Información que falta (añadida por la Fase 2)

Plan de Vercel y límites efectivos; cifrado en reposo, claves, URLs firmadas de subida y `allowed_mime_types` en Supabase Storage; backups de DB y Storage; librerías de imagen disponibles; contenido de la política de privacidad; drenajes de logs.

### Bloqueos (añadidos por la Fase 2)

Los P1/P2 de la sección G de `privacy-security-architecture.md`. La revisión editorial y legal sigue pendiente; ningún documento afirma cumplimiento legal.

## 8. Decisiones derivadas de la Fase 3 (UX y especificación funcional)

Añadido en la rama `feature/ticket-scanner-fase-3`. No se ha borrado ni reescrito ninguna entrada anterior. Detalle en [`ux-functional-spec.md`](ux-functional-spec.md), [`ux-wireflows.md`](ux-wireflows.md) y [`ux-copy-es-en.md`](ux-copy-es-en.md). Nada de esto es una decisión cerrada del propietario.

| # | Tema | Estado | Propuesta / recomendación provisional | Bloquea |
|---|---|---|---|---|
| F3-1 | Jerarquía de entitlement aplicada al escáner (founder, legacy_full, plus_active, plus_canceled_pending, free_*) | **Pendiente** | La especificación no asume qué estados tienen acceso | Implementación (P1) |
| F3-2 | Contenido exacto del plan Premium/Plus, su nombre en la interfaz y el precio | **Pendiente** | El copy usa el marcador `{PLAN_NAME}` y no cita precio | Copy final, pantalla bloqueada |
| F3-3 | Límites de archivo, páginas y formatos | **Pendiente** | Marcadores `{MAX_SIZE}`, `{MAX_PAGES}`, `{FORMATS}`; sin cifras | Validación y errores |
| F3-4 | Definición del día y consumo de cuota | **Pendiente** (continúa F2-2 y F2-3) | Copy de cuota con `{DAILY_LIMIT}` y reinicio PENDIENTE | Pantalla de límite |
| F3-5 | Equivalencia con el modelo de gastos: vínculo ticket↔gasto, agrupado (un gasto por categoría propuesto), contenido de la nota, máximo de gastos | **Pendiente** | Depende del esquema real de `expenses` (NO DEMOSTRADO) | Confirmación y reparto |
| F3-6 | Proveedor OCR y revisión de privacidad | **Pendiente** | Copy de privacidad condicionado; sin nombre de proveedor | Textos de privacidad |
| F3-7 | Pantalla bloqueada para gratuitos: función visible, enlace a explicación, sin selector ni cámara en el DOM | Propuesta | Adoptar; distinta del patrón actual de SubscriptionGuard, que oculta el contenido | — |
| F3-8 | El escáner no debe quedar abierto con el interruptor de Plus apagado (el patrón actual isAiBlocked no bloquea en ese caso) | Propuesta (refuerza F2-1) | Denegar por defecto | Implementación |
| F3-9 | Confirmación con revisión obligatoria; «Confirmar» bloqueado si falta comercio, fecha o total, categoría, reparto incompleto, ciclo cerrado o suma de artículos distinta del total sin resolver | Propuesta | Adoptar; tolerancia de redondeo pendiente | — |
| F3-10 | Las ediciones del usuario nunca se sobrescriben por el OCR; no se inventan valores | Propuesta | Adoptar | — |
| F3-11 | Sin deshacer tras confirmar en el MVP; los gastos se editan o borran con los flujos existentes; borrar un gasto no recupera el original eliminado | Propuesta (continúa P8) | Adoptar | — |
| F3-12 | Retención del original: opción explícita, no premarcada, con opciones de duración | **Pendiente** | Marcador `{RETENTION_OPTIONS}`; copy de borrado condicionado a que esté implementado y verificado | Pantalla de confirmación |
| F3-13 | Umbrales de confianza unknown/low/medium/high | **Pendiente** | Dependen del proveedor y de las pruebas sintéticas | Revisión |
| F3-14 | Posición de la entrada en la navegación y nombre de ruta (`/app/scan` provisional) | **Pendiente** | Panel y alta manual primero; TopNav ya tiene 7 elementos | Navegación |
| F3-15 | Patrón de diálogo accesible (no existe en el repo) y requisitos de foco | Propuesta | Definirlo antes de usar S8a y S9 como diálogos | Implementación |
| F3-16 | Instrumentación: lista blanca de parámetros no sensibles y prohibición explícita de datos financieros | Propuesta (continúa F2-11) | Eventos solo si son necesarios; con consentimiento | — |
| F3-17 | Textos fijos en español en pantallas existentes (FloatingAddButton, NewExpenseClient) | Observación | Fuera de alcance de esta fase; el escáner exige paridad de claves ES/EN | — |

### Información que falta (añadida por la Fase 3)

Comportamiento de la captura de cámara dentro de la PWA instalada; modo sin conexión; patrón de diálogo accesible; contraste real; si el proveedor devolverá confianza por campo.

### Bloqueos (añadidos por la Fase 3)

F3-1 a F3-6 y F3-12 impiden pasar a implementación. La revisión editorial y legal del copy sigue pendiente.
