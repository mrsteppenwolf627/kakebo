# Escáner de tickets — Benchmark de proveedores OCR (Fase 1)

Fecha de consulta de todas las fuentes: **2026-10-27**. Rama `feature/ticket-scanner-fase-1`.

Convenciones: **NO DEMOSTRADO** = no hay evidencia suficiente en las fuentes consultadas. «Fuente» = URL oficial del proveedor salvo que se indique. Los precios pueden cambiar y varían por región y contrato. Esta decisión **no autoriza** enviar tickets reales a ningún proveedor.

Limitación metodológica: las páginas se leyeron con una herramienta que resume el contenido; algunas páginas de precios cargan sus cifras de forma dinámica y no se pudieron leer (se indica caso por caso). Antes de firmar nada, hay que verificar cada cifra en la consola o con el comercial del proveedor.

## 1. Resumen no técnico

Se compararon seis opciones para leer tickets: Azure, Google, Amazon (AWS), Mindee, Veryfi y una opción gratuita de código abierto (Tesseract). Todas pueden leer comercio, fecha, total e impuestos y, en mayor o menor medida, los artículos. **No se ha podido medir la precisión de ninguna**: no hay credenciales ni autorización para abrir cuentas, y no se usan tickets reales. Lo que sí se ha hecho es comparar lo que cada proveedor documenta oficialmente: idiomas, formatos, límites, precio, privacidad y dónde procesa los datos.

Conclusión provisional: **Google Document AI Expense Parser en región UE** es el único de la tabla de la sección 2 que documenta a la vez español, método de pago, artículos y procesamiento en la UE. **Su soporte de PDF y de formatos de imagen es NO DEMOSTRADO** (la fuente consultada remite a otra página que no se leyó) y es un requisito del producto, así que debe verificarse antes de cualquier piloto. **AWS Textract AnalyzeExpense** tiene el precio por página más bajo entre los que tienen precio demostrado (Azure es NO DEMOSTRADO y Tesseract no tiene coste de licencia), con región en España, pero exige desactivar el uso de los documentos para mejorar sus servicios y no documenta el método de pago. Ninguno está probado todavía con tickets españoles. El siguiente paso razonable es una evaluación con documentos sintéticos y, solo después, decidir si se avanza.

## 2. Tabla comparativa

Leyenda: ✔ documentado · ✖ documentado como no disponible · ? NO DEMOSTRADO.

