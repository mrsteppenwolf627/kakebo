# Auditoría SEO metodokakebo.com (SEO-1.1) — 2026-10-15

**Estado: COMPLETA (GA4 + GSC), solo lectura.** Núcleo de GSC extraído; Core Web Vitals y apariencia en búsqueda sin datos/no abierta.

Fuentes: GA4 propiedad "metodokakebo" (cuenta 378788667, propiedad 543004992) y Search Console propiedad de prefijo `https://www.metodokakebo.com/`, ambos con la cuenta aitor@aitoralmu.xyz (sesión Google u/2), extraídos el 2026-10-15. Navegador: Brave. Rango principal: 2026-04-15 a 2026-10-14. Tipo de búsqueda GSC: Web.

## 1. Resumen ejecutivo
- **GSC: 1.320 clics, 13.076 impresiones, CTR 10,1 %, posición media 7,3** (2026-04-15 a 2026-10-14). Periodo anterior de igual duración (2025-10-15 a 2026-04-14): **45 clics, 1.716 impresiones, CTR 2,6 %, posición 13,3** → clics ×29.
- **Crecimiento mensual sostenido:** 14 (15-30 abr), 64, 132, 195, 282, 489 (sep); oct 1-14: 144 (≈ 10,3 clics/día, ligera bajada frente a sep ≈ 16,3).
- **Un solo contenido concentra el SEO:** `/blog/plantilla-kakebo-excel` = 751 clics (56,9 % de los 1.320) y 3.654 impresiones, posición 4,8, CTR 20,6 %. Las consultas con "excel/plantilla" lideran. La landing de la home (`/`) tiene 4.030 impresiones pero solo 6 % de CTR.
- **Ruido de URL duplicadas/idioma:** aparecen `/es/blog/...` (115 clics) además de `/blog/...`, y 12 URL "con redirección" y 26 "rastreadas sin indexar": 27 indexadas de 80 conocidas (49 en el sitemap).
- **Plus no está en el embudo orgánico:** 0 consultas de marca de pago/Plus; `/herramientas/plantilla-kakebo-excel-premium` solo 1 clic y 16 impresiones en 6 meses, y GA4 no mide checkout/compra.
- **GA4 solo tiene datos desde junio de 2026** (periodo anterior vacío) y ≈ 51 % de sus eventos vienen de tráfico anómalo (ver sección 7).

## 2. Alcance, fechas, propiedades y limitaciones
- GSC: solo la propiedad de prefijo de URL `https://www.metodokakebo.com/`. La propiedad de dominio `sc-domain:metodokakebo.com` no es accesible con esta cuenta. Última actualización de datos: ~4 h antes de la lectura.
- Consultas: la tabla de GSC solo contiene **595 clics y 5.906 impresiones** de las 203 consultas listadas frente a 1.320 clics y 13.076 impresiones de la propiedad: la diferencia (≈ 725 clics, 55 %) son consultas anonimizadas que GSC no muestra. Todo lo dicho sobre "consultas" vale para esa fracción.
- Las sumas por página (1.352 clics, 14.310 impresiones) superan los totales de propiedad; es normal (un mismo resultado puede mostrar varias URL del sitio).
- GA4: sin datos antes de junio de 2026 ni en el periodo anterior; sumas internas de GA4 no cuadran del todo (canales 2.276, landing 2.275, meses 2.274 frente a 2.279).
- No extraído: Core Web Vitals (GSC: "Not enough usage data" para móvil y escritorio), apariencia en búsqueda, detalle por URL de cada motivo de no indexación, comparación por consultas/páginas con el periodo anterior (el periodo anterior tiene solo 45 clics), caídas > 30 % (no aplicable: no hay caída, el periodo anterior es residual), países y ciudades de GA4 completos.

## 3. Evolución de 6 meses en GSC
Fuente: GSC, rangos mensuales (`gsc_mensual.csv`).

