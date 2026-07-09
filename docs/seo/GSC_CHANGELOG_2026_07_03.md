# GSC Changelog — SEO Sprint 2026-07-03

> Trazabilidad de cambios que afectarán a Google Search Console en las próximas 2-4 semanas.
> Creado: 2026-07-03 | Próximo snapshot recomendado: entre 2026-07-17 y 2026-07-31

---

## 1. Fecha del snapshot base

**2026-07-03** — estado GSC medido antes o durante la ejecución de este sprint.

---

## 2. Estado base GSC observado

### Home (`/`)

| Métrica | Valor |
|---|---|
| Clics | 48 |
| Impresiones | 884 |
| CTR | 5.43% |
| Posición media | 8.24 |

### Queries clave Home

| Query | Clics | Impresiones | CTR | Posición |
|---|---|---|---|---|
| kakebo | 2 | 172 | 1.16% | 13.91 |
| kakebo app | 11 | 134 | 8.21% | 5.66 |
| kakebo online | 8 | 37 | 21.62% | 2.59 |
| kakebo online gratis | 3 | 6 | 50% | 2.5 |

> Nota: las 6 impresiones de "kakebo online gratis" son muestra pequeña — no extraer conclusiones hasta tener más volumen.

---

## 3. Cambios documentados por commit

### commit `3daa5e7` — SEO-HOME-BRAND-ENTITY-COPY-01

| Campo | Detalle |
|---|---|
| **URL afectada** | `/` (Home) |
| **Tipo de señal** | Title, meta description, OG, copy on-page (H1/H2, lead paragraph, CTAs) |
| **Hipótesis** | Reforzar la Home como entidad principal de marca ("Kakebo online gratis") debería mejorar CTR en queries de marca y reducir la posición media en "kakebo" (>13) |
| **Ventana mínima** | 2-4 semanas para title/meta · 4-6 semanas para impacto orgánico en posición |

---

### commit `a6e8447` — SEO-REGLA-503020-SNIPPET-GEO-01

| Campo | Detalle |
|---|---|
| **URL afectada** | `/herramientas/regla-50-30-20` |
| **Tipo de señal** | Title, meta description, OG, copy on-page (intent SEO/GEO reforzado) |
| **Hipótesis** | Optimizar el snippet hacia intención informacional/calculadora debería mejorar CTR e impresiones para queries "regla 50 30 20" y variantes |
| **Ventana mínima** | 2-4 semanas |

---

### commit `9476be4` — SEO-LEGACY-EN-NOINDEX-01

| Campo | Detalle |
|---|---|
| **URLs afectadas** | `/en/blog/alternativas-a-app-bancarias` · `/en/blog/kakebo-vs-ynab` |
| **Tipo de señal** | `noindex: true` en frontmatter EN → `<meta name="robots" content="noindex, nofollow">` |
| **Hipótesis** | Eliminar estas URLs EN del índice reduce ruido en GSC y evita canibalización con sus versiones ES |
| **Ventana mínima** | 2-6 semanas para deindexación completa (depende de recrawl de Googlebot) |

---

### commit `48b9983` — SEO-KAKEBO-ONLINE-GUIA-SNIPPET-01

| Campo | Detalle |
|---|---|
| **URL afectada** | `/blog/kakebo-online-guia-completa` (solo versión ES) |
| **Tipo de señal** | Title, meta description, excerpt, primer párrafo — optimizados para "kakebo online" 2026 |
| **Hipótesis** | Con el EN marcado como noindex y el ES con snippet reforzado, la URL ES debería consolidar impresiones y mejorar CTR en queries "kakebo online" y "cómo usar kakebo online" |
| **Ventana mínima** | 2-4 semanas |

---

### commit `96addfb` — SEO-LEGACY-EN-INVENTORY-DECISION-01

| Campo | Detalle |
|---|---|
| **URL afectada** | `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md` (solo documentación) |
| **Tipo de señal** | Ninguna — decisión documental sin impacto directo en GSC |
| **Hipótesis** | N/A — tarea de inventario y clasificación |
| **Ventana mínima** | N/A |

---

### commit `61300d7` — SEO-LEGACY-EN-NOINDEX-BATCH-01

| Campo | Detalle |
|---|---|
| **URLs afectadas** | `/en/blog/ahorro-pareja` · `/en/blog/kakebo-sueldo-minimo` · `/en/blog/libro-kakebo-pdf` · `/en/blog/metodo-kakebo-para-autonomos` · `/en/blog/regla-30-dias` · `/en/blog/kakebo-online-guia-completa` · `/en/blog/peligros-apps-ahorro-automatico` |
| **Tipo de señal** | `noindex: true` en frontmatter EN → `<meta name="robots" content="noindex, nofollow">` en las 7 URLs |
| **Hipótesis** | Eliminar del índice 7 URLs EN con slugs en español y sin valor estratégico EN reduce señales mixtas, elimina canibalización cross-language y consolida autoridad en versiones ES |
| **Ventana mínima** | 2-6 semanas para deindexación completa |

---

### commit `d8971ae` — SEO-NOINDEX-SITEMAP-SMOKE-01

