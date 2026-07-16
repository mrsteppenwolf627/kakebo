# VALIDACIÓN SEO ON-PAGE — Calculadora de Inflación

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01`
**Tipo:** Auditoría, validación y documentación. Sin implementación.

## 1. Objetivo y alcance

Verificar en el código, en el HTML renderizado y en producción el estado SEO On-Page real de `https://www.metodokakebo.com/herramientas/calculadora-inflacion`, en relación con la keyword principal **"calculadora de inflación España"** y su cluster asociado, y clasificar cada uno de los 10 hallazgos reportados por SE Ranking (puntuación 70/100) como CONFIRMADO, DESCARTADO, PARCIAL o REQUIERE DATOS ADICIONALES.

No se ha modificado código, contenido, metadata, diseño ni funcionalidad. No se ha creado otra URL ni cambiado el slug. No se ha investigado la SERP ni herramientas de backlinks.

## 2. Fecha y commit base

- **Fecha de la auditoría:** 2026-07-16
- **Commit base (kakebo, `main`):** `569853e00120f879221263987f4eff500c098dd0` (`CRO: fix Excel article CTA destination`, 2026-07-13)
- **Rama:** `main`, sincronizada con `origin/main` en el momento de iniciar la auditoría.
- **URL auditada:** `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (HTTP 200 verificado)

## 3. Archivos revisados

- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` — route, `generateMetadata`, schema JSON-LD, `BreadcrumbList`.
- `src/components/landing/tools/CalculatorInflation.tsx` — componente de la calculadora (inputs, fórmula, resultados, gráfico, CTA, contenido SEO/GEO).
- `src/app/[locale]/layout.tsx` — layout raíz (metadata global, `Footer`, `CookieBanner`, providers).
- `src/components/landing/Footer.tsx` — footer compartido (encabezados "Producto", "Cuenta", "Legal").
- `src/components/landing/Navbar.tsx` — navegación compartida (dropdown de herramientas, sin encabezados).
- `src/components/landing/CookieBanner.tsx` — banner de cookies (botón "Aceptar").
- `messages/es.json` — namespace `Tools.Inflation` (meta, header, inputs, results, chart, cta, content/FAQ).
- `src/app/sitemap.ts` — presencia y prioridad de la URL.
- `src/content/blog/fondo-de-emergencia.es.mdx`, `src/content/blog/cuentas-remuneradas.es.mdx` — enlaces entrantes desde blog.
- `src/components/landing/ToolsSection.tsx`, `src/app/[locale]/(public)/herramientas/page.tsx`, `src/components/landing/tools/SavingsCalculator.tsx` — enlaces internos adicionales hacia la calculadora.
- HTML servido en producción (`curl` con user-agent identificado, HTTP 200) — metadata real, headings, hrefs, schema.

## 4. Estado del repositorio

Al iniciar la auditoría (`git status`, `git branch --show-current`, `git log -1 --oneline`, `git fetch origin`, `git status -sb`):

- Rama activa: `main`, sincronizada con `origin/main`.
- Cambios locales preexistentes **no relacionados con esta tarea** (no tocados ni sobrescritos):
  - `.claude/settings.local.json` modificado.
  - `kakebo/` — subdirectorio anidado que contiene un repositorio git independiente (no es un submódulo declarado en `.gitmodules`), con commits propios por delante/detrás del repo raíz. Se ha ignorado completamente; el árbol de código auditado es el del repositorio raíz (`./src/...`), no `./kakebo/src/...`.
  - Archivos sin trackear: `CLAUDE.md`, `SEO_MAP_V1.md` (raíz), `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`.
- Ninguno de estos cambios preexistentes se ha modificado, mezclado ni comiteado en esta tarea.

## 5. Metadata encontrada

Verificada en código (`page.tsx` + `messages/es.json`, namespace `Tools.Inflation.meta`) y confirmada en el HTML real servido por producción:

| Campo | Valor real (producción) | Origen en código |
|---|---|---|
| `title` | `Calculadora de Inflación e IPC \| Pérdida de Poder Adquisitivo` | `t('title')` ← `Tools.Inflation.meta.title` |
| `meta description` | `Calcula cuánto ha perdido valor tu dinero con la inflación acumulada. Introduce importe, IPC y años: resultado inmediato. Gratis y sin registro.` | `t('description')` ← `Tools.Inflation.meta.description` |
| `canonical` | `https://www.metodokakebo.com/herramientas/calculadora-inflacion` | `alternates.canonical` en `generateMetadata` |
| `robots` | `index, follow` | Heredado de `[locale]/layout.tsx` (`isProduction` = true) |
| `hreflang` | `es` (self), `en`, `x-default` — los 3 presentes y correctos | `alternates.languages` en `generateMetadata` |
| `og:title` / `og:description` | Presentes, coinciden con `ogTitle`/`ogDescription` | `openGraph` en `generateMetadata` |
| `og:site_name` | `MetodoKakebo.com` | Definido explícitamente en esta página (ya correcto según auditorías previas `SEO-OG-SITENAME-INHERITANCE-*`) |
| `og:image` / `twitter:image` | Generadas dinámicamente vía `/api/og` con title/description | `openGraph.images` / `twitter` |
| `twitter:card` | `summary_large_image` | `twitter.card` |

**Conclusión sobre la meta description:** existe en código, se genera correctamente vía `generateMetadata` con `next-intl`, y se renderiza en el HTML servido en producción (verificado con `curl`, tag `<meta name="description" content="...">` presente y no vacío). No hay evidencia de que otro nivel de layout la sobrescriba o de que no se renderice.

## 6. HTML renderizado

Verificación mediante `curl` con user-agent identificado contra la URL de producción (HTTP 200):

- El HTML servido inicialmente **no incluye** el SVG del gráfico (Recharts): el `ResponsiveContainer` se renderiza como contenedor vacío (`class="recharts-responsive-container"`) sin nodos `<svg>`/`<text>` hijos, porque Recharts requiere las dimensiones reales del contenedor en el navegador y solo pinta tras la hidratación en cliente. Esto es relevante para el punto 8 (textos concatenados).
- Schema JSON-LD confirmado presente: `SoftwareApplication`, `FAQPage`, `DefinedTerm` (bloque `@graph` de `page.tsx`) y `BreadcrumbList` (script independiente).
- `<meta name="robots" content="index, follow">` confirmado.
- Enlaces internos salientes confirmados en el HTML: `/login?source=calculator_inflation`, `/herramientas/regla-50-30-20`, `/blog/alternativas-a-app-bancarias`, `/blog/kakebo-vs-ynab`, más los de `Navbar`/`Footer` compartidos.
- **Ningún enlace externo de contenido** (`href="https://..."` fuera de `metodokakebo.com`) salvo el script de Google Tag Manager, que no es un enlace de contenido.

## 7. Jerarquía de headings

Extracción completa y en orden real del HTML de producción:

| # | Nivel | Texto | Origen |
|---|---|---|---|
| 1 | H1 | Calculadora de Inflación e IPC en España | `header.title` (`CalculatorInflation.tsx`) |
| 2 | **H3** | Protege tus ahorros del IPC | `cta.title` — bloque CTA interno dentro de la tarjeta de la calculadora |
| 3 | H2 | ¿Qué es la Inflación? | `content.whatTitle` |
| 4 | H2 | Entendiendo el Impacto de la Inflación en tus Ahorros | `content.impactTitle` |
| 5 | H2 | ¿Cómo actualizar tu alquiler por el IPC? | `content.rentTitle` |
| 6 | H2 | Inflación Acumulada: El Efecto 'Interés Compuesto' Inverso | `content.accumulatedTitle` |
| 7 | H3 | Comparativa: Ahorro vs Inversión vs Inflación | `content.tableTitle` |
| 8 | H2 | Preguntas Frecuentes sobre el IPC en España | `content.faqTitle` |
| 9-11 | H3 x3 | ¿Cuál es la diferencia entre IPC e Inflación? / ¿Cómo calcular el IPC acumulado entre dos años? / ¿Cuánto vale mi dinero de 2000 hoy en España? | `content.faq.q1/q2/q3` |
| 12 | H3 | Sigue leyendo y protege tu patrimonio: | `content.interlinkingTitle` |
| 13-15 | H3 x3 | Producto / Cuenta / Legal | `Footer.tsx` — instancia dentro de `page.tsx` |
| 16-18 | H3 x3 | Producto / Cuenta / Legal (**repetidos**) | `Footer.tsx` — segunda instancia, montada por `[locale]/layout.tsx` |

