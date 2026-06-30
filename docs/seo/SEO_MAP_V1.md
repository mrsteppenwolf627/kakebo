# SEO MAP V1 — metodokakebo.com

**Versión:** 1.1 — Actualización completa  
**Fecha:** 2026-06-30  
**Sustituye a:** `SEO_MAP_V1.md` (raíz del repo, generado 2026-06-17 en commit `1841721`)  
**Commit de referencia:** `e8075b5` (HEAD actual)  
**Fuente de verdad para:** Priorización de tareas SEO/GEO a partir de 2026-06-30  
**Tipo:** Solo documentación — sin cambios en código, contenido ni SEO técnico

---

## 1. Resumen ejecutivo

metodokakebo.com tiene **27 URLs ES indexables** (15 artículos de blog + 4 herramientas + 5 páginas principales + 3 legales), más **~15 URLs EN legacy** activas pero sin roadmap activo. El sitio ha completado un sprint UI/UX completo y un primer ciclo de optimización SEO de snippets y herramientas. La URL de mayor tracción orgánica probada es `/blog/plantilla-kakebo-excel` (principal landing en GA4, mayor concentración de clics en GSC). La base técnica ha mejorado significativamente desde el mapa anterior: canonical de blog posts corregido, GA4 integrado, schema robusto. Las oportunidades de mayor impacto inmediato son enlazado interno hacia herramientas, reducción del meta title truncado en `/blog/plantilla-kakebo-excel`, y el artículo `/blog/como-hacer-un-presupuesto-personal` (reciente, sin tracción conocida aún).

### Cambios desde el mapa anterior (2026-06-17)

| Cambio | Impacto SEO |
|---|---|
| Canonical ES de blog posts corregido (`/es/blog/` → `/blog/`) | P0 técnico resuelto |
| Nuevo artículo `como-hacer-un-presupuesto-personal` publicado | Nueva URL indexable |
| GA4 integrado (MED-01) | Datos reales disponibles |
| Optimizaciones de snippet: title/description de calculadora-inflacion, alternativas-a-app-bancarias, home, calculadora-ahorro, regla-50-30-20 | CTR mejorado en estas URLs |
| Auditoría detallada de `plantilla-kakebo-excel` (SEO-PILLAR-EXCEL-AUDIT-01) | 8 tareas futuras priorizadas |
| Sprint UI/UX completo (brand, mobile, premium, CTAs) | Mejora de experiencia → posible beneficio en señales de comportamiento |

---

## 2. Metodología

Este mapa se construye desde el código fuente del repositorio activo (`C:\Users\a.alarcon\Desktop\Cursor projects\kakebo`), los documentos de proyecto (`PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`), los docs SEO existentes (`docs/seo/`), y los datos de tracción conocidos (GA4 + GSC tal como se describen en los documentos del proyecto). No se usaron herramientas de crawling externo ni datos de API de GSC en tiempo real — las cifras GSC son las documentadas en tareas previas.

**Criterio de priorización:**
1. Evidencia real de tracción (GA4 / GSC documentada) > estimaciones
2. Proteger lo que ya funciona antes de optimizar lo que no tiene datos
3. No marcar como P0 algo que no tiene evidencia de impacto
4. Separar riesgo de oportunidad

---

## 3. Inventario completo de URLs

### 3.1 Home y páginas principales

| # | URL ES | URL EN | Tipo | Indexable |
|---|---|---|---|---|
| 1 | `/` | `/en` | Home — App Kakebo Online | Sí |
| 2 | `/blog` | `/en/blog` | Blog index / Hub | Sí |
| 3 | `/herramientas` | `/en/herramientas` | Herramientas hub / índice | Sí |
| 4 | `/tutorial` | `/en/tutorial` | Tutorial / onboarding | Sí |
| 5 | `/sobre-nosotros` | `/en/sobre-nosotros` | Sobre nosotros | Sí (prioridad baja) |

### 3.2 Artículos de blog — ES (activos)

| # | URL | Título (frontmatter) | Fecha publicación | Cluster |
|---|---|---|---|---|
| 1 | `/blog/plantilla-kakebo-excel` | Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla | 2026-01-27 | Kakebo Excel |
| 2 | `/blog/como-hacer-un-presupuesto-personal` | *(pilar presupuesto — SEO-PILAR-01)* | 2026-06-22 | Presupuesto Personal |
| 3 | `/blog/kakebo-online-guia-completa` | Kakebo Online: Cómo usar el método japonés en digital (Guía completa 2026) | — | Kakebo Online / App |
| 4 | `/blog/kakebo-online-gratis` | Kakebo Online Gratis: La Mejor Aplicación para Controlar tus Gastos (2026) | — | Kakebo Online / App |
| 5 | `/blog/libro-kakebo-pdf` | Libro Kakebo PDF Gratis: Ventajas, desventajas y la alternativa moderna | — | Kakebo PDF |
| 6 | `/blog/eliminar-gastos-hormiga` | Cómo eliminar los gastos hormiga: El método japonés infalible | — | Finanzas Personales |
| 7 | `/blog/metodo-kakebo-guia-definitiva` | Método Kakebo: La técnica japonesa para ahorrar dinero sin esfuerzo | — | Kakebo Core |
| 8 | `/blog/alternativas-a-app-bancarias` | Las 7 Alternativas a Fintonic sin Banco (2026) | — | Alternativas / Fintonic |
| 9 | `/blog/peligros-apps-ahorro-automatico` | Peligros de las apps de ahorro automático y el Open Banking | — | Alternativas / Fintonic |
| 10 | `/blog/kakebo-vs-ynab` | Kakebo vs YNAB: ¿Cuál es el mejor método de presupuesto para ti? | — | Comparativas |
| 11 | `/blog/regla-30-dias` | La regla de los 30 días para ahorrar: El escudo definitivo contra las compras impulsivas | — | Control de Gastos |
| 12 | `/blog/ahorro-pareja` | Cómo ahorrar en pareja sin pelear: La guía definitiva paso a paso | — | Finanzas Personales |
| 13 | `/blog/metodo-kakebo-para-autonomos` | Método Kakebo para autónomos: Cómo ahorrar con ingresos irregulares | — | Kakebo Core |
| 14 | `/blog/kakebo-sueldo-minimo` | Cómo ahorrar ganando el salario mínimo o siendo estudiante | — | Finanzas Personales |
| 15 | `/blog/como-ahorrar-dinero-cada-mes` | Cómo ahorrar dinero cada mes: 15 técnicas probadas que sí funcionan | — | Control de Gastos |

