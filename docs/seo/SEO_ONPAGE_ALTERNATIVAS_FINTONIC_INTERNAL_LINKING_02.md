# SEO-ONPAGE-ALTERNATIVAS-FINTONIC-INTERNAL-LINKING-02

**Tipo:** Implementación quirúrgica de enlazado interno contextual
**Fecha de ejecución:** 2026-07-20
**Milestone:** SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02 (no se marca completo en esta tarea)
**Tareas previas:** `VALIDATION-02` (`035ed25`), `KEYWORD-SERP-02` (`0a946c3`), `ARCHITECTURE-02` (`6f6a4d8`), `SNIPPET-02` (`de7efe1`), `CONTENT-INTRO-02` (`6ad176d`), `HEADINGS-02` (`fde6c76`), `SOURCES-02` (`58e7d42`), `FAQ-GEO-02` (`236f67f`)
**URL objetivo:** `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`

---

## 1. Resumen ejecutivo

Se ha implementado el único enlace saliente inequívocamente aprobado en la arquitectura (sección 13, punto 1): un enlace contextual hacia la calculadora de ahorro, con el anchor sugerido literalmente por la arquitectura ("calcula cuánto puedes ahorrar cada mes"), insertado como una única frase nueva al final de la sección "Privacidad frente a comodidad: no son excluyentes" — el único punto del cuerpo donde la sección de cierre/conclusión propuesta en `ARCHITECTURE-02` (marcada como opcional y no implementada en `HEADINGS-02`) podía insertarse sin crear un heading nuevo, prohibido explícitamente en esta tarea.

Para los enlaces entrantes, la arquitectura no aprueba ninguna modificación inequívoca dentro del alcance de esta tarea: el único candidato identificado (el anchor de `CalculatorInflation.tsx`) está explícitamente diferido a "una tarea de i18n/UI separada, fuera de alcance de `ARCHITECTURE-02` y del contenido MDX" (sección 13, punto 2). Aplicando la regla de bloqueo del prompt ("si la arquitectura no especifica con claridad qué enlaces deben implementarse... limitarse a los enlaces inequívocos"), **no se ha modificado ningún archivo de origen de enlaces entrantes** en esta tarea. Los 4 entrantes ya confirmados (`peligros-apps-ahorro-automatico`, `kakebo-vs-ynab`, `kakebo-online-gratis`, `como-ahorrar-dinero-cada-mes`) están explícitamente listados en la arquitectura como "enlaces que deben protegerse", no como candidatos a modificación.

No se ha detectado ningún enlace interno (entrante o saliente) hacia la variante legacy `/es/blog/alternativas-a-app-bancarias`.

No se ha modificado metadata, H1, headings, tabla, fichas (salvo la frase mínima aprobada), FAQ, CTA, fuentes externas ni schema.

---

## 2. Estado del repositorio

| Comprobación | Resultado |
|---|---|
| `git status` | Mismos cambios locales ajenos preexistentes de las tareas anteriores del milestone (`.claude/settings.local.json`, submódulo `kakebo`, y untracked `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`). No se ha tocado ninguno. |
| `git branch --show-current` | `main` |
| `git fetch origin` | Sin cambios remotos nuevos |
| `git log -1 --oneline` (local) | `236f67f seo(fintonic): improve faq for search and geo` |
| `git log origin/main -1 --oneline` | `236f67f seo(fintonic): improve faq for search and geo` |
| `git diff origin/main..HEAD` | Vacío — rama local idéntica a `origin/main` |

Se releyeron íntegramente `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`, los cuatro documentos SEO del milestone, el MDX completo, y se inspeccionó `CustomLink` (`src/components/mdx/MDXComponents.tsx`) como componente responsable del renderizado de enlaces internos/externos en el cuerpo del artículo.

---

## 3. Inventario de enlaces salientes (anterior a esta tarea)

