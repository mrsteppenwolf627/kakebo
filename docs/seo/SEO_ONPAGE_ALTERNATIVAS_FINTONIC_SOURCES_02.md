# SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SOURCES-02

**Tipo:** Verificación factual y trazabilidad mediante fuentes oficiales (implementación quirúrgica)
**Fecha de verificación:** 2026-07-20
**Milestone:** SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02 (no se marca completo en esta tarea)
**Tareas previas:** `VALIDATION-02` (`035ed25`), `KEYWORD-SERP-02` (`0a946c3`), `ARCHITECTURE-02` (`6f6a4d8`), `SNIPPET-02` (`de7efe1`), `CONTENT-INTRO-02` (`6ad176d`), `HEADINGS-02` (`fde6c76`)
**URL objetivo:** `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`

---

## 1. Resumen ejecutivo

Se ha verificado, contra fuentes oficiales, cada afirmación factual objetiva del artículo sobre las 8 alternativas comparadas (precio, plataforma, conexión bancaria, nacionalidad de la empresa, modelo de negocio). De 8 aplicaciones/opciones, se detectó **1 error factual confirmado**: la ficha de Spendee describía la empresa como "austriaca" cuando en realidad es **checa** (SPENDEE a.s., con sede en Praga, República Checa) — un error internamente contradictorio, ya que el propio texto ya mencionaba Praga. Se ha corregido de forma mínima (una palabra) y se ha citado la fuente oficial.

El resto de afirmaciones objetivas verificables se confirmaron correctas (Toshl Finance eslovena, Money Manager coreana y sin conexión bancaria, Emma británica con conexión central, YNAB de pago sin versión gratuita permanente a 14,99 €/mes o ~109 €/año, Fintonic gratuita con conexión obligatoria y modelo publicitario/de intermediación). Se han añadido 6 enlaces a fuentes oficiales (uno por aplicación con ficha propia, más la nota de Fintonic bajo la tabla), todos verificados con respuesta HTTP 200 y sin redirecciones a dominios distintos del oficial.

Las afirmaciones sobre **Kakebo AI** se verificaron contra el código y la documentación del propio repositorio (no contra fuentes web externas, según exige la Fase 7): se confirmó que el producto es gratuito (el endpoint de checkout de Stripe fue explícitamente desactivado — `"Stripe payments have been removed. Kakebo is now free."`), que no existe ninguna integración de conexión bancaria en el código de la aplicación, y que la categorización por IA en las categorías del método Kakebo (incluida "Supervivencia") existe en el agente conversacional actual. No se ha modificado el bloque de Kakebo AI ni se le ha añadido ningún claim nuevo.

Una afirmación (cobertura geográfica europea de la conexión bancaria de Toshl Finance) resultó **no verificable con una fuente concluyente** y se ha dejado sin tocar, documentada como tal.

No se ha modificado frontmatter, title, seoTitle, meta description, H1, introducción, headings, tabla (salvo la nota al pie no tabular), FAQ, CTA, enlaces internos, schema ni el orden/número de alternativas.

---

## 2. Fecha de verificación

**2026-07-20.** Todas las fuentes citadas en este documento y en el artículo fueron consultadas en esa fecha. Los datos de precio y disponibilidad de servicios de terceros pueden cambiar sin previo aviso; este documento certifica el estado observado en la fecha indicada, no una garantía permanente.

---

## 3. Estado del repositorio

| Comprobación | Resultado |
|---|---|
| `git status` | Mismos cambios locales ajenos preexistentes de las tareas anteriores del milestone (`.claude/settings.local.json`, submódulo `kakebo`, y untracked `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`). No se ha tocado ninguno. |
| `git branch --show-current` | `main` |
| `git fetch origin` | Sin cambios remotos nuevos |
| `git log -1 --oneline` (local) | `fde6c76 seo(fintonic): align comparison headings` |
| `git log origin/main -1 --oneline` | `fde6c76 seo(fintonic): align comparison headings` |
| `git diff origin/main..HEAD` | Vacío — rama local idéntica a `origin/main` |

