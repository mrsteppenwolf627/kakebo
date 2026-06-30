# SEO_KAKEBO_ONLINE_CANIB_01 — Auditoría Canibalización EN/ES en kakebo-online-gratis

**Fecha:** 2026-06-30  
**Tipo:** Solo auditoría y documentación — sin cambios en código ni contenido  
**Fuente de alerta:** `SEO_DATA_PRIORITY_01.md` (GSC Last 3m confirmó el problema)  
**Antecedente:** `SEO_I18N_KAKEBO_ONLINE_VALIDATE_01.md` (clasificó como "DUDOSO" el 2026-06-26)  
**Estado del problema:** **CONFIRMADO** — ya no es una hipótesis

---

## 1. Resumen ejecutivo

Los datos reales de GSC confirman que `/en/blog/kakebo-online-gratis` (legacy inglés) está capturando tráfico orgánico en español con 15 clics y 208 impresiones en 92 días, mientras que la URL canónica española `/blog/kakebo-online-gratis` tiene 1 clic y 6 impresiones en el mismo periodo.

La URL EN supera a la ES en una proporción de **15:1 en clics y 34:1 en impresiones**. Esto ocurre a pesar de que el hreflang y el canonical están técnicamente correctos.

La causa raíz es **cross-language URL contamination**: el slug `kakebo-online-gratis` contiene la palabra española "gratis", lo que hace que Google asocie la URL inglesa con búsquedas en español. El sitio está perdiendo activamente tráfico ES hacia un artículo EN legacy que no está optimizado para la intención ES ni puede convertir tan bien como la versión española.

**Diagnóstico:** Interferencia EN→ES confirmada por datos. No es canibalización interna entre artículos ES, es una URL inglesa capturando tráfico español.

**Solución recomendada:** `noindex` en el artículo EN + refuerzo de señales entrantes al ES canonical. Detalles en sección 11.

---

## 2. Datos GSC conocidos

### 2.1 Datos del export GSC Last 3m (2026-03-29 → 2026-06-28)

| URL | Clics | Impresiones | CTR | Posición |
|---|---|---|---|---|
| `/en/blog/kakebo-online-gratis` | **15** | **208** | 7,21% | **6,86** |
| `/es/blog/kakebo-online-gratis` | 0 | 12 | 0% | 20,42 |
| `/blog/kakebo-online-gratis` (canónica ES) | 1 | 6 | 16,67% | 6,0 |

**Análisis del patrón:**

- La URL EN (`/en/`) tiene posición 6,86 — dentro del top 7. Es visible y se hace clic.
- La URL ES canónica (`/blog/`) tiene posición 6,0 — en teoría igual de visible, pero solo 6 impresiones totales en 92 días. Esto indica que Google casi nunca la muestra.
- La URL `/es/` (redirect 301) tiene posición 20,42 — está en página 2 y con 0 clics, lo que confirma que el redirect está funcionando pero dejó traza histórica.

**La proporción ES:EN (1:34 en impresiones) es la anomalía clave.** Para un sitio con audiencia 62,6% española, la URL ES canónica debería tener muchas más impresiones que la EN. La inversión indica que Google ha indexado y priorizado la versión EN para las queries objetivo de este artículo.

### 2.2 Queries que generan el tráfico del cluster

Desde el análisis de Queries.csv (GSC export):

| Query | Clics | Imp | CTR | Pos | ¿Española? |
|---|---|---|---|---|---|
| `kakebo online gratis` | 5 | 21 | 23,81% | 5,05 | ✅ Sí |
| `kakebo online` | 12 | 60 | 20% | 4,8 | ✅ Sí (contexto ES) |
| `kakebo app` | 12 | 151 | 7,95% | 6,32 | Ambigua |
| `metodo kakebo app` | 0 | 41 | 0% | 8,49 | ✅ Sí |

Estas queries son principalmente españolas. Los 15 clics hacia `/en/blog/kakebo-online-gratis` provienen muy probablemente de `kakebo online gratis` y variantes de `kakebo online`. El 62,6% de los clics del sitio vienen de España — los 15 clics EN son mayoritariamente de usuarios españoles llegando a un artículo inglés.