| Criterio | Azure Receipt | Google Expense Parser | Mindee Receipt | AWS Textract AnalyzeExpense | Veryfi | Tesseract (gratuito) |
|---|---|---|---|---|---|---|
| Comercio, fecha, total | ✔ (merchant, fecha, total) | ✔ (`supplier_name`, `receipt_date`, `total_amount`) | ✔ | ✔ (`VENDOR_NAME`, fecha, total) | ✔ | ✖ no estructura |
| IVA / impuestos | ✔ (`TotalTax`; v4.0 añade `TaxDetails.Rate`) | ✔ (`total_tax_amount`, `net_amount`) | ✔ (`total_tax`, array con tasa/base/importe) | ✔ (campo de impuestos; detalle por tipo ?) | ✔ (`tax_lines`) | ✖ |
| Método de pago | ? (no aparece en el texto leído; hay que mirar el esquema) | ✔ (`payment_type`, `credit_card_last_four_digits`) | ? (no encontrado) | ? (no documentado en lo leído) | ✔ (`payment.type`, últimos dígitos) | ✖ |
| Artículos | ✔ (descripción, cantidad, precio, total) | ✔ (`line_item`: descripción, importe, cantidad desde v1.3.2) | ✔ (descripción, cantidad, precio unitario, total) | ✔ (`ITEM`, `QUANTITY`, `PRICE`, `EXPENSE_ROW`) | ✔ (con SKU, categoría, etc.) | ✖ |
| Confianza por campo | ? (no verificado en lo leído) | ? (no verificado en lo leído) | ✔ (por campo, según su web) | ✔ (por campo en `Type` y `ValueDetection`) | ? (`ocr_score` global; por campo no descrito) | Por palabra, no verificado |
| Español | ? (remite a página de idiomas, no leída) | ✔ (`es` documentado) | ? (afirma «cualquier idioma»; sin lista) | ✔ (español en la lista de idiomas) | ? («cualquier idioma»; sin lista) | ? (100+ idiomas; español no nombrado en lo leído) |
| Inglés | ? | ✔ | ? | ✔ | ? | ✔ presumible, ? |
| Imagen | ✔ JPEG/PNG/BMP/TIFF/HEIF | ? (remite a otra página) | ✔ JPEG/PNG/WebP/TIFF/HEIC | ✔ JPEG/PNG | ✔ amplia (incl. HEIC) | ✔ |
| PDF | ✔ | ? | ✔ | ✔ (síncrono: 1 página) | ✔ | ✖ (requiere conversión) |
| Multipágina | ✔ hasta 2.000 págs. (gratis: 2) | ✔ hasta 10 págs. (online) | ✔ hasta 200 págs. (su web) / 10 págs. por documento (plan de prueba) | ✔ solo asíncrono: hasta 3.000 págs. | ✔ (15 págs. por defecto) | ✖ |
| Tamaño máximo | 500 MB (S0) / 4 MB (F0) | ? | 100 MB por archivo | 10 MB síncrono; 500 MB asíncrono | ? | n/a |
| Síncrono / asíncrono | ✔ ambos (operación con sondeo) | ✔ online y por lotes | ✔ síncrono (mediana 0,9 s) | ✔ ambos | ✔ ambos, con webhooks | n/a |
| Latencia | ? | ? | 0,9 s mediana (cifra del proveedor) | ? | «segundos», sin cifra | n/a |
| Precio (ver nota) | ? USD no leído; ver 3 | 0,10 $ por documento ≤10 págs. (unidad en conflicto entre fuentes) | Conflicto: ~0,10 $/página (marketing) o planes en créditos | 0,01 $/pág. (hasta 1 M/mes); 0,008 $ después | 0,08 $/ticket (plan Starter) | 0 $ licencia |
| Nivel gratuito | 500 págs./mes (F0, 4 MB, 2 págs.) | ? | Prueba 14 días, 200 págs. | 100 págs./mes durante 3 meses | 100 docs/mes «gratis siempre» | n/a |
| Mínimos | Compromisos opcionales (importes no leídos) | ? | Plan Starter 44 €/mes con mínimo de créditos | Ninguno | **500 $/mes de mínimo** (Starter) | n/a |
| Regiones | Procesa en la región del recurso (UE disponible: ver 5) | UE, EE. UU. y otras | UE o EE. UU. | UE incluyendo España, Irlanda, Frankfurt, París | ? (no detallado) | Local |
| Retención | 24 h, borrable antes con API | ? | «Zero retention» como opción; datos 30 días tras cancelar | Contenido puede conservarse; ver 5 | ? | Local |
| Uso para entrenamiento | ? (no leído en esta consulta) | ? (no leído) | No usado para entrenar modelos globales (según su web) | Puede usarse salvo opt-out | ? | n/a |
| Cifrado | Tránsito HTTPS/TLS; temporal cifrado en reposo | ? | ? | En reposo y en tránsito | ? | n/a |
| DPA / subprocesadores | ? | ? | ? | ? (AWS dispone de DPA estándar; no verificado aquí) | ? | n/a |
| Certificaciones citadas | ? | ? | SOC 2 Tipo II, RGPD | ? | SOC 2 Tipo II, RGPD | n/a |
| Soporte | Plan Azure | Plan Google Cloud | Comunitario/chat según plan | Plan AWS | Email (gratis) | Comunidad |
| Facilidad de sustitución (valoración propia, no de fuentes) | Media | Media | Alta | Media | Alta | Alta pero con mucho trabajo propio |

Fuentes (todas consultadas el 2026-10-27):
- Azure: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt?view=doc-intel-4.0.0 · https://azure.microsoft.com/en-us/pricing/details/ai-document-intelligence/ · https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/document-intelligence/data-privacy-security
- Google: https://docs.cloud.google.com/document-ai/docs/processors-list · https://cloud.google.com/document-ai/pricing
- AWS: https://aws.amazon.com/textract/pricing/ · https://docs.aws.amazon.com/textract/latest/dg/limits-document.html · https://docs.aws.amazon.com/textract/latest/dg/expensedocuments.html · https://docs.aws.amazon.com/general/latest/gr/textract.html · https://aws.amazon.com/textract/faqs/
- Mindee: https://www.mindee.com/product/receipt-ocr-api · https://docs.mindee.com/account-management/plans.md · https://www.mindee.com/pricing
- Veryfi: https://www.veryfi.com/pricing/ · https://www.veryfi.com/receipt-ocr-api/
- Tesseract: https://tesseract-ocr.github.io/tessdoc/

## 3. Costes y escenarios

### 3.1 Precios usados y su fiabilidad