Se releyeron íntegramente `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`, los tres documentos SEO del milestone y el MDX completo antes de iniciar la verificación. Se identificó la convención de fuentes ya existente en el repositorio: enlaces editoriales inline (`[texto](url)`) dentro del cuerpo del artículo, más una sección opcional `## Fuentes oficiales` al final (usada en `cuentas-remuneradas.es.mdx`). Dado que añadir un nuevo H2 está fuera del alcance aprobado de headings para esta URL (solo 2 headings aprobados en `HEADINGS-02`, ninguno de ellos una sección de fuentes), se ha optado por el patrón de **enlaces editoriales naturales dentro del texto**, consistente con la prioridad 2 de la Fase 5 del prompt de esta tarea, sin crear ningún heading nuevo.

---

## 4. Metodología de fuentes

Fuentes admitidas por orden de prioridad (según el prompt de la tarea): web oficial de la app/empresa → página oficial de precios → documentación/centro de ayuda oficial → política de privacidad oficial → página oficial de seguridad → App Store/Google Play oficial → documentación oficial de MetodoKakebo.com para el producto propio.

Herramienta utilizada: `WebSearch` para localizar la fuente oficial correcta, seguido de `WebFetch` sobre la URL oficial identificada para extraer el dato exacto citado. Para Kakebo AI: lectura directa del código fuente del repositorio (`src/app/api/stripe/checkout/route.ts`, ausencia de integraciones bancarias en `src/app` y `src/lib`, `src/app/api/ai/agent-v2/route.ts`).

No se ha usado como fuente principal ningún blog de afiliación, comparador, Reddit, YouTube, contenido generado por IA sin autoría, ni snippets de Google, conforme a la restricción del prompt.

---

## 5. Aplicaciones revisadas

Kakebo AI, Fintonic, Spendee, Toshl Finance, Money Manager, Emma, YNAB. Excel/Papel no se ha verificado por no ser un producto con ciclo de vida propio (no aplica la metodología de fuentes oficiales).

---

## 6. Matriz de afirmaciones

