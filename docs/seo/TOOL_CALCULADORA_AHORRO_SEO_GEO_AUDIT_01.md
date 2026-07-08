# TOOL-CALCULADORA-AHORRO-SEO-GEO-AUDIT-01
## Auditoría SEO/GEO — /herramientas/calculadora-ahorro

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado — solo documentación, sin cambios en código  
**URL auditada:** `https://www.metodokakebo.com/herramientas/calculadora-ahorro`  
**Post-implementación:** V2 validada en producción (commit `e986a1d`)  
**Documentación previa:** `TOOL_CALCULADORA_AHORRO_V2_AUDIT_01.md` (auditoría funcional)

---

## 1. Estado actual de la URL

### Archivos principales
| Archivo | Rol |
|---|---|
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Metadata, JSON-LD, wrapper de la página |
| `src/components/landing/tools/SavingsCalculator.tsx` | Componente interactivo (client) — todo el contenido visible |
| `messages/es.json` → `Tools.Savings.*` | Strings i18n de la herramienta |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/layout.tsx` | Layout vacío (passthrough) |

### Señales técnicas actuales
| Señal | Valor actual |
|---|---|
| **title** | `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"` |
| **meta description** | `"Calcula cuánto ahorrar al mes con nuestra calculadora de ahorro gratuita. Plan de ahorro mensual personalizado con el método japonés Kakebo."` |
| **H1** | `"Calculadora de Ahorro Mensual"` (renderizado en el componente) |
| **H2 principal** | `"¿Para qué sirve la calculadora de ahorro mensual?"` |
| **H3** | `"Sigue mejorando tu plan de ahorro:"` |
| **Canonical** | `https://www.metodokakebo.com/herramientas/calculadora-ahorro` ✅ |
| **Hreflang** | es + en + x-default declarados ✅ |
| **Open Graph title** | `"Calculadora de Ahorro Mensual \| Simula tu Plan de Ahorro"` |
| **Open Graph type** | `website` |
| **Imagen OG** | ❌ No declarada (sin `openGraph.images`) |
| **Schema** | `SoftwareApplication` + `FAQPage` (3 preguntas) en array JSON-LD |
| **Sitemap** | Incluida, priority 0.9, changeFrequency weekly ✅ |
| **Indexabilidad** | No noindex → indexable ✅ |
| **Navbar** | 2 entradas (desktop dropdown + mobile menu) ✅ |
| **Footer** | 1 entrada ✅ |

---

## 2. Problemas SEO detectados

### P0 — Críticos (bloquean rendimiento)

#### P0-1: Imagen Open Graph ausente
- **Problema:** La metadata no declara `openGraph.images`. Cuando un artículo o un resultado de búsqueda comparte la URL, Google/redes sociales mostrarán el OG genérico del sitio o nada.
- **Impacto:** CTR reducido en resultados enriquecidos y en compartidos sociales.
- **Fix:** Añadir `openGraph.images` con una imagen de 1200×630 px específica de la herramienta.

#### P0-2: FAQPage con solo 3 preguntas y enfoque desalineado
- **Problema:** El schema `FAQPage` tiene 3 preguntas. Las tres son correctas pero no cubren las long-tails más buscadas:
  - "cuánto debo ahorrar" ✅ cubierta
  - "diferencia gastos fijos y variables" ✅ cubierta
  - "cuánto tiempo para objetivo" ✅ cubierta
  - "cómo calcular mi capacidad de ahorro" ❌ no cubierta
  - "cuánto ahorrar con 1500€ / 2000€ / 3000€" ❌ no cubierta
  - "qué porcentaje de ahorro es bueno" ❌ no cubierta
  - "fondo de emergencia cuánto" ❌ no cubierta
- **Impacto:** Se pierden fragmentos de preguntas frecuentes potencialmente ricos.