### 3.3 Herramientas — ES

| # | URL ES | Nombre | Archivo fuente | Route group | Schema JSON-LD |
|---|---|---|---|---|---|
| 1 | `/herramientas/calculadora-inflacion` | Calculadora de Inflación e IPC | `(landing)/herramientas/calculadora-inflacion/page.tsx` | `(landing)` | SoftwareApplication + WebApplication + FAQPage + HowTo |
| 2 | `/herramientas/regla-50-30-20` | Calculadora 50/30/20 Gratis | `(landing)/herramientas/regla-50-30-20/page.tsx` | `(landing)` | SoftwareApplication + HowTo |
| 3 | `/herramientas/calculadora-ahorro` | Calculadora de Ahorro Mensual | `(public)/herramientas/calculadora-ahorro/page.tsx` | `(public)` | SoftwareApplication + FAQPage |

*Nota: Las herramientas EN (`/en/herramientas/...`) existen pero son legacy sin roadmap activo.*

### 3.4 Páginas legales

| # | URL | Nombre | Indexable |
|---|---|---|---|
| 1 | `/privacy` | Política de Privacidad | Sí (prioridad sitemap: 0.5) |
| 2 | `/terms` | Términos y Condiciones | Sí (prioridad baja) |
| 3 | `/cookies` | Política de Cookies | Sí (prioridad baja) |

### 3.5 Recursos descargables

| # | URL | Tipo | Referenciado desde |
|---|---|---|---|
| 1 | `/docs/Plantilla_Kakebo_Simplificada.xlsx` | Descarga directa Excel | `/blog/plantilla-kakebo-excel` (DownloadCTA) |

*No indexable directamente por Google (no es HTML), pero es un activo de conversión crítico.*

### 3.6 Páginas de app (no indexables)

Las siguientes rutas requieren autenticación y no deben indexarse:

```
/app/               — Dashboard
/app/new            — Nuevo gasto
/app/new-income     — Nuevo ingreso
/app/history        — Historial
/app/history/[ym]   — Historial mensual
/app/settings       — Configuración
/app/fixed-expenses — Gastos fijos
/app/ai-metrics     — Métricas IA
/app/agent          — Agente IA
/app/admin          — Panel admin
/app/subscription   — Suscripción
/app/cancel-subscription
/auth/callback      — Callback OAuth
/login              — Login / Signup (indexable limitado)
```

**Riesgo activo:** `robots.txt` solo bloquea `/api/`. Las rutas `/app/*` y `/auth/*` no están en `Disallow`, desperdiciando crawl budget. Estado: **pendiente de corrección** (flagged en mapa anterior 2026-06-17, sin tarea asignada aún).

### 3.7 Legacy EN

| # | URL EN | Slug | Observación |
|---|---|---|---|
| 1 | `/en/blog/plantilla-kakebo-excel` | Slug en español en mercado EN | ⚠ Riesgo potencial de interferencia con ES |
| 2 | `/en/blog/kakebo-online-gratis` | Slug en español | ⚠ Validación pendiente (SEO-I18N-KAKEBO-ONLINE-VALIDATE-01: DUDOSO) |
| 3 | `/en/blog/kakebo-online-guia-completa` | Slug en español | — |
| 4 | `/en/blog/kakebo-online-complete-guide` | Slug en inglés — slug diferente al ES | ⚠ hreflang ES↔EN apunta a URL que puede no existir |
| 5 | `/en/blog/libro-kakebo-pdf` | Slug en español | — |
| 6 | `/en/blog/eliminar-gastos-hormiga` | Slug en español | — |
| 7 | `/en/blog/metodo-kakebo-guia-definitiva` | Slug en español | — |
| 8 | `/en/blog/alternativas-a-app-bancarias` | Slug en español | — |
| 9 | `/en/blog/peligros-apps-ahorro-automatico` | Slug en español | — |
| 10 | `/en/blog/kakebo-vs-ynab` | Slug parcialmente en español | — |
| 11 | `/en/blog/regla-30-dias` | Slug en español | — |
| 12 | `/en/blog/ahorro-pareja` | Slug en español | — |
| 13 | `/en/blog/metodo-kakebo-para-autonomos` | Slug en español | — |
| 14 | `/en/blog/kakebo-sueldo-minimo` | Slug en español | — |
| 15 | `/en/blog/como-ahorrar-dinero-cada-mes` | Slug en español | — |
| 16 | `/en/blog/como-hacer-un-presupuesto-personal` | Slug en español | Creado en SEO-PILAR-01 como legacy |