| Proveedor | Cifra usada | Fiabilidad |
|---|---|---|
| AWS Textract AnalyzeExpense | 0,01 $/página hasta 1 M págs.; 0,008 $ después. Ejemplos en región Oregón; otras regiones no listadas | Cifra literal de la página oficial; la región UE puede diferir (NO DEMOSTRADO) |
| Google Expense Parser | 0,10 $ por documento de 1 a 10 págs. Un ticket de 1 página cuesta lo mismo con cualquiera de las dos lecturas en conflicto (0,10 $ por 10 págs. o 0,10 $ por unidad) | Dos fuentes dan unidades distintas; para un ticket de 1 página el resultado coincide, pero no se pudo leer la página oficial directamente (solo resúmenes) |
| Veryfi Starter | 0,08 $/ticket con 500 $/mes de mínimo («<5k docs»). Aproximación: máximo entre 500 $ y 0,08 $ × tickets | Cifras de la página oficial; la página presenta una contradicción en cheques; plan Growth a medida |
| Mindee | 0,10 $/pág. solo como referencia | Cifra de marketing sin fecha. La página de planes habla de créditos (44 €/mes Starter) sin precio por crédito ni coste de créditos del modelo de tickets. **No es precio cerrado** |
| Azure | **NO DEMOSTRADO** | La página oficial en USD mostraba «$-» en todas las celdas; solo se halló un precio en CNY de Azure China (101,76 ¥/1.000 págs.), no aplicable |
| Tesseract | 0 $ de licencia | Coste real = ingeniería y mantenimiento |

Conversión de moneda: **aproximada**, supuesto 1 $ = 0,90 € (no verificado). Los precios cambian con el tipo de cambio y el IVA.

### 3.2 Coste OCR mensual (USD; € ≈ USD × 0,90)

Un ticket = 1 página. Se asume que todos los tickets se procesan una vez (sin reintentos). La cuota máxima por usuario es 5 tickets/día, es decir hasta ~150/mes.

**AWS Textract AnalyzeExpense (0,01 $/ticket)**

| Usuarios \ tickets/mes por usuario | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 0,50 | 1,00 | 2,00 | 5,00 | 15,00 |
| 100 | 5,00 | 10,00 | 20,00 | 50,00 | 150,00 |
| 500 | 25,00 | 50,00 | 100,00 | 250,00 | 750,00 |
| 1.000 | 50,00 | 100,00 | 200,00 | 500,00 | 1.500,00 |

**Google Document AI Expense Parser (0,10 $/ticket)**

| Usuarios \ tickets/mes por usuario | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 5,00 | 10,00 | 20,00 | 50,00 | 150,00 |
| 100 | 50,00 | 100,00 | 200,00 | 500,00 | 1.500,00 |
| 500 | 250,00 | 500,00 | 1.000,00 | 2.500,00 | 7.500,00 |
| 1.000 | 500,00 | 1.000,00 | 2.000,00 | 5.000,00 | 15.000,00 |

**Veryfi Starter (máx(500 $, 0,08 $ × tickets))**

| Usuarios \ tickets/mes por usuario | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 500 | 500 | 500 | 500 | 500 |
| 100 | 500 | 500 | 500 | 500 | 1.200 |
| 500 | 500 | 500 | 800 | 2.000 | 6.000 |
| 1.000 | 500 | 800 | 1.600 | 4.000 | 12.000 |

**Mindee (referencia 0,10 $/pág., NO cerrado)**: mismos valores que Google.

**Azure**: NO DEMOSTRADO (sin precio USD leído).

### 3.3 Otros costes (no estimados)

No se estiman en euros porque dependen de decisiones aún abiertas y no se ha medido nada:

- **Almacenamiento:** la imagen se borra por defecto tras confirmar, así que el volumen sostenido es pequeño; el coste real depende de cuántos usuarios elijan conservarla y del plazo de caducidad. NO DEMOSTRADO.
- **Funciones backend:** el coste de cómputo de subida, procesamiento y confirmación depende del alojamiento y no se ha medido.
- **Reintentos y pruebas:** cada reintento es una página facturada.
- **Revisión de privacidad / DPA:** coste legal, no cuantificado.
- **Ingreso de referencia:** a 3,99 €/mes por usuario Premium, 150 tickets/mes a 0,10 $/ticket (Google) supondría ~13,50 € de OCR por usuario y mes, más que el ingreso. A 20 tickets/mes serían ~1,80 € por usuario y mes. La cuota de 5 tickets/día debe revisarse contra este margen antes de lanzar.

