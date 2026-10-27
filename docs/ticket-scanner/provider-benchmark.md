# Benchmark de proveedores de OCR de tickets — investigación previa

Fecha de consulta de todas las fuentes: **2026-10-27**. Rama `research/ticket-scanner-provider-benchmark`. Documento de investigación: no se ha implementado nada, no se han llamado APIs, no se han usado tickets reales ni credenciales.

Convención: **documentado** = leído en página oficial del proveedor; **declaración** = afirmación del proveedor no verificada; **inferencia** = deducción mía; **NO DEMOSTRADO** = no pude verificarlo. Varias páginas oficiales de Google y Mindee no se pudieron leer completas; lo indico donde afecta.

## 1. Resumen ejecutivo

- **Ningún proveedor está demostrado como apto para tickets reales.** No se midió precisión con ningún documento: el benchmark está diseñado (ver `provider-synthetic-test-cases.md`) pero no ejecutado.
- **Decisión: `NO DEMOSTRADO`.** Faltan precisión sobre tickets españoles, precio verificado de dos candidatos y condiciones contractuales de privacidad.
- **Piloto recomendado (condicional): Azure Document Intelligence (prebuilt-receipt).** Es el único con retención y borrado documentados de forma explícita: 24 h automáticas y API de borrado inmediato. Pendiente: confirmar español en recibos, precio y región UE.
- **Alternativo: Google Document AI Expense Parser, región `eu`.** Español documentado y región UE documentada. Pendiente: aclarar la unidad de precio (0,01 $ o 0,10 $ por página: factor 10), retención tras procesar y entrenamiento por fuente oficial.
- **Tercer candidato: Mindee (UE).** Barato en volumen bajo y con retención configurable 1–24 h, pero precios y créditos de recibo contradictorios y sin garantía de no entrenamiento.
- **AWS Textract queda descartado por ahora:** las FAQ limitan AnalyzeExpense a inglés; además, el contenido se usa por defecto para mejora, salvo opt-out.
- **Veryfi no encaja en un piloto:** mínimo de 500 $/mes; retención y entrenamiento sin documentar.
- **El coste no decide.** Con 1 página por ticket, ni 1.000 usuarios con 150 tickets/mes (150.000 págs.) superan unos 15.000 $/mes en la hipótesis alta de Google; con AWS o la hipótesis baja de Google el máximo es de 1.500 $/mes. La privacidad y la precisión pesan más.

## 2. Contexto de acceso Premium (solo inspección)

El acceso se resuelve en `src/lib/auth/access-state.ts` (estados `founder`, `legacy_full`, `plus_active`, `plus_canceled_pending`, `free_under_limit`, `free_readonly`) y se comprueba en servidor con `src/lib/auth/require-access.ts`. El escáner debería colgar de un permiso del resolvedor central, no de un flag de interfaz. Qué estados exactos cuentan como "Premium" para esta función: **NO DEMOSTRADO** (decisión de producto pendiente).

## 3. Comparativa de proveedores

