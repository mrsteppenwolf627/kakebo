# Auditoría SEO v7 — metodokakebo.com
**Fecha:** 24 de febrero de 2026  
**Puntuación global:** 6.5/10 ⬆️ (vs 6/10 en v6)

---

## RESUMEN EJECUTIVO

Hay progreso real en v7: los artículos están recuperando palabras después del recorte masivo de v6, el tono es profesional y limpio en todos, y la estructura de contenido es sólida. Sin embargo hay **un bug técnico crítico nuevo** que puede estar confundiendo a Google: los canonicals de todos los artículos del blog apuntan a `/blog/[slug]` en lugar de `/es/blog/[slug]`. La URL sin `/es/` redirige correctamente al usuario, pero el canonical le dice a Google que la versión "oficial" es una URL diferente a la que sirve el contenido. Esto es un problema de indexación potencialmente serio.

Los otros dos problemas persistentes son el H2 viejo `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` que sigue en todos los artículos duplicando el nuevo CTA, y el `datePublished` en schema que sigue mostrando `2026-02-17` para todos los artículos cuando las fechas visibles son correctas y escalonadas.

---

## ESTADO DE MEJORAS — HISTORIAL COMPLETO

| Mejora | v5 | v6 | v7 |
|--------|----|----|-----|
| Staging eliminado | ✅ | ✅ | ✅ |
| H1 homepage optimizado | ✅ | ✅ | ✅ |
| Schema SoftwareApplication + FAQPage homepage | ✅ | ✅ | ✅ |
| Internal links en todos los artículos | ❌ | ✅ | ✅ |
| Emojis eliminados de H2 | ❌ | ✅ | ✅ |
| Fechas visibles escalonadas | ❌ | ✅ | ✅ |
| Artículo nuevo `kakebo-online-guia-completa` | ❌ | ✅ | ✅ |
| CTAs H2 únicos (nuevos) | ❌ | ✅ | ✅ |
| `metodo-kakebo-guia-definitiva` expandido | ❌ | ✅ (1.476w) | ✅ (1.699w) |
| `kakebo-online-gratis` expandido | ❌ | ✅ (1.139w) | ✅ (1.349w) |
| Todos los artículos recuperando palabras | ❌ | ❌ | ✅ (parcial) |
| **OLD CTA H2 eliminado de artículos** | ❌ | ❌ | ❌ |
| **`datePublished` schema corregido** | ❌ | ❌ | ❌ |
| **Canonical con `/es/` en blog** | ✅ | ✅ | ❌ BUG NUEVO |
| **Hreflang en `<head>`** | ❌ | ❌ | ❌ |
| **Schema SoftwareApplication duplicado en homepage** | ❌ | ❌ | ❌ |
| **Meta description en artículo nuevo** | — | ❌ | ❌ |
| **Internal links en artículo nuevo** | — | ❌ | ❌ |

---

## PROBLEMAS CRÍTICOS

### 🔴 1. Canonical bug — falta `/es/` en todos los artículos del blog

**Este es el problema más urgente del audit.** Todos los artículos tienen el canonical apuntando a la versión sin prefijo de idioma:

```
URL real servida:   https://www.metodokakebo.com/es/blog/kakebo-online-gratis
Canonical actual:   https://www.metodokakebo.com/blog/kakebo-online-gratis  ← ❌ INCORRECTO
Canonical correcto: https://www.metodokakebo.com/es/blog/kakebo-online-gratis ← ✅
```

La URL `/blog/kakebo-online-gratis` redirige (302 o 301) a `/es/blog/kakebo-online-gratis`. Pero el canonical le dice a Google que la versión canónica es la URL sin idioma, que es una URL de redirección, no la URL final. Google puede:
- Ignorar el canonical por ser inconsistente
- Indexar la URL "canónica" (sin `/es/`) y mostrarla en resultados
- Repartir la autoridad entre ambas URLs

El mismo bug afecta a las páginas de herramientas: su canonical es `/herramientas/[tool]` en lugar de `/es/herramientas/[tool]`.

**Fix:** En el componente que genera el canonical en Next.js (probablemente en el layout del blog o en los metadatos de cada página), asegurarse de que la URL incluye el prefijo `/es/`.

### 🔴 2. CTA H2 duplicado en todos los artículos

Todos los artículos tienen **dos** H2 de CTA al final: el nuevo personalizado que se añadió, más el antiguo `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` que nunca se eliminó. Ejemplo de `metodo-kakebo-guia-definitiva`:

```
H2: "Empieza tu primer ciclo Kakebo hoy"           ← nuevo ✅
H2: "¿Quieres aplicar el método Kakebo sin esfuerzo?"  ← antiguo sin eliminar ❌
```

