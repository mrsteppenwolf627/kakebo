# Escáner de tickets — Casos de prueba sintéticos (Fase 1)

Estado: **definidos, NO EJECUTADOS**. No hay credenciales de ningún proveedor ni autorización para abrir cuentas, así que no se ha enviado ningún documento a ningún servicio. Los casos describen documentos **ficticios**; no hay tickets reales ni datos personales. Los comercios, direcciones, NIF y tarjetas son inventados (los NIF usan formatos obviamente no válidos).

## Reglas para fabricar los documentos

- Generarlos con una plantilla local (HTML/PDF) y, para los casos de foto, aplicar la distorsión por software. No fotografiar tickets reales.
- No usar logotipos ni nombres de comercios reales. Usar comercios ficticios («Supermercado Ejemplo S.L.»).
- Guardar los originales sintéticos y su verdad terreno (`expected`) en un directorio fuera de producción. No subirlos a ningún repositorio con datos reales.
- Ejecutar cada caso con cada finalista **al menos 3 veces** para medir variación de latencia.

## Métricas por caso

Para cada campo: acierto exacto, acierto con normalización (fecha ISO, decimales con coma), ausente o erróneo; confianza devuelta; latencia total; páginas facturadas; coste real registrado por el proveedor.

Resumen global: % de campos de cabecera correctos; % de artículos con descripción e importe correctos; % de tickets en los que `suma(artículos) = total`; tasa de campos erróneos con confianza alta (el error más peligroso); tasa de fallos duros.

## Casos

Todos en euros, España, salvo indicación. «IVA» = 4 %, 10 % o 21 %.

| ID | Tipo | Idioma | Formato | Condición | Qué se mide en especial |
|---|---|---|---|---|---|
| S01 | Supermercado, 12 artículos, IVA 4/10/21 % | es | Imagen nítida | Ninguna | Separación de artículos, desglose de IVA por tipo |
| S02 | Restaurante con propina y total con IVA incluido | es | Imagen nítida | Ninguna | Total vs. base, propina, mesa/cubiertos como ruido |
| S03 | Gasolinera, 1 línea de combustible (litros × €/l) | es | Imagen nítida | Ninguna | Cantidad decimal y precio unitario |
| S04 | Ticket largo (>60 líneas) | es | Imagen alargada | Relación de aspecto extrema | Truncado, orden de líneas |
| S05 | Ticket con IVA desglosado en tabla final | es | Imagen nítida | Ninguna | Lectura de la tabla de IVA frente a líneas |
| S06 | Ticket con varios artículos repetidos y descuentos | es | Imagen nítida | Líneas de descuento negativas | Importes negativos, cantidades |
| S07 | Foto inclinada (~20°) y con perspectiva | es | JPEG | Rotación y trapecio | Robustez geométrica |
| S08 | Foto oscura con bajo contraste | es | JPEG | Brillo bajo, ruido | Confianza frente a error |
| S09 | Texto parcialmente ilegible (banda borrada o borrosa en total) | es | JPEG | Zona ilegible | El sistema no debe inventar; debe marcar baja confianza |
| S10 | Ticket en PDF de una página | es | PDF | Texto vectorial | Soporte PDF, velocidad |
| S11 | PDF de dos páginas (continuación del ticket) | es | PDF | Multipágina | Soporte multipágina y límite de páginas |
| S12 | Ticket en inglés (tienda en aeropuerto) | en | Imagen nítida | Ninguna | Soporte de inglés |
| S13 | Ticket con método de pago tarjeta («VISA ****0000») | es | Imagen nítida | Ninguna | Método de pago |
| S14 | Ticket con pago en efectivo y cambio | es | Imagen nítida | Entregado/cambio | Total frente a entregado |
| S15 | Foto de algo que no es un ticket (documento ficticio en blanco) | es | JPEG | Entrada inválida | Rechazo o baja confianza, sin fabricar datos |

S01–S10 cubren los diez tipos exigidos; S11–S15 amplían cobertura (multipágina, inglés, método de pago, efectivo, entrada inválida).

## Verdad terreno (formato)

Cada caso lleva un `expected` con esta forma (valores ficticios):

```json
{
  "merchant": "Supermercado Ejemplo S.L.",
  "date": "2026-03-14",
  "currency": "EUR",
  "total": 23.47,
  "tax": [{"rate": 0.04, "amount": 0.31}, {"rate": 0.10, "amount": 0.84}, {"rate": 0.21, "amount": 1.12}],
  "payment_method": "card",
  "items": [
    {"description": "Leche entera 1L", "quantity": 2, "total": 1.78}
  ]
}
```

Los valores de cada caso (S01–S15) se fijarán al fabricar los documentos y se guardarán junto a ellos. Aquí no se publican importes concretos para no dar la apariencia de datos reales.

## Criterios de aceptación orientativos para el piloto

Son propuestas, no medidas. Se validarán o se ajustarán con los primeros resultados.

- Cabecera (comercio, fecha, total): ≥ 95 % correctos en S01–S06 y S10.
- Artículos con importe correcto: ≥ 85 %.
- Errores con confianza alta en campos de cabecera: ≤ 2 %.
- S08 y S09: el sistema debe marcar baja confianza o ausencia, no devolver un valor erróneo con confianza alta.
- S15: no debe devolver un total con confianza alta.
- Latencia p95 ≤ 10 s para una imagen; PDF multipágina puede tardar más y no debe bloquear la interfaz.

## Qué no cubren estos casos

- Tickets reales de comercios reales, con su tipografía térmica y su desgaste.
- Idiomas distintos del español y del inglés.
- Facturas completas con NIF del cliente (fuera de alcance).
- Abuso (archivos maliciosos, PDF con contraseña, ficheros enormes). Hay que probarlos en la fase de implementación.

## Limitación de esta fase

Ningún caso se ha ejecutado. Los resultados de `provider-benchmark.md` sección 4 están marcados NO EJECUTADO.