**Política activa (DOC-I18N-01):** El legacy EN no se amplía, no se prioriza, no se indexa manualmente. Se conserva sin tocar.

### 3.8 Rutas históricas /es/

Las rutas `/es/*` tienen **redirect 301 configurado en `next.config.ts`** hacia las equivalentes sin prefijo. No están en GSC como URLs canónicas activas. El redirect es correcto y ya fue validado en `SEO-I18N-KAKEBO-ONLINE-VALIDATE-01`.

---

## 4. Tabla maestra de URLs ES

| URL | Idioma | Tipo | Indexable | Canonical esperado | Intención principal | Intención secundaria | Keyword principal estimada | Keywords secundarias | Cluster | GSC conocido | GA4 conocido | Prioridad | Riesgo | Acción recomendada | Decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | ES | Home | Sí | `https://www.metodokakebo.com` | Navegacional / marca | Transaccional app | `kakebo online gratis` | kakebo online, kakebo app, app kakebo, método kakebo | Kakebo Online / App | Potencial — optimizado en SEO-HOME-KAKEBO-APP-01 | Landing secundaria | P1 | Bajo | Monitorizat post-optimización | Esperar datos |
| `/blog` | ES | Hub | Sí | `https://www.metodokakebo.com/blog` | Navegacional | Informacional | `blog kakebo` | finanzas personales blog, ahorro blog | Hub | Desconocido | Tráfico de navegación | P2 | Bajo | Añadir schema CollectionPage | Auditar después |
| `/herramientas` | ES | Hub | Sí | `https://www.metodokakebo.com/herramientas` | Navegacional | Transaccional | `herramientas finanzas personales gratis` | calculadoras ahorro, herramientas kakebo | Hub herramientas | Desconocido | Tráfico de navegación | P2 | Bajo | Añadir texto editorial | Auditar después |
| `/blog/plantilla-kakebo-excel` | ES | Artículo pilar | Sí | `https://www.metodokakebo.com/blog/plantilla-kakebo-excel` | Transaccional — descarga recurso | Informacional comparativa | `plantilla kakebo excel gratis` | kakebo excel, plantilla kakebo excel, kakebo google sheets | Kakebo Excel | **Principal URL orgánica GSC** | **Principal landing orgánica GA4** | **P0** | Bajo | 8 tareas futuras (SEO-PILLAR-EXCEL-AUDIT-01) | Tocar con cirugía — ver audit |
| `/blog/como-hacer-un-presupuesto-personal` | ES | Artículo pilar | Sí | `https://www.metodokakebo.com/blog/como-hacer-un-presupuesto-personal` | Informacional — guía presupuesto | Transaccional tool | `como hacer un presupuesto personal` | presupuesto personal, hacer presupuesto mensual, planificar presupuesto | Presupuesto Personal | Sin datos (reciente 2026-06-22) | Sin datos | P1 | Bajo | Monitorizar GSC, enlazado interno desde herramientas | Esperar datos |
| `/blog/kakebo-online-guia-completa` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/kakebo-online-guia-completa` | Informacional — guía completa | Navegacional app | `kakebo online` | kakebo digital, aplicación kakebo, método kakebo online | Kakebo Online / App | Desconocido | Desconocido | P1 | Medio (canibalización con `kakebo-online-gratis`) | Diferenciar intención vs `kakebo-online-gratis` | Auditar después |
| `/blog/kakebo-online-gratis` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/kakebo-online-gratis` | Transaccional — buscar app | Informacional | `kakebo online gratis` | app kakebo gratis, kakebo sin banco, kakebo app | Kakebo Online / App | Interferencia EN: DUDOSO (SEO-I18N-KAKEBO-ONLINE-VALIDATE-01) | Desconocido | P1 | Medio (posible canibalización con guia-completa + interferencia EN) | Validar GSC separado ES/EN | Esperar datos |
| `/blog/libro-kakebo-pdf` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/libro-kakebo-pdf` | Transaccional — descarga PDF | Informacional | `libro kakebo pdf gratis` | kakebo pdf, descargar kakebo, libro kakebo | Kakebo PDF | Desconocido | Desconocido | P2 | Bajo | Añadir enlazado entrante | Esperar datos |
| `/blog/eliminar-gastos-hormiga` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/eliminar-gastos-hormiga` | Informacional — problema/solución | Transaccional | `gastos hormiga` | eliminar gastos pequeños, gastos diarios cafe, control gastos mensuales | Finanzas Personales | Desconocido | Desconocido | P2 | Bajo | Enlazado interno desde plantilla-excel | Esperar datos |
| `/blog/metodo-kakebo-guia-definitiva` | ES | Artículo pilar cluster | Sí | `https://www.metodokakebo.com/blog/metodo-kakebo-guia-definitiva` | Informacional — pilar método | Navegacional | `método kakebo` | que es el kakebo, método japonés ahorro, kakebo como funciona | Kakebo Core | Desconocido | Desconocido | P1 | Bajo | Reforzar como hub — enlazado entrante desde todo el cluster | Auditar después |
| `/blog/alternativas-a-app-bancarias` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` | Informacional comparativa | Transaccional | `alternativas a fintonic` | alternativas fintonic sin banco, apps financieras sin open banking | Alternativas / Fintonic | 310 impresiones · 2 clics · CTR 0,65% · pos 7,95 (optimizado SEO-CTR-FINTONIC-01) | Desconocido | P1 | Bajo | Monitorizar CTR post-optimización | Esperar datos |
| `/blog/peligros-apps-ahorro-automatico` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/peligros-apps-ahorro-automatico` | Informacional — awareness/privacidad | Informacional | `peligros apps ahorro automatico` | open banking riesgos, alternativas apps bancarias | Alternativas / Fintonic | Desconocido | Desconocido | P2 | Bajo | Enlazado interno desde alternativas-a-app-bancarias | Esperar datos |
| `/blog/kakebo-vs-ynab` | ES | Artículo comparativa | Sí | `https://www.metodokakebo.com/blog/kakebo-vs-ynab` | Informacional / BOFU comparativo | Transaccional | `kakebo vs ynab` | diferencia kakebo ynab, mejor método presupuesto, kakebo comparativa | Comparativas | Desconocido | Desconocido | P2 | Bajo | Enlazado interno desde metodo-kakebo-guia-definitiva | Esperar datos |
| `/blog/regla-30-dias` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/regla-30-dias` | Informacional — técnica | Transaccional | `regla 30 dias compras` | regla de los 30 días, compras impulsivas, control de gastos | Control de Gastos | Desconocido | Desconocido | P2 | Bajo | Enlazar a `/herramientas/calculadora-ahorro` | Esperar datos |
| `/blog/ahorro-pareja` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/ahorro-pareja` | Informacional — audiencia pareja | Informacional | `como ahorrar en pareja` | finanzas pareja, cuenta conjunta pareja, presupuesto familiar | Finanzas Personales | Desconocido | Desconocido | P2 | Bajo | Enlazado interno | Esperar datos |
| `/blog/metodo-kakebo-para-autonomos` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/metodo-kakebo-para-autonomos` | Informacional — audiencia autónomo | Transaccional | `kakebo para autonomos` | kakebo freelance, finanzas autónomo, ahorro ingresos irregulares | Kakebo Core | Desconocido | Desconocido | P2 | Bajo | Enlazar a `/herramientas/calculadora-ahorro` en FAQ | Esperar datos |
| `/blog/kakebo-sueldo-minimo` | ES | Artículo | Sí | `https://www.metodokakebo.com/blog/kakebo-sueldo-minimo` | Informacional — audiencia estudiante/SMI | Informacional | `como ahorrar con sueldo minimo` | kakebo estudiante, ahorro poco dinero, SMI ahorro | Finanzas Personales | Desconocido | Desconocido | P2 | Bajo | Enlazado interno | Esperar datos |
| `/blog/como-ahorrar-dinero-cada-mes` | ES | Artículo TOFU | Sí | `https://www.metodokakebo.com/blog/como-ahorrar-dinero-cada-mes` | Informacional amplio — TOFU | Transaccional | `como ahorrar dinero cada mes` | ahorrar dinero, trucos ahorro, tecnicas ahorro | Control de Gastos | Desconocido | Desconocido | P1 | Bajo | Enlazar a calculadora-ahorro y presupuesto-personal | Auditar después |
| `/herramientas/calculadora-inflacion` | ES | Herramienta | Sí | `https://www.metodokakebo.com/herramientas/calculadora-inflacion` | Transaccional — calcular pérdida poder adquisitivo | Informacional | `calculadora inflacion` | calculadora ipc, ipc 2026, inflación ahorros | Inflación / IPC | 353 impresiones · 1 clic · CTR 0,28% · pos 7,8 (optimizado SEO-CTR-INFLACION-01) | Desconocido | P1 | Bajo | Crear artículo blog de respaldo (gap editorial) | Auditar después |
| `/herramientas/regla-50-30-20` | ES | Herramienta | Sí | Verificar — posible `/es/` residual | Transaccional — dividir sueldo | Informacional | `calculadora 50 30 20` | regla 50 30 20, calculadora presupuesto, necesidades deseos ahorro | Regla 50/30/20 | Datos pre-optimización desconocidos (optimizado SEO-503020-CALCULADORA-01) | Desconocido | P1 | Bajo | Crear artículo blog de respaldo (gap editorial) | Auditar después |
| `/herramientas/calculadora-ahorro` | ES | Herramienta | Sí | Verificar — posible `/es/` residual | Transaccional — plan de ahorro mensual | Informacional | `calculadora de ahorro mensual` | cuanto ahorrar al mes, simulador ahorro, plan ahorro | Control de Gastos | 39 impresiones · 14 clics · CTR 35,9% · pos 8,97 (optimizado SEO-AHORRO-CALCULADORA-01) | Desconocido | **P0** | Bajo | Monitorizar — CTR excelente para su posición | Esperar datos |
| `/privacy` | ES | Legal | Sí | `https://www.metodokakebo.com/privacy` | Navegacional | — | — | — | Legal | — | — | P3 | Ninguno | No tocar | No tocar |
| `/terms` | ES | Legal | Sí | `https://www.metodokakebo.com/terms` | Navegacional | — | — | — | Legal | — | — | P3 | Ninguno | No tocar | No tocar |
| `/cookies` | ES | Legal | Sí | `https://www.metodokakebo.com/cookies` | Navegacional | — | — | — | Legal | — | — | P3 | Ninguno | No tocar | No tocar |
| `/tutorial` | ES | Onboarding | Sí (limitado) | `https://www.metodokakebo.com/tutorial` | Navegacional / onboarding app | — | — | — | App | — | — | P3 | Bajo | Sin prioridad SEO | No tocar |
| `/sobre-nosotros` | ES | Institucional | Sí | `https://www.metodokakebo.com/sobre-nosotros` | Navegacional / marca | — | `sobre nosotros kakebo` | quien hace kakebo | Marca | — | — | P3 | Bajo | Schema Organization ya implementado | No tocar |
| `/login` | ES | Conversión | Sí (limitado) | `https://www.metodokakebo.com/login` | Transaccional — alta | — | — | — | App | — | — | P2 | Bajo | No indexar activamente | No tocar |