| Mes | Clics | Impresiones | CTR | Posición |
|---|---|---|---|---|
| 2026-04 (15-30) | 14 | 269 | 5,2 % | 7,8 |
| 2026-05 | 64 | 1.073 | 6,0 % | 8,2 |
| 2026-06 | 132 | 1.462 | 9,0 % | 7,9 |
| 2026-07 | 195 | 1.574 | 12,4 % | 8,2 |
| 2026-08 | 282 | 2.700 | 10,4 % | 7,9 |
| 2026-09 | 489 | 4.217 | 11,6 % | 6,5 |
| 2026-10 (1-14) | 144 | 1.781 | 8,1 % | 6,4 |
| **Total** | **1.320** | **13.076** | 10,1 % | 7,3 |
| Periodo anterior (2025-10-15 a 2026-04-14) | 45 | 1.716 | 2,6 % | 13,3 |

- Las sumas mensuales cuadran con el total (1.320 clics, 13.076 impresiones).
- La posición mejora de 8,2 (may) a 6,4 (oct). El CTR de octubre (8,1 %) baja frente a septiembre (11,6 %) con más impresiones/día: ver sección 5.
- Detalle diario no volcado: la serie diaria está disponible en GSC (183 días); los últimos 10 días van de 5 a 17 clics/día (11 clics el 14-oct, 17 el 13-oct).

## 4. Consultas: marca frente a no marca
Fuente: GSC, 203 consultas, `gsc_consultas.csv` (clasificación heurística: contiene kakebo/kakeibo).

- **Casi todo es "marca de categoría": 589 de 595 clics (99 %)** contienen "kakebo/kakeibo". Solo 6 clics y 583 impresiones vienen de consultas sin esa palabra (alternativas a Fintonic, calculadoras de ahorro e inflación, cuentas remuneradas).
- **Ganadoras (clics):** kakebo excel 113 (518 impr., pos. 6,4), kakebo excel gratis 79 (308, 4,1), kakebo plantilla 47 (194, 4,5), plantilla kakebo excel gratis 39 (108, 2,0), kakebo online 32 (126, 3,8), plantilla kakebo 31 (152, 4,0), método kakebo plantilla excel 30 (78, 1,5), kakebo 27 (**1.628 impr., CTR 1,7 %**, pos. 9,2), kakebo 2026 excel 22 (56, 3,8), kakebo app 21 (351, 5,3).
- **Oportunidades de CTR/posición:**
  - `kakebo` (1.628 impr., 27 clics, pos. 9,2, CTR 1,7 %): la mayor bolsa de impresiones; subir a top 5 multiplicaría clics.
  - `kakebo app` (351 impr., CTR 6 %, pos. 5,3), `kakebo pdf` (135 impr., 4 clics, pos. 11,1), `kakebo 2026` (132 impr., 3 clics, pos. 8,0).
  - `metodo kakebo` (113 impr., 0 clics, **pos. 24,3**), `método kakebo` (58 impr., pos. 19,2) y `el método kakebo` (60 impr., pos. 23,6): la propia marca del dominio ("método kakebo") rankea fuera de la primera página.
  - Intención de alternativas: "alternativas a fintonic" (131 impr., pos. 8,9), "fintonic alternativas" (60, 9,0): hay impresiones que apuntan a `/blog/alternativas-a-app-bancarias` (710 impr., 5 clics, CTR 0,7 %).
- **Perdedoras:** no medible (periodo anterior con 45 clics en total).

## 5. Páginas
Fuente: GSC, 60 URL, `gsc_paginas.csv`.