**Saltos de nivel:** confirmado un salto H1 → H3 (posiciones 1-2). El primer encabezado tras el H1 es el H3 "Protege tus ahorros del IPC" del bloque CTA interno de la calculadora, que en el JSX aparece antes que el primer H2 ("¿Qué es la Inflación?") de la sección de contenido SEO/GEO. El resto de la jerarquía (H2 → H3 en tabla y FAQ) es correcta y no presenta saltos.

**Encabezados duplicados — causa raíz identificada:** "Producto", "Cuenta" y "Legal" aparecen exactamente dos veces cada uno porque el componente `<Footer />` se renderiza **dos veces** en esta página:
1. Explícitamente dentro de `page.tsx` (línea 148), como parte del layout propio de la página.
2. Implícitamente en `[locale]/layout.tsx` (línea 138), que renderiza `<Footer />` después de `{children}` para todas las páginas de la aplicación.

Esto produce un footer duplicado en el DOM completo de la página (no solo los encabezados), con 6 enlaces de navegación repetidos y 2 bloques `©`. No es un problema exclusivo de la calculadora de inflación: cualquier página bajo `(landing)` que ya incluya su propio `<Footer />` (se ha confirmado el mismo patrón de import en `regla-50-30-20/page.tsx`) sufre la misma duplicación.

**Encabezados que deberían ser texto normal:** el H3 "Protege tus ahorros del IPC" del bloque CTA es semánticamente un título de sección de llamada a la acción, no un subtema del contenido informativo; su presencia como heading (en lugar de un `<p>` o `<span>` de mayor tamaño) es lo que produce el salto de nivel.

## 8. Textos concatenados

| Texto reportado por SE Ranking | Componente/origen | ¿Existe en el HTML real? | Causa | Corrección mínima recomendada |
|---|---|---|---|---|
| "Pérdida de Valor Real-2559 €Tu dinero vale..." | `CalculatorInflation.tsx`, bloque "Main Stat: Loss" (líneas 169-182): tres `<span>` hermanos (`lossLabel`, monto formateado, `lossText`) sin separador textual entre ellos | Sí — confirmado en código; los tres `<span>` son hijos directos consecutivos sin nodo de texto intermedio | Los `<span>` están apilados verticalmente por CSS (`flex flex-col`), por lo que visualmente se leen bien, pero un extractor de texto lineal (como el de SE Ranking) los concatena sin espacio | Añadir un separador invisible (salto de línea real o `aria-hidden` con espacio) entre los `<span>`, o agrupar el bloque en un único nodo de texto con saltos de línea explícitos |
| "Poder de Compra Futuro7441 €" | Mismo bloque, "Secondary Stat: Real Value" (líneas 185-195): `realLabel` + monto formateado en `<span>` consecutivos | Sí — mismo patrón | Igual que el anterior | Igual que el anterior |
| "Crear cuenta gratisVer regla 50/30/20" | Bloque CTA interno (líneas 263-278): dos `<Link>` hermanos (`cta.buttonPrimary`, `cta.buttonSecondary`) dentro de un `flex` sin texto separador | Sí — confirmado en código | Separación solo visual (CSS `gap-6`), no textual | Igual que el anterior; alternativamente, envolver cada botón en su propio bloque con `aria-label` distintivo no resuelve la concatenación de texto plano, por lo que la solución de separador explícito es la más directa |
| "Aceptar0k" | "Aceptar" = `CookieBanner.tsx` (botón `accept`); "0k" = tick del eje Y del gráfico Recharts (`tickFormatter={(value) => \`${value/1000}k\`}`, que para `value=0` produce "0k") | **Parcial** — ambos fragmentos existen de forma real en la aplicación renderizada en cliente, pero no se ha podido reproducir su adyacencia exacta en el HTML servido ni en el orden del DOM: el gráfico Recharts se renderiza 100 % en cliente (el HTML inicial servido por el servidor no contiene ningún nodo `<svg>`/`<text>` del gráfico) y el botón "Aceptar" del `CookieBanner` se monta al final del `<body>` (tras `{children}` y antes del segundo `<Footer />`), lejos en el DOM del gráfico | No se puede determinar causa exacta sin acceso a la herramienta de renderizado de SE Ranking; ver clasificación en la sección 13 | No aplicar corrección hasta confirmar la adyacencia real (posible artefacto de la extracción de texto de SE Ranking sobre contenido ya hidratado) |