Esto ocurre en 12 de los 13 artículos. Consecuencias:
- Estructura semántica rota (dos CTAs consecutivos confunden el flujo)
- Google ve contenido H2 repetido entre artículos → señal de template genérico
- El H2 antiguo sigue siendo idéntico en todos los artículos

**Fix:** Eliminar el bloque completo que contiene `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` como H2 en todos los artículos.

### 🔴 3. `datePublished` incorrecto en schema de todos los artículos

Todos los artículos tienen `"datePublished": "2026-02-17"` hardcodeado en el JSON-LD, pero las fechas visibles están correctamente escalonadas desde noviembre 2025. El conflicto entre lo que el schema dice y lo que la página muestra puede hacer que Google ignore la señal de fecha o desconfíe de la frescura del contenido.

**Tabla de correcciones necesarias:**

| Artículo | datePublished actual | datePublished correcto |
|----------|---------------------|----------------------|
| `kakebo-online-guia-completa` | 2026-02-17 | 2026-02-24 |
| `kakebo-online-gratis` | 2026-02-17 | 2026-02-10 |
| `metodo-kakebo-guia-definitiva` | 2026-02-17 | 2026-02-13 |
| `plantilla-kakebo-excel` | 2026-02-17 | 2026-01-27 |
| `eliminar-gastos-hormiga` | 2026-02-17 | 2026-01-20 |
| `alternativas-a-app-bancarias` | 2026-02-17 | 2026-01-13 |
| `kakebo-vs-ynab` | 2026-02-17 | 2025-12-30 |
| `metodo-kakebo-para-autonomos` | 2026-02-17 | 2025-12-23 |
| `libro-kakebo-pdf` | 2026-02-17 | 2025-12-16 |
| `regla-30-dias` | 2026-02-17 | 2025-12-09 |
| `kakebo-sueldo-minimo` | 2026-02-17 | 2025-12-02 |
| `ahorro-pareja` | 2026-02-17 | 2025-11-25 |
| `peligros-apps-ahorro-automatico` | 2026-02-17 | 2025-11-18 |

---

## PROBLEMAS IMPORTANTES

### 🟠 4. Artículo nuevo sin meta description ni internal links

`kakebo-online-guia-completa` — publicado el 24 de febrero — tiene dos problemas graves:

**Sin meta description:** El campo `<meta name="description">` está ausente. Google generará una automáticamente, que suele ser peor que una bien escrita. La meta description influye directamente en el CTR desde resultados de búsqueda.

**Sugerencia de meta description:**
```
Aprende a usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores que debes evitar. Guía completa 2026.
```

**Sin sección de artículos relacionados:** Es el único artículo sin internal links a otros posts del blog. Añadir:
```
- /es/blog/metodo-kakebo-guia-definitiva
- /es/blog/kakebo-online-gratis  
- /es/blog/eliminar-gastos-hormiga
```

### 🟠 5. Schema SoftwareApplication duplicado en homepage

La homepage tiene **dos** schemas de tipo `SoftwareApplication` y uno de `FAQPage`. Los dos SoftwareApplication son redundantes — Google suele procesar solo el primero cuando hay duplicados del mismo tipo. Hay que consolidarlos en uno solo con todos los campos relevantes.

### 🟠 6. Hreflang ausente en `<head>` de todas las páginas

El sitemap incluye atributos hreflang, pero el `<head>` HTML de todas las páginas (homepage y artículos) no tiene etiquetas `<link rel="alternate" hreflang>`. Google prefiere la implementación en `<head>` sobre la del sitemap, especialmente para sitios con mucho contenido.

Sin hreflang correcto, Google puede indexar las versiones EN como contenido separado compitiendo con las ES, o mostrar la versión incorrecta según el país del buscador.

---

## ANÁLISIS COMPLETO DEL BLOG

### Inventario de artículos — palabras y estado

| Artículo | v5 | v6 | v7 | Target | Gap | Estado |
|----------|----|----|-----|--------|-----|--------|
| `kakebo-online-guia-completa` | NEW | 1.399 | 1.394 | 1.500 | -106 | ⚠️ Cerca |
| `metodo-kakebo-guia-definitiva` | 814 | 1.476 | **1.699** | 2.000 | -301 | ⚠️ Bueno, falta algo |
| `kakebo-online-gratis` | 704 | 1.139 | **1.349** | 1.500 | -151 | ⚠️ Cerca |
| `plantilla-kakebo-excel` | 1.017 | 758 | **998** | 1.200 | -202 | ⚠️ Recuperando |
| `eliminar-gastos-hormiga` | 1.034 | 994 | **1.171** | 1.200 | -29 | 🟡 Casi |
| `alternativas-a-app-bancarias` | 1.321 | 1.062 | **1.243** | 1.500 | -257 | ⚠️ Recuperando |
| `kakebo-vs-ynab` | 1.046 | 813 | **984** | 1.200 | -216 | ⚠️ Recuperando |
| `metodo-kakebo-para-autonomos` | 1.104 | 752 | **926** | 1.200 | -274 | ⚠️ Recuperando |
| `libro-kakebo-pdf` | 1.463 | 801 | **980** | 1.200 | -220 | ⚠️ Recuperando |
| `regla-30-dias` | 1.163 | 788 | **970** | 1.200 | -230 | ⚠️ Recuperando |
| `kakebo-sueldo-minimo` | 2.220 | 1.111 | **1.290** | 1.800 | -510 | ❌ Falta mucho |
| `ahorro-pareja` | 1.883 | 956 | **1.129** | 1.500 | -371 | ⚠️ Recuperando |
| `peligros-apps-ahorro-automatico` | 1.164 | 785 | **964** | 1.200 | -236 | ⚠️ Recuperando |