- **Ganadoras:** `/blog/plantilla-kakebo-excel` 751 clics / 3.654 impr. / 20,6 % / pos. 4,8; `/` 240 / 4.030 / 6,0 % / 7,9; `/es/blog/plantilla-kakebo-excel` 115 / 812 / 14,2 % / 6,1; `/herramientas/calculadora-ahorro` 65 / 1.342 / 4,8 % / 9,2; `/blog/kakebo-online-guia-completa` 43 / 407 / 10,6 % / 5,6; `/en/blog/plantilla-kakebo-excel` 33 / 335 / 9,9 % / 6,5.
- **CTR bajo con muchas impresiones (reescribir título/descripción):** `/` (4.030 impr., 6 %), `/herramientas/calculadora-ahorro` (1.342 impr., 4,8 %, pos. 9,2), `/blog` (515 impr., 5,2 %, pos. 10,6), `/blog/alternativas-a-app-bancarias` (710 impr., 0,7 %, pos. 7,3), `/es/blog/alternativas-a-app-bancarias` (283 impr., 0,7 %), `/es/herramientas/calculadora-inflacion` (172 impr., 0,6 %, pos. 13,1), `/blog/cuentas-remuneradas` (96 impr., 0 clics, pos. 10,8).
- **Posiciones 4-15 con potencial:** `/herramientas/calculadora-ahorro` 9,2; `/blog` 10,6; `/herramientas` 14,2; `/blog/como-hacer-un-presupuesto-personal` 15,2; `/blog/kakebo-vs-ynab` 7,9; `/tutorial` 7,8.
- **Duplicidad de idioma:** hay URL con prefijo `/es/` (p. ej. `/es/blog/plantilla-kakebo-excel` con 115 clics; `/es/login`; `/es/tutorial`) junto a las sin prefijo, mientras GA4 solo ve rutas sin `/es/`. Hay 12 páginas con redirección y 4 con canonical alternativa: probable redirección `/es/*` → sin prefijo, pero el tráfico sigue entrando por ellas.
- **Plus/pack:** `/herramientas/plantilla-kakebo-excel-premium` 1 clic, 16 impresiones, pos. 6,9; `/en/herramientas/plantilla-kakebo-excel-premium` 0 clics, 37 impresiones, pos. 4,7 (sin clics con posición 4,7 → título/meta débiles).

## 6. Salud técnica e indexación
Fuente: GSC, 2026-10-15 (`gsc_indexacion.csv`).

| Concepto | Valor |
|---|---|
| Indexadas | 27 |
| No indexadas | 53 |
| — Página con redirección | 12 |
| — Excluida por noindex | 4 |
| — Alternativa con canonical adecuada | 4 |
| — Rastreada, actualmente sin indexar | 26 |
| — Descubierta, actualmente sin indexar | 7 (validación: aprobada) |
| 404 / bloqueada por robots.txt | 0 / 0 |
| Sitemap `/sitemap.xml` | 49 URL descubiertas, última lectura 2026-10-08, estado Success |
| Core Web Vitals | Sin datos suficientes en móvil y escritorio (Chrome UX Report) |
| Acciones manuales | No se detectan problemas |
| Problemas de seguridad | No se detectan problemas |
| Enlaces externos | 18 en total, todos hacia `/`; dominios: producthunt.com 13, linkedin.com 4, deepnlp.org 1 |

- **Lectura:** el sitemap declara 49 URL y solo 27 están indexadas; **26 "rastreadas, sin indexar"** indica problemas de calidad, duplicidad o contenido fino (no tengo la lista por URL).
- El perfil de enlaces es muy pequeño y concentrado en la home.

## 7. Evolución GA4 y adquisición orgánica
Fuente: GA4 (`ga4_mensual.csv`, `ga4_canales.csv`, `ga4_fuentes_medio.csv`), 2026-04-15 a 2026-10-14. **GA4 solo registra datos desde junio de 2026.**

| Mes | Sesiones | Orgánico | Direct | Referral | Eventos | Eventos clave |
|---|---|---|---|---|---|---|
| 2026-06 | 72 | 45 | 15 | 3 | 479 | 0 |
| 2026-07 | 381 | 243 | 117 | 10 | 18.882 | 0 |
| 2026-08 | 543 | 336 | 158 | 24 | 3.889 | 0 |
| 2026-09 | 915 | 597 | 193 | 112 | 6.576 | 143 |
| 2026-10 (1-14) | 363 | 230 | 56 | 69 | 2.781 | 6 |

