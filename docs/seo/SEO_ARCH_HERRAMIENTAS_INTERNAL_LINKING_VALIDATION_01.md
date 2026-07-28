# SEO-ARCH-HERRAMIENTAS-INTERNAL-LINKING-VALIDATION-01 — Validación del enlazado interno del hub `/herramientas`

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Tarea exclusiva de diagnóstico y documentación. Cero cambios de código, navegación, footer o contenido.**
**Rama operativa:** `main` (sincronizada con `origin/main`; commit `3dd8c311ce1e22bcb6bc9f1bdef0ef5aca6e9bda` confirmado presente antes de iniciar esta validación)

---

## 1. Hallazgo original de SE Ranking

Auditoría del 28 de julio de 2026: `https://www.metodokakebo.com/herramientas` y
`https://www.metodokakebo.com/en/herramientas` señaladas como páginas **sin enlaces internos
entrantes** ("orphan pages").

## 2. Estado real de `/herramientas`

- **HTTP:** 200 (verificado en producción).
- **Indexabilidad:** `<meta name="robots" content="index, follow"/>` — indexable, sin `noindex`.
- **Canonical:** `https://www.metodokakebo.com/herramientas` (correcto, coincide con la URL
  visitada).
- **hreflang:** `es` → `/herramientas`, `en` → `/en/herramientas`, `x-default` → `/herramientas`
  — correcto y consistente.
- **Título:** "Herramientas Kakebo: Calculadoras de Ahorro e Inflación".
- **Schema:** `CollectionPage` con `mainEntity.ItemList` de las 3 herramientas — bien formado,
  sin errores.
- **Contenido real:** página funcional, no solo una rejilla vacía — incluye H1, subtítulo, 3
  tarjetas-enlace a las herramientas (ahorro, 50/30/20, inflación) y un bloque de promoción hacia
  `/blog/plantilla-kakebo-excel` ("Consolidation of Authority", según comentario del propio
  código en `src/app/[locale]/(public)/herramientas/page.tsx` línea 120).
- **Navbar y Footer:** sí se renderizan (heredados de `src/app/[locale]/(public)/layout.tsx`,
  que envuelve toda la ruta `(public)` con `<Navbar />`; `herramientas/page.tsx` no importa
  `Navbar` directamente pero lo hereda del layout). Footer se importa y renderiza explícitamente
  dentro de la propia página.
- **Solo 3 de las 3 herramientas activas están listadas** (ahorro, 50/30/20, inflación) —
  coincide exactamente con el inventario de herramientas activas del sitio (verificado contra
  `src/app/sitemap.ts` `coreRoutes`, que solo declara estas 3 bajo `/herramientas/*`). No hay
  herramientas activas ausentes del hub.

## 3. Estado real de `/en/herramientas`

- **HTTP:** 200.
- **Indexabilidad:** `index, follow`, sin `noindex`.
- **Canonical:** `https://www.metodokakebo.com/en/herramientas` (correcto).
- **hreflang:** idéntico al de la versión española (mismo bloque `es`/`en`/`x-default`).
- **Título:** "Kakebo Tools: Savings and Inflation Calculators".
- **Versión EN coherente con ES:** sí — misma estructura, mismas 3 herramientas, mismo bloque de
  promoción (traducido), generado por el mismo componente (`ToolsIndexPage`) con `locale`
  parametrizado, sin duplicación de código ni desincronía de contenido entre idiomas.

**Conclusión de las secciones 2 y 3:** el hub en sí — metadata, schema, indexabilidad,
consistencia ES/EN — está correctamente implementado. El problema no es la página, es la ausencia
de enlaces hacia ella.

## 4. Enlaces entrantes actuales

Búsqueda exhaustiva de `href="/herramientas"` (y variantes `href={...}/herramientas`,
enlaces Markdown `[texto](/herramientas)`) en todo `src/` (componentes, páginas, contenido MDX,
mensajes i18n) y en el HTML renderizado real de producción (home, hub, las 3 páginas de
herramientas, un artículo de blog):

**Resultado: 0 enlaces `<a href="/herramientas">` (ni `/en/herramientas`) en ningún lugar del
sitio — ni en código fuente ni en HTML servido.**

