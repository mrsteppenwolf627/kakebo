# GSC Priority Analysis 01 — MetodoKakebo.com

**Generado:** 2026-07-02  
**Snapshot GSC:** `docs/seo/gsc_2026_06_30/`  
**Período:** 2026-03-29 → 2026-06-28 (92 días, 3 meses)  
**Filtro:** Web / All devices / All countries

---

## 1. Resumen General

| Métrica | Valor |
|---|---|
| Total clics | ~222 |
| Total impresiones | ~3,079 |
| CTR medio global | 7.21% |
| Posición media | ~7.7 |
| País #1 | España — 139 clics (62.6%), 1,365 imp (44.3%) |
| País #2 | México — 17 clics (7.7%), 193 imp (6.3%) |
| Dispositivo #1 | Desktop — 137 clics (61.7%), 1,896 imp (61.6%) |
| Dispositivo #2 | Mobile — 81 clics (36.5%), 1,152 imp (37.4%) |
| Search Appearance | Sin rich results detectados (snippet estándar) |

**Tendencia:** Volumen creciente durante junio (de ~2–4 clics/día en abril a ~4–9 clics/día en junio). Crecimiento orgánico positivo sostenido.

---

## 2. ⚠️ Hallazgo Crítico: URL Fragmentation /es/ vs Canónico

El dato más importante del snapshot: **Google tiene indexadas y rankeando URLs con prefijo `/es/`** que deberían redirigir o consolidarse en las URLs canónicas (sin prefijo ES).

| URL Google sirve | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| `/es/blog/plantilla-kakebo-excel` | **115** | 824 | 13.96% | 6.14 |
| `/blog/plantilla-kakebo-excel` (canónica) | 10 | 37 | 27.03% | 4.3 |
| `/es/herramientas/calculadora-ahorro` | 15 | 43 | 34.88% | 10.7 |
| `/herramientas/calculadora-ahorro` (canónica) | 0 | 4 | 0% | 7.25 |
| `/es/herramientas/calculadora-inflacion` | 1 | **300** | 0.33% | 8.94 |
| `/es/blog/alternativas-a-app-bancarias` | 2 | **284** | 0.70% | 8.49 |
| `/es/blog/kakebo-online-guia-completa` | 3 | 37 | 8.11% | 8.32 |
| `/es/blog` | 3 | 131 | 2.29% | 14.82 |

**Impacto:** El 52% de todos los clics van a URLs `/es/` no canónicas. En el caso de `plantilla-kakebo-excel`, el 92% del tráfico (115/125 clics) va a la URL no canónica. La autoridad de enlace y las señales de ranking están fragmentadas.

**Causa probable:** Con `localePrefix: 'as-needed'` en next-intl, tanto `/blog/plantilla-kakebo-excel` como `/es/blog/plantilla-kakebo-excel` sirven contenido idéntico. Google indexó la versión `/es/` (posiblemente por el sitemap previo o rastreo histórico) y sigue sirviéndola a pesar del canonical tag en `/`.

**Acción requerida:** Nueva tarea `SEO-URL-CANONICAL-ES-01` para diagnosticar si `/es/` redirige correctamente a `/` en producción y forzar consolidación.

---

## 3. Top Páginas por Clics (Consolidado)

Combinando `/es/` y canónicas para el mismo artículo:

| Página | Clics totales | Imp totales | CTR repr. | Pos repr. | Estado |
|---|---|---|---|---|---|
| **plantilla-kakebo-excel** | 125 | 861 | 14–27% | 4.3–6.1 | 🟢 PROTEGER |
| **Home /** | 51 | 892 | 5.72% | 8.2 | 🟡 OPTIMIZAR |
| **kakebo-online-gratis** (EN) | 15 | 208 | 7.21% | 6.86 | 🟡 OBSERVAR |
| **calculadora-ahorro** | 15 | 47 | 34.88% | 10.7 | 🟡 SUBIR POSICIÓN |
| **alternativas-a-app-bancarias** | 5 | 437 | 0.7–3% | 8.49 | 🔴 CTR CRÍTICO |
| **calculadora-inflacion** | 1 | 305 | 0.33% | 8.94 | 🔴 CTR CRÍTICO |
| **kakebo-online-guia-completa** | 3 | 37 | 8.11% | 8.32 | 🟡 OBSERVAR |
| **blog index** | 4 | 157 | 2.3–3.9% | 14.82 | 🟡 DÉBIL |
| **kakebo-vs-ynab** (EN) | 2 | 82 | 2.44% | 9.51 | ⚪ OBSERVAR |
| **metodo-kakebo-guia-definitiva** | 1 | 27 | 8.33% | 5.87–15.33 | 🟡 IRREGULAR |
| **kakebo-online-gratis** (ES) | 1 | 18 | 16.67% | 6–20.4 | ⚪ FRAGMENTADO |
| **como-ahorrar-dinero-cada-mes** (ES) | 0 | 12 | 0% | 8.83 | ⚪ OBSERVAR |
| **eliminar-gastos-hormiga** | 0 | 13 | 0% | 3.4–7.62 | ⚪ OBSERVAR |
| **ahorro-pareja** | 0 | 6 | 0% | 4.75 | ⚪ OBSERVAR |

---

## 4. Top Queries — Clasificación por Intención

### 🟢 Plantilla / Excel / Descarga (cluster más rentable)

| Query | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| kakebo excel | 18 | 108 | 16.67% | 5.59 |
| kakebo excel gratis | 12 | 49 | 24.49% | **4.16** |
| plantilla kakebo excel gratis | 8 | 38 | 21.05% | **3.29** |
| kakebo 2026 excel | 3 | 17 | 17.65% | 5.59 |
| método kakebo plantilla excel | 3 | 14 | 21.43% | **2.0** |
| plantilla kakebo | 1 | 29 | 3.45% | 9.21 ← CTR bajo |
| kakebo imprimible gratis | 0 | 7 | 0% | 7.14 ← oportunidad |
| plantilla metodo kakebo pdf | 0 | 7 | 0% | 7.57 |
| kakebo pdf 2026 | 2 | 17 | 11.76% | 8 |

**Conclusión:** Cluster fuerte y convirtiendo bien. El artículo plantilla-kakebo-excel domina en pos 2–6. Query "plantilla kakebo" (29 imp, pos 9.21, CTR 3.45%) tiene potencial de mejora de CTR.

### 🟡 Kakebo Online / App

| Query | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| kakebo online | 12 | 60 | **20%** | 4.8 |
| kakebo app | 12 | 151 | 7.95% | 6.32 |
| kakebo online gratis | 5 | 21 | 23.81% | 5.05 |
| kakebo digital | 1 | 8 | 12.5% | 5.62 |
| metodo kakebo app | 0 | 41 | 0% | 8.49 ← oportunidad |
| app kakebo | 0 | 30 | 0% | 5.87 ← CTR preocupante |
| kakebo app gratis | 0 | 5 | 0% | 6.6 |

**Conclusión:** "kakebo app" tiene 151 impresiones y CTR 7.95% (pos 6.32). "metodo kakebo app" (41 imp, 0 clics, pos 8.49) y "app kakebo" (30 imp, 0 clics, pos 5.87) son oportunidades de CTR. La página `/en/blog/kakebo-online-gratis` captura buena parte de este tráfico.

### 🔴 Fintonic / Alternativas (alto volumen, CTR crítico)

| Query | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| alternativa a fintonic | 1 | 21 | 4.76% | 8.67 |
| alternativas a fintonic | 0 | 41 | 0% | 10.1 |
| fintonic alternativas | 0 | 27 | 0% | 9.3 |
| alternativa fintonic | 0 | 18 | 0% | 10.11 |
| alternativas fintonic | 0 | 18 | 0% | 11.33 |
| aplicaciones como fintonic | 0 | 3 | 0% | 9.33 |

**Conclusión:** ~128 impresiones en este cluster para `/es/blog/alternativas-a-app-bancarias` y el artículo tiene CTR prácticamente nulo (0.70% total). El artículo está rankeando para estas queries pero el título/meta no convierte.

### 🔴 Calculadora Inflación (alta visibilidad, 0 clics)

| Query | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| calculadora para actualizar valor dinero | 0 | 2 | 0% | 26 |
| dinero en el tiempo calculadora | 0 | 2 | 0% | 29 |
| calculadora equivalencia dinero en el tiempo ine | 0 | 2 | 0% | 37 |
| calculadora inflacion | 0 | 1 | 0% | 40 |
| calcular inflacion | 0 | 1 | 0% | 48 |
| calculadora de inflacion | 0 | 1 | 0% | 80 |

Las 300 impresiones de `/es/herramientas/calculadora-inflacion` se distribuyen entre muchas queries de cola larga, ninguna con clics. La página está en pos 8.94 pero CTR 0.33% — la herramienta existe, pero el snippet no convierte.

### 🟡 Marca / Brand

| Query | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| kakebo | 2 | 168 | **1.19%** | **13.74** |
| metodo kakebo | 0 | 5 | 0% | 33.4 |
| método kakebo | 0 | 1 | 0% | 23 |

**⚠️ Alerta:** "kakebo" tiene 168 impresiones pero posición 13.74 y CTR 1.19%. La marca no rankea en top-10 para su propia keyword. La Home está en pos 8.2 general pero baja a pos ~14 para la query de marca. Añadir schema Organization + WebSite (SEO-SCHEMA-HOME-01) podría mejorar la relevancia de marca.

### ⚪ Ruido / Typos / Irrelevante

- kekobo, kagarebo, kakaebo, kagebo, kikebo... (numerosos typos): pequeñas impresiones, irrelevantes
- ynab military discount, cashbff vs ynab: tráfico cruzado de reseñas comparativas
- método yakobi: ruido de variante ortográfica
- calculadora ahorro tupper: consulta de cola larga sin relevancia directa

---

## 5. Oportunidades SEO Detectadas

### 🔴 Prioridad Alta

| # | Oportunidad | Datos | Tarea |
|---|---|---|---|
| 1 | **URL /es/ vs canónico** — Split de PageRank masivo. 92% del tráfico de `plantilla-kakebo-excel` va a URL no canónica | 115 clics /es/ vs 10 canónica | Nueva: `SEO-URL-CANONICAL-ES-01` |
| 2 | **calculadora-inflacion CTR** — 300 imp, pos 8.94, solo 1 clic | CTR 0.33% — peor en todo el site | `SEO-BLOG-INFLACION-01` |
| 3 | **alternativas-a-app-bancarias CTR** — 284 imp, pos 8.49, 2 clics | CTR 0.70% — 2ª peor ratio | Sin tarea asignada |

### 🟡 Prioridad Media

| # | Oportunidad | Datos | Tarea |
|---|---|---|---|
| 4 | **calculadora-ahorro posición** — CTR excelente (34.88%) pero pos 10.7 | Si sube a top-7, volumen aumentaría | `SEO-CALCULADORA-AHORRO-AUDIT-01` |
| 5 | **Home brand ranking** — pos 13.74 para "kakebo" | Schema Organization/WebSite puede ayudar | `SEO-SCHEMA-HOME-01` |
| 6 | **"app kakebo" y "metodo kakebo app"** — 71 imp combinadas, 0 clics, pos ~5.9-8.5 | CTR nulo en pos alta | Revisar snippet de página app/online |
| 7 | **EN: metodo-kakebo-guia-definitiva** — 15 imp, 0 clics, pos 5.87 | Near page-1 sin clics | `SEO-GEO-ENTITY-DEFINITION-01` |

### 🟢 Proteger / No tocar

| Página | Razón |
|---|---|
| plantilla-kakebo-excel | Tractora principal, 125 clics, CTR sólido |
| kakebo-online-gratis (EN) | 15 clics, rendimiento estable |

---

## 6. Canibalización: kakebo-online-gratis vs kakebo-online-guia-completa

**Datos disponibles:**

| URL | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| `/en/blog/kakebo-online-gratis` | 15 | 208 | 7.21% | 6.86 |
| `/es/blog/kakebo-online-guia-completa` | 3 | 37 | 8.11% | 8.32 |
| `/es/blog/kakebo-online-gratis` | 0 | 12 | 0% | 20.42 |
| `/blog/kakebo-online-gratis` (canónica ES) | 1 | 6 | 16.67% | 6.0 |

**Veredicto:** Canibalización leve pero presente.

- La versión EN de `kakebo-online-gratis` rankea bien (pos 6.86) y captura "kakebo online" (12 clics, pos 4.8) y "kakebo online gratis" (5 clics, pos 5.05).
- La versión ES canónica (`/blog/kakebo-online-gratis`) está prácticamente muerta (1 clic, pos 6) — el tráfico ES potencial se lo lleva `/es/blog/kakebo-online-gratis` (0 clics, pos 20.42). URL fragmentation de nuevo.
- `kakebo-online-guia-completa` tiene poco volumen (3 clics, 37 imp) y no interfiere directamente.
- **Recomendación:** Resolver URL fragmentation antes de tocar canibalización. El problema real no es la canibalización entre los dos artículos sino entre `/es/` y canónico.

---

## 7. Estado de Tareas Bloqueadas

| Tarea | Estado | Justificación |
|---|---|---|
| **SEO-EXCEL-TITLE-01** | 🟡 Parcialmente desbloqueada | Plantilla rankea bien (pos 3.29–5.59 para queries principales), CTR alto. Pero el 92% del tráfico va a URL /es/ — resolver URL issue primero maximizará el impacto del title fix. |
| **SEO-EXCEL-H3-FIX-01** | 🟡 Parcialmente desbloqueada | Misma lógica que TITLE-01. Esperar a `SEO-URL-CANONICAL-ES-01`. |
| **SEO-KAKEBO-ONLINE-CANIB-01** | 🟡 Parcialmente desbloqueada | Canibalización leve, pero el problema real es URL fragmentation. La tarea es ejecutable como diagnóstico pero no como corrección hasta resolver /es/. |
| **SEO-CALCULADORA-AHORRO-AUDIT-01** | ✅ Desbloqueada | CTR 34.88% excelente. Oportunidad clara: subir posición de 10.7 a top-7. |
| **SEO-EXCEL-EN-VALIDATE-01** | ✅ Desbloqueada | `/en/blog/plantilla-kakebo-excel` tiene 0 clics / 10 imp / pos 6.2. Datos suficientes para validar. |
| **SEO-INTERNAL-LINKING-V1-01** | 🔴 Bloqueada | Instrucción explícita del usuario + URL fragmentation activa. Enlazar a URLs erróneas (/es/) podría consolidar el problema. |
| **SEO-BLOG-INFLACION-01** | ✅ Desbloqueada — URGENTE | 300 imp, pos 8.94, CTR 0.33%. Mayor oportunidad de mejora rápida de CTR en todo el site. |
| **SEO-BLOG-503020-01** | 🟡 Observar | Regla 50/30/20: 0 clics / 6 imp. Datos insuficientes para decidir. |

**Nueva tarea detectada:**
- `SEO-URL-CANONICAL-ES-01` — Diagnosticar y corregir el problema de doble URL `/es/` vs canónico para las páginas ES. Prioridad alta.

---

## 8. Recomendación Final — Una Sola Tarea

**→ SEO-BLOG-INFLACION-01**

**Justificación:**
- `/es/herramientas/calculadora-inflacion` tiene 300 impresiones y solo 1 clic (CTR 0.33%) a posición 8.94.
- Está en el borde del top-10 para términos de calculadora de inflación.
- El snippet no convierte — el título/meta no es suficientemente claro sobre la utilidad de la herramienta.
- No requiere tocar contenido de artículos, no toca plantilla-kakebo-excel, no depende de GSC adicional.
- Potencial realista: si el CTR sube a 3–5% (medio del sector para herramientas), pasaría de 1 a 9–15 clics/mes sin mejorar posición.
- Una vez el canonical `/es/` se resuelva (tarea futura), la mejora de CTR se potenciará.

**Segunda prioridad post-análisis:** `SEO-URL-CANONICAL-ES-01` — es la deuda técnica más grande en los datos, afecta a todas las URLs ES.

---

## Apéndice — Totales por Dispositivo

| Dispositivo | Clics | Imp | CTR | Pos media |
|---|---|---|---|---|
| Desktop | 137 | 1,896 | 7.23% | 7.61 |
| Mobile | 81 | 1,152 | 7.03% | 8.41 |
| Tablet | 4 | 31 | 12.9% | 7.29 |

## Apéndice — Top 5 Países

| País | Clics | Imp | CTR |
|---|---|---|---|
| España | 139 | 1,365 | 10.18% |
| México | 17 | 193 | 8.81% |
| Colombia | 8 | 82 | 9.76% |
| Chile | 7 | 59 | 11.86% |
| Bolivia | 6 | 34 | 17.65% |
