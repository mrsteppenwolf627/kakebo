# CONTENT_03_REGLA_503020_EJEMPLO — Artículo "Regla 50/30/20: ejemplo real con tu sueldo"

**Fecha:** 2026-07-09 (+ actualización `CONTENT-03-IMAGE-IMPL-01`)
**Tarea:** CONTENT-03
**Sprint:** Sprint Contenido V1
**Tipo:** Contenido nuevo — guía evergreen práctica de apoyo a herramienta existente
**Documento base:** `docs/seo/KEYWORD_RESEARCH_REGLA_503020_01.md`
**Commit de referencia (HEAD antes de CONTENT-03):** `6ed405a`
**Commit de referencia (HEAD antes de CONTENT-03-IMAGE-IMPL-01):** `7d97645`

---

## 0. Actualización `CONTENT-03-IMAGE-IMPL-01` — Imagen destacada integrada

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes |
| `npx tsc --noEmit` | ✅ 0 errores |
| `GET /blog/regla-50-30-20-ejemplo` | ✅ HTTP 200 |
| `GET /images/blog/regla-50-30-20-ejemplo.png` | ✅ HTTP 200 (sin 404) |
| `BlogPosting.image` | ✅ `["/images/blog/regla-50-30-20-ejemplo.png"]` (ya no el fallback) |
| `og:image` | ✅ `.../images/blog/regla-50-30-20-ejemplo.png` |
| `FAQPage` / `BreadcrumbList` | ✅ Presentes, sin cambios |
| `title` / H1 / `canonical` | ✅ Sin cambios |
| Contenido editorial | ✅ Sin cambios — diff del `.mdx` es 1 línea añadida (`image:`) |

**Imagen origen:** `docs/seo/regla502030/regla503020.png` (PNG real verificado con `file`, 1536×1024, 8-bit RGB, ~1,97 MB).

**Imagen pública creada:** `public/images/blog/regla-50-30-20-ejemplo.png` — copia exacta del origen, mismo patrón ya usado en `CONTENT-02-IMAGE-IMPL-01` (`fondo-de-emergencia`). El archivo original en `docs/seo/regla502030/` no se movió ni se eliminó.

**Frontmatter actualizado:** se añadió `image: '/images/blog/regla-50-30-20-ejemplo.png'` a `regla-50-30-20-ejemplo.es.mdx`, en la misma posición (tras `updatedDate`, antes de `related`) y con el mismo formato (comillas simples) que `fondo-de-emergencia.es.mdx` y `cuentas-remuneradas.es.mdx` — patrón verificado antes de modificar.

**Sin cambios de contenido editorial, title, H1, meta description, slug, FAQ ni enlaces internos.** `BlogPosting.image` y `og:image` ya usan la imagen específica del artículo en lugar del fallback `/og-image.jpg`; la miniatura del artículo en `/blog` también la usa automáticamente.

---

## 1. Slug creado

`src/content/blog/regla-50-30-20-ejemplo.es.mdx` → URL: `https://www.metodokakebo.com/blog/regla-50-30-20-ejemplo`

Verificado antes de crear: no existía ningún archivo `regla-50-30-20-ejemplo.*.mdx` en `src/content/blog/`, ni ningún slug duplicado tras la creación (`ls src/content/blog | sort | uniq -d` sin resultados).

## 2. Keyword padre / keyword protegida de la herramienta / keyword objetivo del artículo

- **Keyword padre:** `regla 50/30/20`
- **Keyword protegida de la herramienta (no atacada por el artículo):** `regla 50 30 20 calculadora` → sigue siendo territorio exclusivo de `/herramientas/regla-50-30-20`
- **Keyword objetivo inicial del artículo:** `regla 50 30 20 ejemplo`

Las tres tomadas literalmente de `KEYWORD_RESEARCH_REGLA_503020_01.md`, sin improvisar variantes nuevas.

## 3. Title / H1 / meta usados

| Campo | Valor usado |
|---|---|
| `title` (frontmatter — usado como `<title>` con sufijo " \| Blog Kakebo" y como H1 visible) | `Regla 50/30/20: ejemplo real con tu sueldo` |
| `excerpt` (meta description y OG description) | `Aprende cómo aplicar la regla 50/30/20 con ejemplos reales por sueldo, cuándo funciona, cuándo se queda corta y cómo calcularla con tus propios números.` |

