# Escáner de tickets — Alcance del MVP (Fase 0)

Estado: **borrador**. El MVP se limita al alcance acordado; nada aquí amplía ese alcance.

## 1. MVP obligatorio

- Acceso exclusivo Premium, comprobado en servidor; usuarios gratuitos ven la función bloqueada sin selector de archivos.
- Entrada por foto de cámara, imagen y PDF desde la web/PWA móvil.
- Almacenamiento privado y cifrado; ninguna URL pública.
- Extracción de comercio, fecha, total, IVA, método de pago y artículos.
- Separación de artículos y clasificación con las categorías existentes.
- Pantalla de revisión con edición completa y reparto de artículos entre categorías.
- Confirmación manual obligatoria; creación de uno o varios gastos vinculados al ticket.
- Detección de posibles duplicados con aviso.
- Cuota de 5 tickets diarios aplicada en servidor.
- Borrado de la imagen tras confirmar por defecto; opción de conservarla.
- Estados definidos en `state-machine.md`, incluida caducidad y borrado.
- España, euros, español e inglés.
- Cero datos financieros en Analytics, con test que lo demuestre.

## 2. Mejoras posteriores (no son MVP)

- Otras monedas y otros países.
- Aprendizaje a partir de las correcciones del usuario (hoy el aprendizaje colectivo global está desactivado: `src/lib/agents/tools/utils/collective-learning-consent.ts`).
- Subida de varios tickets a la vez.
- Búsqueda por artículo.
- Aplicación nativa.
- Funcionamiento sin conexión.
- Exportación de tickets conservados.
- Segundo precio / planes anuales específicos del escáner.

## 3. Fuera de alcance

- App nativa en App Store o Google Play.
- Creación automática de gastos sin revisión.
- Servir imágenes públicamente.
- Envío de datos financieros a Analytics.
- Elegir proveedor OCR en esta fase.
- Cualquier cambio de código, tablas, migraciones o dependencias en la Fase 0.

## 4. Riesgos del MVP

| Riesgo | Detalle | Mitigación propuesta |
|---|---|---|
| Modelo de datos insuficiente | `expenses` no tiene comercio, IVA, método de pago, artículos ni vínculo a ticket (`src/lib/schemas/expense.ts`). Hace falta decidir dónde se guardan | Decisión de diseño en Fase 1; no tocar `expenses` sin migración revisada |
| Un ticket = varios gastos | `fn_create_expense` crea uno por llamada y cuenta contra el límite gratuito de 30/mes. Premium no tiene tope de gastos en el código revisado, pero la atomicidad de «crear N gastos» **no existe** | Definir creación atómica en servidor |
| Privacidad | Enviar fotos de tickets a un tercero es un tratamiento nuevo; la política de privacidad puede no cubrirlo (NO DEMOSTRADO) | Revisión legal antes de lanzar |
| Almacenamiento de archivos de usuario | No existe infraestructura; solo un bucket privado para el pack | Diseñar bucket privado con políticas por usuario |
| Cifrado en reposo | NO DEMOSTRADO desde el repo | Verificar configuración real |
| Rate limiting | No se encontró en el repo | Cuota diaria en servidor más límite técnico |
| Límite de tamaño de subida | Límite de plataforma no demostrado; una foto de móvil puede superarlo | Compresión en cliente y subida directa a almacenamiento |
| Cámara en PWA | NO DEMOSTRADO en iOS/Android | Prueba en dispositivos reales; alternativa de subida de archivo |
| Precisión de lectura | Tickets arrugados, térmicos o largos | Revisión obligatoria; estado `needs_review` |
| Caducidad y borrado | Requiere tarea programada; no demostrada en el repo | Decidir mecanismo antes de implementar |
| Analytics | `EventProperties` admite cualquier valor; solo la calculadora de ahorro tiene lista blanca (`src/lib/analytics.ts`) | Lista blanca específica del escáner y test |
| Coste de procesamiento | Depende del proveedor, no elegido | Medir con cuota diaria baja |
| Precio | 3,99 € de lanzamiento y 5,99 € posterior no están modelados en código (hoy 3,99 € mensual y 39,90 € anual en `src/lib/plus/pricing.ts`) | Decisión comercial previa |

## 5. Criterios para pasar a la siguiente fase

Se pasa a la Fase 1 (diseño técnico) cuando:

1. El usuario ha revisado y aprobado estos cuatro documentos.
2. Está cerrada la equivalencia «Premium» = «Plus» (o se define un nivel nuevo).
3. Están decididos los plazos de caducidad y borrado y qué consume cuota.
4. Está decidido el criterio de duplicados.
5. Hay respuesta a los puntos NO DEMOSTRADOS que bloquean diseño: esquema real de `expenses`, cifrado en reposo, límite de subida.
6. La revisión de privacidad indica si hace falta actualizar la política antes de usar un tercero.
7. El lanzamiento del precio (primeros 100 usuarios) tiene una decisión de implementación.

La elección de proveedor OCR **no** es requisito para cerrar la Fase 0; sí lo es para cerrar el diseño técnico.
