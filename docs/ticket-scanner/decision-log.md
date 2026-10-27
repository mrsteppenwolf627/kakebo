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
