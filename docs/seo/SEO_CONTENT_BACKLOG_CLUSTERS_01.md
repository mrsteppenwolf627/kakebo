# SEO_CONTENT_BACKLOG_CLUSTERS_01 — Backlog editorial SEO por clusters

**Fecha:** 2026-07-09
**Tarea:** SEO-CONTENT-BACKLOG-CLUSTERS-01
**Tipo:** Solo análisis estratégico y documentación — sin código, sin MDX, sin contenido nuevo, sin cambios en herramientas ni en artículos existentes
**Commit de referencia (HEAD):** `774f9a7`

---

## 1. Objetivo del documento

Planificar el backlog editorial de MetodoKakebo.com por clusters temáticos para ordenar la producción de contenido futura **sin redactar ni implementar nada todavía**. No se toca ninguna URL publicada, ninguna herramienta, ni `/blog/plantilla-kakebo-excel`.

---

## 2. Estado actual del contenido

| Elemento | Estado |
|---|---|
| `CONTENT-01` — `/blog/cuentas-remuneradas` | ✅ Publicado (2026-07-08). En **ventana de medición 8-12 semanas** (hasta ~2026-09-02/30). No tocar. |
| `CONTENT-02` — `/blog/fondo-de-emergencia` | ✅ Publicado (2026-07-09, con imagen). En **ventana de medición 8-12 semanas** (hasta ~2026-09-03/10-01). No tocar. |
| Bloque técnico SEO/GEO | ✅ Cerrado. Todo el Bloque 1 (técnico) y la mayor parte del Bloque 2 (arquitectura/autoría) de `SEO_ROADMAP_V1.md` están completados. |
| Deudas técnicas P1-P3 sin dependencia | `SEO-SITENAME-UNIFY-01`, `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`, `SEO-BREADCRUMB-AUDIT-01`/`IMPL-01` — todas ya cerradas según `docs/PROJECT_STATUS.md` (raíz), verificar estado exacto antes de reabrir cualquiera. |
| Snapshot GSC próximo | **2026-07-17 a 2026-07-31** — desbloquea decisiones sobre contenido nuevo adicional y sobre 3 artículos EN "dudosos". |
| `/blog/plantilla-kakebo-excel` | Activo dominante — protegido, no se toca sin autorización explícita. |

**Regla vigente heredada de `PLAN_SEO_GEO_METODOKAKEBO.md` y `SEO_ROADMAP_RESUME_2026_07_09.md`:** no publicar contenido nuevo hasta que el snapshot GSC 2026-07-17/31 aporte datos, salvo que una pieza concreta ya tenga keyword research aprobado como paso previo (este backlog no sustituye ese proceso — solo ordena qué priorizar cuando llegue el momento).

---

## 3. Documentos revisados

- `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md`
- `docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md`
- `docs/seo/SEO_MAP_V1.md`
- `docs/seo/KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`
- `docs/seo/CONTENT_02_FONDO_EMERGENCIA.md`
- `docs/seo/GSC_CHANGELOG_2026_07_03.md`
- `docs/PROJECT_STATUS.md`
- `PROJECT_STATUS.md` (raíz)
- `src/content/blog/*.mdx` (31 artículos ES+EN, vía `SEO_MAP_V1.md` + lectura directa de `cuentas-remuneradas.es.mdx`)
- `messages/es.json` (namespace `Tools.*` — metadata de las 3 herramientas)
- Páginas de herramientas: `/herramientas/calculadora-ahorro`, `/herramientas/calculadora-inflacion`, `/herramientas/regla-50-30-20`

---

## 4. Mapa de contenidos existentes por cluster

### Cluster 1 — Método Kakebo

| Contenido existente | Rol |
|---|---|
| `/blog/metodo-kakebo-guia-definitiva` | Pilar del cluster / hub conceptual |
| `/blog/metodo-kakebo-para-autonomos` | Segmentación por perfil (autónomos) |
| `/blog/kakebo-online-guia-completa`, `/blog/kakebo-online-gratis` | Variante "online / digital" del método |
| `/blog/libro-kakebo-pdf` | Variante "libro / PDF" |
| `/blog/kakebo-vs-ynab` | Comparativa BOFU |
| `/tutorial` (no editorial, onboarding producto) | Reforzamiento no-blog |

### Cluster 2 — Ahorro mensual

