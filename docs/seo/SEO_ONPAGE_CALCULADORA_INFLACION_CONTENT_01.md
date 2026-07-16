# SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01 — Reforzar precisión, frescura y fuentes oficiales

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`
**Tipo:** Corrección de contenido factual y añadido de fuentes oficiales. Sin cambios de funcionalidad, metadata ni schema.

## 1. Objetivo

Revisar y mejorar la fiabilidad factual del contenido visible de `https://www.metodokakebo.com/herramientas/calculadora-inflacion`: verificar afirmaciones económicas, estadísticas, temporales y legales; corregir o eliminar información desactualizada o no demostrable; añadir enlaces a fuentes oficiales; y documentar con claridad la metodología y las limitaciones de la calculadora actual. Sin modificar la funcionalidad de la calculadora.

## 2. Commit base

`72636cd9b0db145dd9aab24d9bed6854dbc02b1b` (`fix(seo): corregir semántica de calculadora de inflación`, `SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01`), rama `main`, sincronizada con `origin/main` al iniciar.

## 3. Archivos revisados

- `messages/es.json` — namespace `Tools.Inflation.content` (todas las afirmaciones visibles).
- `messages/en.json` — mismo namespace, versión inglesa (misma calculadora, `/en/herramientas/calculadora-inflacion`).
- `src/components/landing/tools/CalculatorInflation.tsx` — render de todo el contenido, fórmula funcional, inputs/outputs, CTA, gráfico.
- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` — metadata, schema JSON-LD (revisado, no modificado: schema debe permanecer intacto).
- `docs/seo/VALIDACION_SEO_ONPAGE_CALCULADORA_INFLACION_01.md` — contexto de la auditoría previa.
- Fuentes oficiales consultadas (ver sección 7).

## 4. Afirmaciones auditadas

| Afirmación | Archivo | Estado | Fuente | Acción |
|---|---|---|---|---|
| "Media histórica 2000-2024: ~2.5%" (`inputs.inflationDisclaimer`) | `es.json`/`en.json` | SIN FUENTE | — | CORREGIR — reformulada como ejemplo + enlace al portal IPC del INE |
| "La inflación es el aumento generalizado y sostenido de los precios..." / definición IPC (`content.whatText`) | `es.json`/`en.json` | VERIFICADA | Definición estándar, consistente con la metodología pública del INE | Sin cambios |
| "Imagina que guardas 10.000€... con una inflación media del 3% anual" + lista (`content.impactText`/`impactList`) | `es.json`/`en.json` | OPINIÓN O EJEMPLO | — (ejemplo matemático, no dato real) | CORREGIR — se aclara explícitamente "hipotética"/"en este ejemplo" |
| "Es fundamental comprobar si existe un tope máximo legal (como el límite del 3% en España durante 2024-2025)" (`content.rentText`) | `es.json`/`en.json` | DESACTUALIZADA / IMPRECISA | INE (`dyngs/IPC`), BOE-A-2024-26685, Ley 12/2023, Ley 29/1994 art. 18 | **ELIMINAR** — no existe un porcentaje único vigente; sustituida por explicación prudente con enlaces oficiales |
| "se toma la tasa interanual publicada por el INE el mes anterior al aniversario del contrato" (`content.rentText`) | `es.json`/`en.json` | IMPRECISA (simplificación) | INE — `dyngs/IPC/es/index.htm?cid=1436` | CORREGIR — reescrita dentro del bloque prudente, con enlace directo a la herramienta oficial |
| "Una inflación del 2% anual durante 10 años... han subido más del 21.8%..." (`content.accumulatedText`) | `es.json`/`en.json` | VERIFICADA | Cálculo matemático de interés compuesto, no depende de dato externo | Sin cambios |
| Tabla comparativa: colchón 0%→-3%; ahorro 1-2%→-1/-2%; S&P500 7-10%→+4/+7% (`content.tableRows`) | `es.json`/`en.json` | SIN FUENTE (rangos genéricos ilustrativos) | — | CORREGIR — se mantienen los rangos como ejemplo, se añade nota explícita de descargo bajo la tabla y se ajusta el encabezado "con IPC 3%" a "ejemplo con 3% de inflación" |
| Fórmula de variación del IPC y su uso legal para actualizar rentas/salarios (`content.faq.a2`/`a2b`) | `es.json`/`en.json` | VERIFICADA | INE — coincide con `Renta actualizada = Renta inicial × (IPC final / IPC inicial)` | CORREGIR (mejora, no error) — se añaden enlaces a la herramienta oficial de actualización de rentas y al simulador de variación del IPC |
| "inflación acumulada en España desde el año 2000 (aproximadamente 60-70%)... necesitarías cerca de 1.700€" (`content.faq.a3`) | `es.json`/`en.json` | SIN FUENTE / IMPRECISA | — (cifra no verificable sin fecha exacta) | **ELIMINAR** cifra concreta — sustituida por explicación orientativa + enlace al simulador oficial del INE |
| Definición IPC/INE sin enlace (`content.faq.a1`) | `es.json`/`en.json` | VERIFICADA (correcta, sin enlazar) | INE | CORREGIR — se añade enlace al INE |
| FAQPage / SoftwareApplication / DefinedTerm (schema JSON-LD, `page.tsx`) | `page.tsx` | Fuera de alcance | — | **NINGUNA** — el schema debe permanecer intacto por restricción explícita de la tarea |

## 5. Afirmaciones eliminadas

- **"el límite del 3% en España durante 2024-2025"** — eliminada por completo. No existe un tope legal único aplicable a todos los contratos en ese periodo: el artículo 18 LAU limita el incremento a la variación del IPC salvo pacto distinto, y desde 2025 la Ley 12/2023 sustituye ese límite, solo para los contratos a los que aplica, por el Índice de Referencia de Arrendamientos de Vivienda (IRAV) que calcula el INE mensualmente (BOE-A-2024-26685) — no es un porcentaje fijo.
- **"aproximadamente un 60-70% acumulado"** y **"necesitarías cerca de 1.700€"** — eliminadas como cifras concretas sin fuente ni fecha verificable; sustituidas por una remisión al simulador oficial del INE para obtener el dato exacto en el momento de la consulta.

## 6. Afirmaciones corregidas

- `inputs.inflationDisclaimer`: de una media histórica no verificada ("~2.5%") a una indicación de que es una tasa de ejemplo, con enlace al portal oficial del IPC.
- `content.impactText`: se añade "hipotética"/"en este ejemplo" para no presentar el 3% como un dato real vigente.
- `content.rentText`: reescritura completa (ver sección 11).
- `content.tableHeaders.realResult`: de "con IPC 3%" (sonaba a dato actual) a "ejemplo con 3% de inflación".
- `content.faq.a1`: se enlaza la mención al INE.
- `content.faq.a2b`: se añaden enlaces a las herramientas oficiales del INE.
- `content.faq.a3`: reescritura completa (ver sección 11).

## 7. Fuentes oficiales utilizadas

Todas verificadas mediante consulta directa (`curl`/fetch) a la fuente primaria antes de redactar el contenido:

- **INE — Actualización de rentas de alquiler con el IPC (LAU):** `https://www.ine.es/dyngs/IPC/es/index.htm?cid=1436` — confirma la fórmula oficial `Renta actualizada = Renta inicial × (IPC mes final / IPC mes inicial)` y que el mecanismo varía según el periodo entre el que se actualiza.
- **INE — Índice de Referencia de Arrendamientos de Vivienda (IRAV):** `https://www.ine.es/jaxiT3/Tabla.htm?t=72975` — confirma la existencia y nombre oficial del índice, con datos publicados desde noviembre de 2024.
- **INE — Simulador de variación del IPC (`varipc`):** `https://www.ine.es/varipc/` — herramienta oficial para calcular la variación entre fechas.
- **BOE-A-2024-26685** (Resolución del INE, Ley 12/2023): `https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-26685` — confirma que, a los efectos del artículo 18 de la Ley 29/1994 (LAU), el índice de referencia aplicable desde 2025 es el **mínimo** entre la tasa de variación anual del IPC, la del IPC subyacente y una tasa de variación anual media ajustada (fórmula TVAMA) — no un porcentaje fijo como "3%".
- **BOE-A-2026-9359** (derogación del Real Decreto-ley 8/2026): `https://www.boe.es/buscar/doc.php?id=BOE-A-2026-9359` — confirma que la medida temporal de marzo de 2026 relacionada con el alquiler fue derogada el 28/04/2026; por eso no se ha incorporado ninguna referencia a esa norma temporal en el copy, para evitar introducir información ya obsoleta.