- Periodo: **2.279 sesiones, 1.593 usuarios, 13.755 vistas, 32.607 eventos, 149 eventos clave**; interacción 56,47 %.
- Canales: Organic Search 1.455 (63,84 %), Direct 540 (23,69 %), Referral 218, Organic Social 38, AI Assistant 10, Unassigned 9, Paid Search 6.
- Fuentes: google/organic 1.371; bing/organic 58; duckduckgo/organic 10; ecosia 6; `chatgpt.com/ai-assistant` 7 sesiones con 10 min 42 s de interacción; `accounts.google.com/referral` 208 (flujo de login); `ig/social` 29 (10 % de interacción).
- **Tráfico anómalo:** `/herramientas/calculadora-inflacion` 5.869 vistas / 26 usuarios; Direct de julio con 146 eventos/sesión; Singapur (131 usuarios, 1 s), EE. UU. (171, 18,8 % interacción), China (29, 0 s).

## 8. Comportamiento y eventos de conversión
Fuente: GA4 (`ga4_paginas.csv`, `ga4_landing_pages.csv`, `ga4_eventos.csv`, `ga4_paises.csv`, `ga4_dispositivos.csv`).

- **Landing por sesiones:** `/blog/plantilla-kakebo-excel` 807 (35,4 %; 139 de 149 eventos clave, tasa 15,24 %), `/` 397, `/app` 257, "(not set)" 144, `/herramientas/calculadora-ahorro` 96, `/login` 63.
- **Eventos:** `download_template` 474 (378 usuarios), `file_download` 522, `click_cta_login` 118, `sign_up` 24 (21 usuarios), `sign_up_confirmed` 2, `first_expense_created` 2, `expense_created` 572 (50 usuarios), `premium_product_viewed` 17 (13 usuarios), `premium_product_cta_clicked` 4 (3 usuarios).
- **Plus:** no existe ningún evento de `begin_checkout`, compra o suscripción. La plantilla premium recibe 15 vistas / 10 usuarios y 6 sesiones de entrada en 6 meses.
- **Embudo visible:** 1.593 usuarios → 378 con descarga de plantilla (23,7 %) → 21 con `sign_up` → 2 confirmados.
- **Países GA4 (usuarios):** España 658, EE. UU. 171, Singapur 131, Colombia 108, México 98. **GSC (clics):** España 764, Colombia 115, México 107, Italia 50, Argentina 49, Chile 43, Perú 26.
- **Dispositivos GA4:** escritorio 1.024, móvil 559, tablet 13. **GSC clics:** escritorio 749 (CTR 11,6 %), móvil 551 (8,5 %), tablet 20.

## 9. Cruce GSC–GA4 y discrepancias
Fuente: `cruce_gsc_ga4.csv`.

| Mes | Clics GSC | Sesiones orgánicas GA4 | Diferencia (GA4 − GSC) |
|---|---|---|---|
| 2026-04 (15-30) | 14 | sin datos | — |
| 2026-05 | 64 | sin datos | — |
| 2026-06 | 132 | 45 | −87 |
| 2026-07 | 195 | 243 | +48 |
| 2026-08 | 282 | 336 | +54 |
| 2026-09 | 489 | 597 | +108 |
| 2026-10 (1-14) | 144 | 230 | +86 |
| Total | 1.320 | 1.451 | +131 |

- **GA4 no cubre abril-mayo y casi no cubre junio:** GSC registra 210 clics de abr-jun frente a 45 sesiones orgánicas en GA4. La etiqueta de GA4 parece instalarse a finales de junio (no verificado).
- **Desde julio, GA4 supera a GSC** (+8 % a +60 %). Motivos probables: GA4 cuenta también Bing/DuckDuckGo/Ecosia (≈ 74 sesiones) y sesiones repetidas; en octubre la diferencia (230 frente a 144) es mayor y no la explico solo con eso.
- **Página principal de entrada:** `/blog/plantilla-kakebo-excel` tiene 751 clics (+115 de `/es/` y +33 de `/en/`) frente a 807 sesiones de entrada en GA4: coherente. `/` tiene 240 clics frente a 397 sesiones (incluye directo y otros).
- **`/herramientas/calculadora-ahorro`:** 65 clics y 1.342 impresiones en GSC frente a 96 sesiones de entrada GA4.
- **`/herramientas/calculadora-inflacion`:** apenas visible en GSC (172 impresiones en `/es/`, 4 en `/en/`) mientras GA4 le atribuye 5.869 vistas: la vista de GA4 no viene de búsqueda; se trata de tráfico no orgánico o automatizado.

