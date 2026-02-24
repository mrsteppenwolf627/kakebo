# Auditoría SEO v6 — metodokakebo.com
**Fecha:** 24 de febrero de 2026  
**Estado general:** 🟡 Progreso real, pero aparecieron nuevos problemas críticos

---

## RESUMEN EJECUTIVO

Has hecho cambios importantes desde la v5: expandiste los dos artículos prioritarios, añadiste un artículo nuevo, implementaste links internos en todos los posts, diferenciaste los CTAs y escalonaste las fechas. Son avances reales.

El problema nuevo: al limpiar el tono hiperbólico de los artículos, has perdido demasiado contenido. 8 de 13 artículos han perdido palabras respecto al audit anterior, algunos de forma drástica. `kakebo-sueldo-minimo` pasó de 2.220 a 1.111 palabras (-1.109). `libro-kakebo-pdf` de 1.463 a 801 (-662). `ahorro-pareja` de 1.883 a 956 (-927). El tono hiperbólico era un problema real, pero la solución correcta era reescribir manteniendo la extensión, no eliminar contenido.

Además persisten dos problemas técnicos importantes: las fechas de publicación en el schema no coinciden con las fechas visibles, y falta hreflang en el `<head>` del sitio.

---

## ESTADO DE MEJORAS ANTERIORES

| Mejora | Estado |
|--------|--------|
| Staging site eliminado | ✅ Confirmado |
| H1 homepage optimizado | ✅ Correcto |
| Schema SoftwareApplication + FAQPage en homepage | ✅ Implementado (3 schemas) |
| Internal links en todos los artículos | ✅ Implementado en todos |
| CTAs H2 únicos por artículo | ✅ Parcial (ver abajo) |
| Fechas escalonadas | ✅ Implementado |
| `metodo-kakebo-guia-definitiva` expandido | ✅ 814 → 1.476w |
| `kakebo-online-gratis` expandido | ✅ 704 → 1.139w |
| Artículo nuevo `kakebo-online-guia-completa` | ✅ 1.399w |
| Sitemap roto eliminado de GSC | ❓ No confirmable desde aquí |
| Emojis eliminados de H2 | ✅ Eliminados |
| Hreflang implementado | ❌ No aparece en `<head>` |

---

## PROBLEMAS CRÍTICOS NUEVOS

### 🔴 1. Pérdida masiva de contenido al limpiar el tono

El mayor problema del audit actual. Al reescribir para eliminar el tono hiperbólico, se eliminó contenido en lugar de reescribirlo:

| Artículo | Palabras antes | Palabras ahora | Diferencia |
|----------|---------------|----------------|------------|
| `kakebo-sueldo-minimo` | 2.220 | 1.111 | **-1.109** ❌ |
| `ahorro-pareja` | 1.883 | 956 | **-927** ❌ |
| `libro-kakebo-pdf` | 1.463 | 801 | **-662** ❌ |
| `regla-30-dias` | 1.163 | 788 | **-375** ❌ |
| `metodo-kakebo-para-autonomos` | 1.104 | 752 | **-352** ❌ |
| `alternativas-a-app-bancarias` | 1.321 | 1.062 | -259 ⚠️ |
| `kakebo-vs-ynab` | 1.046 | 813 | -233 ⚠️ |
| `plantilla-kakebo-excel` | 1.017 | 758 | -259 ⚠️ |

**Impacto:** Google usa la profundidad de contenido como señal de autoridad temática. Los artículos más cortos compiten en desventaja para keywords con volumen real. `kakebo-sueldo-minimo` era tu artículo más largo y ahora está por debajo del umbral mínimo competitivo de ~1.000 palabras.

**Solución:** Cada artículo que perdió contenido necesita secciones nuevas que compensen. El tono limpio es correcto; la extensión se tiene que recuperar.

### 🔴 2. Schema datePublished ≠ fecha visible

Todos los artículos tienen `"datePublished": "2026-02-17"` en el schema JSON-LD, pero las fechas visibles en página son las correctas (escalonadas de noviembre 2025 a febrero 2026). Google lee el schema y la página; si no coinciden, puede ignorar ambos o penalizar.

**Causa probable:** El campo `datePublished` en el schema está hardcodeado a la fecha de deploy inicial, y el escalonado solo afectó a `dateModified` y a la fecha visible renderizada.

