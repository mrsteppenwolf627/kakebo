# Escáner de tickets — Copy ES/EN (Fase 3)

Textos **propuestos**, no aprobados y no implementados. Revisión editorial y legal pendiente. No afirman cumplimiento legal.

Reglas del copy:
- Misma clave en ES y EN (paridad); el EN no contiene español.
- Marcadores `{…}` = valor PENDIENTE; no hay cifras inventadas. `{PLAN_NAME}` = nombre del plan aún sin decidir (el repo usa «Kakebo Plus» para la suscripción: `messages/es.json`, espacio `Plus`; la equivalencia con «Premium» está pendiente).
- Sin promesas de precisión, tiempos, proveedor, cifrado o borrado. Los textos marcados **[COND]** solo pueden mostrarse cuando la capacidad esté implementada **y** verificada. Los marcados **[PENDIENTE]** no pueden publicarse sin una decisión.
- Sin asesoramiento financiero.
- Claves bajo un espacio de nombres nuevo `Scanner` (PROPUESTO).

## 1. CTA y entrada

| Clave | ES | EN |
|---|---|---|
| `cta.primary` | Escanear ticket | Scan receipt |
| `cta.secondary` | ¿Tienes un ticket? Escanéalo | Have a receipt? Scan it |
| `cta.badgePlan` | {PLAN_NAME} | {PLAN_NAME} |
| `cta.lockedHint` | Función del plan {PLAN_NAME} | Included in the {PLAN_NAME} plan |
| `home.title` | Escáner de tickets | Receipt scanner |
| `home.intro` | Haz una foto o sube un archivo y revisa los datos antes de crear tus gastos. | Take a photo or upload a file and review the details before your expenses are created. |
| `home.empty` | Todavía no has escaneado ningún ticket. | You haven't scanned any receipts yet. |
| `home.pendingTitle` | Tickets pendientes | Pending receipts |
| `home.pendingItemReady` | Listo para revisar | Ready to review |
| `home.pendingItemProcessing` | En proceso | In progress |

## 2. Pantalla bloqueada (usuario sin acceso)

| Clave | ES | EN |
|---|---|---|
| `locked.title` | El escáner de tickets es una función del plan {PLAN_NAME} | The receipt scanner is part of the {PLAN_NAME} plan |
| `locked.body` | Con el escáner puedes convertir un ticket en gastos de Kakebo sin escribirlos uno a uno. Siempre revisas los datos antes de guardar nada. | With the scanner you can turn a receipt into Kakebo expenses without typing each one. You always review the details before anything is saved. |
| `locked.noAccessNote` | **[COND]** No se ha abierto la cámara ni se ha subido ningún archivo. | **[COND]** No camera was opened and no file was uploaded. |
| `locked.planContent` | [PENDIENTE: contenido exacto del plan y su precio] | [PENDING: exact plan contents and price] |
| `locked.seePlans` | Ver planes | See plans |
| `locked.back` | Volver | Back |
| `locked.openLink` | Ver cómo funciona | See how it works |

## 3. Origen del archivo (cámara, imagen, PDF)

| Clave | ES | EN |
|---|---|---|
| `source.title` | Elige cómo añadir el ticket | Choose how to add the receipt |
| `source.camera` | Hacer una foto | Take a photo |
| `source.cameraHint` | Usa la cámara de tu móvil. | Use your phone's camera. |
| `source.image` | Elegir una imagen | Choose an image |
| `source.pdf` | Elegir un PDF | Choose a PDF |
| `source.formatsLine` | Formatos admitidos: {FORMATS} | Supported formats: {FORMATS} |
| `source.limitsLine` | Tamaño máximo: {MAX_SIZE}. Páginas máximas: {MAX_PAGES}. | Maximum size: {MAX_SIZE}. Maximum pages: {MAX_PAGES}. |
| `source.cameraFailed` | No pudimos abrir la cámara. Elige una imagen. | We couldn't open the camera. Choose an image. |
| `source.oneFilePerReceipt` | Cada ticket se sube como un solo archivo. | Each receipt is uploaded as a single file. |
| `source.back` | Volver | Back |

## 4. Vista previa

| Clave | ES | EN |
|---|---|---|
| `preview.title` | Comprueba el archivo | Check the file |
| `preview.pages` | {COUNT} páginas | {COUNT} pages |
| `preview.useFile` | Usar este archivo | Use this file |
| `preview.change` | Cambiar archivo | Change file |
| `preview.alt` | Vista previa del archivo seleccionado | Preview of the selected file |

## 5. Carga y procesamiento

