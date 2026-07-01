# SEO_INTERNAL_LINKING_V1_01 — Auditoría y Plan de Enlazado Interno

**Fecha:** 2026-07-01  
**Tipo:** Documentación estratégica SEO/GEO — sin cambios en código ni contenido  
**Estado:** Plan de referencia activo — no implementar hasta aprobación de fase correspondiente  
**Prerequisito:** Tener cada URL con su función definida antes de ejecutar cualquier fase

---

## 1. Resumen ejecutivo

MetodoKakebo.com tiene 15 artículos ES activos, 3 herramientas, una Home y un artículo pilar reciente. La arquitectura de enlazado interno actual es parcial: los artículos usan `related` posts en frontmatter y algunos enlaces contextuales en body, pero el flujo de autoridad no está diseñado estratégicamente. La URL con más autoridad (`plantilla-kakebo-excel`) no redistribuye suficientemente su PageRank hacia las herramientas estratégicas. Las herramientas tienen buen CTR pero pocas señales entrantes desde el blog. El artículo pilar `metodo-kakebo-guia-definitiva` debería ser el hub del cluster Kakebo Core, pero es probable que reciba poco enlazado entrante.

El plan propone 4 fases: comenzar con los enlaces mínimos de mayor impacto (plantilla-excel → herramientas, artículos soporte → metodo-kakebo-guia-definitiva), escalar hacia el refuerzo del cluster kakebo-online/app, y cerrar con revisión de anchors y canibalizaciones.

**Principio rector: no enlazar por enlazar. Cada enlace debe tener un destino justificado y un anchor semánticamente correcto.**

---

## 2. Objetivo de la auditoría

1. Mapear el enlazado interno actual de las URLs prioritarias.
2. Identificar qué URLs necesitan más autoridad entrante.
3. Proponer anchors correctos según el glosario canónico.
4. Detectar riesgos de sobreoptimización y canibalización.
5. Ordenar la implementación en fases priorizadas por impacto y riesgo.

---

## 3. Principios de enlazado interno para MetodoKakebo.com

1. **Flujo jerárquico**: la autoridad fluye desde las páginas con más PageRank (plantilla-excel, Home) hacia las páginas con mayor potencial de posicionamiento (calculadoras, metodo-kakebo-guia-definitiva).

2. **Un anchor, una intención**: cada enlace interno debe tener un anchor que refleje exactamente la intención de la página destino. No usar "haz clic aquí" ni anchors genéricos.

3. **Contexto semántico real**: solo enlazar cuando el contexto del párrafo hace relevante el destino. No insertar enlaces forzados.

4. **Proteger la URL ganadora**: `/blog/plantilla-kakebo-excel` no debe recibir cambios de enlazado salientes masivos hasta que la fase 1 esté validada.

5. **Herramientas primero**: las calculadoras necesitan enlazado entrante desde artículos — son el activo con mejor CTR y el más subenlazado del sitio.

6. **Anchors según glosario**: seguir estrictamente el glosario canónico de `SEO_GEO_TERMINOLOGY_01.md` para los textos ancla.

7. **No más de 3 enlaces internos por párrafo**: para no diluir la señal de cada enlace.

8. **No enlazar antes de definir la función de la URL**: si una URL no tiene su intención SEO definida, no añadir enlaces hacia ella todavía.

---

## 4. Relación con glosario y definiciones GEO

Los anchors de los enlaces internos deben ser coherentes con los términos canónicos del glosario. Esto también beneficia GEO: cuando un motor generativo rastrea el sitio y ve que "calculadora de ahorro mensual" siempre apunta al mismo destino, la asociación entre el término y la URL se consolida.

