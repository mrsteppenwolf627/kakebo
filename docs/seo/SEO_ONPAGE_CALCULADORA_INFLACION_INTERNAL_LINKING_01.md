# SEO-ONPAGE-CALCULADORA-INFLACION-INTERNAL-LINKING-01 — Reforzar enlazado interno entrante

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-INTERNAL-LINKING-01`
**Tipo:** Enlazado interno editorial selectivo. Sin nuevas URLs, sin backlinks externos, sin cambios en la calculadora.

## 1. Objetivo

Auditar y mejorar de forma selectiva los enlaces internos que apuntan hacia `https://www.metodokakebo.com/herramientas/calculadora-inflacion`, añadiendo únicamente enlaces contextuales y relevantes desde páginas existentes de MetodoKakebo.com, sin crear nuevas URLs ni modificar la funcionalidad de la calculadora.

## 2. Commit base

`af9310c83dee0fc3249eb284fc136a1b71bc8307` (`fix(seo): corregir textos concatenados en calculadora de inflación`, `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01`), rama `main`, sincronizada con `origin/main` al iniciar.

## 3. Inventario previo de enlaces entrantes

Búsqueda exhaustiva de `calculadora-inflacion` en `src/` (10 archivos con coincidencias antes de esta tarea):

| Origen | Anchor | Contexto | Tipo | Dofollow | Contexto semántico real |
|---|---|---|---|---|---|
| `Navbar.tsx` (desktop, dropdown "Herramientas") | "Calculadora Inflación" + descripción | Menú de navegación global | Global/navegación | Sí | No (navegacional, aparece en todas las páginas) |
| `Navbar.tsx` (menú móvil) | "Calculadora Inflación" | Menú de navegación global (móvil) | Global/navegación | Sí | No (navegacional) |
| `Footer.tsx` | "Calculadora Inflación" | Columna "Producto" del footer | Global/footer | Sí | No (navegacional, aparece en todas las páginas) |
| `ToolsSection.tsx` (Home) | Tarjeta con título/descripción | Sección "Herramientas" de la home | Tarjeta/navegacional | Sí | Parcial (tarjeta de producto, no editorial) |
| `(public)/herramientas/page.tsx` (hub) | "Calculadora Inflación" + descripción | Hub `/herramientas` | Tarjeta/hub | Sí | Parcial (listado de herramientas) |
| `SavingsCalculator.tsx` | Enlace en la sección de contenido SEO/GEO de la calculadora de ahorro | Interlinking editorial dentro de otra herramienta | Editorial | Sí | Sí (cross-sell contextual entre herramientas) |
| `fondo-de-emergencia.es.mdx` (línea 137) | "calculadora de inflación" | Párrafo de cuerpo, tras hablar de dinero parado | Editorial | Sí | Sí (contextual, tema directamente relacionado) |
| `cuentas-remuneradas.es.mdx` (línea 176-178) | Bloque `ToolCTA`/similar, título + CTA "Abrir calculadora de inflación →" | Bloque de llamada a la acción dentro del artículo | Editorial (componente CTA) | Sí | Sí (contextual, sobre rendimiento del efectivo) |
| `cuentas-remuneradas.es.mdx` (línea 291) | "la calculadora de inflación" | Párrafo de cuerpo | Editorial | Sí | Sí (contextual, refuerza el mismo tema) |
| `CalculatorInflation.tsx` (`toolPath`) | — | Prop interno del `EmbedModal` de la propia calculadora | Autorreferencial | N/A | No es un enlace entrante (es la propia página) |
| `page.tsx` (canonical/hreflang/schema) | — | Metadata y JSON-LD de la propia página | Técnico | N/A | No es un enlace entrante de otra página |
| `sitemap.ts` | — | Entrada técnica del sitemap | Técnico | N/A | No es un enlace de contenido |

**Resumen antes de la tarea:**
- Enlaces globales/navegación: 3 (`Navbar` ×2, `Footer` ×1) + 2 de tipo tarjeta/hub (`ToolsSection`, hub `/herramientas`).
- Enlaces editoriales reales (dentro de prosa o CTA de artículo/herramienta): **4**, repartidos en **3 páginas** (`fondo-de-emergencia`, `cuentas-remuneradas` ×2, `SavingsCalculator`).
- Ningún enlace duplicado con el mismo anchor exacto en más de una página (los anchors ya variaban: "calculadora de inflación", "la calculadora de inflación", CTA "Abrir calculadora de inflación →").

## 4. Páginas candidatas revisadas

