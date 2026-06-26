# UI-BRAND-AUDIT-01
## Auditoría de identidad visual — MetodoKakebo.com

**Fecha:** 2026-06-26  
**Tipo:** Solo documentación — sin cambios en código  
**Referencia:** `docs/brand/IDENTIDAD_VISUAL_KAKEBO.md` + `docs/brand/PROMPT_VISUAL_KAKEBO.md`

---

## Resumen ejecutivo

La web pública de MetodoKakebo.com cumple en términos generales con la dirección estética definida: editorial financiero, tipografía serif/sans, fondos cálidos, ausencia de estética SaaS genérica agresiva. Sin embargo, se detectan **12 hallazgos** distribuidos en tres niveles de prioridad.

Los dos hallazgos de **prioridad alta** son sistémicos y afectan a toda la web:
1. El color primario implementado (`#cf5c5c`) difiere del terracota cálido documentado en el brand manual (`#CF8C6C`).
2. Todos los artículos del blog (12 de 12) usan el emoji `👉🏽` en el CTA de pie de artículo, en contradicción directa con el brand manual.

El resto son inconsistencias de prioridad media o baja que generan fricción visual entre secciones.

---

## Páginas y zonas revisadas

- Home pública (`/`) — Hero, Features, SavingsSimulator, HowItWorks, Testimonials, AlternativesSection, ToolsSection, SeoContent
- Blog index (`/blog`)
- Artículos del blog (muestra: `alternativas-a-app-bancarias`, `kakebo-online-gratis`, `como-ahorrar-dinero-cada-mes`)
- Herramienta calculadora ahorro (`/herramientas/calculadora-ahorro`)
- Herramienta calculadora inflación (`/herramientas/calculadora-inflacion`)
- Herramienta regla 50/30/20 (`/herramientas/regla-50-30-20`)
- Navbar (desktop + mobile)
- Footer
- Componentes MDX (`MDXComponents.tsx`, `SimpleCTA`, `Callout`, `Blockquote`, `Table`)
- Dark mode (tokens en `globals.css`)

---

## Hallazgos por zona

---

### Hallazgo 01 — Color primario desviado del brand manual

- **Zona:** Global — todos los componentes que usan `text-primary`, `bg-primary`, `border-primary`
- **Severidad:** Alta
- **Impacto:** Marca, coherencia visual global
- **Descripción:** El brand manual define el color terracota principal como `#CF8C6C` (terracota cálida, tono adobe/caramelo). La implementación real en `globals.css` usa `--primary: #cf5c5c` en light mode y `--primary: #f87171` en dark mode. El `#cf5c5c` es un rojo-salmón más vivo y frío que el `#CF8C6C`, que es un terracota más cálido y neutro. La diferencia es perceptible en CTAs, badges, links y acentos.
- **Evidencia:** `src/app/globals.css` línea 35 (`--primary: #cf5c5c`). Brand manual sección 4: `Terracota principal: #CF8C6C`.
- **Recomendación:** Evaluar si el color actual `#cf5c5c` fue una decisión deliberada posterior al brand manual, o si es un error de implementación. Si es error, corregir el token `--primary` a `#CF8C6C` (y ajustar dark mode a `#D4956A` o similar). Si fue decisión deliberada, actualizar el brand manual.
- **Tarea futura sugerida:** `UI-COLOR-PRIMARY-ALIGN-01` — Decidir y unificar el color primario entre brand manual e implementación CSS.

---

### Hallazgo 02 — Emoji `👉🏽` sistémico en CTAs de artículos

