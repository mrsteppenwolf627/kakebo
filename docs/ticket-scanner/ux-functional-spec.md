# Escáner de tickets — Especificación UX y funcional (Fase 3)

Rama `feature/ticket-scanner-fase-3`, sobre `e0cc228` (Fases 0–2). **Solo especificación**: no hay componentes, código, dependencias ni migraciones. No cumple ni afirma cumplimiento legal ni WCAG; fija requisitos técnicos verificables.

Convenciones: **DEMOSTRADO** = comprobado en el repo (ruta); **PROPUESTO** = diseño nuevo; **NO DEMOSTRADO** = sin evidencia; **PENDIENTE** = decisión abierta del propietario. Valores entre llaves `{…}` son marcadores, no cifras.

Documentos relacionados: [`product-requirements.md`](product-requirements.md), [`state-machine.md`](state-machine.md), [`mvp-scope.md`](mvp-scope.md), [`decision-log.md`](decision-log.md) (Fase 0); [`provider-benchmark.md`](provider-benchmark.md) (Fase 1); [`privacy-security-architecture.md`](privacy-security-architecture.md), [`data-flow.md`](data-flow.md), [`threat-model.md`](threat-model.md) (Fase 2); [`ux-wireflows.md`](ux-wireflows.md), [`ux-copy-es-en.md`](ux-copy-es-en.md), [`ux-functional-spec.json`](ux-functional-spec.json) (esta fase).

## 0. Resumen no técnico

El escáner se presenta como una función más de la app. Si la persona tiene acceso (Premium/Plus, PENDIENTE), elige foto, imagen o PDF, espera mientras se procesa, **revisa y corrige** lo que se ha leído y confirma; solo entonces se crean uno o varios gastos. Si no tiene acceso, **ve la función pero al tocarla solo aparece una pantalla que explica el plan**; nunca se abre la cámara ni el selector de archivos. La pantalla de revisión es el centro del diseño: marca lo dudoso, no inventa valores, no sobrescribe lo que la persona ya corrigió y bloquea la confirmación si falta lo esencial o las cuentas no cuadran.

## 1. Evidencia de la UI existente