| Campo | Detalle |
|---|---|
| **URLs afectadas** | Las mismas 10 URLs `/en/blog/...` marcadas como noindex + sus `alternates` hreflang |
| **Tipo de señal** | Bug fix en `sitemap.ts`: las 10 URLs EN noindex se incluían en el sitemap a pesar de la directiva `noindex` en página — señal contradictoria |
| **Fix aplicado** | `getBlogPosts('en')` + `enNoindexSlugs` Set + guard por locale en entrada y en `alternates`. Ahora las 10 URLs EN noindex quedan completamente excluidas del sitemap XML y de los `alternates` hreflang |
| **Hipótesis** | Eliminar las URLs noindex del sitemap acelera la deindexación y elimina la señal contradictoria sitemap↔robots |
| **Ventana mínima** | 1-3 semanas tras recrawl del sitemap por Googlebot |

---

### commit (Content: add emergency fund guide) — CONTENT-02

| Campo | Detalle |
|---|---|
| **URL afectada** | `/blog/fondo-de-emergencia` (nueva) |
| **Tipo de señal** | Contenido nuevo, title, meta description, enlazado interno entrante desde el propio artículo hacia `calculadora-ahorro`, `cuentas-remuneradas`, `como-ahorrar-dinero-cada-mes`, `como-hacer-un-presupuesto-personal`, `regla-50-30-20`, `calculadora-inflacion` |
| **Keyword objetivo** | `cuánto dinero tener en un fondo de emergencia` (long tail), keyword padre `fondo de emergencia` |
| **Hipótesis** | Captar intención de cálculo práctico del fondo de emergencia, sin competir de frente por el término genérico dominado por bancos/aseguradoras; expandir el cluster de ahorro ya con señal fuerte (Kakebo, plantilla Excel, app/online, alternativas a Fintonic) y apoyar `calculadora-ahorro` desde un segundo ángulo editorial (mismo patrón que `cuentas-remuneradas`) |
| **Ventana mínima** | 8-12 semanas para artículo nuevo (indexación y primeras señales de posicionamiento) |

---

## 4. Métricas a revisar en el próximo snapshot (2026-07-17 a 2026-07-31)

### Home (`/`)
- Evolución de la posición media para query "kakebo" (baseline: 13.91 — objetivo: <10)
- CTR general (baseline: 5.43%)
- Queries de producto: "kakebo app" (5.66), "kakebo online" (2.59), "kakebo online gratis" (2.5)
- ¿Aparecen nuevas queries de marca o producto?

### `/herramientas/regla-50-30-20`
- Impresiones — ¿crecen para "regla 50 30 20" y variantes?
- CTR y posición
- ¿Captura queries GEO / intent calculadora?

### `/blog/kakebo-online-guia-completa` (ES)
- Impresiones y CTR para "kakebo online" y "cómo usar kakebo online"
- Posición media — ¿mejora con el EN fuera del índice?
- ¿Desaparece la URL EN del GSC (deindexada)?

### URLs `/en/blog/` con noindex (las 10)
- Caída progresiva de impresiones en GSC (puede tardar 2-6 semanas)
- Exclusión confirmada del sitemap XML (visible en GSC → Cobertura → Excluidas)
- Desaparición de los `alternates` hreflang contradictorios
- Si alguna URL mantiene impresiones después de 6 semanas → revisar si hay enlaces externos que fuercen el crawl

---

## 5. Qué NO interpretar demasiado pronto

- **Title/meta:** No evaluar impacto de snippet antes de 2-4 semanas. Google puede tardar en actualizar el snippet en SERP aunque rastree la página rápidamente.
- **noindex:** No evaluar deindexación antes de que Googlebot recrawlee cada URL. El recrawl no es inmediato — puede tardar días o semanas según el presupuesto de rastreo.
- **Muestras pequeñas:** "kakebo online gratis" tiene solo 6 impresiones en baseline. No extraer conclusiones de variaciones de 1-2 impresiones. Esperar a tener al menos 30-50 impresiones antes de interpretar CTR.
- **Fluctuaciones diarias:** Las posiciones medias fluctúan por personalización, dispositivo y región. Comparar periodos de 7-14 días, no días individuales.
- **hreflang fix:** La corrección de `alternates` puede tardar un ciclo de crawl en propagarse en la base de datos de Google.

---

## 6. Decisiones vigentes que condicionan el siguiente ciclo

| Decisión | Estado | Motivo |
|---|---|---|
| `/blog/plantilla-kakebo-excel` protegido | Bloqueado — requiere autorización explícita del usuario | Activo dominante, no tocar sin estrategia clara |
| Enlazado interno | No ejecutar todavía | Pendiente de datos GSC consolidados |
| Tres artículos EN "dudosos" (`como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `metodo-kakebo-guia-definitiva`) | En espera de GSC | No hay datos suficientes para decidir noindex vs mantener |
| Home | No tocar de nuevo | Esperar ventana de datos del cambio de copy/metadata ejecutado en `3daa5e7` |
| `/blog/kakebo-online-guia-completa` (ES) | No tocar | Esperar que Google recrawlee y actualice snippet |

---

## 7. Próximo snapshot recomendado

**Entre 2026-07-17 y 2026-07-31** — mínimo 2 semanas desde la fecha de los commits para dar tiempo al recrawl de Googlebot y a la actualización de snippets en SERP.

Revisar en ese snapshot:
1. ¿Ha mejorado la posición de Home en "kakebo"?
2. ¿Están bajando las impresiones EN noindex?
3. ¿Han mejorado impresiones/CTR en `/herramientas/regla-50-30-20`?
4. ¿Consolida impresiones `/blog/kakebo-online-guia-completa` ES?
5. ¿Qué posición tienen los 3 artículos EN dudosos? → decidir si noindex o mantener.