| Contenido existente | Rol |
|---|---|
| `/blog/como-ahorrar-dinero-cada-mes` | TOFU amplio |
| `/blog/regla-30-dias` | Técnica específica |
| `/blog/eliminar-gastos-hormiga` | Técnica específica |
| `/blog/kakebo-sueldo-minimo` | Segmentación por perfil (ingresos bajos) |
| `/blog/ahorro-pareja` | Segmentación por perfil (pareja) |
| `/herramientas/calculadora-ahorro` | Herramienta ancla (CTR 35,9%, la señal más fuerte del sitio) |

### Cluster 3 — Fondo de emergencia

| Contenido existente | Rol |
|---|---|
| `/blog/fondo-de-emergencia` | Pieza dedicada (cálculo práctico), **en medición** |
| `/blog/como-hacer-un-presupuesto-personal` | Define "qué es" + regla 3-6 meses |
| `/blog/cuentas-remuneradas` | Resuelve "dónde guardarlo" |
| FAQ de `calculadora-ahorro` | Función "Añadir objetivo" vinculada al cálculo |

**Cluster con mayor densidad de contenido reciente — saturado a corto plazo.** Cualquier pieza nueva aquí debe justificar un ángulo no cubierto por las 4 piezas ya existentes.

### Cluster 4 — Cuentas remuneradas

| Contenido existente | Rol |
|---|---|
| `/blog/cuentas-remuneradas` | Pieza única del cluster, **en medición**. Cubre qué es, TIN/TAE, fiscalidad (IRPF), FGD, cuenta remunerada vs. depósito |

### Cluster 5 — Inflación

| Contenido existente | Rol |
|---|---|
| `/herramientas/calculadora-inflacion` | Única pieza del cluster. 353 impresiones, CTR 0,28%, sin artículo editorial de respaldo |
| `/blog/fondo-de-emergencia` §"Fondo de emergencia y la pérdida de poder adquisitivo" | Mención breve, no desarrollo completo |

**Gap crítico confirmado en `SEO_MAP_V1.md` §11 desde 2026-06-30, aún sin cerrar.**

### Cluster 6 — Presupuesto personal

| Contenido existente | Rol |
|---|---|
| `/blog/como-hacer-un-presupuesto-personal` | Pilar del cluster, publicado 2026-06-22, sin datos GSC consolidados todavía |

### Cluster 7 — Regla 50/30/20

| Contenido existente | Rol |
|---|---|
| `/herramientas/regla-50-30-20` | Única pieza del cluster. Sin artículo editorial de respaldo |

**Gap crítico confirmado en `SEO_MAP_V1.md` §11 desde 2026-06-30, aún sin cerrar.**

### Cluster 8 — Alternativas a apps bancarias / Fintonic

| Contenido existente | Rol |
|---|---|
| `/blog/alternativas-a-app-bancarias` | Pieza principal, optimizada CTR (310 imp, CTR 0,65% tras optimización) |
| `/blog/peligros-apps-ahorro-automatico` | Pieza complementaria (privacidad/Open Banking) |

### Cluster 9 — Plantillas y Excel

| Contenido existente | Rol |
|---|---|
| `/blog/plantilla-kakebo-excel` | **Activo dominante del sitio — protegido, no tocar.** |

**Cualquier pieza nueva de este cluster (p. ej. "plantilla kakebo Google Sheets") requiere autorización explícita adicional, dado el estatus protegido del cluster completo.**

### Cluster 10 — Casos prácticos por perfil

| Contenido existente | Rol |
|---|---|
| `/blog/kakebo-sueldo-minimo` | Perfil ingresos bajos/estudiante |
| `/blog/ahorro-pareja` | Perfil pareja |
| `/blog/metodo-kakebo-para-autonomos` | Perfil autónomo |

**Perfiles no cubiertos todavía:** familia con hijos, jubilación/mayores, freelance digital/nómada, primer sueldo/recién graduado.

---

## 5. Huecos detectados por cluster

| Cluster | Hueco | Severidad |
|---|---|---|
| Regla 50/30/20 | Sin artículo de respaldo — herramienta sin cobertura informacional | Alta (gap confirmado, sin cerrar desde hace 9 días) |
| Inflación | Sin artículo de respaldo — mismo problema, CTR más bajo del sitio | Alta |
| Método Kakebo | `metodo-kakebo-guia-definitiva` debería ser hub reforzado, pero no hay pieza nueva desde hace tiempo que lo alimente con enlaces entrantes frescos | Media |
| Casos prácticos por perfil | Faltan perfiles: familia con hijos, jubilación, freelance digital, primer sueldo | Media |
| Alternativas / Fintonic | Sin segunda comparativa directa marca vs. marca (`SEO-KAKEBO-VS-FINTONIC-01` ya identificada, bloqueada por snapshot GSC) | Media (ya priorizada, en espera) |
| Fondo de emergencia | Saturado — no hay hueco real a corto plazo tras `CONTENT-02` | Ninguno (cluster cerrado por ahora) |
| Cuentas remuneradas | Pieza única, cluster fino — posible ampliación futura (p. ej. "cuenta remunerada vs. cuenta corriente") pero de baja urgencia | Baja |
| Presupuesto personal | Pilar reciente sin datos — no abrir más contenido hasta tener señal | Baja (esperar, no hueco activo) |
| Plantillas y Excel | Cluster protegido — hueco teórico ("plantilla Google Sheets") pero bloqueado por política de protección | Bloqueado, no priorizable ahora |