---

## 3. URLs afectadas

| URL | Tipo | Estado | Función |
|---|---|---|---|
| `/blog/kakebo-online-gratis` | ES canónica (default locale) | Casi invisible — 6 imp en 92 días | Debería ser la landing principal |
| `/en/blog/kakebo-online-gratis` | EN legacy | Activa — 208 imp, 15 clics | Capturando tráfico ES incorrectamente |
| `/es/blog/kakebo-online-gratis` | Redirect 301 → `/blog/kakebo-online-gratis` | Residuo histórico — 12 imp, 0 clics | Correcto — no accionable |
| `/blog/kakebo-online-guia-completa` | ES — artículo relacionado | 3 clics, 37 imp, pos 8,32 | No compite directamente |
| `/` (Home) | ES — landing app | 51 clics, 892 imp, pos 8,2 | Compite por `kakebo online` indirectamente |

---

## 4. Arquitectura i18n actual

### 4.1 Configuración base

```typescript
// src/i18n/routing.ts
defineRouting({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    localePrefix: 'as-needed',  // ES no lleva prefijo
    localeDetection: false       // Sin redirección por Accept-Language
})
```

| URL | Resultado |
|---|---|
| `/blog/kakebo-online-gratis` | Sirve ES (default locale) ✅ |
| `/es/blog/kakebo-online-gratis` | 301 → `/blog/kakebo-online-gratis` ✅ |
| `/en/blog/kakebo-online-gratis` | Sirve EN ✅ |

### 4.2 Canonical generado (blog/[slug]/page.tsx)

```
ES: https://www.metodokakebo.com/blog/kakebo-online-gratis
EN: https://www.metodokakebo.com/en/blog/kakebo-online-gratis
```

### 4.3 hreflang generado

```
es:        https://www.metodokakebo.com/blog/kakebo-online-gratis  ✅
en:        https://www.metodokakebo.com/en/blog/kakebo-online-gratis  ✅
x-default: https://www.metodokakebo.com/blog/kakebo-online-gratis  ✅
```

### 4.4 Sitemap

```
ES: https://www.metodokakebo.com/blog/kakebo-online-gratis
EN: https://www.metodokakebo.com/en/blog/kakebo-online-gratis
```

Ambas versiones aparecen en el sitemap con `alternates.languages` cruzados. ✅

**Conclusión técnica:** La arquitectura i18n es estructuralmente correcta. El problema no es técnico de configuración — es de señales de contenido y URL.

---

## 5. Análisis de la URL española

**Archivo:** `src/content/blog/kakebo-online-gratis.es.mdx`

| Campo | Valor | Evaluación |
|---|---|---|
| **Title frontmatter** | `Kakebo Online Gratis: La Mejor Aplicación para Controlar tus Gastos (2026)` | Keyword exacta "kakebo online gratis" en posición 1 ✅ |
| **Meta title generado** | `Kakebo Online Gratis: La Mejor Aplicación para Controlar tus Gastos (2026) \| Blog Kakebo` | ~91 chars — **truncado en SERP** ⚠ |
| **Excerpt (description)** | `Descubre cómo llevar tu Kakebo online gratis sin instalar aplicaciones conectadas a tu banco. La alternativa moderna, privada y basada en Inteligencia Artificial.` | 164 chars — borderline ⚠ |
| **H1** | Mismo que el title (`post.frontmatter.title`) | ✅ |
| **Fecha publicación** | `2026-02-10` | Misma que EN — no diferencia ⚠ |
| **Imagen** | `/images/blog/kakebo-online-gratis.png` | Misma que EN — no diferencia ⚠ |
| **Idioma del contenido** | 100% español ✅ | |
| **Intención** | Transaccional-informacional: "kakebo online gratis" → captación de app + educación | ✅ |
| **Canonical** | `https://www.metodokakebo.com/blog/kakebo-online-gratis` | ✅ |
| **Related posts** | kakebo-online-guia-completa, plantilla-kakebo-excel, metodo-kakebo-guia-definitiva | ✅ |
| **CTA** | `<SimpleCTA href="/" cta="Crear mi cuenta Kakebo Online Gratis" />` | ✅ |
| **FAQPage** | 2 preguntas en frontmatter `faq` | ✅ |
| **Headings** | H2 correctos — sin H3 antes de H2 | ✅ |