No se han utilizado blogs, bancos, comparadores ni medios como fuente de ninguna afirmación normativa o estadística.

## 8. Enlaces externos añadidos

Todos con anchor descriptivo, `target="_blank"` y `rel="noopener noreferrer"` (convención ya usada en el proyecto, ver `src/components/mdx/MDXComponents.tsx`):

| Anchor (ES) | Destino | Ubicación |
|---|---|---|
| "INE" | `https://www.ine.es/ipc/` | `inputs.inflationDisclaimer` |
| "Índice de Referencia de Arrendamientos de Vivienda" | `https://www.ine.es/jaxiT3/Tabla.htm?t=72975` | `content.rentText` |
| "herramienta oficial de actualización de rentas del INE" | `https://www.ine.es/dyngs/IPC/es/index.htm?cid=1436` | `content.rentText` |
| "portal del IPC del INE" | `https://www.ine.es/ipc/` | `content.methodologyList.orientative` |
| "INE" | `https://www.ine.es/ipc/` | `content.faq.a1` |
| "herramienta de actualización de rentas del INE" | `https://www.ine.es/dyngs/IPC/es/index.htm?cid=1436` | `content.faq.a2b` |
| "variación oficial del IPC entre fechas" | `https://www.ine.es/varipc/` | `content.faq.a2b` |
| "simulador oficial de variación del IPC del INE" | `https://www.ine.es/varipc/` | `content.faq.a3` |

