# SEO_TECHNICAL_TUTORIAL_PRIORITY_01 — Auditoría de /tutorial

**Fecha:** 2026-07-09
**Tarea:** SEO-TECHNICAL-TUTORIAL-PRIORITY-01
**Tipo:** Solo auditoría y decisión documentada — sin cambios en código, contenido ni configuración SEO
**Commit de referencia (HEAD):** `7d86627`

---

## 1. URL auditada

`https://www.metodokakebo.com/tutorial`
Archivo: `src/app/[locale]/(public)/tutorial/page.tsx`

## 2. Documentos revisados

`docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md` · `docs/seo/SEO_ROADMAP_V1.md` · `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` · `docs/seo/SEO_MAP_V1.md` · `docs/PROJECT_STATUS.md` · `PROJECT_STATUS.md` (raíz)

## 3. Estado técnico actual

| Aspecto | Estado |
|---|---|
| Archivo | `src/app/[locale]/(public)/tutorial/page.tsx` |
| `title` / meta title | `"Cómo usar el Método Kakebo \| Tutorial completo de Ahorro"` |
| `description` | `"Aprende qué es el método japonés Kakebo, cómo dividir tus gastos en 4 categorías y empezar a ahorrar desde el primer mes con esta guía completa."` |
| H1 (visible) | `"Tutorial del Método Kakebo"` (único, confirmado en `SEO-OG-SITENAME-INHERITANCE-IMPL-01`) |
| H2 (4 secciones) | 1. ¿Qué es el Kakebo? · 2. Las 4 categorías de gasto · 3. Cómo usar el Dashboard · 4. El Agente Financiero Inteligente |
| `canonical` | `https://www.metodokakebo.com/tutorial` (corregido en `SEO-TECHNICAL-TUTORIAL-01`, 2026-07-01 — antes apuntaba a `/es/tutorial`) |
| `hreflang` | `es`/`en`/`x-default` correctos, mismo patrón que el resto del sitio |
| `robots` | `{ index: true, follow: true }` — indexable |
| `openGraph.siteName` | `"MetodoKakebo.com"` (corregido en `SEO-OG-SITENAME-INHERITANCE-IMPL-01`) |
| JSON-LD | **No existe** ningún `<script type="application/ld+json">` en esta página — sin schema estructurado de ningún tipo |
| Contenido | 4 secciones con texto real, 3 imágenes reales del dashboard (`ExpandableImage`), listas, pasos numerados — clasificado previamente como "contenido real, no thin" (`SEO-TECHNICAL-TUTORIAL-01`) |
| Sitemap | Incluida en `coreRoutes` de `src/app/sitemap.ts`, `priority: 0.8`, `changeFrequency: 'monthly'` — **sin revisar desde su clasificación como onboarding** |
| Robots.txt | No bloqueada (`disallow` solo cubre `/api/`, `/app/`, `/auth/`) |

## 4. Enlazado interno

**Entrante:**
- 1 enlace contextual desde el copy SEO de Home (`messages/es.json`, `Landing.SEO.whatIs.p3`): *"...leer en profundidad nuestro [tutorial Kakebo paso a paso](/tutorial)..."*
- **Ningún artículo de blog enlaza a `/tutorial`** (0 de 15 artículos ES revisados en el grep de `/tutorial` en `src/content/blog/`).
- **Ninguna herramienta enlaza a `/tutorial`.**

**Navegación estructural (no es "contenido", pero sí arquitectura):**
- Presente en `Navbar.tsx` (navegación pública, desktop y móvil).
- Presente en `TopNav.tsx` — la navegación de la **app autenticada** (`/app`, `/app/agent`, `/app/fixed`, ...). Esto confirma que `/tutorial` funciona también como página de ayuda/onboarding para usuarios ya registrados, no solo como pieza de captación pública.

**Saliente:** 1 CTA hacia `/login` ("Crea tu cuenta ahora"). Sin enlaces salientes hacia artículos del blog ni hacia herramientas.

## 5. Estado SEO/GEO actual