**Patrón común confirmado:** tres de los cuatro casos (los que se pueden verificar en el código fuente) comparten la misma causa: elementos de texto hermanos sin separador textual entre nodos, algo habitual quando el diseño confía solo en el espaciado CSS. Es un patrón repetido en el componente, no un caso aislado.

## 9. Revisión de contenido y frescura

- **Afirmaciones sin fuente citada (con enlace):** la sección de contenido menciona el INE dos veces como texto plano ("la tasa interanual publicada por el INE", "el IPC... es la herramienta estadística que usa el INE para medirla") sin ningún hipervínculo al organismo oficial.
- **Datos temporales encontrados:**
  - `inputs.inflationDisclaimer`: *"Media histórica 2000-2024: ~2.5%"*.
  - `content.rentText`: *"...como el límite del 3% en España durante 2024-2025)"*.
  - Ambos confirmados presentes en el HTML de producción. Su vigencia (si el límite legal o la media histórica siguen siendo correctos a la fecha de esta auditoría) **no se ha verificado** contra fuente oficial — está fuera del alcance de esta tarea de auditoría de código/HTML.
- **Cifras de inflación / rentabilidades financieras:** tabla comparativa "Ahorro vs Inversión vs Inflación" con rentabilidades típicas (0%, 1-2%, 7-10%) — cifras ilustrativas, sin fuente citada.
- **Fórmulas:** se muestra explícitamente la fórmula de variación IPC (`Tasa Variación = ((IPC Final - IPC Inicial) / IPC Inicial) x 100`) en un bloque `<code>`, sin fuente ni enlace al INE.
- **Menciones al INE:** 2 (ambas como texto plano, sin enlace).
- **Comparación de "genericidad" del contenido frente a otras calculadoras del sitio (hallazgo 6 de SE Ranking):** el patrón estructural (bloque de definición, tabla comparativa, FAQ) es efectivamente compartido con `calculadora-ahorro` y `regla-50-30-20`, pero una valoración de si el contenido es "genérico frente al resto de la SERP" requeriría consultar la SERP, lo cual está expresamente excluido del alcance de esta tarea.

## 10. Fuentes externas

**Cero enlaces externos a fuentes oficiales confirmado.** Verificación exhaustiva del HTML de producción: el único `href` externo presente es el script de Google Tag Manager (`googletagmanager.com`), que no es un enlace de contenido. No existe ningún `<a href="https://www.ine.es/...">` ni enlace a ninguna otra fuente oficial (BOE, Banco de España, Eurostat) pese a que el contenido cita datos y fórmulas atribuidos al INE.