| Anchor interno | URL destino canónica | Término del glosario |
|---|---|---|
| "el método Kakebo" / "método Kakebo" | `/blog/metodo-kakebo-guia-definitiva` | Método Kakebo |
| "plantilla Kakebo Excel" / "plantilla Kakebo Excel gratis" | `/blog/plantilla-kakebo-excel` | Plantilla Kakebo Excel |
| "calculadora de ahorro mensual" | `/herramientas/calculadora-ahorro` | Calculadora de ahorro mensual |
| "calculadora de inflación e IPC" / "calculadora de inflación" | `/herramientas/calculadora-inflacion` | Calculadora de inflación e IPC |
| "calculadora 50/30/20" / "regla 50/30/20" | `/herramientas/regla-50-30-20` | Calculadora 50/30/20 |
| "presupuesto personal" (como artículo) | `/blog/como-hacer-un-presupuesto-personal` | Presupuesto personal |
| "Kakebo AI" / "app Kakebo" | `/` o `/login` (según contexto) | Kakebo AI |
| "herramientas gratuitas de ahorro" | `/herramientas` | Herramientas gratuitas |
| "kakebo online" (descriptivo) | `/blog/kakebo-online-gratis` o contexto | Kakebo online |

---

## 5. URLs prioritarias y rol SEO

| URL | Tipo | Cluster | Intención principal | Estado SEO actual | Debe recibir enlaces desde | Debe enlazar hacia | Anchors recomendados | Prioridad | Riesgo |
|---|---|---|---|---|---|---|---|---|---|
| `/blog/plantilla-kakebo-excel` | Artículo pilar | Kakebo Excel | Transaccional — descarga | **125 clics · pos 6,14** — URL tractora principal | `metodo-kakebo-guia-definitiva`, `kakebo-online-gratis`, `como-hacer-un-presupuesto-personal`, `como-ahorrar-dinero-cada-mes` | `calculadora-ahorro`, `regla-50-30-20`, `metodo-kakebo-guia-definitiva` | "plantilla Kakebo Excel gratis", "plantilla Kakebo en Excel" | P0 — PROTEGER | Alto — no modificar agresivamente |
| `/herramientas/calculadora-ahorro` | Herramienta | Control de Gastos | Transaccional — calcular ahorro | **CTR 34,88% · pos 10,7** — subenlazada | `plantilla-kakebo-excel`, `como-ahorrar-dinero-cada-mes`, `regla-30-dias`, `kakebo-online-gratis`, `metodo-kakebo-para-autonomos`, `como-hacer-un-presupuesto-personal` | `/` (Home/app), `regla-50-30-20` | "calculadora de ahorro mensual", "cuánto ahorrar al mes" | **P0** | Bajo |
| `/herramientas/calculadora-inflacion` | Herramienta | Inflación/IPC | Transaccional — calcular inflación | 300 imp · 1 clic · CTR 0,33% — muy subenlazada | Artículo de blog sobre inflación (pendiente crear), `como-ahorrar-dinero-cada-mes`, `como-hacer-un-presupuesto-personal` | `/` (Home/app) | "calculadora de inflación e IPC", "calcular la inflación" | P1 | Bajo |
| `/herramientas/regla-50-30-20` | Herramienta | Regla 50/30/20 | Transaccional — distribuir sueldo | 6 imp · 0 clics — casi invisible | `plantilla-kakebo-excel` (en sección de pestaña de previsión), `como-hacer-un-presupuesto-personal`, `como-ahorrar-dinero-cada-mes` | `/` (Home/app) | "calculadora 50/30/20", "regla 50/30/20" | P1 | Bajo |
| `/` (Home) | Hub de marca | Kakebo Online/App | Navegacional/Marca | 51 clics · 892 imp · pos 8,2 | Artículos con CTA hacia app, herramientas | Herramientas (via ToolsSection ya existente), `/login` | "Kakebo AI", "app Kakebo" | P1 | Bajo |
| `/blog/metodo-kakebo-guia-definitiva` | Artículo pilar cluster | Kakebo Core | Informacional — pilar método | 1 clic · 12 imp · pos 15,33 — infraconectado | Todos los artículos del cluster Kakebo Core, `plantilla-kakebo-excel`, `como-ahorrar-dinero-cada-mes` | `calculadora-ahorro`, `plantilla-kakebo-excel`, artículos del cluster | "el método Kakebo", "guía del método Kakebo" | **P0** — hub sin señales | Bajo |
| `/blog/kakebo-online-gratis` | Artículo | Kakebo Online/App | Informacional/captación app | 1 clic ES · 208 imp EN (canibalizacion resuelta con noindex) | `metodo-kakebo-guia-definitiva`, `plantilla-kakebo-excel` | Home (`/`), `kakebo-online-guia-completa`, `calculadora-ahorro` | "kakebo online gratis", "Kakebo AI" | P1 | Medio — recién corregida la canibalización, esperar reindexación |
| `/blog/como-hacer-un-presupuesto-personal` | Artículo pilar | Presupuesto Personal | Informacional — guía presupuesto | 0 clics · 11 imp · pos 21,73 — reciente (2026-06-22) | `plantilla-kakebo-excel` (como recurso complementario), `como-ahorrar-dinero-cada-mes`, `metodo-kakebo-guia-definitiva` | `calculadora-ahorro`, `regla-50-30-20`, `metodo-kakebo-guia-definitiva` | "presupuesto personal", "hacer un presupuesto" | P1 — esperar indexación | Bajo |
| `/blog/como-ahorrar-dinero-cada-mes` | Artículo TOFU | Control de Gastos | Informacional amplio | 0 clics · 12 imp · pos 8,83 | `metodo-kakebo-guia-definitiva`, `plantilla-kakebo-excel`, `como-hacer-un-presupuesto-personal` | `calculadora-ahorro`, `calculadora-inflacion`, `regla-50-30-20` | "ahorrar dinero cada mes", "técnicas de ahorro" | P1 | Bajo |
| `/blog/alternativas-a-app-bancarias` | Artículo | Alternativas/Fintonic | Informacional comparativa | 2 clics · 284 imp · CTR 0,7% | `kakebo-online-gratis`, `peligros-apps-ahorro-automatico` | `kakebo-online-gratis`, Home | "alternativas a Fintonic", "apps sin banco" | P1 | Bajo |

