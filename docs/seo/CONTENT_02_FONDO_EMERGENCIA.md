# CONTENT_02_FONDO_EMERGENCIA — Artículo "Fondo de emergencia"

**Fecha:** 2026-07-09
**Tarea:** CONTENT-02 (+ actualización `CONTENT-02-IMAGE-IMPL-01`)
**Sprint:** Sprint Contenido V1
**Tipo:** Contenido nuevo — guía evergreen informativa/práctica, España-first
**Documento base:** `docs/seo/KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`
**Commit de referencia (HEAD antes de CONTENT-02):** `1ef682c`
**Commit de referencia (HEAD antes de CONTENT-02-IMAGE-IMPL-01):** `9f45938`

---

## 0. Validaciones de `CONTENT-02-IMAGE-IMPL-01`

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes |
| `npx tsc --noEmit` | ✅ 0 errores |
| `GET /blog/fondo-de-emergencia` | ✅ HTTP 200 |
| `GET /images/blog/fondo-de-emergencia.png` | ✅ HTTP 200 (sin 404) |
| `BlogPosting.image` | ✅ `["/images/blog/fondo-de-emergencia.png"]` (ya no el fallback) |
| `og:image` | ✅ `.../images/blog/fondo-de-emergencia.png` |
| `FAQPage` / `BreadcrumbList` | ✅ Presentes, sin cambios |
| `title` / H1 / `canonical` | ✅ Sin cambios |
| Miniatura en `/blog` (índice) | ✅ Usa la nueva imagen automáticamente |
| Diff del `.mdx` | ✅ 1 línea añadida (`image:`), sin tocar contenido editorial |

---

## 1. Slug creado

`src/content/blog/fondo-de-emergencia.es.mdx` → URL: `https://www.metodokakebo.com/blog/fondo-de-emergencia`

Verificado antes de crear: no existía ningún archivo `fondo-de-emergencia.*.mdx` en `src/content/blog/` — sin conflicto de slug.

## 2. Keyword padre / keyword objetivo inicial

- **Keyword padre:** `fondo de emergencia`
- **Keyword objetivo inicial:** `cuánto dinero tener en un fondo de emergencia`

Ambas tomadas literalmente de `KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`, sin improvisar variantes nuevas.

## 3. Title / H1 / meta usados

| Campo | Valor |
|---|---|
| `title` (frontmatter, usado como `<title>` con sufijo " \| Blog Kakebo" y como H1) | `Fondo de emergencia: cuánto dinero tener y dónde guardarlo` |
| `excerpt` (usado como meta description y OG description) | `Aprende cuánto dinero tener en un fondo de emergencia, cómo calcularlo según tus gastos reales y dónde guardarlo sin confundir ahorro con inversión.` |

**Incidencia técnica documentada:** el sistema de blog (`src/app/[locale]/(public)/blog/[slug]/page.tsx`) usa un único campo `frontmatter.title` tanto para el `<title>` SEO como para el `<h1>` visible — no existe un campo `h1` separado en el schema de frontmatter (`BlogPost['frontmatter']` en `src/lib/blog.ts`). El brief de la tarea proponía dos strings distintos ("Title SEO recomendado" y "H1 recomendado"). Como el sistema no admite valores distintos sin modificar el componente compartido (fuera del alcance de un cambio atómico de contenido), se usó el **Title SEO recomendado** (`"Fondo de emergencia: cuánto dinero tener y dónde guardarlo"`) para ambos campos — lidera con la keyword padre, tiene una longitud adecuada (60 caracteres) y es coherente con el patrón ya usado en el resto de artículos del blog (título = H1). El H1 recomendado alternativo (`"Cuánto dinero tener en un fondo de emergencia y dónde guardarlo"`) no se ha descartado por calidad, sino por la limitación estructural del template compartido — queda documentado aquí por si en el futuro se añade un campo `h1` independiente.

## 4. Enlaces internos añadidos

Los 6 obligatorios, todos presentes y verificados en el HTML renderizado:

| Enlace | Nº de apariciones | Contexto |
|---|---|---|
| `/herramientas/calculadora-ahorro` | 5 | Cálculo del margen, `ToolCTA`, conclusión |
| `/blog/cuentas-remuneradas` | 4 | Dónde guardarlo, sección dedicada, conclusión |
| `/blog/como-ahorrar-dinero-cada-mes` | 3 | Ejemplo práctico, cómo empezar |
| `/blog/como-hacer-un-presupuesto-personal` | 2 | Definición, introducción |
| `/herramientas/regla-50-30-20` | 3 | Cómo empezar a crearlo |
| `/herramientas/calculadora-inflacion` | 3 | Fondo de emergencia y cuentas remuneradas |

Ninguna de las 6 páginas de destino se ha modificado — solo se han añadido enlaces salientes desde el nuevo artículo.

## 5. FAQ incluidas

Las 6 exactas indicadas en el brief, duplicadas en frontmatter (`faq:`, para el schema `FAQPage`) y en el cuerpo visible (`<FaqSection><FaqItem>`, mismo patrón que el resto de artículos del blog):

1. ¿Cuánto dinero debería tener en mi fondo de emergencia?
2. ¿Dónde es mejor guardar el fondo de emergencia?
3. ¿Es buena idea invertir el fondo de emergencia?
4. ¿Cuántos meses de gastos debería cubrir?
5. ¿Puedo tener el fondo de emergencia en una cuenta remunerada?
6. ¿Qué hago si todavía no puedo ahorrar tres meses de gastos?

## 6. Estructura implementada