#### P0-3: Sin contenido visible que explique qué hace la herramienta ANTES de que el usuario interactúe
- **Problema:** El H1 y el subtítulo del componente son suficientes para un usuario que ya sabe qué busca, pero no hay un bloque de texto breve previo a la calculadora que explique:
  - qué es el margen de ahorro real
  - en qué se diferencia de la regla 50/30/20
  - por qué es importante calcular gastos fijos Y variables
- **Impacto SEO:** Los crawlers ven poco texto informativo antes del widget interactivo. El contenido prose está al final (después de la herramienta). Google puede no asociar suficientemente el contenido al intent.
- **Impacto GEO:** Un modelo generativo que cite esta página necesita contexto semántico inmediato; si no hay texto denso above/near-the-fold, es menos probable que la use como fuente.

---

### P1 — Altos (degradan rendimiento o visibilidad)

#### P1-1: Title no incluye keyword "calculadora de ahorro mensual" al inicio
- **Actual:** `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"`
- **Análisis:** El title empieza con la keyword exacta, lo que es correcto. Sin embargo, a 55 chars + sufijo del sitio puede quedar: `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes? | MetodoKakebo.com"` → ~76 chars, probablemente truncado en SERP. El truncado oculta "MetodoKakebo.com" o la segunda parte del title según el dispositivo.
- **Fix menor:** Acortar a ~50-52 chars para que el sufijo del sitio sea siempre visible.

#### P1-2: Meta description no incluye diferenciador funcional clave (gastos fijos + variables + objetivo)
- **Actual:** `"Calcula cuánto ahorrar al mes con nuestra calculadora de ahorro gratuita. Plan de ahorro mensual personalizado con el método japonés Kakebo."`
- **Problema:** El gran avance de la V2 (gastos fijos Y variables, sección de objetivo) no se menciona. La descripción no convierte la novedad funcional en argumento de clic.
- **Fix:** Incluir "ingresos, gastos fijos y variables" y "calcula cuánto tiempo para tu objetivo" dentro de los 150-155 chars.

#### P1-3: H2/H3 prose no aprovechan long-tails de alto volumen
- **Actual H2:** `"¿Para qué sirve la calculadora de ahorro mensual?"`
- **Actual H3:** `"Sigue mejorando tu plan de ahorro:"`
- **Oportunidades perdidas:**
  - `"¿Cómo calcular tu capacidad de ahorro mensual?"` (exact-match para long-tail)
  - `"¿Cuánto deberías ahorrar cada mes? La regla del 20%"` (featured snippet candidate)
  - `"¿Qué hacer cuando el margen es negativo?"` (problema real del usuario)
  - `"Cómo calcular cuánto tiempo necesitas para un objetivo de ahorro"` (long-tail de la sección de objetivo)

#### P1-4: El schema `SoftwareApplication` usa `@id` sin definir
- **Actual:** `"publisher": { "@id": "https://www.metodokakebo.com/#organization" }`
- **Problema:** El `@id` referencia una entidad Organization que puede no estar definida en ningún JSON-LD del sitio (depende del schema del Home). Si el Home no tiene un `Organization` con ese `@id`, el grafo queda roto.
- **Acción:** Verificar que el Home tiene `Organization` con `@id: "https://www.metodokakebo.com/#organization"`. Si no, cambiar a objeto completo o eliminar la referencia.

#### P1-5: Sin enlace interno desde la herramienta hacia `/blog/como-ahorrar-dinero-cada-mes`
- **Análisis de interlinking entrante:**
  - `como-ahorrar-dinero-cada-mes.es.mdx` → enlaza a la calculadora ✅
  - `como-hacer-un-presupuesto-personal.es.mdx` → enlaza x3 ✅
  - `cuentas-remuneradas.es.mdx` → enlaza x2 ✅
  - `plantilla-kakebo-excel.es.mdx` → enlaza ✅
  - `regla-30-dias.es.mdx` → enlaza ✅
