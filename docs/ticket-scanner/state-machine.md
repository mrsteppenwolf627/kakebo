# Escáner de tickets — Máquina de estados (Fase 0)

Estado: **borrador**. Los plazos marcados como *(propuesta)* no son decisiones cerradas; ver `decision-log.md`.

## Resumen

```
uploaded ──> processing ──┬──> ready_for_review ──┬──> confirmed ──> deleted
   │             │        │                        │
   │             │        └──> needs_review ───────┤
   │             │                                 ├──> discarded ──> deleted
   │             └──> failed ──> deleted           │
   │                                               └──> expired ───> deleted
   └──> discarded / expired
```

Reglas generales:
- Cada transición se valida **en servidor**; el cliente solo la solicita.
- Solo el propietario del ticket puede verlo o cambiar su estado.
- Solo `confirmed` crea gastos. Ningún otro estado puede hacerlo.
- Ningún estado expone el archivo por URL pública.
- La confirmación debe ser idempotente: confirmar dos veces no crea gastos duplicados.

## Estados

### uploaded
- **Significa:** el archivo se recibió y se guardó en almacenamiento privado; aún no se ha leído.
- **El usuario puede:** esperar o cancelar (descartar).
- **Datos que existen:** archivo, propietario, fecha de subida, tipo, hash del archivo (propuesta, para duplicados).
- **Transiciones:** → `processing`, → `discarded`, → `expired`.
- **Eliminación:** si pasa a `discarded` o `expired`, se borra el archivo. Debería ser un estado muy breve.

### processing
- **Significa:** el sistema está leyendo el ticket y extrayendo datos.
- **El usuario puede:** esperar o cancelar.
- **Datos que existen:** archivo; ningún dato extraído definitivo.
- **Transiciones:** → `ready_for_review`, → `needs_review`, → `failed`, → `discarded`.
- **Eliminación:** si falla o se cancela, se borra el archivo. Debe tener tiempo máximo; superado, pasa a `failed`.

### ready_for_review
- **Significa:** extracción completa y con confianza suficiente; pendiente de que el usuario la revise y confirme.
- **El usuario puede:** editar cualquier campo, repartir artículos, ver avisos de duplicado, confirmar o descartar.
- **Datos que existen:** archivo, borrador de cabecera y artículos, categorías sugeridas, avisos.
- **Transiciones:** → `confirmed`, → `discarded`, → `expired`.
- **Eliminación:** el borrador y el archivo se eliminan al pasar a `discarded` o `expired`. Plazo de caducidad: pendiente *(propuesta: 24 h)*.

### needs_review
- **Significa:** extracción parcial o dudosa (campos ausentes, total no cuadra con artículos, baja confianza). Exige atención explícita.
- **El usuario puede:** lo mismo que en `ready_for_review`; los campos problemáticos están marcados y la confirmación puede exigir resolverlos.
- **Datos que existen:** los de `ready_for_review` más lista de campos problemáticos.
- **Transiciones:** → `confirmed`, → `discarded`, → `expired`.
- **Eliminación:** igual que `ready_for_review`.

### confirmed
- **Significa:** el usuario confirmó; se crearon uno o varios gastos vinculados al ticket.
- **El usuario puede:** ver los gastos creados; si pidió conservar la imagen, verla o borrarla.
- **Datos que existen:** gastos creados (siguen la vida normal de un gasto), vínculo ticket↔gastos *(NO DEMOSTRADO que pueda representarse hoy: `expenses` no tiene campo de vínculo; ver `decision-log.md`)*, archivo solo si se pidió conservarlo.
- **Transiciones:** → `deleted` (borrado del archivo). Deshacer la confirmación **no está definido** (decisión pendiente).
- **Eliminación:** por defecto, el archivo se elimina inmediatamente tras confirmar. Si se conserva, hasta que el usuario lo borre o elimine su cuenta.

### discarded
- **Significa:** el usuario descartó el ticket antes de confirmar.
- **El usuario puede:** nada; puede subir de nuevo.
- **Datos que existen:** como máximo un registro mínimo del descarte para cuota (por decidir).
- **Transiciones:** → `deleted`.
- **Eliminación:** archivo y borrador se eliminan de inmediato.

### failed
- **Significa:** no se pudo leer el ticket (archivo ilegible, fallo del servicio, tiempo agotado).
- **El usuario puede:** reintentar, subir otro archivo o crear el gasto a mano.
- **Datos que existen:** archivo (para el reintento), motivo genérico del fallo.
- **Transiciones:** → `processing` (reintento), → `discarded`, → `deleted`.
- **Eliminación:** el archivo se elimina si no hay reintento en el plazo *(propuesta: 1 h)*.
- **Cuota:** si un fallo consume cuota es una decisión pendiente (recomendación: no).

### expired
- **Significa:** el ticket estuvo pendiente de revisión demasiado tiempo sin confirmarse ni descartarse.
- **El usuario puede:** nada sobre ese ticket; debe subirlo de nuevo.
- **Datos que existen:** ninguno salvo marca mínima.
- **Transiciones:** → `deleted`.
- **Eliminación:** archivo y borrador se eliminan al caducar. Requiere una tarea programada; la infraestructura de tareas programadas **no está demostrada** en el repo (solo hay mención a `CRON_SECRET` como opcional en `docs/planning/plus-stripe-test-integration.md`).

### deleted
- **Significa:** estado terminal; el archivo y los datos temporales ya no existen.
- **El usuario puede:** nada.
- **Datos que existen:** ninguno del archivo ni del borrador. Se conservan los gastos creados si hubo confirmación. Una marca mínima de auditoría o cuota es decisión pendiente.
- **Transiciones:** ninguna.
- **Eliminación:** el borrado debe verificarse en almacenamiento, no solo marcarse en base de datos.

## Tabla de transiciones permitidas

| Desde | Hacia |
|---|---|
| uploaded | processing, discarded, expired |
| processing | ready_for_review, needs_review, failed, discarded |
| ready_for_review | confirmed, discarded, expired |
| needs_review | confirmed, discarded, expired |
| failed | processing, discarded, deleted |
| confirmed | deleted |
| discarded | deleted |
| expired | deleted |
| deleted | (ninguna) |

Cualquier otra transición se rechaza.