**Solución:** El schema JSON-LD de cada artículo debe tener `datePublished` igual a la fecha visible. Si el artículo se publicó escalonadamente, esa es la fecha de publicación real.

Ejemplo correcto para `peligros-apps-ahorro-automatico`:
```json
"datePublished": "2025-11-18",
"dateModified": "2025-11-18"
```

### 🔴 3. CTA H2 final duplicado persiste

Todos los artículos tienen DOS H2 de CTA al final: el personalizado que añadiste, seguido del antiguo `"¿Quieres aplicar el método Kakebo sin esfuerzo?"`. Ejemplo de `kakebo-online-gratis`:

```
H2: "Empieza hoy: tu Kakebo online en 5 minutos"   ← nuevo ✅
H2: "¿Quieres aplicar el método Kakebo sin esfuerzo?"  ← antiguo, no eliminado ❌
```

Esto ocurre en todos los artículos. El H2 antiguo sigue generando contenido idéntico entre artículos y confunde la estructura semántica de la página.

**Solución:** Eliminar el H2 `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` de todos los artículos. El bloque CTA puede quedarse (botón, texto), pero sin ese H2 repetido.

---

## PROBLEMAS TÉCNICOS PERSISTENTES

### 🟠 4. Hreflang ausente en el `<head>`

El sitemap incluye atributos `xhtml:link` con hreflang para cada URL, pero el `<head>` HTML de la homepage (y probablemente de todas las páginas) no contiene etiquetas `<link rel="alternate" hreflang="...">`. Google prefiere la implementación en `<head>` sobre la del sitemap.

Sin hreflang correcto, Google puede indexar las versiones EN como contenido separado compitiendo con las ES, o puede confundirse sobre cuál versión mostrar en cada mercado.

**Implementación correcta en `<head>` para cada página ES:**
```html
<link rel="alternate" hreflang="es" href="https://www.metodokakebo.com/es/blog/[slug]" />
<link rel="alternate" hreflang="en" href="https://www.metodokakebo.com/en/blog/[slug]" />
<link rel="alternate" hreflang="x-default" href="https://www.metodokakebo.com/es/blog/[slug]" />
```

### 🟠 5. Schema duplicado en homepage

La homepage tiene 2 schemas de tipo `SoftwareApplication`. Google puede ignorar uno o ambos cuando detecta tipos duplicados en la misma página. Consolidar en un único schema `SoftwareApplication` completo.

### 🟡 6. `datePublished` en nuevo artículo no coincide con el real

`kakebo-online-guia-completa` muestra `"datePublished": "2026-02-17"` pero la fecha visible es 24 de febrero de 2026. Si el artículo se publicó hoy, el schema debería reflejarlo.

---

## ANÁLISIS DEL BLOG: ESTADO ACTUAL

### Nuevo artículo: `kakebo-online-guia-completa` ✅

**Lo bueno:**
- 1.399 palabras — extensión competitiva
- Schema BlogPosting + SoftwareApplication
- Autor firmado (Aitor Alarcón Muñoz) — E-E-A-T
- H2s bien estructurados sin emojis
- Tiene sección de FAQ con H2 específico
- Título bien optimizado para "Kakebo online guía completa 2026"

**Lo que falta:**
- Internal links a otros artículos del blog (actualmente: 0)
- La sección de "Artículos relacionados" no aparece en este artículo
- `datePublished` en schema incorrecto (2026-02-17 vs 2026-02-24)

### Artículos con internal links: todos ✅ (excepto el nuevo)

Todos los artículos existentes tienen sección "Artículos relacionados" con 3 links internos. Mejora real y significativa para la arquitectura de contenido.

### Artículos en riesgo por pérdida de contenido

Los siguientes artículos están ahora por debajo de umbrales competitivos y necesitan expansión urgente:

| Artículo | Palabras | Umbral competitivo | Estado |
|----------|----------|-------------------|--------|
| `metodo-kakebo-para-autonomos` | 752 | ~1.200 | ❌ Muy corto |
| `plantilla-kakebo-excel` | 758 | ~1.200 | ❌ Muy corto |
| `regla-30-dias` | 788 | ~1.000 | ❌ Corto |
| `libro-kakebo-pdf` | 801 | ~1.200 | ❌ Corto |
| `kakebo-vs-ynab` | 813 | ~1.200 | ❌ Corto |
| `kakebo-sueldo-minimo` | 1.111 | ~1.500 | ⚠️ Era tu mejor artículo |