### Azure Document Intelligence — prebuilt-receipt (API v4.0 GA 2024-11-30)

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | Documentado: nombre del comercio, teléfono, fecha de transacción, impuestos, total; v4.0 añade ReceiptType, TaxDetails (NetAmount, Rate, Description) y CountryRegion. Esquema completo en repositorio de ejemplos de Microsoft (no leído). Método de pago: NO DEMOSTRADO. |
| 2. Artículos | El modelo devuelve líneas (Items); detalle de campos (descripción, cantidad, precio) solo figura en la tabla de la v2.1; para v4.0 NO DEMOSTRADO en lo consultado. |
| 3. Confianza por campo | NO DEMOSTRADO en la página consultada (el servicio suele devolver confianza por campo: inferencia). |
| 4. Español e inglés | Remite a la página language-support (no leída). Español en recibos: NO DEMOSTRADO. |
| 5. Imagen y PDF | PDF y imágenes JPEG/JPG, PNG, BMP, TIFF, HEIF (documentado). Imagen 50x50 a 10.000x10.000 px. |
| 6–7. Tickets largos y límites | S0: 500 MB y 2.000 páginas; F0: 4 MB y solo 2 primeras páginas. Análisis por defecto de todas las páginas (documentado). |
| 8. Latencia y modalidad | Asíncrono (POST analyze + GET resultado; no consultar más de cada 2 s). Latencia medida: NO DEMOSTRADO. |
| 9. Precio | NO DEMOSTRADO: la página de precios devuelve '$-' para prebuilt. Facturación por página. |
| 10. Nivel gratuito | F0: 0–500 páginas gratis/mes, solo primeras 2 páginas por solicitud, 1 TPS (documentado). |
| 11. Cuotas y mínimos | S0: 15 TPS de análisis por defecto, ampliable (documentado). Niveles de compromiso 20.000/100.000/500.000 págs./mes con precio no visible. |
| 13. Regiones | Se procesa en la misma región donde se creó el recurso (documentado). Disponibilidad de región UE concreta: NO DEMOSTRADO (inferencia: existen regiones europeas de Azure). |
| 14. Retención | Entrada y resultados se guardan cifrados temporalmente 24 h y se borran automáticamente; la API 'Delete Analyze Result' los borra antes (documentado). |
| 15. Uso para entrenamiento | NO DEMOSTRADO en la página consultada. |
| 16. Borrado | Borrado explícito por API y automático a 24 h (documentado). |
| 17. Cifrado | TLS en tránsito (la página indica TLS 1.3 requerido por el cliente); cifrado temporal en Azure Storage (documentado). |
| 18. DPA y subprocesadores | Remite al Microsoft Trust Center; DPA y subprocesadores: NO DEMOSTRADO en lo consultado. |
| 19. Facilidad de sustitución | Medio-alto: SDK/REST propios; esquema de campos propio. Aislable con una capa de adaptación a un esquema interno. |
| 20. Riesgos específicos | Ticket completo (comercio, últimos dígitos de tarjeta, posible fidelización) sale a la nube de Microsoft; almacenamiento temporal compartido por región con aislamiento lógico. |

Fuentes (consultadas 2026-10-27):

- https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt — documentado
- https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/service-limits — documentado
- https://azure.microsoft.com/en-us/pricing/details/ai-document-intelligence/ — documentado (precio ausente)
- https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/document-intelligence/data-privacy-security — documentado

### Google Document AI — Expense Parser (EXPENSE_PROCESSOR)

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | Documentado: supplier_name/address/city/phone, receipt_date, purchase_time, total_amount, total_tax_amount, net_amount, tip_amount, currency, payment_type, credit_card_last_four_digits. |
| 2. Artículos | Documentado: line_item con amount, description, product_code; quantity en versiones v1.3.2/v1.4/v1.4.2. |
| 3. Confianza por campo | NO DEMOSTRADO en lo consultado (inferencia: las entidades de Document AI incluyen confianza). |
| 4. Español e inglés | Documentado: alemán, inglés, español, francés, japonés y neerlandés; italiano y portugués en algunas versiones. |
| 5. Imagen y PDF | La página del procesador remite a 'Supported files' (no leída). PDF e imagen: NO DEMOSTRADO formalmente. |
| 6–7. Tickets largos y límites | Expense Parser: 10 páginas online y 10 en lote (la sección v1.4 menciona 15 online: discrepancia interna). Tamaño: 40 MB online, 1 GB lote (documentado). |
| 8. Latencia y modalidad | Online síncrono y lote asíncrono (documentado). Latencia medida: NO DEMOSTRADO. |
| 9. Precio | La página oficial lista Expense parser a 0,10 $ por 'count' (según el resultado de búsqueda; la página no pudo leerse completa). La unidad 'count' no está definida: 0,01 $/pág. o 0,10 $/pág. NO DEMOSTRADO. |
| 10. Nivel gratuito | NO DEMOSTRADO. |
| 11. Cuotas y mínimos | Cuotas por minuto: NO DEMOSTRADO (página aparte). |
| 13. Regiones | Documentado: eu, us, asia-southeast1, australia-southeast1, northamerica-northeast1. |
| 14. Retención | Almacenamiento tras procesar online: NO DEMOSTRADO. Cloud DPA: borrado a más tardar 180 días tras instrucción o fin de contrato (documentado, texto del DPA). |
| 15. Uso para entrenamiento | Solo respuesta de un foro comunitario de Google (no oficial): no se usa para entrenar salvo opt-in. NO DEMOSTRADO oficialmente. |
| 16. Borrado | DPA: máximo 180 días (documentado). Borrado inmediato por API: NO DEMOSTRADO. |
| 17. Cifrado | NO DEMOSTRADO en lo consultado. |
| 18. DPA y subprocesadores | Existe Cloud Data Processing Addendum (documentado); cobertura de Document AI en el Apéndice 4: NO DEMOSTRADO (texto truncado). |
| 19. Facilidad de sustitución | Medio-alto: API propia y esquema propio de entidades. |
| 20. Riesgos específicos | La versión v1.4 fue discontinuada en EE. UU. y UE el 30-04-2025: usar v1.4.2 o superior y vigilar el ciclo de vida de versiones. v1.3.2 en Public Preview. |