| Clave | ES | EN |
|---|---|---|
| `upload.title` | Subiendo el archivo | Uploading the file |
| `upload.progress` | Subida: {PERCENT} % | Upload: {PERCENT}% |
| `upload.cancel` | Cancelar | Cancel |
| `processing.title` | Leyendo el ticket | Reading the receipt |
| `processing.body` | Estamos leyendo el ticket. Puedes salir de esta pantalla y volver más tarde. | We're reading the receipt. You can leave this screen and come back later. |
| `processing.longWait` | Esto está tardando más de lo normal. Puedes cancelar o seguir esperando. | This is taking longer than usual. You can cancel or keep waiting. |
| `processing.cancel` | Cancelar | Cancel |
| `processing.announceStart` | Procesando el ticket. | Processing the receipt. |
| `processing.announceReady` | El ticket está listo para revisar. | The receipt is ready to review. |
| `processing.cancelQuotaNote` | [PENDIENTE: si cancelar durante el procesamiento afecta a tu límite diario] | [PENDING: whether cancelling during processing affects your daily limit] |

## 6. Revisión: cabecera, artículos y labels

| Clave | ES | EN |
|---|---|---|
| `review.title` | Revisa el ticket | Review the receipt |
| `review.intro` | Comprueba los datos. No se crea ningún gasto hasta que confirmes. | Check the details. No expense is created until you confirm. |
| `field.merchant` | Comercio | Merchant |
| `field.date` | Fecha | Date |
| `field.total` | Total | Total |
| `field.tax` | IVA | VAT |
| `field.paymentMethod` | Método de pago | Payment method |
| `field.items` | Artículos | Items |
| `item.description` | Descripción | Description |
| `item.quantity` | Cantidad | Quantity |
| `item.amount` | Importe | Amount |
| `item.category` | Categoría | Category |
| `item.add` | Añadir artículo | Add item |
| `item.remove` | Quitar artículo | Remove item |
| `item.removed` | Artículo quitado. | Item removed. |
| `payment.unknown` | No lo sé | I don't know |
| `field.optional` | (opcional) | (optional) |
| `field.required` | (obligatorio) | (required) |
| `field.noData` | Sin datos | No data |
| `field.currencyNote` | Importes en euros | Amounts in euros |
| `field.notEuro` | Este ticket no parece estar en euros. | This receipt doesn't seem to be in euros. |

Categorías: se reutilizan las etiquetas existentes (`Transaction.Common.categories`: ES «Supervivencia / Ocio y vicio / Cultura / Extras»; EN «Survival / Optional / Culture / Extra»). No se crean categorías nuevas.

## 7. Confianza y revisión

| Clave | ES | EN |
|---|---|---|
| `confidence.unknown` | Sin confianza indicada | No confidence available |
| `confidence.low` | Revisa este dato | Please check this |
| `confidence.medium` | Comprueba este dato | Double-check this |
| `confidence.high` | Sin avisos | No warnings |
| `confidence.edited` | Editado por ti | Edited by you |
| `confidence.suggested` | Sugerida | Suggested |
| `confidence.chosen` | Elegida por ti | Chosen by you |
| `confidence.calculated` | Calculado | Calculated |
| `confidence.disclaimer` | Los datos se leen automáticamente y pueden contener errores. Revísalos antes de confirmar. | Details are read automatically and may contain mistakes. Please review them before confirming. |
| `review.mismatch` | Los artículos suman {ITEMS_TOTAL} y el total del ticket es {TOTAL}. | The items add up to {ITEMS_TOTAL} and the receipt total is {TOTAL}. |
| `review.mismatchAdjust` | Añadir un ajuste visible | Add a visible adjustment |
| `review.blockedReason` | No puedes confirmar todavía: {REASON} | You can't confirm yet: {REASON} |
| `review.reason.merchant` | falta el comercio | the merchant is missing |
| `review.reason.date` | falta la fecha o no es válida | the date is missing or invalid |
| `review.reason.total` | falta el total o no es válido | the total is missing or invalid |
| `review.reason.category` | hay artículos sin categoría | some items have no category |
| `review.reason.split` | el reparto no coincide con el importe del artículo | the split doesn't match the item's amount |
| `review.reason.closedCycle` | el ciclo de esa fecha está cerrado | the cycle for that date is closed |
| `review.reason.mismatch` | la suma de artículos no coincide con el total | the items don't add up to the total |
| `review.newSuggestion` | Ver propuesta nueva | See new suggestion |

## 8. Repartir un artículo

