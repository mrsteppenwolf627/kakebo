# SEO_DATA_PRIORITY_01 — Snapshot GSC y Priorización SEO por Datos Reales

**Fecha del análisis:** 2026-06-30  
**Tipo:** Solo análisis y documentación — sin cambios en código ni contenido  
**Export analizado:** `docs/seo/gsc_2026_06_30/` (extraído de ZIP de GSC)  
**Archivos leídos:** Chart.csv · Pages.csv · Queries.csv · Countries.csv · Devices.csv · Filters.csv · Search appearance.csv

---

## 1. Resumen ejecutivo

El sitio está creciendo. Las métricas de junio son significativamente mejores que las de abril: el promedio diario de clics pasó de 0,8 a 4,3 (×5,4). La URL tractora (`/es/blog/plantilla-kakebo-excel`) acumula el 56% de todos los clics del periodo.

Sin embargo, el snapshot revela tres problemas nuevos o confirmados que cambian el roadmap:

1. **El problema de los `/es/` es mayor de lo estimado.** Google indexa y atribuye tráfico a las URLs con prefijo `/es/`, no a las canónicas sin prefijo. El `plantilla-kakebo-excel` acumula 115 clics bajo `/es/` y solo 10 bajo la URL canónica. El redirect está en su lugar pero Google no ha migrado la atribución.

2. **La canibalización EN de `kakebo-online-gratis` está confirmada por datos.** `/en/blog/kakebo-online-gratis` tiene 15 clics y 208 impresiones, mientras que `/es/blog/kakebo-online-gratis` tiene 0 clics y 12 impresiones. La versión EN está capturando el tráfico ES de esa URL.

3. **`app kakebo` tiene posición 5.87 con CTR 0%.** Es una señal de que el snippet que aparece para esa query no está convirtiendo, probablemente porque el meta title no conecta con esa intención.

La buena noticia: `calculadora-ahorro` confirma su CTR anómalo (34,88%) y es el activo con mayor tasa de conversión por impresión del sitio. Hay oportunidades claras en queries con muchas impresiones y CTR bajo: `kakebo` (168 imp, CTR 1,19%), `alternativas a fintonic` (41 imp, CTR 0%), `kakebo plantilla gratis` (38 imp, CTR 0%).

---

## 2. Alcance y ventana temporal

| Campo | Valor |
|---|---|
| **Rango del export** | 2026-03-29 → 2026-06-28 (92 días) |
| **Tipo de búsqueda** | Web |
| **Filtros adicionales** | Ninguno (confirmado en Filters.csv) |
| **Total del periodo** | **222 clics · 3.079 impresiones** |
| **CTR medio del periodo** | 7,21% |
| **Posición media del periodo** | 7,65 (estimado ponderado) |

**Advertencia:** Los datos de los últimos 3-7 días de cualquier export de GSC pueden estar incompletos por latencia de procesamiento. Los datos de junio deben interpretarse con cautela para las semanas más recientes.

---

## 3. Validación del export

| Campo | Resultado |
|---|---|
| Tipo de búsqueda | Web ✅ (no Discovery, no Image, no Video) |
| Filtro de fecha | Last 3 months ✅ (confirmado en Filters.csv) |
| Filtros adicionales | Sin filtros de query, página, país o dispositivo ✅ |
| Countries | 93 países con impresiones detectados ✅ |
| Search appearance | Sin datos (archivo presente pero sin filas) ⚠ |

---

## 4. Evolución temporal

### 4.1 Totales por periodo

| Periodo | Días | Clics | Impresiones | CTR est. | Clics/día |
|---|---|---|---|---|---|
| Marzo 29 - Abril 30 | 33 | 38 | 651 | 5,8% | 1,15 |
| Mayo | 31 | 64 | 1.073 | 6,0% | 2,06 |
| Junio 1-28 | 28 | 120 | 1.355 | 8,9% | 4,29 |
| **Total** | **92** | **222** | **3.079** | **7,2%** | **2,41** |

### 4.2 Ventanas recientes

| Ventana | Clics | Impresiones | CTR | Posición |
|---|---|---|---|---|
| Últimos 28 días (Jun 1-28) | 120 | 1.355 | 8,85% | ~7,8 |
| Últimos 14 días (Jun 15-28) | 65 | 676 | 9,62% | ~7,7 |
| Últimos 7 días (Jun 22-28) | 32 | 329 | 9,73% | 7,76 |
| Últimos 3 días (Jun 26-28) | 15 | 128 | 11,72% | 6,35 |

### 4.3 Comparativa semana a semana

| Comparativa | Clics | Impresiones | CTR |
|---|---|---|---|
| Últimos 7 días (Jun 22-28) | 32 | 329 | 9,73% |
| 7 días anteriores (Jun 15-21) | 33 | 347 | 9,51% |
| **Variación** | -3% | -5% | **+0,2pp** |

