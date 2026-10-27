# Casos de prueba sintéticos para el benchmark de OCR de tickets

Fecha: 2026-10-27. Documento de diseño: no se ha ejecutado ninguna prueba.

## Reglas de datos

- Solo documentos **generados artificialmente** (plantillas HTML/PDF con comercios y NIF inventados) o ejemplos públicos sin datos personales.
- Prohibido: tickets reales, nombres, direcciones, tarjetas, números de fidelización o importes identificables.
- Cada documento tiene un archivo de verdad terreno (`ground truth`) con proveedor, fecha, total, IVA por tipo, método de pago y artículos, y una categoría esperada por artículo (por ejemplo Supervivencia, Ocio, Cultura, Extra).
- No se llama a ninguna API sin credenciales propias del proyecto y sin cumplir las condiciones de la sección 10 del informe; sin ellas, la columna del proveedor queda `NO DEMOSTRADO`.

## Casos

| ID | Escenario | Contenido sintético | Formato / condición |
|---|---|---|---|
| C01 | Supermercado, ticket corto en español | 5 artículos, IVA 4/10/21 % mezclado, pago con tarjeta | Foto frontal nítida |
| C02 | Supermercado, ticket largo | 40+ artículos, 2 páginas lógicas o tira larga | Imagen alargada / PDF de 2 páginas |
| C03 | Restaurante con propina y servicio | Artículos con cantidad, descuento y propina | Foto con ligera sombra |
| C04 | Gasolinera | Un solo artículo con litros y precio por litro | PDF generado |
| C05 | Ticket en inglés | Mismos campos que C01 con textos en inglés y símbolo € | Imagen subida |
| C06 | Ticket arrugado o inclinado | Rotación de 15–30 grados y brillo | Foto inclinada |
| C07 | Baja luz y desenfoque leve | Ticket corto con ruido | Foto baja calidad |
| C08 | Pago en efectivo con cambio | Total, entregado y cambio distintos | Imagen nítida |
| C09 | Ticket con descuentos y artículos negativos | Líneas de descuento y cupón | PDF generado |
| C10 | Factura simplificada con NIF sintético | Datos de comercio ficticios | PDF |
| C11 | Duplicado del C01 | Mismo ticket en foto distinta | Para probar detección de duplicados |
| C12 | Documento no ticket | Página en blanco o recibo ilegible | Debe rechazarse o devolver confianza baja |

## Tabla de evaluación (a rellenar por proveedor y caso)

| Caso | Proveedor | Comercio OK | Fecha OK | Total OK | IVA OK | Pago OK | Artículos: precisión / recall | Reparto por categorías posible | Confianza media / mínima | Errores observados | Latencia (ms) | Coste (págs. × tarifa) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C01 | Azure | NO DEMOSTRADO | | | | | | | | | | |
| C01 | Google | NO DEMOSTRADO | | | | | | | | | | |
| C01 | Mindee | NO DEMOSTRADO | | | | | | | | | | |
| … | … | | | | | | | | | | | |

## Métricas

- **Campo principal:** exacto o no (total con tolerancia 0,00 €; fecha en formato ISO).
- **Artículos:** emparejamiento por descripción normalizada e importe; precisión = emparejados / extraídos; recall = emparejados / reales.
- **IVA:** tipo y base por tramo correctos.
- **Confianza:** comparar la confianza declarada con el acierto real (¿los errores tienen confianza baja?).
- **Latencia:** mediana y p95 sobre al menos 5 repeticiones por caso.
- **Coste:** páginas facturadas × tarifa del contrato real.

## Umbrales propuestos (a validar con producto)

- Total, fecha y comercio: al menos 95 % de acierto en C01–C05 antes de plantear un piloto.
- Artículos: recall mínimo propuesto del 85 % en tickets cortos.
- El 100 % de los errores de total debe llevar confianza por debajo del umbral que fuerce revisión manual.
- C12 debe rechazarse o marcarse de baja confianza sin crear gasto.