## 4. Resultados del benchmark

**NO EJECUTADO.** No hay credenciales de ningún proveedor y esta fase no autoriza abrir cuentas ni generar claves. Los 15 casos sintéticos están definidos en `provider-synthetic-test-cases.md`. No se ha intentado sortear la limitación. Por tanto, **no hay ningún dato de precisión, latencia medida ni coste real**. Todas las cifras de la sección 2 son lo que documenta el proveedor, no lo que se ha medido.

## 5. Privacidad y datos

| Proveedor | Procesamiento y región | Retención y borrado | Entrenamiento | Observaciones |
|---|---|---|---|---|
| Azure | Procesa en la región del recurso | Entrada y resultados 24 h, luego se borran; API «Delete Analyze Result» para borrar antes | NO DEMOSTRADO en esta consulta | Almacenamiento temporal compartido por región, aislado lógicamente; TLS 1.3 requerido en cliente |
| Google | Región UE disponible | NO DEMOSTRADO (la página de gobernanza de datos no se pudo leer) | NO DEMOSTRADO | Hay que leer la página de gobernanza de datos |
| Mindee | UE o EE. UU. | Datos 30 días tras cancelar; opciones de retención cero (según su web) | «No se usa para entrenar modelos globales» (su web) | Retención por defecto no publicada |
| AWS | Región UE disponible, incluida España (`eu-south-2`) | Borrado de entradas bajo petición a Soporte | **Puede usar el contenido para mejorar sus servicios, salvo política de exclusión de Organizations**; sin exclusión, parte del contenido puede almacenarse en otra región | La exclusión es obligatoria para este caso |
| Veryfi | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | Sede en EE. UU.; SOC 2 Tipo II declarado |
| Tesseract | Local en nuestra infraestructura | Lo controlamos nosotros | No aplica | Sin tercero |

DPA y subprocesadores: **NO DEMOSTRADO para todos** en esta consulta. Hay que obtener y revisar el DPA y la lista de subprocesadores de cada finalista antes de enviar un solo ticket real. Los tickets son datos financieros personales (comercios, importes, tarjeta parcial, ubicación implícita), y la política de privacidad actual podría no cubrirlo (ver Fase 0, `product-requirements.md`).

## 6. Candidatos finalistas

1. **Google Document AI Expense Parser (UE)**: documenta español, `payment_type`, artículos, región UE y límite de 10 págs. online. Contra: soporte de PDF e imágenes NO DEMOSTRADO, confianza por campo NO DEMOSTRADA, retención y entrenamiento NO DEMOSTRADOS, y precio unas 10 veces el de AWS por ticket según las cifras de la sección 3.1 (sin verificar en la región UE).
2. **AWS Textract AnalyzeExpense (región UE)**: precio por página más bajo entre los que tienen precio demostrado (sin verificar en la región UE), confianza por campo documentada, región en España; documenta PDF e imágenes (JPEG/PNG). Contra: uso de contenido para mejora salvo exclusión, método de pago no documentado, PDF síncrono limitado a 1 página (multipágina requiere asíncrono y almacenamiento en S3).
3. **Azure Document Intelligence Receipt** queda como reserva: retención de 24 h con borrado explícito, aprovechable, pero faltan precio en USD, lista de idiomas y campo de método de pago.

Descartados por ahora: **Veryfi** (mínimo de 500 $/mes y privacidad/regiones no demostradas), **Mindee** (precio e información de retención poco claros, método de pago no demostrado; podría reconsiderarse), **Tesseract** (solo texto; no extrae campos).

### Por qué la opción gratuita no sirve en producción

Tesseract es de licencia Apache 2.0 y gratuito, pero solo devuelve texto: no sabe qué es el total, el IVA o un artículo. Habría que escribir y mantener un analizador propio, que fallaría con los formatos de ticket y con fotos de mala calidad. Sirve para un prototipo local sin enviar datos a terceros, no como solución final.

## 7. Recomendación para piloto

**Selección provisional: Google Document AI Expense Parser, región UE**, para un piloto controlado **con documentos sintéticos solamente**. Motivos, solo los marcados como documentados en la sección 2: español, método de pago, artículos y región UE. **Condición previa: demostrar el soporte de PDF e imágenes de Google (NO DEMOSTRADO hoy).** Si no se demuestra, la selección pasa a AWS. Se asume su mayor coste porque el piloto es pequeño.

Esta recomendación es débil: está basada en documentación, no en mediciones, y la retención y el DPA de Google están sin verificar.

## 8. Proveedor alternativo