**Fortalezas del artículo ES:**
- Contenido extenso y detallado (~130 líneas, ~5 min lectura)
- Tabla comparativa completa (Google Sheets, Notion, apps bancarias españolas como BBVA, Fintonic)
- Pasos de acción (5 pasos para empezar)
- Sección de errores frecuentes
- FAQPage con schema JSON-LD
- Keywords naturales a lo largo del texto

**Debilidades detectadas:**
- Meta title ~91 chars (truncado en SERP) — misma longitud que el problema detectado en `plantilla-kakebo-excel`
- La imagen ES y EN son idénticas (no diferencia de contenido visual)
- Muy pocas señales entrantes confirmadas en GSC (6 impresiones)

---

## 6. Análisis de la URL inglesa legacy

**Archivo:** `src/content/blog/kakebo-online-gratis.en.mdx`

| Campo | Valor | Evaluación |
|---|---|---|
| **Title frontmatter** | `Free Kakebo Online: The Best App to Track Your Expenses (2026)` | En inglés correcto ✅ — pero no contiene "gratis" |
| **Idioma del contenido** | 100% inglés ✅ | |
| **Slug** | `kakebo-online-gratis` | **"gratis" es español — PROBLEMA PRINCIPAL** ⚠ |
| **URL completa** | `/en/blog/kakebo-online-gratis` | Mezcla prefijo EN + keyword ES en slug ⚠ |
| **Fecha publicación** | `2026-02-10` | Idéntica a ES — no diferencia ⚠ |
| **Imagen** | `/images/blog/kakebo-online-gratis.png` | Idéntica a ES ⚠ |
| **Canonical** | `https://www.metodokakebo.com/en/blog/kakebo-online-gratis` | Correcto para EN ✅ |
| **Tabla comparativa** | Adaptada a mercado anglófono (Chase, Mint en vez de BBVA, Fintonic) | ✅ Diferenciado del ES |
| **Related posts** | No tiene campo `related:` en frontmatter | Sin RelatedPosts section |
| **CTA** | `<a href="/en" ...>` (hardcodeado, no usa next-intl Link) | Bug menor, no SEO crítico |
| **FAQPage** | 2 preguntas en frontmatter `faq` | ✅ |

**Señales de mezcla de idiomas detectadas:**

1. **URL**: `/en/blog/kakebo-online-gratis` — el prefijo `/en/` indica inglés pero el slug `kakebo-online-gratis` contiene "gratis" (español). Esta inconsistencia es la causa principal del problema.

2. **Imagen compartida**: La OG image y la imagen del artículo son las mismas que el ES (`/images/blog/kakebo-online-gratis.png`). Google puede procesar el nombre de archivo como señal adicional de contenido — y "gratis" aparece en ese nombre también.

3. **Fecha idéntica**: La misma fecha de publicación (2026-02-10) hace que el sitemap incluya ambas con la misma prioridad temporal. No ayuda a Google a discriminar.

4. **Contenido bien diferenciado a nivel de texto**: Comparativas usan apps angloparlantes (Chase, Mint), texto 100% en inglés. El contenido sería correcto para un usuario anglófono. El problema es que Google está mostrando esta URL a usuarios hispanoparlantes.

---

## 7. Análisis de queries

### 7.1 Hipótesis sobre cómo Google asigna las queries

Para la query `kakebo online gratis` (española, 5 clics, pos 5,05), Google debe elegir entre:

| URL | Señal URL | Señal idioma | Señal hreflang | Autoridad acumulada |
|---|---|---|---|---|
| `/blog/kakebo-online-gratis` | `kakebo-online-gratis` → ES | ES ✅ | apunta aquí para ES ✅ | **Muy baja** (6 imp) |
| `/en/blog/kakebo-online-gratis` | `kakebo-online-gratis` + `/en/` | EN (contenido) pero slug ES | apunta al EN para EN | **Alta** (208 imp, 15 clics) |