Fuentes (consultadas 2026-10-27):

- https://docs.cloud.google.com/document-ai/docs/processors-list — documentado
- https://docs.cloud.google.com/document-ai/limits — documentado
- https://cloud.google.com/document-ai/pricing — no legible completo; precio por fuente secundaria de búsqueda
- https://cloud.google.com/terms/data-processing-addendum — documentado parcialmente

### AWS Textract — AnalyzeExpense

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | Documentado: VENDOR_NAME, INVOICE_RECEIPT_DATE, TOTAL, SUBTOTAL, TAX, GRATUITY, SERVICE_CHARGE, DISCOUNT, VENDOR_VAT_NUMBER, etc. Método de pago: no hay campo estándar listado (NO DEMOSTRADO). |
| 2. Artículos | Documentado: líneas EXPENSE_ROW con ITEM, QUANTITY, PRICE, UNIT_PRICE, PRODUCT_CODE. |
| 3. Confianza por campo | Documentado: Confidence por tipo y por valor. |
| 4. Español e inglés | Conflicto documental: las FAQ indican que Analyze Expense funciona con facturas y recibos 'en inglés'; la lista de límites declara español para detección de texto en general. Para tickets en español: NO DEMOSTRADO y riesgo alto. |
| 5. Imagen y PDF | JPEG, PNG, PDF, TIFF (documentado). |
| 6–7. Tickets largos y límites | Síncrono: 10 MB y 1 página en PDF/TIFF; asíncrono: 500 MB y 3.000 páginas (documentado). |
| 8. Latencia y modalidad | Síncrono (AnalyzeExpense) y asíncrono (StartExpenseAnalysis). Latencia medida: NO DEMOSTRADO. |
| 9. Precio | 0,01 $/pág. primer millón/mes; 0,008 $ después (Oregón; otras regiones NO DEMOSTRADO). |
| 10. Nivel gratuito | 100 páginas/mes durante 3 meses para clientes nuevos de AWS (documentado). |
| 11. Cuotas y mínimos | TPS por defecto: NO DEMOSTRADO. Sin mínimo mensual documentado. |
| 13. Regiones | EE. UU., GovCloud, Canadá, varias UE y Asia-Pacífico (documentado en FAQ). |
| 14. Retención | El contenido puede almacenarse y usarse para mejorar servicios salvo opt-out mediante política de AWS Organizations (documentado). |
| 15. Uso para entrenamiento | Sí por defecto (mejora continua), con opt-out por política de AWS Organizations (documentado). |
| 16. Borrado | Borrado de entradas solicitando a AWS Support (documentado): sin API de borrado inmediato. |
| 17. Cifrado | En reposo y en tránsito (documentado). |
| 18. DPA y subprocesadores | NO DEMOSTRADO en lo consultado (AWS ofrece DPA en general: inferencia). |
| 19. Facilidad de sustitución | Medio: SDK de AWS; esquema propio. |
| 20. Riesgos específicos | Idioma en tickets españoles; uso por defecto del contenido para mejora, que exige configurar opt-out antes de cualquier dato real. |

Fuentes (consultadas 2026-10-27):

- https://aws.amazon.com/textract/pricing/ — documentado
- https://docs.aws.amazon.com/textract/latest/dg/invoices-receipts.html — documentado
- https://docs.aws.amazon.com/textract/latest/dg/limits-document.html — documentado
- https://aws.amazon.com/textract/faqs/ — documentado