| Comparativa | Clics | Impresiones | CTR |
|---|---|---|---|
| Últimos 3 días (Jun 26-28) | 15 | 128 | 11,72% |
| 3 días anteriores (Jun 23-25) | 9 | 145 | 6,21% |
| **Variación** | **+67%** | -12% | **+5,5pp** |

### 4.4 Interpretación de la tendencia

La mejora de los últimos 3 días es notable pero **no concluyente** por el tamaño de la muestra. El día 2026-06-28 (9 clics, el segundo mejor día del mes) puede ser ruido estadístico o el efecto inicial de las optimizaciones desplegadas el 26 de junio (SEO-HOME-KAKEBO-APP-01, SEO-AHORRO-CALCULADORA-01, etc.).

La tendencia real y significativa es la progresión mes a mes: el crecimiento de clics de mayo a junio es del +88% y la CTR mejoró 2,9pp. Esto indica que el sitio está ganando visibilidad de forma orgánica y que las optimizaciones de los últimos meses están teniendo efecto acumulado.

**La mejora viene principalmente de CTR y posición, no de un aumento masivo de impresiones** (1.073 en mayo vs 1.355 en junio, +26%). El sitio está convirtiendo mejor las impresiones que tiene, no necesariamente apareciendo en más búsquedas.

---

## 5. Análisis por páginas

### 5.1 Hallazgo crítico: las URLs `/es/` dominan el índice de Google

El dato más importante del export de páginas es que **Google indexa y atribuye tráfico mayoritariamente a las URLs con prefijo `/es/`**, no a las canónicas sin prefijo. El redirect 301 en `next.config.ts` funciona para el usuario, pero Google sigue mostrando y contabilizando las URLs `/es/` en sus informes.

| URL | Clics | Imp | CTR | Pos |
|---|---|---|---|---|
| `/es/blog/plantilla-kakebo-excel` | 115 | 824 | 13,96% | 6,14 |
| `/blog/plantilla-kakebo-excel` (canónica) | 10 | 37 | 27,03% | 4,3 |
| **Combinado plantilla-excel** | **125** | **861** | — | — |
| `/es/herramientas/calculadora-ahorro` | 15 | 43 | 34,88% | 10,7 |
| `/herramientas/calculadora-ahorro` (canónica) | 0 | 4 | 0% | 7,25 |
| `/es/herramientas/calculadora-inflacion` | 1 | 300 | 0,33% | 8,94 |
| `/es/blog` (índice) | 3 | 131 | 2,29% | 14,82 |

**Interpretación:** La URL canónica de `plantilla-kakebo-excel` (sin `/es/`) tiene una posición media de 4,3 — significativamente mejor que la `/es/` (6,14) — pero casi no tiene impresiones (37 vs 824). Esto indica que Google puede estar mostrando ambas versiones para distintas queries, con la `/es/` siendo la que aparece en la mayoría. La corrección del canonical en el código (ya hecha) puede tardar semanas o meses en que Google migre completamente la atribución.

### 5.2 Clasificación de páginas por estado

#### URLs con tracción real (>2 clics)

| URL | Clics | Imp | CTR | Pos | Función |
|---|---|---|---|---|---|
| `/es/blog/plantilla-kakebo-excel` | 115 | 824 | 13,96% | 6,14 | Principal activo orgánico |
| `/` (Home) | 51 | 892 | 5,72% | 8,2 | Captación app |
| `/en/blog/kakebo-online-gratis` | 15 | 208 | 7,21% | 6,86 | **EN interfiriendo con ES** |
| `/es/herramientas/calculadora-ahorro` | 15 | 43 | 34,88% | 10,7 | CTR anómalo positivo |
| `/blog/plantilla-kakebo-excel` | 10 | 37 | 27,03% | 4,3 | Canónica — posición excelente |
| `/es/blog` | 3 | 131 | 2,29% | 14,82 | Blog index débil |
| `/es/blog/kakebo-online-guia-completa` | 3 | 37 | 8,11% | 8,32 | Tracción mínima |
| `/es/blog/alternativas-a-app-bancarias` | 2 | 284 | 0,7% | 8,49 | CTR muy bajo |
| `/en/blog/kakebo-vs-ynab` | 2 | 82 | 2,44% | 9,51 | EN — BOFU comparativa |

#### URLs con impresiones altas y CTR muy bajo (oportunidades de CTR)

| URL | Clics | Imp | CTR | Pos | Observación |
|---|---|---|---|---|---|
| `/es/herramientas/calculadora-inflacion` | 1 | 300 | 0,33% | 8,94 | **Mayor oportunidad de CTR del sitio** |
| `/` (Home) | 51 | 892 | 5,72% | 8,2 | Potencial de mejora de snippet |
| `/en/blog/kakebo-online-gratis` | 15 | 208 | 7,21% | 6,86 | EN captando lo que debería ser ES |
| `/es/blog` | 3 | 131 | 2,29% | 14,82 | Posición muy baja para el hub |
| `/en/blog/alternativas-a-app-bancarias` | 1 | 121 | 0,83% | 7,83 | EN legacy captando impresiones ES |
| `/es/blog/alternativas-a-app-bancarias` | 2 | 284 | 0,7% | 8,49 | 284 imp con solo 2 clics |