- **Zona:** Blog — todos los artículos (12 de 12 en español)
- **Severidad:** Alta
- **Impacto:** Marca, tono editorial, consistencia
- **Descripción:** El 100% de los artículos del blog en español utilizan `<SimpleCTA cta="👉🏽 ...">` como CTA de cierre. El brand manual (sección 7) especifica: *"CTAs deben ser: Sin emojis decorativos. Con copy directo y útil."* El emoji `👉🏽` es un elemento visual decorativo que desentona con la estética editorial seria y financiera definida.
- **Evidencia:** 12 artículos revisados: `ahorro-pareja.es.mdx`, `alternativas-a-app-bancarias.es.mdx`, `como-ahorrar-dinero-cada-mes.es.mdx`, `eliminar-gastos-hormiga.es.mdx`, `kakebo-online-gratis.es.mdx`, `kakebo-sueldo-minimo.es.mdx`, `kakebo-vs-ynab.es.mdx`, `libro-kakebo-pdf.es.mdx`, `metodo-kakebo-para-autonomos.es.mdx`, `peligros-apps-ahorro-automatico.es.mdx`, `plantilla-kakebo-excel.es.mdx`, `regla-30-dias.es.mdx`.
- **Recomendación:** Eliminar el emoji `👉🏽` del parámetro `cta` en todos los artículos. El copy sin emoji es más editorial y conecta mejor con la identidad definida.
- **Tarea futura sugerida:** `UI-CTA-EMOJI-REMOVE-01` — Limpiar emoji en CTAs de todos los artículos del blog.

---

### Hallazgo 03 — Inconsistencia en border-radius de CTAs entre zonas

- **Zona:** CTAs globales — Hero, Navbar, SavingsSimulator, calculadoras, artículos
- **Severidad:** Media
- **Impacto:** Coherencia visual, marca
- **Descripción:** No existe un sistema de border-radius unificado para CTAs. Cada zona define su propio radio:

| Zona | Clase |
|---|---|
| Hero primary CTA (HeroCTA) | Sin border-radius (rectangular) |
| Hero secondary CTA | Sin border-radius |
| Navbar CTA desktop | Sin border-radius |
| Navbar CTA mobile | `rounded-md` |
| SavingsSimulator CTA | `rounded-lg` |
| Calculadora ahorro CTA | `rounded-full` |
| Calculadora inflación CTA | `rounded-full` |
| Calculadora 50/30/20 CTA | `rounded-full` |
| Blog artículos CTA (via SimpleCTA) | `rounded-full` |

Los CTAs rectangulares en el Hero y Navbar son coherentes entre sí y con la estética editorial. Sin embargo, las calculadoras y artículos usan `rounded-full` (píldora), creando dos sistemas visuales paralelos sin justificación clara.

- **Evidencia:** `Hero.tsx`, `Navbar.tsx`, `SavingsCalculator.tsx`, `Calculator503020.tsx`, `page.tsx` calculadora-ahorro (link a `/login`).
- **Recomendación:** Definir un único sistema: CTAs principales = rectangular (sin radius, estética editorial); CTAs secundarios/de herramientas = `rounded-full` si se quiere diferenciar. Documentar la decisión.
- **Tarea futura sugerida:** `UI-CTA-RADIUS-UNIFY-01` — Unificar border-radius de CTAs según decisión de sistema.

---

### Hallazgo 04 — ToolsSection omite la Calculadora de Ahorro

- **Zona:** Home — sección ToolsSection
- **Severidad:** Media
- **Impacto:** Coherencia, conversión
- **Descripción:** La sección "Herramientas Gratuitas" en la Home (`ToolsSection.tsx`) muestra 2 herramientas: Regla 50/30/20 y Calculadora de Inflación. La Calculadora de Ahorro (`/herramientas/calculadora-ahorro`) está ausente aunque es la herramienta con más clics en Search Console (CTR 35,9%). El Navbar y Footer sí incluyen las 3 herramientas.
- **Evidencia:** `src/components/landing/ToolsSection.tsx` — solo 2 tarjetas. Navbar dropdown y Footer tienen 3 links.
- **Recomendación:** Añadir la Calculadora de Ahorro a ToolsSection, expandiendo el grid a 3 columnas o 2+1 responsive.
- **Tarea futura sugerida:** `UI-TOOLS-SECTION-COMPLETE-01` — Añadir Calculadora de Ahorro a ToolsSection en Home.

---

### Hallazgo 05 — Inflation card usa color `destructive` en ToolsSection