Desglose de dónde se esperaría un enlace y qué hay en su lugar:

| Ubicación esperada | Qué hay realmente |
|---|---|
| Navbar (desktop), dropdown "Herramientas" | El disparador es un `<button>` (`onClick`, `aria-expanded`), no un `<a>`. Dentro del dropdown solo hay 3 `<Link>` a las herramientas individuales. El texto "Herramientas" nunca es clicable hacia el hub. |
| Navbar (móvil) | Un `<span>` de encabezado de sección ("Herramientas"), no un enlace, seguido de los mismos 3 `<Link>` a herramientas individuales. |
| Footer, sección "Product" | 3 `<Link>` directos a las herramientas individuales; no hay ningún `<Link href="/herramientas">` al hub. |
| Home (`(public)/page.tsx`) | Solo aparece la cadena `"herramientas"` dentro de un `description` de schema JSON-LD (texto libre, no URL/enlace). `ToolsSection.tsx` enlaza directamente a 2 herramientas individuales, nunca al hub. |
| Índice del blog (`blog/page.tsx`) | 0 referencias a `herramientas` de ningún tipo. |
| Artículos de blog (`blog/[slug]/page.tsx`, MDX, `RelatedPosts.tsx`, `MDXComponents.tsx`, `MDXClientCTAs.tsx`) | 0 referencias a `herramientas`. |
| `/sobre-nosotros`, `/tutorial` | 0 referencias a `herramientas`. |
| Cada página de herramienta individual (`calculadora-ahorro`, `regla-50-30-20`, `calculadora-inflacion`) | `/herramientas` solo aparece como el campo `item` (string, no anchor) de un `ListItem` de posición 2 dentro del `BreadcrumbList` JSON-LD de cada página. **No existe ningún elemento `<nav>`/breadcrumb visible en el HTML** — verificado buscando `<nav ... breadcrumb>` o `aria-label="Breadcrumb"` en el HTML servido de `/herramientas/calculadora-ahorro`: cero resultados. El breadcrumb es puramente datos estructurados para rich snippets de Google, invisible y no clicable para usuarios ni rastreable como enlace real. |
| `/sitemap.xml` | Sí incluye `/herramientas` y `/en/herramientas` (vía `coreRoutes` de `sitemap.ts`). **Esto no cuenta como enlazado interno editorial** — es un canal de descubrimiento distinto (envío directo a motores de búsqueda), no distribuye autoridad de página a página ni ofrece una ruta de navegación al usuario. |

**No existen enlaces generados solo mediante JavaScript** que expliquen una discrepancia con
SE Ranking: los 0 hallazgos anteriores se confirmaron tanto en el código fuente (build-time) como
en el HTML servido por el servidor (curl directo, sin ejecutar JS del cliente) — es decir, ni
siquiera hay un enlace añadido dinámicamente en el cliente que un crawler sin JS se perdiera. La
ausencia es real y completa, no un artefacto de renderizado.

## 5. Enlaces salientes actuales

Desde `/herramientas` (y su equivalente `/en/herramientas`), verificado en el HTML de producción:

- 3 enlaces a las herramientas individuales (`/herramientas/calculadora-ahorro`,
  `/herramientas/regla-50-30-20`, `/herramientas/calculadora-inflacion`) — tarjetas principales.
- 1 enlace a `/blog/plantilla-kakebo-excel` (bloque de promoción "Consolidation of Authority").
- Enlaces heredados de Navbar y Footer (comunes a toda página pública: home, blog, herramientas
  individuales de nuevo, ancla `#features`/`#how-it-works`/`#alternatives`/`#faq`, `/tutorial`,
  `/sobre-nosotros`, `/login`, `/app`, `/privacy`, `/terms`, `/cookies`).

## 6. Mapa de arquitectura de enlazado (estado actual, verificado)