**Total URLs ES inventariadas en tabla maestra: 27**

---

## 5. Clasificación por clusters

### Cluster 1 — Kakebo Excel (P0)

| URL | Estado | Prioridad |
|---|---|---|
| `/blog/plantilla-kakebo-excel` | ✅ Activa — **URL ganadora del sitio** | P0 |

**URLs del cluster faltantes:**
- `/blog/plantilla-kakebo-google-sheets` — long-tail con volumen real
- `/herramientas/plantilla-kakebo-excel` — herramienta interactiva alternativa a la descarga
- Artículo "plantilla kakebo excel vs app" — comparativa BOFU

**Fortalezas del cluster:** JSON-LD `SoftwareApplication` único, descarga real `.xlsx`, FAQPage con 5 preguntas, compatibilidad Google Sheets mencionada.

**Riesgo principal:** Meta title truncado (~93 chars), H3 antes de primer H2.

**Próximas tareas:** `SEO-EXCEL-TITLE-01` (alta), `SEO-EXCEL-H3-FIX-01` (media), `SEO-EXCEL-INTERNAL-LINKS-01` (media).

---

### Cluster 2 — Kakebo Online / App (P1)

| URL | Estado | Prioridad |
|---|---|---|
| `/` | ✅ Activa — optimizada SEO-HOME-KAKEBO-APP-01 | P1 |
| `/blog/kakebo-online-gratis` | ✅ Activa | P1 |
| `/blog/kakebo-online-guia-completa` | ✅ Activa | P1 |

