# SEO-I18N-KAKEBO-ONLINE-VALIDATE-01
## Validación de interferencia SEO entre versiones ES/EN de Kakebo Online

**Fecha:** 2026-06-26  
**Tipo:** Tarea de validación — sin cambios en código ni contenido  
**Commit:** pendiente

---

## Señal de partida (Search Console)

| URL | Impresiones | Clics | Observación |
|---|---|---|---|
| `/en/blog/kakebo-online-gratis` | altas | con clics | Supera a la versión española |
| `/es/blog/kakebo-online-gratis` | bajas | bajas | Aparece con pocas señales |
| `/blog/kakebo-online-gratis` | — | — | URL canónica ES (sin prefijo) |

---

## URLs analizadas

1. `/blog/kakebo-online-gratis` — ES canónica (sin prefijo, default locale)
2. `/es/blog/kakebo-online-gratis` — URL con prefijo explícito español
3. `/en/blog/kakebo-online-gratis` — URL inglesa
4. `/es/blog/kakebo-online-guia-completa` — URL variante español con prefijo

---

## Configuración i18n revisada

### `src/i18n/routing.ts`

```typescript
defineRouting({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    localePrefix: 'as-needed',   // ES no necesita prefijo
    localeDetection: false        // Sin redireccionamiento por Accept-Language
})
```

**Resolución de URLs por el middleware (next-intl):**

| URL solicitada | Resultado |
|---|---|
| `/blog/kakebo-online-gratis` | Sirve versión ES (locale por defecto) ✅ |
| `/es/blog/kakebo-online-gratis` | 301 → `/blog/kakebo-online-gratis` ✅ |
| `/en/blog/kakebo-online-gratis` | Sirve versión EN ✅ |

### `next.config.ts`

Contiene redirects explícitos:

```javascript
{ source: "/es",       destination: "/",        permanent: true },
{ source: "/es/:path*", destination: "/:path*", permanent: true },
```

**Conclusión:** El 301 desde `/es/*` → `/*` está correctamente definido a nivel de Next.js config, ANTES del middleware de next-intl.

---

## Canonical y hreflang generados

Fuente: `src/app/[locale]/(public)/blog/[slug]/page.tsx` (línea 49)

```javascript
canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`
languages: {
    "es":        "https://www.metodokakebo.com/blog/kakebo-online-gratis",
    "en":        "https://www.metodokakebo.com/en/blog/kakebo-online-gratis",
    "x-default": "https://www.metodokakebo.com/blog/kakebo-online-gratis"
}
```

**Evaluación:**
- Canonical ES → `/blog/kakebo-online-gratis` (sin prefijo) ✅
- Canonical EN → `/en/blog/kakebo-online-gratis` ✅
- x-default → ES canonical ✅
- hreflang correcto para ambas versiones ✅

---

## Sitemap

Fuente: `src/app/sitemap.ts`

```javascript
// ES: sin prefijo
const path = locale === 'es' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;
```

**Entradas generadas para kakebo-online-gratis:**

| Locale | URL en sitemap |
|---|---|
| ES | `https://www.metodokakebo.com/blog/kakebo-online-gratis` ✅ |
| EN | `https://www.metodokakebo.com/en/blog/kakebo-online-gratis` ✅ |

Cada entrada incluye `alternates.languages` con ambas versiones. ✅

---

## Links internos

### `RelatedPosts.tsx`

```tsx
<Link href={`/blog/${post.slug}`}>
```

Usa `<Link>` de next-intl sin locale explícito → genera `/blog/...` en contexto ES y `/en/blog/...` en contexto EN. **No genera `/es/...` en ningún caso.** ✅

### Links en artículos MDX

- `kakebo-online-gratis.es.mdx` → `[guía completa del Kakebo online](/blog/kakebo-online-guia-completa)` ✅
- `kakebo-online-guia-completa.es.mdx` → `[Kakebo online gratis: empieza sin banco ni Excel](/blog/kakebo-online-gratis)` ✅

**Conclusión:** No hay links internos que generen `/es/...` de forma explícita. ✅

---

## Análisis de cada interferencia

### 1. `/es/blog/kakebo-online-gratis` vs `/blog/kakebo-online-gratis`

**Clasificación: DESCARTADO**

El redirect 301 `"/es/:path*" → "/:path*"` está correctamente implementado en `next.config.ts`. Next.js aplica estos redirects antes del middleware, por lo que cualquier petición a `/es/blog/kakebo-online-gratis` recibe una respuesta 301 a `/blog/kakebo-online-gratis`.