| Aplicación | Afirmación | Fuente oficial | Estado | Acción |
|---|---|---|---|---|
| Fintonic | Gratuita | [fintonic.com/es-ES/inicio](https://www.fintonic.com/es-ES/inicio/) | Confirmado | Mantener y citar |
| Fintonic | Conexión bancaria obligatoria | [fintonic.com/es-ES/inicio](https://www.fintonic.com/es-ES/inicio/) | Confirmado | Mantener (sin cita adicional, ya reflejado en tabla) |
| Fintonic | Modelo de negocio: publicidad/intermediación con entidades financieras, sin poder desactivarse | [fintonic.com/es-ES/inicio](https://www.fintonic.com/es-ES/inicio/) | Confirmado | Mantener y citar en la nota al pie de la tabla |
| Spendee | Nacionalidad de la empresa: "austriaca" | [spendee.com/about](https://www.spendee.com/about) | **Contradicho** — la empresa (SPENDEE a.s.) es checa, con sede en Praga, República Checa | **Corregir dato objetivo y citar** |
| Spendee | Sede en Praga | [spendee.com/about](https://www.spendee.com/about) | Confirmado | Mantener |
| Spendee | Conexión bancaria opcional / modo manual disponible | [spendee.com/pricing](https://www.spendee.com/pricing) | Confirmado (sincronización bancaria ligada a plan de pago; modo manual disponible en el plan Basic) | Mantener, sin citar (ya cubierto por la cita de nacionalidad en el mismo párrafo) |
| Spendee | Precio "Gratis / 2,99 €/mes" | [spendee.com/pricing](https://www.spendee.com/pricing) | **Sujeto a cambios / no convertible con certeza** — la página oficial muestra tiers en USD ($0 / $1.99 / $5.99 mensual) con nota explícita "Prices might differ based on the country" | No corregir (riesgo de conversión de moneda incorrecta, prohibido por el prompt); documentar como dato sujeto a variación por país |
| Toshl Finance | Nacionalidad de la empresa: "eslovena" | [EU Digital Finance Platform — Toshl](https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl) | Confirmado (sede en Kranj, Eslovenia) | Mantener y citar |
| Toshl Finance | Plan gratuito + planes de pago (~3,33 €/mes aprox.) | [toshl.com/pricing](https://toshl.com/pricing/) | Confirmado en estructura (Free / Pro / Medici); precio oficial en USD ($2.99-4.99/mes según plan), no verificable con certeza en EUR | No corregir (mismo motivo que Spendee); documentar |
| Toshl Finance | "Conexión bancaria disponible en muchos países europeos" | [toshl.com/pricing](https://toshl.com/pricing/) | **No verificable con fuente concluyente** — la página oficial de precios no especifica cobertura geográfica del sync bancario; una fuente secundaria menciona el plan Medici como orientado a bancos de EE.UU./Canadá, sin confirmación oficial sobre Europa | No verificable — no se modifica el texto, se documenta la limitación |
| Money Manager | Nacionalidad de la empresa: "coreana" (Realbyte Inc.) | [realbyteapps.com](https://www.realbyteapps.com/) | Confirmado | Mantener y citar |
| Money Manager | Gratuita | [realbyteapps.com](https://www.realbyteapps.com/) | Confirmado | Mantener |
| Money Manager | Sin conexión bancaria — registro manual | [help.realbyteapps.com](https://help.realbyteapps.com/hc/en-us) (vía búsqueda; centro de ayuda oficial) | Confirmado | Mantener |
| Money Manager | "Versión de escritorio (PC/Mac) disponible" | [help.realbyteapps.com — PC Management](https://help.realbyteapps.com/hc/en-us/sections/360007416874-PC-Management) | Confirmado con matiz — el "PC Manager" es un acceso vía navegador que usa el móvil como servidor en la misma red local, no una app de escritorio nativa independiente | Mantener sin reescribir (la afirmación "disponible" sigue siendo cierta; el matiz técnico no contradice el claim y no está entre los tipos de dato que el prompt exige corregir) |
| Emma | Nacionalidad de la empresa: "británica" | [emma-app.com](https://emma-app.com/plans/compare-emma-plans) | Confirmado | Mantener y citar |
| Emma | Conecta varios bancos simultáneamente (Open Banking) | [emma-app.com](https://emma-app.com/plans/compare-emma-plans) | Confirmado | Mantener |
| Emma | Plan gratuito limitado + planes de pago desde ~4,99 (moneda no confirmada en EUR) | [emma-app.com](https://emma-app.com/plans/compare-emma-plans) | Confirmado en estructura; precio oficial mostrado en GBP (£4.99/mes), no verificable con certeza en EUR | No corregir (mismo motivo de conversión de moneda); documentar |
| YNAB | De pago sin versión gratuita permanente (solo prueba de 34 días) | [ynab.com/pricing](https://www.ynab.com/pricing) | Confirmado | Mantener y citar |
| YNAB | Precio 14,99 €/mes o ~109 €/año | [ynab.com/pricing](https://www.ynab.com/pricing) | Confirmado en estructura ($14.99/mes, $109/año oficial en USD); cifra en EUR del artículo no verificable con certeza por conversión de moneda | No corregir (mismo motivo); mantener el dato existente en Contras sin tocar |
| YNAB | Sincronización bancaria disponible | [ynab.com/pricing](https://www.ynab.com/pricing) | Confirmado ("select US, Canadian, UK, and EU Banks" vía import directo; resto vía import de archivo) | Mantener |
| Kakebo AI | Gratuita | Código propio: `src/app/api/stripe/checkout/route.ts` (endpoint de pago desactivado explícitamente: *"Stripe payments have been removed. Kakebo is now free."*) | **Confirmado por código, fuente primaria del propio producto** | Mantener, sin cita externa (no aplica) |
| Kakebo AI | No requiere conexión bancaria / no almacena credenciales | Ausencia de cualquier integración bancaria (Plaid, Open Banking, IBAN) en `src/app` y `src/lib` | Confirmado (evidencia negativa: no existe ningún código de esa naturaleza en el producto) | Mantener |
| Kakebo AI | Categorización por IA conversacional en categorías del método Kakebo (incl. "Supervivencia") | `src/app/api/ai/agent-v2/route.ts` | Confirmado | Mantener |
| Excel / Papel | N/A — no es un producto con ciclo de vida propio | No aplica | No aplica | Sin acción |

---

## 7. Fuentes oficiales utilizadas

| # | Fuente | Tipo | URL |
|---|---|---|---|
| 1 | Fintonic — web oficial (España) | Web oficial de la app | https://www.fintonic.com/es-ES/inicio/ |
| 2 | Spendee — página "About" oficial | Web oficial de la empresa | https://www.spendee.com/about |
| 3 | Spendee — página oficial de precios | Página oficial de precios | https://www.spendee.com/pricing (consultada, no citada en el artículo — ver sección 9) |
| 4 | Toshl Finance — EU Digital Finance Platform (registro oficial de la Comisión Europea) | Organismo oficial | https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl |
| 5 | Toshl Finance — página oficial de precios | Página oficial de precios | https://toshl.com/pricing/ (consultada, no citada en el artículo — ver sección 9) |
| 6 | Money Manager (Realbyte) — web oficial | Web oficial de la empresa | https://www.realbyteapps.com/ |
| 7 | Money Manager — centro de ayuda oficial (PC Manager) | Documentación oficial | https://help.realbyteapps.com/hc/en-us/sections/360007416874-PC-Management (consultada, no citada en el artículo) |
| 8 | Emma — página oficial de planes | Página oficial de precios | https://emma-app.com/plans/compare-emma-plans |
| 9 | YNAB — página oficial de precios | Página oficial de precios | https://www.ynab.com/pricing |

---

## 8. Datos confirmados

- Fintonic: gratuita, conexión bancaria obligatoria, modelo de negocio publicitario/de intermediación con más de 40 entidades, sin posibilidad de desactivar la publicidad.
- Toshl Finance: empresa eslovena (Kranj, Eslovenia), estructura de planes Free/Pro/Medici confirmada.
- Money Manager: empresa coreana (Realbyte Inc.), gratuita, sin conexión bancaria (registro manual), acceso vía "PC Manager" existente (con el matiz técnico documentado).
- Emma: empresa británica, conexión Open Banking a múltiples bancos, plan gratuito limitado.
- YNAB: sin versión gratuita permanente (solo prueba de 34 días), sincronización bancaria disponible en EE.UU./Canadá/Reino Unido/UE vía import directo.
- Kakebo AI: gratuita (confirmado por código, pagos desactivados explícitamente), sin conexión bancaria (ausencia de integración en el código), categorización por IA en categorías del método Kakebo.

## 9. Datos corregidos

- **Spendee — nacionalidad de la empresa:** "austriaca" → "checa". Único dato objetivo corregido en esta tarea. Contradicción interna evidente en el texto original (mencionaba Praga, ciudad de la República Checa, mientras calificaba la empresa de austriaca). Fuente: página oficial "About" de Spendee, que identifica a la empresa como "SPENDEE a.s. Plynární 10, Praha 7-Holešovice, 170 00, Czech Republic, Europe".

## 10. Datos matizados

- Ninguno requirió matización textual en el cuerpo del artículo. El matiz sobre el "PC Manager" de Money Manager (acceso vía navegador en red local, no app de escritorio nativa) se documenta en este informe pero no se ha introducido en el artículo, al no contradecir la afirmación existente ("disponible") y no ser un tipo de dato que el prompt exija corregir.

## 11. Datos no verificables

- **Toshl Finance — cobertura geográfica de la conexión bancaria en países europeos.** La página oficial de precios no especifica países soportados para la sincronización bancaria; una fuente secundaria (no oficial) sugiere que el plan Medici prioriza bancos de EE.UU./Canadá. No hay evidencia oficial suficiente para confirmar ni contradecir la afirmación del artículo ("disponible en muchos países europeos"). **No se ha modificado el texto** — se documenta la limitación de verificación, conforme a la restricción del prompt de no interpretar ni asumir sin fuente concluyente.
- **Precios exactos en EUR de Spendee, Toshl, Emma y YNAB.** Las páginas oficiales consultadas muestran precios en USD o GBP con avisos explícitos de que "los precios pueden variar según el país". No se ha realizado ninguna conversión de moneda ni se ha asumido equivalencia, conforme a la restricción explícita del prompt ("no convertir moneda ni inventar equivalencias"). Los precios en EUR ya presentes en el artículo no se han tocado por no existir una fuente oficial en EUR que los contradiga de forma concluyente.

## 12. Claims editoriales no tratados como hechos

No se ha modificado ni verificado como "hecho objetivo" ninguna de las siguientes afirmaciones editoriales, ya presentes en el artículo y correctamente diferenciadas como valoración, no como dato factual:
- "Interfaz visual cuidada e intuitiva" (Spendee)
- "Interfaz un poco envejecida" (Toshl Finance)
- "Interfaz densa — curva de aprendizaje inicial" (Money Manager)
- "Curva de aprendizaje elevada" (YNAB)
- Cualquier valoración de tipo "Ideal para" / "Para quién es" en la tabla y las fichas

Estas expresiones son juicios editoriales de MetodoKakebo.com, no afirmaciones verificables mediante fuente oficial, y se mantienen sin cambios.

---

## 13. Enlaces añadidos

| # | Ubicación en el artículo | Texto ancla | URL | Afirmación respaldada |
|---|---|---|---|---|
| 1 | Nota al pie de la tabla comparativa | "según su propio modelo de negocio" | https://www.fintonic.com/es-ES/inicio/ | Modelo de negocio de Fintonic (publicidad/ofertas financieras de terceros) |
| 2 | Párrafo descriptivo de la ficha Spendee | "checa" | https://www.spendee.com/about | Nacionalidad de la empresa (corregido de "austriaca") |
| 3 | Párrafo descriptivo de la ficha Toshl Finance | "eslovena" | https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl | Nacionalidad de la empresa |
| 4 | Párrafo descriptivo de la ficha Money Manager | "coreana" | https://www.realbyteapps.com/ | Nacionalidad de la empresa |
| 5 | Párrafo descriptivo de la ficha Emma | "británica" | https://emma-app.com/plans/compare-emma-plans | Nacionalidad de la empresa |
| 6 | Párrafo descriptivo de la ficha YNAB | "con planes exclusivamente de pago" | https://www.ynab.com/pricing | Ausencia de versión gratuita permanente |

Ningún enlace usa parámetros de tracking, es de afiliación, ni apunta a una URL de búsqueda. Todos abren en pestaña nueva (`target="_blank" rel="noopener noreferrer"`) por comportamiento estándar y ya existente del componente `CustomLink` para enlaces externos — no se ha modificado dicho componente ni se le ha añadido `nofollow`.

---

## 14. Validación HTTP de enlaces

| URL | Código HTTP | Destino final |
|---|---|---|
| https://www.fintonic.com/es-ES/inicio/ | 200 | https://www.fintonic.com/es-ES/inicio/ |
| https://www.spendee.com/about | 200 | https://www.spendee.com/about |
| https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl | 200 | https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl |
| https://www.realbyteapps.com/ | 200 | https://www.realbyteapps.com/ |
| https://emma-app.com/plans/compare-emma-plans | 200 | https://emma-app.com/plans/compare-emma-plans |
| https://www.ynab.com/pricing | 200 | https://www.ynab.com/pricing |

Validado mediante `curl -L -A "Mozilla/5.0 (compatible; SourceCheck/1.0)"` el 2026-07-20. Ninguno redirige a un dominio distinto del oficial ni requiere autenticación para leer la información citada.

---

## 15. Riesgos y limitaciones

- Los precios en EUR mostrados en la tabla y las fichas no han podido re-verificarse con una fuente oficial específica en EUR para España; se mantienen sin cambios por prudencia (riesgo de introducir un error de conversión sería mayor que el de no actualizar un precio potencialmente desfasado en unos céntimos).
- La cobertura geográfica exacta de la conexión bancaria de Toshl Finance en Europa queda sin verificar de forma concluyente; si en el futuro se dispone de una fuente oficial específica, debería revisarse en una tarea independiente.
- Los precios y condiciones de terceros pueden cambiar sin previo aviso después de la fecha de verificación (2026-07-20); este documento no es una garantía permanente de vigencia.

---

## 16. Elementos protegidos

Confirmado que se han mantenido intactos: frontmatter, `title`, `seoTitle`, meta description, H1, introducción (de `CONTENT-INTRO-02`), los 2 headings de `HEADINGS-02`, el resto de headings, la estructura de la tabla (filas, columnas, orden de alternativas), el número de alternativas (8), todos los bloques de Pros/Contras/Para quién (ningún bullet se ha tocado), la FAQ completa, el CTA, los enlaces internos existentes, las imágenes, el schema manual (JSON-LD), el canonical, el hreflang y el slug.

---

## 17. Conclusión

El artículo ya era, en su mayoría, factualmente correcto. La verificación exhaustiva contra fuentes oficiales encontró un único error objetivo (nacionalidad de Spendee), ya corregido y citado. Se ha añadido trazabilidad verificable a 6 afirmaciones clave sin alterar la arquitectura editorial, la neutralidad ni la estructura ya aprobadas en tareas anteriores del milestone.

---

## 18. Siguiente tarea recomendada

**`SEO-ONPAGE-ALTERNATIVAS-FINTONIC-FAQ-GEO-02`**