**Riesgo principal:** Posible canibalización entre `kakebo-online-gratis` y `kakebo-online-guia-completa` por queries de "kakebo online". Interferencia de versión EN de `kakebo-online-gratis` (DUDOSO — pendiente datos GSC adicionales).

**Próximas tareas:** Validar canibalización con datos GSC reales. Diferenciar intenciones entre ambos artículos si se confirma solapamiento.

---

### Cluster 3 — Herramientas de Ahorro (P0-P1)

| URL | Estado | GSC conocido | Prioridad |
|---|---|---|---|
| `/herramientas/calculadora-ahorro` | ✅ Activa + optimizada SEO-AHORRO-CALCULADORA-01 | CTR 35,9% · pos 8,97 · 39 imp | **P0** |
| `/herramientas/regla-50-30-20` | ✅ Activa + optimizada SEO-503020-CALCULADORA-01 | Sin datos post-optimización | P1 |
| `/herramientas/calculadora-inflacion` | ✅ Activa + optimizada SEO-CTR-INFLACION-01 | CTR 0,28% · pos 7,8 · 353 imp | P1 |
| `/herramientas` (hub) | ✅ Activa — sin contenido editorial | Sin datos | P2 |

**Gap crítico:** Ninguna de las 3 herramientas tiene un artículo de blog de respaldo en el roadmap activo. Las herramientas reciben tráfico transaccional directo pero no capturan tráfico informacional.

**Riesgo técnico pendiente:** Canonical de `calculadora-ahorro` y `regla-50-30-20` puede tener `/es/` residual — verificar en producción.

---

### Cluster 4 — Presupuesto Personal (P1)

| URL | Estado | Prioridad |
|---|---|---|
| `/blog/como-hacer-un-presupuesto-personal` | ✅ Activa — reciente (2026-06-22) | P1 |
| `/herramientas/calculadora-ahorro` | Shared con Cluster 3 | P0 |
| `/herramientas/regla-50-30-20` | Shared con Cluster 3 | P1 |

**Gap principal:** Artículo reciente sin tracción conocida. Necesita período de indexación + datos GSC antes de optimizar.

---

### Cluster 5 — Inflación / IPC (P1)

| URL | Estado | Prioridad |
|---|---|---|
| `/herramientas/calculadora-inflacion` | ✅ Activa + optimizada | P1 |

**Gap crítico:** Sin artículo editorial de respaldo. La calculadora tiene el schema más robusto del sitio pero no captura queries informacionales como "cómo afecta la inflación al ahorro" o "IPC y poder adquisitivo".

---

### Cluster 6 — Regla 50/30/20 (P1)

| URL | Estado | Prioridad |
|---|---|---|
| `/herramientas/regla-50-30-20` | ✅ Activa + optimizada | P1 |

**Gap crítico:** Sin artículo editorial de respaldo. El cluster tiene solo la herramienta, sin cobertura informacional.

---

### Cluster 7 — Alternativas a Apps Bancarias / Fintonic (P1)

| URL | Estado | GSC conocido | Prioridad |
|---|---|---|---|
| `/blog/alternativas-a-app-bancarias` | ✅ Activa + optimizada CTR | 310 imp · 2 clics · CTR 0,65% | P1 |
| `/blog/peligros-apps-ahorro-automatico` | ✅ Activa | Desconocido | P2 |

**Oportunidad:** CTR muy bajo (0,65%) para el volumen de impresiones. La optimización del title (SEO-CTR-FINTONIC-01) puede mejorar esto — monitorizar.

---

### Cluster 8 — Finanzas Personales Generales (P1-P2)

