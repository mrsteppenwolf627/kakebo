# SEO_LEGACY_EN_INVENTORY_DECISION_01
## Inventario y decisión sobre artículos EN legacy

**Fecha:** 2026-07-03  
**Tarea:** SEO-LEGACY-EN-INVENTORY-DECISION-01  
**Commit base:** 48b9983  
**Política activa:** Inglés es contenido legacy — no se crean artículos EN nuevos. Roadmap SEO activo opera en español.

---

## Contexto

El sitio tiene 15 artículos `.en.mdx`. La política de idiomas (DOC-I18N-01, 2026-06-22) establece que el roadmap SEO activo es ES-only. El mecanismo de noindex por frontmatter (`noindex: true`) existe desde `cba3fd0` y excluye automáticamente los artículos del sitemap.

**Criterios de clasificación:**

| Símbolo | Decisión | Condición |
|---|---|---|
| ✅ | Ya noindex | `noindex: true` en frontmatter |
| 🟢 | Mantener indexable | Intención EN clara · no compite con ES prioritaria · potencial captación internacional |
| 🟡 | Dudoso / esperar datos | Tiene algún valor EN pero compite con ES o tiene señales mixtas |
| 🔴 | Candidato a noindex | Legacy no estratégico · slug ES · compite con ES · sin objetivo de negocio claro |
| ⚪ | No tocar | Categoría protegida (Excel) |

---

## Tabla de inventario completo (15 artículos)

| # | Archivo `.en.mdx` | URL EN | Título EN | Fecha | Estado actual | Decisión | Motivo |
|---|---|---|---|---|---|---|---|
| 1 | `kakebo-online-gratis` | `/en/blog/kakebo-online-gratis` | Free Kakebo Online: The Best App to Track Your Expenses (2026) | 2026-02-10 | ✅ noindex (cba3fd0) | — | Ya resuelto |
| 2 | `alternativas-a-app-bancarias` | `/en/blog/alternativas-a-app-bancarias` | Mint and Fintonic Alternative without Bank Connection | 2026-01-13 | ✅ noindex (9476be4) | — | Ya resuelto |
| 3 | `kakebo-vs-ynab` | `/en/blog/kakebo-vs-ynab` | Kakebo vs YNAB: Which is the best budgeting method? | 2025-12-30 | ✅ noindex (9476be4) | — | Ya resuelto |
| 4 | `ahorro-pareja` | `/en/blog/ahorro-pareja` | How to save money as a couple without fighting | 2025-11-25 | Indexable | 🔴 Candidato noindex | Fecha antigua · slug ES · compite con ES · sin ventaja EN |
| 5 | `kakebo-sueldo-minimo` | `/en/blog/kakebo-sueldo-minimo` | How to save money on minimum wage or as a college student | 2025-12-02 | Indexable | 🔴 Candidato noindex | Fecha antigua · slug ES ("sueldo" = salario en español) · audiencia objetivo ES |
| 6 | `libro-kakebo-pdf` | `/en/blog/libro-kakebo-pdf` | Free Kakebo Book PDF: Pros, cons, and the modern alternative | 2025-12-16 | Indexable | 🔴 Candidato noindex | El libro Kakebo original está en japonés/español · audiencia objetiva es ES · compite con ES |
| 7 | `metodo-kakebo-para-autonomos` | `/en/blog/metodo-kakebo-para-autonomos` | Kakebo Method for Freelancers: How to save with irregular income | 2025-12-23 | Indexable | 🔴 Candidato noindex | Muy nicho · fecha antigua · slug completamente ES ("autónomos") · sin tráfico EN esperado |
| 8 | `regla-30-dias` | `/en/blog/regla-30-dias` | The 30-day savings rule: The ultimate shield against impulse buying | 2025-12-09 | Indexable | 🔴 Candidato noindex | Concepto genérico no Kakebo-específico · fecha antigua · slug ES · compite con versión ES del artículo |
| 9 | `kakebo-online-guia-completa` | `/en/blog/kakebo-online-guia-completa` | Kakebo Online: How to Use the Japanese Method Digitally (2026) | 2026-02-24 | Indexable | 🔴 Candidato noindex | Compite directamente con ES recién optimizado · slug EN con palabras ES · riesgo cross-language contamination (mismo patrón que kakebo-online-gratis) |
| 10 | `peligros-apps-ahorro-automatico` | `/en/blog/peligros-apps-ahorro-automatico` | The dangers of automatic savings apps and Open Banking | 2025-11-18 | Indexable | 🔴 Candidato noindex | Más antigua del inventario (2025-11-18) · slug completamente ES · sin valor estratégico EN |
| 11 | `como-ahorrar-dinero-cada-mes` | `/en/blog/como-ahorrar-dinero-cada-mes` | How to save money every month: 15 proven techniques | 2026-03-01 | Indexable | 🟡 Dudoso | Keyword EN válida ("how to save money every month") · pero slug ES · compite con ES · sin datos GSC |
| 12 | `eliminar-gastos-hormiga` | `/en/blog/eliminar-gastos-hormiga` | How to eliminate "gastos hormiga" (Latte Factor) | 2026-01-20 | Indexable | 🟡 Dudoso | Ángulo bilingüe ("latte factor" = concepto EN reconocido) · podría atraer audiencia latinoamericana en el extranjero · esperar datos |
| 13 | `metodo-kakebo-guia-definitiva` | `/en/blog/metodo-kakebo-guia-definitiva` | The Kakebo Method: The Complete Guide to Saving with Mindfulness | 2026-02-13 | Indexable | 🟡 Dudoso | "Kakebo method" tiene búsquedas EN reales · artículo pillar EN de la marca · si algún día se activa estrategia EN, este es el primero a mantener · esperar datos GSC |
| 14 | `como-hacer-un-presupuesto-personal` | `/en/blog/como-hacer-un-presupuesto-personal` | How to Make a Personal Budget Step by Step | **2026-06-22** | Indexable | 🟢 Mantener indexable | Artículo más reciente del inventario EN (junio 2026) · "how to make a personal budget" es keyword EN genérica con buen volumen real · posible captación internacional · mantener y monitorizar |
| 15 | `plantilla-kakebo-excel` | `/en/blog/plantilla-kakebo-excel` | Free Kakebo Excel Template | 2026-01-27 | Indexable | ⚪ No tocar | Categoría protegida — Excel no autorizado en roadmap actual |