- **Análisis de interlinking saliente desde la herramienta:**
  - `→ /blog/como-hacer-un-presupuesto-personal` ✅
  - `→ /blog/metodo-kakebo-para-autonomos` ✅
  - `→ /blog/ahorro-pareja` ✅
  - `→ /blog/como-ahorrar-dinero-cada-mes` ❌ (artículo que enlaza hacia aquí pero no recibe enlace de vuelta)
  - `→ /blog/cuentas-remuneradas` ❌ (artículo reciente que ya enlaza a la calculadora)
  - `→ /herramientas/calculadora-inflacion` ❌ (herramienta relacionada — inflación afecta al objetivo de ahorro)

---

### P2 — Medios

#### P2-1: Open Graph `type: "website"` correcto pero podría ser más específico
- Para herramientas, `type: "website"` es aceptable. No es un error.

#### P2-2: Layout vacío (passthrough) — puede eliminarse sin impacto
- `layout.tsx` es `return <>{children}</>`. No rompe nada, pero es ruido.

#### P2-3: URL en inglés no tiene versión de contenido real — potencial señal contradictoria
- La URL `/en/herramientas/calculadora-ahorro` existe (hreflang declarado) pero el componente solo tiene strings en ES. Si el locale cambia a `en`, se servirían strings en español bajo una URL en inglés. Riesgo bajo mientras el sitio no tenga tráfico EN significativo, pero es una deuda técnica.

#### P2-4: El bloque "Consejos Kakebo" (tips) fue eliminado en V2 sin reemplazo editorial
- En V1 había un bloque `tips` visible en el panel de inputs. En V2 fue eliminado. El contenido era:
  - `"El secreto Kakebo: El método no te dice 'no gastes'…"`
- El string sigue en `messages/es.json` pero no se renderiza. Representa una oportunidad GEO perdida.

---

### P3 — Bajos / Opcionales

#### P3-1: `SoftwareApplication` podría complementarse con `HowTo`
- Un schema `HowTo` con 3-4 pasos ("Introduce tus ingresos → Añade tus gastos fijos → Añade tus gastos variables → Lee tu margen") mejoraría la elegibilidad para resultados enriquecidos de tipo instrucción.

#### P3-2: No hay `author` / `dateModified` en el schema de la herramienta
- La herramienta no declara fecha de última modificación en el schema. En `SoftwareApplication` no es obligatorio, pero `dateModified: "2026-07-08"` añadiría señal de frescura.

---

## 3. Problemas GEO detectados

GEO (Generative Engine Optimization): capacidad de la página para ser citada, resumida o reutilizada correctamente por motores generativos (ChatGPT, Gemini, Perplexity, etc.).

### G1 — Sin definición explícita de "calculadora de ahorro mensual" en la página
- **Problema:** Ningún párrafo de la página contiene la frase "Una calculadora de ahorro mensual es…" o similar.
- **Impacto:** Los modelos que buscan definir el término en una respuesta RAG no encuentran un párrafo citeable como definición.
- **Fix:** Añadir 2-3 frases de definición como primer bloque de texto visible, antes o después del H1.

### G2 — La fórmula del margen real no está escrita en texto visible
- **Problema:** El código calcula `margenReal = income - fixedExpenses - variableExpenses`, pero esa fórmula no está escrita en ningún párrafo de la página.
- **Impacto:** Un modelo generativo que quiera explicar cómo funciona la herramienta no puede extraer la fórmula del texto — tendría que inferirla del DOM o del código.
- **Fix:** Añadir al bloque de texto introductorio o al prose: "El margen real de ahorro se calcula restando tus gastos fijos y tus gastos variables a tus ingresos netos: **Margen real = Ingresos netos − Gastos fijos − Gastos variables**."

