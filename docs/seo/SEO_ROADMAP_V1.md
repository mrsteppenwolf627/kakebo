# SEO_ROADMAP_V1 — Roadmap SEO/GEO Priorizado

**Versión:** 1.0  
**Fecha:** 2026-06-30  
**Commit de referencia:** `db35559` (SEO-GEO-DEEP-AUDIT-01)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni contenido  
**Siguiente fase operativa:** `SEO-DATA-PRIORITY-01` (bloquea todo lo demás)

---

## 1. Resumen ejecutivo

Este roadmap convierte los hallazgos de `SEO_MAP_V1.md` y `SEO_GEO_DEEP_AUDIT_01.md` en una secuencia clara de **26 tareas ejecutables**, organizadas en 7 bloques con dependencias explícitas.

La decisión más importante del roadmap es que **nada del bloque de optimización URL por URL ni de expansión de contenido puede ejecutarse bien sin antes tener datos reales de GSC**. Cualquier acción que se tome antes es intuición, no estrategia.

Los dos únicos bloques que pueden empezar de inmediato sin datos GSC son:
- **P0 Medición**: obtener los datos que desbloquean todo lo demás
- **P1 GEO estructural**: cambios editoriales de bajo riesgo que no requieren validación de tráfico para justificarse

**Total de tareas priorizadas: 26**  
**Tareas P0 (inmediatas): 2**  
**Tareas P1 (pueden iniciar en paralelo): 4**  
**Tareas bloqueadas hasta tener GSC: 12**

---

## 2. Estado actual del proyecto SEO/GEO

| Dimensión | Estado | Fuente |
|---|---|---|
| Base técnica | Sólida — P0 técnicos anteriores resueltos | SEO_GEO_DEEP_AUDIT_01 |
| Canonical blog posts | ✅ Correcto | SEO_GEO_DEEP_AUDIT_01 T-01 (resuelto) |
| robots.txt | ✅ Correcto (`/app/`, `/auth/` bloqueados) | SEO_GEO_DEEP_AUDIT_01 T (resuelto) |
| Canonical herramientas | ✅ Correcto | SEO_GEO_DEEP_AUDIT_01 (resuelto) |
| Schema herramientas | Parcial — `calculadora-ahorro` desalineado | SEO_GEO_DEEP_AUDIT_01 T-05 |
| Schema home | ❌ Sin `Organization` + `WebSite` | SEO_GEO_DEEP_AUDIT_01 T-07 |
| dateModified JSON-LD | ❌ Congelado en datePublished | SEO_GEO_DEEP_AUDIT_01 T-04 |
| Terminología GEO | ❌ Inconsistente entre páginas | SEO_GEO_DEEP_AUDIT_01 G-02 |
| Definición entidad producto | ❌ Sin definición factual citable | SEO_GEO_DEEP_AUDIT_01 G-01 |
| Datos GSC actualizados | ❌ No disponibles en repo | RC-02 riesgo crítico |
| Eventos GA4 conversión SEO | ❌ Sin eventos específicos documentados | SEO_GEO_DEEP_AUDIT_01 sección 16 |
| URL tractora orgánica | `/blog/plantilla-kakebo-excel` — activo principal | GA4 + GSC documentados |
| Segunda URL con tracción real | `/herramientas/calculadora-ahorro` — CTR 35,9% | GSC SEO-AHORRO-CALCULADORA-01 |
| Canibalización kakebo-online | Sin confirmar — pendiente datos GSC | SEO_GEO_DEEP_AUDIT_01 S-01/S-02 |

---

## 3. Principios de priorización

1. **Sin datos, no hay roadmap real.** `SEO-DATA-PRIORITY-01` es el prerrequisito que desbloquea todo el bloque de optimización URL por URL. Ejecutar optimizaciones sin GSC actualizado es trabajar a ciegas.

2. **Proteger antes de optimizar.** La URL `/blog/plantilla-kakebo-excel` es el activo orgánico principal. Cualquier modificación debe ser quirúrgica, aislada y con riesgo explícitamente evaluado.

3. **GEO primero cuando el riesgo es bajo.** Las mejoras GEO de terminología y definición de entidad son cambios editoriales sin impacto en indexación. Pueden ejecutarse sin esperar GSC.

4. **Una tarea, un objetivo, un commit.** No mezclar tipos de tarea en el mismo commit. No optimizar tres URLs en una sola tarea.

5. **No crear contenido sin hueco estratégico confirmado.** Los artículos de respaldo para herramientas esperan hasta después de tener el roadmap de contenido validado con datos.

6. **El enlazado interno va después de definir la función de cada URL.** No enlazar antes de que cada URL tenga su intención claramente definida y estabilizada.

---

## 4. Dependencias entre fases

```
SEO-DATA-PRIORITY-01 (P0)
│
├── SEO-GA4-EVENTS-01 (P0)
│
├── [Desbloquea] Bloque P2: Optimización URL por URL
│   ├── SEO-EXCEL-TITLE-01
│   ├── SEO-KAKEBO-ONLINE-CANIB-01
│   ├── SEO-CALCULADORA-AHORRO-AUDIT-01
│   └── SEO-EXCEL-H3-FIX-01
│
└── [Desbloquea] Bloque P5: Expansión de contenido
    ├── SEO-BLOG-INFLACION-01
    └── SEO-BLOG-503020-01

SEO-GEO-TERMINOLOGY-01 (P1 — no depende de GSC)
│
└── [Habilita] SEO-GEO-ENTITY-DEFINITION-01
    │
    └── [Habilita] SEO-SCHEMA-HOME-01 (con entidad definida)

Bloque P2 (URLs optimizadas)
│
└── [Habilita] Bloque P4: Enlazado interno
    └── SEO-INTERNAL-LINKING-V1-01
```

**Regla**: Ninguna tarea de contenido nuevo (P5) debe iniciarse si los bloques P0, P1 y P2 no están cerrados.

---

## 5. Roadmap por bloques

---

### Bloque P0 — Medición, estabilidad y riesgos críticos

**Objetivo:** Obtener los datos que hacen posible tomar decisiones SEO reales. Sin P0, el resto del roadmap es un plan de intenciones, no de acciones basadas en evidencia.

**Estado:** Ejecutar inmediatamente.