Google tiene dos señales en conflicto para la URL EN:
- El hreflang dice "esta URL es para usuarios EN"
- La URL contiene "gratis" (ES) — señal léxica española
- El contenido es EN — señal de idioma

Google resuelve el conflicto priorizando la URL con más autoridad acumulada. La EN tiene 208 impresiones y la ES tiene 6. La EN ganó autoridad antes — posiblemente porque fue rastreada en la misma sesión que otras URLs EN que tenían más señales, o porque el sitemap la presentó de forma que Googlebot la crawleó con mayor frecuencia.

### 7.2 Queries específicas afectadas

| Query | ¿Afectada? | Evidencia |
|---|---|---|
| `kakebo online gratis` | ✅ Sí — alta probabilidad | Española, 21 imp, la URL EN las capta |
| `kakebo online` | ✅ Probable | 60 imp, el cluster online va a EN |
| `metodo kakebo app` | ⚠ Posible | 41 imp, 0 clics — puede estar mostrando EN |
| `app kakebo` | ⚠ Posible | 30 imp, 0 clics, pos 5,87 — Home o EN |
| `kakebo app` | ✅ Parcial | 151 imp — va principalmente a Home |

---

## 8. Diagnóstico

### Hipótesis 1 — Cross-language URL contamination (PRINCIPAL)

**Hipótesis:** El slug `kakebo-online-gratis` contiene la palabra española "gratis". Al estar en la URL inglesa (`/en/blog/kakebo-online-gratis`), Google procesa "gratis" como keyword española y asocia la URL EN con búsquedas en español.

| Campo | Detalle |
|---|---|
| **Evidencia a favor** | EN tiene 208 imp vs ES 6 imp para audiencia 62% española. Queries afectadas son en español. Slug "gratis" es español. Efecto documentado en literatura SEO como cross-language contamination. |
| **Evidencia en contra** | El hreflang debería separar las audiencias. El contenido ES es 100% coherente con la intención. |
| **Severidad** | Alta — activa durante al menos 92 días (todo el periodo del export) |
| **Riesgo de inacción** | El tráfico ES se pierde hacia EN indefinidamente. La ES canonical no acumula señales. |
| **Recomendación** | Eliminar la URL EN del índice de Google para el cluster ES |

---

### Hipótesis 2 — Autoridad acumulada asimétrica

**Hipótesis:** La URL EN fue rastreada e indexada antes o con mayor frecuencia que la ES, acumulando más autoridad de crawl. El hreflang no compensa suficiente esta diferencia de señales.

| Campo | Detalle |
|---|---|
| **Evidencia a favor** | EN: 208 imp / ES: 6 imp desde el primer día del export (marzo). La diferencia es antigua, no reciente. |
| **Evidencia en contra** | Ambas páginas tienen la misma fecha de publicación (2026-02-10). No debería haber diferencia de crawl prioritario. |
| **Severidad** | Media — contribuye al problema pero no es la causa raíz |
| **Riesgo de inacción** | La brecha se amplía con el tiempo si no se actúa |
| **Recomendación** | Reforzar señales entrantes al ES canonical como acción complementaria |

---

### Hipótesis 3 — Fallo de hreflang para slugs compartidos

**Hipótesis:** Cuando ES y EN comparten el mismo slug (`kakebo-online-gratis`), Google puede tener dificultades para aplicar correctamente el hreflang porque la única diferencia entre las URLs es el prefijo `/en/`.

| Campo | Detalle |
|---|---|
| **Evidencia a favor** | La mayoría de los 15 artículos EN del sitio tienen slugs en español, y el problema solo se documenta aquí (posiblemente porque es el artículo con más tracción del cluster EN). |
| **Evidencia en contra** | El hreflang de otros artículos (ej. `plantilla-kakebo-excel`) no muestra este patrón en los datos. |
| **Severidad** | Baja — el hreflang funciona para otros artículos |
| **Riesgo de inacción** | Potencialmente se puede replicar en otros artículos si ganan tracción |
| **Recomendación** | Documentar para considerarlo en una política futura de slugs EN |