### G3 — Sin ejemplos numéricos en el texto visible
- **Problema:** El prose actual no incluye ningún ejemplo concreto ("Si cobras 2.000 € y tienes 800 € de gastos fijos y 500 € de variables, tu margen real es 700 €, un 35% de tus ingresos").
- **Impacto:** Los modelos generativos priorizan páginas con ejemplos concretos para responder preguntas del tipo "cuánto puedo ahorrar si cobro X€".
- **Fix:** Añadir 1-2 ejemplos numéricos en el prose o en una tabla ilustrativa.

### G4 — Las tres FAQ del schema no están renderizadas como texto visible en la página
- **Problema:** Las 3 preguntas del `FAQPage` JSON-LD no tienen correspondencia en el HTML visible. Están solo en el script de schema. Un modelo que scrapee la página no las verá en el DOM de texto.
- **Impacto:** Las preguntas y respuestas no son citables por modelos generativos que lean el HTML visible.
- **Fix:** Renderizar las FAQ como sección HTML visible (acordeón o lista simple), no solo en JSON-LD.

### G5 — No se menciona el concepto "fondo de emergencia" en ningún contexto visible
- **Problema:** El campo de objetivo incluye en el placeholder "Fondo de emergencia, viaje, entrada de piso…", pero el prose no explica la relación entre el margen de ahorro y el fondo de emergencia.
- **Impacto:** La herramienta está perfectamente posicionada para responder "cuánto tiempo tardaré en tener un fondo de emergencia de 3 meses", pero ese caso de uso no aparece en texto.

### G6 — Ausencia de contexto sobre el método Kakebo en texto visible
- **Problema:** El H1 es genérico ("Calculadora de Ahorro Mensual"). La referencia al método Kakebo aparece solo en el prose al final ("El **método Kakebo** no trata solo de apuntar gastos…") y en el label del sidebar ("Objetivo Kakebo (20%)").
- **Impacto:** Los modelos que buscan herramientas del método Kakebo necesitan esa asociación explícita antes del fold.
- **Fix:** El subtítulo o el primer párrafo debería mencionar explícitamente "método Kakebo" y el objetivo del 20%.

### G7 — El publisher/autor de la herramienta no es identificable
- **Problema:** El schema `SoftwareApplication` tiene `publisher: { "@id": "..." }` pero no tiene `author`, `creator` ni mención visible de "MetodoKakebo.com" cerca del H1.
- **Impacto GEO:** Los modelos que evalúan autoridad editorial de una herramienta necesitan ver quién la publica cerca del contenido.

---

## 4. Análisis de intención de búsqueda y long-tails

### Intención principal capturada
- **Query:** `calculadora de ahorro mensual` / `calculadora ahorro` / `cuánto puedo ahorrar al mes`
- **Tipo de intención:** Herramienta (DO) + informativa complementaria (KNOW)
- **Satisfacción actual:** Alta (la herramienta funciona y da un resultado real). La satisfacción informativa es media-baja (poco texto contextual).

### Long-tails que la página podría capturar (actualmente no)
| Query | Volumen estimado | Estado |
|---|---|---|
| `calculadora ahorro mensual gratis` | Medio | Parcial (sin "gratis" en title/H1) |
| `cuánto debo ahorrar cada mes` | Alto | Parcial (FAQ lo cubre) |
| `cómo calcular mi capacidad de ahorro` | Medio | No |
| `cuánto tiempo para ahorrar X euros` | Medio | No (feature existe pero no en texto) |
| `calculadora fondo de emergencia` | Medio | No |
| `margen de ahorro mensual` | Bajo-medio | No |
| `calculadora ahorro objetivo` | Bajo | No |
| `cuánto ahorrar con 1500 euros de sueldo` | Bajo | No |
| `calculadora presupuesto personal` | Medio | Riesgo de cannibalización con `/blog/como-hacer-un-presupuesto-personal` |