## 11. Enlazado interno

**Enlaces salientes desde la calculadora (confirmados en HTML):**
- `/login?source=calculator_inflation` (CTA primario)
- `/herramientas/regla-50-30-20` (CTA secundario, cross-sell)
- `/blog/alternativas-a-app-bancarias` (enlace de interlinking al final del contenido)
- `/blog/kakebo-vs-ynab` (enlace de interlinking al final del contenido)
- Enlaces compartidos de `Navbar`/`Footer` (herramientas, blog, sobre-nosotros, legal, login/app)

**Páginas que enlazan hacia la calculadora (confirmado por búsqueda en código fuente):**
- `src/content/blog/fondo-de-emergencia.es.mdx` — anchor "calculadora de inflación" (texto descriptivo, enlace inline en párrafo).
- `src/content/blog/cuentas-remuneradas.es.mdx` — dos referencias: un bloque CTA con `href="/herramientas/calculadora-inflacion"` y un enlace inline con anchor "la calculadora de inflación".
- `src/components/landing/tools/SavingsCalculator.tsx` — cross-sell desde la calculadora de ahorro.
- `src/app/[locale]/(public)/herramientas/page.tsx` — hub de herramientas.
- `src/components/landing/ToolsSection.tsx`, `Navbar.tsx`, `Footer.tsx` — navegación global.

Esto contradice parcialmente el hallazgo histórico registrado en `PROJECT_STATUS.md` ("`calculadora-inflacion` tiene 0 enlaces de blog") — a fecha de esta auditoría **ya existen 2 artículos de blog con enlace entrante**, incorporados en tareas posteriores a ese registro (`fondo-de-emergencia`, `cuentas-remuneradas`). No se ha creado ningún enlace nuevo en esta tarea.

**Oportunidades reales sin crear enlaces artificiales:** no se identifican huecos evidentes adicionales sin evaluar antes el keyword research de esta URL — cualquier nueva pieza de contenido de respaldo (ya señalada en el histórico como P1) generaría enlazado adicional de forma natural.

## 12. Funcionalidad y fórmula actual

**Inputs:**
- Ahorros actuales (`savings`, numérico, por defecto 10.000 €).
- Inflación estimada / IPC (`inflationRate`, numérico, por defecto 3 %, rango 0-50, paso 0.1).
- Años de proyección (`years`, slider, por defecto 10, rango 1-40).

**Fórmula aplicada (cliente, `CalculatorInflation.tsx`):**
```
Valor Real (año i) = Ahorros / (1 + inflationRate/100) ^ i
Pérdida Total = Ahorros − Valor Real (último año)
% Pérdida = (Pérdida Total / Ahorros) × 100
```

**Outputs:** pérdida de valor real (€ y %), poder de compra futuro (€), gráfico de área nominal vs. real por año.

**Supuestos:**
- Tasa de inflación **constante** durante todo el periodo, introducida manualmente por el usuario (no hay validación contra un valor "real" del IPC).
- No usa datos históricos reales del IPC ni ninguna fuente externa (INE, Eurostat) — el cálculo es puramente una proyección matemática con la tasa que el usuario decide introducir.

**¿Permite comparar dos fechas?** No. La herramienta solo proyecta hacia adelante desde "hoy" durante N años con una tasa fija; no admite introducir una fecha de inicio y una fecha de fin ni consulta ninguna serie histórica del IPC para calcular la inflación acumulada real entre dos periodos.

**Limitaciones actuales confirmadas:**
- Sin datos históricos reales del IPC.
- Sin cálculo entre dos fechas concretas (ej. "de enero 2020 a julio 2026").
- Tasa de inflación 100 % dependiente de la estimación manual del usuario.
- Sin fuente citada ni enlazada para la fórmula ni para los datos de contexto (media histórica, límite legal de actualización de rentas).

## 13. Tabla de validación de hallazgos SE Ranking