---

## 6. Backlog editorial priorizado

Criterios aplicados (según brief): intención clara, long tail atacable, conexión con herramientas propias, refuerzo de contenido ya publicado, no canibalización, monetización futura posible, sin dependencia de datos bancarios vivos, sin necesidad de actualización constante.

### Prioridad ALTA

| # | Idea de artículo | Cluster | Keyword padre probable | Long tail recomendada | Herramienta conectada |
|---|---|---|---|---|---|
| 1 | Artículo de respaldo para regla 50/30/20 | Regla 50/30/20 | `regla 50 30 20` | `cómo aplicar la regla 50/30/20 a tu sueldo` | `/herramientas/regla-50-30-20` |
| 2 | Artículo de respaldo para calculadora de inflación | Inflación | `inflación y ahorro` | `cómo afecta la inflación a mis ahorros` | `/herramientas/calculadora-inflacion` |
| 3 | Kakebo para primer sueldo / recién graduados | Casos prácticos | `ahorrar con el primer sueldo` | `cómo empezar a ahorrar con tu primer sueldo` | `/herramientas/calculadora-ahorro` |

### Prioridad MEDIA

| # | Idea de artículo | Cluster | Keyword padre probable | Long tail recomendada | Herramienta conectada |
|---|---|---|---|---|---|
| 4 | Kakebo para familias con hijos | Casos prácticos | `presupuesto familiar` | `cómo hacer un presupuesto familiar con hijos` | `/herramientas/calculadora-ahorro`, `/herramientas/regla-50-30-20` |
| 5 | Kakebo vs Fintonic (comparativa directa marca) | Alternativas / Fintonic | `kakebo vs fintonic` | `alternativa a fintonic sin conectar el banco` | Ninguna directa — refuerza `alternativas-a-app-bancarias` |
| 6 | Errores comunes al hacer un presupuesto personal (soporte del pilar) | Presupuesto personal | `errores presupuesto personal` | `errores al hacer un presupuesto mensual` | `/herramientas/calculadora-ahorro` |
| 7 | Kakebo para freelance digital / ingresos variables (ampliación de autónomos) | Casos prácticos | `ahorrar con ingresos variables` | `cómo ahorrar con ingresos irregulares siendo freelance` | `/herramientas/calculadora-ahorro` |
| 8 | Cuenta remunerada vs cuenta corriente (ampliación del cluster cuentas remuneradas) | Cuentas remuneradas | `cuenta remunerada vs cuenta corriente` | `diferencia entre cuenta remunerada y cuenta corriente` | Ninguna directa — refuerza `cuentas-remuneradas` |

### Prioridad BAJA