| Clave | ES | EN |
|---|---|---|
| `split.open` | Repartir | Split |
| `split.title` | Repartir entre categorías | Split across categories |
| `split.partCategory` | Categoría de la parte {N} | Category for part {N} |
| `split.partAmount` | Importe de la parte {N} | Amount for part {N} |
| `split.addPart` | Añadir parte | Add part |
| `split.removePart` | Quitar parte | Remove part |
| `split.difference` | Faltan {DIFF} por repartir. | {DIFF} left to allocate. |
| `split.over` | Te pasas en {DIFF}. | You're over by {DIFF}. |
| `split.apply` | Aplicar | Apply |
| `split.cancel` | Cancelar | Cancel |
| `split.summary` | Repartido en {N} categorías | Split into {N} categories |

## 9. Duplicado

| Clave | ES | EN |
|---|---|---|
| `duplicate.title` | Puede que este ticket ya esté registrado | This receipt may already be registered |
| `duplicate.body` | Hemos encontrado un registro parecido. Puedes continuar si es otro ticket o descartar este. | We found a similar record. You can continue if this is a different receipt, or discard this one. |
| `duplicate.continue` | No es un duplicado, continuar | Not a duplicate, continue |
| `duplicate.discard` | Es un duplicado, descartar | It's a duplicate, discard |
| `duplicate.note` | Este aviso no impide guardar el ticket. | This notice doesn't stop you from saving the receipt. |

## 10. Confirmación

| Clave | ES | EN |
|---|---|---|
| `confirm.title` | Confirmar y crear gastos | Confirm and create expenses |
| `confirm.summary` | Se crearán {N} gastos. | {N} expenses will be created. |
| `confirm.line` | {CATEGORY}: {AMOUNT} | {CATEGORY}: {AMOUNT} |
| `confirm.dateNote` | Todos llevarán la fecha del ticket. | All of them will use the receipt date. |
| `confirm.action` | Confirmar | Confirm |
| `confirm.back` | Volver a revisar | Back to review |
| `confirm.saving` | Creando gastos… | Creating expenses… |
| `confirm.doneTitle` | Gastos creados | Expenses created |
| `confirm.doneBody` | Ya puedes verlos en tu panel. | You can now see them on your dashboard. |
| `confirm.viewDashboard` | Ver en el panel | View on dashboard |
| `confirm.scanAnother` | Escanear otro ticket | Scan another receipt |
| `confirm.noUndo` | Si algo no está bien, puedes editar o borrar cada gasto desde tu panel. | If something is wrong, you can edit or delete each expense from your dashboard. |

## 11. Borrado y retención del original

| Clave | ES | EN |
|---|---|---|
| `retention.keepLabel` | Conservar el original | Keep the original |
| `retention.keepHint` | [PENDIENTE: durante cuánto tiempo y cómo borrarlo] | [PENDING: for how long and how to delete it] |
| `retention.optionsLabel` | Durante cuánto tiempo | For how long |
| `retention.options` | {RETENTION_OPTIONS} | {RETENTION_OPTIONS} |
| `retention.defaultNote` | **[COND]** Por defecto, el archivo original se elimina al confirmar. | **[COND]** By default, the original file is deleted when you confirm. |
| `retention.statusDeleted` | **[COND]** Hemos eliminado el archivo original. | **[COND]** We deleted the original file. |
| `retention.statusPending` | **[COND]** El archivo original está pendiente de eliminarse. | **[COND]** The original file is waiting to be deleted. |
| `retention.statusKept` | **[COND]** Hemos conservado el archivo original hasta {DATE}. | **[COND]** We're keeping the original file until {DATE}. |
| `retention.deleteNow` | **[COND]** Eliminar el original ahora | **[COND]** Delete the original now |
| `retention.deleteExpenseNote` | Borrar un gasto no recupera un original ya eliminado. | Deleting an expense doesn't bring back an original that has already been deleted. |

Los textos **[COND]** no se muestran hasta que el borrado esté implementado y verificado. Hasta entonces, la pantalla no afirma que el archivo se elimine.

## 12. Cuota

| Clave | ES | EN |
|---|---|---|
| `quota.remaining` | Te quedan {N} tickets hoy. | You have {N} receipts left today. |
| `quota.reached` | Has alcanzado el límite de tickets de hoy ({DAILY_LIMIT}). | You've reached today's receipt limit ({DAILY_LIMIT}). |
| `quota.resetWhen` | [PENDIENTE: cuándo se reinicia el límite] | [PENDING: when the limit resets] |
| `quota.manualAlt` | Mientras tanto puedes añadir el gasto a mano. | In the meantime you can add the expense manually. |
| `quota.disabledSource` | No disponible: límite diario alcanzado. | Unavailable: daily limit reached. |

## 13. Errores