#### P0-01 — `SEO-DATA-PRIORITY-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Snapshot GSC actualizado para todo el sitio |
| **Fase** | P0 |
| **Prioridad** | CRÍTICA — prerequisito de todo lo demás |
| **Impacto esperado** | Habilita decisiones basadas en evidencia real |
| **Riesgo** | Ninguno — solo lectura de datos |
| **Esfuerzo** | Bajo (exportar y documentar) |
| **Dependencia** | Ninguna |
| **URL / Zona** | Todo el sitio |
| **Tipo** | Medición |
| **Acción concreta** | Exportar desde GSC: queries top 100, páginas top 50, CTR por URL, posición media por URL, clics por URL. Documentar snapshot en `docs/seo/GSC_SNAPSHOT_YYYYMMDD.md` |
| **Validación** | Documento con datos numéricos reales de GSC disponible en el repo |
| **Decisión** | **Ejecutar ahora** |

---

#### P0-02 — `SEO-GA4-EVENTS-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Definir y activar eventos GA4 para conversiones SEO clave |
| **Fase** | P0 |
| **Prioridad** | Alta |
| **Impacto esperado** | Permite medir el valor real de cada URL orgánica (no solo clics, sino qué hace el usuario después) |
| **Riesgo** | Bajo (solo añadir eventos, no afecta UI ni SEO) |
| **Esfuerzo** | Bajo-Medio |
| **Dependencia** | GA4 ya integrado (MED-01) |
| **URL / Zona** | GA4 + `GoogleAnalytics.tsx` + blog + herramientas |
| **Tipo** | Medición |
| **Acción concreta** | Definir y documentar eventos a trackear: descarga `.xlsx` (clic en DownloadCTA), clic en SimpleCTA hacia login desde blog, uso de calculadoras (submit), signup completado desde blog. Implementar en los componentes relevantes. |
| **Validación** | Eventos visibles en tiempo real de GA4 al probar las acciones |
| **Decisión** | **Ejecutar ahora** (puede hacerse en paralelo con P0-01) |

---

### Bloque P1 — GEO estructural de bajo riesgo

**Objetivo:** Mejorar la comprensión del sitio por parte de motores generativos sin tocar lo que ya funciona orgánicamente. Estos cambios son editoriales/técnicos de mínimo riesgo y máximo impacto GEO.

**Estado:** Puede iniciarse en paralelo con P0.

#### P1-01 — `SEO-GEO-TERMINOLOGY-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Unificación terminológica — glosario canónico en todo el sitio |
| **Fase** | P1 |
| **Prioridad** | Alta |
| **Impacto esperado** | Coherencia de entidad para motores generativos. Citabilidad en AI Overviews, Perplexity, ChatGPT |
| **Riesgo** | Muy bajo — cambios editoriales en copy, no en estructura |
| **Esfuerzo** | Bajo |
| **Dependencia** | Ninguna (no requiere GSC) |
| **URL / Zona** | Global: artículos clave, herramientas, Home, schema JSON-LD |
| **Tipo** | GEO / semántico |
| **Acción concreta** | (1) Definir glosario canónico: "el método Kakebo" = técnica japonesa 1904; "Kakebo AI" = nombre de marca del producto; "MetodoKakebo.com" = dominio/plataforma; "app Kakebo" = forma coloquial aceptada. (2) Corregir inconsistencia en schema `siteName` ("Kakebo AI" en todas). (3) Resolver inconsistencia de terminología 4 categorías: "Ocio/Vicio" (no "Opcional o Vicio"), "Extras" (no "Extra"). (4) Documentar glosario en `docs/seo/GLOSARIO_TERMINOLOGICO.md` |
| **Validación** | Documento de glosario creado. Inconsistencias en schema corregidas en el código. |
| **Decisión** | **Ejecutar ahora** |

---

#### P1-02 — `SEO-GEO-ENTITY-DEFINITION-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Definición factual citable de método + producto en páginas clave |
| **Fase** | P1 |
| **Prioridad** | Alta |
| **Impacto esperado** | Elegibilidad para Knowledge Panel. Citabilidad directa en respuestas de IA para "qué es el método Kakebo" |
| **Riesgo** | Muy bajo — añadir un párrafo al inicio de páginas existentes |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-GEO-TERMINOLOGY-01` (P1-01) debería ejecutarse antes para tener el glosario canónico |
| **URL / Zona** | `/blog/metodo-kakebo-guia-definitiva` (primer párrafo) y `/sobre-nosotros` o sección de Home |
| **Tipo** | GEO / contenido editorial |
| **Acción concreta** | Añadir en `metodo-kakebo-guia-definitiva` un primer párrafo con: "El Kakebo (家計簿) es un método de registro de finanzas personales creado en 1904 por la periodista japonesa Motoko Hani. Consiste en registrar y categorizar todos los gastos en cuatro grupos (Supervivencia, Ocio/Vicio, Cultura y Extras) y reflexionar mensualmente sobre el patrón de gasto. MetodoKakebo.com es una aplicación gratuita basada en este método." Máximo 3-4 frases, al inicio del artículo. |
| **Validación** | El párrafo es legible sin contexto previo y responde a "qué es el método Kakebo" de forma directa y factual |
| **Decisión** | **Ejecutar** (tras P1-01) |

---

#### P1-03 — `SEO-SCHEMA-HOME-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Añadir schema `Organization` + `WebSite` con SearchAction a la Home |
| **Fase** | P1 |
| **Prioridad** | Alta |
| **Impacto esperado** | Elegibilidad para sitelinks de búsqueda. Señal de entidad para Google. Autoridad de marca |
| **Riesgo** | Muy bajo — añadir JSON-LD a `page.tsx` de la home, sin tocar UI |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-GEO-TERMINOLOGY-01` (para usar el nombre canónico de la organización en el schema) |
| **URL / Zona** | `/` — `src/app/[locale]/(public)/page.tsx` |
| **Tipo** | Técnico / GEO |
| **Acción concreta** | Añadir bloque `<script type="application/ld+json">` con: `Organization` (name: "Kakebo AI", url, sameAs si hay redes sociales, description factual) + `WebSite` (name, url, `SearchAction` con `query-input`) |
| **Validación** | Schema válido en Google Rich Results Test. No errores en Search Console |
| **Decisión** | **Ejecutar** (tras P1-01) |

---

#### P1-04 — `SEO-TECHNICAL-DATEMODIFIED-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Campo `updatedDate` en frontmatter + `dateModified` real en JSON-LD y sitemap |
| **Fase** | P1 |
| **Prioridad** | Media |
| **Impacto esperado** | Señal de frescura para Google y motores generativos. Mejora crawl prioritario post-actualización |
| **Riesgo** | Muy bajo — añadir campo opcional al frontmatter y actualizar lógica de sitemap/page |
| **Esfuerzo** | Bajo |
| **Dependencia** | Ninguna |
| **URL / Zona** | Todos los artículos `.es.mdx` + `sitemap.ts` + `blog/[slug]/page.tsx` |
| **Tipo** | Técnico |
| **Acción concreta** | (1) Añadir campo `updatedDate` (opcional) al frontmatter de artículos. (2) En `blog/[slug]/page.tsx`: usar `post.frontmatter.updatedDate || post.frontmatter.date` en `dateModified` del JSON-LD. (3) En `sitemap.ts`: usar `updatedDate || date` en `lastModified` de blog posts. (4) Actualizar `plantilla-kakebo-excel.es.mdx` con `updatedDate: '2026-06-30'` (ha tenido múltiples cambios). |
| **Validación** | JSON-LD de `plantilla-kakebo-excel` muestra `dateModified` distinto de `datePublished` en producción |
| **Decisión** | **Ejecutar** |