**Incidencia técnica (misma ya documentada en `CONTENT_02_FONDO_EMERGENCIA.md` §3):** el sistema de blog (`src/app/[locale]/(public)/blog/[slug]/page.tsx`) usa un único campo `frontmatter.title` tanto para el `<title>` SEO como para el `<h1>` visible — no existe un campo `h1` independiente en `BlogPost['frontmatter']` (`src/lib/blog.ts`). El brief de la tarea proponía dos strings distintos ("Title SEO recomendado": *"Regla 50/30/20: ejemplo real con tu sueldo"*, 44 caracteres; "H1 recomendado": *"Regla 50/30/20: ejemplo práctico con 1.200 €, 1.800 € y 2.500 €"*, 65 caracteres). Se usó el **Title SEO recomendado** para ambos campos, mismo criterio que en `CONTENT-02`: más corto (evita truncado con el sufijo " | Blog Kakebo" en SERP), y coherente con el patrón título = H1 ya usado en todo el blog. El H1 recomendado alternativo no se descartó por calidad — queda documentado aquí por si en el futuro se añade un campo `h1` independiente al schema de frontmatter.

## 4. Enlaces internos añadidos

Los 6 obligatorios, todos presentes y verificados en el HTML renderizado (`curl` local, servidor de desarrollo):

| Enlace | Nº de apariciones | Contexto |
|---|---|---|
| `/herramientas/regla-50-30-20` | 7 | Introducción, `ToolCTA`, conclusión, y menciones contextuales a lo largo del artículo |
| `/herramientas/calculadora-ahorro` | 5 | Cálculo del bloque de ahorro, conclusión del apartado de la calculadora, contexto de fondo de emergencia |
| `/blog/fondo-de-emergencia` | 2 | Ejemplo con sueldo de 1.800 €, sección de la calculadora de ahorro |
| `/blog/como-hacer-un-presupuesto-personal` | 2 | Introducción (tabla comparativa de métodos), referencia contextual |
| `/blog/como-ahorrar-dinero-cada-mes` | 2 | Sección "Qué hacer si tus gastos fijos superan el 50%" |
| `/blog/metodo-kakebo-guia-definitiva` | 2 | Sección "Cuándo funciona bien", sección "Qué hacer si tus gastos fijos superan el 50%" |

Ninguna de las 6 páginas de destino se ha modificado — solo se han añadido enlaces salientes desde el nuevo artículo.

## 5. FAQ incluidas

Las 6 exactas indicadas en el brief, duplicadas en frontmatter (`faq:`, para el schema `FAQPage`) y en el cuerpo visible (`<FaqSection><FaqItem>`, mismo patrón que el resto de artículos del blog):

1. ¿Cómo funciona la regla 50/30/20?
2. ¿Cuál es un ejemplo de la regla 50/30/20?
3. ¿Qué pasa si gasto más del 50 % en necesidades?
4. ¿Es mejor la regla 50/30/20 o la 70/20/10?
5. ¿Puedo usar la regla 50/30/20 con sueldo bajo?
6. ¿Dónde calculo la regla 50/30/20 con mis propios ingresos?

Verificado en el HTML renderizado: `"@type":"Question"` aparece 6 veces en el JSON-LD `FAQPage`.

## 6. Estructura implementada

Los 10 H2 obligatorios, todos presentes: Qué es la regla 50/30/20 en pocas palabras · Ejemplo de regla 50/30/20 con un sueldo de 1.200 € · Ejemplo de regla 50/30/20 con un sueldo de 1.800 € · Ejemplo de regla 50/30/20 con un sueldo de 2.500 € · Cuándo funciona bien la regla 50/30/20 · Cuándo no funciona la regla 50/30/20 · Regla 50/30/20 vs regla 70/20/10 · Cómo calcular tu caso con la calculadora 50/30/20 · Qué hacer si tus gastos fijos superan el 50 % · Preguntas frecuentes.

**Tres tablas de ejemplo** (una por sueldo: 1.200 €, 1.800 €, 2.500 €) con los tres bloques (necesidades/deseos/ahorro) en euros exactos, más una **tabla comparativa** regla 50/30/20 vs regla 70/20/10.

**Un `ToolCTA`** hacia `/herramientas/regla-50-30-20` en la sección de cálculo personalizado. Un `ArticleCTA` final hacia registro, mismo patrón que el resto del blog. Sin `DownloadCTA` ni `SimpleCTA` — no aplican a este artículo.

## 7. Decisiones editoriales

