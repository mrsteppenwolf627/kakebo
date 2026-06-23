# Estado del Proyecto Kakebo AI

**Última actualización:** 2026-06-23 (UIUX-11)  
**Último commit:** pendiente push (UIUX-11)  
**Rama operativa:** `main`

---

## Estado actual del proyecto (2026-06-22)

| Tarea | Descripción | Commit | Estado |
|---|---|---|---|
| SEO-PILAR-01 | Artículo pilar "Cómo hacer un presupuesto personal" publicado en ES | `38c22ae` | ✅ Completado |
| DOC-I18N-01 | Política SEO de idiomas documentada — solo español para contenido nuevo | `4b5ea7f` | ✅ Completado |
| CHECK-I18N-ROUTING-01 | Bug `Accept-Language` redirect corregido (`localeDetection: false`) | `5656eef` | ✅ Completado |
| UIUX-INDEXABLE-01 | Auditoría visual y UX de páginas públicas indexables | — | ✅ Completado |
| UIUX-02 | Estandarizar max-width parte pública | `bfde77e`..`980315a` | ✅ Completado |
| UIUX-03 | Contextualizar Navbar en blog | `27bfcad` | ✅ Completado |
| UIUX-04 | Features grid equilibrado (2×2) | `f7ba07f` | ✅ Completado |
| UIUX-05 | Unificar tipografía H2 de sección (font-serif font-normal) | `827c5c6` | ✅ Completado |
| UIUX-06 | Atribución editorial sobria en Testimonials — emojis → monograma serif | `ef049e4` | ✅ Completado |
| UIUX-07 | Eliminar widget Product Hunt del footer | `55f0c8d` | ✅ Completado |
| UIUX-08 | Reemplazar hardcoded colors con tokens semánticos | `d2b0315` | ✅ Completado |
| UIUX-09 | Activar `.bg-sakura` en sección editorial de la home | `ecda521` | ✅ Completado |
| UIUX-10 | Añadir diferenciadores visuales a FeatureCards | `489fdd2` | ✅ Completado |
| UIUX-11 | Unificar hover y estados interactivos de CTAs públicos | pendiente push | ✅ Completado |
| **UIUX-12** | **Accesibilidad dropdown herramientas u otros refinamientos** | — | **⬅ SIGUIENTE** |

**Restricciones activas:**
- No iniciar SEO-02 (fondo de emergencia) todavía.
- No tocar herramienta interna/dashboard.
- No tocar routing/i18n/hreflang/sitemap/middleware.
- No añadir imágenes ni avatares externos.

> Ver historial detallado de sprints SEO y decisiones arquitectónicas en `docs/PROJECT_STATUS.md`.

---

## Política SEO de Idiomas

**Fecha de decisión:** 2026-06-22  
**ID tarea de referencia:** DOC-I18N-01

### Regla activa

**El idioma principal y único activo para la producción de nuevo contenido editorial SEO del blog es el español.**

### Detalle de la política

| Ámbito | Regla |
|---|---|
| Nuevos artículos de blog | Solo se crean en español (`.es.mdx`) |
| Versiones `.en.mdx` nuevas | **No se crean** salvo orden explícita del usuario en la tarea |
| Contenido inglés existente | Se conserva como contenido legacy — no se elimina |
| Contenido inglés legacy | No se amplía, no se prioriza, no se indexa manualmente |
| Roadmap SEO activo | Opera exclusivamente en español |

### Contenido inglés legacy

Los siguientes archivos `.en.mdx` existen como contenido heredado y quedan fuera del roadmap SEO activo. No se tocan salvo instrucción explícita:

```
src/content/blog/ahorro-pareja.en.mdx
src/content/blog/alternativas-a-app-bancarias.en.mdx
src/content/blog/como-ahorrar-dinero-cada-mes.en.mdx
src/content/blog/como-hacer-un-presupuesto-personal.en.mdx   ← creado en SEO-PILAR-01, queda como legacy
src/content/blog/eliminar-gastos-hormiga.en.mdx
src/content/blog/kakebo-online-gratis.en.mdx
src/content/blog/kakebo-online-guia-completa.en.mdx
src/content/blog/kakebo-sueldo-minimo.en.mdx
src/content/blog/kakebo-vs-ynab.en.mdx
src/content/blog/libro-kakebo-pdf.en.mdx
src/content/blog/metodo-kakebo-guia-definitiva.en.mdx
src/content/blog/metodo-kakebo-para-autonomos.en.mdx
src/content/blog/peligros-apps-ahorro-automatico.en.mdx
src/content/blog/plantilla-kakebo-excel.en.mdx
src/content/blog/regla-30-dias.en.mdx
```

### Nota para agentes