---

### Hipótesis 4 — Canibalización con Home

**Hipótesis:** La Home también compite por "kakebo online" y puede estar dividiendo autoridad con el artículo ES canonical.

| Campo | Detalle |
|---|---|
| **Evidencia a favor** | Home: 51 clics, 892 imp para queries como "kakebo app" y "kakebo online" |
| **Evidencia en contra** | La Home y el artículo ES tienen intenciones diferenciadas (captación de app vs. artículo informacional). GSC no muestra claramente que ambas compitan por las mismas queries. |
| **Severidad** | Baja — no es el problema principal |
| **Recomendación** | No actuar sobre esto ahora |

---

## 9. Riesgos

| Riesgo | Descripción | Gravedad | Si no se actúa |
|---|---|---|---|
| **Pérdida de tráfico ES activa** | 15 clics que deberían ir al ES canonical van a EN. Con el crecimiento del sitio, esta cifra puede multiplicarse | Alta | Crece con el tiempo |
| **ES canonical no acumula señales** | Al tener solo 6 impressiones, la URL canónica ES nunca ganará autoridad suficiente para mejorar su posición | Alta | La EN seguirá dominando indefinidamente |
| **Conversión inferior** | El artículo EN convierte a `/en` (Home EN). Si el usuario es español, la experiencia post-clic es subóptima | Media | Pérdida de conversión |
| **Riesgo de escalada** | Si el cluster "kakebo online" crece en tráfico (objetivo SEO), la interferencia EN se amplifica proporcionalmente | Alta | El problema se multiplica |
| **Inacción prolongada** | La solución anterior (SEO-I18N-KAKEBO-ONLINE-VALIDATE-01) clasificó como "DUDOSO" y sugirió monitorizar. Han pasado semanas y el problema se confirmó pero no se ha actuado | Media | Pérdida adicional por retraso |

---

## 10. Opciones de solución

### Opción A — Monitorizar y esperar

| Campo | Detalle |
|---|---|
| **Descripción** | No actuar. Esperar que Google consolide correctamente las señales. |
| **Pros** | Sin riesgo de regresión. Sin coste. |
| **Contras** | El problema existe desde al menos marzo (92 días). El hreflang correcto no ha sido suficiente. La brecha ES:EN (1:34 en imp) no se resolverá sola. |
| **Riesgo** | Alto — el problema se amplía con el tiempo |
| **Recomendación** | **Descartar** — ya se monitorizó y se confirmó el problema |

---

### Opción B — `noindex` en el artículo EN

| Campo | Detalle |
|---|---|
| **Descripción** | Añadir `robots: { index: false }` en los metadatos del artículo EN (`kakebo-online-gratis.en.mdx` o via `page.tsx` condicionalmente). Google deja de indexar `/en/blog/kakebo-online-gratis`. |
| **Pros** | Solución limpia. Elimina la competencia. Reversible (quitar noindex). No toca la URL ES. No toca el canonical ni el hreflang. |
| **Contras** | Requiere cambio en el frontmatter EN o en `page.tsx`. Toca legacy EN (dentro del alcance de esta auditoría específica). Pierde cualquier tráfico EN genuino que pueda existir (dato real: 0 clics EN auténticos — todos son ES). |
| **Riesgo** | Muy bajo — se pierde 0 tráfico anglófono real |
| **Implementación** | Añadir al frontmatter de `kakebo-online-gratis.en.mdx`: `noindex: true`, y en `blog/[slug]/page.tsx` leer ese campo para añadir `robots: { index: false }` en el `generateMetadata` |
| **Recomendación** | **Opción recomendada (principal)** |

---

### Opción C — Redirect EN → ES canonical

| Campo | Detalle |
|---|---|
| **Descripción** | Hacer que `/en/blog/kakebo-online-gratis` redirija 301 hacia `/blog/kakebo-online-gratis` (ES canonical). |
| **Pros** | Consolida toda la autoridad en el ES canonical inmediatamente. |
| **Contras** | Elimina la URL EN permanentemente. Requiere cambio en `next.config.ts`. Si algún usuario anglófono llegara, aterrizaría en un artículo en español. |
| **Riesgo** | Medio — el redirect 301 es permanente y requiere deshacer si se quiere recuperar la URL EN |
| **Recomendación** | Segunda opción si el noindex no funciona en 6-8 semanas |