**Alerta en `calculadora-inflacion`:** 300 impresiones con 0,33% CTR (1 clic) es el mayor desperdicio de visibilidad del sitio. El meta title/description no conecta con la intención de búsqueda para las queries que generan esas impresiones.

#### URLs en posición 4-15 con potencial de mejora

| URL | Pos | Clics | Imp | Observación |
|---|---|---|---|---|
| `/blog/plantilla-kakebo-excel` (canónica) | 4,3 | 10 | 37 | Posición excelente — consolidar tráfico aquí |
| `/` (Home) | 8,2 | 51 | 892 | En posición 8, alto potencial si sube a 5-6 |
| `/en/blog/kakebo-online-gratis` | 6,86 | 15 | 208 | EN captando queries ES |
| `/es/herramientas/calculadora-ahorro` | 10,7 | 15 | 43 | CTR excepcional incluso en pos 10 |
| `/es/blog/kakebo-online-guia-completa` | 8,32 | 3 | 37 | Posición mejorable |
| `/es/herramientas/calculadora-inflacion` | 8,94 | 1 | 300 | **Posición cercana al top 10 — oportunidad** |

#### URLs con 0 clics pero con impresiones (potencial o ruido)

| URL | Imp | Pos | Observación |
|---|---|---|---|
| `/en` (Home EN) | 29 | 7,69 | EN legacy |
| `/es/tutorial` | 15 | 13,8 | Thin content probable |
| `/blog/como-hacer-un-presupuesto-personal` | 11 | 21,73 | Muy reciente — normal |
| `/en/blog/plantilla-kakebo-excel` | 10 | 6,2 | EN legacy con posición relevante |
| `/es/blog/como-ahorrar-dinero-cada-mes` | 12 | 8,83 | Sin clics — CTR falla |
| `/es/blog/kakebo-online-gratis` | 12 | 20,42 | **ES vs EN: ES en pos 20, EN en pos 6,86** |
| `/es/herramientas/regla-50-30-20` | 6 | 6,67 | Posición ok pero muy pocas imp |
| `/es/blog/metodo-kakebo-para-autonomos` | 3 | 1 | Posición 1 con 0 clics — query rarísima |

#### URLs que no aparecen en GSC (sin visibilidad)

Las siguientes URLs del sitio no tienen ni siquiera 1 impresión registrada en 92 días:
- `/blog/kakebo-sueldo-minimo`
- `/blog/regla-30-dias` (solo versión EN aparece)
- `/blog/ahorro-pareja` (solo versión EN aparece con 2 imp)
- `/blog/libro-kakebo-pdf`
- `/blog/peligros-apps-ahorro-automatico`
- `/herramientas/regla-50-30-20` (canónica — solo aparece la `/en/` y la `/es/` con 6 imp)
- `/herramientas/calculadora-inflacion` (canónica — solo `/es/` aparece)

---

## 6. Análisis por queries

### 6.1 Queries ganadoras (clics confirmados)

| Query | Clics | Imp | CTR | Pos | Clasificación |
|---|---|---|---|---|---|
| `kakebo excel` | 18 | 108 | 16,67% | 5,59 | Ganadora principal |
| `kakebo app` | 12 | 151 | 7,95% | 6,32 | Intención app/Home |
| `kakebo online` | 12 | 60 | 20% | 4,8 | Intención online/app |
| `kakebo excel gratis` | 12 | 49 | 24,49% | 4,16 | Variante exacta excelente |
| `plantilla kakebo excel gratis` | 8 | 38 | 21,05% | 3,29 | Pos 3,29 — muy buena |
| `kakebo plantilla` | 6 | 56 | 10,71% | 8,86 | CTR bajo para pos 9 |
| `kakebo online gratis` | 5 | 21 | 23,81% | 5,05 | Intención app/gratis |
| `kakebo 2026 excel` | 3 | 17 | 17,65% | 5,59 | Variante con año |
| `método kakebo plantilla excel` | 3 | 14 | 21,43% | 2 | **Pos 2, intención exacta** |
| `kakebo` | 2 | 168 | 1,19% | 13,74 | Marca — posición muy baja |

**Hallazgo en `kakebo` (genérico):** 168 impresiones y posición media 13,74 para la query de marca más genérica. El sitio no está en el top 10 para su propia marca cuando se busca solo "kakebo". CTR del 1,19% confirma que la mayoría de impresiones no convierten. Esto sugiere que Google no tiene claro que MetodoKakebo.com sea la referencia principal para "kakebo" en español.

### 6.2 Queries con oportunidad de CTR (impresiones altas, CTR bajo o cero)