- Indexable, sin errores técnicos activos (canonical y hreflang ya corregidos en tareas previas).
- Sin schema JSON-LD — a diferencia de Home, blog index, hub de herramientas y las 3 herramientas, que sí tienen `Organization`/`CollectionPage`/`SoftwareApplication`/`FAQPage`.
- Sin datos de tracción en GSC documentados específicamente para esta URL (no aparece en ninguno de los snapshots de `GSC_CHANGELOG_2026_07_03.md`).
- `SEO_MAP_V1.md` (2026-06-30) ya la clasifica explícitamente: intención **"Navegacional / onboarding app"**, prioridad **P3**, riesgo **Bajo**, acción recomendada **"Sin prioridad SEO"** / **"No tocar"**.

## 6. Intención detectada

El título, meta description y H1 (*"Cómo usar el Método Kakebo"*, *"Tutorial del Método Kakebo"*) sugieren una intención **informacional sobre el método japonés Kakebo** — el mismo territorio de intención que ya tiene un pilar designado (`/blog/metodo-kakebo-guia-definitiva`).

Pero el contenido real (secciones 3 y 4: *"Cómo usar el Dashboard"*, *"El Agente Financiero Inteligente"*, con capturas de pantalla del producto) es **onboarding de producto** — cómo usar la app Kakebo AI, no una explicación del método japonés en abstracto. Y su presencia en `TopNav.tsx` (navegación de la app autenticada) confirma que su función real, verificable en código, es de **ayuda/onboarding**, no de captación de tráfico de búsqueda genérico.

**Conclusión de intención: mixta, con desalineación entre el framing SEO (title/H1: método Kakebo) y la función real del contenido (secciones 3-4 y presencia en TopNav: onboarding de producto).**

## 7. Riesgos identificados

| Riesgo | ¿Presente? | Evidencia |
|---|---|---|
| Thin content | **No** | Contenido real ya validado en `SEO-TECHNICAL-TUTORIAL-01`: 4 secciones con texto, listas, pasos y 3 imágenes propias del dashboard |
| Páginas huérfanas | **No** | Enlazada desde Navbar, TopNav, sitemap y 1 enlace contextual desde Home |
| Confusión entre tutorial de producto y método Kakebo | **Sí — hallazgo nuevo de esta auditoría** | El title (`"Cómo usar el Método Kakebo"`), meta description y H1 (`"Tutorial del Método Kakebo"`) enmarcan la página como explicación del método japonés — el mismo territorio que `/blog/metodo-kakebo-guia-definitiva` (pilar designado para la keyword "método kakebo" según `SEO_GEO_DEEP_AUDIT_01.md` §8.1). Las secciones 1-2 (*"¿Qué es el Kakebo?"*, *"Las 4 categorías de gasto"*) refuerzan ese solapamiento; solo las secciones 3-4 son onboarding de producto genuino y sin solapamiento |
| Canibalización real (confirmada por datos) | **No confirmada** | No hay evidencia en GSC de que ambas URLs compitan por las mismas queries — es un riesgo estructural detectado por lectura de título/contenido, no un hecho medido. Pendiente de confirmar (o descartar) en el snapshot GSC del 2026-07-17/31 |
| Baja intención de búsqueda | **Sí, parcialmente** | El propio `SEO_MAP_V1.md` ya la clasifica como intención navegacional/onboarding, no transaccional ni de captación — coherente con el hallazgo de esta auditoría |
| Exceso de URLs indexables sin valor SEO | **No** | Es 1 sola URL, con contenido real y función de producto verificable; no es un patrón de URLs vacías |
| Impacto en arquitectura | **Bajo** | Su `priority: 0.8` en el sitemap la sitúa al mismo nivel que el hub de herramientas y el índice de blog, una señal desproporcionada para una página de intención navegacional/onboarding — esto es precisamente el hallazgo original T-12 que motivó esta tarea |
| Falta de schema estructurado | **Sí** | Es la única página pública indexable del bloque core (`Home`, `tutorial`, `sobre-nosotros`, `blog`, `herramientas`) sin ningún JSON-LD. No estaba en el alcance original de T-12, pero se documenta como observación adyacente |

## 8. Opciones evaluadas