---

## Resumen de decisiones

| Decisión | Cantidad | Artículos |
|---|---|---|
| ✅ Ya noindex | 3 | `kakebo-online-gratis`, `alternativas-a-app-bancarias`, `kakebo-vs-ynab` |
| 🟢 Mantener indexable | 1 | `como-hacer-un-presupuesto-personal` (fecha: 2026-06-22) |
| 🟡 Dudoso / esperar | 3 | `como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `metodo-kakebo-guia-definitiva` |
| 🔴 Candidatos a noindex | 7 | `ahorro-pareja`, `kakebo-sueldo-minimo`, `libro-kakebo-pdf`, `metodo-kakebo-para-autonomos`, `regla-30-dias`, `kakebo-online-guia-completa`, `peligros-apps-ahorro-automatico` |
| ⚪ No tocar | 1 | `plantilla-kakebo-excel` |
| **Total** | **15** | |

---

## Análisis por grupo

### 🔴 Candidatos a noindex — criterios comunes

Los 7 artículos candidatos comparten uno o más de estos factores:
- **Slug completamente en español** en una URL `/en/blog/...` — señal de cross-language contamination, mismo patrón que causó el problema resuelto en `cba3fd0`
- **Fecha antigua** (2025-11-18 a 2025-12-23) — ningún dato GSC conocido, probablemente sin tráfico orgánico
- **Compiten con versión ES** del mismo artículo, sin ventaja diferencial en EN
- **Sin objetivo de negocio claro** en el roadmap ES-first actual

**Caso especial — `kakebo-online-guia-completa.en.mdx`:**
La URL `/en/blog/kakebo-online-guia-completa` tiene el mismo slug que la URL ES `/blog/kakebo-online-guia-completa`. El patrón es idéntico al que causó la canibalización EN→ES confirmada en `kakebo-online-gratis`. El hreflang técnico puede estar correcto, pero la autoridad acumulada del artículo EN puede canibalizar las impresiones de la ES recién optimizada. → Prioridad alta dentro de los 7 candidatos.

### 🟡 Dudosos — razón de espera

| Artículo | Por qué esperar |
|---|---|
| `como-ahorrar-dinero-cada-mes` | "How to save money every month" es keyword genérica EN con volumen real. Sin datos GSC actuales no sabemos si ya posiciona. Si tiene impressions EN, puede valer la pena. |
| `eliminar-gastos-hormiga` | Ángulo bilingüe: "gastos hormiga" + "latte factor" puede atraer audiencia latinoamericana en el extranjero buscando en inglés. Esperar próximo snapshot GSC. |
| `metodo-kakebo-guia-definitiva` | "Kakebo method" es la query de marca principal en EN. Si el sitio alguna vez activa estrategia EN, este artículo sería el primero a retener. Mantener indexable hasta datos. |

### 🟢 Mantener indexable — caso único

**`como-hacer-un-presupuesto-personal.en.mdx`** (2026-06-22):
- Es el único artículo EN creado en 2026 con fecha posterior a junio
- "How to make a personal budget" es una de las queries de finanzas personales más buscadas en inglés globalmente
- Su existencia reciente sugiere que fue creado con cierta intención, no solo como reflejo del artículo ES
- Mantener indexable y monitorizar impressions en el próximo snapshot GSC

---

## Próxima tarea recomendada

**`SEO-LEGACY-EN-NOINDEX-BATCH-01`**

Aplicar `noindex: true` a los 7 artículos candidatos en un único commit atómico:
1. `ahorro-pareja.en.mdx`
2. `kakebo-sueldo-minimo.en.mdx`
3. `libro-kakebo-pdf.en.mdx`
4. `metodo-kakebo-para-autonomos.en.mdx`
5. `regla-30-dias.en.mdx`
6. `kakebo-online-guia-completa.en.mdx` ← prioridad por riesgo cross-language
7. `peligros-apps-ahorro-automatico.en.mdx`

**Artículos excluidos del batch:**
- `como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `metodo-kakebo-guia-definitiva` → Dudosos, esperar próximo GSC snapshot
- `como-hacer-un-presupuesto-personal` → Mantener indexable
- `plantilla-kakebo-excel` → No tocar (protegido)

---

*SEO_LEGACY_EN_INVENTORY_DECISION_01.md — 2026-07-03*  
*15 artículos inventariados · 7 candidatos a noindex · 3 dudosos · 1 mantener · 1 protegido*