Cualquier agente (Claude Code, Codex, u otro) que ejecute una tarea de creación de contenido editorial **debe crear únicamente el archivo `.es.mdx`**. Si la tarea no indica explícitamente que se requiere la versión inglesa, no se crea.

---

## Decisiones Arquitectónicas

### DA-09 — Prioridad de crecimiento temático

**Orden aprobado:**
1. Cluster 1 — Metodología Kakebo
2. Cluster 4 — Comparativas
3. Cluster 2 — Kakebo Digital y Herramientas
4. Cluster 3 — Educación Financiera General

**Justificación estratégica:**
El orden establecido busca consolidar la autoridad temática (Topical Authority) en el "Core Topic" (Método Kakebo) para establecer una base sólida de E-E-A-T frente a los motores de búsqueda antes de atacar verticales más genéricas y competidas. Abordar primero el Cluster 1 asegura el dominio del nicho, mientras que el Cluster 4 aprovecha esa autoridad para captar tráfico con intención comercial o comparativa (BOFU).

## Entidades y subtemas pendientes

**Entidades:**
* Motoko Hani
* Japón
* Minimalismo
* Ikigai
* Fondo de emergencia
* Libertad financiera
* Tasa de ahorro
* Gasto consciente
* Gratificación diferida
* Sistema de sobres
* Presupuesto base cero

**Subtemas:**
* Historia del Kakebo
* Filosofía del Kakebo
* Gestión de deuda
* Educación financiera infantil
* Gestión de ingresos irregulares
* Formatos físicos del método
* Categorización avanzada de gastos

## Candidatos para Content Sprint 1

*(Sujetos a revisión futura)*

**P0:**
* Origen del método Kakebo
* Las 4 categorías de gasto del Kakebo
* Kakebo para salir de deudas
* Las 4 preguntas antes de comprar

**P1:**
* Kakebo vs Sistema de Sobres
* Qué hacer si fallas con tu Kakebo
* Kakebo para niños

**P2:**
* Kakebo vs Regla 50/30/20
* Kakebo y Minimalismo
* Mejores agendas Kakebo físicas

> **Nota:** Los candidatos de Content Sprint 1 no constituyen un backlog definitivo. Su ejecución se revisará tras completar SEO-2.2, SEO-2.3 y SEO-2.4 y tras analizar datos adicionales de Search Console.

---

## Cluster SEO — Presupuesto Personal

**Estado:** En desarrollo activo  
**Decisión estratégica (2026-06-22):** Cluster prioritario siguiente tras consolidar el cluster Kakebo Core. Actúa como puente temático hacia autoridad en finanzas personales generales y da contenido hub a las calculadoras existentes (50/30/20 y ahorro).

### Artículos del cluster — Estado

| ID | Keyword principal | Slug | Prioridad | Estado |
|---|---|---|---|---|
| SEO-PILAR-01 | `como hacer un presupuesto personal` | `como-hacer-un-presupuesto-personal` | P1 — Pilar | ✅ Publicado 2026-06-22 |
| SEO-02 | `fondo de emergencia` | — | P1 | Pendiente |
| SEO-03 | `gastos fijos y variables` | — | P1 | Pendiente |
| SEO-04 | `como organizar finanzas personales` | — | P1 | Pendiente |
| SEO-05 | `regla 50 30 20` | — | P1 | Pendiente |
| SEO-06 | `presupuesto familiar mensual` | — | P2 | Pendiente |
| SEO-07 | `metodo de los sobres` | — | P2 | Pendiente |
| SEO-08 | `cuanto ahorrar al mes` | — | P2 | Pendiente |
| SEO-09 | `presupuesto base cero` | — | P3 | Pendiente |
| SEO-10 | `presupuesto ingresos irregulares` | — | P3 | Pendiente |

### SEO-PILAR-01 — Detalle técnico

**Fecha de publicación:** 2026-06-22  
**Archivos creados:**
- `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`
- `src/content/blog/como-hacer-un-presupuesto-personal.en.mdx`
- `public/images/blog/como-hacer-un-presupuesto-personal.webp`

**URLs:**
- ES: `https://www.metodokakebo.com/blog/como-hacer-un-presupuesto-personal`
- EN: `https://www.metodokakebo.com/en/blog/como-hacer-un-presupuesto-personal`

**SEO configurado:**
- Meta title, description, Open Graph, Twitter Card vía frontmatter
- JSON-LD: BlogPosting + BreadcrumbList + FAQPage (7 preguntas)
- hreflang ES/EN/x-default
- Canonical URL por locale
- Sitemap: incluido automáticamente vía `getBlogPosts()`

**Herramientas integradas:** calculadora-ahorro (×2), regla-50-30-20 (×1)  
**Enlaces internos:** 9 artículos del blog + 2 herramientas  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Tests:** ✅ 506/506 passing