| Opción | Evaluación |
|---|---|
| A. Mantener indexada y reforzarla | Descartada — reforzarla (más contenido, más enlaces entrantes) profundizaría el solapamiento de intención con el pilar del método, sin evidencia de que valga la pena como activo de captación |
| B. Mantener indexada pero sin priorizar | **Recomendada** — coherente con la clasificación ya vigente en `SEO_MAP_V1.md` (P3, "sin prioridad SEO") y con el propio origen de esta tarea (T-12: ajustar la prioridad de sitemap a su función real) |
| C. Convertirla en página de soporte/onboarding no SEO | Prematura — no hay evidencia de canibalización confirmada por datos; noindexarla o desindexarla de la arquitectura SEO sería una decisión más drástica de la que los datos actuales justifican |
| D. Redirigirla en el futuro a una página mejor | Descartada — el contenido de producto (secciones 3-4) no tiene una URL equivalente a la que redirigir; perdería una función real de onboarding para usuarios logueados |
| E. Noindexarla en el futuro | Descartada por ahora — mismo motivo que C; se reevaluaría solo si el snapshot GSC confirma canibalización real con el pilar del método |
| F. Dejarla como está hasta tener datos GSC | Parcialmente aplicable al **riesgo de canibalización de título** (sección 7) — pero no bloquea la corrección de prioridad de sitemap, que ya estaba justificada desde `SEO-TECHNICAL-TUTORIAL-01` sin necesidad de más datos |

## 9. Decisión recomendada

**Opción B — Mantener indexada pero sin priorizar.**

Justificación:
1. El contenido es real y cumple una función legítima de onboarding de producto, verificada por su presencia en la navegación de la app autenticada (`TopNav.tsx`) — no debe noindexarse ni eliminarse.
2. Su prioridad actual en el sitemap (0.8) no refleja su función real (onboarding/navegacional, no captación SEO principal) — coincide exactamente con el hallazgo T-12 ya documentado desde `SEO-TECHNICAL-TUTORIAL-01` (2026-07-01) y nunca ejecutado.
3. El riesgo de solapamiento de intención con `/blog/metodo-kakebo-guia-definitiva` (sección 7) es real a nivel de título/contenido, pero no está confirmado por datos de GSC — no justifica una acción más agresiva (C/D/E) todavía.

## 10. Siguiente tarea recomendada

**`SEO-TECHNICAL-TUTORIAL-PRIORITY-IMPL-01`** — bajar la prioridad de `/tutorial` en `src/app/sitemap.ts` de `0.8` a un valor coherente con su función de onboarding (recomendado: `0.5`), sin tocar ningún otro campo del sitemap ni de la página. Tarea técnica atómica, P2, sin dependencias, ejecutable de inmediato — no requiere esperar al snapshot GSC del 2026-07-17/31.

**Tarea adicional a considerar tras el snapshot GSC (no antes):** si el snapshot del 2026-07-17/31 muestra que `/tutorial` y `/blog/metodo-kakebo-guia-definitiva` compiten por las mismas queries de "método kakebo", evaluar una tarea de contenido futura para reencuadrar el title/meta/H1 de `/tutorial` hacia "cómo usar la app" en lugar de "qué es el método Kakebo" — **no se propone como tarea inmediata**, solo como hipótesis a validar con datos.

## 11. Qué NO se ha modificado

- No se ha tocado `src/app/[locale]/(public)/tutorial/page.tsx`.
- No se ha tocado `src/app/sitemap.ts` (la prioridad `0.8` sigue igual — el cambio queda propuesto para la tarea de implementación futura).
- No se ha tocado `robots.ts`, canonical, hreflang ni ningún schema.
- No se ha tocado ningún artículo de blog, ninguna herramienta, ni `/blog/plantilla-kakebo-excel`.
- No se ha aplicado `noindex`.
- No se ha creado ni publicado contenido nuevo.
- No se ha hecho ninguna redirección.

---

*SEO_TECHNICAL_TUTORIAL_PRIORITY_01.md — creado 2026-07-09*
*Solo auditoría y decisión documentada — sin cambios en código, contenido ni configuración SEO*