### Riesgo de cannibalización
| URL | Keyword solapada | Nivel de riesgo |
|---|---|---|
| `/herramientas/regla-50-30-20` | "calculadora ahorro", "cuánto ahorrar" | **Bajo** — la V2 se diferencia funcionalmente (margen real vs. distribución ideal). Pero el prose no explica explícitamente la diferencia. |
| `/blog/como-ahorrar-dinero-cada-mes` | "cuánto ahorrar al mes", "cómo ahorrar dinero" | **Bajo** — el artículo captura el intent informativo, la herramienta el transaccional |
| `/blog/como-hacer-un-presupuesto-personal` | "calculadora presupuesto" | **Bajo-medio** — el artículo enlaza a la herramienta, por lo que Google puede considerar la herramienta como recurso subordinado, no competidor |

**Conclusión de cannibalización:** No hay cannibalización activa. El riesgo principal es que la falta de diferenciación explícita en el prose de la herramienta haga que Google no entienda bien la diferencia entre esta calculadora y la de 50/30/20. Añadir un párrafo comparativo eliminaría ese riesgo.

---

## 5. Auditoría UX SEO

| Aspecto | Estado | Nota |
|---|---|---|
| ¿La herramienta aparece suficientemente arriba? | ✅ | La calculadora aparece sin scroll en desktop (sidebar sticky). En mobile, el H1 y el formulario aparecen al inicio. |
| ¿El usuario entiende qué introducir? | ✅ | Los labels descriptivos + placeholders son claros. |
| ¿El resultado aporta valor SEO? | ⚠️ | El resultado es interactivo y visual, pero no hay texto que explique qué significa el resultado (ej. "¿Qué significa una tasa del 15%?"). |
| ¿Faltan bloques de apoyo antes de la herramienta? | ✅ ❌ | Falta un bloque introductorio de 3-4 líneas antes del grid. |
| ¿Falta "cómo interpretar el resultado"? | ❌ | No hay sección visible que explique qué significa `tight`, `deficit`, `below_target` en términos de acción. Los status messages son útiles pero no extensibles como texto citeable. |
| ¿Falta "qué hacer después"? | ❌ | La sección CTA invita a crear cuenta, pero no hay texto que diga "Si tu margen es negativo, empieza por…" o "Si tu margen es positivo, el siguiente paso es…" |
| ¿Faltan enlaces hacia recursos relacionados? | ⚠️ | Hay 3 links en el prose. Faltan: `calculadora-inflacion`, `como-ahorrar-dinero-cada-mes`, `cuentas-remuneradas`. |
| ¿La sección de objetivo está visible sin interacción? | ❌ | La sección de objetivo está detrás de un toggle. No es visible en primera carga. El potencial SEO (long-tails de "cuánto tiempo para ahorrar X") no es crawleable. |

---

## 6. Propuesta de optimización (sin implementar)

### 6.1 Cambios en title y meta description

**Title actual:**  
`"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"` (52 chars)

**Title propuesto:**  
`"Calculadora de Ahorro Mensual Gratis | MetodoKakebo.com"` (55 chars)  
_Alternativa:_ `"Calculadora de Ahorro Mensual: Margen Real y Objetivos"` (54 chars)

**Justificación:**
- "Gratis" añade filtro de intención de DO sin coste.
- La alternativa incluye las dos funciones clave de la V2 ("margen real", "objetivos").
- Ambas caben dentro del límite visible sin truncado.

**Meta description actual:**  
`"Calcula cuánto ahorrar al mes con nuestra calculadora de ahorro gratuita. Plan de ahorro mensual personalizado con el método japonés Kakebo."` (142 chars)

**Meta description propuesta:**  
`"Calcula tu margen real de ahorro mensual: introduce ingresos, gastos fijos y variables y descubre cuánto puedes ahorrar y cuánto tiempo necesitas para tu objetivo. Gratis."` (172 chars → ajustar a ~155)  
_Versión ajustada:_ `"Calcula tu margen de ahorro real: ingresos menos gastos fijos y variables. También cuánto tiempo para tu objetivo. Gratis, sin registro."` (137 chars ✅)