| Clave | ES | EN |
|---|---|---|
| `error.format` | Este formato no se admite. Formatos admitidos: {FORMATS}. | This format isn't supported. Supported formats: {FORMATS}. |
| `error.size` | El archivo es demasiado grande. Tamaño máximo: {MAX_SIZE}. | The file is too large. Maximum size: {MAX_SIZE}. |
| `error.pages` | El PDF tiene demasiadas páginas. Máximo: {MAX_PAGES}. | The PDF has too many pages. Maximum: {MAX_PAGES}. |
| `error.protected` | No se admiten PDF protegidos con contraseña. Quita la protección y vuelve a subirlo. | Password-protected PDFs aren't supported. Remove the protection and upload it again. |
| `error.unreadable` | No hemos podido leer el archivo. Prueba con otro. | We couldn't read the file. Try another one. |
| `error.notReceipt` | No parece un ticket de compra. | This doesn't look like a purchase receipt. |
| `error.processing` | No hemos podido procesar el ticket. | We couldn't process the receipt. |
| `error.network` | Ha fallado la conexión. Inténtalo de nuevo. | The connection failed. Please try again. |
| `error.generic` | Algo ha salido mal. Inténtalo de nuevo. | Something went wrong. Please try again. |
| `error.retry` | Reintentar | Try again |
| `error.chooseAnother` | Elegir otro archivo | Choose another file |
| `error.enterManually` | Introducir el gasto a mano | Enter the expense manually |
| `error.retryLimit` | Has llegado al límite de reintentos para este ticket. | You've reached the retry limit for this receipt. |
| `error.cycleClosed` | El ciclo de esa fecha está cerrado y no se pueden añadir gastos. | The cycle for that date is closed and expenses can't be added. |

## 14. Estados vacíos, caducado, descartado, sin conexión

| Clave | ES | EN |
|---|---|---|
| `expired.title` | Este ticket ha caducado | This receipt has expired |
| `expired.body` | Súbelo de nuevo para revisarlo. | Upload it again to review it. |
| `discard.action` | Descartar ticket | Discard receipt |
| `discard.confirm` | ¿Descartar este ticket? Perderás los cambios de esta revisión. | Discard this receipt? You'll lose the changes from this review. |
| `discard.done` | Ticket descartado. | Receipt discarded. |
| `offline.banner` | Sin conexión. Algunas acciones no están disponibles. | You're offline. Some actions aren't available. |
| `offline.retry` | Reintentar | Try again |
| `offline.kept` | Tus cambios en pantalla se conservan. | Your changes on this screen are kept. |

## 15. Privacidad y proveedor externo

| Clave | ES | EN |
|---|---|---|
| `privacy.provider` | **[COND]** Para leer el ticket, enviamos el archivo a un proveedor externo de reconocimiento de documentos. | **[COND]** To read the receipt, we send the file to an external document-recognition provider. |
| `privacy.providerDetail` | [PENDIENTE: nombre del proveedor, país de tratamiento y plazo de conservación; solo tras la revisión de privacidad] | [PENDING: provider name, processing country and retention period; only after the privacy review] |
| `privacy.minimal` | **[COND]** Solo usamos el ticket para crear tus gastos. | **[COND]** We only use the receipt to create your expenses. |
| `privacy.analytics` | **[COND]** No enviamos importes ni datos de tus tickets a herramientas de analítica. | **[COND]** We don't send amounts or receipt details to analytics tools. |
| `privacy.policyLink` | Política de privacidad | Privacy policy |
| `privacy.legalText` | [PENDIENTE: texto legal revisado] | [PENDING: reviewed legal text] |

Los textos **[COND]** solo se muestran cuando haya proveedor decidido, DPA firmado y política de privacidad actualizada. No se afirma cifrado, plazo de conservación ni ubicación del tratamiento.

## 16. Accesibilidad (anuncios y etiquetas)

| Clave | ES | EN |
|---|---|---|
| `a11y.uploadProgress` | Subida al {PERCENT} por ciento | Upload at {PERCENT} percent |
| `a11y.stepOf` | Paso {N} de {TOTAL} | Step {N} of {TOTAL} |
| `a11y.errorSummary` | Hay {N} errores que corregir | There are {N} errors to fix |
| `a11y.fileInputLabel` | Seleccionar archivo del ticket | Select receipt file |
| `a11y.closeDialog` | Cerrar | Close |
| `a11y.confidenceIcon` | Nivel de confianza: {LEVEL} | Confidence level: {LEVEL} |
| `a11y.lockedIcon` | Función bloqueada | Locked feature |

## 17. Textos que NO se escriben

No se escriben: nombre de proveedor, porcentajes de acierto, tiempos de procesamiento, «seguro», «cifrado», «garantizado», precios, ni afirmaciones de cumplimiento legal. Tampoco se afirma que se borre o se cifre hasta que esté implementado.