| Query | Clics | Imp | CTR | Pos | Acción recomendada |
|---|---|---|---|---|---|
| `kakebo` | 2 | 168 | 1,19% | 13,74 | Mejorar posición (pos 14 → ≤10) |
| `kakebo app` | 12 | 151 | 7,95% | 6,32 | Optimizar snippet para intención |
| `metodo kakebo app` | 0 | 41 | 0% | 8,49 | 0 clics a pos 8,49 — snippet problema |
| `alternativas a fintonic` | 0 | 41 | 0% | 10,1 | Justo fuera del top 10 |
| `kakebo plantilla gratis` | 0 | 38 | 0% | 7,53 | Pos 7,5 con 0 clics — snippet falla |
| `app kakebo` | 0 | 30 | 0% | 5,87 | **Pos 5,87 con 0 clics — anómalo** |
| `fintonic alternativas` | 0 | 27 | 0% | 9,3 | Cluster Fintonic con 0 clics |
| `alternativas fintonic` | 0 | 18 | 0% | 11,33 | Fuera del top 10 |
| `metodo kakebo plantilla` | 0 | 18 | 0% | 9,94 | Pos 10 con 0 clics |
| `alternativa fintonic` | 0 | 18 | 0% | 10,11 | Limítrofe top 10 |

**Alerta crítica — `app kakebo` (30 imp, pos 5,87, CTR 0%):**
Estar en posición ~6 con 30 impresiones y 0 clics es una señal clara de que el snippet (title + description) que aparece para esta query no motiva el clic. La URL que aparece es probablemente la Home. El title actual optimizado para "kakebo online gratis" puede no resonar cuando el usuario busca "app kakebo" con intención de descargar/usar una app.

### 6.3 Queries en posición 4-15 con potencial de subir

| Query | Pos | Clics | Imp | Observación |
|---|---|---|---|---|
| `método kakebo plantilla excel` | 2 | 3 | 14 | Posición excelente, volumen bajo |
| `plantilla kakebo excel gratis` | 3,29 | 8 | 38 | Muy cerca del top 3 |
| `kakebo excel gratis` | 4,16 | 12 | 49 | Top 5 confirmado |
| `kakebo online` | 4,8 | 12 | 60 | Top 5 — potencial de subida |
| `kakebo online gratis` | 5,05 | 5 | 21 | Top 5 — optimizar para subir |
| `kakebo excel` | 5,59 | 18 | 108 | La query más valiosa, pos 5-6 |
| `kakebo app` | 6,32 | 12 | 151 | Segunda query por clics, pos 6 |
| `kakebo plantilla` | 8,86 | 6 | 56 | Pos 9, potencial de subida |
| `metodo kakebo app` | 8,49 | 0 | 41 | Pos 8 con 0 clics — CTR es el problema |
| `alternativas a fintonic` | 10,1 | 0 | 41 | Justo fuera del top 10 |

### 6.4 Queries de marca y variantes (ruido útil)

El sitio aparece para muchas variantes ortográficas de "kakebo" (`kakevo`, `kekobo`, `kakaebo`, `kakeibo`, `kakobo`, etc.) con posiciones razonables (4-10). Esto indica que Google entiende que el sitio es el destino para búsquedas de esta marca, pero las variantes tienen volumen muy bajo (1-2 impresiones c/u). No son accionables.

### 6.5 Queries de inflación (potencial sin tracción)

| Query | Clics | Imp | Pos | Observación |
|---|---|---|---|---|
| `calculadora inflacion` | 0 | 1 | 40 | En página 4 |
| `calculadora inflación` | 0 | 1 | 50 | Página 5 |
| `calculadora de inflacion` | 0 | 1 | 80 | Página 8 |
| `calcular inflacion` | 0 | 1 | 48 | Página 5 |
| `calculo de inflacion` | 0 | 2 | 65 | Página 7 |
| `calculadora ipc` | 0 | 1 | 63 | Página 6 |

**Conclusión sobre inflación:** La calculadora-inflacion tiene 300 impresiones en Pages.csv pero las queries de inflación no aparecen en el top de Queries.csv, o están en posiciones muy bajas (40-80). Esto confirma que la visibilidad de calculadora-inflacion viene de queries distintas a las que esperaríamos (probablemente queries de "kakebo" que llevan a esa URL como segunda opción). La herramienta necesita artículo editorial de respaldo para capturar tráfico informacional de inflación.

### 6.6 Queries GEO candidatas

Queries donde la respuesta factual y directa puede aparecer en AI Overviews:
- `kakebo` (definición)
- `método kakebo` (qué es)
- `kakebo online` (qué es / cómo funciona)
- `kakebo plantilla` (qué incluye)
- `alternativas a fintonic` (comparativa)

Para todas ellas, el contenido factual al inicio de las páginas clave mejoraría la elegibilidad para AI Overviews y motores generativos.

---

## 7. Análisis por países