---

### 6.2 Cambios en H1/H2

**H1 actual:** `"Calculadora de Ahorro Mensual"` — mantener (keyword exacta, correcto).

**Subtítulo actual:** `"Calcula cuánto puedes ahorrar al mes según tu situación real: ingresos, gastos fijos y variables."`  
**Subtítulo propuesto:** Añadir una segunda frase: `"…y calcula en cuántos meses puedes alcanzar cualquier objetivo de ahorro."` → Captura la long-tail del objetivo.

**H2 prose actual:** `"¿Para qué sirve la calculadora de ahorro mensual?"`  
**H2 propuesto (opción A):** `"¿Cómo calcular tu margen de ahorro mensual real?"` → exact-match long-tail  
**H2 propuesto (opción B):** Mantener + añadir segundo H2: `"¿Cuánto deberías ahorrar cada mes? La referencia del 20%"`

**H3 nuevo propuesto:** `"¿Cómo interpretar el resultado de la calculadora?"`

---

### 6.3 Bloques de contenido a añadir

#### Bloque A — Definición introductoria (before the grid / above the fold)
Texto breve (3-4 líneas, visible antes del grid de la calculadora):

> La **calculadora de ahorro mensual** calcula tu margen real disponible cada mes: el dinero que queda después de restar todos tus gastos fijos (alquiler, seguros, suscripciones) y todos tus gastos variables (alimentación, ocio, transporte) a tus ingresos netos. El método Kakebo recomienda que ese margen sea al menos el **20% de tus ingresos netos**.

**Propósito:** Contexto semántico GEO, definición citeable, introduce el concepto de "margen real" vs. distribución teórica.

#### Bloque B — "Cómo usar la calculadora" (paso a paso, antes del grid o al final del prose)
Lista de 4 pasos:
1. Introduce tus ingresos netos mensuales (lo que recibes tras impuestos).
2. Añade tus gastos fijos (compromisos mensuales que no varían: alquiler, hipoteca, seguros).
3. Añade tus gastos variables (alimentación, ocio, transporte, ropa).
4. Lee tu margen real y tu tasa de ahorro. Si tienes un objetivo (fondo de emergencia, viaje, entrada de piso), activa la sección "Añadir objetivo de ahorro".

**Propósito:** Candidato a schema `HowTo`, GEO, UX para usuarios que no entienden los campos.

#### Bloque C — "Cómo interpretar el resultado" (después del grid, antes del prose actual)
Tabla o mini-guía de los 5 estados:

| Resultado | Qué significa | Primer paso recomendado |
|---|---|---|
| Déficit | Gastos > Ingresos. No hay margen | Revisar gastos fijos o buscar ingresos adicionales |
| Margen cero | Los gastos consumen exactamente tus ingresos | Identificar el gasto variable más reducible |
| Margen ajustado (<10%) | Ahorras algo, pero cualquier imprevisto lo rompe | Construir un pequeño fondo de seguridad primero |
| Por debajo del 20% | Ahorras, pero por debajo del objetivo Kakebo | Revisar si algún gasto variable es reducible |
| Margen saludable (≥20%) | Cumples el objetivo mínimo del método Kakebo | Asignar el exceso a un objetivo concreto |

**Propósito:** GEO (texto citeable), UX (el usuario sabe qué hacer), reduce tasa de rebote.

#### Bloque D — Sección FAQ visible (HTML + schema)
Expandir FAQ de 3 a 6-7 preguntas y renderizarlas como HTML visible (además de en JSON-LD):