### Mindee — Receipt OCR

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | Producto Receipt OCR existe (página de producto no leída en detalle). Campos exactos: NO DEMOSTRADO. |
| 2. Artículos | NO DEMOSTRADO en lo consultado. |
| 3. Confianza por campo | La página de precios indica que una página con puntuación de confianza cuesta 1,5 créditos (documentado): la confianza es un extra de coste. |
| 4. Español e inglés | NO DEMOSTRADO. |
| 5. Imagen y PDF | NO DEMOSTRADO. |
| 6–7. Tickets largos y límites | NO DEMOSTRADO. |
| 8. Latencia y modalidad | NO DEMOSTRADO. |
| 9. Precio | Starter 44/mes (facturación anual) por 6.000 créditos; Pro 116/mes; 1 página = 1 crédito; coste de recibo por modelo requiere login; moneda sin símbolo en la página. Exceso: 'desde 0,05 $' por crédito (FAQ) o tarifa del plan +20% (página): inconsistente. |
| 10. Nivel gratuito | Sin nivel gratuito permanente; prueba de 14 días (documentado). |
| 11. Cuotas y mínimos | Los créditos caducan al final del periodo (documentado). Inconsistencia entre FAQ (500–10.000 créditos) y tramos (6.000–300.000). |
| 13. Regiones | Opción Europa para procesar solo en centros de datos de la UE y opción UE/EE. UU. (documentado en docs de Mindee, vía búsqueda); 'data processing localization' en plan Pro. |
| 14. Retención | Resultados de la API: retención configurable, 12 h por defecto, mínimo 1 h, máximo 24 h (documentado, vía búsqueda). Archivo original: NO DEMOSTRADO. |
| 15. Uso para entrenamiento | NO DEMOSTRADO; hay función de aprendizaje continuo con feedback. |
| 16. Borrado | Borrado automático tras el periodo configurado (documentado para resultados). |
| 17. Cifrado | NO DEMOSTRADO. |
| 18. DPA y subprocesadores | NO DEMOSTRADO: pedir DPA y lista de subprocesadores por escrito. |
| 19. Facilidad de sustitución | Alto: API REST sencilla; modelo de crédito propio. |
| 20. Riesgos específicos | Documentación contradictoria en precios y créditos; sin garantía pública de exclusión de entrenamiento. |

Fuentes (consultadas 2026-10-27):

- https://www.mindee.com/pricing — documentado
- https://docs.mindee.com/models/data-processing-policies — documentado (vía resultado de búsqueda)
- https://mindee.com/product/receipt-ocr-api — no leída en detalle

### Veryfi — Receipt OCR (alternativa relevante: especializada en recibos y con SOC 2 Tipo 2 declarado)

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | NO DEMOSTRADO en lo consultado (producto especializado en recibos). |
| 2. Artículos | NO DEMOSTRADO. |
| 3. Confianza por campo | NO DEMOSTRADO. |
| 4. Español e inglés | NO DEMOSTRADO. |
| 5. Imagen y PDF | NO DEMOSTRADO. |
| 6–7. Tickets largos y límites | Una transacción cubre un documento de hasta 15 páginas; más páginas, cuenta personalizada (documentado). |
| 8. Latencia y modalidad | NO DEMOSTRADO. |
| 9. Precio | Gratis hasta 100 recibos/mes; Starter 0,08 $/recibo con mínimo 500 $/mes (−0,01 $ con 12 meses); Growth no publicado (documentado). |
| 10. Nivel gratuito | 100 recibos/mes sin tarjeta (documentado). |
| 11. Cuotas y mínimos | Mínimo de 500 $/mes en Starter. |
| 13. Regiones | NO DEMOSTRADO. |
| 14. Retención | NO DEMOSTRADO; el plan Growth menciona 'custom retention'. |
| 15. Uso para entrenamiento | NO DEMOSTRADO; la empresa afirma entrenar sobre millones de documentos reales y de forma continua. |
| 16. Borrado | NO DEMOSTRADO. |
| 17. Cifrado | TLS 1.2/1.3 en tránsito y AES en reposo (declaración de Veryfi, vía búsqueda). |
| 18. DPA y subprocesadores | SOC 2 Tipo 2, RGPD, CCPA y HIPAA declarados por el proveedor; informe bajo petición (declaración, no verificada). |
| 19. Facilidad de sustitución | Alto. |
| 20. Riesgos específicos | Mínimo de 500 $/mes desproporcionado para un piloto; retención y entrenamiento sin documentar. |

Fuentes (consultadas 2026-10-27):

- https://www.veryfi.com/pricing/ — documentado
- https://www.veryfi.com/security/enterprise-security-framework/ — declaración del proveedor (vía búsqueda)

### Alternativa de coste cero para prototipo: Tesseract OCR / PaddleOCR (local, código abierto) + reglas