---

### Bloque P2 — Optimización URL por URL

**Objetivo:** Optimizar cada URL importante individualmente con intención clara, basándose en datos GSC reales.

**Estado:** BLOQUEADO hasta tener `SEO-DATA-PRIORITY-01` completado.

**Regla:** No iniciar ninguna tarea de este bloque sin el snapshot GSC del sitio completo. El orden dentro del bloque puede ajustarse según los datos.

#### P2-01 — `SEO-EXCEL-TITLE-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Reducir meta title de `plantilla-kakebo-excel` a menos de 65 chars |
| **Fase** | P2 |
| **Prioridad** | Alta |
| **Impacto esperado** | Mejora de CTR en la URL con mayor tracción orgánica. Meta title actual ~93 chars se trunca en SERP |
| **Riesgo** | Bajo — solo reducir longitud preservando keywords exactas |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-DATA-PRIORITY-01` (confirmar que es la URL con más clics) |
| **URL / Zona** | `/blog/plantilla-kakebo-excel` — frontmatter `title` |
| **Tipo** | SEO técnico / CTR |
| **Acción concreta** | Reformular el `title` del frontmatter en <65 chars preservando "plantilla kakebo excel gratis" como keyword exacta. Ejemplo: `"Plantilla Kakebo Excel Gratis 2026: Guía y Descarga"` (52 chars). No cambiar H1 (que sigue usando el title). No cambiar slug. |
| **Validación** | Meta title visible en SERP sin truncación. Google Search Console confirma cambio tras 2-4 semanas |
| **Decisión** | **Ejecutar tras GSC** |

---

#### P2-02 — `SEO-EXCEL-H3-FIX-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Convertir H3 inicial en H2 en `plantilla-kakebo-excel` |
| **Fase** | P2 |
| **Prioridad** | Media |
| **Impacto esperado** | Corrección de jerarquía de headings (H3 antes de primer H2). Mejora elegibilidad para featured snippets de lista |
| **Riesgo** | Muy bajo — cambio de una sola etiqueta de heading |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-DATA-PRIORITY-01` (ejecutar junto a P2-01) |
| **URL / Zona** | `/blog/plantilla-kakebo-excel` — sección "¿Qué incluye la plantilla Kakebo Excel gratuita?" |
| **Tipo** | SEO técnico / semántico |
| **Acción concreta** | Cambiar `### ¿Qué incluye la plantilla Kakebo Excel gratuita?` por `## ¿Qué incluye la plantilla Kakebo Excel gratuita?` |
| **Validación** | La jerarquía H1→H2→H3 es correcta en el DOM renderizado |
| **Decisión** | **Ejecutar junto con P2-01** |

---

#### P2-03 — `SEO-KAKEBO-ONLINE-CANIB-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Auditar y resolver canibalización entre `kakebo-online-gratis` y `kakebo-online-guia-completa` |
| **Fase** | P2 |
| **Prioridad** | Alta |
| **Impacto esperado** | Consolidar autoridad del cluster "kakebo online" en las URLs correctas. Evitar que Google alterne entre ellas para las mismas queries |
| **Riesgo** | Medio — cualquier cambio de intención puede afectar posicionamiento existente |
| **Esfuerzo** | Bajo (si es solo diferenciación de metadatos) / Medio (si requiere ajuste de contenido) |
| **Dependencia** | `SEO-DATA-PRIORITY-01` — sin datos GSC no se puede confirmar si la canibalización es real |
| **URL / Zona** | `/blog/kakebo-online-gratis` + `/blog/kakebo-online-guia-completa` |
| **Tipo** | SEO semántico |
| **Acción concreta** | (1) Revisar en GSC qué queries van a cada URL. (2) Si se confirma solapamiento: diferenciar `kakebo-online-gratis` como landing de captación de producto (metadatos y H1 orientados a la app) y `kakebo-online-guia-completa` como artículo informacional del método digital (metadatos y H1 orientados al cómo/por qué). (3) Revisar si Home también compite por las mismas queries. |
| **Validación** | Cada URL tiene queries diferentes y sin solapamiento según GSC |
| **Decisión** | **Bloquear hasta tener GSC** |

---

#### P2-04 — `SEO-CALCULADORA-AHORRO-AUDIT-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Auditoría detallada de `calculadora-ahorro` — entender el CTR anómalo del 35,9% |
| **Fase** | P2 |
| **Prioridad** | Media |
| **Impacto esperado** | Identificar qué hace que esta URL tenga CTR excepcional y replicar el patrón en otras herramientas |
| **Riesgo** | Ninguno — solo auditoría |
| **Esfuerzo** | Bajo |
| **Dependencia** | `SEO-DATA-PRIORITY-01` (datos actualizados para confirmar el CTR) |
| **URL / Zona** | `/herramientas/calculadora-ahorro` |
| **Tipo** | SEO técnico / medición |
| **Acción concreta** | Revisar en GSC: queries exactas que generan ese CTR, posición media, dispositivo, país. Crear documento `docs/seo/CALCULADORA_AHORRO_AUDIT_01.md` con hallazgos |
| **Validación** | Documento con hipótesis sobre por qué el CTR es tan alto |
| **Decisión** | **Bloquear hasta tener GSC** |