---

## 6. Clusters y arquitectura interna recomendada

### Cluster 1 — Método Kakebo (hub semántico)

```
Hub: /blog/metodo-kakebo-guia-definitiva
│
├── /blog/kakebo-sueldo-minimo (soporte)
├── /blog/metodo-kakebo-para-autonomos (soporte)
├── /blog/kakebo-vs-ynab (comparativa)
├── /blog/ahorro-pareja (nicho)
├── /blog/eliminar-gastos-hormiga (soporte)
│
└── Herramientas relacionadas:
    └── /herramientas/calculadora-ahorro
```

**Problema actual:** `metodo-kakebo-guia-definitiva` está en posición 15,33 y tiene 1 clic. Es el hub semántico del sitio pero no recibe suficientes señales entrantes. Todos los artículos del cluster deben enlazarle.

---

### Cluster 2 — Kakebo Excel (artículo pilar orgánico)

```
Pilar: /blog/plantilla-kakebo-excel
│
├── Recibe desde: metodo-kakebo-guia-definitiva, kakebo-online-gratis,
│                 como-hacer-un-presupuesto-personal
│
└── Envía hacia:  metodo-kakebo-guia-definitiva (ya tiene)
                  calculadora-ahorro (solo en FAQ — añadir en body)
                  regla-50-30-20 (falta — en sección Pestaña de Previsión)
```

**Problema actual:** `plantilla-kakebo-excel` solo enlaza a `calculadora-ahorro` en el FAQ, no en el body. `regla-50-30-20` no está enlazada desde ningún lugar del artículo pese a ser relevante para la sección de previsión mensual.

---

### Cluster 3 — Kakebo Online / App

```
Artículos:
├── /blog/kakebo-online-gratis (captación app)
└── /blog/kakebo-online-guia-completa (informacional)

Destino de conversión:
└── / (Home / Kakebo AI)
```

**Problema actual:** La canibalización EN/ES acaba de corregirse. Esperar 6-8 semanas para que Google reindexe antes de añadir más señales a estas URLs.

---

### Cluster 4 — Herramientas

```
Hub: /herramientas
│
├── /herramientas/calculadora-ahorro  ← P0: necesita más enlaces entrantes
├── /herramientas/calculadora-inflacion  ← P1: muy subenlazada
└── /herramientas/regla-50-30-20  ← P1: casi sin señales
```