Se revisó el contenido completo (`grep` de "inflaci", "IPC", "poder adquisitivo", y lectura de secciones relevantes) de los 18 artículos de blog en español, priorizando los que hablan de ahorro, presupuesto, fondo de emergencia, cuentas remuneradas e inversión:

| Página | Relevancia encontrada | Decisión |
|---|---|---|
| `plantilla-kakebo-excel.es.mdx` | Ya menciona "inflación" en una cita textual sobre el ahorro; es la landing orgánica de mayor tráfico/autoridad del sitio; auditorías previas (`PROJECT_STATUS.md`) ya señalaban la ausencia de enlace hacia `calculadora-inflacion` como hueco pendiente | **Añadido** |
| `como-hacer-un-presupuesto-personal.es.mdx` | Sección "Cómo distribuir el ahorro entre horizontes temporales" habla explícitamente de ahorro a largo plazo (jubilación, independencia financiera), contexto natural para el riesgo de inflación | **Añadido** |
| `regla-50-30-20-ejemplo.es.mdx` | Sección "Cómo calcular tu caso" ya recomienda la calculadora de ahorro como "siguiente paso" tras fijar el bloque de ahorro del 20%; extensión natural hacia la calculadora de inflación | **Añadido** |
| `como-ahorrar-dinero-cada-mes.es.mdx` | Artículo de técnicas de ahorro a corto plazo/comportamiento; sin ningún párrafo sobre pérdida de valor a largo plazo | Descartada (ver sección 6) |
| `ahorro-pareja.es.mdx` | Contenido centrado en el reparto de gastos y cuentas entre miembros de la pareja, sin sección sobre horizonte temporal ni pérdida de valor | Descartada (ver sección 6) |
| `kakebo-sueldo-minimo.es.mdx` | Contenido centrado en presupuestos muy ajustados y construcción de fondo de emergencia a corto plazo; forzar el tema de inflación no encajaría con el enfoque del artículo | Descartada (ver sección 6) |
| `metodo-kakebo-guia-definitiva.es.mdx` | Pilar semántico del sitio (mayor autoridad interna); sin ninguna mención a inflación/IPC en el contenido actual; añadir el tema requeriría una frase nueva sin apoyo textual previo | Descartada (ver sección 6) |
| `eliminar-gastos-hormiga.es.mdx`, `kakebo-vs-ynab.es.mdx`, `regla-30-dias.es.mdx`, `kakebo-online-*`, `alternativas-a-app-bancarias.es.mdx`, `peligros-apps-ahorro-automatico.es.mdx`, `metodo-kakebo-para-autonomos.es.mdx`, `libro-kakebo-pdf.es.mdx` | Sin relación temática directa con inflación, IPC o pérdida de poder adquisitivo en su contenido actual | Descartadas sin forzar enlace |
| `fondo-de-emergencia.es.mdx`, `cuentas-remuneradas.es.mdx`, `SavingsCalculator.tsx` | Ya enlazan a la calculadora de inflación | No aplica (ya cuentan con enlace) |

## 5. Riesgos de canibalización

Ninguna de las 3 páginas de origen elegidas tiene como intención principal posicionar por "calculadora de inflación" ni por ninguna variante de esa keyword:

- `plantilla-kakebo-excel.es.mdx` — intención: plantilla Excel del método Kakebo.
- `como-hacer-un-presupuesto-personal.es.mdx` — intención: cómo hacer un presupuesto personal.
- `regla-50-30-20-ejemplo.es.mdx` — intención: ejemplos de la regla 50/30/20.

No se ha detectado ningún riesgo de canibalización: los tres artículos mantienen su intención principal intacta (no se ha añadido la keyword "calculadora de inflación España" en ningún title, H1, H2 ni frase que compita por esa intención) y el enlace añadido es una única frase de transición hacia una herramienta relacionada, no un bloque de contenido nuevo sobre inflación.

## 6. Enlaces descartados y motivo