| URL destino | Anchor | Ubicación | Intención | Estado HTTP | Relevancia | Decisión |
|---|---|---|---|---|---|---|
| `/blog/kakebo-vs-ynab` | "comparativa Kakebo vs YNAB" | Ficha YNAB, "Para quién es" | Profundizar comparativa YNAB vs. método Kakebo | 200 | Alta | Mantener, no tocar |
| `/blog/metodo-kakebo-guia-definitiva` | "método Kakebo" | Sección "Kakebo AI: la alternativa sin conexión bancaria" | Definir el método Kakebo | 200 | Alta | Mantener, no tocar (la arquitectura señala explícitamente que no debe añadirse un segundo enlace hacia esta URL) |
| 4 posts vía `related` (frontmatter) → `RelatedPosts` | Título + extracto de cada post | Bloque automático "Artículos relacionados" | Navegación relacionada | 200 (los 4) | Alta | Fuera de alcance — componente automático, no se toca |
| `/` (CTA) | "Regístrate en Kakebo AI sin conectar el banco ni introducir tarjetas" | CTA final | Conversión | 200 | Alta | Protegido, no se toca |
| 6 fuentes oficiales externas (`SOURCES-02`) | Nacionalidad/modelo de negocio de cada app | Párrafos descriptivos de fichas + nota de tabla | Trazabilidad factual | 200 (las 6) | Alta | Protegidas, no se tocan (fuera del alcance de enlazado *interno*) |

---

## 4. Inventario de enlaces entrantes (anterior a esta tarea)

| URL origen | Archivo | Anchor | Contexto | Profundidad | Relevancia | Riesgo de canibalización |
|---|---|---|---|---|---|---|
| `/blog/peligros-apps-ahorro-automatico` | `peligros-apps-ahorro-automatico.es.mdx` | "Alternativas a apps bancarias para controlar gastos sin conectar el banco" | Enlace en lista de "artículos relacionados" del cuerpo + `related` frontmatter | 2 clics desde home | Alta | Ninguno |
| `/blog/kakebo-vs-ynab` | `kakebo-vs-ynab.es.mdx` | "Alternativas a apps bancarias para controlar gastos sin conectar el banco" | Enlace en lista de "artículos relacionados" del cuerpo + `related` frontmatter | 2 clics desde home | Alta | Ninguno |
| `/blog/kakebo-online-gratis` | `kakebo-online-gratis.es.mdx` | "Alternativa a Fintonic sin conexión bancaria" | Enlace en lista de "artículos relacionados" del cuerpo | 2 clics desde home | Alta | Ninguno (ya usa "Fintonic" en el anchor) |
| `/blog/como-ahorrar-dinero-cada-mes` | `como-ahorrar-dinero-cada-mes.es.mdx` | "Alternativas a apps bancarias para controlar gastos sin conectar el banco" | Enlace en lista de "artículos relacionados" del cuerpo | 2 clics desde home | Alta | Ninguno |
| `/blog/alternativas-a-app-bancarias` (herramienta) | `src/components/landing/tools/CalculatorInflation.tsx` + `messages/es.json` (`content.link1`) | "Alternativas a las apps bancarias que leen tus datos" | Enlace contextual dentro de la calculadora de inflación | 1 clic desde home | Media-alta (herramienta con tráfico orgánico) | Ninguno — pero anchor no usa "Fintonic" |

**Nota sobre `CalculatorInflation.tsx`:** identificado en `ARCHITECTURE-02` como el único candidato a revisión de anchor, pero explícitamente diferido a una tarea de i18n/UI separada porque el cambio implicaría tocar `messages/es.json` (contenido i18n compartido, no un artículo MDX individual) y un componente de herramienta con señales orgánicas (`/herramientas/calculadora-inflacion`). Fuera del alcance de esta tarea — **no modificado**.

---

## 5. Enlaces legacy detectados

Se realizó una búsqueda de `/es/blog/alternativas-a-app-bancarias` y `/en/blog/alternativas-a-app-bancarias` en todo `src/` (contenido y componentes). **No se ha encontrado ningún enlace interno del sitio que apunte a la variante `/es/` de esta URL.** Los únicos enlaces internos existentes hacia el artículo ya usan la ruta canónica sin prefijo (`/blog/alternativas-a-app-bancarias`). No fue necesaria ninguna corrección de rutas legacy.

---

## 6. Criterios aplicados

Se aplicaron los 10 criterios de selección del prompt a cada candidato de enlace saliente y entrante. Solo el enlace hacia `/herramientas/calculadora-ahorro` cumplió los 10 criterios simultáneamente (relación semántica clara tras elegir alternativa, ayuda práctica al usuario, URL activa y canonical — verificado 200 OK —, no compite por la intención principal de la página, anchor natural e integrable, no duplica ningún enlace cercano, no obliga a reescribir ningún bloque, destino no es débil/legacy/noindex, aprobado literalmente en la arquitectura, no perjudica ninguna URL tractora existente).

Ningún otro candidato (enlaces entrantes nuevos, enlace hacia `regla-50-30-20` en paralelo al de `calculadora-ahorro`, modificación del anchor de `CalculatorInflation.tsx`) cumplió simultáneamente el criterio 9 (aprobación inequívoca en la arquitectura) sin invocar la regla de bloqueo del prompt.