| Tema | Hecho | Ruta |
|---|---|---|
| Navegación superior | Lista fija de enlaces: inicio, tutorial, panel, agente, fijos, historial, análisis; menú móvil con botón «Menú»; botones «Nuevo gasto/ingreso» solo en escritorio | `src/components/TopNav.tsx` |
| Layout de `/app` | `TopNav` + contenido; `showPlan` depende de `PLUS_SUBSCRIPTIONS_ENABLED` | `src/app/[locale]/app/layout.tsx` |
| Acciones del panel | Enlaces «Añadir gasto» y «Añadir ingreso» a ancho completo en móvil, más `ReportButton` | `src/app/[locale]/app/page.tsx` |
| Botón flotante | Dos botones fijos (gasto/ingreso) de 56 px (`w-14 h-14`) con `aria-label` **en español fijo** | `src/components/FloatingAddButton.tsx` |
| Alta de gasto | Formulario cliente con fecha, concepto con sugerencia de IA, importe (`type="number"`), categoría y botón de guardar; errores en un bloque simple | `src/app/[locale]/app/new/NewExpenseClient.tsx` |
| Accesibilidad del formulario actual | Las etiquetas `<label>` no tienen `htmlFor` ni los campos `id`; el bloque de error no usa `role="alert"` ni `aria-live`; hay un texto fijo en español (`La fecha real se conserva…`) en una pantalla con inglés | `src/app/[locale]/app/new/NewExpenseClient.tsx` (líneas 468–475, 454–456) |
| Estilo de campos | `rounded-md border border-input … focus-visible:ring-2 …` | mismo archivo |
| Categorías en UI | Claves `supervivencia`, `opcional`, `cultura`, `extra`; etiquetas ES «Supervivencia / Ocio y vicio / Cultura / Extras» y EN «Survival / Optional / Culture / Extra»; se traducen al API como `survival/optional/culture/extra` | `src/app/[locale]/app/new/NewExpenseClient.tsx`, `messages/es.json` y `messages/en.json` (`Transaction.Common.categories`), `src/lib/schemas/common.ts` |
| Subcategorías | 14 identificadores con etiquetas ES/EN | `src/lib/subcategories.ts` |
| Creación de gasto | `POST /api/expenses`; el evento `expense_created` lleva solo `entry_method:"manual"` | `src/app/api/expenses/route.ts`, `NewExpenseClient.tsx:400` |
| Edición y borrado de gasto | Existen `GET`, `PATCH`, `DELETE` por id | `src/app/api/expenses/[id]/route.ts` |
| Bloqueo Plus (patrón) | `SubscriptionGuard` muestra título + descripción + `PlusRequiredNotice` **en lugar** del contenido; el servidor calcula `blocked`; con el interruptor apagado no bloquea | `src/components/saas/SubscriptionGuard.tsx`, `src/components/plus/PlusRequiredNotice.tsx`, `src/app/[locale]/app/agent/page.tsx`, `AgentPageClient.tsx` |
| Planes | Página de suscripción con `UpgradePanel` (radio mensual/anual, `aria` con ids) | `src/app/[locale]/app/subscription/page.tsx`, `src/components/plus/UpgradePanel.tsx` |
| Pruebas de a11y | axe-core sobre jsdom para pantallas Plus (sin contraste ni layout) | `src/__tests__/components/plus/plus-a11y.test.tsx` |
| Modales | No se encontró `role="dialog"` ni `aria-modal` en `src/components` | búsqueda en `src/components` — patrón de modal accesible: **NO DEMOSTRADO** |
| i18n | `es` (defecto) y `en`, sin detección de idioma; mensajes por espacio de nombres | `src/i18n/routing.ts`, `src/i18n/request.ts`, `messages/*.json` |
| Formato de importes | Mezcla: `toFixed(2)` + «€» fijo en historial y fijos; `Intl.NumberFormat` con `es-ES`/`en-IE` solo en precios de Plus | `src/app/[locale]/app/history/page.tsx`, `src/lib/plus/pricing.ts` |
| Consentimiento | Clave `kakebo-cookie-consent`; analítica solo con aceptación | `src/lib/consent.ts`, `src/components/landing/CookieBanner.tsx` |
| Analytics | Lista cerrada de eventos; propiedades libres; sanitizador solo en calculadoras | `src/lib/analytics.ts` |
| PWA | Manifiesto `standalone`, `start_url:/app`; sin service worker; sin uso de `navigator.onLine` | `src/app/manifest.ts`, búsqueda en `src` — **offline: NO DEMOSTRADO** |
| Cámara | Sin `input type="file"`, `capture` ni `getUserMedia`; la CSP actual no define `Permissions-Policy` | búsqueda en `src`, `next.config.ts` |

Lecciones: el formulario actual **no es un modelo de accesibilidad** (etiquetas sin asociación, errores sin anuncio, español fijo); el escáner no debe copiarlo. El patrón de bloqueo actual **oculta** el contenido; el escáner necesita uno distinto (visible pero inerte).

## A. Mapa de pantallas y estados

Rutas (PROPUESTO, nombres provisionales): `/app/scan` (inicio del escáner) y `/app/scan/[ticketId]` (progreso y revisión). El nombre de ruta es una decisión pendiente.

### A.1 Entradas

| Entrada | Ubicación | Estado |
|---|---|---|
| Panel | Tarjeta/enlace «Escanear ticket» junto a «Añadir gasto» y «Añadir ingreso» en `src/app/[locale]/app/page.tsx` | PROPUESTO |
| Alta manual | Enlace secundario «¿Tienes un ticket? Escanéalo» en `/app/new` | PROPUESTO |
| Navegación superior | Nuevo elemento en `TopNav`. La barra ya tiene 7 elementos: **PENDIENTE** (puede ir solo en el panel) | PENDIENTE |
| Botón flotante | No añadir un tercer botón fijo hasta decidir; ya hay dos de 56 px | PROPUESTO |
| Usuario gratuito | La entrada se muestra igual, con indicador de plan (no solo color) | PROPUESTO |

### A.2 Pantallas