```
Home           ──✗──▶  Hub (/herramientas)
Blog (índice)  ──✗──▶  Hub
Artículos      ──✗──▶  Hub
Navbar         ──✗──▶  Hub          (dropdown "Herramientas" = botón, no enlace)
Footer         ──✗──▶  Hub          (enlaza herramientas individuales, no el hub)
Sitemap        ──✓──▶  Hub          (descubrimiento vía motor de búsqueda, no enlazado editorial)

Hub            ──✓──▶  Herramienta 1 (calculadora-ahorro)
Hub            ──✓──▶  Herramienta 2 (regla-50-30-20)
Hub            ──✓──▶  Herramienta 3 (calculadora-inflacion)
Hub            ──✓──▶  /blog/plantilla-kakebo-excel

Herramienta 1  ──✗──▶  Hub          (solo referenciado en BreadcrumbList JSON-LD, sin <a> visible)
Herramienta 2  ──✗──▶  Hub          (ídem)
Herramienta 3  ──✗──▶  Hub          (ídem)

Herramienta 1  ──✓──▶  Herramienta 3 (link cruzado real, dentro del bloque de recursos relacionados)
Herramienta 3  ──✓──▶  Herramienta 2 (link cruzado real)
Herramienta 1  ──✓──▶  7 artículos de blog relacionados (bloque "Sigue mejorando tu plan de ahorro")

Home (ToolsSection)  ──✓──▶  Herramienta 2, Herramienta 3 (enlaces directos, sin pasar por el hub)
```

El hub es un nodo **exclusivamente de salida**: reparte autoridad y navegación hacia las 3
herramientas y hacia un artículo de blog, pero no recibe ningún enlace real de vuelta desde
ningún nodo del grafo — ni siquiera de las páginas que él mismo enlaza.

## 7. Clasificación del hallazgo

**CONFIRMADO.**

No es un falso positivo: se ha verificado exhaustivamente en código fuente y en HTML de
producción real (sin depender del renderizado de SE Ranking) que no existe ningún `<a href>` en
ningún lugar del sitio que apunte a `/herramientas` o `/en/herramientas`. Tampoco es intencional:
no hay ningún comentario, ADR, ni documento de arquitectura previo (`CONTEXT.md`,
`PROJECT_STATUS.md`, `docs/seo/*`) que documente esta ausencia como una decisión deliberada — al
contrario, el propio código construye un `BreadcrumbList` que declara `/herramientas` como padre
jerárquico de las 3 herramientas, lo que indica una intención de arquitectura jerárquica que nunca
se completó con enlaces reales visibles.

## 8. Riesgo SEO real

**Medio.**

- El hub sigue siendo descubrible e indexable vía sitemap (`/sitemap.xml` lo declara, con
  metadata y canonical correctos), así que no hay riesgo de desindexación total ni de que Google
  desconozca la URL.
- El riesgo real es de **calidad de señal, no de indexación**: una página sin enlaces internos
  entrantes recibe una señal de importancia/autoridad interna baja (PageRank interno mínimo),
  lo que puede debilitar su posicionamiento frente a búsquedas genéricas tipo "herramientas
  kakebo" o "calculadoras kakebo", y refuerza a ojos de un rastreador que la arquitectura temática
  declarada en el `BreadcrumbList` (hub como padre de las 3 calculadoras) no está respaldada por
  enlaces reales.
- Impacto de UX real, no solo SEO: un usuario que quiera ver "todas las herramientas" no tiene
  ninguna ruta de navegación para llegar a esa vista — solo puede acceder a herramientas
  individuales sueltas desde navbar/footer/home, o encontrar `/herramientas` por azar en
  resultados de búsqueda.
- No hay riesgo de canibalización ni de contenido duplicado: el hub tiene contenido y propósito
  claramente distintos de cada herramienta individual.

## 9. Papel recomendado para el hub

El hub debería actuar como **el punto de entrada jerárquico real hacia el cluster de
herramientas** — no un añadido opcional, sino el nodo intermedio entre la navegación global (home,
navbar, footer) y cada calculadora individual, coherente con la jerarquía que el propio
`BreadcrumbList` de cada herramienta ya declara. Concretamente:

- Debe ser el destino de la etiqueta "Herramientas" en la navegación global (actualmente un mero
  disparador de menú desplegable sin destino propio).