---

#### P2-05 — `SEO-HREFLANG-KAKEBO-ONLINE-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Verificar y corregir hreflang de `kakebo-online-guia-completa` con slug EN diferente |
| **Fase** | P2 |
| **Prioridad** | Media |
| **Impacto esperado** | Evitar que Google ignore las señales hreflang del par ES↔EN por URL EN incorrecta |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Dependencia** | Ninguna técnica, pero lógicamente va con P2-03 |
| **URL / Zona** | `/blog/kakebo-online-guia-completa` — hreflang EN apunta a `/en/blog/kakebo-online-guia-completa` pero el archivo `.en.mdx` puede tener slug `kakebo-online-complete-guide` |
| **Tipo** | SEO técnico |
| **Acción concreta** | Verificar existencia de ambos archivos. Si el slug EN es diferente, corregir el hreflang en `page.tsx` o estandarizar los slugs. Comprobar también en Search Console si hay errores de hreflang |
| **Validación** | Sin errores de hreflang en GSC para esta URL |
| **Decisión** | **Ejecutar** (no requiere GSC) |

---

#### P2-06 — `SEO-EXCEL-EN-VALIDATE-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Validar si versión EN de `plantilla-kakebo-excel` interfiere con posicionamiento ES |
| **Fase** | P2 |
| **Prioridad** | Baja |
| **Impacto esperado** | Confirmar o descartar interferencia EN→ES en la URL de mayor tracción |
| **Riesgo** | Ninguno — solo análisis de datos |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-DATA-PRIORITY-01` |
| **URL / Zona** | `/en/blog/plantilla-kakebo-excel` vs `/blog/plantilla-kakebo-excel` |
| **Tipo** | SEO técnico / i18n |
| **Acción concreta** | En GSC: comparar señales de ambas URLs. Si EN tiene más autoridad que ES para queries en español, crear tarea específica de corrección (análogo a SEO-I18N-KAKEBO-ONLINE-VALIDATE-01) |
| **Validación** | Documento con conclusión clara: interferencia confirmada / descartada |
| **Decisión** | **Bloquear hasta tener GSC** |

---

#### P2-07 — `SEO-TECHNICAL-TUTORIAL-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Auditar `/tutorial` para thin content y prioridad en sitemap |
| **Fase** | P2 |
| **Prioridad** | Baja |
| **Impacto esperado** | Evitar que página de onboarding app desperdicie crawl budget a prioridad 0.8 |
| **Riesgo** | Ninguno — solo auditoría |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | Ninguna |
| **URL / Zona** | `/tutorial` |
| **Tipo** | SEO técnico |
| **Acción concreta** | Revisar contenido de `/tutorial`. Si es thin content o solo funcional para usuarios autenticados, reducir prioridad en sitemap a 0.3 o añadir `noindex` |
| **Validación** | Decisión documentada sobre la indexabilidad de la página |
| **Decisión** | **Ejecutar** (no requiere GSC) |

---

#### P2-08 — `SEO-GEO-SOBRE-NOSOTROS-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Auditar `/sobre-nosotros` para GEO y E-E-A-T |
| **Fase** | P2 |
| **Prioridad** | Baja |
| **Impacto esperado** | Fortalecer señal de E-E-A-T y entidad de marca para Google y motores generativos |
| **Riesgo** | Ninguno — solo auditoría |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-GEO-TERMINOLOGY-01` (para saber el lenguaje canónico a usar) |
| **URL / Zona** | `/sobre-nosotros` |
| **Tipo** | GEO / E-E-A-T |
| **Acción concreta** | Leer el contenido de `/sobre-nosotros`. Evaluar si incluye: quiénes somos, por qué creamos el producto, experiencia en finanzas personales. Crear tarea de mejora si falta información factual |
| **Validación** | Documento con evaluación de E-E-A-T de la página |
| **Decisión** | **Ejecutar** (no requiere GSC) |

---

### Bloque P3 — Schema y datos estructurados

**Objetivo:** Completar y sincronizar el sistema de schemas para mejorar la elegibilidad de rich results y la coherencia GEO.

**Estado:** Puede iniciarse en paralelo con P2 (no requiere GSC para los items de sincronización).

#### P3-01 — `SEO-TECHNICAL-SITEMAP-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Corregir sitemap: añadir hub herramientas, bajar prioridad login, mejorar lastModified core routes |
| **Fase** | P3 |
| **Prioridad** | Media |
| **Impacto esperado** | Crawl budget optimizado. Hub herramientas recibe señal de indexación |
| **Riesgo** | Muy bajo |
| **Esfuerzo** | Bajo |
| **Dependencia** | Ninguna |
| **URL / Zona** | `src/app/sitemap.ts` |
| **Tipo** | SEO técnico |
| **Acción concreta** | (1) Añadir `/herramientas` a `coreRoutes` con `priority: 0.7`. (2) Reducir prioridad de `/login` a `0.1`. (3) Para páginas estables (privacy, terms, cookies, sobre-nosotros), usar fechas fijas en `lastModified` en lugar de `new Date()`. |
| **Validación** | `sitemap.xml` incluye `/herramientas`. `/login` aparece con priority 0.1. |
| **Decisión** | **Ejecutar** |

---

#### P3-02 — `SEO-SCHEMA-AHORRO-SYNC-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Actualizar schema `calculadora-ahorro` para alinear con contenido optimizado |
| **Fase** | P3 |
| **Prioridad** | Baja |
| **Impacto esperado** | Coherencia entre schema (datos estructurados) y contenido visible. Mejor citabilidad GEO |
| **Riesgo** | Muy bajo |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | `SEO-GEO-TERMINOLOGY-01` (para usar nombre canónico) |
| **URL / Zona** | `/herramientas/calculadora-ahorro` — `SCHEMA` en `page.tsx` |
| **Tipo** | Técnico / GEO |
| **Acción concreta** | Actualizar `SCHEMA.name` de "Calculadora de Ahorro Kakebo" a "Calculadora de Ahorro Mensual". Actualizar `SCHEMA.description` para reflejar "cuánto ahorrar al mes" en lugar de "distribuir tu nómina mensual". Actualizar terminología "Opcional o Vicio" → "Ocio/Vicio" en `FAQ_SCHEMA`. |
| **Validación** | Schema del JSON-LD alineado con H1 y contenido visible de la página |
| **Decisión** | **Ejecutar** (tras P1-01) |