Preguntas propuestas:
1. ¿Cómo saber cuánto puedo ahorrar cada mes? (ya existe en schema)
2. ¿Cuál es la diferencia entre gastos fijos y variables? (ya existe en schema)
3. ¿Cuánto tiempo tardaré en alcanzar mi objetivo de ahorro? (ya existe en schema)
4. ¿Qué porcentaje de ahorro es suficiente? → "El método Kakebo recomienda el 20% como mínimo. Por debajo del 10%, el margen es tan ajustado que cualquier imprevisto lo elimina."
5. ¿Cómo calculo el dinero que necesito para un fondo de emergencia? → "Un fondo de emergencia estándar cubre entre 3 y 6 meses de gastos fijos. Si tus gastos fijos son 800 €/mes, tu objetivo sería entre 2.400 € y 4.800 €. Activa la sección 'Añadir objetivo' en la calculadora para saber cuántos meses necesitas."
6. ¿En qué se diferencia esta calculadora de la regla 50/30/20? → "La regla 50/30/20 calcula una distribución ideal teórica basada solo en tus ingresos. Esta calculadora usa tus gastos reales (fijos y variables) para calcular el margen que te queda de verdad, que puede ser muy diferente del 20% teórico."

**Propósito:** GEO crítico (preguntas visibles en HTML), featured snippets, cubre long-tails sin indexar.

---

### 6.4 Schema recomendado

**Mantener:**
- `SoftwareApplication` con `dateModified: "2026-07-08"` añadido
- `FAQPage` expandida a 6-7 preguntas

**Añadir:**
- `HowTo` con 4 steps para la sección "cómo usar la calculadora"
- Verificar / añadir `Organization` en el Home con `@id: "https://www.metodokakebo.com/#organization"` para que la referencia del schema de la herramienta resuelva correctamente

**Posible:**
- `BreadcrumbList` si el sitio no lo tiene ya en el Navbar (`Herramientas > Calculadora de Ahorro`)

---

### 6.5 Imagen Open Graph

- **Crear:** `public/images/og/calculadora-ahorro-og.jpg` (1200×630 px)
- **Concepto:** Fondo claro, barra apilada con los 3 colores (fijo / variable / margen), texto grande "Calculadora de Ahorro Mensual — MetodoKakebo.com", y un ejemplo de resultado (ej. "Tu margen: 700 €/mes | Tasa: 35%")
- **Añadir en metadata:** `openGraph.images: [{ url: "...", width: 1200, height: 630, alt: "..." }]`

---

### 6.6 Enlazado interno recomendado

**Desde la herramienta → salida (añadir al prose o bloque C):**
| Destino | Contexto de enlace | Prioridad |
|---|---|---|
| `/herramientas/calculadora-inflacion` | "Si tu margen de ahorro actual es pequeño, recuerda que la inflación reduce el valor de lo que ahorras. Comprueba cuánto poder adquisitivo pierdes." | Alta |
| `/blog/como-ahorrar-dinero-cada-mes` | Enlace desde "Sigue mejorando tu plan de ahorro" | Alta |
| `/blog/cuentas-remuneradas` | "Si tienes un margen estable, una cuenta remunerada puede hacer trabajar tu fondo de emergencia." | Media |
| `/blog/eliminar-gastos-hormiga` | "Si tu margen es menor del esperado, los gastos hormiga suelen ser la causa oculta." | Media |

---

### 6.7 CTAs recomendados

**Actual:** Un solo CTA al final de los resultados: "Crear mi Kakebo Gratis" → `/login?mode=signup&source=calculadora_ahorro`

**Recomendado añadir:**
- CTA secundario en el bloque de interpretación de resultado: "Ver cómo reducir gastos variables →" → `/blog/eliminar-gastos-hormiga` (texto, no botón)
- CTA de herramienta cruzada al final del prose: "¿Tu margen de ahorro pierde valor por la inflación?" → `/herramientas/calculadora-inflacion`

---

## 7. Archivos a tocar en la implementación