- **Zona:** Home — ToolsSection
- **Severidad:** Media
- **Impacto:** Marca, coherencia semántica de colores
- **Descripción:** La tarjeta de la Calculadora de Inflación en ToolsSection usa `hover:border-destructive/50`, `hover:bg-destructive`, `text-destructive` y `hover:text-destructive`. El token `destructive` está reservado semánticamente para errores y estados de fallo. Aunque comunicar "peligro" de la inflación puede ser intencional, usar el token de error para un CTA de navegación mezcla semántica de estado con intención visual.
- **Evidencia:** `src/components/landing/ToolsSection.tsx` líneas 48, 50-51, 63-64.
- **Recomendación:** Usar el color `primary` (terracota) o un acento diferente dentro de la paleta de marca para el hover de esta tarjeta. Reservar `destructive` para errores reales.
- **Tarea futura sugerida:** `UI-TOOLS-INFLATION-COLOR-01` — Corregir uso de `destructive` en InflationCard de ToolsSection.

---

### Hallazgo 06 — HowItWorks "PASO" hardcodeado sin internacionalización

- **Zona:** Home — HowItWorks
- **Severidad:** Media
- **Impacto:** Coherencia en versión inglesa
- **Descripción:** El label de cada paso (`PASO {number}`) está hardcodeado en español dentro del componente `HowItWorks.tsx`. En la versión EN de la web, el texto visible será "PASO 01" en lugar de "STEP 01". Esto rompe la consistencia de la experiencia en inglés aunque no afecta al español.
- **Evidencia:** `src/components/landing/HowItWorks.tsx` línea 157: `PASO {number}`.
- **Recomendación:** Usar una clave de traducción `{t('stepLabel')} {number}` para internacionalizar el label.
- **Tarea futura sugerida:** `UI-HOWITWORKS-I18N-01` — Internacionalizar label "PASO" en HowItWorks.

---

### Hallazgo 07 — Trust Signal con emoji en Hero

- **Zona:** Home — Hero
- **Severidad:** Baja
- **Impacto:** Marca, tono
- **Descripción:** El trust signal del Hero tiene el texto `"🔒 Registro instantáneo · Sin tarjeta · Gratis para siempre"`. El emoji `🔒` es decorativo. El brand manual especifica (sección 7): CTAs sin emojis decorativos. Aunque el trust signal no es estrictamente un CTA, sí es un elemento de UI prominente y el uso del emoji es inconsistente con el tono editorial definido.
- **Evidencia:** `messages/es.json` → `Hero.trustSignal`.
- **Recomendación:** Eliminar `🔒` y sustituir por un símbolo tipográfico o simplemente el texto sin emoji: `"Registro instantáneo · Sin tarjeta · Gratis para siempre"`.
- **Tarea futura sugerida:** Incluir en `UI-CTA-EMOJI-REMOVE-01` o tarea propia si se prioriza.

---

### Hallazgo 08 — Copyright footer: "Kakebo Ahorro" (posible legacy)

- **Zona:** Footer
- **Severidad:** Baja
- **Impacto:** Marca, coherencia de naming
- **Descripción:** El copyright del footer dice `© {año} Kakebo Ahorro`. El naming actual de la marca es "Kakebo AI" o "MetodoKakebo.com". "Kakebo Ahorro" puede ser un artefacto de una versión anterior.
- **Evidencia:** `src/components/landing/Footer.tsx` línea 163.
- **Recomendación:** Actualizar a `© {año} MetodoKakebo.com` o `© {año} Kakebo AI`, consistente con el nombre actual de la marca.
- **Tarea futura sugerida:** `UI-FOOTER-COPYRIGHT-01` — Actualizar copyright a nombre de marca actual.

---

### Hallazgo 09 — Inconsistencia en border-radius de cards entre secciones

- **Zona:** Home — Features, HowItWorks, Testimonials, ToolsSection, SavingsSimulator
- **Severidad:** Baja
- **Impacto:** Coherencia visual
- **Descripción:** Cada sección usa un radio de esquina diferente en sus cards:

| Sección | Radio de card |
|---|---|
| Features cards | Sin border-radius (rectangular) |
| HowItWorks step cards | `rounded-sm` |
| SavingsSimulator card | `rounded-2xl` |
| Testimonials | `rounded-2xl` |
| ToolsSection cards | `rounded-2xl` |
| AlternativesSection table | `rounded-2xl` |
| Blog cards | `rounded-xl` |

Las Features cards sin border-radius son coherentes con la estética editorial, pero coexisten con `rounded-2xl` en las secciones siguientes.