## 10. Recomendaciones priorizadas
| Prioridad | Recomendación | Justificación (datos) |
|---|---|---|
| Alta | Medir Plus en GA4 (planes vistos, `begin_checkout`, `purchase`/suscripción como eventos clave) y arreglar la etiqueta (datos desde junio) | 0 eventos de checkout/compra; GA4 sin datos antes de junio mientras GSC ya traía 78 clics |
| Alta | Optimizar `/blog/plantilla-kakebo-excel` (único activo SEO: 751 clics, pos. 4,8) con CTA a registro/Plus y datos estructurados | 56,9 % de los clics y 93 % de los eventos clave; fuga descarga→registro (378 → 21 → 2) |
| Alta | Resolver duplicidad `/es/` frente a sin prefijo (redirecciones 301, canonicals, hreflang y sitemap coherentes) | 12 redirecciones y 4 canonical alternativa en indexación; `/es/blog/plantilla-kakebo-excel` recibe 115 clics |
| Alta | Revisar las 26 URL "rastreadas, sin indexar" y las 7 "descubiertas" (contenido, enlazado interno) | 27 indexadas de 80 conocidas (49 en sitemap) |
| Media | Atacar `kakebo` (1.628 impr., CTR 1,7 %, pos. 9,2) y `método kakebo` (pos. 19-24) con home/hub claro y enlaces internos | Mayor bolsa de impresiones del sitio y la marca propia fuera de página 1 |
| Media | Reescribir título y descripción de `/`, `/herramientas/calculadora-ahorro`, `/blog`, `/blog/alternativas-a-app-bancarias` | CTR 6 %, 4,8 %, 5,2 %, 0,7 % con 4.030, 1.342, 515 y 710 impresiones |
| Media | Reforzar `/herramientas/plantilla-kakebo-excel-premium` (y `/en/`): título, meta y enlazado desde la plantilla gratuita | 1 clic y 16 impresiones; la `/en/` tiene pos. 4,7 y 0 clics en 37 impresiones |
| Media | Aislar tráfico anómalo en GA4 (calculadora-inflacion, Singapur, EE. UU., China, Direct de julio) | ≈ 51 % de eventos de 26 usuarios; distorsiona engagement |
| Baja | Construir enlaces externos (hoy 18, todos a la home, 13 de producthunt.com) | Perfil de enlaces mínimo |
| Baja | Resolver `(not set)` como landing (144 sesiones) y `manual_test` | Atribución y limpieza |
| Baja | Vigilar Core Web Vitals cuando haya datos suficientes | GSC aún sin datos |

## 11. Anexo
- GSC: Rendimiento (consultas, páginas, países, dispositivos, días), Indexación de páginas, Sitemaps, Core Web Vitals, Acciones manuales, Problemas de seguridad, Enlaces. Rangos: 2026-04-15 a 2026-10-14, mensuales y 2025-10-15 a 2026-04-14.
- GA4: Adquisición de tráfico, Adquisición de usuarios, Páginas y pantallas, Página de destino, Eventos, Detalles demográficos (País), Detalles de la tecnología (Navegador, Categoría de dispositivo).
- Fecha de extracción: 2026-10-15. No se modificó nada en GSC ni en GA4; no se pulsó "Exportar" ni se solicitó validación o indexación.
- Ficheros: `gsc_mensual.csv`, `gsc_consultas.csv`, `gsc_paginas.csv`, `gsc_paises.csv`, `gsc_dispositivos.csv`, `gsc_indexacion.csv`, `ga4_mensual.csv`, `ga4_canales.csv`, `ga4_fuentes_medio.csv`, `ga4_landing_pages.csv`, `ga4_paginas.csv`, `ga4_eventos.csv`, `ga4_paises.csv`, `ga4_dispositivos.csv`, `cruce_gsc_ga4.csv`, `bloqueos.md`.