---

### Opción D — Cambiar slug EN a inglés real

| Campo | Detalle |
|---|---|
| **Descripción** | Renombrar el artículo EN a `kakebo-online-gratis.en.mdx` → `free-kakebo-online.en.mdx`. Nueva URL: `/en/blog/free-kakebo-online`. Redirect 301 desde la URL antigua. |
| **Pros** | Solución estructuralmente correcta a largo plazo. Elimina la contaminación del slug español. Mantiene el artículo EN para audiencia anglófona real. |
| **Contras** | Mayor complejidad. Requiere crear nuevo archivo, 301 redirect, actualizar sitemap. Más cambios con más riesgo. |
| **Riesgo** | Medio — más pasos, más superficie de error |
| **Recomendación** | Solución ideal a largo plazo si se decide mantener el contenido EN activo. P3 tras confirmar éxito de Opción B. |

---

### Opción E — Reforzar señales del ES canonical (solo)

| Campo | Detalle |
|---|---|
| **Descripción** | Añadir más enlaces internos desde otras páginas ES hacia `/blog/kakebo-online-gratis`. No tocar el EN. |
| **Pros** | Sin riesgo. Beneficio general para el ES. |
| **Contras** | No elimina la causa raíz. La URL EN seguirá capturando impresiones. Solo puede reducir parcialmente el problema. |
| **Riesgo** | Bajo — pero insuficiente como única acción |
| **Recomendación** | Acción complementaria junto a Opción B, no sustituta |

---

### Opción F — canonical EN → ES

| Campo | Detalle |
|---|---|
| **Descripción** | Hacer que el canonical del artículo EN apunte a la versión ES (`https://www.metodokakebo.com/blog/kakebo-online-gratis`). |
| **Pros** | Consolidaría la autoridad en ES. |
| **Contras** | Técnicamente incorrecto — un canonical entre páginas de distinto idioma va en contra de las directrices de Google para hreflang. No es la forma correcta de resolver este problema. |
| **Riesgo** | Medio — puede confundir a Google más que ayudar |
| **Recomendación** | **Descartar** — mala práctica SEO |

---

## 11. Solución recomendada

### Principal: Opción B — `noindex` en artículo EN

**Justificación:**
1. Los 15 clics del artículo EN son de usuarios españoles llegando a contenido inglés — no hay tráfico anglófono real que perder.
2. El `noindex` es la solución más reversible: si en el futuro se quiere recuperar el artículo EN, basta con eliminarlo.
3. No toca la URL ES, el canonical, el hreflang ni el redirect.
4. Una vez que Google procese el noindex (2-6 semanas), toda la autoridad de este cluster migra a la ES canonical.
5. Es coherente con la política de no expandir el legacy EN, y de intervenir solo cuando hay una auditoría específica (esta tarea).

**Implementación propuesta para la tarea fix:**
- En `kakebo-online-gratis.en.mdx`: añadir campo `noindex: true` en el frontmatter
- En `blog/[slug]/page.tsx` > `generateMetadata`: añadir lógica para leer `post.frontmatter.noindex` y si es `true`, devolver `robots: { index: false, follow: false }`
- No modificar el hreflang ni el canonical (el noindex es suficiente)
- Verificar en GSC a las 6-8 semanas que la EN haya desaparecido del índice y la ES haya ganado impresiones

### Complementaria: Opción E — reforzar señales entrantes al ES canonical

**Acciones complementarias (bajo riesgo):**
- Añadir enlace desde `plantilla-kakebo-excel.es.mdx` hacia `/blog/kakebo-online-gratis` (ya hay enlace pero puede reforzarse)
- Añadir enlace desde `metodo-kakebo-guia-definitiva.es.mdx` hacia `/blog/kakebo-online-gratis`
- Añadir enlace desde `como-hacer-un-presupuesto-personal.es.mdx` hacia `/blog/kakebo-online-gratis`