| País | Clics | % Clics | Imp | CTR | Pos |
|---|---|---|---|---|---|
| España | 139 | 62,6% | 1.365 | 10,18% | 7,93 |
| México | 17 | 7,7% | 193 | 8,81% | 8,31 |
| Colombia | 8 | 3,6% | 82 | 9,76% | 7,84 |
| Chile | 7 | 3,2% | 59 | 11,86% | 5,71 |
| Bolivia | 6 | 2,7% | 34 | 17,65% | 6,38 |
| Italia | 5 | 2,3% | 84 | 5,95% | 7,77 |
| Argentina | 5 | 2,3% | 50 | 10% | 7,6 |
| Perú | 5 | 2,3% | 47 | 10,64% | 6,98 |
| **LatAm total** | **~60** | **~27%** | — | — | — |
| **EEUU** | **2** | **0,9%** | **427** | **0,47%** | **7,3** |

### Hallazgos geográficos

**España domina con comodidad** (62,6% de clics, 44% de impresiones). La estrategia España-first es correcta.

**LatAm aporta el 27% de los clics** con presencia en MX, CO, CL, BO, AR, PE, GT, DO, EC, VE. El contenido en español neutro funciona bien para esta audiencia. No es necesario crear contenido localizado por país.

**EEUU: 427 impresiones con solo 2 clics (CTR 0,47%).** EEUU es el segundo país por impresiones pero con CTR casi nulo. Esto confirma que las URLs EN legacy aparecen en búsquedas anglófonas en EEUU pero no convierten. El contenido EN tiene presencia SEO pero no relevancia para el usuario estadounidense (slugs en español, contenido no optimizado para EN). La decisión de no ampliar el legacy EN está correctamente justificada.

**Italia: 5 clics, 84 impresiones.** Llamativo. Puede ser españoles residentes en Italia o italianos que buscan en español. No accionable en este momento.

---

## 8. Análisis por dispositivos

| Dispositivo | Clics | % Clics | Imp | CTR | Pos |
|---|---|---|---|---|---|
| Desktop | 137 | 61,7% | 1.896 | 7,23% | 7,61 |
| Mobile | 81 | 36,5% | 1.152 | 7,03% | 8,41 |
| Tablet | 4 | 1,8% | 31 | 12,9% | 7,29 |

### Hallazgos por dispositivo

**Desktop domina** (62% de clics y 62% de impresiones). Esto indica que el contenido es mayoritariamente consumido en modo investigación, no en modo uso de la app en el móvil. Tiene sentido: los artículos del blog y herramientas son formato "quiero entender algo" más que "quiero hacer algo ahora".

**CTR de mobile y desktop son casi idénticos** (7,03% vs 7,23%), lo que indica que el UX móvil y el snippet son igualmente efectivos en ambos dispositivos. No hay un problema urgente de mobile que resolver.

**Implicación:** La prioridad de contenido editorial de calidad sobre UX móvil agresiva está justificada. El usuario llega principalmente desde desktop en modo investigación.

---

## 9. Search Appearance

El archivo `Search appearance.csv` está vacío (solo contiene la cabecera). Esto significa que:

- **No se han confirmado rich results** en el periodo (no FAQPage, no How-to, no artículo destacado)
- O bien el export de GSC no captura este dato de forma desagregada en la sección estándar
- Las FAQPage JSON-LD de `plantilla-kakebo-excel` y herramientas existen pero **no están generando rich snippets visibles** todavía

**Interpretación:** Es normal que las FAQ rich snippets tarden en activarse. El sitio necesita:
1. Mayor autoridad (posiciones más altas)
2. Mayor volumen de clics en las páginas con FAQPage
3. Tiempo de procesamiento de Google para los schemas recientemente optimizados

La ausencia de rich results no significa que el schema sea incorrecto — solo que aún no se ha activado.

---

## 10. URLs con tracción real

Clasificación definitiva basada en datos reales de GSC (combinando `/es/` + canónica):

| URL (combinada) | Clics totales | Estado |
|---|---|---|
| `plantilla-kakebo-excel` (ES) | **125** | Principal activo orgánico — PROTEGER |
| Home `/` | **51** | Segunda URL por clics |
| `kakebo-online-gratis` (EN legacy) | **15** | **Problema: es la versión EN captando ES** |
| `calculadora-ahorro` (ES) | **15** | CTR 34,88% — activo de alta calidad |
| `alternativas-a-app-bancarias` (ES) | **3** | Tracción mínima, potencial en Fintonic |
| `kakebo-online-guia-completa` (ES) | **3** | Tracción mínima |
| Blog index `/es/blog` | **3** | Hub con CTR bajo |

---

## 11. URLs con oportunidad

| URL | Imp | Clics | Oportunidad | Tipo |
|---|---|---|---|---|
| `calculadora-inflacion` (ES) | 300 | 1 | CTR muy bajo, posición 8,94 | CTR / posición |
| `alternativas-a-app-bancarias` (ES) | 284 | 2 | CTR 0,7% — mucho potencial | CTR / snippet |
| Home `/` | 892 | 51 | CTR 5,72% en pos 8 — si sube a 5-6, dobla clics | Posición |
| `kakebo-online-gratis` (ES) | 12 | 0 | 0 clics porque EN captura todo el tráfico | i18n fix urgente |
| `como-ahorrar-dinero-cada-mes` (ES) | 12 | 0 | Sin clics todavía — mejorar posición | Posición |

---