- Debe recibir un enlace de retorno visible (no solo en JSON-LD) desde cada herramienta
  individual, completando el patrón de breadcrumb que el schema ya promete a los motores de
  búsqueda pero no ofrece a los usuarios.
- No necesita convertirse en un hub de contenido extenso (guías, comparativas, etc.) — su
  contenido actual (rejilla de 3 tarjetas + CTA a la plantilla Excel) es suficiente para su
  función de índice; el problema no es de contenido sino exclusivamente de enlazado.

## 10. Páginas candidatas para enlazarlo (evaluación, sin implementar)

| Página / componente | Idoneidad | Justificación |
|---|---|---|
| **Navbar** (dropdown "Herramientas", desktop y móvil) | **Alta** | Es el punto de entrada global más visible del sitio; el texto "Herramientas" ya existe y ya comunica la intención de agrupar — solo falta que sea también un destino navegable, no solo un disparador de submenú. |
| **Footer**, sección "Product" | **Alta** | Ya lista las 3 herramientas individuales; añadir el hub como enlace padre (p. ej. antes o después de las 3) es coherente con el resto de la sección y no introduce un patrón nuevo. |
| **Cada herramienta individual** (breadcrumb visible) | **Alta** | Completa el patrón que el `BreadcrumbList` JSON-LD ya declara; mejora tanto SEO (enlace real hacia el padre) como UX (navegación jerárquica visible, hoy ausente). |
| **Home** (`ToolsSection`) | **Media** | Ya enlaza 2 herramientas directamente; un enlace adicional tipo "Ver todas las herramientas →" sería natural y no redundante si se posiciona como cierre de la sección, no como una tarjeta más. |
| **Índice del blog / artículos pilar** | **Baja / opcional** | No se ha identificado ningún artículo cuyo tema sea específicamente "herramientas Kakebo" en general (los artículos enlazan herramientas *individuales* relevantes a su contenido, lo cual es correcto y no debe generalizarse). Añadir el hub aquí de forma sistemática sería repetitivo y de bajo valor editorial; se descarta como candidato prioritario. |

## 11. Primera corrección recomendada (propuesta, NO ejecutada)

**`SEO-ARCH-HERRAMIENTAS-NAVBAR-LINK-01`** — alcance atómico: convertir el disparador "Herramientas"
del dropdown de `src/components/landing/Navbar.tsx` (desktop y móvil) en un enlace real
(`<Link href="/herramientas">`) hacia el hub, manteniendo intacto el comportamiento de menú
desplegable para las 3 herramientas individuales (p. ej. el texto/label actúa como enlace al hub,
y el icono/chevron mantiene el toggle del submenú; o se añade un ítem final "Ver todas las
herramientas" dentro del propio dropdown). Es la corrección de mayor apalancamiento con el menor
alcance: al estar en un componente global, resuelve el hallazgo de "página huérfana" para
`/herramientas` y `/en/herramientas` desde una única modificación de un único fichero, sin tocar
footer, breadcrumbs de herramientas individuales, home ni contenido editorial — todo lo cual queda
para tareas de seguimiento independientes si se decide abordarlas.

## 12. Elementos fuera de alcance

- No se ha añadido ningún enlace real en esta tarea.
- No se ha modificado `Navbar.tsx`, `Footer.tsx`, `ToolsSection.tsx`, ni ningún breadcrumb.
- No se ha tocado `src/app/sitemap.ts`, ningún `canonical`, `hreflang` ni schema.
- No se ha modificado `https://www.metodokakebo.com/blog/plantilla-kakebo-excel` ni ningún enlace
  saliente que ya apunte a esa URL desde el hub.
- No se ha evaluado ni propuesto ningún cambio de contenido dentro de `/herramientas` o
  `/en/herramientas` más allá de su función de enlazado.
- No se han corregido otros hallazgos de la auditoría SE Ranking del 28/07/2026 no relacionados
  con este hub.

## STOP de implementación

**Esta tarea es exclusivamente de diagnóstico.** No se ha añadido ningún enlace, no se ha
modificado `Navbar.tsx`, `Footer.tsx` ni ningún contenido. La corrección propuesta en la sección 11
queda documentada pero **no ejecutada**. No se inicia ninguna otra tarea.