| URL | Estado | Prioridad |
|---|---|---|
| `/blog/metodo-kakebo-guia-definitiva` | ✅ Activa — debe ser hub de cluster | P1 |
| `/blog/kakebo-vs-ynab` | ✅ Activa | P2 |
| `/blog/kakebo-sueldo-minimo` | ✅ Activa | P2 |
| `/blog/eliminar-gastos-hormiga` | ✅ Activa | P2 |
| `/blog/ahorro-pareja` | ✅ Activa | P2 |
| `/blog/metodo-kakebo-para-autonomos` | ✅ Activa | P2 |
| `/blog/como-ahorrar-dinero-cada-mes` | ✅ Activa — TOFU amplio | P1 |
| `/blog/regla-30-dias` | ✅ Activa | P2 |
| `/blog/libro-kakebo-pdf` | ✅ Activa | P2 |

**Riesgo principal:** `metodo-kakebo-guia-definitiva` debería ser el hub del sitio pero probablemente recibe poco enlazado interno desde los artículos de cluster.

---

### Cluster 9 — Legal / Institucional (P3)

| URL | Estado | Prioridad |
|---|---|---|
| `/privacy` | ✅ Activa | P3 — no tocar |
| `/terms` | ✅ Activa | P3 — no tocar |
| `/cookies` | ✅ Activa | P3 — no tocar |
| `/sobre-nosotros` | ✅ Activa | P3 — no tocar |

---

### Cluster 10 — Legacy EN (Congelado — DOC-I18N-01)

| Problema | Estado |
|---|---|
| 14 de 16 slugs EN están en español | No corregir — política activa |
| `/en/blog/kakebo-online-complete-guide` es el único con slug EN real | Monitorizar |
| Posible interferencia EN sobre ES en `kakebo-online-gratis` | Pendiente datos GSC adicionales |
| `/en/blog/plantilla-kakebo-excel` — interferencia potencial con URL principal | Tarea `SEO-EXCEL-EN-VALIDATE-01` propuesta |

---

## 6. URLs con tracción real

*(Basado en datos GSC/GA4 documentados en PROJECT_STATUS.md y tareas anteriores)*

| URL | Señal conocida | Fuente |
|---|---|---|
| `/blog/plantilla-kakebo-excel` | Principal landing orgánica, mayor concentración de clics GSC | GA4 + GSC (no cuantificado con números exactos) |
| `/herramientas/calculadora-ahorro` | CTR 35,9% · pos media 8,97 · 39 imp | GSC (SEO-AHORRO-CALCULADORA-01) |
| `/herramientas/calculadora-inflacion` | 353 imp · 1 clic · CTR 0,28% · pos 7,8 | GSC (SEO-CTR-INFLACION-01) |
| `/blog/alternativas-a-app-bancarias` | 310 imp · 2 clics · CTR 0,65% · pos 7,95 | GSC (SEO-CTR-FINTONIC-01) |

**Nota:** `/herramientas/calculadora-ahorro` tiene el mejor CTR del sitio (35,9%) para su nivel de posición. Es una señal positiva de intención de búsqueda muy alineada con el contenido.

---

## 7. URLs con potencial pero poca tracción conocida

| URL | Razón del potencial | Acción sugerida |
|---|---|---|
| `/blog/como-hacer-un-presupuesto-personal` | Pilar de cluster presupuesto, keyword de alto volumen, publicado 2026-06-22 | Esperar indexación y primeros datos GSC |
| `/herramientas/regla-50-30-20` | Keyword con volumen constante, herramienta interactiva, recién optimizada | Monitorizar GSC post-optimización |
| `/blog/como-ahorrar-dinero-cada-mes` | TOFU amplio, keyword de alto volumen | Enlazado interno hacia calculadora-ahorro |
| `/blog/kakebo-online-gratis` | Keyword de altísimo volumen en ES | Vigilar interferencia EN; diferenciación vs `kakebo-online-guia-completa` |
| `/blog/metodo-kakebo-guia-definitiva` | Debe ser el hub del sitio | Reforzar con enlazado entrante desde todo el cluster |

---

## 8. URLs de riesgo

| URL | Tipo de riesgo | Gravedad | Estado |
|---|---|---|---|
| `/blog/plantilla-kakebo-excel` | Meta title truncado (~93 chars) afecta CTR | Media | Tarea propuesta: `SEO-EXCEL-TITLE-01` |
| `/blog/plantilla-kakebo-excel` | H3 antes de primer H2 (jerarquía rota) | Baja | Tarea propuesta: `SEO-EXCEL-H3-FIX-01` |
| `/blog/kakebo-online-gratis` | Posible interferencia EN vs ES (DUDOSO) | Media | Pendiente: `SEO-I18N-EN-SLUG-FIX-01` |
| `/blog/kakebo-online-gratis` + `/blog/kakebo-online-guia-completa` | Posible canibalización por `kakebo online` | Media | Verificar con datos GSC |
| `/herramientas/calculadora-ahorro` + `/herramientas/regla-50-30-20` | Canonical posiblemente con `/es/` residual | Media | Verificar en producción |
| `/app/*` + `/auth/*` | No están en `Disallow` en robots.txt | Baja-Media | Sin tarea asignada — flagged desde 2026-06-17 |
| Legacy EN slugs en español | Sin tracción EN real, posible ruido SEO | Baja | Congelado — política DOC-I18N-01 |

---

## 9. URLs que no conviene tocar ahora

