# SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02

**Tipo:** Arquitectura SEO, editorial, GEO y de conversión (diseño, sin implementación)
**Fecha de ejecución:** 2026-07-20
**Milestone:** SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02 (no se marca completo en esta tarea)
**Tareas previas:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-VALIDATION-02` (`035ed25`), `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02` (`0a946c3`)
**URL objetivo:** `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`

---

## 1. Resumen ejecutivo

Este documento diseña la arquitectura de optimización quirúrgica de la URL, sin implementarla. Se apoya exclusivamente en la validación técnica/editorial previa y en la decisión de keyword ya cerrada (`alternativas a fintonic` como principal, `alternativa a fintonic` como variante primaria).

La arquitectura propuesta mantiene el 90% de lo ya existente (tabla, fichas, FAQ, schema, enlazado, CTA único) y concentra el cambio en tres puntos quirúrgicos: **(1)** snippet (title/meta/H1) para incorporar "Fintonic" y un número de alternativas sin perder el framing "apps bancarias"; **(2)** un primer bloque/GEO de respuesta directa al inicio, inexistente hoy; **(3)** ajustes menores de estructura (una sección tipo pregunta antes de la tabla, una nota de neutralidad). No se recomienda tocar la tabla, las alternativas, el CTA único, el schema ni el enlazado más allá de un refuerzo puntual de anchor.

Se define un plan de 7 tareas atómicas independientes, ordenadas por impacto/riesgo, con la primera (`SNIPPET`) como recomendación de arranque, dado que es el hallazgo con evidencia más fuerte y el riesgo más contenido si se ejecuta con disciplina de longitud y sin perder "apps bancarias" del excerpt/body.

No se ha modificado el artículo, metadata, título, headings, tabla, alternativas, FAQ, enlaces, CTA, schema, canonical, hreflang, ni slug. Este documento y la actualización de estado son el único cambio de esta tarea.

---

## 2. Estado del repositorio

| Comprobación | Resultado |
|---|---|
| `git status` | Mismos cambios locales ajenos preexistentes de las dos tareas anteriores: `.claude/settings.local.json` modificado, submódulo `kakebo` con commits nuevos no trackeados, y untracked `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`. No se ha tocado ninguno. |
| `git branch --show-current` | `main` |
| `git fetch origin` | Sin cambios remotos nuevos |
| `git log -1 --oneline` (local) | `0a946c3 docs(seo): research Fintonic keywords and SERP` |
| `git log origin/main -1 --oneline` | `0a946c3 docs(seo): research Fintonic keywords and SERP` |
| `git diff origin/main..HEAD` | Vacío — rama local idéntica a `origin/main` |

**Confirmado:** rama `main`, sincronizada, commit base `0a946c3` (el de la tarea anterior). Es seguro proceder con el diseño.

Se releyó íntegramente `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`, `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_VALIDATION_02.md`, `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_KEYWORD_SERP_02.md`, el contenido actual del artículo (`src/content/blog/alternativas-a-app-bancarias.es.mdx`), la generación de metadata y JSON-LD (`src/app/[locale]/(public)/blog/[slug]/page.tsx`) y los componentes MDX disponibles (`src/components/mdx/MDXComponents.tsx`, `src/components/mdx/MDXClientCTAs.tsx`).

---

## 3. Contexto y baseline

### 3.1 Datos GSC (baseline, proporcionados en tareas anteriores)

| Ámbito | Clics | Impresiones | CTR | Posición media |
|---|---|---|---|---|
| URL agregada (todas las variantes) | 4 | 459 | ≈0,87 % | ≈8,19 |
| Cluster Fintonic | 1 | 131 | ≈0,76 % | ≈9,75 |

### 3.2 Datos SE Ranking (baseline, mercado ES, julio 2026)

6 keywords del cluster Fintonic, posiciones 8-10, volumen 50/mes, dificultad 14-32. Domain Trust 7, Page Trust de la URL 3, 0 backlinks, 0 dominios de referencia.

### 3.3 Decisión de keyword ya cerrada

| Campo | Valor |
|---|---|
| Principal | `alternativas a fintonic` |
| Variante primaria | `alternativa a fintonic` |
| Variantes secundarias | `fintonic alternativas`, `alternativa fintonic`, `fintonic alternativa`, `alternativas fintonic` |
| Intención | Informativa-comparativa con desenlace decisional |
| Descartadas | `qué es Fintonic`, `Fintonic es seguro`/`estafa`, `Fintonic empresas`, `Mint` como keyword propia ES |

### 3.4 Snippet actual (verificado en producción, sin cambios desde la validación)

| Elemento | Valor actual |
|---|---|
| Title | "Alternativas a Apps Bancarias para Controlar Gastos sin Conectar el Banco (2026) \| Blog Kakebo" (94 car.) |
| Meta description | "Comparativa 2026: las mejores alternativas a apps bancarias y Fintonic para controlar tus gastos sin conectar el banco ni ceder tus datos. Incluye Kakebo AI, Spendee, YNAB y más." (178 car.) |
| H1 | Idéntico al title |

### 3.5 Competidores de referencia (verificados directamente en la tarea anterior)

| Competidor | Posición | Patrón de title |
|---|---|---|
| Banktrack | 2 y 4 | "Las 8 mejores alternativas a Fintonic en 2026 \| Banktrack" |
| Cashual | 11 | "Alternativas a Fintonic en España [2026] \| 6 apps comparadas" |

---

## 4. Papel estratégico de la URL

1. **Intención principal que debe liderar:** comparativa informativa-decisional sobre alternativas a Fintonic — el usuario llega dudando si seguir con Fintonic (u otra app similar) y quiere una lista razonada de opciones.
2. **Intenciones secundarias que debe cubrir:** alternativas con conexión bancaria opcional/obligatoria (automatización); alternativas sin conexión bancaria (privacidad); framing más amplio "apps bancarias" (no exclusivo de la marca Fintonic), que según GSC capta el 71 % de las impresiones de la URL fuera del cluster Fintonic estricto.
3. **Intenciones que NO pertenecen a esta URL:** definición de qué es Fintonic como marca; seguridad/confianza de Fintonic ("¿es Fintonic una estafa?"); gestión financiera empresarial/tesorería; reseña en profundidad de una única app competidora.
4. **Perfil principal del usuario:** persona en España, usuaria o ex-usuaria de una app de finanzas conectada al banco, que empieza a cuestionar el acceso de terceros a sus datos bancarios y quiere decidir con qué sustituirla.
5. **Problema que quiere resolver:** "¿qué instalo en vez de Fintonic?", con submatices de privacidad, coste y comodidad.
6. **Decisión que debe poder tomar después de leer:** elegir, con criterio, una de las alternativas listadas (incluyendo Kakebo AI como una opción más, no como la única válida) según su perfil de privacidad/automatización.
7. **Papel dentro del cluster de MetodoKakebo.com:** es la puerta de entrada "por comparación" al método Kakebo — capta usuarios que no llegan buscando "método Kakebo" directamente sino huyendo de una alternativa concreta (Fintonic). Complementa a `metodo-kakebo-guia-definitiva` (entrada por método) y a `peligros-apps-ahorro-automatico` (entrada por preocupación de privacidad).
8. **Relación con otros activos:**
   - **App propia (Kakebo AI):** se presenta como una alternativa más dentro de la comparativa, no como el único desenlace posible.
   - **Método Kakebo:** ángulo diferencial ya explotado (registro consciente vs. automatización silenciosa); debe mantenerse pero sin monopolizar el espacio editorial dedicado a las alternativas externas.
   - **Control de gastos:** eje temático central, compartido con `calculadora-ahorro` y `regla-50-30-20`.
   - **Privacidad:** diferenciador editorial ya fuerte frente a Banktrack y Cashual — debe protegerse y reforzarse, no diluirse.
   - **Herramientas:** posible enlace contextual a `calculadora-ahorro`/`regla-50-30-20` como paso "después de elegir app", sin forzarlo si no aporta valor natural.
   - **Artículos de ahorro:** ya enlazan hacia esta URL (`como-ahorrar-dinero-cada-mes`, `peligros-apps-ahorro-automatico`) — relación sólida, mantener.
   - **Futuras comparativas:** si en el futuro se crea una URL sobre "qué es Fintonic" o "Fintonic es seguro", esta URL debe enlazarla como recurso complementario, no absorber esa intención.
9. **Diferenciador editorial frente a Banktrack y Cashual:** mayor neutralidad relativa (sin autopromoción como "#1" explícito), foco exclusivo en finanzas personales (sin mezclar tesorería empresarial como Banktrack), y un ángulo de privacidad ya trabajado en profundidad que ninguno de los dos competidores verificados iguala en extensión.
10. **Límite entre comparativa neutral y promoción del producto propio:** Kakebo AI debe aparecer **dentro** de la tabla y las fichas comparativas en igualdad de condiciones con las demás apps (mismas columnas, mismo formato Pros/Contras), y el CTA final puede promocionarlo, pero el cuerpo comparativo no debe declararlo ganador implícito en cada respuesta de FAQ (riesgo ya señalado como hallazgo C-03/V-02 en la validación anterior — se traslada aquí como límite de diseño, no se corrige en esta tarea).

**Declaración de posicionamiento editorial:**

> *Alternativas a apps bancarias* es la comparativa de referencia de MetodoKakebo.com para quien busca sustituir Fintonic (u otra app conectada al banco) por una opción que respete mejor su privacidad, sin renunciar a la comodidad de controlar sus gastos. Compara alternativas reales —con y sin conexión bancaria— con criterios explícitos y honestos, y solo al final presenta el método Kakebo (vía Kakebo AI) como una opción más, no como el veredicto obligado.

---

## 5. Arquitectura del snippet

### 5.1 Opciones de title

| # | Texto | Longitud aprox. | Keyword | Promesa | Ventaja | Riesgo | Recomendación |
|---|---|---|---|---|---|---|---|
| T1 | `Alternativas a Fintonic (2026): 8 Apps sin Conectar el Banco` | 62 car. | Principal, exacta | Comparativa + privacidad | Corta, keyword al inicio, año, número, refuerza "sin conectar el banco" | No dice "Blog Kakebo", pierde el sufijo de marca si se mantiene el patrón actual | Fuerte candidata |
| T2 | `8 Alternativas a Fintonic en 2026 (con y sin Banco)` | 52 car. | Principal, exacta | Cobertura de ambos sub-perfiles (con/sin conexión) | Muy corta, cubre las dos sub-intenciones detectadas en la Fase 2 de la tarea anterior | "con y sin Banco" es un poco telegráfico, menor claridad de promesa | Candidata |
| T3 | `Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones` | 61 car. | Principal, exacta + framing amplio | Combina "Fintonic" y "apps bancarias" en el mismo title | Protege explícitamente el framing amplio que capta el 71% de impresiones no-Fintonic | Más larga, dos conceptos en el title puede leerse como lista de keywords si no se redacta con cuidado | Candidata — mitiga el riesgo de perder "apps bancarias" |
| T4 | `Las 8 Mejores Alternativas a Fintonic en 2026` | 47 car. | Principal, exacta | Calca el patrón exacto de Banktrack/Cashual/title legacy | Muy alineada con el patrón ganador de la SERP; corta | Usa "las mejores" — la propia tarea pide evitar ese claim sin justificarlo objetivamente; pierde "apps bancarias" y "sin conectar el banco" | No recomendada tal cual — solo si se sustituye "mejores" por una fórmula más objetiva |
| T5 | `Alternativas a Fintonic sin Conectar el Banco (2026)` | 53 car. | Principal, exacta | Foco 100% en el diferencial de privacidad | Muy alineada con el diferenciador editorial único de esta URL frente a la competencia | No menciona el número de alternativas (patrón recomendable, no obligatorio); podría infrapromocionar las alternativas que sí requieren banco (Fintonic, Emma), que también se comparan | Candidata, más nicho |

### 5.2 Opciones de meta description

| # | Texto | Longitud aprox. | Intención | CTA implícito | Ventaja | Riesgo |
|---|---|---|---|---|---|---|
| D1 | `Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos.` | 152 car. | Informativa-comparativa | "Encuentra la que se adapta a ti" | Dentro de límite, cubre ambos sub-perfiles, evita "las mejores" | Ninguno relevante |
| D2 | `¿Buscas una alternativa a Fintonic? Comparamos 8 apps de control de gastos en España: precio, conexión bancaria y privacidad, con recomendación según tu perfil.` | 159 car. | Informativa-comparativa | Pregunta directa + "recomendación según tu perfil" | Formato pregunta puede mejorar percepción de relevancia inmediata; incluye "España" | Al límite de longitud, riesgo de truncamiento leve en algunos dispositivos |
| D3 | `Fintonic no es la única opción. Comparativa 2026 de 8 alternativas —con y sin banco— por precio, privacidad y facilidad de uso, para elegir con criterio.` | 156 car. | Informativa-comparativa | "Fintonic no es la única opción" (hook) | Hook diferente a los dos anteriores, evita repetir estructura de title | El hook "no es la única opción" podría percibirse como levemente comercial si no se redacta con cuidado |

### 5.3 Opciones de H1

| # | Texto | Keyword | Diferencia del title | Riesgo |
|---|---|---|---|---|
| H1-A | `Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos` | Principal, exacta | Sí, reformulado, añade la promesa de privacidad de forma explícita | Ninguno relevante |
| H1-B | `Comparativa de alternativas a Fintonic (con y sin conexión bancaria)` | Principal, exacta | Sí, enfatiza el criterio de comparación en vez del número | Ligeramente más largo visualmente, pero H1 no tiene límite estricto de SERP |
| H1-C | `¿Buscas una alternativa a Fintonic? Aquí tienes 8 opciones reales` | Variante primaria (implícita) | Sí, formato pregunta, tono conversacional | El tono pregunta puede desentonar con el resto de H1 del sitio (revisar consistencia de voz editorial en `ARCHITECTURE` de implementación, no aquí) |

### 5.4 Combinación recomendada (decisión, no implementación)

- **Title:** T3 — `Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones` — es la opción que mejor concilia el hallazgo principal (ausencia de "Fintonic") con el riesgo explícitamente señalado por el usuario en el contexto de esta tarea (perder el framing "apps bancarias"). Alternativa de repliegue si en implementación resulta forzada: T1.
- **Meta description:** D1 — cubre ambos sub-perfiles, dentro de longitud, sin claims absolutos.
- **H1:** H1-A — mantiene la keyword principal, no duplica el title, y explicita la promesa de privacidad que es el diferenciador editorial real de la URL.

Esta combinación es una **recomendación de diseño**, sujeta a validación de longitud exacta en píxeles y a redacción final en la tarea de implementación correspondiente (ver sección 24, tarea 1).

---

## 6. Primer bloque visible

**Función:** debe actuar como respuesta directa (GEO) y como filtro de expectativas antes de que el usuario llegue a la tabla.

**Debe resolver, en este orden:**
1. Qué es, en una frase, una alternativa a Fintonic (definición de entidad).
2. Para quién es esta comparativa (perfil de usuario).
3. Qué criterios se han usado para comparar (transparencia editorial, señal de calidad para GEO).
4. Qué diferencia a MetodoKakebo.com de otras comparativas (privacidad + neutralidad, sin declarar ganador todavía).
5. Qué alternativas requieren conexión bancaria y cuáles no (el eje de decisión más importante detectado).
6. Qué significa "mejor" según cada perfil (matizar antes de que el usuario llegue a la tabla, para gestionar expectativas y evitar el claim "las mejores" sin contexto).

**Extensión recomendada:** 3-5 frases cortas (60-90 palabras aprox.), separables en 1-2 párrafos — suficiente para ser citable como fragmento por un AI Overview sin diluirse.

**Mensaje principal:** "No existe una única mejor alternativa a Fintonic: depende de si priorizas automatización o privacidad. Aquí comparamos 8 opciones reales con y sin conexión bancaria."

**Entidades que deben aparecer:** Fintonic, Open Banking, apps bancarias, control de gastos, alguna mención genérica a "método Kakebo" solo si no desplaza a las entidades externas.

**Respuesta directa GEO:** una frase aislable tipo "Una alternativa a Fintonic es cualquier app o método para controlar tus gastos sin depender de la conexión automática al banco que ofrece Fintonic" — candidata a definición citable.

**Transición hacia la tabla:** frase puente corta tipo "La siguiente tabla resume las 8 alternativas comparadas; debajo se detalla cada una." (ya existe una transición similar en el H2 "Comparativa: Mejores Alternativas a Apps Bancarias en 2026" — solo habría que revisar si el primer bloque nuevo la hace redundante).

**Elementos que deben eliminarse o conservarse:** el párrafo 1 y 2 actuales ("Controlar los gastos personales..." / "Apps como Fintonic...") contienen ya la mayoría de estas ideas mezcladas de forma dispersa — la arquitectura recomienda **reordenar y concentrar**, no añadir contenido nuevo desde cero. No se decide aquí el texto definitivo.

*(Ejemplo de estructura, no texto final):* "[Definición de alternativa a Fintonic en 1 frase]. [Para quién es esta comparativa]. [Qué criterios se usan]. [Con vs. sin conexión bancaria, en 1 frase]. [Transición a la tabla]."

---

## 7. Jerarquía H2/H3 propuesta

| Nivel | Título provisional | Intención | Keyword/entidad | Contenido esperado | ¿Existe hoy? | Tratamiento | Riesgo SEO |
|---|---|---|---|---|---|---|---|
| H2 | (Primer bloque, sin heading propio — ver sección 6) | GEO / respuesta directa | Principal | Definición + criterios + transición | Parcial (disperso en intro actual) | Reordenar | Bajo |
| H2 | ¿Qué es una alternativa a Fintonic y cómo elegirla? *(opcional, inspirado en el patrón de Banktrack sin autopromoción)* | Informativa previa | Principal + entidad Fintonic | Breve contexto + criterios explícitos de selección | No | Añadir, solo si no duplica el primer bloque | Bajo — riesgo de redundancia con el primer bloque si no se diferencia bien |
| H2 | Comparativa: Alternativas a Fintonic y Apps Bancarias en 2026 *(renombrar el H2 actual "Comparativa: Mejores Alternativas a Apps Bancarias en 2026")* | Transaccional/informativa | Principal + framing amplio | Tabla comparativa existente | Sí | Modificar solo el título del heading, no la tabla | Bajo |
| H2 | Las 8 alternativas a Fintonic, analizadas *(ajustar de "Las 5 mejores alternativas a Fintonic, analizadas" — el heading actual dice "5" pero el cuerpo compara 8, inconsistencia detectada)* | Informativa | Principal | Fichas Pros/Contras existentes | Sí, con inconsistencia de número | Corregir el número en el heading | Bajo — es una corrección de precisión, no una reescritura |
| H3 (×8) | Nombre de cada app | Informativa | Entidad de marca | Ficha existente | Sí | Conservar | Ninguno |
| H2 | El modelo de negocio de las apps financieras gratuitas | Informativa/confianza | Entidad relacionada | Contenido existente | Sí | Conservar | Ninguno |
| H2 | Automatización frente a registro consciente | Informativa/diferenciación | Método Kakebo | Contenido existente | Sí | Conservar | Ninguno |
| H2 | Kakebo AI: la alternativa sin conexión bancaria | Informativa/producto propio | Producto propio | Contenido existente | Sí | Conservar, candidato a fusión editorial en tarea de contenido (no aquí) por redundancia ya señalada en la validación anterior (hallazgo C-04) | Bajo |
| H2 | Privacidad frente a comodidad: no son excluyentes | Informativa | Entidad relacionada | Contenido existente | Sí | Conservar | Ninguno |
| H2 | *(nuevo, opcional)* En resumen: ¿cuál elegir? | Conclusión / decisión | Principal + variante primaria | Síntesis de 2-3 frases por perfil, antes de la FAQ | No | Añadir | Bajo — hueco ya detectado en la validación anterior (G-01, ausencia de conclusión) |
| H2 | Preguntas frecuentes sobre alternativas a apps bancarias *(evaluar si renombrar a "...alternativas a Fintonic y apps bancarias")* | Informativa/GEO | Principal + framing amplio | FAQ existente, ver sección 9 | Sí | Evaluar cambio de título del heading únicamente | Bajo |
| H2 | Prueba Kakebo AI: sin banco, sin publicidad, sin excusas | Conversión | Producto propio | CTA existente | Sí | Conservar | Ninguno |

**No se añaden headings solo para incluir keywords:** el único H2 nuevo con evidencia sólida es la sección de conclusión (hueco ya documentado, G-01). El H2 "¿Qué es una alternativa a Fintonic...?" se marca como opcional y condicionado a no duplicar el primer bloque — su necesidad debe confirmarse en la tarea de implementación de contenido, no aquí.

---

## 8. Arquitectura de la tabla comparativa

**Columnas que deben mantenerse:** App, Precio, Conexión bancaria, Plataforma, Ideal para — las 5 columnas actuales cubren ya los criterios base solicitados por la tarea (precio, plataforma, conexión bancaria, usuario ideal).

**Columnas que podrían añadirse (evaluar impacto en legibilidad antes de implementar):**
- **Privacidad** (nivel cualitativo: alta/media/baja) — hoy la privacidad se infiere de la columna "Conexión bancaria", pero una columna explícita reforzaría el diferenciador editorial y la extraíbilidad GEO.
- **Disponibilidad en España** — todas las apps listadas ya son operativas en España según lo verificado en la tarea de keyword/SERP; una columna dedicada solo aporta valor si hay matices reales (ej. cobertura bancaria parcial, ya mencionada en el texto de Emma/Toshl) — riesgo de redundancia si se limita a "Sí" en todas las filas.

**Columnas redundantes:** ninguna de las 5 actuales es redundante.

**Columnas evaluadas y descartadas por bajo valor diferencial:** "Sincronización automática" (ya implícita en "Conexión bancaria") y "Exportación de datos" (dato relevante solo para 2 de las 8 apps — mejor tratarlo en la ficha individual que en la tabla, para no añadir una columna con muchos "No aplica").

**Orden recomendado:** mantener el orden actual (Kakebo AI primero, Fintonic segundo, resto por relevancia editorial) — no hay evidencia en esta tarea que justifique reordenar, y la decisión de canonicalidad la tomó ya P0.7. Nota: colocar Kakebo AI en primera fila es defendible editorialmente (es la "alternativa" que da nombre al framing "sin conectar el banco"), pero refuerza el riesgo de percepción de sesgo ya señalado — se recomienda evaluarlo en la tarea de FAQ/neutralidad (ver sección 24) sin decidirlo aquí.

**Definiciones de la Fase 5 del prompt:**
- **¿Debe explicarse que no existe una única "mejor" alternativa?** Sí — ya se recomienda en el primer bloque visible (sección 6) y evita el riesgo de "presentar MetodoKakebo.com como ganador predeterminado".
- **¿MetodoKakebo.com debe aparecer dentro de la tabla?** Sí, ya aparece (fila "Kakebo AI") y debe mantenerse — excluirla sería inconsistente con el resto del artículo y perdería la comparación directa que el usuario espera.
- **¿La herramienta propia debe tratarse igual que las alternativas externas?** Sí — mismas columnas, mismo formato, sin marcar visualmente la fila de Kakebo AI de forma distinta a las demás (verificar en implementación que no haya `highlight`/negrita adicional no aplicada a las demás filas).
- **¿Hace falta una nota editorial de neutralidad?** Recomendable — una línea breve bajo la tabla o en el primer bloque tipo "Incluimos Kakebo AI, la app de MetodoKakebo.com, en igualdad de condiciones con el resto de alternativas" refuerza la transparencia y mitiga el riesgo de percepción de sesgo sin necesidad de reescribir el resto del artículo.

**No se modifica la tabla en esta tarea** — todo lo anterior es una recomendación para la tarea atómica correspondiente (ver sección 24).

---

## 9. Arquitectura de las alternativas

| Alternativa | Papel confirmado | Info mínima ya presente | Fuente necesaria (no implementada) | Riesgo de claim | Vigencia (verificada en tarea anterior) |
|---|---|---|---|---|---|
| Kakebo AI | Producto propio, incluido en igualdad de condiciones | Precio, conexión bancaria, plataforma, para quién | No aplica (dato propio) | Bajo | Vigente (propio) |
| Fintonic | Entidad principal de comparación (el "contra qué se compara") | Precio, conexión bancaria, plataforma, para quién | Web oficial / tienda de apps, para confirmar precio y modelo "gratis con publicidad" | Medio — el asterisco "Gratis\* con publicidad y ofertas financieras de terceros" es un claim específico sobre el modelo de negocio de un tercero | No verificada explícitamente en esta tarea (no se re-auditó Fintonic); recomendable verificar en la tarea de fuentes |
| Spendee | Alternativa con conexión opcional | Precio, pros/contras, para quién | Página de precios oficial | Bajo — verificado vigente en la tarea de keyword/SERP (2026-07-20) | Vigente |
| Toshl Finance | Alternativa con conexión opcional | Precio, pros/contras, para quién | Página de precios oficial | Bajo — verificado vigente en la tarea de keyword/SERP (2026-07-20) | Vigente |
| Money Manager | Alternativa sin conexión bancaria | Precio, pros/contras, para quién | Tienda de apps oficial | Bajo | No re-verificada en esta tarea; sin señales de discontinuación conocidas |
| Emma | Alternativa con conexión central | Precio, pros/contras, para quién | Página de precios oficial | Bajo | No re-verificada en esta tarea |
| YNAB | Alternativa de pago, presupuesto por objetivos | Precio, pros/contras, para quién | Página de precios oficial | Bajo | No re-verificada en esta tarea; precio citado (14,99€/mes) es coherente con el conocimiento general de la marca |
| Excel/Papel | Alternativa sin app (fila de tabla, sin ficha propia) | Solo en tabla | No aplica | Ninguno | No aplica (no es un producto con ciclo de vida) |

**Determinaciones de la Fase 6:**
- **Alternativas que deben mantenerse:** las 8 actuales (7 apps + Excel/Papel) — no hay evidencia de discontinuación ni de irrelevancia para ninguna.
- **Alternativas que requieren actualización:** ninguna con evidencia firme; se recomienda como tarea atómica de bajo riesgo (`SOURCES`, sección 24) una verificación puntual de precio/vigencia de Fintonic, Money Manager, Emma y YNAB (las 4 no re-verificadas directamente en esta línea de tareas), antes de dar por definitivos sus datos en la tabla.
- **Alternativas que deberían eliminarse:** ninguna.
- **Alternativas que podrían añadirse:** ninguna con evidencia sólida en esta tarea. Los competidores verificados listan apps adicionales (Banktrack: Moneypro, Woolsocks, Wallet, Mint; Cashual: Bnext) pero **no hay evidencia de demanda real de esas apps en el contexto de MetodoKakebo.com** — añadir alguna solo por paridad numérica contradice explícitamente la restricción del prompt ("no añadir aplicaciones únicamente para imitar el número utilizado por competidores").
- **Número total recomendado:** mantener 8 (7 apps + Excel/Papel). Es ya superior a Cashual (6) e igual a Banktrack (8), sin necesidad de inflar la lista.

---

## 10. Política de fuentes (diseño, no implementación)

| Elemento | Criterio |
|---|---|
| **Afirmaciones que necesitan fuente** | Precio actual de cada app; modelo de negocio ("gratis con publicidad", "comisiones por referidos"); disponibilidad de conexión bancaria en España; claims de privacidad ("no requiere acceso a cuenta bancaria") |
| **Afirmaciones que NO necesariamente necesitan fuente** | Descripciones generales de funcionamiento ya observables desde la propia interfaz pública de cada app (ej. "usa pequeños monstruitos como icono" en Toshl) |
| **Fuentes aceptables** | Webs oficiales de cada app, páginas de precios oficiales, políticas de privacidad publicadas, ficha oficial en App Store / Google Play (para plataforma y disponibilidad) |
| **Cómo verificar precios** | Consultar la página de precios oficial de cada app en la fecha de actualización del artículo; registrar la fecha de verificación junto al dato si el precio es sensible a cambios frecuentes |
| **Cómo verificar disponibilidad (España)** | Confirmar en la ficha de la tienda de apps (App Store/Google Play, región España) o en la propia web si declara mercados soportados |
| **Cómo verificar privacidad** | Revisar la política de privacidad oficial de cada app respecto a si solicita credenciales bancarias (Open Banking/PSD2) o no |
| **Cómo verificar conexión bancaria** | Web oficial / documentación de producto de cada app |
| **Cómo indicar que un dato puede cambiar** | Nota editorial visible tipo "Precios y condiciones verificados en [fecha de `updatedDate`]; pueden variar" — ya existe parcialmente el mecanismo de `updatedDate` en frontmatter, solo faltaría hacerlo visible en el cuerpo si se decide en implementación |
| **Fecha de actualización** | Mantener `updatedDate` en frontmatter (ya existe) como fuente de verdad; sincronizar con cualquier cambio de datos de la tabla si se ejecuta la tarea `SOURCES` |
| **Neutralidad** | Ninguna alternativa externa debe describirse con adjetivos superlativos negativos ni positivos no verificables; usar el mismo nivel de detalle Pros/Contras para todas, incluyendo Kakebo AI |
| **Conflictos de interés** | Declarar explícitamente (nota de neutralidad, sección 8) que Kakebo AI es el producto de MetodoKakebo.com y se compara en igualdad de condiciones |
| **Tratamiento del producto propio** | Mismo formato, misma profundidad de Pros/Contras, sin marcarlo como "recomendado" por defecto en la tabla ni en el primer bloque; el CTA final sí puede promocionarlo explícitamente (esa es su función legítima) |

**No se implementan fuentes en esta tarea.** Esta política es el input para la tarea atómica `SOURCES` (sección 24).

---

## 11. Arquitectura GEO

**Bloques potencialmente citables (diseño, no implementación):**

1. Definición directa de "alternativa a Fintonic" (primer bloque, sección 6).
2. Fila de tabla individual (cada fila es ya una unidad citable: app + precio + conexión + para quién).
3. Cada bloque Pros/Contras/Para quién por alternativa (ya existente, ya citable).
4. Cada respuesta de FAQ (ya existente, ya citable, con schema `FAQPage`).
5. *(Nuevo, opcional)* Bloque de "en resumen: ¿cuál elegir?" al final, si se añade el H2 de conclusión propuesto en la sección 7 — sería un bloque de síntesis muy citable por su formato de recomendación por perfil.
6. Nota de neutralidad (sección 8) — citable como señal de transparencia editorial, aunque de menor valor informativo directo.

**Elementos GEO ya presentes y que deben protegerse:** tabla HTML, criterios explícitos de comparación, Pros/Contras claros, recomendaciones por perfil ("Para quién es"), fecha de actualización en JSON-LD (`dateModified`), FAQ con schema, entidades diferenciadas (cada app con su propio H3).

**Huecos identificados (ya señalados en la tarea de keyword/SERP, sección 12 de ese documento):** ausencia de respuesta directa muy al inicio (cubierto por el diseño de la sección 6 de este documento); respuestas de FAQ algo largas para cita directa (2-4 frases) — se recomienda evaluar en implementación si acortar la primera frase de cada respuesta a modo de "respuesta corta" seguida de matización, sin decidirlo aquí.

**No se implementan cambios GEO en esta tarea.**

---

## 12. Arquitectura de FAQ

| Pregunta actual | Clasificación | Motivo |
|---|---|---|
| ¿Cuál es la mejor alternativa a Fintonic? | Mantener | Cubre exactamente la keyword principal + intención decisional; ya matiza que depende del perfil (mitiga el riesgo de "las mejores" sin justificar) |
| ¿Existe una alternativa a apps bancarias sin conexión bancaria? | Modificar (opcional) | Correcta en contenido, pero el enunciado usa el framing amplio ("apps bancarias") en vez de "Fintonic" — evaluar si reformular a "¿Hay una alternativa a Fintonic sin conectar el banco?" para capturar mejor el featured snippet de la keyword principal, sin perder la cobertura semántica amplia en la respuesta |
| ¿Qué aplicación es más privada que Fintonic? | Mantener | Ya usa "Fintonic" explícitamente, cubre la sub-intención de privacidad |
| ¿Hay alternativas gratuitas a Fintonic? | Mantener | Ya usa "Fintonic" explícitamente, cubre sub-intención de precio |
| ¿Cuál es mejor para controlar gastos personales sin complicarse? | Mantener | Cubre un perfil de usuario distinto (simplicidad), diversifica la FAQ |

**Preguntas candidatas evaluadas (Fase 9 del prompt):**

| Pregunta candidata | Decisión | Motivo |
|---|---|---|
| ¿Qué aplicación sustituye a Fintonic? | No añadir | Redundante con "¿Cuál es la mejor alternativa a Fintonic?" — mismo intent, distinta redacción |
| ¿Hay alternativas a Fintonic sin conectar el banco? | Ya cubierta (ver modificación propuesta arriba) | — |
| ¿Qué alternativa a Fintonic es gratuita? | Ya cubierta ("¿Hay alternativas gratuitas a Fintonic?") | — |
| **¿Fintonic es seguro?** | **No añadir — riesgo de canibalización** | Pertenece a la intención "seguridad/confianza de Fintonic", explícitamente fuera del alcance de esta URL según la decisión de keyword de la tarea anterior; si se responde aquí, compite con una futura URL dedicada |
| ¿Qué app sirve para controlar gastos en España? | No añadir | Intención más genérica que "alternativa a Fintonic"; ya cubierta indirectamente por el framing "apps bancarias" del resto del artículo; no aporta suficiente diferenciación para justificar una FAQ nueva |
| ¿Es mejor usar una app automática o registrar gastos manualmente? | Candidata a añadir (opcional) | Cubre directamente la sub-intención "con vs. sin conexión bancaria" identificada como eje de decisión principal (sección 6); refuerza el diferenciador editorial (automatización vs. registro consciente) sin canibalizar ninguna URL futura |
| ¿MetodoKakebo.com conecta con el banco? | No añadir como FAQ separada | Ya respondida implícitamente en varias respuestas existentes ("Kakebo AI... sin conectar el banco"); añadirla como pregunta propia sería redundante |

**Alcance definido para evitar canibalización:** la FAQ de esta URL debe limitarse a la intención comparativa/decisional sobre alternativas. Cualquier pregunta que responda "qué es Fintonic", "es Fintonic seguro/estafa" o "problemas específicos de Fintonic" debe excluirse explícitamente, incluso si tiene volumen de búsqueda, y reservarse para una posible URL futura independiente (fuera del alcance de este milestone).

**No se modifica la FAQ en esta tarea.**

---

## 13. Arquitectura de enlazado interno

1. **Enlaces internos salientes recomendados (adicionales a los ya existentes):**
   - Un enlace contextual hacia `calculadora-ahorro` o `regla-50-30-20` en la sección de cierre/conclusión propuesta (sección 7), con anchor tipo "una vez elijas app, calcula cuánto puedes ahorrar cada mes" — solo si encaja de forma natural, no forzado.
   - Ningún enlace nuevo hacia `metodo-kakebo-guia-definitiva` adicional al ya existente en el cuerpo (línea 218 del MDX actual) — ya está cubierto.

2. **Enlaces internos entrantes que podrían reforzarse:** el anchor desde `CalculatorInflation.tsx` ("Alternativas a las apps bancarias que leen tus datos") no usa "Fintonic" ni la keyword principal — candidato a revisión de copy en una tarea de i18n/UI separada (fuera de alcance de `ARCHITECTURE-02` y del contenido MDX).

3. **Anchors naturales recomendados para reforzar señal semántica (si se tocan enlaces existentes en la implementación):** variaciones de "alternativa(s) a Fintonic" en vez de únicamente "alternativas a apps bancarias" — ya usado parcialmente en `kakebo-online-gratis.es.mdx` ("Alternativa a Fintonic sin conexión bancaria").

4. **Relación con:**
   - **Home:** no enlaza directamente hoy; no se recomienda forzar un enlace desde home en esta arquitectura — es una decisión de UI/IA de la información fuera de alcance SEO puro.
   - **App (`/app`):** no aplica un enlace directo desde el cuerpo del artículo; el CTA ya enlaza a `/login?mode=signup`.
   - **Plantilla Kakebo Excel:** no hay relación temática directa fuerte; no se recomienda forzar un enlace.
   - **Calculadora de ahorro / regla 50/30/20:** relación natural post-decisión (ver punto 1).
   - **Control de gastos:** eje temático ya compartido, sin acción adicional requerida.
   - **Método Kakebo:** ya enlazado, mantener.
   - **Privacidad financiera:** eje temático ya compartido con `peligros-apps-ahorro-automatico`, que ya enlaza hacia esta URL — mantener, sin duplicar el enlace en sentido inverso si no aporta valor adicional.

5. **Enlaces que deben protegerse:** los 4 entrantes ya confirmados en la validación anterior (`peligros-apps-ahorro-automatico`, `kakebo-vs-ynab`, `kakebo-online-gratis`, `como-ahorrar-dinero-cada-mes`) y el entrante desde `CalculatorInflation.tsx`.

6. **Enlaces que no deben añadirse:** enlaces salientes hacia Fintonic, Spendee, Toshl, Money Manager, Emma o YNAB (webs oficiales) — la validación anterior señaló su ausencia como un punto DUDOSO de E-E-A-T, pero añadirlos no está en el alcance de esta arquitectura de enlazado interno y requeriría su propia decisión editorial (fuera de esta tarea).

7. **Riesgo de canibalización:** ninguno detectado — ver sección 6 de la tarea de keyword/SERP, ya confirmado que ninguna otra URL del sitio targetea "Fintonic" como entidad principal.

**No se implementan enlaces en esta tarea.**

---

## 14. Arquitectura del CTA

- **Objetivo del CTA:** conversión a registro/login en Kakebo AI, manteniendo coherencia con la intención comparativa (el usuario ya ha visto 8 alternativas antes de llegar al CTA, por lo que la decisión de probar Kakebo AI debe sentirse como una opción informada, no como el único desenlace posible del artículo).
- **Ubicación:** mantener la ubicación actual (CTA final, tras la FAQ, antes del footer) — es coherente con el resto del blog y no requiere cambio estructural.
- **Copy funcional (diseño, no texto definitivo):** debe evitar dar a entender que las 7 alternativas externas son "peores" — mantener el tono actual ("sin banco, sin publicidad, sin excusas") que se centra en atributos propios, no en comparación directa negativa con terceros.
- **Relación con la intención comparativa:** el CTA debe leerse como "si tras comparar valoras la privacidad por encima de todo, esta es nuestra propuesta", no como cierre de venta genérico.
- **Tratamiento del producto propio:** coherente con la sección 4, punto 10 — el CTA es el único punto del artículo donde es legítimo y esperado que MetodoKakebo.com se promocione sin matices.
- **Neutralidad:** el CTA en sí no compromete la neutralidad del cuerpo comparativo si el resto del artículo (tabla, fichas, FAQ) mantiene el tratamiento igualitario ya definido en la sección 8.
- **Posibles eventos de analytics:** el componente `SimpleCTA` ya existente dispara `click_cta_login` con `cta_location: "blog_simple_cta"` — no se requiere evento nuevo; si se añade un CTA contextual adicional (ver abajo), reutilizar el mismo evento con un `cta_location` distinto, siguiendo el patrón ya usado en el resto del sitio (`blog_tool_cta`, `blog_article_cta`).
- **Experiencia con y sin sesión:** no evaluada en esta tarea — depende del comportamiento global del sitio para usuarios autenticados, fuera del alcance de una arquitectura de contenido SEO.
- **Riesgo de autopromoción agresiva:** bajo con el CTA actual (un único bloque al final); el riesgo real está en el cuerpo comparativo (FAQ, tabla), no en el CTA, y ya está documentado en secciones anteriores.

**Opciones de CTA (diseño, no implementación):**

| Tipo | Propuesta | Componente existente aplicable |
|---|---|---|
| CTA principal | Mantener el actual (bloque final, tono "sin banco, sin publicidad, sin excusas") | `SimpleCTA` (ya usado) |
| CTA secundario | Ninguno nuevo recomendado con evidencia firme — el riesgo de "demasiados CTA" en una comparativa que debe sentirse neutral pesa más que el beneficio de un CTA adicional | — |
| CTA contextual | Opcional: enlace de texto (no CTA visual) hacia `calculadora-ahorro` en la sección de conclusión propuesta (sección 7) — es un enlace interno, no un CTA de conversión, y no compite con el CTA principal | `CustomLink` estándar del cuerpo MDX |

**No se implementa el CTA en esta tarea.**

---

## 15. Schema y datos estructurados

| Schema | Estado actual | Recomendación |
|---|---|---|
| `BlogPosting` | Correcto (headline, image, datePublished, dateModified, author, publisher, mainEntityOfPage) | Mantener sin cambios estructurales; `headline` deberá actualizarse automáticamente si cambia el `title` de frontmatter en la implementación (es el mismo campo, no requiere lógica nueva) |
| `FAQPage` | Correcto, 5 preguntas, coherente con el contenido actual | Si se ejecuta la tarea `FAQ` (modificar 1 pregunta, añadir 1 opcional según sección 12), el schema se regenera automáticamente porque se construye dinámicamente desde `post.frontmatter.faq` en `page.tsx` — no requiere cambio de código, solo de datos en el MDX |
| `BreadcrumbList` | Correcto, 3 ítems | Mantener sin cambios |
| **`dateModified`** | Se calcula automáticamente desde `post.frontmatter.updatedDate ?? post.frontmatter.date` | **Debe actualizarse** (`updatedDate` en frontmatter) en cuanto se implemente cualquier cambio de contenido/snippet — es una actualización de dato en el MDX, no de código |
| **Riesgo de duplicidad** | Ninguno detectado — el `SoftwareApplication` schema condicional en `page.tsx` está reservado a `slug === 'plantilla-kakebo-excel'`, no afecta a esta URL | Ninguna acción |
| **Schema adicional** | No se identifica necesidad de un schema nuevo (ej. `ItemList` para las alternativas, o `Product`/`SoftwareApplication` por cada app comparada) con evidencia suficiente en esta tarea | No añadir sin justificación adicional — el riesgo de un `ItemList`/`Product` por cada app de terceros (que MetodoKakebo.com no controla ni actualiza directamente) es mayor que el beneficio SEO esperado; se recomienda no abrir esa vía sin una tarea de investigación específica |

**No se implementa ningún cambio de schema en esta tarea.**

---

## 16. Elementos protegidos (consolidado)

- `slug`: `alternativas-a-app-bancarias`.
- `canonical` autoreferencial sin prefijo.
- Redirect 308 de `/es/` (comportamiento de `next-intl`, no tocar).
- `noindex` de la variante EN.
- Tabla comparativa HTML de 8 filas (estructura y datos, salvo verificación puntual de fuentes en tarea `SOURCES`).
- Las 5 fichas Pros/Contras/Para quién existentes.
- Comparación por precio, conexión bancaria, plataforma y usuario ideal (columnas base de la tabla).
- Diferenciación editorial por privacidad y alternativas sin conectar el banco.
- Recomendaciones por perfil de usuario.
- FAQ existente (4 de 5 preguntas sin cambios; 1 candidata a reformulación menor).
- Schema `FAQPage`, `BlogPosting`, `BreadcrumbList`.
- Enlazado interno entrante (4 artículos + 1 herramienta).
- Contenido vigente (verificado: Spendee y Toshl operativos en 2026).
- Framing amplio "apps bancarias" (no debe desaparecer del title/excerpt/body aunque se incorpore "Fintonic").
- Aprendizaje histórico documentado de P0.7 y SEO-CTR-FINTONIC-01.
- El hallazgo técnico T-01 (discrepancia `hreflang` en el HTTP `Link` header) — explícitamente fuera de alcance, no se corrige en esta arquitectura ni en su implementación.

---

## 17. Riesgos

| Riesgo | Mitigación de diseño ya incorporada |
|---|---|
| Sobreoptimizar hacia "Fintonic" | Opción de title recomendada (T3) incluye explícitamente "Apps Bancarias"; primer bloque y H2 mantienen el framing amplio |
| Perder el framing "apps bancarias" | Igual que arriba; ningún H2 existente que usa "apps bancarias" se elimina |
| Reducir cobertura de queries secundarias | Las variantes secundarias se cubren semánticamente en cuerpo/FAQ, no se fuerzan en title/H1 (decisión ya tomada en la tarea de keyword) |
| Replicar autopromoción agresiva de competidores | Sección 4 punto 10 y sección 8 fijan el límite explícito: mismo tratamiento tabular para Kakebo AI que para el resto |
| Presentar MetodoKakebo.com como ganador predeterminado | Primer bloque diseñado para matizar "no existe una única mejor alternativa" antes de la tabla; nota de neutralidad propuesta |
| Modificar demasiado una URL que ya rankea cerca del Top 10 | Plan de implementación atómico (sección 24) separa snippet de contenido de tabla de FAQ — permite medir cada cambio de forma aislada y revertir solo lo que no funcione |
| Confundir finanzas personales con tesorería empresarial | No se propone ningún contenido de tesorería empresarial en esta arquitectura |
| Añadir alternativas solo para aumentar el número | Sección 9 descarta explícitamente añadir apps sin evidencia de demanda |
| Usar claims no verificables | Política de fuentes (sección 10) definida antes de tocar ningún dato de la tabla |
| Sacar conclusiones absolutas con muestra GSC reducida | Criterios de medición (sección 27) fijan ventanas mínimas y umbrales de significancia antes de declarar éxito o fracaso |

---

## 18-23. (Integradas en las secciones numeradas anteriores)

Las secciones "Cambios recomendados", "Elementos protegidos" y "Riesgos" del formato de entrega se corresponden con las secciones 4-17 anteriores; no se duplican aquí para evitar inconsistencias entre versiones del mismo contenido.

---

## 24. Plan de implementación atómico

| # | Código | Objetivo único | Archivos previstos | Dependencias | Riesgos | Validación | Criterio de cierre | Modelo asignado | Revisión con Codex |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SNIPPET-02` | Implementar la combinación recomendada de title/meta description/H1 (sección 5.4), con redacción final definida en esa misma tarea a partir de las opciones aquí propuestas | `src/content/blog/alternativas-a-app-bancarias.es.mdx` (frontmatter: `title`, `excerpt`, `updatedDate`) | Ninguna | Medio — señal orgánica activa; riesgo de longitud incorrecta si no se mide en píxeles reales | Build ✅, medición de longitud de title/description, verificación en producción del `<title>`/`<meta>` renderizado | Snippet actualizado, desplegado y verificado en producción; `updatedDate` sincronizada | Claude Code | No — cambio de texto acotado, bajo riesgo técnico |
| 2 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-CONTENT-INTRO-02` | Reordenar/reescribir el primer bloque visible (párrafos 1-2 actuales) según el diseño de la sección 6, sin ampliar el resto del artículo | `src/content/blog/alternativas-a-app-bancarias.es.mdx` (cuerpo, párrafos iniciales) | Tarea 1 (coherencia de mensaje con el nuevo title/H1) | Bajo-medio — riesgo de romper la transición hacia el H2 de la tabla si no se revisa el encaje | Build ✅, lectura editorial de coherencia, verificación de que la definición GEO es una frase aislable | Primer bloque actualizado, transición a la tabla coherente | Claude Code | No |
| 3 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-HEADINGS-02` | Ajustar los H2 identificados en la sección 7 (corregir "5" → "8" en el heading de fichas; renombrar el H2 de la tabla; añadir H2 de conclusión) | `src/content/blog/alternativas-a-app-bancarias.es.mdx` (headings + nuevo bloque de conclusión) | Tareas 1 y 2 (coherencia de keyword y mensaje) | Bajo | Build ✅, verificación de jerarquía H2/H3 en HTML renderizado | Headings corregidos, nueva sección de conclusión publicada | Claude Code | No |
| 4 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SOURCES-02` | Verificar y, si procede, actualizar precio/vigencia de Fintonic, Money Manager, Emma y YNAB en la tabla y fichas, aplicando la política de fuentes (sección 10) | `src/content/blog/alternativas-a-app-bancarias.es.mdx` (tabla y fichas) | Ninguna (puede ejecutarse en paralelo a 1-3) | Medio — riesgo de introducir un dato desactualizado si la fuente consultada no es la oficial | Verificación cruzada con al menos 1 fuente oficial por dato modificado, listada en el resumen de la tarea | Tabla y fichas con datos verificados a fecha de ejecución, con nota de "verificado en [fecha]" si se decide implementarla | Claude Code | Recomendable — verificación de precios de terceros es sensible a error, una revisión cruzada añade seguridad |
| 5 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-FAQ-GEO-02` | Aplicar la clasificación de la sección 12 (reformular 1 pregunta, evaluar añadir 1 nueva) y añadir la nota de neutralidad de la sección 8 | `src/content/blog/alternativas-a-app-bancarias.es.mdx` (frontmatter `faq` + cuerpo `<FaqSection>`) | Tarea 1 (coherencia de keyword) | Bajo — riesgo de introducir una pregunta que se solape con una futura URL sobre "Fintonic es seguro" si no se respeta el alcance definido en la sección 12 | Build ✅, verificación de que el schema `FAQPage` renderizado coincide con el frontmatter | FAQ actualizada, schema coherente, sin preguntas fuera del alcance definido | Claude Code | No |
| 6 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-INTERNAL-LINKING-02` | Reforzar 1-2 anchors internos según la sección 13 (sin añadir enlaces salientes nuevos hacia herramientas si no encaja de forma natural) | `src/content/blog/alternativas-a-app-bancarias.es.mdx`, posiblemente `messages/es.json` (copy del anchor en `CalculatorInflation.tsx`, si se decide tocar en una tarea de UI separada) | Tarea 3 (la sección de conclusión es el lugar natural del nuevo enlace contextual) | Bajo | Build ✅, verificación de que no hay enlaces rotos | Enlazado reforzado sin enlaces rotos ni forzados | Claude Code | No |
| 7 | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-PRODUCTION-VALIDATION-02` | Validar en producción el conjunto de cambios 1-6 (snippet, contenido, headings, tabla, FAQ, enlazado) mediante `curl` + inspección HTML, siguiendo la misma metodología que `VALIDATION-02` | Ninguno (solo documentación) | Tareas 1-6 completadas y desplegadas | Ninguno (tarea de solo lectura) | `curl -D -` en producción, verificación de title/meta/H1/schema/enlaces reales | Documento de validación de producción cerrado, sin hallazgos bloqueantes | Claude Code | No |