---

#### P3-03 — `SEO-SCHEMA-BLOG-INDEX-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Añadir schema `CollectionPage` o `ItemList` al blog index |
| **Fase** | P3 |
| **Prioridad** | Baja |
| **Impacto esperado** | Elegibilidad para rich snippets de tipo lista de artículos |
| **Riesgo** | Muy bajo |
| **Esfuerzo** | Bajo |
| **Dependencia** | Ninguna |
| **URL / Zona** | `/blog` — `src/app/[locale]/(public)/blog/page.tsx` |
| **Tipo** | Técnico / GEO |
| **Acción concreta** | Añadir `ItemList` con los artículos más relevantes del blog o `CollectionPage` con el número de items |
| **Validación** | Schema válido en Google Rich Results Test |
| **Decisión** | **Ejecutar** (P3, no urgente) |

---

### Bloque P4 — Enlazado interno

**Objetivo:** Conectar el sitio cuando cada URL ya tenga su función bien definida. No enlazar antes de que la arquitectura esté estabilizada.

**Estado:** BLOQUEADO hasta completar P0 y al menos las optimizaciones críticas de P2.

#### P4-01 — `SEO-EXCEL-INTERNAL-LINKS-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Enlazado saliente desde `plantilla-kakebo-excel` hacia herramientas estratégicas |
| **Fase** | P4 |
| **Prioridad** | Media |
| **Impacto esperado** | Distribución de autoridad desde la URL tractora hacia herramientas. Mejora de engagement |
| **Riesgo** | Muy bajo |
| **Esfuerzo** | Muy bajo |
| **Dependencia** | P2 estabilizado — herramientas optimizadas y con intención definida |
| **URL / Zona** | `/blog/plantilla-kakebo-excel` → herramientas |
| **Tipo** | Enlazado |
| **Acción concreta** | Añadir link textual a `/herramientas/regla-50-30-20` en la sección "Pestaña de Previsión" (al mencionar el 20% de ahorro). Añadir segundo link a `/herramientas/calculadora-ahorro` en el body (no solo en FAQ). Anchor text natural. |
| **Validación** | Links funcionan. No introducen keyword stuffing |
| **Decisión** | **Bloquear hasta P2 estabilizado** |

---

#### P4-02 — `SEO-EXCEL-INBOUND-PILAR-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Enlazado entrante hacia `plantilla-kakebo-excel` desde artículos relacionados |
| **Fase** | P4 |
| **Prioridad** | Media |
| **Impacto esperado** | Refuerza la autoridad de la URL tractora desde el resto del blog |
| **Riesgo** | Muy bajo |
| **Esfuerzo** | Bajo |
| **Dependencia** | P2 — artículos origen deben tener su función definida |
| **URL / Zona** | `/blog/como-hacer-un-presupuesto-personal`, `/blog/kakebo-online-gratis`, `/blog/metodo-kakebo-guia-definitiva` → `/blog/plantilla-kakebo-excel` |
| **Tipo** | Enlazado |
| **Acción concreta** | Añadir link textual en contexto natural desde los tres artículos mencionados. El link debe fluir orgánicamente desde el tema del artículo origen |
| **Validación** | Links presentes y naturales. No sobreoptimizados |
| **Decisión** | **Bloquear hasta P2 estabilizado** |

---

#### P4-03 — `SEO-INTERNAL-LINKING-V1-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Mapa y ejecución de enlazado interno estructural completo |
| **Fase** | P4 |
| **Prioridad** | Alta (pero tardía en secuencia) |
| **Impacto esperado** | Autoridad distribuida correctamente entre URLs. Cluster Kakebo Core con hub bien conectado |
| **Riesgo** | Medio (si se hace antes de definir bien cada URL) |
| **Esfuerzo** | Medio |
| **Dependencia** | P2 completado — cada URL con función definida y metadatos estabilizados |
| **URL / Zona** | Todo el sitio — hub→clusters→herramientas |
| **Tipo** | Enlazado |
| **Acción concreta** | Crear `docs/seo/INTERNAL_LINKING_MAP_V1.md` con el mapa de enlaces. Ejecutar cambios URL por URL, un commit por URL |
| **Validación** | Cada URL recibe al menos 2-3 links contextuales desde páginas relevantes |
| **Decisión** | **Bloquear hasta P2 completado** |

---

### Bloque P5 — Expansión de contenido

**Objetivo:** Crear contenido nuevo solo donde existe un hueco estratégico real confirmado por datos.

**Estado:** BLOQUEADO hasta completar P0 (datos GSC) y P4 (enlazado).

#### P5-01 — `SEO-BLOG-INFLACION-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Crear artículo editorial de respaldo para `calculadora-inflacion` |
| **Fase** | P5 |
| **Prioridad** | Alta (cuando se desbloquee) |
| **Impacto esperado** | Doblar presencia en SERP para el cluster inflación. Capturar tráfico informacional |
| **Riesgo** | Ninguno — URL nueva |
| **Esfuerzo** | Medio |
| **Dependencia** | P0 (confirmar volumen de búsqueda), P4 (tener estructura de enlazado lista) |
| **URL / Zona** | `/blog/inflacion-y-ahorros` (URL nueva) → enlaza a `/herramientas/calculadora-inflacion` |
| **Tipo** | Contenido |
| **Acción concreta** | Artículo sobre "cómo afecta la inflación a tus ahorros" con definición factual, ejemplos numéricos y CTA a la calculadora. FAQPage JSON-LD. |
| **Validación** | Artículo indexado. Primera posición en GSC para queries informacionales de inflación dentro de 8-12 semanas |
| **Decisión** | **Bloquear hasta P0 + P4** |

---