- **`como-ahorrar-dinero-cada-mes.es.mdx`** — descartado. El artículo son 15 técnicas de ahorro a corto plazo/comportamiento (auditoría de suscripciones, batch cooking, redondeo automático); no existe ningún párrafo sobre el valor del dinero a largo plazo donde insertar el enlace sin que resulte forzado.
- **`ahorro-pareja.es.mdx`** — descartado. El contenido gira en torno a modelos de cuentas y reparto de gastos entre la pareja; no hay una sección natural sobre inflación o pérdida de poder adquisitivo.
- **`kakebo-sueldo-minimo.es.mdx`** — descartado. El artículo trata sobre presupuestos muy ajustados y la construcción de un fondo de emergencia a corto plazo con el salario mínimo; introducir el tema de la inflación no aportaría valor real al lector en ese contexto y resultaría forzado.
- **`metodo-kakebo-guia-definitiva.es.mdx`** (pilar semántico) — descartado pese a su alta autoridad interna, precisamente por ser el pilar del sitio: no contiene ninguna mención previa a inflación/IPC, y forzar una frase nueva sin apoyo textual habría ido en contra de la restricción de "no alterar la intención principal de la página" y "no añadir keywords artificialmente".
- Resto de artículos de blog sin relación temática (`eliminar-gastos-hormiga`, `kakebo-vs-ynab`, `regla-30-dias`, `kakebo-online-gratis`, `kakebo-online-guia-completa`, `alternativas-a-app-bancarias`, `peligros-apps-ahorro-automatico`, `metodo-kakebo-para-autonomos`, `libro-kakebo-pdf`) — descartados sin forzar enlace, conforme a la restricción de "no añadir enlaces desde páginas irrelevantes".

## 7. Enlaces añadidos

Se implementaron **3 enlaces nuevos** (dentro del rango de 3 a 5 solicitado), uno por página, todos mediante enlace markdown estándar (`[texto](url)`), que el proyecto renderiza automáticamente a través de `CustomLink` en `src/components/mdx/MDXComponents.tsx` como el componente `Link` interno de `@/i18n/routing` — mismo comportamiento que los enlaces editoriales ya existentes (locale-aware, sin `target="_blank"`, sin `nofollow`, mismos estilos `text-primary hover:underline`).

| Página origen | Bloque | Anchor propuesto | Motivo | Riesgo |
|---|---|---|---|---|
| `plantilla-kakebo-excel.es.mdx` | Tras la cita "El principal enemigo del ahorro no es la inflación..." (sección "¿Por qué el Excel (casi) siempre suele fracasar?") | "calcula cómo afecta la inflación a tus ahorros" | Continúa el tema que la propia cita introduce, sin contradecirla; página de mayor autoridad del sitio sin enlace previo hacia la calculadora | Bajo — una frase añadida, no reescribe la cita |
| `como-hacer-un-presupuesto-personal.es.mdx` | Sección "Cómo distribuir el ahorro entre horizontes temporales" | "pérdida de poder adquisitivo" | El ahorro a largo plazo (jubilación, independencia financiera) es precisamente donde la erosión por inflación es relevante | Bajo — frase de cierre de sección, no altera la estructura |
| `regla-50-30-20-ejemplo.es.mdx` | Sección "Cómo calcular tu caso con la calculadora 50/30/20", justo después de la recomendación de la calculadora de ahorro | "calculadora de inflación" | Extiende de forma natural la cadena "calcula tu 20%→ calculadora de ahorro → [nuevo] calculadora de inflación" ya presente en el artículo | Bajo — una frase añadida al final del párrafo existente |

## 8. Anchors utilizados

Los 3 anchors nuevos son distintos entre sí y ninguno reproduce la keyword completa "calculadora de inflación España" (evitando sobreoptimización):

1. "calcula cómo afecta la inflación a tus ahorros"
2. "pérdida de poder adquisitivo"
3. "calculadora de inflación"

Ninguno usa fórmulas genéricas tipo "haz clic aquí"; los tres van integrados dentro de una frase completa con contexto propio.

## 9. Inventario final

**Globales / navegación (sin cambios, 3):**
- `Navbar.tsx` — dropdown desktop + menú móvil.
- `Footer.tsx` — columna "Producto".

**Tarjetas / hub (sin cambios, 2):**
- `ToolsSection.tsx` (Home).
- `(public)/herramientas/page.tsx` (hub `/herramientas`).

**Editoriales ya existentes antes de esta tarea (sin cambios, 4, en 3 páginas):**
- `fondo-de-emergencia.es.mdx` (1).
- `cuentas-remuneradas.es.mdx` (2: bloque CTA + párrafo).
- `SavingsCalculator.tsx` (1, dentro de la calculadora de ahorro).

**Editoriales añadidos en esta tarea (nuevos, 3, en 3 páginas):**
- `plantilla-kakebo-excel.es.mdx` (1).
- `como-hacer-un-presupuesto-personal.es.mdx` (1).
- `regla-50-30-20-ejemplo.es.mdx` (1).

**Total de páginas con enlace editorial real hacia la calculadora tras esta tarea:** 6 (más las 4 globales/tarjeta que no forman parte del enlazado editorial pero también contribuyen).

No se han añadido enlaces nuevos en `Navbar`, `Footer`, menús ni ningún componente compartido — solo contenido editorial de página.