**Bloques explícitamente NO incluidos en este plan por falta de evidencia suficiente:** `ANALYTICS` (no se identifica ningún evento nuevo necesario — el CTA ya trackea `click_cta_login`; ver sección 14) y `CTA` como tarea independiente (no hay cambio de CTA recomendado con evidencia firme; ver sección 14) — se excluyen del ejemplo de estructura del prompt porque la evidencia de esta arquitectura no los justifica como tareas separadas.

**Orden lógico recomendado:** 1 (SNIPPET) → 2 (CONTENT/INTRO) → 3 (HEADINGS) → 5 (FAQ/GEO) → 6 (INTERNAL LINKING) → 7 (VALIDATION). La tarea 4 (SOURCES) es independiente y puede ejecutarse en paralelo en cualquier momento antes de 7.

---

## 25. Modelos asignados

Todas las tareas de implementación de contenido/metadata se asignan a **Claude Code**, consistente con el resto del historial documentado del proyecto. Solo la tarea 4 (`SOURCES`) se marca como "revisión con Codex recomendable" por tratarse de verificación de datos de terceros sensibles a error (precios, vigencia), donde una segunda revisión cruzada reduce el riesgo de introducir un dato incorrecto sobre una marca externa.

---

## 26. Validaciones previstas (para las tareas de implementación, no ejecutadas aquí)