| Archivo | Cambio |
|---|---|
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | title, meta description, OG image, expandir FAQ_SCHEMA, añadir HowTo schema |
| `src/components/landing/tools/SavingsCalculator.tsx` | Bloque introductorio antes del grid, sección "cómo interpretar el resultado" tras el grid, FAQ visible, enlace hacia `calculadora-inflacion`, enlace hacia `como-ahorrar-dinero-cada-mes`, enlace hacia `cuentas-remuneradas` |
| `messages/es.json` → `Tools.Savings.*` | Nuevas claves para el bloque intro, sección de interpretación, FAQ ampliada, nuevos links |
| `public/images/og/calculadora-ahorro-og.jpg` | Crear imagen OG (puede ser tarea separada de diseño) |

---

## 8. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cannibalización con `/herramientas/regla-50-30-20` por añadir más texto general sobre ahorro | Bajo | Medio | El prose nuevo debe enfatizar "margen real" vs. "distribución ideal". No usar keywords de 50/30/20 en el nuevo contenido. |
| Añadir demasiado texto degrada la experiencia de herramienta (UX) | Medio | Medio | Los bloques de texto van antes y después de la calculadora, no dentro del grid interactivo. |
| El bloque "cómo interpretar el resultado" repite los status messages del componente | Bajo | Bajo | El bloque HTML va en el prose (no en el grid) y tiene formato diferente (tabla). |
| La imagen OG puede no crearse a tiempo para el commit de contenido | Bajo | Bajo | Añadir la metadata del OG sin imagen primero; la imagen puede llegar después. |

---

## 9. Validación prevista para la implementación

1. `npm run build` — sin errores TypeScript ni de compilación
2. Verificar H1 único en el HTML renderizado
3. Verificar que `<script type="application/ld+json">` contiene `FAQPage` con las preguntas ampliadas
4. Verificar que las FAQ son visibles en el HTML (no solo en JSON-LD)
5. Verificar que el `title` no supera ~55 chars antes del sufijo del sitio
6. Verificar que los nuevos enlaces internos cargan correctamente (404 check manual)
7. Pasar la URL por Google Rich Results Test: https://search.google.com/test/rich-results

---

## 10. Decisión

**IMPLEMENTAR** — Esta tarea tiene retorno esperado alto y riesgo bajo.

**Prioridad:**
1. **P0-inmediato:** Añadir imagen OG + expandir FAQ a HTML visible + bloque introductorio con definición y fórmula
2. **P1-siguiente sprint:** Title/meta ajustados, bloque "cómo interpretar resultados", enlace a `calculadora-inflacion` y a `como-ahorrar-dinero-cada-mes`
3. **P2-opcional:** HowTo schema, enlace a `cuentas-remuneradas`

**Siguiente tarea propuesta:**  
`TOOL-CALCULADORA-AHORRO-SEO-GEO-IMPL-01` — Implementar mejoras SEO/GEO de la calculadora de ahorro según esta auditoría.

---

## Apéndice: Interlinking entrante existente

| Fuente | Texto de enlace | Tipo |
|---|---|---|
| `como-ahorrar-dinero-cada-mes.es.mdx` | "calculadora de ahorro mensual" | Texto en cuerpo |
| `como-hacer-un-presupuesto-personal.es.mdx` | "calculadora de ahorro mensual" x3 | Texto + ToolCTA |
| `cuentas-remuneradas.es.mdx` | "la calculadora de ahorro" x2 | Texto + ToolCTA |
| `plantilla-kakebo-excel.es.mdx` | "calculadora de ahorro" | Texto en FAQ |
| `regla-30-dias.es.mdx` | (enlace contextual) | Texto en cuerpo |
| `Navbar.tsx` | "Calculadora de Ahorro" | Nav desktop + mobile |
| `Footer.tsx` | (texto de nav) | Footer |
| `herramientas/page.tsx` | (card de herramienta) | Directorio |
| `sitemap.ts` | `/herramientas/calculadora-ahorro` | Sitemap priority 0.9 |