| ID | Pantalla | Para quién | Notas |
|---|---|---|---|
| S1 | Inicio del escáner | Con acceso | Elegir fuente, tickets pendientes, cuota restante |
| S2 | Explicación del plan | Gratuito | Se llega desde S1-bloqueada; **no existe en el DOM ningún `input type="file"` ni acceso a la cámara** |
| S3 | Elegir origen | Con acceso | Hacer foto / elegir imagen / elegir PDF |
| S4 | Vista previa del archivo | Con acceso | Confirmar o cambiar el archivo antes de enviarlo |
| S5 | Subiendo | Con acceso | Progreso real de la subida, cancelable |
| S6 | Error de archivo | Con acceso | Formato, tamaño, páginas, protegido, ilegible |
| S7 | Procesando | Con acceso | Estado indeterminado, cancelable |
| S8 | Revisión | Con acceso | Cabecera, artículos, totales, avisos |
| S8a | Repartir artículo | Con acceso | Hoja/diálogo para dividir un artículo entre categorías |
| S9 | Confirmación | Con acceso | Resumen de gastos a crear y retención del original |
| S10 | Hecho | Con acceso | Gastos creados, estado del original |
| S11 | Límite alcanzado | Con acceso | Cuota diaria agotada |
| S12 | Sin conexión | Con acceso | Banner y bloqueo de acciones que requieren red |
| S13 | Caducado | Con acceso | Ticket pendiente que expiró |
| S14 | Eliminado/descartado | Con acceso | Confirmación de descarte |
| S15 | Error general | Con acceso | Fallo recuperable o no |

### A.3 Estados por pantalla

| Estado | Dónde | Comportamiento |
|---|---|---|
| Sin tickets | S1 | Texto de ayuda con las tres vías; sin lista |
| Con acceso, hay pendientes | S1 | Lista de tickets en revisión con su caducidad (si la caducidad es PENDIENTE no se muestra la hora) |
| Gratuito (bloqueado) | S1→S2 | Tarjeta visible con candado y etiqueta textual «{PLAN_NAME}»; el control es un enlace a S2, no un selector; ver A.4 |
| Límite alcanzado | S1, S3 | Botones de origen deshabilitados con `aria-disabled` y explicación; cuándo se reinicia: PENDIENTE (zona del día) |
| Sin conexión | todas | Banner persistente; se impide subir/confirmar; el borrador ya cargado se conserva en pantalla |
| Subiendo | S5 | Barra de progreso real; cancelar |
| Procesando | S7 | Indicador indeterminado, sin tiempo prometido; cancelar |
| Revisión | S8 | Campos editables con confianza visible |
| Duplicado detectado | S8 | Aviso no destructivo, no bloquea |
| Confirmado | S10 | Resumen y estado del original (condicionado) |
| Expirado | S13 | Explica que hay que subirlo de nuevo |
| Eliminado | S14 | Confirma el descarte |
| Error | S6/S15 | Mensaje recuperable con acción |

### A.4 Usuario gratuito: función visible pero inerte

Requisitos (PROPUESTO; corresponden a F2-1 de Fase 2):
1. En S1 la persona gratuita ve la función con un indicador que **no depende solo del color** (icono de candado y texto «{PLAN_NAME}»).
2. El control principal es un **enlace** (`<a>`/`Link`) a S2, no un botón que dispare un selector.
3. Para gratuitos el DOM **no contiene** ningún `input type="file"`, `capture` ni llamada a la cámara, ni de forma oculta. Test: consulta del DOM sin ese elemento.
4. S2 explica en lenguaje llano qué hace el escáner y que forma parte del plan; el contenido exacto del plan, el precio y el nombre son **PENDIENTES**. Reutiliza el patrón de `PlusRequiredNotice` y el enlace a `/app/subscription`.
5. Las rutas de servidor del escáner rechazan igualmente a gratuitos (Fase 2, A.2). La interfaz no es la barrera de seguridad (`src/components/saas/SubscriptionGuard.tsx` lo declara así).
6. El estado «con acceso» se calcula en el servidor y se pasa al cliente (patrón `getPlusAccessView`/`blocked` de `src/lib/plus/access-view.ts`). Con el interruptor apagado el patrón actual **no bloquea** (`isAiBlocked`), lo que para el escáner no es aceptable (Fase 2, F2-1): el escáner debe seguir bloqueado salvo que se pruebe el acceso.
7. Jerarquía de entitlement (founder, legacy_full, plus_active, plus_canceled_pending, free_*) aplicada al escáner: **PENDIENTE**. Esta especificación no asume cuáles tienen acceso.