| # | Hallazgo SE Ranking | Clasificación | Evidencia |
|---|---|---|---|
| 1 | Meta description ausente o vacía | **DESCARTADO** | Presente en código (`Tools.Inflation.meta.description`) y confirmada renderizada en el HTML de producción (`<meta name="description" content="Calcula cuánto ha perdido...">`) |
| 2 | "calculadora de inflación España" no aparece de forma exacta | **CONFIRMADO** | La frase exacta no aparece en ningún punto del HTML; solo variantes ("Calculadora de Inflación e IPC en España" en H1, "Calculadora de Inflación e IPC" en title/H1/schema) |
| 3 | Jerarquía incorrecta de encabezados, salto de H1 a H3 | **CONFIRMADO** | Orden real extraído del HTML: H1 → H3 ("Protege tus ahorros del IPC", bloque CTA) → H2 (primer contenido). Ver sección 7 |
| 4 | Encabezados duplicados "Producto", "Cuenta", "Legal" | **CONFIRMADO** | Causa raíz identificada: `<Footer />` se renderiza dos veces (una en `page.tsx`, otra en `[locale]/layout.tsx`), duplicando los 3 headings y todo el bloque de footer |
| 5 | Textos concatenados ("Pérdida de Valor Real-2559€...", "Poder de Compra Futuro7441€", "Crear cuenta gratisVer regla 50/30/20") | **CONFIRMADO** (3 de 4 casos) | Spans/Links hermanos sin separador textual en `CalculatorInflation.tsx`, verificado en código fuente |
| 5b | Texto concatenado "Aceptar0k" | **PARCIAL / REQUIERE DATOS ADICIONALES** | Ambos fragmentos son reales (CookieBanner + tick del gráfico) pero no se ha podido reproducir la adyacencia exacta; el gráfico se renderiza solo en cliente y no aparece en el HTML servido inicialmente |
| 6 | Contenido parcialmente genérico o similar a otras calculadoras | **REQUIERE DATOS ADICIONALES** | Requiere comparación con la SERP, explícitamente fuera de alcance de esta tarea |
| 7 | Cero enlaces externos a fuentes oficiales | **CONFIRMADO** | Verificado en HTML de producción: ningún `href` externo de contenido; INE mencionado solo como texto, sin enlace |
| 8 | Referencias temporales/legales a 2024-2025 potencialmente desactualizadas | **PARCIAL** | Presencia confirmada ("2000-2024", "2024-2025"); su vigencia real frente a datos actuales del INE **requiere datos adicionales** (verificación externa fuera de alcance) |
| 9 | Ausencia de backlinks directos | **REQUIERE DATOS ADICIONALES** | No se dispone de herramienta de análisis de backlinks en esta auditoría |
| 10 | Herramienta centrada en proyección futura vs. cálculo histórico entre fechas (mayoría SERP) | **CONFIRMADO** (naturaleza de la herramienta) / **REQUIERE DATOS ADICIONALES** (comparación con SERP) | Confirmado por código: solo proyección futura con tasa manual, sin datos históricos ni comparación entre fechas. La comparación con "buena parte de la SERP" no se ha verificado (SERP fuera de alcance) |