**Por qué aparece en GSC con señales bajas:**
Las impresiones y clics residuales bajo `/es/blog/kakebo-online-gratis` en Search Console son un artefacto histórico: Google indexó esta URL antes de que el redirect estuviera completamente consolidado. Con el 301 permanente en su lugar, Google irá consolidando las señales bajo el canonical `/blog/kakebo-online-gratis`. Este proceso puede tardar semanas.

**Acción requerida:** Ninguna — monitorizar. Si en 4-6 semanas continúa apareciendo con señales, revisar si hay algún enlace externo apuntando a `/es/...`.

---

### 2. `/es/blog/kakebo-online-guia-completa` vs `/blog/kakebo-online-guia-completa`

**Clasificación: DESCARTADO**

Mismo análisis que el caso anterior. El 301 aplica igualmente. No hay señal en GSC que indique problema activo.

---

### 3. `/en/blog/kakebo-online-gratis` superando a la versión ES

**Clasificación: DUDOSO — requiere monitorización**

La arquitectura SEO es estructuralmente correcta (canonical, hreflang, sitemap). Sin embargo, se detecta una anomalía de señal:

**Problema potencial — slug con keyword española en URL inglesa:**

El artículo inglés se sirve en:
```
https://www.metodokakebo.com/en/blog/kakebo-online-gratis
```

El slug `kakebo-online-gratis` contiene "gratis", término español. Esto puede provocar que Google:
1. Asocie la URL inglesa con consultas en español ("kakebo online gratis")
2. Sirva la versión inglesa a usuarios de habla española que buscan este término
3. Divida la autoridad de señales entre la URL EN y la ES canonical

Este efecto es conocido como **cross-language URL contamination**: una URL inglesa con palabras clave en otro idioma puede competir con la versión nativa.

**Hipótesis adicional — señal histórica:**
El artículo EN podría haber acumulado más señales en las primeras semanas de indexación si Google priorizó la URL EN por haber sido rastreada antes (los bots no siguen Accept-Language al estar desactivado, pero pueden seguir orden de crawl del sitemap).

**Lo que NO es un problema:**
- La estructura canónica es correcta
- El hreflang separa correctamente ES de EN
- No hay contenido duplicado entre versiones ES y EN (son artículos diferenciados)

---

## Evaluación del riesgo de canibalización interna (ES)

Los artículos `kakebo-online-gratis.es.mdx` y `kakebo-online-guia-completa.es.mdx` coexisten y se enlazan mutuamente. Hay intención diferenciada:

| Artículo | Intención | URL |
|---|---|---|
| `kakebo-online-gratis` | Herramienta gratuita, CTA registro | `/blog/kakebo-online-gratis` |
| `kakebo-online-guia-completa` | Guía completa metodología digital | `/blog/kakebo-online-guia-completa` |

**Clasificación: DESCARTADO** — La diferenciación de intención es suficiente para evitar canibalización. Los links internos entre ambos refuerzan la relación hub-spoke.

---

## Resumen de clasificaciones

| URL / Interferencia | Clasificación | Acción |
|---|---|---|
| `/es/blog/...` interfiriendo con `/blog/...` | **DESCARTADO** | 301 en su lugar, monitorizar consolidación |
| `/es/blog/kakebo-online-guia-completa` | **DESCARTADO** | Ídem |
| EN artículo superando ES en señales | **DUDOSO** | Monitorizar; considerar SEO-I18N-EN-SLUG-FIX-01 |
| Canibalización interna entre artículos ES | **DESCARTADO** | Intención diferenciada |

---

## Próxima tarea recomendada (no ejecutar aún)

**SEO-I18N-EN-SLUG-FIX-01** — Evaluar si el artículo EN debe tener un slug en inglés:

- Opción A: Redirigir `/en/blog/kakebo-online-gratis` → `/en/blog/free-kakebo-online` con nuevo artículo EN
- Opción B: Redirigir `/en/blog/kakebo-online-gratis` → `/blog/kakebo-online-gratis` (ES canonical) si el artículo EN no tiene valor de tráfico real en inglés
- Opción C: Mantener estado actual y esperar datos adicionales de Search Console (posición actual 7,95 no es urgente)

**Prerequisito para decidir:** Comprobar en Search Console si las impresiones del artículo EN provienen de búsquedas en inglés o en español. Si son en español, el problema es real y hay que actuar.

---

## Estado: VALIDACIÓN COMPLETADA

**Código:** no tocado  
**Contenido:** no tocado  
**UI/SEO/routing/sitemap/hreflang/canonical:** no tocados