---

## LO QUE FUNCIONA BIEN AHORA

### ✅ Homepage técnica
- Title tag bien optimizado: `Kakebo AI: App Kakebo Online para Ahorro | Sin Banco, Con IA`
- H1 correcto: "Kakebo Online: App de Control de Gastos con el Método Japonés"
- Meta description presente y relevante
- Schema FAQPage + SoftwareApplication (aunque duplicado)
- Canonical correcto
- Internal links a todas las secciones clave (/blog, /tutorial, herramientas, /sobre-nosotros)

### ✅ Páginas de herramientas — tienen contenido
- `regla-50-30-20`: ~803 palabras totales
- `calculadora-inflacion`: ~1.048 palabras totales  
- `calculadora-ahorro`: ~758 palabras totales

Son páginas funcionales con contenido suficiente. No son prioritarias ahora mismo.

### ✅ Versiones EN correctamente traducidas
Las páginas `/en/blog/` sirven contenido en inglés real (confirmado). No hay duplicación de contenido entre idiomas. Excelente.

### ✅ Fechas escalonadas — visualmente correcto
Las fechas visibles van de noviembre 2025 a febrero 2026, semanalmente. Esto elimina la señal de "publicación masiva" para lectores humanos y crawlers. Solo falta corregir el schema.

### ✅ Tono del blog — mejorado
Los artículos que se reescribieron tienen ahora un tono profesional y legible. La credibilidad ha mejorado, lo que favorece el dwell time y las conversiones. El problema es solo que se perdió extensión.

---

## PLAN DE ACCIÓN PRIORIZADO

### 🔴 ESTA SEMANA — Fixes técnicos primero

**1. Corregir `datePublished` en schema de todos los artículos**
Campo a actualizar en cada artículo: `"datePublished"` debe coincidir con la fecha visible.

```
kakebo-online-guia-completa → 2026-02-24
kakebo-online-gratis → 2026-02-10
metodo-kakebo-guia-definitiva → 2026-02-13
plantilla-kakebo-excel → 2026-01-27
eliminar-gastos-hormiga → 2026-01-20
alternativas-a-app-bancarias → 2026-01-13
kakebo-vs-ynab → 2025-12-30
metodo-kakebo-para-autonomos → 2025-12-23
libro-kakebo-pdf → 2025-12-16
regla-30-dias → 2025-12-09
kakebo-sueldo-minimo → 2025-12-02
ahorro-pareja → 2025-11-25
peligros-apps-ahorro-automatico → 2025-11-18
```

**2. Eliminar el H2 `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` de todos los artículos**
Este H2 duplicado persiste en todos los artículos junto al nuevo CTA. Eliminar solo el H2 (el bloque de CTA con botón puede permanecer).

**3. Añadir internal links al artículo nuevo `kakebo-online-guia-completa`**
```markdown
## Artículos relacionados
- [Qué es el método Kakebo: guía definitiva](/es/blog/metodo-kakebo-guia-definitiva)
- [Kakebo online gratis: empieza sin banco ni Excel](/es/blog/kakebo-online-gratis)
- [Cómo eliminar los gastos hormiga](/es/blog/eliminar-gastos-hormiga)
```

**4. Consolidar schemas duplicados en homepage**
Eliminar uno de los dos `SoftwareApplication`. Mantener el más completo con `aggregateRating` si existe, y el `FAQPage` separado.

**5. Implementar hreflang en `<head>` (Next.js)**
En el layout o en los metadatos de cada página, añadir las etiquetas `<link rel="alternate">` para `es`, `en` y `x-default`.

### 🟠 PRÓXIMAS 2 SEMANAS — Recuperar extensión perdida

Los artículos que perdieron contenido necesitan secciones nuevas. El tono limpio está bien — lo que falta es volumen con calidad. Por orden de prioridad:

**6. `kakebo-sueldo-minimo` — recuperar hasta ~1.800 palabras**
Era tu artículo más largo y el que más potencial de búsqueda tiene (queries de jóvenes y estudiantes con alto volumen). Las 3 reglas actuales están bien escritas pero son demasiado escuetas. Añadir:
- Ejemplos numéricos concretos con el SMI actual (1.134€/mes en 2026)
- Tabla de distribución Kakebo con ese sueldo
- Sección "Kakebo para estudiantes con beca"
- FAQ expandido