## 12. URLs protegidas

Basado en los datos, estas URLs NO deben modificarse agresivamente:

| URL | Razón | Restricción |
|---|---|---|
| `/es/blog/plantilla-kakebo-excel` | 115 clics — activo principal | Solo cambios quirúrgicos documentados |
| `/blog/plantilla-kakebo-excel` | Posición 4,3 — la mejor del sitio | No tocar el canonical ni el H1 |
| `/` (Home) | 51 clics, 892 impresiones | Cambios solo con hipótesis clara |
| `/es/herramientas/calculadora-ahorro` | CTR 34,88% — patrón valioso | No tocar hasta entender qué lo genera |

---

## 13. Queries prioritarias

### Top 10 queries accionables (ordenadas por impacto potencial)

| # | Query | Clics | Imp | CTR | Pos | Acción |
|---|---|---|---|---|---|---|
| 1 | `kakebo excel` | 18 | 108 | 16,67% | 5,59 | Subir de pos 5,59 a top 3 — mayor volumen |
| 2 | `kakebo app` | 12 | 151 | 7,95% | 6,32 | Optimizar snippet para intención app |
| 3 | `app kakebo` | 0 | 30 | 0% | 5,87 | Urgente — pos 5,87 con 0 clics, snippet falla |
| 4 | `kakebo plantilla gratis` | 0 | 38 | 0% | 7,53 | 0 clics en pos 7,5 — snippet falla |
| 5 | `metodo kakebo app` | 0 | 41 | 0% | 8,49 | 0 clics en pos 8,5 — urgente |
| 6 | `alternativas a fintonic` | 0 | 41 | 0% | 10,1 | Justo fuera del top 10 |
| 7 | `kakebo` | 2 | 168 | 1,19% | 13,74 | Posición 14 para la marca — mejorar autoridad |
| 8 | `kakebo plantilla` | 6 | 56 | 10,71% | 8,86 | En pos 9, puede subir a 5-6 |
| 9 | `kakebo online` | 12 | 60 | 20% | 4,8 | Top 5, mantener y mejorar |
| 10 | `alternativas fintonic` / `fintonic alternativas` | 0 | 45 total | 0% | ~10 | Cluster Fintonic sin clics |

---

## 14. Riesgos detectados con datos reales

### Riesgo crítico confirmado: canibalización EN en `kakebo-online-gratis`

**Evidencia directa:**
- `/en/blog/kakebo-online-gratis`: 15 clics, 208 imp, CTR 7,21%, pos 6,86
- `/es/blog/kakebo-online-gratis`: 0 clics, 12 imp, CTR 0%, pos 20,42

La versión EN está en posición 6,86 y capta 15 clics. La versión ES está en posición 20,42 y capta 0 clics. El mismo contenido en dos idiomas: el EN está capturando el tráfico que debería ir al ES. **Este riesgo pasa de "DUDOSO" a CONFIRMADO.**

### Riesgo crítico: `app kakebo` y `metodo kakebo app` — posición buena, CTR 0%

Dos queries con posición 5-8 y cero clics. Esto indica que los snippets que aparecen para estas queries no coinciden con la intención del usuario. El título/descripción que Google muestra para la Home cuando buscan "app kakebo" no está comunicando correctamente que existe una app gratuita descargable/usable.

### Riesgo medio: las URLs `/es/` dominan el índice, no las canónicas

La corrección del canonical está en el código, pero Google aún indexa y atribuye el 92% del tráfico de `plantilla-kakebo-excel` a la URL `/es/`. Esto no es un error activo —el redirect funciona— pero crea:
1. Dificultad para consolidar señales en la URL canónica
2. Datos de GSC confusos (la URL "oficial" tiene 37 impresiones; la `/es/` tiene 824)
3. Posible dilución del PageRank entre ambas URLs

### Riesgo bajo: `calculadora-inflacion` — 300 impresiones, 1 clic

La herramienta con el schema más robusto del sitio tiene el CTR más bajo (0,33%). Casi todas las impresiones no convierten. Las queries de inflación que generan esas impresiones están en posición 40-80 (datos de Queries.csv), lo que confirma que la visibilidad viene de queries muy competidas para las que la herramienta no posiciona bien. El artículo editorial de respaldo es más urgente de lo estimado.

---

## 15. Cruce con roadmap

### Hallazgos que confirman o ajustan prioridades del `SEO_ROADMAP_V1.md`