## 9. Metodología documentada

Nueva sección visible (H2 "Metodología y limitaciones de esta calculadora") que explica, en una lista, que: la tasa de inflación la introduce el usuario manualmente; la calculadora no consulta datos del INE en tiempo real; el cálculo es una proyección matemática de interés compuesto inverso (`Valor Real = Ahorros ÷ (1 + tasa)^años`); no utiliza todavía series históricas oficiales del IPC ni calcula la variación real entre dos fechas; y que el resultado es orientativo, con enlace al portal del IPC del INE para el dato oficial vigente.

## 10. Limitaciones añadidas

Nueva subsección (H3 "Limitaciones", anidada bajo el H2 anterior — jerarquía válida) que indica: que la inflación real varía con el tiempo y no sigue una tasa constante; que el IPC es una media estadística nacional y el impacto personal puede diferir; que el cálculo no incluye impuestos, comisiones ni la rentabilidad real de ningún producto financiero; y que la calculadora no constituye asesoramiento financiero ni legal.

Se añade también una indicación discreta al final del contenido (`content.revisionNote`, sin heading): fecha de última revisión (16 de julio de 2026), fuentes principales (INE y BOE), y naturaleza orientativa del cálculo.

## 11. Copy anterior y nuevo de los bloques sensibles

### Bloque de actualización de alquiler (`content.rentText`, ES)

**Antes:**
> Si tu contrato de alquiler especifica que la renta se actualizará conforme al IPC, el propietario puede subirte el precio anualmente. Para calcularlo, se toma la tasa interanual publicada por el INE el mes anterior al aniversario del contrato. Es fundamental comprobar si existe un tope máximo legal (como el límite del 3% en España durante 2024-2025).

**Después:**
> Si tu contrato de alquiler prevé actualizar la renta según el IPC, la subida real depende del contrato firmado, de la fecha de cada anualidad y de la normativa vigente en ese momento: no existe un porcentaje único aplicable a todos los casos. El artículo 18 de la Ley de Arrendamientos Urbanos limita el incremento anual a la variación del IPC salvo que se haya pactado otra cosa, y desde 2025 la Ley 12/2023 por el derecho a la vivienda sustituye ese límite, en los contratos a los que aplica, por el **Índice de Referencia de Arrendamientos de Vivienda** que calcula el INE cada mes. Para actualizar tu renta con el dato exacto de tu contrato, usa la **herramienta oficial de actualización de rentas del INE**. Esta página no ofrece asesoramiento jurídico: ante cualquier duda sobre tu contrato, consulta la normativa vigente o a un profesional.

### FAQ "¿Cuánto vale mi dinero de 2000 hoy en España?" (`content.faq.a3`, ES)

**Antes:**
> Debido a la inflación acumulada en España desde el año 2000 (aproximadamente un 60-70% acumulado), para comprar lo mismo que comprabas con 1.000€ en el año 2000, hoy necesitarías cerca de **1.700€**.