#### P5-02 — `SEO-BLOG-503020-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Crear artículo editorial de respaldo para `regla-50-30-20` |
| **Fase** | P5 |
| **Prioridad** | Alta (cuando se desbloquee) |
| **Impacto esperado** | Doblar presencia en SERP para el cluster 50/30/20 |
| **Riesgo** | Ninguno — URL nueva |
| **Esfuerzo** | Medio |
| **Dependencia** | P0 (confirmar volumen), P4 (enlazado) |
| **URL / Zona** | `/blog/regla-50-30-20` (URL nueva) → enlaza a `/herramientas/regla-50-30-20` |
| **Tipo** | Contenido |
| **Acción concreta** | Artículo explicando qué es la regla 50/30/20, cómo aplicarla, con tabla ejemplo y CTA a la calculadora |
| **Validación** | Indexado. Impresiones en GSC dentro de 4-8 semanas |
| **Decisión** | **Bloquear hasta P0 + P4** |

---

### Bloque P6 — Medición iterativa

**Objetivo:** Revisar impacto de los cambios aplicados y ajustar prioridades.

**Estado:** Continuo — activar después de cada bloque completado.

#### P6-01 — `SEO-MEDICION-ITERATIVA-01`

| Campo | Detalle |
|---|---|
| **Nombre** | Revisión iterativa de GSC + GA4 tras cada bloque completado |
| **Fase** | P6 |
| **Prioridad** | Permanente |
| **Impacto esperado** | Detección temprana de regresiones y confirmación de mejoras |
| **Riesgo** | Ninguno |
| **Esfuerzo** | Bajo (30-60 min por revisión) |
| **Dependencia** | `SEO-GA4-EVENTS-01` completado (P0-02) |
| **URL / Zona** | Todo el sitio |
| **Tipo** | Medición |
| **Acción concreta** | Snapshot GSC cada 4 semanas. Comparar CTR, posición, clics por URL afectada. Documentar en `docs/seo/GSC_SNAPSHOT_YYYYMMDD.md` |
| **Validación** | Documento de snapshot actualizado con comentario de cambios vs. anterior |
| **Decisión** | **Ejecutar de forma continua desde P0** |

---

## 6. Tabla maestra de tareas

| ID | Nombre | Fase | Prioridad | Impacto | Riesgo | Esfuerzo | Dependencia | URL / Zona | Tipo | Decisión |
|---|---|---|---|---|---|---|---|---|---|---|
| `SEO-DATA-PRIORITY-01` | Snapshot GSC completo | P0 | Crítica | Alto | Ninguno | Bajo | Ninguna | Todo el sitio | Medición | **Ejecutar ahora** |
| `SEO-GA4-EVENTS-01` | Eventos GA4 conversiones SEO | P0 | Alta | Alto | Bajo | Bajo-Medio | GA4 integrado | Blog + herramientas | Medición | **Ejecutar ahora** |
| `SEO-GEO-TERMINOLOGY-01` | Glosario canónico + siteName + categorías | P1 | Alta | Alto | Muy bajo | Bajo | Ninguna | Global | GEO / técnico | **Ejecutar ahora** |
| `SEO-GEO-ENTITY-DEFINITION-01` | Definición factual método + producto | P1 | Alta | Alto | Muy bajo | Muy bajo | P1-01 | `metodo-kakebo-guia-definitiva` + `sobre-nosotros` | GEO / contenido | **Ejecutar** (tras P1-01) |
| `SEO-SCHEMA-HOME-01` | Schema Organization + WebSite Home | P1 | Alta | Medio-Alto | Muy bajo | Muy bajo | P1-01 | `/` | Técnico / GEO | **Ejecutar** (tras P1-01) |
| `SEO-TECHNICAL-DATEMODIFIED-01` | updatedDate + dateModified real | P1 | Media | Medio | Muy bajo | Bajo | Ninguna | Todos los posts + sitemap | Técnico | **Ejecutar** |
| `SEO-EXCEL-TITLE-01` | Meta title <65 chars | P2 | Alta | Alto | Bajo | Muy bajo | GSC | `/blog/plantilla-kakebo-excel` | SEO técnico / CTR | **Tras GSC** |
| `SEO-EXCEL-H3-FIX-01` | H3→H2 en primer heading | P2 | Media | Medio | Muy bajo | Muy bajo | GSC | `/blog/plantilla-kakebo-excel` | SEO semántico | **Junto a P2-01** |
| `SEO-KAKEBO-ONLINE-CANIB-01` | Auditar canibalización kakebo-online | P2 | Alta | Alto | Medio | Bajo-Medio | GSC | kakebo-online-gratis + guia-completa | SEO semántico | **Tras GSC** |
| `SEO-CALCULADORA-AHORRO-AUDIT-01` | Auditoría CTR anómalo calculadora | P2 | Media | Medio | Ninguno | Bajo | GSC | `/herramientas/calculadora-ahorro` | Medición | **Tras GSC** |
| `SEO-HREFLANG-KAKEBO-ONLINE-01` | Verificar hreflang guia-completa | P2 | Media | Medio | Bajo | Bajo | Ninguna | `/blog/kakebo-online-guia-completa` | Técnico | **Ejecutar** |
| `SEO-EXCEL-EN-VALIDATE-01` | Validar interferencia EN en plantilla-excel | P2 | Baja | Medio | Ninguno | Muy bajo | GSC | `/en/blog/plantilla-kakebo-excel` | SEO técnico / i18n | **Tras GSC** |
| `SEO-TECHNICAL-TUTORIAL-01` | Auditar `/tutorial` thin content | P2 | Baja | Bajo | Ninguno | Muy bajo | Ninguna | `/tutorial` | SEO técnico | **Ejecutar** |
| `SEO-GEO-SOBRE-NOSOTROS-01` | Auditar sobre-nosotros para GEO | P2 | Baja | Medio | Ninguno | Muy bajo | P1-01 | `/sobre-nosotros` | GEO / E-E-A-T | **Ejecutar** (tras P1-01) |
| `SEO-TECHNICAL-SITEMAP-01` | Corregir sitemap (hub, login, lastModified) | P3 | Media | Medio | Muy bajo | Bajo | Ninguna | `sitemap.ts` | Técnico | **Ejecutar** |
| `SEO-SCHEMA-AHORRO-SYNC-01` | Sincronizar schema calculadora-ahorro | P3 | Baja | Bajo | Muy bajo | Muy bajo | P1-01 | `calculadora-ahorro/page.tsx` | Técnico / GEO | **Ejecutar** (tras P1-01) |
| `SEO-SCHEMA-BLOG-INDEX-01` | Schema CollectionPage blog index | P3 | Baja | Bajo | Muy bajo | Bajo | Ninguna | `/blog` | Técnico / GEO | **Ejecutar** |
| `SEO-EXCEL-INTERNAL-LINKS-01` | Enlazado saliente desde plantilla-excel | P4 | Media | Medio | Muy bajo | Muy bajo | P2 estabilizado | `/blog/plantilla-kakebo-excel` | Enlazado | **Tras P2** |
| `SEO-EXCEL-INBOUND-PILAR-01` | Enlazado entrante hacia plantilla-excel | P4 | Media | Medio | Muy bajo | Bajo | P2 estabilizado | 3 artículos → plantilla-excel | Enlazado | **Tras P2** |
| `SEO-INTERNAL-LINKING-V1-01` | Enlazado interno estructural completo | P4 | Alta | Alto | Medio | Medio | P2 completado | Todo el sitio | Enlazado | **Tras P2** |
| `SEO-EXCEL-FAQ-FRONTMATTER-01` | FAQ pareja al frontmatter de plantilla-excel | P4 | Baja | Bajo | Ninguno | Muy bajo | P2 | `/blog/plantilla-kakebo-excel` | GEO | **Tras P2** |
| `SEO-EXCEL-CTA-REORDER-01` | Mover SimpleCTA al final del artículo | P4 | Baja | Bajo | Muy bajo | Muy bajo | P2 | `/blog/plantilla-kakebo-excel` | Conversión | **Tras P2** |
| `SEO-BLOG-INFLACION-01` | Artículo respaldo calculadora-inflacion | P5 | Alta | Alto | Ninguno | Medio | P0 + P4 | `/blog/inflacion-y-ahorros` (nueva) | Contenido | **Tras P0 + P4** |
| `SEO-BLOG-503020-01` | Artículo respaldo regla-50-30-20 | P5 | Alta | Alto | Ninguno | Medio | P0 + P4 | `/blog/regla-50-30-20` (nueva) | Contenido | **Tras P0 + P4** |
| `SEO-GEO-AUTHORSHIP-01` | Bio de autor con credenciales financieras | P6 | Baja | Medio | Ninguno | Medio | Ninguna | Blog posts / sobre-nosotros | GEO / E-E-A-T | **Revisar luego** |
| `SEO-GEO-FAQ-PAGE-01` | Página /faq global del sitio | P6 | Baja | Bajo | Ninguno | Medio | P5 | `/faq` (nueva) | GEO | **Revisar luego** |
| `SEO-MEDICION-ITERATIVA-01` | Revisión iterativa GSC + GA4 | P6 | Permanente | Alto | Ninguno | Bajo | P0-02 | Todo el sitio | Medición | **Continuo** |