### A.5 Idiomas

- Toda cadena visible, incluidos `aria-label`, mensajes de error y anuncios en vivo, sale de `messages/es.json` y `messages/en.json` bajo un espacio de nombres nuevo (p. ej. `Scanner`), con **las mismas claves en ambos**. Un test de paridad de claves y de ausencia de texto fijo es requisito (hoy hay textos fijos en español en `FloatingAddButton.tsx` y `NewExpenseClient.tsx`).
- Fechas e importes en la configuración regional de la interfaz. Divisa: **solo EUR** de momento; los formatos con `Intl.NumberFormat` (`es-ES`/`en-IE`, como `src/lib/plus/pricing.ts`) en vez de `toFixed(2)` + «€».
- El idioma del ticket es independiente del de la interfaz.

## B. Flujos detallados

Los diagramas están en [`ux-wireflows.md`](ux-wireflows.md). Aquí, las reglas.

### B.1 Fuentes de entrada

| Fuente | Control | Notas |
|---|---|---|
| Cámara móvil | `input type="file" accept="image/*" capture="environment"` | Comportamiento en iOS y Android dentro de la PWA instalada: **NO DEMOSTRADO**. Alternativa: sin `capture`, la persona elige «hacer foto» desde el selector del sistema. `getUserMedia` no se usa en esta especificación |
| Imagen | `input type="file" accept` con los tipos permitidos | Tipos y tamaño: PENDIENTE (Fase 2, A.8) |
| PDF | `input type="file" accept="application/pdf"` | Límite de páginas: PENDIENTE. El tipo real se valida en servidor, no se confía en `accept` |

Todos los controles solo existen en DOM si hay acceso y cuota disponible.

### B.2 Multipágina

- Un ticket = un archivo (Fase 2, A.7). Un PDF de varias páginas es un solo ticket; el límite de páginas es `{MAX_PAGES}` (PENDIENTE).
- Varias fotos de un ticket largo: **fuera del MVP**. S4 no ofrece «añadir otra página». Si la persona lo necesita, el copy sugiere subir un PDF (condicionado a que esté permitido).
- En S4 y S8 se muestra el número de páginas del PDF.

### B.3 Subida, cancelación y reintento

1. S4 → «Usar este archivo» → S5.
2. En S5 el progreso es el real de la transferencia, no estimado. «Cancelar» detiene la subida y descarta lo subido (estado `deleted`, motivo cancelación).
3. Si falla la red: S15 con «Reintentar» (no consume cuota si aún no se envió a OCR; Fase 2, A.4).
4. En S7 «Cancelar» solicita el descarte; si el procesamiento ya empezó puede que la cuota ya se haya consumido: el copy lo dice en condicional (PENDIENTE hasta fijar A.4).
5. Tras `failed` se ofrece «Reintentar» (máximo `{MAX_RETRIES}`, PENDIENTE; propuesta de Fase 2: 2) y «Introducir el gasto a mano» (enlace a `/app/new`).

### B.4 Progreso sin promesas

- S5 muestra barra determinada (bytes enviados).
- S7 muestra un indicador indeterminado y un texto de estado. **No se promete ni se estima tiempo.**
- Si S7 supera `{LONG_WAIT_THRESHOLD}` (PENDIENTE), aparece un texto adicional («Esto está tardando más de lo normal») y la opción de cancelar sigue disponible.
- La persona puede salir de la pantalla: el ticket sigue en servidor (estado persistido) y reaparece en S1 como «En proceso» o «Listo para revisar».

### B.5 Errores de archivo

Mostrados en S6, antes de procesar o tras la validación de servidor (Fase 2, A.8):

| Causa | Mensaje (ver copy) | Acción |
|---|---|---|
| Formato no admitido | Indica los formatos `{FORMATS}` (PENDIENTE) | Elegir otro archivo |
| Demasiado grande | Indica `{MAX_SIZE}` (PENDIENTE) | Elegir otro / hacer foto de nuevo |
| Demasiadas páginas | Indica `{MAX_PAGES}` (PENDIENTE) | Elegir otro |
| PDF protegido con contraseña | No se admiten PDF protegidos | Quitar la protección y volver a subir |
| Archivo dañado o ilegible | No se pudo leer el archivo | Reintentar con otro |
| No parece un ticket | No se ha reconocido un ticket | Elegir otro / introducir a mano |