**Confirmaciones adicionales del informe SE Ranking (no cuestionadas, verificadas donde fue posible):**
- URL indexada — coherente con `robots: index, follow` confirmado en HTML y con `sitemap.ts`.
- Canonical correcto — confirmado (`https://www.metodokakebo.com/herramientas/calculadora-inflacion`, sin `/es/`).
- `robots.txt` permite rastreo — coherente con metadata `index, follow`.
- Schema presente — confirmado: `SoftwareApplication`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`.
- HTTPS correcto — confirmado (URL servida sobre HTTPS, HTTP 200).
- hreflang correcto — confirmado: `es`, `en`, `x-default`, los tres presentes con URLs correctas.

## 14. Riesgos

- El bug de **doble `<Footer />`** (hallazgo 4) no es exclusivo de esta URL: afecta a cualquier página bajo `(landing)` que importe su propio `Footer` además del que ya renderiza `[locale]/layout.tsx` (confirmado también en `regla-50-30-20/page.tsx`). Cualquier corrección debe evaluarse a nivel de layout, no solo en esta página, para no generar una regresión visual o de enlazado en otras rutas.
- La corrección del salto H1→H3 implica decidir si el CTA interno debe dejar de ser un heading o si debe reordenarse/renumerarse junto con el resto de la jerarquía — es una decisión de estructura semántica, no solo de estilo, y no se ha tomado en esta tarea.
- Los textos concatenados (hallazgo 5) son cosméticos para el usuario (el CSS los separa visualmente) pero afectan a cómo los rastreadores y motores generativos interpretan el contenido en texto plano — su corrección es de bajo riesgo visual si se limita a añadir separadores de texto.
- No se ha verificado la vigencia real de los datos legales/temporales (2024-2025, media histórica 2000-2024) contra fuente oficial — presentarlos como "actualizados" sin esa verificación sería un riesgo de precisión informativa.
- La ausencia de enlaces a fuentes oficiales (INE) es un riesgo de autoridad percibida (E-E-A-T) tanto para buscadores tradicionales como para motores generativos (GEO), dado que el propio contenido cita explícitamente al INE sin enlazarlo.
- El histórico de `PROJECT_STATUS.md` puede quedar desactualizado en cuanto a "0 enlaces de blog" hacia esta URL — ya no es exacto a fecha de esta auditoría (existen 2 artículos de blog enlazando). No se ha corregido ese documento en esta tarea porque no forma parte del alcance definido.

## 15. Tareas posteriores priorizadas

Secuencia de tareas atómicas propuestas, sin implementar ninguna en esta auditoría:

1. **Metadata y snippet** (`SEO-ONPAGE-CALCULADORA-INFLACION-METADATA-01`): evaluar si incluir la keyword exacta "calculadora de inflación España" o una variante natural en `title`/`description`/H1, una vez validada con `KEYWORD-RESEARCH` — sin densidad artificial.
2. **HTML semántico y headings** (`SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01`): corregir el salto H1→H3 (reclasificar el CTA "Protege tus ahorros del IPC") y eliminar la duplicación de `<Footer />` a nivel de layout (afecta también a `regla-50-30-20` y potencialmente a otras rutas `(landing)`).
3. **Contenido, fuentes y frescura** (`SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`): añadir enlaces salientes a fuente oficial (INE) para las cifras y fórmulas citadas; verificar y, si procede, actualizar las referencias temporales/legales (2024-2025, media histórica 2000-2024) contra datos oficiales vigentes.
4. **Enlazado interno** (`SEO-ONPAGE-CALCULADORA-INFLACION-INTERNAL-LINKS-01`): revisar oportunidades adicionales de enlazado entrante una vez exista más contenido editorial de respaldo, sin crear enlaces artificiales.
5. **Ampliación funcional con cálculo histórico** (`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-01`): evaluar, con datos reales de IPC del INE, la viabilidad de añadir un modo de cálculo entre dos fechas concretas (distinto del modo de proyección futura actual), en línea con lo que parte de la SERP ya ofrece.
6. **Autoridad y backlinks** (`SEO-BACKLINKS-CALCULADORA-INFLACION-01`): tarea de investigación con herramienta de backlinks (fuera del alcance de código) para confirmar el hallazgo 9.

## 16. Recomendación de siguiente tarea única

`SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01` — corregir el salto de jerarquía H1→H3 y eliminar la duplicación de `<Footer />` (headings "Producto"/"Cuenta"/"Legal" repetidos), por ser el hallazgo con causa raíz más claramente identificada, menor riesgo de regresión visual y mayor impacto estructural sobre cómo se interpreta la página tanto en SEO tradicional como en GEO.