- Build (`npm run build` o equivalente) sin errores TypeScript tras cada tarea.
- Suite de tests existente sin regresiones (verificar si existen tests relacionados con `getBlogPost`/`sitemap` que dependan del contenido de esta URL).
- Verificación en producción vía `curl -D -` de title, meta description, H1, canonical, hreflang y schema tras cada despliegue, replicando la metodología de `VALIDATION-02`.
- Medición de longitud de title/meta description en caracteres antes de dar por cerrada la tarea `SNIPPET`.
- Revisión editorial de coherencia de tono entre el nuevo primer bloque y el resto del artículo tras `CONTENT-INTRO`.

---

## 27. Criterios de medición

**Baseline (a fecha de esta tarea, 2026-07-20):**

| Ámbito | Clics | Impresiones | CTR | Posición media |
|---|---|---|---|---|
| URL agregada | 4 | 459 | ≈0,87 % | ≈8,19 |
| Cluster Fintonic | 1 | 131 | ≈0,76 % | ≈9,75 |

**Métricas a monitorizar tras la implementación:**
- Clics, impresiones, CTR y posición media, desglosados por: (a) cluster Fintonic (6 queries ya identificadas), (b) queries genéricas "apps bancarias" (para confirmar que no se pierden), (c) URL canónica vs. variantes legacy (`/es/`, `/en/`) en GSC.
- Sesiones orgánicas de la URL (GA4, si está instrumentado a nivel de página).
- Engagement en la página (tiempo en página / scroll, si está disponible).
- Clics en el CTA (`click_cta_login` con `cta_location: "blog_simple_cta"`, ya trackeado).