| URL | Razón |
|---|---|
| `/blog/plantilla-kakebo-excel` — slug | URL ganadora — cambio de slug es riesgo crítico |
| `/blog/plantilla-kakebo-excel` — H1, keywords, estructura | Funciona — no cambiar lo que posiciona |
| Todos los slugs ES de blog activos | Sin 301 redirect validado, no tocar slugs que ya posicionan |
| hreflang y canonical de blog posts | Corregidos y verificados — no tocar |
| `/herramientas/calculadora-ahorro` — contenido y schema | CTR 35,9% es señal de alineación excelente — no tocar |
| `/docs/Plantilla_Kakebo_Simplificada.xlsx` | URL de descarga referenciada — no mover ni renombrar |
| Todas las páginas legales | Sin impacto SEO relevante — no consumir tiempo |
| Legacy EN | Política DOC-I18N-01 — no tocar |

---

## 10. Estado del SEO técnico (actualizado a 2026-06-30)

| Elemento | Estado | Observación |
|---|---|---|
| Canonical ES blog posts | ✅ Correcto (`/blog/[slug]` sin `/es/`) | Corregido desde mapa anterior |
| hreflang blog posts | ✅ Correcto (ES sin prefijo, EN con `/en/`) | Verificado en `page.tsx` |
| Canonical herramientas (inflacion) | ✅ Correcto | Sin prefijo `/es/` |
| Canonical herramientas (regla-50-30-20, calculadora-ahorro) | ⚠ Verificar | Posible residuo `/es/` — no revisado post-optimización |
| hreflang `kakebo-online-guia-completa` | ⚠ Riesgo | Slug EN diferente (`kakebo-online-complete-guide`) → hreflang puede apuntar a 404 |
| robots.txt | ⚠ Pendiente | `/app/*` y `/auth/*` no en `Disallow` — desperdicio crawl budget |
| Sitemap | ✅ Dinámico | Generado en `sitemap.ts` — incluye ES + EN con hreflang |
| Schema blog posts | ✅ BlogPosting + BreadcrumbList + FAQPage | `SoftwareApplication` solo en `plantilla-kakebo-excel` |
| Schema herramientas | ✅ SoftwareApplication en las 3 | `calculadora-inflacion` tiene el más completo |
| Schema home | ⚠ Sin schema JSON-LD | Oportunidad: `Organization` + `WebSite` con SearchAction |
| Schema blog index | ⚠ Sin schema JSON-LD | Oportunidad: `CollectionPage` |
| GA4 | ✅ Integrado (MED-01) | `src/components/analytics/GoogleAnalytics.tsx` |
| Open Graph | ✅ Implementado globalmente | Imágenes de artículos usan rutas relativas — verificar resolución en producción |
| Redirect `/es/*` → `/*` | ✅ Configurado en `next.config.ts` | Validado en SEO-I18N-KAKEBO-ONLINE-VALIDATE-01 |

---

## 11. Gaps detectados

### Gaps editoriales

| Gap | Impacto estimado | Cluster |
|---|---|---|
| Sin artículo de respaldo para `/herramientas/calculadora-inflacion` | Alto — la herramienta no captura tráfico informacional | Inflación / IPC |
| Sin artículo de respaldo para `/herramientas/regla-50-30-20` | Alto — mismo problema | Regla 50/30/20 |
| Sin artículo de respaldo para `/herramientas/calculadora-ahorro` | Medio — el cluster de presupuesto cubre parcialmente | Control de Gastos |
| Sin comparativa directa "kakebo vs fintonic" | Medio — tráfico de marca de competidor de alta intención | Alternativas |
| Sin artículo "plantilla kakebo google sheets" | Medio — variante semántica con búsquedas propias | Kakebo Excel |

### Gaps de enlazado interno

| Gap | Impacto | Acción sugerida |
|---|---|---|
| `plantilla-kakebo-excel` no enlaza a `/herramientas/regla-50-30-20` | Alto — herramienta relacionada con presupuesto | `SEO-EXCEL-INTERNAL-LINKS-01` |
| `como-hacer-un-presupuesto-personal` sin verificar enlazado a herramientas | Alto — artículo pilar reciente | Auditar |
| `metodo-kakebo-guia-definitiva` no recibe suficientes enlaces internos | Alto — hub de cluster sin refuerzo | Mapeado como tarea P1 |
| Artículos de Control de Gastos sin enlace a `calculadora-ahorro` | Medio | Auditar `regla-30-dias`, `como-ahorrar-dinero-cada-mes` |

### Gaps técnicos

| Gap | Impacto | Acción sugerida |
|---|---|---|
| robots.txt no bloquea `/app/*` ni `/auth/*` | Crawl budget desperdiciado | Tarea técnica pendiente |
| Home sin schema JSON-LD | Medio — oportunidad de sitelinks | Añadir `Organization` + `WebSite` |
| `dateModified` en blog posts congelado en `datePublished` | Baja-media | Añadir campo `updatedDate` en frontmatter |

---

## 12. Hipótesis para auditoría SEO/GEO profunda posterior

1. **`/blog/kakebo-online-gratis` está siendo superado por su versión EN en GSC** — La validación `SEO-I18N-KAKEBO-ONLINE-VALIDATE-01` lo marcó como "DUDOSO". Si se confirma con datos, sería el segundo caso de interferencia EN→ES después del artículo de `kakebo-online-gratis`.

2. **`/blog/kakebo-online-guia-completa` y `/blog/kakebo-online-gratis` están canibalizando el mismo cluster de keywords** — Los títulos y la intención informacional son muy similares. Un análisis de GSC por query podría confirmar si Google alterna entre ambas URLs para las mismas búsquedas.