---

## 7. Próximas 5 tareas recomendadas en orden estricto

**Estas 5 tareas pueden ejecutarse con la información actual, sin esperar datos GSC externos.**

### Tarea 1 — `SEO-DATA-PRIORITY-01`

**Qué:** Exportar snapshot completo de Google Search Console.  
**Por qué primero:** Sin este dato, las decisiones de optimización URL por URL son estimaciones. Bloquea el 60% del roadmap.  
**Cuándo:** Esta semana.  
**Entregable:** `docs/seo/GSC_SNAPSHOT_YYYYMMDD.md` con queries, páginas, CTR, posición y clics reales.

---

### Tarea 2 — `SEO-GEO-TERMINOLOGY-01`

**Qué:** Unificar terminología en todo el sitio. Crear glosario canónico. Corregir `siteName` inconsistente. Corregir terminología de 4 categorías Kakebo en schemas.  
**Por qué segundo:** No requiere datos GSC. Alto impacto GEO y coherencia de entidad. Bajo riesgo. Habilita las tareas GEO siguientes.  
**Cuándo:** Esta semana, en paralelo con Tarea 1.  
**Entregable:** `docs/seo/GLOSARIO_TERMINOLOGICO.md` + correcciones de `siteName` y terminología en código.

---

### Tarea 3 — `SEO-GEO-ENTITY-DEFINITION-01`

**Qué:** Añadir párrafo de definición factual del método Kakebo y del producto MetodoKakebo.com al inicio de `metodo-kakebo-guia-definitiva`.  
**Por qué tercero:** Depende de tener el glosario (Tarea 2). Máximo impacto GEO con mínimo esfuerzo. Habilita la citabilidad del sitio por motores generativos.  
**Cuándo:** Inmediatamente después de Tarea 2.  
**Entregable:** Primer párrafo actualizado en `metodo-kakebo-guia-definitiva`.

---

### Tarea 4 — `SEO-SCHEMA-HOME-01`

**Qué:** Añadir schema `Organization` + `WebSite` con SearchAction a la Home.  
**Por qué cuarto:** Requiere tener definida la entidad (Tarea 3). Bajo riesgo, alto impacto en elegibilidad para sitelinks y señal de marca.  
**Cuándo:** Inmediatamente después de Tarea 3.  
**Entregable:** JSON-LD en `/(public)/page.tsx`. Validado en Rich Results Test.

---

### Tarea 5 — `SEO-TECHNICAL-DATEMODIFIED-01`

**Qué:** Añadir campo `updatedDate` al frontmatter de artículos. Usar en `dateModified` del JSON-LD y `lastModified` del sitemap.  
**Por qué quinto:** No requiere datos GSC. Mejora señal de frescura para todos los artículos. Esfuerzo mínimo, impacto acumulado en todos los posts.  
**Cuándo:** Puede hacerse en paralelo con Tareas 2-4.  
**Entregable:** Cambios en `blog/[slug]/page.tsx` + `sitemap.ts` + `updatedDate: '2026-06-30'` en `plantilla-kakebo-excel.es.mdx`.

---

## 8. Tareas que NO deben hacerse todavía