---

## 7. Enlaces salientes añadidos

| URL destino | Anchor | Ubicación | Frase anterior | Frase final | Utilidad | Intención secundaria cubierta | Riesgo de canibalización |
|---|---|---|---|---|---|---|---|
| `/herramientas/calculadora-ahorro` | "calculadora de ahorro" | Final de la sección "Privacidad frente a comodidad: no son excluyentes", inmediatamente antes de la FAQ | (no existía frase — se añadió una nueva, ver siguiente columna) | "Una vez elijas la alternativa que mejor encaja contigo, el siguiente paso es ponerle una meta: la [calculadora de ahorro](/herramientas/calculadora-ahorro) te ayuda a calcular cuánto puedes ahorrar cada mes." | Guía al usuario hacia el siguiente paso lógico tras decidir qué app usar | Transición de la intención comparativa a la intención de planificación de ahorro, sin desviar la intención principal del artículo | Ninguno — la calculadora de ahorro no compite por "alternativas a Fintonic" |

**Justificación de la ubicación:** la arquitectura proponía este enlace "en la sección de cierre/conclusión propuesta (sección 7)" de `ARCHITECTURE-02` — un H2 "En resumen: ¿cuál elegir?" marcado como *opcional* que **no se implementó** en `HEADINGS-02` (solo se aprobaron e implementaron 2 headings en esa tarea). Como esta tarea prohíbe explícitamente crear headings o secciones nuevas, se ha insertado la frase en el punto más equivalente ya existente: el final del último bloque de contenido editorial antes de la FAQ, que cumple la misma función de cierre sin requerir un heading nuevo.

---

## 8. Enlaces entrantes añadidos

**Ninguno.** Por la regla de bloqueo del prompt: la arquitectura no aprueba de forma inequívoca ninguna modificación de enlace entrante dentro del alcance de esta tarea. El único candidato (`CalculatorInflation.tsx`) está explícitamente diferido a una tarea separada. Los 4 entrantes existentes están clasificados en la arquitectura como "enlaces que deben protegerse", no como candidatos a refuerzo.

**Propuesta pendiente documentada (no implementada):** revisar el anchor "Alternativas a las apps bancarias que leen tus datos" de `CalculatorInflation.tsx` (vía `messages/es.json`, clave `Tools.Inflation.content.link1`) para incluir "Fintonic", en una futura tarea de i18n/UI con su propio alcance y validación, tal como recomienda `ARCHITECTURE-02`.

---

## 9. Enlaces corregidos

**Ninguno.** No se detectó ningún enlace interno hacia la variante `/es/` ni hacia ninguna ruta incorrecta relacionada con esta URL (ver sección 5).

---

## 10. URLs origen modificadas

**Ninguna.** El único cambio de contenido de esta tarea está en la propia URL objetivo (`src/content/blog/alternativas-a-app-bancarias.es.mdx`), no en ningún archivo de origen de enlaces entrantes.

---

## 11. Anchors utilizados

- "calculadora de ahorro" — descriptivo, no genérico, no comercial, no repite "alternativas a Fintonic" (evita sobreoptimización de anchor), coherente con el patrón de anchors ya usado en el resto del artículo (p. ej. "comparativa Kakebo vs YNAB", "método Kakebo").

---

## 12. Enlaces descartados y motivo

| Enlace candidato | Motivo del descarte |
|---|---|
| Enlace saliente adicional hacia `/herramientas/regla-50-30-20` en paralelo al de `calculadora-ahorro` | La arquitectura aprueba "calculadora-ahorro **o** regla-50-30-20", no ambos; añadir los dos habría sido enlazar "por cantidad", explícitamente prohibido |
| Enlace saliente nuevo hacia `/blog/metodo-kakebo-guia-definitiva` | La arquitectura indica explícitamente que no debe añadirse un segundo enlace, ya cubierto por el existente (línea 218 original) |
| Enlaces salientes hacia las webs oficiales de Fintonic, Spendee, Toshl, Money Manager, Emma o YNAB | Explícitamente excluidos por la arquitectura (sección 13, punto 6) — decisión editorial fuera del alcance de esta tarea |
| Modificación del anchor entrante de `CalculatorInflation.tsx` | Diferido explícitamente a una tarea de i18n/UI separada, fuera de alcance |
| Enlace entrante nuevo desde alguna otra URL del blog | Ningún candidato con aprobación inequívoca en la arquitectura; añadirlo habría sido una "campaña amplia de enlazado", explícitamente prohibida por la regla de bloqueo |
| Enlace entrante nuevo desde la home | La arquitectura indica explícitamente "no se recomienda forzar un enlace desde home en esta arquitectura" |