- **No es un artículo genérico de "qué es la regla 50/30/20".** La sección homónima es deliberadamente breve (1 párrafo) y remite a `como-hacer-un-presupuesto-personal` para el contexto comparativo completo de métodos, evitando repetir esa tabla.
- **No intenta posicionar como calculadora.** El title, H1 y meta description usan lenguaje explicativo ("ejemplo real", "aprende cómo aplicar"), nunca "calculadora" ni "calcula ya". La llamada hacia la herramienta usa literalmente el patrón indicado en el brief: *"Si quieres aplicar la regla con tus propios números, usa la calculadora 50/30/20"* (adaptada como introducción a la sección "Cómo calcular tu caso con la calculadora 50/30/20").
- **Tres ejemplos numéricos completos por sueldo (1.200 €, 1.800 €, 2.500 €)** con tabla propia cada uno — el diferenciador editorial central frente a la SERP, donde ningún competidor detectado en el keyword research desarrolla ejemplos concretos por tramo de sueldo.
- **Honestidad explícita sobre los límites de la regla** — sección dedicada "Cuándo no funciona la regla 50/30/20" sin suavizar el mensaje, y frase explícita: *"No existe una regla de presupuesto que sirva igual de bien para todo el mundo."* Cumple la instrucción del brief de evitar prometer que una regla fija sirve para todos.
- **Conexión con el método Kakebo como alternativa más flexible** — mencionado en "Cuándo funciona bien" (como paso previo al método Kakebo) y en "Qué hacer si tus gastos fijos superan el 50%" (como sistema de mayor control cuando tres bloques amplios no bastan), sin desarrollar el método Kakebo en profundidad (ya cubierto en `metodo-kakebo-guia-definitiva`).
- **Sin comparativa bancaria ni afiliación** — ninguna entidad bancaria mencionada, ningún producto financiero de terceros recomendado.
- **Sin plantilla Excel nueva** — la keyword secundaria "regla 50 30 20 excel" del keyword research no se desarrolló como sección propia en la versión final, para no prometer una descarga que no existe; se mantiene fuera del contenido publicado (ver §9).
- **Sección "Regla 50/30/20 vs regla 70/20/10"** con tabla comparativa neutral, sin declarar una "ganadora" — coherente con el mensaje central del artículo (no hay una regla fija válida para todos).

## 8. Cómo se evitó la canibalización

- **Title y H1 nunca usan "calculadora"** — se usó "ejemplo real con tu sueldo", evitando explícitamente los patrones prohibidos por el brief ("Calculadora regla 50/30/20", "Calculadora 50/30/20 online", "Calcula la regla 50/30/20").
- **La keyword `regla 50 30 20 calculadora` no aparece como target de ninguna sección** — solo se menciona de forma natural como mención de la herramienta dentro del cuerpo (FAQ #6 y sección "Cómo calcular tu caso"), nunca como eje editorial.
- **El CTA hacia la herramienta usa lenguaje de complemento, no de sustitución** — *"usa la calculadora 50/30/20"* como paso siguiente tras ver los ejemplos, nunca presentando el artículo mismo como un lugar para calcular.
- **La explicación básica ("qué es la regla 50/30/20") se mantiene deliberadamente breve** y remite al pilar `como-hacer-un-presupuesto-personal`, evitando duplicar esa comparativa de métodos ya publicada.
- **La herramienta `/herramientas/regla-50-30-20` no se ha tocado en ningún campo** (title, meta, schema, contenido) — verificado con `git diff` (sin cambios) y con `curl` local confirmando HTTP 200 sin alteración.

## 9. Qué se dejó fuera de alcance

- No se ha tocado ningún artículo existente (`fondo-de-emergencia`, `cuentas-remuneradas`, `como-hacer-un-presupuesto-personal`, `como-ahorrar-dinero-cada-mes`, `metodo-kakebo-guia-definitiva`) — solo se enlaza hacia ellos.
- No se ha tocado `/blog/plantilla-kakebo-excel`.
- No se ha modificado la herramienta `/herramientas/regla-50-30-20` ni ningún otro componente compartido, salvo el uso —no modificación— de los componentes MDX ya existentes (`Callout`, `ToolCTA`, `FaqSection`, `FaqItem`, `ArticleCTA`).
- No se ha tocado `sitemap.ts`, `robots.ts`, canonical ni hreflang — el sistema los genera automáticamente para el nuevo slug, mismo mecanismo ya usado por `fondo-de-emergencia` y `cuentas-remuneradas`.
- **Estado anterior a `CONTENT-03-IMAGE-IMPL-01` (histórico, ya resuelto):** el artículo se publicó sin campo `image`; el sistema aplicaba el fallback automático a `/og-image.jpg`. Resuelto en la actualización §0 de este documento — la imagen destacada específica ya está integrada.
- No se ha creado una plantilla Excel de la regla 50/30/20 — mención descartada de la versión final del artículo (ver §7) para no prometer una descarga inexistente.
- No se ha tocado `.claude/settings.local.json`.

## 10. Ventana de medición recomendada

**8-12 semanas desde publicación** (2026-07-09), mismo estándar ya aplicado a `CONTENT-01` (`cuentas-remuneradas`) y `CONTENT-02` (`fondo-de-emergencia`). Primeras señales fiables de indexación/rastreo esperadas a partir de ~2026-09-03/2026-10-01.

---

*CONTENT_03_REGLA_503020_EJEMPLO.md — creado 2026-07-09*
*Sin comparativa bancaria, sin afiliación, sin promesa de que la regla sirve para todos — no se ha tocado la herramienta `/herramientas/regla-50-30-20`, ni `/blog/plantilla-kakebo-excel`, ni `/blog/fondo-de-emergencia`, ni `/blog/cuentas-remuneradas`, ni ningún otro artículo o configuración SEO técnica existente*