- **Evidencia:** Múltiples componentes en `src/components/landing/`.
- **Recomendación:** Definir dos niveles: cards editoriales (rectangular o `rounded-sm`) vs. cards UI/app (`rounded-xl` o `rounded-2xl`). Aplicar coherencia dentro de cada nivel.
- **Tarea futura sugerida:** `UI-CARDS-RADIUS-SYSTEM-01` — Definir y documentar sistema de border-radius por tipo de card.

---

### Hallazgo 10 — Dark mode: primary `#f87171` más vibrante que filosofía brand

- **Zona:** Global — dark mode
- **Severidad:** Baja
- **Impacto:** Marca (dark mode), tono sereno
- **Descripción:** En dark mode, `--primary: #f87171` (red-400 de Tailwind). Este tono es más brillante y vivo que el terracota cálido del brand manual. La filosofía de paleta definida busca "calma y serenidad", pero un rojo saturado en fondos oscuros puede resultar más agresivo visualmente.
- **Evidencia:** `src/app/globals.css` línea 95.
- **Recomendación:** En dark mode, considerar un terracota oscurecido y desaturado, como `#C47B5A` o `#B8714E`, que mantenga el carácter cálido sin la agresividad del rojo Tailwind.
- **Tarea futura sugerida:** Incluir en `UI-COLOR-PRIMARY-ALIGN-01` al revisar la paleta completa.

---

### Hallazgo 11 — SeoContent: jerarquía H3/H4 desconectada del tamaño visual

- **Zona:** Home — SeoContent (bloque al final de la Home)
- **Severidad:** Baja
- **Impacto:** Legibilidad, SEO semántico
- **Descripción:** El componente `SeoContent` usa `<h3>` con `text-lg` y `<h4>` con `text-sm`. Los H4 son visualmente indistinguibles de un párrafo normal. Aunque el contenido es solo de SEO semántico, la jerarquía HTML no refleja la jerarquía visual.
- **Evidencia:** `src/components/landing/SeoContent.tsx`.
- **Recomendación:** Usar `<h2>` para el bloque SeoContent (puesto que la Home ya tiene un H1 en Hero) y simplificar a `<h3>` los subtítulos internos. O marcarlos como `<p>` si son semánticamente párrafos de SEO.
- **Tarea futura sugerida:** `UI-SEOCONTENT-HIERARCHY-01` — Corregir jerarquía semántica en SeoContent.

---

### Hallazgo 12 — Blog index: texto "Artículo destacado" hardcodeado (no translation key)

- **Zona:** Blog index
- **Severidad:** Baja
- **Impacto:** Coherencia EN/ES
- **Descripción:** El badge del artículo destacado usa un inline conditional: `locale === 'es' ? 'Artículo destacado' : 'Featured'`. No usa el sistema de traducciones. Si se añadieran idiomas o se refactorizara el sistema i18n, este texto quedaría desactualizado silenciosamente.
- **Evidencia:** `src/app/[locale]/(public)/blog/page.tsx` línea 76.
- **Recomendación:** Mover a clave de traducción `Blog.index.featured`.
- **Tarea futura sugerida:** Incluir en cualquier tarea de limpieza i18n futura.

---

## Ranking de prioridades

| Prioridad | Hallazgo | Tarea sugerida |
|---|---|---|
| 🔴 Alta | H-01: Color primario desviado del brand manual | `UI-COLOR-PRIMARY-ALIGN-01` |
| 🔴 Alta | H-02: Emoji `👉🏽` en 12 CTAs de artículos | `UI-CTA-EMOJI-REMOVE-01` |
| 🟡 Media | H-03: Border-radius de CTAs inconsistente | `UI-CTA-RADIUS-UNIFY-01` |
| 🟡 Media | H-04: Calculadora de Ahorro ausente de ToolsSection | `UI-TOOLS-SECTION-COMPLETE-01` |
| 🟡 Media | H-05: Color `destructive` en inflation card | `UI-TOOLS-INFLATION-COLOR-01` |
| 🟡 Media | H-06: "PASO" hardcodeado sin i18n | `UI-HOWITWORKS-I18N-01` |
| 🟢 Baja | H-07: Emoji 🔒 en trust signal Hero | Incluir en H-02 |
| 🟢 Baja | H-08: Copyright "Kakebo Ahorro" legacy | `UI-FOOTER-COPYRIGHT-01` |
| 🟢 Baja | H-09: Border-radius de cards inconsistente | `UI-CARDS-RADIUS-SYSTEM-01` |
| 🟢 Baja | H-10: Dark mode primary demasiado vibrante | Incluir en H-01 |
| 🟢 Baja | H-11: SeoContent jerarquía H3/H4 | `UI-SEOCONTENT-HIERARCHY-01` |
| 🟢 Baja | H-12: "Artículo destacado" hardcodeado | Tarea i18n limpieza |