**7. `ahorro-pareja` — recuperar hasta ~1.500 palabras**
La estructura de 3 errores + 3 modelos es buena. Añadir:
- Ejemplos de conversación de "Cita Financiera" mes a mes
- Sección sobre cómo gestionar deudas previas en pareja
- Caso práctico con sueldos desiguales (500€ diferencia)

**8. `libro-kakebo-pdf` — recuperar hasta ~1.200 palabras**
Las 3 trampas están bien. Añadir:
- Comparativa del libro físico vs app (tabla)
- Sección sobre los distintos libros Kakebo disponibles en español y sus diferencias
- FAQ con preguntas reales de búsqueda

**9. `metodo-kakebo-para-autonomos` — recuperar hasta ~1.200 palabras**
La estructura de Cisterna + Sueldo Falso es excelente conceptualmente. Añadir:
- Ejemplo numérico detallado de un mes bueno y un mes malo
- Sección sobre cómo gestionar trimestres de IVA con Kakebo
- Tabla con distribución de la Cisterna por porcentajes

**10. `kakebo-vs-ynab` — recuperar hasta ~1.200 palabras**
La comparativa está limpia. Añadir:
- Tabla comparativa completa (precio, curva de aprendizaje, mobile, privacidad, idioma)
- Sección "¿Cuál deberías elegir según tu perfil?" con casos concretos
- Apartado sobre Kakebo vs Wallet vs otras apps españolas

### 🟢 MES 1-2 — Crecimiento de tráfico

**11. Solicitar indexación en GSC para todos los artículos ES**
URL Inspection → Request indexing para los 13 artículos `/es/blog/`. Hacerlo uno a uno.

**12. Nuevo artículo: "Cómo ahorrar dinero cada mes: 15 técnicas probadas"**
Keyword de alto volumen genérico que puede capturar tráfico nuevo no relacionado directamente con Kakebo. Target: "cómo ahorrar dinero" (~8.000/mes en España).

**13. Reddit — Introducción del proyecto**
Post en r/finanzaspersonales y r/Spain presentando el proyecto de forma honesta. Cita el método Kakebo, menciona la app, incluye el link. Los LLMs (ChatGPT, Perplexity) citan Reddit frecuentemente para queries de herramientas financieras.

**14. Corregir `dateModified` cuando se actualice contenido**
Cada vez que un artículo se amplía, actualizar `dateModified` en el schema a la fecha real del cambio. Google usa esto para saber cuándo recrawlear.

---

## PROYECCIÓN DE TRÁFICO

**Estado actual:** 1 página indexada según GSC (aunque el sitemap tiene 40 URLs). El blog existe pero Google aún no lo ha procesado completamente.

**En 2-4 semanas (con indexación solicitada + fixes técnicos):** Primeros artículos indexados. Keywords de largo cola deberían empezar a aparecer. Estimación conservadora: 5-15 visitas/día orgánicas.

**En 6-8 semanas (con contenido recuperado):** Los artículos sobre `kakebo-online-gratis` (actualmente p5.5 para esa keyword) y `metodo-kakebo-guia-definitiva` deberían mejorar posición. Estimación: 20-40 visitas/día.

**En 3 meses (con 2-3 artículos nuevos + backlinks iniciales):** 60-100 visitas/día si se mantiene el ritmo.

El cuello de botella principal ahora mismo no es la calidad técnica (está bien) sino la indexación. Google necesita tiempo para crawlear y evaluar un site nuevo.

---

## PUNTUACIÓN SEO POR ÁREA

| Área | v5 | v6 | Cambio |
|------|----|----|--------|
| Técnica (meta, canonical, schema) | 6/10 | 7/10 | ⬆️ |
| Contenido (extensión, calidad) | 5/10 | 5/10 | = (subió calidad, bajó extensión) |
| Arquitectura interna (links) | 2/10 | 8/10 | ⬆️⬆️ |
| Hreflang / internacionalización | 4/10 | 4/10 | = (sitemap sí, head no) |
| Fechas / frescura | 3/10 | 6/10 | ⬆️ (solo falta schema) |
| Estructura blog (CTAs, H2) | 4/10 | 6/10 | ⬆️ (CTA doble aún presente) |
| **Global** | **4/10** | **6/10** | **⬆️** |