Ningún mensaje de error incluye el nombre del archivo, importes ni contenido leído.

### B.6 Revisión y confirmación obligatorias

- **No existe** ruta para crear gastos sin pasar por S8 y S9.
- S8 es editable en todos sus campos. S9 es un resumen con una única acción de confirmación explícita.
- Confirmar es idempotente (Fase 2, A.5): un doble toque no crea gastos duplicados; el botón queda deshabilitado con `aria-busy` mientras se envía.

### B.7 Cabecera editable

Campos: comercio, fecha, total, IVA, método de pago. Obligatorios y opcionales en C.2. Edición:
- Comercio: texto, longitud máxima PENDIENTE.
- Fecha: selector de fecha nativo (patrón DEMOSTRADO en el alta actual); la fecha del ticket se conserva como fecha real del gasto, sin cambiar la lógica de ciclos (`NewExpenseClient.tsx`, `src/app/api/expenses/route.ts`).
- Total e IVA: campo numérico en EUR con coma decimal en `es`. Entrada tolerante y normalizada al enviar.
- Método de pago: lista cerrada (valores PENDIENTES de definir; por ejemplo efectivo/tarjeta/otro/desconocido) más «No lo sé».

### B.8 Artículos y clasificación

- Cada artículo muestra descripción, cantidad (si existe), importe y categoría sugerida.
- La categoría se elige entre las **4 categorías existentes** (y subcategoría opcional); nunca categorías nuevas.
- La sugerencia es **editable** y muestra su origen: «Sugerida» frente a «Elegida por ti». Las etiquetas de categoría salen de `Transaction.Common.categories`.
- Si no hay sugerencia, el campo queda vacío y exige elegir antes de confirmar (no se pone una categoría por defecto en silencio).

### B.9 Separar y repartir artículos

- **Separar:** el sistema propone una lista de artículos; la persona puede unir, dividir o eliminar filas.
- **Repartir un artículo entre categorías (S8a):** abre una hoja con el importe del artículo y N filas «categoría + importe». Reglas: la suma de las partes debe igualar el importe del artículo (se muestra la diferencia y se bloquea «Aplicar» hasta que cuadre); mínimo 2 partes; máximo `{MAX_SPLITS}` (PENDIENTE); importe de cada parte >0.
- **Gastos creados:** un gasto por **categoría** resultante (agrupando artículos y partes), no uno por artículo, salvo que se decida lo contrario. El agrupado exacto y el número máximo de gastos por ticket son **PENDIENTES** (dependen del modelo de gastos, Fase 2, bloqueo 3).
- S9 muestra «Se crearán N gastos» con su categoría e importe antes de confirmar.
- Fecha de todos los gastos: la del ticket.
- La nota de cada gasto: el comercio (≤500 caracteres, `createExpenseSchema`). Su contenido definitivo es PENDIENTE; no se copian descripciones de artículos a la nota sin decisión.

### B.10 Duplicados (no destructivo)

- Aviso en S8 con texto y icono (no solo color): «Puede que este ticket ya esté registrado». Muestra el gasto o ticket que parece coincidir **sin** volcar datos financieros innecesarios en anuncios.
- Acciones: «Es un duplicado, descartar» (lleva a S14) y «No es un duplicado, continuar». Ninguna acción borra nada sin pedirlo.
- El aviso nunca bloquea la confirmación.

### B.11 Original: borrado y conservación

- **Por defecto:** tras confirmar se elimina el original. En S9 hay una opción **explícita**, no premarcada, «Conservar el original» con selección de duración `{RETENTION_OPTIONS}` (PENDIENTE; TTL máximo por decidir) y la posibilidad de revocarla.
- El copy de borrado y cifrado es **condicionado**: solo puede afirmar que se elimina o que está cifrado cuando esas capacidades estén implementadas y verificadas (Fase 2, A.6 y C).
- En S10 se muestra el estado del original únicamente con los textos permitidos por el estado real (`borrado verificado`, `conservado hasta…`, `pendiente de borrado`).