Los 10 H2 obligatorios, todos presentes: Qué es un fondo de emergencia · Cuánto dinero tener en un fondo de emergencia · Cómo calcular tu fondo de emergencia paso a paso · Ejemplo práctico según tus gastos reales · Dónde guardar el fondo de emergencia · Por qué no deberías invertir tu fondo de emergencia · Fondo de emergencia y cuentas remuneradas · Cómo empezar a crearlo si todavía no tienes ahorro · Errores frecuentes al crear un fondo de emergencia · Preguntas frecuentes.

**Tabla orientativa** con 3 perfiles de gastos fijos (600 €, 1.000 €, 1.800 €) × 2 multiplicadores (3 y 6 meses), replicando el patrón de tabla ya usado en `cuentas-remuneradas`.

**Dos `ToolCTA`:** uno hacia `calculadora-ahorro` (cálculo del margen y tiempo necesario) y enlaces contextuales hacia `calculadora-inflacion`. Un `ArticleCTA` final hacia registro, mismo patrón que el resto del blog.

## 7. Decisiones editoriales

- **Sin comparativa de bancos ni recomendación de entidades concretas** — ninguna entidad bancaria o aseguradora se menciona por nombre.
- **Sin afiliación.**
- **Sin rentabilidades inventadas** — no se menciona ninguna TAE ni cifra de rentabilidad específica; para ese detalle se remite explícitamente a `cuentas-remuneradas`, que ya lo trata con el disclaimer correspondiente.
- **Cálculo basado en gastos fijos, no en ingresos ni gastos totales** — coherente con la definición ya usada en la FAQ de `calculadora-ahorro` ("3 y 6 meses de tus gastos fijos mensuales"), para no introducir una segunda definición contradictoria en el sitio.
- **No se repitió "qué es un fondo de emergencia" en profundidad** — la sección homónima es deliberadamente breve (2 párrafos) y remite a `como-hacer-un-presupuesto-personal` para la definición base, evitando canibalización según lo acordado en la ficha keyword.
- **No se repitió el desarrollo de "dónde guardarlo"** (TAE, saldo máximo remunerado, comisiones, fondo de garantía) — se resume en un párrafo y se enlaza fuerte hacia `cuentas-remuneradas`, que ya lo cubre en detalle.
- **Enfoque España-first sin convertirlo en artículo fiscal/bancario** — no se mencionan ni el IRPF ni el FGD (esos detalles ya están en `cuentas-remuneradas`); el artículo se mantiene centrado en el cálculo y el criterio de decisión.
- **Separación explícita ahorro/inversión** — sección dedicada ("Por qué no deberías invertir tu fondo de emergencia") sin mencionar productos de inversión concretos ni rentabilidades esperadas.

## 8. Imagen

**Actualización 2026-07-09 (`CONTENT-02-IMAGE-IMPL-01`):** la imagen destacada específica ya se ha integrado. Se copió `docs/seo/fondo_emergencia/fondo_emergencia.png` (PNG real, 1536×1024, verificado con `file`) a `public/images/blog/fondo-de-emergencia.png`, y se añadió `image: '/images/blog/fondo-de-emergencia.png'` al frontmatter de `fondo-de-emergencia.es.mdx`, siguiendo exactamente el mismo patrón de campo ya usado en `cuentas-remuneradas.es.mdx` (comillas simples, misma posición tras `updatedDate`). El archivo original en `docs/seo/fondo_emergencia/` no se movió ni se eliminó. No se modificó ningún otro campo del frontmatter ni el contenido editorial del artículo.

Con esto, `BlogPosting.image` y `og:image` ya usan la imagen específica del artículo en lugar del fallback `/og-image.jpg`; la miniatura del artículo en `/blog` también la usa automáticamente.

**Estado anterior a esta actualización (histórico, ya resuelto):** el artículo se publicó sin campo `image`. El sistema de blog gestionaba esto de forma segura — `blog/[slug]/page.tsx` renderiza la imagen del artículo solo si `post.frontmatter.image` existe, y el schema `BlogPosting`/Open Graph usaban el fallback `https://www.metodokakebo.com/og-image.jpg` cuando no había imagen específica.

## 9. Qué se dejó fuera de alcance

- No se ha tocado ningún artículo existente.
- No se ha tocado `/blog/plantilla-kakebo-excel`.
- No se ha modificado ninguna herramienta (`calculadora-ahorro`, `calculadora-inflacion`, `regla-50-30-20`) — solo se enlaza hacia ellas.
- No se ha tocado `sitemap.ts`, `robots.ts`, canonical ni hreflang — el sitema los genera automáticamente para el nuevo slug (`sitemap.ts` ya itera `getBlogPosts()` sin necesitar cambios; `blog/[slug]/page.tsx` construye `canonical`/`hreflang` a partir del slug real).
- No se ha tocado el diseño global ni ningún componente compartido salvo el uso —no modificación— de los componentes MDX ya existentes (`Callout`, `ToolCTA`, `FaqSection`, `FaqItem`, `ArticleCTA`).
- No se ha generado imagen destacada — documentado en §8 como tarea futura.

## 10. Ventana de medición recomendada

**8-12 semanas desde publicación** (2026-07-09), siguiendo el mismo estándar ya aplicado a `CONTENT-01` (`cuentas-remuneradas`) y a la propia ficha de keyword research. Primeras señales fiables de indexación/rastreo esperadas a partir de ~2026-09-03/2026-10-01.

---

*CONTENT_02_FONDO_EMERGENCIA.md — creado 2026-07-09*
*Sin afiliación, sin comparativa comercial, sin recomendación de entidades, sin rentabilidades inventadas — no se ha tocado ningún artículo, herramienta ni configuración SEO técnica existente*