| Tarea del roadmap | Estado anterior | Estado con datos GSC | Ajuste |
|---|---|---|---|
| `SEO-EXCEL-TITLE-01` | P2 — tras GSC | **DESBLOQUEADA** — artículo confirmado como activo principal | Ejecutar |
| `SEO-KAKEBO-ONLINE-CANIB-01` | P2 — bloqueada | **CONFIRMADA** — EN captura tráfico ES, urgente | Subir a P1 |
| `SEO-EXCEL-EN-VALIDATE-01` | P2 — baja prioridad | **Bajo riesgo activo** — EN plantilla-excel tiene solo 10 imp, no interfiere todavía | Mantener como P2 baja |
| `SEO-CALCULADORA-AHORRO-AUDIT-01` | P2 — tras GSC | **DESBLOQUEADA** — CTR 34,88% en pos 10,7 confirmado | Ejecutar para replicar patrón |
| `SEO-BLOG-INFLACION-01` | P5 — tras P4 | **Sube en urgencia** — 300 imp, 1 clic, posición mala en queries de inflación | Mantener P5 pero escalar urgencia interna |
| `SEO-HREFLANG-KAKEBO-ONLINE-01` | P2 | **Alta urgencia** — hay una URL EN (`kakebo-online-gratis`) activamente capturando tráfico ES | Escalar a P1 |
| `SEO-SCHEMA-HOME-01` | P1 | Confirmado — Home tiene 892 imp con CTR 5,72%; schema Organization puede mejorar autoridad | Mantener |
| `SEO-GEO-TERMINOLOGY-01` | P1 | Confirmado — "kakebo" genérico (168 imp, pos 13,74) indica que la entidad de marca no está clara para Google | Urgente |
| `SEO-EXCEL-H3-FIX-01` | P2 | Desbloqueada | Ejecutar junto a P2-01 |
| Tareas de enlazado (P4) | Bloqueadas | Siguen bloqueadas — no ejecutar hasta P2 completo | Mantener bloqueo |

---

## 16. Tareas desbloqueadas

Las siguientes tareas del roadmap pueden iniciarse:

| ID | Tarea | Prioridad | Motivo del desbloqueo |
|---|---|---|---|
| `SEO-EXCEL-TITLE-01` | Meta title `plantilla-kakebo-excel` <65 chars | **P0** | Confirmada como URL principal; title largo confirmado en SERP |
| `SEO-KAKEBO-ONLINE-CANIB-01` | Resolver canibalización EN/ES en `kakebo-online-gratis` | **P0** (nueva prioridad) | Confirmado por datos: EN tiene 15 clics, ES tiene 0 |
| `SEO-HREFLANG-KAKEBO-ONLINE-01` | Verificar y corregir hreflang `kakebo-online-guia-completa` | **P1** | Datos confirman que el cluster kakebo-online tiene problema de ES/EN |
| `SEO-EXCEL-H3-FIX-01` | H3→H2 en primer heading de `plantilla-kakebo-excel` | P2 | Desbloqueada al confirmar URL como activo principal |
| `SEO-CALCULADORA-AHORRO-AUDIT-01` | Auditoría de CTR anómalo `calculadora-ahorro` | P2 | CTR 34,88% confirmado — datos disponibles para analizar |
| `SEO-GEO-TERMINOLOGY-01` | Glosario canónico + correcciones | P1 | `kakebo` genérico en pos 13,74 confirma que la entidad de marca no está clara |
| `SEO-SCHEMA-HOME-01` | Schema `Organization` + `WebSite` | P1 | Home con 892 imp y 5,72% CTR — mejorar autoridad de entidad |
| `SEO-TECHNICAL-DATEMODIFIED-01` | Campo `updatedDate` + dateModified real | P1 | No requería GSC — mantener |

---

## 17. Tareas bloqueadas

Las siguientes tareas siguen pendientes de más datos o condiciones:

| ID | Tarea | Razón del bloqueo |
|---|---|---|
| `SEO-INTERNAL-LINKING-V1-01` | Enlazado estructural completo | Esperar a que P2 defina la función de cada URL |
| `SEO-BLOG-INFLACION-01` | Artículo respaldo calculadora-inflacion | Esperar a que P4 esté disponible; aunque sube urgencia |
| `SEO-BLOG-503020-01` | Artículo respaldo regla-50-30-20 | `regla-50-30-20` tiene solo 6 imp — volumen insuficiente para priorizar ahora |
| `SEO-EXCEL-EN-VALIDATE-01` | Validar interferencia EN en plantilla-excel | EN tiene 10 imp a pos 6,2 — no hay interferencia activa todavía |
| `SEO-GEO-FAQ-PAGE-01` | Página /faq global | P6 — baja urgencia mantenida |
| `SEO-GEO-AUTHORSHIP-01` | Autoría con credenciales | P6 — no hay señal en datos de que esté causando problema activo |
| Tareas de enlazado P4 | Todo el bloque P4 | Esperar P2 |

---

## 18. Próximas 5 tareas recomendadas (orden actualizado con datos GSC)

### Tarea 1 — `SEO-KAKEBO-ONLINE-CANIB-01` (NUEVA P0)

**Qué:** Investigar y resolver por qué `/en/blog/kakebo-online-gratis` (EN legacy) captura el tráfico español de la query "kakebo online gratis" mientras la versión ES tiene 0 clics.  
**Por qué primero:** Es un problema confirmado por datos, no una hipótesis. La versión EN está en posición 6,86 para queries en español; la ES está en 20,42. Se pierde tráfico ahora mismo.  
**Acción concreta:** Revisar el hreflang del par `kakebo-online-gratis` ES/EN. Verificar si Google está confundiendo el slug (idéntico en ambos idiomas) como una señal de que el EN es más relevante. Evaluar si consolidar la autoridad en el ES requiere un ajuste del hreflang o una diferenciación de contenido.  
**Entregable:** Documento `SEO_KAKEBO_ONLINE_I18N_01.md` con diagnóstico y decisión.