## 10. Archivos modificados

- `src/content/blog/plantilla-kakebo-excel.es.mdx` (+2 líneas)
- `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx` (+2 líneas)
- `src/content/blog/regla-50-30-20-ejemplo.es.mdx` (+2 líneas)
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_INTERNAL_LINKING_01.md` (nuevo, este documento)

No se ha modificado `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx`, `CalculatorInflation.tsx`, `messages/es.json`, `messages/en.json` ni ninguna otra herramienta.

## 11. Validaciones

- `npx tsc --noEmit` ✅ 0 errores.
- `npm run lint` ✅ 0 errores (76 warnings preexistentes, sin cambios).
- `npm run build` ✅ Compiled successfully; las 3 rutas de blog y la calculadora de inflación presentes en el build.
- Servidor local (`npm run start`) + verificación de las 4 páginas relevantes (200 OK): `/blog/plantilla-kakebo-excel`, `/blog/como-hacer-un-presupuesto-personal`, `/blog/regla-50-30-20-ejemplo`, `/herramientas/calculadora-inflacion`.
- HTML renderizado: los 3 nuevos `<a href="/herramientas/calculadora-inflacion">` confirmados con el anchor correcto, clase `text-primary hover:underline...` (estilo editorial estándar del proyecto), **sin** `target="_blank"` y **sin** `rel="nofollow"`.
- Verificación visual (navegador real) en `regla-50-30-20-ejemplo`: el nuevo enlace se integra en el flujo de la frase sin salto de línea ni cambio de estilo respecto al resto de enlaces editoriales del artículo.
- Repetición de la búsqueda global `calculadora-inflacion` en `src/`: 13 archivos (antes 10) — coincide exactamente con las 3 páginas nuevas.
- `/herramientas/calculadora-inflacion` verificado sin cambios: `meta description`, `title` idénticos a las tareas anteriores; 1 único `<footer>`; jerarquía de headings sin alterar (1×H1, 6×H2, 9×H3, igual que en `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01`).
- Ningún enlace roto: las 3 URLs de destino son la misma URL ya validada (`/herramientas/calculadora-inflacion`, HTTP 200 en todas las páginas probadas).
- No se han detectado enlaces duplicados innecesarios: cada página de origen tiene exactamente un enlace editorial nuevo hacia la calculadora, y ningún anchor se repite entre las 3 páginas.

## 12. Confirmación de ausencia de cambios en la calculadora

No se ha modificado `page.tsx` ni `CalculatorInflation.tsx` de la calculadora de inflación. `meta description`, `title`, `canonical`, schema (`SoftwareApplication`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`), headings, Footer único y tracking permanecen exactamente como quedaron tras `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01`. Los cambios de esta tarea son exclusivamente en las 3 páginas de origen del enlace.

**Cambios ajenos a esta tarea** (`.claude/settings.local.json`, subdirectorio anidado `kakebo`, archivos untracked preexistentes) quedaron intactos, sin stage ni commit.

## 13. Riesgos pendientes

- Los 3 nuevos enlaces se han añadido solo en la versión en español (`.es.mdx`), conforme al alcance de la tarea (keyword "calculadora de inflación España", mercado hispanohablante). `regla-50-30-20-ejemplo.es.mdx` no tiene versión `.en.mdx` en el repositorio, pero `plantilla-kakebo-excel.en.mdx` y `como-hacer-un-presupuesto-personal.en.mdx` **sí existen** y no se han tocado — queda pendiente evaluar en una tarea futura si conviene añadir el enlace equivalente en inglés hacia `/en/herramientas/calculadora-inflacion` para mantener paridad editorial entre locales.
- El impacto real del enlazado en el posicionamiento de `/herramientas/calculadora-inflacion` no podrá medirse hasta el próximo snapshot de Google Search Console.
- Quedan artículos sin enlace hacia la calculadora que podrían ser candidatos futuros si su contenido evoluciona (p. ej. si `metodo-kakebo-guia-definitiva.es.mdx` incorpora en el futuro una sección sobre el efecto de la inflación en el método Kakebo).
- Los hallazgos aún no cerrados de la auditoría original (`SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01`) — contenido "parcialmente genérico" frente a la SERP y ausencia de backlinks externos — siguen pendientes y no forman parte de esta tarea.

## 14. Siguiente tarea única recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-BACKLINKS-01` — investigación de backlinks y autoridad externa (hallazgo 9 de la auditoría original), único hallazgo de la auditoría inicial sin cerrar, junto con la comparación de contenido frente a la SERP (ambos fuera de alcance de cambios de código).
