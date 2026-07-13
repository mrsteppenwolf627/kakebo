# CRO-ACTIVATION-EXCEL-CTA-01 — Bloque de activación hacia Kakebo Online en `/blog/plantilla-kakebo-excel`

## 1. Hipótesis

> "Un CTA visible hacia Kakebo Online inmediatamente después de la introducción aumentará `click_cta_login` sin perjudicar la intención de búsqueda ni la descarga de la plantilla Excel."

## 2. Baseline (GA4)

| Métrica | Valor |
|---|---|
| **Periodo** | 2026-06-15 a 2026-07-12 |
| Usuarios activos en `/blog/plantilla-kakebo-excel` | 82 |
| Usuarios con `click_cta_login` desde esa página | 2 |
| Conversión aproximada hacia login | 2,44 % |
| Sesiones como landing page | 91 |

## 3bis. Corrección de destino (CRO-ACTIVATION-EXCEL-CTA-FIX-01, 2026-07-13)

El CTA principal se implementó inicialmente apuntando a `/` (home). La validación manual posterior detectó que esto añadía una pantalla intermedia entre el artículo y el login/app, dificultando el embudo de activación directo.

Se corrigió el destino del CTA principal de `/` a `/app`, verificado como ruta canónica de la aplicación: sin sesión, `/app` redirige automáticamente a `/login`; con sesión, accede directamente a la app.

El tracking del experimento **no cambió**: sigue disparando `click_cta_login` con `cta_location: plantilla_excel_intro` y `source_page` dinámico. El CTA secundario (`#descarga-plantilla-excel`) tampoco cambió.

Commit de la corrección: `CRO: fix Excel article CTA destination`.

**Hallazgo independiente (no corregido en esta tarea):** en la pantalla de `/login` aparece un error visual — el texto "Control de gastos" muestra literalmente `<br />` sin interpretar como salto de línea, en vez de renderizarlo. Queda documentado para una tarea futura de corrección de UI; fuera de alcance de este experimento CRO.

## 3. Cambio exacto implementado

Se añade un bloque `ChoiceCTA` inmediatamente después del párrafo de introducción y antes de la sección "¿Qué incluye la plantilla Kakebo Excel gratuita?" (que contiene el CTA de descarga existente).

El bloque presenta dos opciones:

- **Título:** "Elige cómo llevar tu Kakebo"
- **Texto:** "Puedes empezar ahora con Kakebo Online, sin instalar nada ni preparar hojas de cálculo, o descargar la plantilla Excel gratis si prefieres llevar el control manualmente."
- **CTA principal** (botón primario, estilo `bg-primary`): "Usar Kakebo online gratis" → `/app` (corregido desde `/` — ver nota **3bis**)
- **CTA secundario** (botón outline, visible pero no dominante): "Prefiero la plantilla Excel" → ancla local `#descarga-plantilla-excel`, que hace scroll al bloque `DownloadCTA` ya existente en la misma página (no se duplica la descarga ni se crea un flujo nuevo).

No se ha reordenado el artículo, no se ha movido la plantilla, no se ha sustituido el CTA de descarga y no se ha modificado el CTA final del artículo (`SimpleCTA`).

## 4. Archivos modificados

- `src/components/mdx/MDXClientCTAs.tsx` — nuevo componente `ChoiceCTA` (no existía ningún componente MDX con dos CTAs; se creó el mínimo necesario reutilizando exactamente los mismos estilos y el mismo patrón de tracking que `ToolCTA`/`SimpleCTA`).
- `src/components/mdx/MDXComponents.tsx` — registro de `ChoiceCTA` en el mapa de componentes MDX (necesario para que el `.mdx` pueda usarlo).
- `src/content/blog/plantilla-kakebo-excel.es.mdx` — inserción del bloque `<ChoiceCTA />` tras la introducción, y añadido de `<div id="descarga-plantilla-excel" />` justo antes del `<DownloadCTA />` existente para servir de ancla del CTA secundario.

Solo la versión ES del artículo se modificó (el prompt no pedía tocar `plantilla-kakebo-excel.en.mdx`).

## 5. Eventos reutilizados

- **CTA principal:** dispara el evento existente `click_cta_login` (mismo helper `analytics.track` que usan `ToolCTA`, `SimpleCTA` y `ArticleCTA`), con:
  - `source_page`: `window.location.pathname` (patrón existente, sin hardcodear)
  - `cta_label`: "Usar Kakebo online gratis"
  - `cta_location`: `plantilla_excel_intro`
- **CTA secundario:** no dispara ningún evento nuevo; es un ancla de navegación interna. El evento `download_template` solo se dispara al pulsar el botón de descarga real (`DownloadCTA`, sin modificar).

No se ha creado ningún evento alternativo ni se ha modificado el nombre de eventos existentes.

## 6. Riesgos y restricciones

- URL protegida: no se ha tocado slug, `title`, `meta description`, `canonical`, `hreflang`, H1, hero, imagen destacada, schema, FAQ, tabla comparativa, ni copy existente fuera del nuevo bloque.
- No se ha modificado el CTA de descarga existente ni el CTA final del artículo.
- Cambio aislado y reversible: revertir consiste en eliminar el bloque `<ChoiceCTA />` y el `<div id="...">` del `.mdx`, y opcionalmente el componente `ChoiceCTA` (no usado en ningún otro artículo).
- El nuevo componente `ChoiceCTA` queda registrado globalmente en `MDXComponents.tsx` (requisito técnico de MDX para poder usar componentes con `onClick`/tracking), pero no se usa en ningún otro artículo, por lo que no afecta a otras URLs.

## 7. Fecha de despliegue

Pendiente de confirmación tras `git push` (ver commit en `PROJECT_STATUS.md` / `docs/PROJECT_STATUS.md`).

## 8. Ventana de medición posterior

28 días desde la fecha de despliegue.

## 9. Criterios de evaluación

- Usuarios activos en `/blog/plantilla-kakebo-excel` (GA4).
- Usuarios que disparan `click_cta_login` desde esa página, filtrando por `cta_location = plantilla_excel_intro` para aislar el efecto del nuevo bloque.
- Tasa de clic hacia login (usuarios con `click_cta_login` / usuarios activos en la página).
- Usuarios con `download_template` (o evento equivalente) desde la página, para confirmar que la descarga de la plantilla no se ve perjudicada.
- No evaluar impacto SEO inmediatamente (ventana mínima de 2-4 semanas para señales SEO, según patrón ya usado en `docs/seo/GSC_CHANGELOG_2026_07_03.md`).