**Después:**
> La inflación acumulada en España desde el año 2000 es considerable, aunque la cifra exacta varía según el mes de referencia. Para saber cuánto necesitarías hoy para igualar el poder adquisitivo de una cantidad del año 2000, consulta el **simulador oficial de variación del IPC del INE**.

(Los equivalentes en inglés siguen el mismo criterio en `messages/en.json`.)

## 12. Validaciones

- `npx tsc --noEmit` ✅ 0 errores.
- `npm run lint` ✅ 0 errores (76 warnings preexistentes, no relacionados). Se detectó y corrigió 1 error nuevo (`react/display-name` sobre el helper `externalLink`) convirtiendo la función anónima en una función nombrada (`ExternalLink`) antes del commit.
- `npm run build` ✅ Compiled successfully, `/herramientas/calculadora-inflacion` y `/en/herramientas/calculadora-inflacion` presentes en el build.
- `node -e "JSON.parse(...)"` ✅ `messages/es.json` y `messages/en.json` sintácticamente válidos tras la edición.
- Servidor local (`npm run start`) + inspección del HTML real servido en `/herramientas/calculadora-inflacion` y `/en/herramientas/calculadora-inflacion`:
  - Jerarquía de headings: 1×H1, 6×H2, 9×H3, sin saltos de nivel (se añaden 2 headings nuevos: H2 "Metodología y limitaciones..." y H3 "Limitaciones", ambos válidamente anidados).
  - Un único `<footer>` en ambos locales.
  - "Producto"/"Cuenta"/"Legal" (ES) y "Product"/"Account"/"Legal" (EN) aparecen una sola vez.
  - 4 enlaces distintos a `ine.es` (8 anchors totales contando repeticiones) presentes en el HTML servido, todos con `target="_blank" rel="noopener noreferrer"` y anchor descriptivo — ningún enlace roto (todas las URLs verificadas con HTTP 200 antes de usarse).
  - Ausencia confirmada de la cadena `"límite del 3%...2024"` (ES) y `"3% limit...2024"` (EN) en el HTML renderizado.
  - `meta description`, `title`, `canonical` idénticos a los verificados en las tareas anteriores.
  - Schema (`SoftwareApplication`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`) intacto, sin modificar `page.tsx`.
  - Los 3 inputs de la calculadora (`savings-input`, `inflation-input`, `years-input`) presentes y funcionales; fórmula de cálculo sin tocar.
  - CTA "Protege tus ahorros del IPC" y enlaces (`/login?source=calculator_inflation`, `/herramientas/regla-50-30-20`) intactos.
  - `content.tableNote` y `content.revisionNote` presentes en el HTML renderizado de ambos locales.

## 13. Riesgos pendientes

- Los rangos de rentabilidad de la tabla comparativa (colchón/ahorro/S&P500) siguen siendo ilustrativos sin una fuente numérica citada; se ha añadido un descargo explícito, pero una vinculación a una fuente oficial (Banco de España/CNMV) queda pendiente de una tarea futura si se considera necesario.
- No se ha verificado la vigencia exacta, a fecha de esta tarea, de los parámetros α y β de la fórmula TVAMA del IRAV (se publican mensualmente por el INE); el copy evita citar un valor concreto y remite a la fuente oficial, por lo que este riesgo queda mitigado pero no eliminado si el INE cambia el nombre o la URL de sus herramientas.
- Los textos concatenados detectados en `SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01` (hallazgo 5) siguen sin corregirse — explícitamente fuera de alcance de esta tarea.
- No se ha implementado el cálculo histórico entre dos fechas ni conexión con la API del INE — explícitamente fuera de alcance.
- La keyword "calculadora de inflación España" se ha incorporado de forma natural en el subtítulo visible; no se ha forzado en ningún otro bloque — pendiente de validar su efecto en SE Ranking/GSC en un snapshot posterior.

## 14. Siguiente tarea única recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01` — corregir los textos concatenados identificados en la auditoría original (hallazgo 5: "Pérdida de Valor Real...", "Poder de Compra Futuro...", "Crear cuenta gratis...Ver regla 50/30/20"), añadiendo separadores textuales explícitos entre nodos hermanos sin alterar el diseño visual.