| Criterio | Hallazgo |
|---|---|
| 1. Proveedor, fecha, total, impuestos, método de pago | Inferencia (sin fuente consultada en esta investigación): solo texto OCR; proveedor, fecha, total e IVA exigirían reglas/regex propias. |
| 2. Artículos | Inferencia: separación de artículos propia, frágil con tickets largos. |
| 3. Confianza por campo | Inferencia: confianza por palabra del OCR, no por campo semántico. |
| 4. Español e inglés | Inferencia: Tesseract y PaddleOCR tienen paquetes de español e inglés. |
| 5. Imagen y PDF | Imagen; PDF requiere rasterizar (inferencia). |
| 6–7. Tickets largos y límites | Los que imponga el servidor propio. |
| 8. Latencia y modalidad | Depende del hardware; en serverless de Vercel puede ser inviable por tamaño de paquete (inferencia, no verificada). |
| 9. Precio | 0 $ de licencia; coste de cómputo propio. |
| 10. Nivel gratuito | Sin cuota. |
| 11. Cuotas y mínimos | Sin cuotas externas. |
| 13. Regiones | Las que elija el equipo. |
| 14. Retención | Ninguna externa: los datos no salen de la infraestructura propia (ventaja de privacidad). |
| 15. Uso para entrenamiento | Ninguno externo. |
| 16. Borrado | Control total. |
| 17. Cifrado | Responsabilidad propia. |
| 18. DPA y subprocesadores | No aplica (sin tercero). |
| 19. Facilidad de sustitución | Alto, porque la capa de extracción es propia. |
| 20. Riesgos específicos | Menor precisión; mantenimiento de reglas por comercio; no vale como estimación de calidad de proveedores gestionados. Los datos de la prueba deben ser sintéticos igualmente. |

Fuentes (consultadas 2026-10-27):

- (sin consulta en esta sesión) — inferencia

## 4. Coste estimado mensual (USD)

Supuestos explícitos: 1 página por ticket, sin reintentos ni PDF de varias páginas, todos los usuarios Premium usan el número de tickets indicado. 150 tickets/usuario/mes equivale al límite de 5 diarios. No se incluyen impuestos, almacenamiento, cómputo propio ni conversión a euros. Los precios proceden de las páginas indicadas y cada celda `NO DEMOSTRADO` es un dato que no pude verificar.

#### AWS Textract AnalyzeExpense (EE. UU. Oregón: 0,01 $/pág.)

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 0.50 | 1.00 | 2.00 | 5.00 | 15 |
| 100 | 5.00 | 10 | 20 | 50 | 150 |
| 500 | 25 | 50 | 100 | 250 | 750 |
| 1000 | 50 | 100 | 200 | 500 | 1500 |

#### Google Expense Parser — hipótesis baja (0,10 $ por 10 págs. = 0,01 $/pág.)

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 0.50 | 1.00 | 2.00 | 5.00 | 15 |
| 100 | 5.00 | 10 | 20 | 50 | 150 |
| 500 | 25 | 50 | 100 | 250 | 750 |
| 1000 | 50 | 100 | 200 | 500 | 1500 |

#### Google Expense Parser — hipótesis alta (0,10 $ por pág.)

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 5.00 | 10 | 20 | 50 | 150 |
| 100 | 50 | 100 | 200 | 500 | 1500 |
| 500 | 250 | 500 | 1000 | 2500 | 7500 |
| 1000 | 500 | 1000 | 2000 | 5000 | 15.000 |

#### Azure Document Intelligence Receipt (precio no publicado en la página consultada)

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO |
| 100 | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO |
| 500 | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO |
| 1000 | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO | NO DEMOSTRADO |

#### Mindee Starter 6.000 créditos = 44/mes (facturación anual, 1 crédito/pág.); exceso: cota alta 0,05 $/crédito

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 44 | 44 | 44 | 44 | 44 |
| 100 | 44 | 44 | 44 | 44 | 494 |
| 500 | 44 | 44 | 244 | 994 | 3494 |
| 1000 | 44 | 244 | 744 | 2244 | 7244 |

#### Veryfi Starter: 0,08 $/ticket, mínimo 500 $/mes

| Usuarios Premium \ tickets/usuario/mes | 5 | 10 | 20 | 50 | 150 |
|---|---|---|---|---|---|
| 10 | 500 | 500 | 500 | 500 | 500 |
| 100 | 500 | 500 | 500 | 500 | 1200 |
| 500 | 500 | 500 | 800 | 2000 | 6000 |
| 1000 | 500 | 800 | 1600 | 4000 | 12.000 |

Notas: (a) Azure no se calcula porque su precio no apareció; (b) la fila de Mindee es una estimación con cota alta de exceso y precios de tramos intermedios no publicados; (c) Veryfi tiene mínimo de 500 $/mes aunque haya pocos tickets; (d) AWS da la tarifa de Oregón, no de una región europea.

## 5. Prototipo gratuito frente a producción