| # | Idea de artículo | Cluster | Keyword padre probable | Long tail recomendada | Herramienta conectada |
|---|---|---|---|---|---|
| 9 | Kakebo para jubilación / mayores | Casos prácticos | `ahorro para la jubilación` | `cómo organizar el presupuesto en la jubilación` | `/herramientas/calculadora-ahorro` |
| 10 | Qué es la regla 50/30/20 y de dónde viene (informativo puro, complementario al #1) | Regla 50/30/20 | `qué es la regla 50/30/20` | `origen y explicación de la regla 50/30/20` | `/herramientas/regla-50-30-20` |

---

## 7. Top 10 ideas de artículos (resumen ordenado)

1. Artículo de respaldo — regla 50/30/20 *(alta)*
2. Artículo de respaldo — calculadora de inflación *(alta)*
3. Kakebo para primer sueldo / recién graduados *(alta)*
4. Kakebo para familias con hijos *(media)*
5. Kakebo vs Fintonic — comparativa directa *(media, ya bloqueada por snapshot GSC)*
6. Errores comunes al hacer un presupuesto personal *(media)*
7. Kakebo para freelance digital / ingresos variables *(media)*
8. Cuenta remunerada vs cuenta corriente *(media)*
9. Kakebo para jubilación / mayores *(baja)*
10. Qué es la regla 50/30/20 y de dónde viene *(baja)*

---

## 8. Top 3 recomendadas para keyword research

1. **Artículo de respaldo — regla 50/30/20.** Gap confirmado hace 9 días en `SEO_MAP_V1.md`, herramienta ya optimizada sin apoyo editorial, patrón idéntico al que ya funcionó con `calculadora-ahorro` → `fondo-de-emergencia`/`cuentas-remuneradas`.
2. **Artículo de respaldo — calculadora de inflación.** Mismo patrón de gap, y es la herramienta con el CTR más bajo del sitio (0,28%) — un artículo de apoyo podría mejorar tanto tráfico informacional como reforzar la señal de intención de la herramienta.
3. **Kakebo para primer sueldo / recién graduados.** Perfil no cubierto todavía en el cluster de casos prácticos, intención clara y long tail de baja competencia, conecta de forma natural con `calculadora-ahorro` y con el pilar de presupuesto personal sin canibalizar `kakebo-sueldo-minimo` (que apunta a un perfil económico, no etario/vital).

---

## 9. Artículos que NO deben hacerse todavía

- **Fondo de emergencia — cualquier pieza adicional.** Cluster saturado tras `CONTENT-02`; no hay hueco real a corto plazo.
- **Comparativas bancarias vivas / "mejores cuentas remuneradas 2026".** Excluidas explícitamente por el brief — requieren mantenimiento constante y comprometen la política "sin afiliación, sin recomendación de entidades" ya aplicada en `cuentas-remuneradas`.
- **Artículos comerciales de afiliación.** Fuera de alcance por política editorial vigente.
- **Plantilla Kakebo Google Sheets / cualquier pieza del cluster Excel.** Bloqueado por la protección de `/blog/plantilla-kakebo-excel` — requiere autorización explícita antes de plantear siquiera el keyword research.
- **Kakebo vs Fintonic (comparativa directa).** Identificada como prioridad media, pero explícitamente bloqueada por `SEO_ROADMAP_RESUME_2026_07_09.md` hasta el snapshot GSC 2026-07-17/31 y los resultados de los dos artículos de herramientas ya publicados.
- **Cualquier artículo nuevo en general, en sentido estricto.** El bloque de contenido nuevo permanece bloqueado por el Plan Maestro hasta el snapshot GSC 2026-07-17/31, salvo que una pieza concreta pase primero por su propio keyword research (como ocurrió con `fondo-de-emergencia`) y se decida ejecutarla de forma aislada y justificada.

---

## 10. Dependencias de GSC/GA4

| Evento | Fecha | Qué desbloquea |
|---|---|---|
| Snapshot GSC | 2026-07-17 a 2026-07-31 | Validación del cluster Regla 50/30/20 e Inflación (impresiones/CTR post-optimización), decisión sobre 3 artículos EN dudosos, confirmación de si el bloque de contenido nuevo puede abrirse con datos reales |
| Fin ventana medición `/blog/cuentas-remuneradas` | ~2026-09-02 a 2026-09-30 | Señal sobre si el patrón editorial "artículo puente hacia herramienta" debe repetirse en otros clusters |
| Fin ventana medición `/blog/fondo-de-emergencia` | ~2026-09-03 a 2026-10-01 | Cierre definitivo del cluster fondo de emergencia; confirma si el ángulo "cálculo práctico + conexión con herramienta" es replicable |

**Ninguna idea de este backlog debe ejecutarse (keyword research incluido, salvo las 3 recomendadas en §8) antes de que el snapshot GSC 2026-07-17/31 confirme si el bloque de contenido nuevo debe abrirse.**

---

## 11. Siguiente tarea recomendada

**Esperar el snapshot GSC 2026-07-17/31.** Mientras tanto, si se desea adelantar trabajo sin publicar contenido, la tarea natural siguiente es un **keyword research aislado** (mismo formato que `KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`) para la idea #1 de este backlog (artículo de respaldo de la regla 50/30/20), replicando el mismo patrón de decisión que ya se usó para `fondo-de-emergencia`: research → decisión → redacción, cada uno como tarea separada y documentada.

---

*SEO_CONTENT_BACKLOG_CLUSTERS_01.md — creado 2026-07-09*
*Solo análisis estratégico y documentación — no se ha creado ningún artículo, MDX, ni tocado código, herramientas, sitemap, robots, canonical, hreflang ni schema*