### B.12 Deshacer

- **Antes de confirmar:** siempre posible. «Volver» conserva los cambios de la sesión; «Descartar ticket» elimina el borrador y el original (S14).
- **Después de confirmar:** no se ofrece «deshacer» en el MVP (Fase 2, P8). Los gastos se pueden editar o borrar con los flujos existentes (`PATCH`/`DELETE` en `src/app/api/expenses/[id]/route.ts`). Borrar un gasto **no** recupera el original ya eliminado. S10 lo explica con el copy correspondiente.
- Si el ticket se conservó, borrar un gasto no borra el original; la gestión del original es independiente.

### B.13 Minimización

- No se piden datos que no se usen: no se pide NIF, dirección del comercio, nombre del titular, número de tarjeta ni ubicación.
- No se muestran últimos dígitos de tarjeta ni dirección aunque el proveedor los devuelva; el adaptador los descarta (Fase 2, D.1).
- Los nombres de archivo del usuario no se muestran ni se guardan.
- No se pide permiso de ubicación.

## C. Revisión de campos dudosos

### C.1 Niveles de confianza

| Nivel | Significado de producto | Presentación |
|---|---|---|
| `unknown` | El proveedor no devolvió confianza o el campo falta | Etiqueta textual «Sin datos» / «Sin confianza indicada»; el campo queda vacío o marcado |
| `low` | Dudoso | Icono + texto «Revisa este dato»; el campo recibe foco al abrir S8 si es obligatorio |
| `medium` | Probable | Texto «Comprueba» discreto |
| `high` | Probable correcto | Sin marca adicional |

Los umbrales numéricos entre niveles son **PENDIENTES**; dependen de las pruebas sintéticas (Fase 1) y del proveedor, que no está decidido (el proveedor puede no dar confianza por campo: NO DEMOSTRADO para Google en Fase 1). Nunca se presenta la confianza como porcentaje de acierto ni como garantía.

### C.2 Obligatorios y opcionales

| Campo | Obligatorio para confirmar | Notas |
|---|---|---|
| Comercio | Sí | Puede escribirlo la persona |
| Fecha | Sí | Debe ser una fecha válida; el ciclo debe estar abierto (`src/app/api/expenses/route.ts`) |
| Total | Sí | >0 |
| IVA | No | Se puede dejar vacío |
| Método de pago | No | «No lo sé» válido |
| Artículos | No | Sin artículos se crea un solo gasto por el total |
| Categoría de cada gasto | Sí | Una de las 4 existentes |

### C.3 Bloqueo de confirmación

«Confirmar» queda deshabilitado (`aria-disabled`, con motivo enlazado por `aria-describedby`) si:
1. falta comercio, fecha o total, o no son válidos;
2. algún gasto a crear no tiene categoría;
3. hay un reparto incompleto (suma de partes distinta del importe del artículo);
4. el ciclo de la fecha del ticket está cerrado (aviso con alternativa; la lógica actual devuelve conflicto: `src/app/api/expenses/route.ts`);
5. la suma de artículos no coincide con el total y la persona no ha resuelto la diferencia.

**Incoherencia suma-artículos/total (regla 5):** se muestra la diferencia con texto («Los artículos suman X; el total es Y»). La persona puede (a) corregir artículos, (b) corregir el total, o (c) aceptar la diferencia añadiendo un artículo «Ajuste» visible y editable. El sistema **no oculta ni distribuye la diferencia por su cuenta**. La tolerancia (redondeos de céntimo) es PENDIENTE.

### C.4 Las correcciones de la persona prevalecen

- Cada campo guarda su origen: `ocr`, `user`.
- Tras una edición manual, ningún reintento ni reprocesado **sobrescribe** el valor `user`. Si se reprocesa, el nuevo resultado OCR solo rellena campos aún sin editar y se ofrece «Ver propuesta nueva» para los editados; no se aplica en silencio.
- Un valor editado a mano deja de mostrar el nivel de confianza del OCR (muestra «Editado por ti»).

### C.5 Estimaciones y valores inventados