**Ventanas orientativas (heredadas del prompt, sin modificar):**
- Snippet: 2-4 semanas.
- Contenido: 4-8 semanas.
- Enlazado: 4-8 semanas.
- Tendencia estable: 8-12 semanas.

**Definiciones:**
- **Mejora:** CTR del cluster Fintonic sube de forma sostenida por encima de ≈0,87% (el CTR agregado actual de la URL) durante al menos 2 semanas consecutivas dentro de la ventana de 2-4 semanas post-snippet, sin caída simultánea de impresiones del framing "apps bancarias".
- **Resultado neutro:** CTR y posición se mantienen dentro de ±20% del baseline durante la ventana correspondiente, sin señal clara en ninguna dirección — dado el volumen bajo (131 impresiones/mes en el cluster), variaciones pequeñas en términos absolutos (1-2 clics) no deben interpretarse como señal fuerte.
- **Regresión:** caída sostenida de impresiones totales de la URL (no solo del cluster Fintonic) por debajo del baseline de 459/mes durante 2+ semanas, o caída de posición media agregada por debajo de 10 de forma sostenida.
- **Cuándo NO tocar la URL:** si la tarea `SNIPPET` (la de mayor prioridad) aún no ha completado su ventana de medición de 2-4 semanas, no se recomienda introducir cambios adicionales de contenido/headings que compliquen la atribución de causa-efecto.
- **Cuándo abrir una segunda iteración:** si tras la ventana de 8-12 semanas el CTR del cluster Fintonic sigue por debajo de 1% pese a los cambios de snippet, o si se detecta regresión en el framing "apps bancarias", abrir una tarea de re-diagnóstico (no una reescritura automática).

