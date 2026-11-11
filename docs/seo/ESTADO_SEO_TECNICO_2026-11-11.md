# Estado del SEO técnico — 2026-11-11

Cierre de la fase de SEO técnico. Producción: `main` en `4186f5d` y esta rama (accesibilidad del FAQ, documentación y línea base). Lo no verificado se dice como tal.

## 1. robots.txt y noindex
- `src/app/robots.ts` solo bloquea `/api/`, `/history`, `/settings`, `/new` (con y sin `/en`). Los parámetros de campaña (`?utm_*`, `?ref=`) no se bloquean: su canonical es la URL limpia y Google debe poder leerla. En despliegues de preview devuelve `Disallow: /`.
- `/app*`, `/auth/callback`, `/login`, `/docs/*` y `/manifest.webmanifest` **no se bloquean**: sirven `noindex` (metadata de servidor o cabecera `X-Robots-Tag`), y bloquearlos impediría leerlo. Lo impone `src/__tests__/seo/robots-noindex.test.ts`.
- Verificado en producción: los 3 archivos de `/docs/*` y el manifest devuelven `X-Robots-Tag: noindex`; `robots.txt` y `sitemap.xml` (62 URL) dan 200.
- Aviso: el control de indexación del layout raíz depende de `NEXT_PUBLIC_APP_URL` en build; un build local sin esa variable sale `noindex`.

## 2. JSON-LD tipado (schema-dts)
- Capa en `src/lib/seo/jsonld.ts`: un único `@graph` por página (`S.graph`, `S.core`, `S.webPage`, `S.webApplication`, `S.howTo`, `S.faqPage`, `S.crumbs`…). `S.siteCopy` guarda los textos localizados.
- `npm run validate` = `type-check` + `next build` + `test:graph` (`scripts/check-graph-integrity.mjs`: páginas huérfanas contra el sitemap; hoy 92 páginas, 62 URL, 0 huérfanas).
- Alineaciones hechas: `Answer.text` = respuesta visible; `featureList` retirada de las calculadoras; `HowTo.name` de la calculadora de ahorro = h2 visible; `WebApplication.name` = h1 en inflación (ES/EN), ahorro EN y regla 50/30/20 EN.
- Deliberado: `WebApplication.name` de la home es «Kakebo AI» (excepción del audit). El nombre de marca tiene tres formas en el sitio (MetodoKakebo.com en Organization/WebSite/og:site_name; «Kakebo» en el logo; «Kakebo AI» en el `<title>` de la home). Sin unificar.

## 3. Audit estricto del JSON-LD
- **Comando:** `npm run build && node scripts/audit-jsonld-visible.mjs --tabla --out=audit.json`. Manual, fuera de `validate` y de CI. Detalle en `AUDIT_JSONLD_VISIBLE_ESTRICTO.md`.
- **Criterio:** cada tipo contra su bloque visible (miga contra el `<nav>`, FAQ contra su bloque, HowTo/ItemList/WebApplication contra encabezados y listas). Una respuesta de FAQ colapsada en el DOM cuenta como visible (aprobado).
- **Exclusiones:** `script`, `style`, `noscript`, `template`, `svg`, cabecera y pie globales, `aria-hidden`, diálogos.
- **Excepción:** `WebApplication.name` de `/` y `/en` se acepta si abre el `<title>` de la home.
- **Resultado a 2026-11-11:** 95 filas no visibles en 28 páginas y 68 nombres únicos: 56 nombres de miga y 27 `aria-current` (las 25 de clúster y las 2 premium) y 12 `ItemList` de vivienda.
- Línea base para comparar: `baselines/2026-11-11/`.

## 4. Migas de pan
Componente `src/components/seo/Breadcrumbs.tsx`; los items son los del JSON-LD (una sola fuente por página).

| Plantilla | Páginas | Miga visible | Coincide con el JSON-LD |
|---|---|---|---|
| Artículos pilar (alternativas, como-ahorrar, guía definitiva, plantilla Excel) | 8 (4 ES + 4 EN) | Nueva «Inicio / Blog / título» | Sí |
| Calculadoras (ahorro, inflación, regla 50/30/20) | 6 (3 ES + 3 EN) | Nueva «Inicio / Herramientas / nombre» | Sí |
| Plantillas imprimibles (kakebo-2027, kakebo-para-imprimir) | 2 | Nueva «Inicio / Plantillas Kakebo / título» | Sí |
| Artículos de clúster | 25 (14 ES + 11 EN) | «Blog › pilar» (existente) | **No**: faltan «Inicio» y el título |
| Landings premium | 2 | Ninguna | **No**: `BreadcrumbList` sin miga (decisión del propietario) |
| Vivienda | 13 | Propia | Sí |

Total fuera de vivienda: 43 (33 de blog + 6 + 2 + 2). El JSON-LD con migas está en 56 páginas de las 64 con JSON-LD.

## 5. Decisiones del propietario
- Premium: dejar el `BreadcrumbList` sin miga visible; los 4 tests que lo exigen no se tocan.
- `WebApplication.name`: alinear con el h1 en las 4 herramientas; la home conserva «Kakebo AI».
- FAQ de la home: respuesta colapsada accesible por interacción = visible. Se añadió `aria-expanded`/`aria-controls`/`role="region"`.
- `.claude/settings.local.json` deja de versionarse (la historia lo conserva).
- Staging Plus/Stripe TEST: histórico, «ya no se usa según el propietario».

## 6. Pendiente (con fechas)
| Qué | Cuándo / de quién |
|---|---|
| Opción A de migas para las 25 de clúster («Inicio › Blog › pilar › artículo», JSON-LD de 3 a 4 items) | Preparada en la rama local `seo/migas-cluster-opcion-a`; publicar **después del 2026-11-20** |
| Fusión de `seo/vivienda-itemlist-aplazado` (`ItemList.name` de vivienda) | **Después del 2026-11-20**, al terminar la medición del piloto |
| Medición en Search Console (impresiones, clics, posición, informe de migas) | 2 a 4 semanas desde 2026-11-10 |
| Revisión visual en móvil y escritorio de las migas | Propietario (no verificada) |
| Estado de Supabase de staging, Stripe TEST y Vercel (preview) | Sin verificar |
| Rich Results Test / validadores externos | No ejecutados |