**AWS Textract AnalyzeExpense** en `eu-south-2` (España) o `eu-west-1`, con política de exclusión de uso de contenido activada. Menor precio por página que Google según la sección 3.1 (unas 10 veces, sin verificar en la región UE). Debe incluirse en el mismo benchmark. Para facilitar el cambio, el diseño futuro debe aislar al proveedor tras una interfaz propia (entrada: archivo; salida: JSON normalizado con confianza por campo).

## 9. Condiciones antes de tickets reales

1. Demostrar por escrito los formatos (PDF e imágenes) admitidos por Google Expense Parser.
2. Ejecutar el benchmark sintético con los dos finalistas y cumplir los criterios de `provider-synthetic-test-cases.md`.
3. Obtener y revisar el DPA y los subprocesadores del proveedor elegido.
4. Confirmar región UE efectiva, retención por defecto, borrado y no uso para entrenamiento, por escrito.
5. Revisión legal y actualización de la política de privacidad y del consentimiento.
6. Verificar el precio real por ticket en la consola/cotización en euros, en la región elegida.
7. Revisar la cuota de 5 tickets/día frente al margen (sección 3.3).
8. Diseño de almacenamiento privado y cifrado, borrado y caducidad (Fase 0).
9. Decidir la equivalencia Premium/Plus y el precio (pendiente de Fase 0).
10. Autorización explícita del propietario del producto para la primera prueba con datos reales, con un grupo cerrado y consentimiento.

## 10. Decisión

**NO DEMOSTRADO.**

Hay una selección provisional (Google, con AWS como alternativa) para empezar una evaluación sintética, pero **no hay evidencia medida** de precisión, latencia ni coste real, y faltan DPA y retención. No es «NO APTO»: ningún proveedor ha sido descartado por incumplir una condición. No es «APTO PARA PILOTO» con tickets reales.

## 11. Bloqueos

| Bloqueo | Efecto |
|---|---|
| Sin credenciales ni autorización para abrir cuentas | Impide ejecutar el benchmark |
| Precio de Azure no leído; unidades de Google en conflicto; Mindee sin precio cerrado | Costes no cerrados |
| DPA y subprocesadores sin revisar | Impiden enviar datos reales |
| Retención y entrenamiento de Google sin verificar | Bloquea la elección definitiva |
| Soporte de PDF e imágenes de Google NO DEMOSTRADO | Requisito del producto; condiciona la selección provisional |
| Método de pago no documentado en AWS, Azure y Mindee | Puede incumplir un requisito |
| Política de privacidad vs. envío a tercero (Fase 0) | Requiere revisión legal |
| Margen: OCR podría superar el ingreso con uso alto | Puede obligar a rebajar la cuota |
| Premium frente a Plus y precio (Fase 0) | Sin cerrar |

## 12. Verificación oficial adicional del candidato Azure (2026-10-27)

La documentación oficial consultada después del benchmark permite precisar varios puntos, sin convertirlos en aprobación de producción:

- Document Intelligence Receipt v4 admite PDF e imágenes JPEG/JPG, PNG, BMP, TIFF y HEIF; el nivel gratuito F0 limita el archivo a 4 MB y procesa como máximo las dos primeras páginas de un PDF/TIFF.
- La documentación de idiomas confirma español (`es`) para el motor de lectura que sustenta los modelos de documentos; el modelo Receipt extrae comercio, fecha, impuestos y total, pero el método de pago sigue sin estar demostrado como campo fiable para este producto.
- Azure indica que almacena temporalmente entrada y resultados en la misma región y que los elimina automáticamente 24 horas después; también documenta una operación para solicitar el borrado anticipado.
- Esto hace que Azure sea técnicamente apto para un piloto sintético de coste cero dentro de F0, sujeto a límites y a la configuración real de la cuenta. No demuestra DPA revisado, subprocesadores, benchmark de precisión, ausencia de cargos accidentales ni autorización para datos reales.

Fuentes oficiales verificadas:

- https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt?view=doc-intel-4.0.0
- https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/service-limits?view=doc-intel-4.0.0
- https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/language-support/ocr?view=doc-intel-4.0.0
- https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/document-intelligence/data-privacy-security

Consecuencia técnica para esta rama: el adaptador Azure existe pero está desactivado por defecto y exige dos activaciones explícitas; la API local no permite PDF mientras el bucket privado real no lo admita, y el proveedor rechaza cargas superiores a 4 MB en el nivel gratuito.

## Modificaciones a documentos de Fase 0

Ninguna.