3. **`/herramientas/calculadora-ahorro` con CTR 35,9% es anómalo positivo** — Un CTR de ese nivel para una posición media de 8,97 es excepcional. Sugiere que el snippet está extremadamente alineado con la intención. Esta URL merece una auditoría detallada similar a `SEO-PILLAR-EXCEL-AUDIT-01` para entender qué la hace tan efectiva y replicar el patrón.

4. **El artículo `como-hacer-un-presupuesto-personal` puede convertirse en el segundo pilar orgánico** — Fue publicado en 2026-06-22 con estructura de pilar completo (9 enlaces internos, 2 herramientas, JSON-LD completo). Monitorizar con GSC a partir de 4-6 semanas post-publicación.

5. **GEO (Generative Engine Optimization) como oportunidad emergente** — Las páginas con FAQPage JSON-LD y estructura de Q&A (plantilla-kakebo-excel, como-hacer-un-presupuesto-personal) tienen ventaja natural en entornos de respuesta generativa (AI Overviews, Perplexity, ChatGPT). Evaluar optimización GEO en una fase posterior.

---

## 13. Próximas tareas recomendadas

### Inmediatas (P0 — alta confianza, bajo riesgo)

| ID | Tarea | URL afectada | Justificación |
|---|---|---|---|
| `SEO-EXCEL-TITLE-01` | Acortar meta title a <65 chars | `/blog/plantilla-kakebo-excel` | Meta title ~93 chars truncado en SERP — impacto directo en CTR de URL principal |
| `SEO-ROBOTS-01` | Añadir `Disallow: /app/` y `Disallow: /auth/` a robots.txt | `robots.txt` / `robots.ts` | Crawl budget desperdiciado — flagged desde 2026-06-17 sin resolver |

### Corto plazo (P1 — esperar datos GSC antes de ejecutar)

| ID | Tarea | URL afectada | Condición |
|---|---|---|---|
| `SEO-EXCEL-H3-FIX-01` | Convertir H3 inicial a H2 en plantilla-kakebo-excel | `/blog/plantilla-kakebo-excel` | Ejecutar tras confirmar datos GSC actuales |
| `SEO-EXCEL-INTERNAL-LINKS-01` | Añadir enlaces a `/herramientas/regla-50-30-20` y segundo link a `calculadora-ahorro` en body | `/blog/plantilla-kakebo-excel` | Bajo riesgo — ejecutar |
| `SEO-INFLACION-BLOG-01` | Crear artículo editorial de respaldo para calculadora-inflacion | `/blog/inflacion-y-ahorros` (nueva URL) | Esperar priorización con datos GSC |
| `SEO-5030-BLOG-01` | Crear artículo editorial de respaldo para regla-50-30-20 | `/blog/regla-50-30-20` (nueva URL) | Esperar priorización con datos GSC |
| `SEO-CANONICAL-TOOLS-01` | Verificar y corregir canonical de `calculadora-ahorro` y `regla-50-30-20` si tienen `/es/` residual | Ambas herramientas | Verificar primero en producción |
| `SEO-EXCEL-EN-VALIDATE-01` | Revisar en GSC si versión EN de `plantilla-kakebo-excel` interfiere con ES | `/en/blog/plantilla-kakebo-excel` | Análogo a `SEO-I18N-KAKEBO-ONLINE-VALIDATE-01` |
| `SEO-DATA-PRIORITY-01` | Priorizar todo el roadmap SEO con datos reales actualizados de GSC | Todo el sitio | **Prerequisito** antes de abrir nuevas tareas de contenido |

### Medio plazo (P2 — no ejecutar sin SEO-DATA-PRIORITY-01)

| ID | Tarea | URL afectada |
|---|---|---|
| `SEO-HOME-SCHEMA-01` | Añadir `Organization` + `WebSite` (con SearchAction) a la home | `/` |
| `SEO-EXCEL-INBOUND-PILAR-01` | Añadir enlace entrante desde `como-hacer-un-presupuesto-personal` y `kakebo-online-gratis` | `/blog/plantilla-kakebo-excel` |
| `SEO-KAKEBO-ONLINE-CANIB-01` | Auditar canibalización entre `kakebo-online-gratis` y `kakebo-online-guia-completa` | Ambas URLs |
| `SEO-CALCULADORA-AHORRO-AUDIT-01` | Auditoría detallada de `calculadora-ahorro` (CTR anómalo — entender por qué) | `/herramientas/calculadora-ahorro` |

---

## 14. Resumen de inventario

| Categoría | URLs ES | URLs EN legacy | Total |
|---|---|---|---|
| Artículos de blog ES | 15 | 16 | 31 |
| Herramientas | 3 + 1 hub = 4 | 4 (legacy) | 8 |
| Páginas principales | 5 | 5 | 10 |
| Páginas legales | 3 | 3 | 6 |
| App (no indexables) | ~13 | ~13 | ~26 |
| Recursos descargables | 1 | — | 1 |
| **Total indexables ES** | **27** | — | — |
| **Total inventariado** | — | — | **~82** |

**Clusters activos:** 10  
**URLs con tracción documentada:** 4  
**URLs con riesgo activo:** 7  
**Gaps editoriales críticos:** 5  
**Tareas futuras mapeadas:** 15

---

*SEO_MAP_V1.md (docs/seo/) — generado 2026-06-30 — Sustituye a SEO_MAP_V1.md (raíz, 2026-06-17)*  
*Basado en análisis de código fuente commit `e8075b5` + datos documentados de GSC/GA4.*  
*No implementar cambios hasta confirmar prioridades con SEO-DATA-PRIORITY-01.*