**Problema actual:** Las herramientas son calculadoras web que no generan contenido propio. Dependen 100% de que los artículos del blog les envíen tráfico y autoridad. Actualmente hay muy pocos enlaces de blog hacia herramientas.

---

### Cluster 5 — Presupuesto Personal

```
Pilar: /blog/como-hacer-un-presupuesto-personal (reciente)
│
├── Herramientas: calculadora-ahorro, regla-50-30-20
└── Soporte: como-ahorrar-dinero-cada-mes, metodo-kakebo-guia-definitiva
```

---

### Cluster 6 — Inflación / IPC

```
Herramienta: /herramientas/calculadora-inflacion
│
└── Artículo de respaldo: /blog/inflacion-y-ahorros (PENDIENTE CREAR)
```

**Gap crítico:** Sin artículo editorial, la calculadora-inflacion no puede recibir enlaces contextuales desde el blog. La herramienta tiene 300 impresiones pero 1 clic — necesita un artículo que capture el tráfico informacional y enlace a la herramienta.

---

### Cluster 7 — Regla 50/30/20

```
Herramienta: /herramientas/regla-50-30-20
│
└── Artículo de respaldo: /blog/regla-50-30-20 (PENDIENTE CREAR)
```

**Gap crítico:** Igual que inflación — sin artículo no hay enlazado contextual posible.

---

### Cluster 8 — Alternativas / Fintonic

```
/blog/alternativas-a-app-bancarias
└── /blog/peligros-apps-ahorro-automatico (soporte)
└── → /blog/kakebo-online-gratis (conversión)
```

---

## 7. Mapa de autoridad interna recomendado

```
[Alta autoridad / mayor PageRank]
/blog/plantilla-kakebo-excel (125 clics)
        │
        ├──→ /herramientas/calculadora-ahorro (nuevo enlace en body)
        ├──→ /herramientas/regla-50-30-20 (nuevo enlace en sección pestaña previsión)
        └──→ /blog/metodo-kakebo-guia-definitiva (ya tiene)

/` (Home — 51 clics, 892 imp)
        │
        ├──→ Herramientas via ToolsSection (ya existe)
        └──→ /login (ya existe)

[URLs que necesitan recibir más autoridad]
/blog/metodo-kakebo-guia-definitiva (1 clic, pos 15,33)
        ← desde: plantilla-excel (ya tiene), kakebo-online-gratis, 
                 como-hacer-un-presupuesto-personal, como-ahorrar-dinero-cada-mes,
                 metodo-kakebo-para-autonomos, kakebo-vs-ynab, 
                 kakebo-sueldo-minimo, eliminar-gastos-hormiga, ahorro-pareja

/herramientas/calculadora-ahorro (CTR 34,88% pero pos 10,7)
        ← desde: plantilla-excel (nuevo en body), como-ahorrar-dinero-cada-mes,
                 regla-30-dias, metodo-kakebo-para-autonomos (ya tiene en FAQ),
                 como-hacer-un-presupuesto-personal, kakebo-online-gratis

/herramientas/calculadora-inflacion (300 imp, 1 clic)
        ← desde: como-ahorrar-dinero-cada-mes, como-hacer-un-presupuesto-personal,
                 artículo de inflación futuro (gap crítico)

/herramientas/regla-50-30-20 (6 imp, 0 clics)
        ← desde: plantilla-kakebo-excel (nuevo), como-hacer-un-presupuesto-personal,
                 artículo futuro sobre la regla (gap crítico)