---

## 13. Riesgos de canibalización

Ninguno detectado. El nuevo enlace saliente apunta a una herramienta (`calculadora-ahorro`) con una intención de búsqueda completamente distinta (cálculo de ahorro mensual, no comparativa de apps) — no compite por "alternativas a Fintonic" ni por ninguna de sus variantes. No se han tocado enlaces entrantes, por lo que no se introduce ningún riesgo nuevo de canibalización en ese frente.

---

## 14. URLs tractoras protegidas

- `/herramientas/calculadora-ahorro` (destino del nuevo enlace): **no modificada** — solo se añadió un enlace hacia ella desde otra página; prioridad 0.9 en sitemap, confirmada activa (200 OK) antes y después de esta tarea.
- `/herramientas/calculadora-inflacion` (destino de `CalculatorInflation.tsx`, candidato descartado): **no modificada**, por decisión explícita de no tocarla en esta tarea.
- `/blog/plantilla-kakebo-excel`: no involucrada en ningún candidato de esta tarea — no tocada.
- Home `/`: no involucrada — no tocada.

---

## 15. Validación HTTP

| URL | Código HTTP | Notas |
|---|---|---|
| `/herramientas/calculadora-ahorro` (producción) | 200 | Verificado antes de implementar |
| `/herramientas/calculadora-ahorro` (local, tras el cambio) | 200 | Verificado tras el build, sin alteración |
| `/blog/alternativas-a-app-bancarias` (local) | 200 | URL objetivo, verificada tras el cambio |
| `/es/blog/alternativas-a-app-bancarias` (local) | 308 → `/blog/alternativas-a-app-bancarias` | Sin cambios de comportamiento |
| `/en/blog/alternativas-a-app-bancarias` (local) | 200, `noindex, nofollow` | Sin cambios de comportamiento |

---

## 16. Validación del HTML

Verificado en HTML renderizado (build de producción, servidor local, 2026-07-20):
- `<title>` único: "Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones | Blog Kakebo" — intacto.
- `<meta name="description">` única — intacta.
- H1 único: "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos" — intacto.
- `canonical`: `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` — intacto.
- 9 H2 y 19 H3 — mismos totales que antes de esta tarea, ningún heading nuevo.
- `FAQPage` JSON-LD con 6 preguntas — intacto, mismo conteo que `FAQ-GEO-02`.
- `BreadcrumbList` — intacto.
- CTA "Regístrate en Kakebo AI sin conectar el banco ni introducir tarjetas" — presente, sin cambios.
- Nuevo enlace renderizado correctamente: `<a class="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors" href="/herramientas/calculadora-ahorro">calculadora de ahorro</a>` — sin `target="_blank"` (correcto, es un enlace interno), sin parámetros ni fragmentos.

---

## 17. Elementos protegidos

Confirmado que se han mantenido intactos: metadata (`title`, `seoTitle`, `description`), H1, introducción (`CONTENT-INTRO-02`), headings (`HEADINGS-02`), tabla comparativa, las 8 fichas (salvo la frase mínima aprobada, fuera de cualquier ficha individual — se insertó en la sección "Privacidad frente a comodidad", no en ninguna ficha de app), pros y contras, las 6 fuentes oficiales de `SOURCES-02`, la FAQ de 6 preguntas (`FAQ-GEO-02`), el CTA, el schema `BlogPosting`/`FAQPage`/`BreadcrumbList`, el canonical, el hreflang, el redirect 308 de `/es/`, el `noindex` de `/en/`, el slug, y el orden de las 8 alternativas.

---

## 18. Conclusión

Se implementó exactamente el único enlace saliente aprobado sin ambigüedad por la arquitectura, en la ubicación funcionalmente más próxima a la propuesta original sin infringir la prohibición de crear headings nuevos. No se realizó ninguna modificación de enlazado entrante por ausencia de aprobación inequívoca en la arquitectura, aplicando la regla de bloqueo del prompt en lugar de improvisar una campaña de enlazado. No se detectaron enlaces legacy que corregir.

---

## 19. Siguiente tarea recomendada

**`SEO-ONPAGE-ALTERNATIVAS-FINTONIC-PRODUCTION-VALIDATION-02`**