| Tarea | Razón para esperar |
|---|---|
| Cambiar slug de cualquier URL del blog | Riesgo de perder posicionamiento histórico — solo con datos GSC claros |
| Enlazado interno masivo (`SEO-INTERNAL-LINKING-V1-01`) | Va después de que cada URL tenga su función definida (post P2) |
| Crear artículos de blog nuevos (`SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`) | Requieren datos GSC + enlazado estructurado previo |
| Modificar agresivamente `/blog/plantilla-kakebo-excel` | Es el activo orgánico principal — solo cambios quirúrgicos uno a uno |
| Tocar el legacy EN | Política DOC-I18N-01 activa — sin auditoría específica y datos |
| Crear página `/faq` global | P6 — baja urgencia, requiere tener el resto del contenido estabilizado |
| Cambiar el H1 de ninguna URL | Solo si hay evidencia de que el H1 actual perjudica la intención |
| Fusionar `kakebo-online-gratis` y `kakebo-online-guia-completa` | Solo si GSC confirma canibalización real — merging tiene riesgo de 301 |

---

## 9. URLs que deben protegerse

Estas URLs tienen tracción real o función crítica y no deben modificarse de forma agresiva:

| URL | Razón | Restricción |
|---|---|---|
| `/blog/plantilla-kakebo-excel` | Principal activo orgánico del sitio | Solo cambios quirúrgicos: title (P2-01), H3→H2 (P2-02), links salientes (P4-01). No cambiar slug, H1, estructura narrativa, schema SoftwareApplication, hreflang ni canonical |
| `/herramientas/calculadora-ahorro` | CTR 35,9% — señal de alineación excepcional | No cambiar contenido hasta entender qué genera ese CTR (P2-04) |
| `/blog/como-hacer-un-presupuesto-personal` | Artículo pilar reciente — necesita madurar | No optimizar hasta tener primeros datos GSC (8+ semanas post-publicación) |

---

## 10. URLs que deben auditarse antes de tocarse

Estas URLs necesitan una auditoría específica antes de cualquier modificación:

| URL | Tipo de auditoría necesaria | Tarea |
|---|---|---|
| `/blog/kakebo-online-gratis` + `/blog/kakebo-online-guia-completa` | Canibalización con datos GSC reales | `SEO-KAKEBO-ONLINE-CANIB-01` |
| `/herramientas/calculadora-ahorro` | Análisis de CTR anómalo para entender el patrón | `SEO-CALCULADORA-AHORRO-AUDIT-01` |
| `/tutorial` | Thin content / indexabilidad | `SEO-TECHNICAL-TUTORIAL-01` |
| `/sobre-nosotros` | E-E-A-T y GEO | `SEO-GEO-SOBRE-NOSOTROS-01` |
| `/en/blog/plantilla-kakebo-excel` | Interferencia EN→ES en URL tractora | `SEO-EXCEL-EN-VALIDATE-01` |

---

## 11. Hipótesis de medición

Estas hipótesis deben validarse con datos GSC/GA4 tras aplicar los cambios:

| Hipótesis | Cambio que la genera | Ventana de validación |
|---|---|---|
| Reducir meta title de `plantilla-kakebo-excel` a <65 chars aumenta CTR | `SEO-EXCEL-TITLE-01` | 3-5 semanas post-deploy |
| Añadir schema `Organization` + `WebSite` a Home activa sitelinks de búsqueda | `SEO-SCHEMA-HOME-01` | 4-8 semanas |
| Unificar terminología GEO mejora citabilidad en AI Overviews | `SEO-GEO-TERMINOLOGY-01` | Difícil de medir directo — vigilar apariciones en AI Overviews |
| `como-hacer-un-presupuesto-personal` genera primeras impresiones | — | 4-8 semanas desde publicación (2026-06-22) → revisar agosto 2026 |
| El CTR anómalo de `calculadora-ahorro` es reproducible con artículo editorial | `SEO-BLOG-INFLACION-01` / `SEO-BLOG-503020-01` | 8-12 semanas post-publicación artículos |
| La canibalización kakebo-online está activa y Google alterna entre ambas URLs | — | Confirmar con snapshot GSC en P0 |

---

## 12. Ventanas de revisión recomendadas

| Ventana | Qué revisar | Acción |
|---|---|---|
| **Inmediata (esta semana)** | GSC snapshot + iniciar P1 GEO | Ejecutar P0-01 + P1-01 |
| **2 semanas** | Confirmar indexación de cambios GEO (P1) | Verificar en GSC que las páginas modificadas no tienen errores |
| **4 semanas** | Primeras señales de CTR post-title fix de `plantilla-kakebo-excel` (si P2-01 ya ejecutado) | Comparar CTR vs. snapshot P0 |
| **6-8 semanas** | Primeras impresiones de `como-hacer-un-presupuesto-personal` | Decidir si merece P1 de enlazado |
| **8 semanas** | Revisar si canibalización kakebo-online se ha resuelto o agravado | Ejecutar `SEO-KAKEBO-ONLINE-CANIB-01` si no se hizo antes |
| **12 semanas** | Revisión completa del roadmap — actualizar `SEO_ROADMAP_V1.md` | Crear `SEO_ROADMAP_V2.md` basado en datos reales |

---

## 13. Conclusión

El sitio está en un punto de inflexión: la base técnica está sólida y la URL tractora funciona. El riesgo principal no es técnico sino estratégico: **dependencia de una sola URL y ausencia de datos reales para tomar decisiones**.

El roadmap está diseñado para resolver exactamente eso:
1. Obtener los datos (P0) que permiten priorizar con evidencia
2. Mejorar la comprensión del sitio por motores generativos (P1) mientras llegan los datos
3. Optimizar URL por URL con criterio una vez que el contexto está claro (P2-P4)
4. Crear contenido solo donde hay un hueco real confirmado (P5)

El principal error a evitar es saltarse la secuencia: crear artículos antes de tener el enlazado definido, o hacer enlazado antes de tener las URLs bien orientadas, o hacer contenido nuevo antes de tener GSC. El plan es claro: **orden antes que velocidad**.

**Próxima tarea ejecutable:** `SEO-DATA-PRIORITY-01` — exportar snapshot GSC y documentarlo en el repo.

---

*SEO_ROADMAP_V1.md — 2026-06-30*  
*26 tareas priorizadas en 7 bloques · 5 tareas ejecutables inmediatamente · 12 bloqueadas hasta GSC*  
*Sin cambios en código, contenido ni SEO técnico.*