```

---

## 8. Tabla maestra de URLs — lo que deben recibir

| URL destino | Ancla actual | Enlazar desde | Anchor recomendado | Impacto esperado | Fase |
|---|---|---|---|---|---|
| `/blog/metodo-kakebo-guia-definitiva` | `plantilla-kakebo-excel` (body), `kakebo-online-gratis` (intro) | `como-hacer-un-presupuesto-personal`, `como-ahorrar-dinero-cada-mes`, `metodo-kakebo-para-autonomos`, `kakebo-vs-ynab`, `kakebo-sueldo-minimo`, `eliminar-gastos-hormiga`, `ahorro-pareja`, `regla-30-dias` | "el método Kakebo", "guía completa del método Kakebo" | Alto — consolida el hub semántico del cluster | Fase 1 |
| `/herramientas/calculadora-ahorro` | `plantilla-kakebo-excel` (FAQ), `metodo-kakebo-para-autonomos` (FAQ) | `plantilla-kakebo-excel` (body, nuevo), `como-ahorrar-dinero-cada-mes`, `regla-30-dias`, `kakebo-online-gratis`, `como-hacer-un-presupuesto-personal` | "calculadora de ahorro mensual", "cuánto ahorrar al mes" | Alto — distribuir PageRank desde URL tractora | Fase 1 |
| `/herramientas/regla-50-30-20` | Solo nav | `plantilla-kakebo-excel` (sección pestaña previsión), `como-hacer-un-presupuesto-personal`, `como-ahorrar-dinero-cada-mes` | "calculadora 50/30/20", "regla 50/30/20" | Medio — herramienta sin señales | Fase 2 |
| `/herramientas/calculadora-inflacion` | Solo nav | `como-ahorrar-dinero-cada-mes`, `como-hacer-un-presupuesto-personal`, artículo inflación (futuro) | "calculadora de inflación e IPC", "calcular pérdida de poder adquisitivo" | Alto — 300 imp sin enlazado blog | Fase 3 |
| `/blog/plantilla-kakebo-excel` | `como-ahorrar-dinero-cada-mes` (no verificado), `kakebo-online-gratis` (related) | `como-hacer-un-presupuesto-personal`, `metodo-kakebo-guia-definitiva`, `kakebo-online-gratis` (body) | "plantilla Kakebo Excel gratis", "plantilla Kakebo en Excel" | Medio — reforzar la URL tractora | Fase 2 |
| `/blog/como-hacer-un-presupuesto-personal` | Ninguno confirmado | `plantilla-kakebo-excel` (como recurso de registro), `como-ahorrar-dinero-cada-mes`, `metodo-kakebo-guia-definitiva` | "cómo hacer un presupuesto personal", "presupuesto personal" | Bajo-Medio — artículo reciente | Fase 2 (esperar indexación) |

---

## 9. Tabla de anchors recomendados

| Anchor | URL destino | Tipo de anchor | Uso recomendado | No usar en | Riesgo si se abusa |
|---|---|---|---|---|---|
| "el método Kakebo" | `/blog/metodo-kakebo-guia-definitiva` | Exact match parcial | Cualquier artículo que mencione el método por primera vez | No usar como único anchor repetido 3+ veces en el mismo artículo | Sobreoptimización de exact match |
| "guía completa del método Kakebo" | `/blog/metodo-kakebo-guia-definitiva` | Long tail descriptivo | Primera mención del método en artículos de cluster | Artículos que ya enlazan con otro anchor a la misma URL | — |
| "método Kakebo japonés" | `/blog/metodo-kakebo-guia-definitiva` | Descriptivo | Artículos donde conviene especificar el origen japonés | Solo cuando el contexto no es ya japonés | — |
| "plantilla Kakebo Excel gratis" | `/blog/plantilla-kakebo-excel` | Exact keyword | En artículos que mencionen el recurso descargable | No usar en artículos del propio cluster Excel para evitar autoreferencia | Canibalización si se usa desde `plantilla-kakebo-excel` hacia sí mismo |
| "calculadora de ahorro mensual" | `/herramientas/calculadora-ahorro` | Exact keyword canónico | En cualquier artículo que hable de cuánto ahorrar al mes | No en la propia página de la calculadora | Bajo — anchor muy específico |
| "calculadora de inflación e IPC" | `/herramientas/calculadora-inflacion` | Exact keyword canónico | En artículos sobre ahorro, inflación o poder adquisitivo | No en la propia página de la herramienta | Bajo |
| "calculadora 50/30/20" | `/herramientas/regla-50-30-20` | Exact keyword canónico | En artículos sobre presupuesto, distribución de sueldo | No en la propia página | Bajo |
| "regla 50/30/20" | `/herramientas/regla-50-30-20` | Conceptual | En artículos que expliquen el concepto | No cuando el contexto ya tiene "calculadora" — preferir el anchor de la herramienta | — |
| "presupuesto personal" | `/blog/como-hacer-un-presupuesto-personal` | Conceptual | En artículos de finanzas generales que mencionen presupuesto | No cuando el artículo origen ya habla extensamente de presupuesto | Canibalización con la propia URL si hay muchos artículos similares |
| "herramientas gratuitas de ahorro" | `/herramientas` | Hub genérico | Para enlazar al hub cuando se menciona el conjunto de calculadoras | No como sustituto de un enlace específico a una calculadora concreta | — |
| "kakebo online" (en contexto de captación) | `/blog/kakebo-online-gratis` | Descriptor funcional | En artículos que hablen de usar el método en digital | No usar para enlazar a la Home — "kakebo online" describe el artículo, no la app | Confusión con la Home si se usa con destino `/` |
| "Kakebo AI" | `/` o `/login` | Nombre de marca | En CTAs de conversión, fin de artículos | No como anchor de enlace editorial mid-text — es más CTA que editorial | — |
| "ahorrar dinero cada mes" | `/blog/como-ahorrar-dinero-cada-mes` | Long tail TOFU | Artículos soporte que mencionen técnicas de ahorro | No en artículos que ya tienen alta densidad de este tema | — |

### Anchors a evitar

| Anchor problemático | Problema | En su lugar |
|---|---|---|
| "aquí", "este artículo", "haz clic aquí" | Sin valor semántico | Usar el nombre del recurso o concepto |
| "Kakebo" (solo) como anchor | Ambiguo — puede ser método o producto | Usar "el método Kakebo" o "Kakebo AI" según contexto |
| "app" (solo) | Genérico, no identifica la entidad | "Kakebo AI" o "app Kakebo" |
| "herramienta" (solo) | No identifica cuál | Nombre específico de la calculadora |
| "gratis" (solo) | Sin entidad asociada | Siempre con el nombre: "calculadora de ahorro mensual gratis" |
| "la calculadora" (solo) | No especifica cuál de las tres | Nombre canónico completo |

---

## 10. Riesgos de sobreoptimización

| Riesgo | Descripción | Umbral de alerta | Mitigación |
|---|---|---|---|
| Exact match anchors repetidos | Usar "el método Kakebo" 5+ veces apuntando al mismo destino | Más de 2 enlaces con el mismo anchor exacto desde el mismo artículo | Variar anchors: "el método Kakebo", "sistema de ahorro japonés", "guía del Kakebo" |
| Enlazado masivo desde la URL tractora | Añadir 5+ enlaces salientes nuevos en `plantilla-kakebo-excel` | Más de 2 enlaces nuevos en una sola actualización | Implementar de forma quirúrgica, uno por tarea |
| CTA links vs. editorial links | Confundir CTAs de conversión (hacia `/login`) con enlaces editoriales | Si los CTAs ya cubren el destino, no añadir más enlaces editoriales al mismo sitio | Separar función: CTAs para conversión, links editoriales para autoridad |

---

## 11. Riesgos de canibalización por enlazado

| Par en riesgo | Tipo de riesgo | Acción |
|---|---|---|
| `kakebo-online-gratis` ↔ `kakebo-online-guia-completa` | Ambos artículos compiten por "kakebo online" — añadir enlaces entre ellos puede reforzar la canibalización | Esperar datos GSC post-noindex (6-8 semanas) antes de añadir enlaces entre estos dos |
| `metodo-kakebo-guia-definitiva` ↔ `plantilla-kakebo-excel` | El pilar puede competir con la URL tractora para queries de método | Diferenciar anchors: guía definitiva usa "método Kakebo" (informacional), plantilla usa "plantilla Excel" (transaccional) |
| `Home (/)` ↔ `kakebo-online-gratis` | Ambos compiten por "kakebo online gratis" | No añadir enlaces de artículos hacia Home con anchor "kakebo online" — usar "Kakebo AI" para la Home |
| `como-ahorrar-dinero-cada-mes` ↔ `calculadora-ahorro` | Ambos compiten por "cuánto ahorrar al mes" | Usar la calculadora como complemento del artículo, no como competidor |

---

## 12. Estado actual del enlazado interno (por URL clave)

### `/blog/plantilla-kakebo-excel`

**Recibe desde:**
- `related` frontmatter: ninguno directo hacia ella en artículos principales (solo aparece como related en `kakebo-online-gratis`)
- No confirmados otros enlaces entrantes en body

**Envía hacia (confirmados):**
- `/blog/metodo-kakebo-guia-definitiva` (body — "El método Kakebo")
- `/blog/libro-kakebo-pdf` (body)
- `/blog/kakebo-online-guia-completa` (body)
- `/herramientas/calculadora-ahorro` (FAQ — "calculadora de ahorro")
- `/` (SimpleCTA)

**Gap:** No enlaza a `/herramientas/regla-50-30-20`. Solo enlaza a `calculadora-ahorro` en FAQ, no en body.

---

### `/blog/metodo-kakebo-guia-definitiva`

**Recibe desde (confirmados):**
- `plantilla-kakebo-excel` (body)
- `kakebo-online-gratis` (intro)

**Gap crítico:** Solo 2 fuentes confirmadas. Este artículo debe ser el hub que recibe señales de todos los artículos del cluster Kakebo Core.

---

### `/herramientas/calculadora-ahorro`

**Recibe desde (confirmados):**
- `plantilla-kakebo-excel` (FAQ)
- `metodo-kakebo-para-autonomos` (FAQ)

**Gap:** No recibe desde el body de ningún artículo estratégico fuera de las FAQ. El CTR de 34,88% es excelente — amplificar con más señales entrantes podría mejorar la posición (10,7 → top 5-6).

---

### `/herramientas/calculadora-inflacion`

**Recibe desde:** Solo nav — ningún enlace desde artículos del blog confirmado.

**Gap crítico:** 300 impresiones sin artículo de respaldo ni enlazado de blog.

---

### `/herramientas/regla-50-30-20`

**Recibe desde:** Solo nav — ningún enlace desde artículos del blog.

**Gap crítico:** 6 impresiones — herramienta casi invisible.

---

## 13. Plan de implementación por fases

| Fase | Objetivo | URLs afectadas | Cambios futuros previstos | Riesgo | Validación necesaria |
|---|---|---|---|---|---|
| **Fase 1** — Enlazado mínimo de mayor impacto | Redistribuir PageRank desde URL tractora hacia herramientas clave. Reforzar hub semántico. | `plantilla-kakebo-excel` → `calculadora-ahorro` (body) · `plantilla-kakebo-excel` → `regla-50-30-20` (body) · Artículos cluster Kakebo → `metodo-kakebo-guia-definitiva` | 2-3 artículos con 1-2 enlaces nuevos cada uno. No tocar el copy — insertar enlaces en contexto existente | Bajo | GSC: en 4-6 semanas verificar si `calculadora-ahorro` y `metodo-kakebo-guia-definitiva` mejoran posición |
| **Fase 2** — Refuerzo hacia Home/app y artículos de presupuesto | Conectar artículos de captación con la Home/Kakebo AI. Reforzar el artículo pilar de presupuesto personal. | `kakebo-online-gratis` → Home (ya tiene CTA, verificar si enlace editorial adicional ayuda) · `como-hacer-un-presupuesto-personal` → herramientas · `como-ahorrar-dinero-cada-mes` → herramientas | Esperar 6-8 semanas post-noindex de `kakebo-online-gratis` EN antes de añadir señales al cluster | Medio — canibalización kakebo-online pendiente | Datos GSC tras corrección noindex EN |
| **Fase 3** — Enlazado hacia calculadora-inflacion | Apoyar la herramienta con mayor potencial (300 imp) con señales desde el blog | Artículo nuevo `inflacion-y-ahorros` → `calculadora-inflacion` · `como-ahorrar-dinero-cada-mes` → `calculadora-inflacion` | Requiere primero crear el artículo editorial sobre inflación | Bajo | Crear artículo antes de ejecutar enlaces |
| **Fase 4** — Revisión y ajuste | Revisar impacto del enlazado de fases 1-3. Detectar nuevas canibalizaciones. Ajustar anchors. | Todo el sitio | Audit de GSC comparativo | Muy bajo | Snapshot GSC a las 8-12 semanas post-Fase 1 |

---

## 14. Tareas futuras derivadas

| ID propuesto | Descripción | Fase | Prerequisito |
|---|---|---|---|
| `SEO-EXCEL-INTERNAL-LINKS-01` | Añadir enlace a `calculadora-ahorro` en body y a `regla-50-30-20` en sección pestaña previsión de `plantilla-kakebo-excel` | Fase 1 | Aprobación de esta auditoría |
| `SEO-CLUSTER-KAKEBO-CORE-LINKS-01` | Añadir enlaces hacia `metodo-kakebo-guia-definitiva` desde artículos del cluster (al menos 4-5 artículos) | Fase 1 | Confirmar que la URL no necesita redirección ni cambio de intención primero |
| `SEO-AHORRO-INBOUND-01` | Añadir enlaces a `calculadora-ahorro` desde `como-ahorrar-dinero-cada-mes` y `regla-30-dias` | Fase 1 | — |
| `SEO-PRESUPUESTO-INBOUND-01` | Añadir enlaces desde `plantilla-kakebo-excel` y `como-ahorrar-dinero-cada-mes` hacia `como-hacer-un-presupuesto-personal` | Fase 2 | Esperar indexación del artículo (publicado 2026-06-22) |
| `SEO-INFLACION-INBOUND-01` | Añadir enlaces a `calculadora-inflacion` desde artículos sobre ahorro | Fase 3 | Artículo editorial sobre inflación creado (`SEO-BLOG-INFLACION-01`) |
| `SEO-503020-INBOUND-01` | Añadir enlaces a `regla-50-30-20` desde artículos sobre presupuesto | Fase 3 | Artículo editorial sobre la regla creado (`SEO-BLOG-503020-01`) |
| `SEO-INTERNAL-LINKING-AUDIT-01` | Auditoría de impacto post-implementación (Fase 4) | Fase 4 | GSC snapshot 8-12 semanas post-Fase 1 |

---

## 15. Criterios de validación cuando se ejecute cada fase

### Antes de implementar cualquier fase
- [ ] Cada URL destino tiene su intención SEO definida y estabilizada
- [ ] El anchor a usar está en la tabla de anchors recomendados (sección 9)
- [ ] El enlace se inserta en contexto semántico real (no forzado)
- [ ] No se añaden más de 2 enlaces nuevos por artículo por tarea
- [ ] No se repite el mismo anchor exacto más de 2 veces en el mismo artículo

### Post-implementación (4-6 semanas)
- [ ] GSC: ¿mejoran las posiciones de las URLs que recibieron nuevos enlaces?
- [ ] GSC: ¿aparecen nuevas canibalizaciones entre artículos del mismo cluster?
- [ ] GA4: ¿aumenta el tráfico hacia las herramientas desde el blog?
- [ ] No hay penalización de posición en la URL de origen

---

## 16. Conclusión

El enlazado interno de MetodoKakebo.com tiene tres problemas prioritarios:

1. **`metodo-kakebo-guia-definitiva` está desconectado** del resto del blog pese a ser el hub semántico del cluster. Solo 2 artículos le enlazan. La Fase 1 debe corregir esto.

2. **Las herramientas reciben muy poco enlazado desde el blog**. La `calculadora-ahorro` tiene un CTR de 34,88% que podría mejorar su posición si recibiera señales desde artículos de alto PageRank como `plantilla-kakebo-excel`.

3. **`calculadora-inflacion` y `regla-50-30-20` son casi invisibles** (300 y 6 impresiones respectivamente) porque no tienen artículos de respaldo ni enlaces contextuales desde el blog.

La Fase 1 — 2-3 artículos, 4-6 enlaces totales, bajo riesgo — es suficiente para redistribuir la autoridad de la URL tractora y reforzar el hub semántico. El impacto debería ser visible en GSC en 4-6 semanas.

---

*SEO_INTERNAL_LINKING_V1_01.md — 2026-07-01*  
*17 URLs analizadas · 8 clusters · 4 fases de implementación · 7 tareas derivadas*  
*Sin cambios en código, contenido ni enlaces. Solo documentación.*