**Tendencia positiva:** Todos los artículos han crecido entre v6 y v7. El tono es profesional. La dirección es correcta.

**Artículos prioritarios por extensión:**
1. `kakebo-sueldo-minimo` — 510 palabras por debajo del objetivo. Era el artículo más potente (2.220w en v5). Recuperarlo es la mayor palanca de contenido disponible.
2. `metodo-kakebo-guia-definitiva` — 301 palabras por debajo. Es el artículo más importante para el keyword principal "método kakebo".
3. `ahorro-pareja` — 371 palabras por debajo.

### Estructura H2 de artículos — problemas persistentes

**Artículo `kakebo-sueldo-minimo`:** El H2 `"La salvación Kakebo: Santificar primero tu Hábito. Importar un rábano tu cuota."` tiene un tono que rompe con el resto del artículo. Podría simplificarse a `"La filosofía Kakebo para ingresos bajos: el hábito primero"`.

**Artículo `kakebo-online-guia-completa`:** Solo tiene un H2 de CTA (`"¿Quieres aplicar el método Kakebo sin esfuerzo?"`), sin el nuevo CTA personalizado. Es el único artículo sin CTA nuevo añadido.

### Internal links — red de enlazado

La red de enlaces internos entre artículos está bien construida. Todos los artículos (excepto el nuevo) tienen 3 links a otros posts. El grafo de enlaces cubre bien los temas principales.

Lo que falta:
- `kakebo-online-guia-completa` → 0 links salientes a otros artículos
- Ningún artículo enlaza a `kakebo-online-guia-completa` desde la sección de relacionados (es nuevo, lógico)

### Meta descriptions — estado

| Artículo | Meta description | Chars | Estado |
|----------|-----------------|-------|--------|
| `kakebo-online-guia-completa` | ❌ AUSENTE | — | Urgente |
| `metodo-kakebo-guia-definitiva` | ✅ Presente | 168 | ✅ |
| `kakebo-online-gratis` | ✅ Presente | 162 | ✅ |
| `plantilla-kakebo-excel` | ✅ Presente | 149 | ✅ |
| `eliminar-gastos-hormiga` | ✅ Presente | 134 | ✅ |
| `alternativas-a-app-bancarias` | ✅ Presente | 172 | ✅ |
| `kakebo-vs-ynab` | ✅ Presente | 151 | ✅ |
| `metodo-kakebo-para-autonomos` | ✅ Presente | 148 | ✅ |
| `libro-kakebo-pdf` | ✅ Presente | 160 | ✅ |
| `regla-30-dias` | ✅ Presente | 161 | ✅ |
| `kakebo-sueldo-minimo` | ✅ Presente | 171 | ✅ |
| `ahorro-pareja` | ✅ Presente | 171 | ✅ |
| `peligros-apps-ahorro-automatico` | ✅ Presente | 165 | ✅ |

---

## LO QUE FUNCIONA BIEN

**Homepage técnica:** Title, H1, meta description, canonical, robots, FAQPage schema — todo correcto.

**Tono del blog:** Después de las reescrituras de v6 y v7, todos los artículos tienen un tono profesional y legible. Esto mejora el dwell time y la credibilidad.

**Arquitectura de contenido:** El blog cubre bien el funnel completo. Artículos informationales (guía definitiva, gastos hormiga), comparativos (vs YNAB, vs Fintonic), long-tail (autónomos, pareja, sueldo mínimo) y transaccionales (kakebo online gratis, libro PDF).

**Versiones EN:** Las páginas en inglés sirven contenido real en inglés. No hay duplicación de contenido entre idiomas. El artículo nuevo también tiene versión EN.

**Fechas visibles escalonadas:** La señal visual de publicación progresiva es correcta y creíble.

**Herramientas:** Las tres páginas de calculadoras tienen schema rico (HowTo, FAQPage, AggregateRating) y contenido suficiente.

---

## PLAN DE ACCIÓN PRIORIZADO

### 🔴 URGENTE — Esta semana (para Claude Code)