- Se prohíbe rellenar con valores supuestos: IVA calculado, fecha de hoy, total sumado, método de pago por defecto.
- Si se muestra un valor calculado por la interfaz (por ejemplo, la suma de artículos), se etiqueta como «Calculado» y no se guarda como si el ticket lo dijera.
- Un campo ausente se muestra vacío, con etiqueta de «Sin datos».

### C.6 Formato

- Moneda EUR con `Intl.NumberFormat` según la configuración regional de la interfaz; sin selector de divisa.
- Si el proveedor devuelve otra divisa o no devuelve divisa, S8 avisa «Este ticket no parece estar en euros» y no permite confirmar hasta que la persona lo resuelva (PENDIENTE de política; la divisa múltiple está fuera de alcance).
- Importes con dos decimales; entrada con coma o punto aceptada en `es`; el valor enviado al servidor se normaliza (formato exacto: PENDIENTE hasta fijar el esquema).

## D. Interacción y accesibilidad

Son **requisitos técnicos verificables**, no una afirmación de cumplimiento. Referencia orientativa: criterios de éxito de WCAG 2.2 AA, cuya conformidad no se afirma.

### D.1 Teclado y lector de pantalla
- Todo el flujo se completa solo con teclado; orden de tabulación = orden visual; sin trampas de foco.
- Cada campo tiene `<label for>` asociado con `id` (el formulario actual no lo cumple; no copiarlo).
- Los botones de acción son `<button>`; la navegación, enlaces.
- Los grupos (reparto de categorías, método de pago) usan `fieldset/legend` o `role="group"` con nombre.
- El estado de confianza y de cada artículo se transmite como texto, no como atributo visual.
- Lista de artículos: estructura de lista o tabla con cabeceras, no `div`s sueltos.

### D.2 Gestión del foco
- Al cambiar de pantalla (S3→S4→S5→S7→S8→S9→S10) el foco va al encabezado `h1` de la nueva pantalla (con `tabindex="-1"`).
- Al abrir un diálogo (S8a y S9 si es modal): foco al primer elemento significativo, trampa de foco dentro, `Escape` cierra, el foco **vuelve al control que lo abrió**, el fondo recibe `inert`/`aria-hidden`. No existe patrón de diálogo accesible en el repo (**NO DEMOSTRADO**); se define como requisito.
- Tras un error de validación, el foco va al resumen de errores o al primer campo inválido.
- Tras eliminar una fila de artículo, el foco va a la fila anterior o a «Añadir artículo».

### D.3 Anuncios en vivo
- Región `aria-live="polite"` para progreso (hitos, no cada porcentaje), «Listo para revisar», «Cambios guardados».
- `role="alert"` (assertive) para errores bloqueantes.
- El estado de carga usa `aria-busy` en la región afectada y un texto visible.
- Los anuncios no incluyen importes, comercios ni artículos.

### D.4 Táctil, zoom, contraste, orientación
- Objetivos táctiles ≥ 44×44 px (el botón flotante actual mide 56 px: `FloatingAddButton.tsx`; los botones pequeños `h-8` de `NewExpenseClient.tsx` **no** cumplirían).
- Funciona al 200 % de zoom y con texto ampliado sin pérdida de funciones ni scroll horizontal.
- Contraste de texto e iconos verificado en navegador real (el axe en jsdom no mide contraste: `plus-a11y.test.tsx` lo declara).
- Funciona en vertical y horizontal; no se bloquea la orientación.
- Respeta `prefers-reduced-motion` en transiciones y barras.

### D.5 No depender solo del color
- Confianza, errores, duplicados y estados usan icono + texto, además del color.
- El color de categoría existente (`KAKEBO_CATEGORIES`) acompaña siempre al nombre de la categoría.

### D.6 Estados de carga y errores recuperables
- Cada pantalla de espera tiene salida: cancelar o volver.
- Todo error ofrece una acción siguiente (reintentar, elegir otro, introducir a mano).
- Perder la red no pierde lo ya editado en pantalla.

### D.7 Verificación propuesta
axe-core en jsdom para estructura (patrón existente, `src/__tests__/components/plus/plus-a11y.test.tsx`), más una pasada manual con teclado, VoiceOver y TalkBack, zoom 200 % y contraste en navegador real. Ningún documento afirma haberlo pasado.

## E. Instrumentación propuesta (no implementar)