---

### Tarea 2 — `SEO-EXCEL-TITLE-01`

**Qué:** Reducir el meta title de `plantilla-kakebo-excel` a menos de 65 chars preservando `plantilla kakebo excel gratis`.  
**Por qué segundo:** Confirmado como URL con 125 clics combinados y pos 6,14/4,3. El title actual (~93 chars) se trunca. Impacto directo en CTR de la URL más valiosa del sitio.  
**Entregable:** Cambio en frontmatter `title` de `plantilla-kakebo-excel.es.mdx`.

---

### Tarea 3 — `SEO-GEO-TERMINOLOGY-01`

**Qué:** Unificar terminología en todo el sitio. Glosario canónico. Corrección de `siteName`. Terminología de las 4 categorías.  
**Por qué tercero:** `kakebo` (genérico, 168 imp) posiciona en 13,74 — el sitio no está bien posicionado para su propia marca. Unificar la entidad semántica es el paso previo a mejorar el ranking para la marca.  
**Entregable:** `GLOSARIO_TERMINOLOGICO.md` + correcciones en código.

---

### Tarea 4 — `SEO-SCHEMA-HOME-01`

**Qué:** Añadir `Organization` + `WebSite` + SearchAction a la Home.  
**Por qué cuarto:** La Home tiene 892 impresiones (la URL con más impresiones del sitio) y CTR del 5,72%. Mejorar la señal de entidad puede mejorar tanto el ranking de la marca como el CTR del snippet.  
**Entregable:** JSON-LD añadido a `/(public)/page.tsx`.

---

### Tarea 5 — `SEO-CALCULADORA-AHORRO-AUDIT-01`

**Qué:** Analizar en detalle por qué `calculadora-ahorro` tiene CTR 34,88% a posición media 10,7 — entender el patrón y documentar cómo replicarlo.  
**Por qué quinto:** Con datos confirmados, hay que entender el patrón antes de seguir optimizando las otras herramientas. Si el CTR anómalo se explica, puede replicarse en `calculadora-inflacion` (300 imp, CTR 0,33%).  
**Entregable:** `CALCULADORA_AHORRO_AUDIT_01.md`.

---

## 19. Hipótesis para revisar en 2-4 semanas

| Hipótesis | Cambio que la valida | Ventana |
|---|---|---|
| Corregir hreflang `kakebo-online-gratis` hará que la ES recupere posición sobre la EN | `SEO-KAKEBO-ONLINE-CANIB-01` | 3-6 semanas |
| Reducir el meta title de `plantilla-kakebo-excel` mejora CTR sin perder posición | `SEO-EXCEL-TITLE-01` | 2-4 semanas |
| Añadir schema `Organization` a Home mejora el ranking de `kakebo` genérico (pos 13 → ≤10) | `SEO-SCHEMA-HOME-01` | 4-8 semanas |
| La mejora de CTR de los últimos 3 días (11,72% vs 6,21% anterior) se sostiene en la próxima semana | — | 7 días |
| `app kakebo` (pos 5,87, 0 clics) mejora CTR si el snippet de la Home conecta mejor con la intención de descarga/uso de app | Meta description Home ajustada | 2-4 semanas |

---

## 20. Conclusión

El sitio tiene tracción real, tendencia positiva y una URL tractora bien posicionada. La base es buena. Los problemas más urgentes son:

1. **Canibalización EN confirmada en `kakebo-online-gratis`** — pérdida de tráfico activa que puede resolverse con un ajuste de hreflang.
2. **CTR 0% en queries de alta posición** (`app kakebo`, `metodo kakebo app`, `kakebo plantilla gratis`) — el snippet no conecta con la intención; posible oportunidad rápida.
3. **`calculadora-inflacion` invisible para sus queries objetivo** — 300 impresiones pero de queries que llegan por otras razones, no por "calculadora inflacion". El artículo editorial de respaldo sube en urgencia.

El principal activo (`plantilla-kakebo-excel`) está funcionando y no necesita cambios agresivos. Los cambios recomendados para esa URL son quirúrgicos: meta title más corto, H3→H2, y eventualmente enlaces hacia herramientas.

La prioridad del roadmap cambia en un punto: **`SEO-KAKEBO-ONLINE-CANIB-01` pasa a ser P0** junto a `SEO-EXCEL-TITLE-01`. Los datos lo justifican.

---

*SEO_DATA_PRIORITY_01.md — 2026-06-30*  
*Basado en export GSC Last 3 months (2026-03-29 → 2026-06-28)*  
*222 clics · 3.079 impresiones · 92 días*  
*Sin cambios en código, contenido ni SEO técnico.*