**1. Fix canonical en todo el blog**

En el componente Next.js que genera el canonical para las páginas de blog (probablemente `app/[lang]/blog/[slug]/page.tsx` o similar), el canonical debe incluir `/${lang}/` en el path. El fix es probablemente una línea:

```typescript
// Incorrecto (actual):
canonical: `https://www.metodokakebo.com/blog/${slug}`

// Correcto:
canonical: `https://www.metodokakebo.com/${lang}/blog/${slug}`
```

El mismo fix aplica a las herramientas:
```typescript
canonical: `https://www.metodokakebo.com/${lang}/herramientas/${tool}`
```

**2. Eliminar el H2 viejo en todos los artículos**

Buscar y eliminar el bloque de H2 `"¿Quieres aplicar el método Kakebo sin esfuerzo?"` de todos los archivos MDX/MD del blog. El botón de CTA que hay debajo puede permanecer; solo eliminar ese H2.

**3. Corregir `datePublished` en schema de todos los artículos**

En cada archivo MDX, el campo `datePublished` del JSON-LD debe coincidir con la fecha visible. Los valores correctos están en la tabla de la sección de problemas críticos.

**4. Meta description para `kakebo-online-guia-completa`**

Añadir al frontmatter o metadatos:
```
Aprende a usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores más comunes. Guía completa 2026.
```
(148 caracteres — dentro del límite óptimo de 155-160)

**5. Internal links en `kakebo-online-guia-completa`**

Añadir sección "Artículos relacionados" con:
- `/es/blog/metodo-kakebo-guia-definitiva` — Qué es el método Kakebo: guía definitiva
- `/es/blog/kakebo-online-gratis` — Kakebo online gratis: empieza sin banco ni Excel
- `/es/blog/eliminar-gastos-hormiga` — Cómo eliminar los gastos hormiga

### 🟠 PRÓXIMAS 2 SEMANAS

**6. Consolidar schemas duplicados en homepage**

Eliminar uno de los dos `SoftwareApplication`. Mantener el segundo (el más completo, con `applicationCategory`, `operatingSystem`, `offers`) y eliminar el primero. El FAQPage queda independiente.

**7. Implementar hreflang en `<head>`**

En el layout de Next.js, añadir para cada página:
```tsx
<link rel="alternate" hreflang="es" href={`https://www.metodokakebo.com/es${path}`} />
<link rel="alternate" hreflang="en" href={`https://www.metodokakebo.com/en${path}`} />
<link rel="alternate" hreflang="x-default" href={`https://www.metodokakebo.com/es${path}`} />
```

**8. Expandir `kakebo-sueldo-minimo` (+500 palabras)**

Es el artículo con mayor brecha respecto al objetivo. Añadir:
- Tabla de distribución Kakebo con el SMI 2026 (1.134€/mes netos)
- Ejemplo numérico: mes de enero con esa cantidad
- Sección "Kakebo para estudiantes con beca" (diferente perfil, mismo método)
- 2-3 preguntas FAQ adicionales

**9. Expandir `ahorro-pareja` (+370 palabras)**

Añadir:
- Ejemplo numérico de la "Cita Financiera" mensual con los 3 modelos
- Sección sobre cómo manejar deudas previas al empezar a vivir juntos
- Tabla comparativa de los 3 modelos con pros/cons más detallados

**10. Solicitar indexación en GSC**

URL Inspection → Request indexing para los 13 artículos `/es/blog/` uno a uno. Hacerlo después de corregir el canonical (fix #1).

### 🟢 MES 1-2

**11. Nuevo artículo de alto volumen**

"Cómo ahorrar dinero cada mes: guía práctica para España 2026" — apunta a "cómo ahorrar dinero" (~8.000 búsquedas/mes). No menciona Kakebo en el título pero el artículo lo introduce como solución.

**12. Primer backlink externo**

Participar en r/finanzaspersonales con una introducción honesta del proyecto. Los LLMs citan Reddit frecuentemente para queries de herramientas financieras en español.

---

## PUNTUACIÓN SEO POR ÁREA

| Área | v5 | v6 | v7 | Notas |
|------|----|----|-----|-------|
| Técnica (meta, schema, robots) | 6 | 7 | 6.5 | Canonical bug nuevo baja la nota |
| Contenido (extensión, calidad) | 5 | 5 | 6.5 | Tono mejorado, extensión subiendo |
| Arquitectura interna (links) | 2 | 8 | 7.5 | Falta artículo nuevo |
| Internacionalización (hreflang) | 4 | 4 | 4 | Sin cambios |
| Frescura / fechas | 3 | 6 | 6 | Visibles bien, schema mal |
| Estructura H2 / CTAs | 4 | 6 | 6 | CTA doble persiste |
| **Global** | **4** | **6** | **6.5** | Tendencia positiva |