---

## Tareas futuras recomendadas

### T1 — `UI-COLOR-PRIMARY-ALIGN-01` (Alta)
Decidir si el color primario es `#CF8C6C` (brand manual) o `#cf5c5c` (implementación). Si se opta por el brand manual, actualizar el token CSS `--primary` en light mode y ajustar el dark mode a un terracota oscuro equivalente. Revisar contraste en todos los CTAs y elementos afectados.

### T2 — `UI-CTA-EMOJI-REMOVE-01` (Alta)
Eliminar el emoji `👉🏽` del campo `cta` en los 12 artículos ES del blog. Incluir también la eliminación del `🔒` en Hero trust signal. No modificar el copy textual, solo eliminar el emoji.

### T3 — `UI-TOOLS-SECTION-COMPLETE-01` (Media)
Añadir la Calculadora de Ahorro a la sección ToolsSection de la Home. Ajustar el grid para que muestre 3 herramientas de forma coherente (columna 3 en desktop, cards apiladas en mobile).

### T4 — `UI-TOOLS-INFLATION-COLOR-01` (Media)
Corregir el uso del token `destructive` en la tarjeta de Calculadora de Inflación dentro de ToolsSection. Sustituir por un color dentro de la paleta de marca.

### T5 — `UI-CTA-RADIUS-UNIFY-01` (Media)
Definir el sistema de CTAs: ¿rectangular o rounded-full? Documentar la decisión y aplicarla de forma consistente.

### T6 — `UI-FOOTER-COPYRIGHT-01` (Baja)
Actualizar copyright footer de "Kakebo Ahorro" al nombre actual.

---

## Qué NO conviene tocar

- **Navbar:** El sistema de accesibilidad (aria-expanded, aria-controls, focus traps) fue implementado deliberadamente. No modificar la estructura del dropdown ni del mobile menu.
- **MDXComponents:** El sistema de componentes MDX está maduro y bien construido. No refactorizar sin necesidad concreta.
- **Tipografías:** Playfair Display + Inter están correctamente implementadas. No cambiar.
- **bg-sakura:** La clase utility con el fondo sakura funciona correctamente en light y dark mode. No tocar.
- **HeroCTA:** El componente gestiona estado de sesión (logged vs anonymous). No tocar la lógica, solo el estilo si se decide unificar CTAs.
- **Bloque SEO de la Home:** El `SavingsSimulator`, `AlternativesSection` y secciones SEO tienen copy y estructura optimizados para posicionamiento. No modificar con objetivo puramente visual.
- **Calculadora de Inflación — componente:** La lógica del gráfico y los colores del gráfico (rojo para pérdida) son correctos y tienen sentido contextual.

---

## Conclusión

La web cumple con el espíritu de la identidad visual Kakebo: es editorial, seria, sin estética SaaS genérica, con buena legibilidad y tipografía coherente. Los problemas detectados son principalmente de **consistencia de sistema** (colores, radios, emojis) más que de dirección estética incorrecta.

El hallazgo más urgente y de mayor impacto de marca es el **color primario desviado** del brand manual, ya que afecta a todos los elementos activos del sitio. El segundo más urgente es la **presencia sistemática de emojis en CTAs** de artículos, que contradice el tono editorial definido.

Los hallazgos de prioridad media y baja son oportunidades de refinamiento gradual que no requieren intervención inmediata pero deben planificarse para el próximo sprint visual.

---

*Auditoría realizada el 2026-06-26 contra el código fuente. Sin modificaciones. Solo documentación.*