---

## 28. Siguiente tarea recomendada

**`SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SNIPPET-02`** (tarea 1 del plan de implementación atómico, sección 24) — no se ejecuta en esta tarea.

---

## Validaciones finales ejecutadas

- ✅ Todas las propuestas se basan en `VALIDATION-02`, `KEYWORD-SERP-02`, datos GSC, datos SE Ranking, análisis SERP verificado directamente, y el contenido/código actual leído en esta tarea.
- ✅ La arquitectura protege explícitamente: keyword Fintonic (sección 5), framing "apps bancarias" (secciones 4, 5, 17), privacidad (secciones 4, 6, 16), neutralidad (secciones 4, 8, 14, 17) y el contenido actual útil (sección 16).
- ✅ El plan de implementación está dividido en 7 tareas atómicas independientes, sin mezclar snippet, contenido, fuentes, tabla, FAQ, enlazado, CTA, schema ni analytics entre sí.
- ✅ `git diff --stat`, `git diff` y `git status` ejecutados antes del commit (ver cierre en `PROJECT_STATUS.md`).
- ✅ Solo se han modificado: este documento, `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`.
- ✅ No se modificó código ni contenido del artículo, metadata, title, meta description, H1, headings, tabla, alternativas, fuentes, FAQ, enlaces, CTA, schema, canonical, hreflang ni slug.