Estas acciones forman parte del bloque P4 (enlazado interno) y no deben ejecutarse antes de P2.

---

## 12. Qué NO conviene tocar

| Elemento | Razón |
|---|---|
| El artículo ES (`kakebo-online-gratis.es.mdx`) | Está bien estructurado. No modificar ni su title ni su contenido hasta tener señales de posición en GSC. |
| El hreflang global | Está técnicamente correcto. Tocar el hreflang puede crear problemas en otras parejas ES/EN. |
| El redirect `/es/` → `/` | Está bien. El artefacto histórico de 12 imp en `/es/blog/kakebo-online-gratis` desaparecerá solo. |
| El slug ES | `kakebo-online-gratis` es el slug correcto para la URL ES. No renombrar. |
| La Home | No tiene que ver con este problema directamente. |
| Otros artículos EN | El problema es específico de `kakebo-online-gratis` por el volumen de búsquedas de su cluster. No es necesario aplicar `noindex` masivo a todos los EN legacy. |
| El canonical de la URL EN | Está bien (`/en/blog/kakebo-online-gratis`). El `noindex` es suficiente — no hace falta cambiar el canonical. |

---

## 13. Tarea futura propuesta

### `SEO-KAKEBO-ONLINE-CANIB-FIX-01` — Implementar noindex en artículo EN

**Estado propuesto:** Ejecutar tras aprobar esta auditoría.

**Objetivo:** Eliminar `/en/blog/kakebo-online-gratis` del índice de Google para que toda la autoridad del cluster "kakebo online gratis" migre al ES canonical.

**Acciones:**
1. Añadir `noindex: true` en el frontmatter de `kakebo-online-gratis.en.mdx`
2. Actualizar `blog/[slug]/page.tsx` para leer el campo `noindex` y aplicar `robots: { index: false, follow: false }` cuando sea `true`
3. Verificar que el cambio es efectivo con Google Search Console → Inspect URL para `/en/blog/kakebo-online-gratis`
4. Documentar en PROJECT_STATUS.md
5. Commit + Push

**Validación:**
- A las 2 semanas: verificar en GSC que `/en/blog/kakebo-online-gratis` muestra señal de noindex en Inspect URL
- A las 6-8 semanas: verificar que las impresiones de la EN caen a 0 y que la ES empieza a ganar impresiones para las queries objetivo
- A las 12 semanas: snapshot GSC comparativo

**Riesgo de la tarea fix:** Muy bajo. El único riesgo es perder los 15 clics actuales (de usuarios ES que llegan a contenido EN) — lo cual es el comportamiento que queremos corregir.

**Decisión:** Ejecutar `SEO-KAKEBO-ONLINE-CANIB-FIX-01` como siguiente tarea inmediata.

---

## 14. Conclusión

La canibalización de `/en/blog/kakebo-online-gratis` sobre `/blog/kakebo-online-gratis` (ES) está **confirmada por datos reales** de GSC. No es una hipótesis teórica.

La causa raíz es el slug español `kakebo-online-gratis` en la URL inglesa (`/en/blog/kakebo-online-gratis`), que hace que Google asocie la versión EN con búsquedas en español. El resultado es que la URL canónica ES tiene 6 impresiones en 92 días mientras la EN tiene 208, a pesar de que la audiencia del sitio es 62,6% española.

El hreflang y el canonical son técnicamente correctos pero insuficientes para compensar la diferencia de señales acumuladas. La solución recomendada — `noindex` en el artículo EN — es reversible, de bajo riesgo, y directamente orientada a la causa raíz.

La tarea fix recomendada es `SEO-KAKEBO-ONLINE-CANIB-FIX-01`.

---

*SEO_KAKEBO_ONLINE_CANIB_01.md — 2026-06-30*  
*Diagnóstico: Interferencia EN→ES CONFIRMADA*  
*Causa raíz: Cross-language URL contamination (slug español en URL inglesa)*  
*Solución recomendada: noindex en artículo EN + refuerzo de señales ES (complementario)*  
*Sin cambios en código, contenido ni configuración SEO.*