| Aspecto | Prototipo gratuito | Producción |
|---|---|---|
| Datos | Solo sintéticos | Tickets de usuarios Premium |
| Azure | F0: 500 págs./mes, 2 págs. por solicitud, 4 MB, 1 TPS | S0 de pago, 15 TPS ampliable |
| AWS | 100 págs./mes durante 3 meses, solo clientes nuevos | 0,01 $/pág. |
| Veryfi | 100 recibos/mes | 0,08 $/recibo, mínimo 500 $/mes |
| Mindee | Prueba de 14 días | Plan con créditos que caducan |
| Open source local | Gratis, sin terceros, precisión menor | Mantenimiento y precisión: poco viable como única vía |

Los niveles gratuitos no deben recibir tickets reales: no se ha verificado que sus condiciones de datos coincidan con las de pago.

## 6. Riesgos de privacidad

1. El ticket contiene comercio, hora, artículos (puede inferirse salud, hábitos y ubicación) y a veces últimos dígitos de tarjeta o número de fidelización: es dato personal y financiero.
2. Se envía a un tercero y, según proveedor, puede almacenarse (Azure 24 h, Mindee 1–24 h, Google y AWS: ver tabla) o usarse para mejora (AWS por defecto).
3. Hay que aplicar minimización: recortar y no enviar el PDF completo si no hace falta, y no registrar la respuesta íntegra en logs.
4. Imagen propia: bucket privado cifrado, URL firmadas de corta vida, borrado tras confirmar por defecto, retención solo bajo petición expresa y registrada. Pendiente de diseño; **NO DEMOSTRADO**.
5. Analytics: ningún evento del escáner debe llevar importes, comercio, artículos ni resultado de extracción; solo los eventos y parámetros ya permitidos para la calculadora son el modelo a seguir.
6. Posible transferencia internacional si la región no es UE: verificar antes de usar.
7. No afirmo cumplimiento legal de ningún proveedor ni de la solución; esto requiere revisión jurídica.

## 7. Candidatos (máximo tres)

1. Azure Document Intelligence — piloto.
2. Google Document AI Expense Parser (`eu`) — alternativo.
3. Mindee (opción Europa, plan Pro) — tercera opción, sujeta a aclarar créditos y entrenamiento.

Descartados por ahora: AWS (idioma y uso por defecto de contenido) y Veryfi (mínimo mensual; sin retención documentada). Open source local queda solo como baseline de comparación.

## 8. Proveedor recomendado para piloto

Azure Document Intelligence, **condicionado** a: confirmar español en la página de idiomas de modelos prebuilt, precio real por 1.000 páginas, región UE disponible y declaración de no uso para entrenamiento. La razón principal no es el coste (desconocido) sino la retención documentada de 24 h con borrado inmediato por API.

## 9. Proveedor alternativo

Google Document AI Expense Parser en región `eu`: soporta español y las entidades que necesita Kakebo (incluidos payment_type y líneas con cantidad). Falta definir la unidad de precio y la política de retención online.

## 10. Condiciones antes de usar tickets reales

1. Ejecutar el benchmark con los 12 casos sintéticos y fijar umbrales de aceptación por campo.
2. Verificar por escrito: región UE, retención, borrado, no entrenamiento y DPA con lista de subprocesadores.
3. Confirmar precio y cuotas en la cuenta real, no en páginas públicas.
4. Revisión jurídica y actualización de la política de privacidad.
5. Diseño de almacenamiento privado cifrado, borrado por defecto y retención opt-in.
6. Confirmar qué estados de acceso cuentan como Premium y el límite de 5 tickets/día aplicado en servidor.
7. Comprobar que ninguna analítica recibe datos del ticket.
8. Prueba de duplicados y de reparto de artículos en varias categorías.

## 11. Decisión

**`NO DEMOSTRADO`.** No hay evidencia de precisión ni de condiciones contractuales suficientes. Con las condiciones de la sección 10 cubiertas para Azure, la decisión podría pasar a `APTO PARA PILOTO` con datos sintéticos primero. Hoy no hay base para `NO APTO` de Azure ni de Google, tampoco para `APTO`.

## 12. Limitaciones de esta investigación

- No se ejecutó ninguna llamada a API ni se midió latencia, precisión o confianza.
- Páginas de precios y privacidad de Google y de Mindee no se leyeron completas; parte de los datos de Mindee, Veryfi y Google proviene de resultados de búsqueda, indicados como tales.
- Los precios pueden variar por región, moneda y contrato; no se ha comprobado ninguno con sesión iniciada.