Mantener los eventos y parámetros existentes cuando sea relevante: `expense_created` con `entry_method`. El valor `entry_method:"manual"` hoy es el único; un valor nuevo para el escáner (p. ej. `scanner`) es una **propuesta**, solo si se necesita.

Reglas:
- Solo con consentimiento explícito (`src/lib/consent.ts`, `analyticsAllowed()`); sin consentimiento no se envía nada.
- Lista blanca de parámetros: `tool_name`, `page_path`, `page_title`, `source`, y un estado técnico **no financiero** (p. ej. `state`: `locked`, `quota_reached`, `offline`, `error`).
- Eventos futuros solo si son necesarios (PROPUESTO): `scanner_opened`, `scanner_blocked_viewed` (pantalla S2), `scanner_source_selected` con `source` ∈ {`camera`,`image`,`pdf`}, `scanner_ticket_submitted`, `scanner_ticket_confirmed`, `scanner_error` con código técnico enumerado. Ninguno lleva nombres de proveedor, importes ni datos del ticket.
- **Prohibido explícitamente** en cualquier evento, parámetro, URL o `page_title`: ingresos, gastos, objetivos, importes, porcentajes, **fechas del ticket**, comercio, categorías, artículos, nº de artículos, método de pago, IVA, confianza por campo, duplicado detectado, discrepancia de totales y cualquier valor derivado de ellos.
- Los estados «derivados de datos financieros» (p. ej. `duplicate_detected`, `total_mismatch`) **no** se envían.
- Se necesita una lista blanca en `sanitize…` equivalente a la de la calculadora de ahorro y un test que falle ante parámetros fuera de lista (hoy `EventProperties` admite cualquier valor: `src/lib/analytics.ts`).

## F. Pantallas: contenido y reglas por pantalla

| Pantalla | Contenido mínimo | Acciones | Foco inicial |
|---|---|---|---|
| S1 | `h1`, cuota restante (condicionada), tres vías, lista de pendientes | Origen, abrir pendiente | `h1` |
| S2 | `h1`, qué hace, que forma parte del plan, enlace a planes, aviso de privacidad condicionado | «Ver planes», «Volver» | `h1` |
| S3 | `h1`, tres botones con descripción de formatos `{FORMATS}` | Foto, imagen, PDF, volver | `h1` |
| S4 | Vista previa (imagen o icono PDF + nº de páginas), formato, tamaño | «Usar este archivo», «Cambiar» | `h1` |
| S5 | Barra determinada, texto de estado | «Cancelar» | `h1` |
| S6 | Motivo, qué hacer | Reintentar, elegir otro, a mano | Resumen de error |
| S7 | Indicador indeterminado, texto de estado | «Cancelar» | `h1` |
| S8 | Cabecera, artículos, totales, avisos, retención | Editar, repartir, confirmar, descartar | `h1`, o primer campo obligatorio dudoso |
| S9 | Resumen de gastos, retención | «Confirmar», «Volver a revisar» | Título del diálogo |
| S10 | Gastos creados, estado del original | «Ver en el panel», «Escanear otro» | `h1` |

## G. Decisiones y bloqueos

Pendientes que **esta especificación no resuelve** (registradas en `decision-log.md`):
- Jerarquía de entitlement aplicada al escáner (founder, legacy_full, plus_active, plus_canceled_pending).
- Contenido exacto del plan Premium/Plus, su nombre en la interfaz y el precio.
- Límites de archivo y páginas; formatos admitidos.
- Definición del día y consumo de cuota.
- Equivalencia con el modelo de gastos (vínculo ticket↔gasto, agrupado de gastos, nota).
- Proveedor OCR y revisión de privacidad.
- Comportamiento de la cámara en la PWA.
- Umbrales de confianza.
- Posición de la entrada en la navegación.
- Patrón de diálogo accesible.

Sin esas decisiones no se puede pasar a implementar. Mientras tanto, el copy usa marcadores PENDIENTE y textos condicionados.

## H. Qué NO se ha demostrado

Comportamiento de `capture` y de la cámara en iOS/Android dentro de la PWA; modo sin conexión; patrón de diálogo accesible; contraste real; nombre y contenido del plan; confianza por campo del proveedor; existencia de un patrón de lista/tabla accesible en el repo.
