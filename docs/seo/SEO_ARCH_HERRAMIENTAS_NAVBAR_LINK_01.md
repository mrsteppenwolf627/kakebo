# SEO-ARCH-HERRAMIENTAS-NAVBAR-LINK-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — validación local y validación de producción superadas. El hub `/herramientas` recibe ahora un enlace interno global rastreable. Cierre definitivo.

## Problema anterior

Confirmado en `docs/seo/SEO_ARCH_HERRAMIENTAS_INTERNAL_LINKING_VALIDATION_01.md`: 0 enlaces
`<a href="/herramientas">` en todo el sitio. El disparador "Herramientas" del navbar (desktop y
móvil) era un único `<button>` (desktop) o un `<span>` de encabezado (móvil) que solo abría/servía
de etiqueta para el desplegable de las 3 herramientas individuales — nunca navegaba al hub.

## Estructura anterior del navbar

**Desktop** (`src/components/landing/Navbar.tsx`, dropdown "Herramientas"):

```tsx
<div ref={toolsRef} className="relative" onMouseEnter={...} onMouseLeave={...} onKeyDown={...}>
  <button ref={toolsButtonRef} onClick={() => setIsToolsOpen(prev => !prev)}
    aria-expanded={isToolsOpen} aria-haspopup="true" aria-controls="tools-dropdown-menu" ...>
    {t('tools')}
    <svg ... chevron ... />
  </button>
  <div id="tools-dropdown-menu" ...>
    {/* 3 <Link> a las herramientas individuales */}
  </div>
</div>
```

**Móvil** (sección "Tools group" del menú hamburguesa):

```tsx
<div className="flex flex-col gap-1 border-t border-border/40 pt-3 mt-1">
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest pb-1">{t('tools')}</span>
  {/* 3 <Link> a las herramientas individuales */}
</div>
```

## Solución implementada

Cambio único, quirúrgico, limitado a `src/components/landing/Navbar.tsx` y a las claves de
traducción necesarias.

**Desktop:** el `<button>` único se divide en un `<Link href="/herramientas">` (el texto
"Herramientas", ahora navegable) y un `<button>` independiente que conserva exactamente el mismo
comportamiento de apertura/cierre del desplegable (mismo `ref`, mismos atributos `aria-expanded`,
`aria-haspopup`, `aria-controls`, mismo `onClick`), mostrando solo el icono de flecha (chevron).
Ambos elementos son hermanos dentro del mismo contenedor `<div>` (que sigue gestionando
`onMouseEnter`/`onMouseLeave`/`onKeyDown` de Escape exactamente igual que antes) — **sin anidar
`<button>` dentro de `<a>` ni `<a>` dentro de `<button>`**.

**Móvil:** el `<span>` de etiqueta se sustituye por un `<Link href="/herramientas">` con la misma
clase visual (`text-xs font-medium text-muted-foreground uppercase tracking-widest pb-1`, con
`hover`/`focus-visible` añadidos por consistencia con el resto de enlaces móviles) y el mismo
`onClick={closeMenu}` que ya usan los demás enlaces del menú móvil. No hay desplegable en móvil
(las 3 herramientas ya se listan siempre expandidas), así que no hay riesgo de anidación aquí.

**Accesibilidad del botón del desplegable:** al perder su texto visible "Herramientas" (ahora en
el `<Link>` hermano), el botón del chevron necesita un nombre accesible propio. Se añadió
`aria-label={t('toolsMenuToggle')}` con nueva clave i18n (`Navigation.toolsMenuToggle`:
"Ver todas las herramientas" / "View all tools"), la única adición de texto de esta tarea,
justificada explícitamente por accesibilidad.

**Cierre del desplegable al navegar:** se añadió `onClick={() => setIsToolsOpen(false)}` al nuevo
`<Link>` del hub (mismo patrón que ya usan los 3 `<Link>` de herramientas individuales dentro del
desplegable), para que el estado del menú no quede abierto tras una navegación si el layout
persiste entre rutas.

## Estructura semántica final

**Desktop:**

```tsx
<div ref={toolsRef} className="relative flex items-center" onMouseEnter={...} onMouseLeave={...} onKeyDown={...}>
  <Link href="/herramientas" onClick={() => setIsToolsOpen(false)} className="...">
    {t('tools')}
  </Link>
  <button ref={toolsButtonRef} onClick={() => setIsToolsOpen(prev => !prev)}
    aria-expanded={isToolsOpen} aria-haspopup="true" aria-controls="tools-dropdown-menu"
    aria-label={t('toolsMenuToggle')} className="...">
    <svg ... chevron ... />
  </button>
  <div id="tools-dropdown-menu" ...>
    {/* 3 <Link> a las herramientas individuales, sin cambios */}
  </div>
</div>
```

**Móvil:**

```tsx
<div className="flex flex-col gap-1 border-t border-border/40 pt-3 mt-1">
  <Link href="/herramientas" onClick={closeMenu} className="...">
    {t('tools')}
  </Link>
  {/* 3 <Link> a las herramientas individuales, sin cambios */}
</div>
```

## Comportamiento desktop

- Clic en el texto "Herramientas" → navega directamente a `/herramientas` (o `/en/herramientas`
  según locale) — verificado manualmente en local: el clic lleva a la página del hub con HTTP 200.
- Clic en el chevron (botón independiente) → abre/cierra el desplegable exactamente igual que
  antes (mismo `aria-expanded`, mismas clases de transición/rotación del icono).
- `onMouseEnter`/`onMouseLeave` sobre el contenedor conjunto → sigue abriendo/cerrando el
  desplegable al pasar el ratón por encima de cualquiera de los dos elementos (texto o chevron),
  igual que el comportamiento previo sobre el único botón combinado — verificado visualmente
  (captura de pantalla con hover mostrando las 3 herramientas).
- El desplegable sigue centrado bajo el conjunto texto+chevron (`absolute top-full left-1/2
  -translate-x-1/2`), sin cambios de posicionamiento relativo al contenedor.

## Comportamiento móvil

- La etiqueta "Herramientas" del grupo de herramientas del menú hamburguesa es ahora un enlace
  real; un toque/clic navega a `/herramientas` (o `/en/herramientas`) y cierra el menú móvil
  (`closeMenu`), igual que el resto de enlaces del menú.
- Las 3 herramientas individuales siguen listadas debajo, sin cambios.
- No existe mecanismo de desplegable en móvil (todo el grupo ya estaba siempre visible), por lo
  que no hay riesgo de interferencia entre el nuevo enlace y ningún toggle.
- **Limitación del entorno de pruebas:** la herramienta de automatización de navegador de esta
  sesión no permite forzar un `window.innerWidth` real por debajo del ancho de escritorio (mismo
  límite ya documentado en `docs/UI_CALCULADORA_AHORRO_EDITORIAL_BLOCK_01.md`), por lo que no se
  pudo interactuar con el botón hamburguesa real en un viewport estrecho dentro de esta sesión. La
  verificación del menú móvil se hizo mediante el test automatizado (`Navbar.test.tsx`, ver más
  abajo), que renderiza directamente la rama JSX del menú móvil (independiente del ancho de
  viewport en jsdom) y confirma la estructura y el `href` correctos. El cambio en sí es una
  sustitución de una etiqueta (`<span>` → `<Link>`) con las mismas clases visuales, sin lógica
  nueva, lo que minimiza el riesgo de regresión visual.

## Accesibilidad

- Ambos elementos (enlace y botón) son focalizables de forma independiente (`tabIndex` nativo
  `0` en ambos, verificado con `element.tabIndex` en el DOM real).
- Orden de tabulación: enlace "Herramientas" → botón del chevron → (si el desplegable está
  abierto) los 3 enlaces de herramientas individuales — sin cambios respecto al resto del navbar.
- `Enter` activa el enlace (comportamiento nativo de `<a>`); `Enter`/`Space` abre el desplegable
  vía el botón (comportamiento nativo de `<button>`, sin cambios en el `onClick` que ya lo
  gestionaba).
- `Escape` sigue cerrando el desplegable y devolviendo el foco a `toolsButtonRef` — el `onKeyDown`
  permanece en el mismo contenedor padre, sin cambios de lógica.
- Verificado en el DOM real (local): `link.contains(button)` = `false`,
  `button.contains(link)` = `false` — sin anidación de elementos interactivos.
- Nuevo `aria-label` en el botón del chevron para que conserve un nombre accesible tras perder su
  texto visible.

## Enlaces generados por idioma

- Español: `<a href="/herramientas">Herramientas</a>` — verificado en HTML servido localmente.
- Inglés: `<a href="/en/herramientas">Tools</a>` — verificado en HTML servido localmente
  (`/en` de Next-intl con `localePrefix: 'as-needed'`, mismo mecanismo automático que ya usan
  todos los demás `<Link>` del navbar; no se ha escrito lógica de locale manual).

## Tests

`src/__tests__/components/Navbar.test.tsx` (8 tests nuevos):

1. Renderiza `<a href="/herramientas">` para locale español.
2. Renderiza `<a href="/en/herramientas">` para locale inglés.
3. El botón del desplegable es independiente y focalizable (`aria-haspopup`, `aria-controls`).
4. No hay `<button>` anidado dentro del enlace ni `<a>` anidado dentro del botón.
5. El desplegable abre y cierra correctamente solo mediante el botón (`aria-expanded` y clases
   `opacity-0`/`opacity-100` del contenedor del menú).
6. Las 3 herramientas individuales del desplegable siguen presentes con sus `href` correctos.
7. Activar el enlace del hub cierra el estado del desplegable.
8. El menú móvil (renderizado tras pulsar el botón hamburguesa) contiene un enlace real
   `<a href="/herramientas">` dentro de la navegación móvil (`aria-label="Menú principal"`).

## Validación local

- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (8 tests nuevos, todos en verde; único fallo preexistente y ajeno en
  `calculate-whatif.test.ts`, no relacionado con este fix).
- HTML servido localmente (`npm run start` + `curl`):
  - `/` (ES) → `<a href="/herramientas">Herramientas</a>` presente en el navbar.
  - `/en` → `<a href="/en/herramientas">Tools</a>` presente en el navbar.
  - `/herramientas` → HTTP 200 (destino del enlace verificado accesible).
- Interacción real en navegador (Chrome, local):
  - Hover sobre "Herramientas" → despliega las 3 tarjetas del menú (captura de pantalla
    verificada, sin regresión visual respecto al comportamiento anterior).
  - Clic sobre el texto "Herramientas" → navega correctamente a `/herramientas`.
  - Verificado en el DOM: enlace y botón son elementos hermanos independientes, sin anidación.

## Validación de producción

**Completada el 2026-07-28** (tarea `SEO-ARCH-HERRAMIENTAS-NAVBAR-LINK-PRODUCTION-VALIDATION-01`),
tras confirmar el despliegue del commit `f4e2e3f65e973a48a48181f3d9f8082529d9efbe`.

**Evidencia de despliegue:** `https://www.metodokakebo.com/` y `https://www.metodokakebo.com/en`
sirven exactamente el HTML esperado del commit — `<a href="/herramientas">Herramientas</a>` /
`<a href="/en/herramientas">Tools</a>` presentes, junto con el botón `aria-controls="tools-dropdown-menu"`
con `aria-label` localizado ("Ver todas las herramientas" / "View all tools"). Vercel no expone un
header público de commit; la confirmación se apoya en esta evidencia funcional, idéntica a la
verificada en local.

**Validación ES:**
- `<a href="/herramientas">Herramientas</a>` presente en el HTML servido de `/`.
- Clic real en el texto "Herramientas" (navegador) → navega a
  `https://www.metodokakebo.com/herramientas`.
- `https://www.metodokakebo.com/herramientas` → HTTP 200.
- Botón del chevron (`aria-controls="tools-dropdown-menu"`) abre/cierra el desplegable de forma
  independiente del enlace — verificado con clic real (captura de pantalla) y con
  `aria-expanded` alternando `false → true → false`.
- Las 3 herramientas individuales (`Calculadora Ahorro`, `Regla 50/30/20`, `Calculadora Inflación`)
  siguen visibles y con sus `href` correctos dentro del desplegable.

**Validación EN:**
- `<a href="/en/herramientas">Tools</a>` presente en el HTML servido de `/en`.
- Clic real en el texto "Tools" → navega a `https://www.metodokakebo.com/en/herramientas`
  (confirmado por URL y `<title>Kakebo Tools: Savings and Inflation Calculators</title>` de la
  pestaña tras el clic).
- `https://www.metodokakebo.com/en/herramientas` → HTTP 200.
- `aria-label` del botón del chevron correctamente localizado a "View all tools".
- Desplegable EN funcional, mostrando "Savings Calculator", "50/30/20 Rule", "Inflation Calculator".

**Validación desktop:**
- Hover sobre "Herramientas"/"Tools" abre el desplegable (verificado con captura de pantalla en
  ambos locales, sin cambios visuales respecto al comportamiento anterior a este fix).
- Clic en el texto navega al hub (verificado en ambos locales).
- Clic en el chevron abre/cierra el menú de forma independiente (verificado con captura y con
  `aria-expanded`).
- Clic fuera del desplegable lo cierra (verificado con captura de pantalla: clic en un punto
  alejado del navbar cierra el menú y el chevron vuelve a su posición original).
- `Escape` (con foco en el botón del chevron) cierra el desplegable y devuelve el foco al propio
  botón — verificado leyendo `aria-expanded` (`true → false`) y `document.activeElement` tras la
  tecla.
- Sin saltos visuales ni desalineación en ninguna de las capturas tomadas (home ES, home EN, hub
  ES, hub EN, desplegable abierto en ambos locales).

**Validación móvil:**
- No se pudo interactuar con el botón hamburguesa real en un viewport estrecho en esta sesión de
  producción (misma limitación de entorno ya documentada: el redimensionado de ventana no afecta
  a `window.innerWidth` en este navegador de automatización). La implementación móvil ya quedó
  validada estructuralmente en la fase local mediante el test automatizado
  `Navbar.test.tsx` (que renderiza directamente la rama JSX del menú móvil, independiente del
  ancho de viewport) y no se ha modificado desde entonces — el HTML servido en producción es
  idéntico al verificado en local (mismo build, mismo commit).

**Comprobación del DOM (producción, ambos locales):**
- `document.querySelector('a[href="/herramientas"]')` / `.../en/herramientas` → elemento `<a>`
  real, `tabIndex` nativo `0`.
- `document.querySelector('button[aria-controls="tools-dropdown-menu"]')` → elemento `<button>`
  real, `tabIndex` nativo `0`, con `aria-label` presente y localizado.
- `link.parentElement === button.parentElement` → `true` (hermanos, mismo contenedor).
- `link.contains(button)` → `false`; `button.contains(link)` → `false` — sin anidación de
  elementos interactivos en ningún sentido, confirmado en producción real.

**Confirmación:** el hub `/herramientas` (y `/en/herramientas`) ya recibe un enlace interno global
rastreable (`<a href>` real, presente en todas las páginas públicas vía el navbar compartido),
resolviendo en producción el hallazgo "página huérfana" de `SEO-ARCH-HERRAMIENTAS-INTERNAL-LINKING-VALIDATION-01`.

## Confirmación: no se modificaron otras áreas

- **Footer:** no modificado (verificado con `git diff --stat`: solo `Navbar.tsx` y `messages/*.json`).
- **Home:** no modificada.
- **Hub `/herramientas`:** contenido, metadata, canonical, hreflang y schema sin cambios.
- **Páginas individuales de herramientas:** sin cambios.
- **`/blog/plantilla-kakebo-excel`:** no tocada.
- **Sitemap:** `src/app/sitemap.ts` no modificado.
- Único fichero de código modificado: `src/components/landing/Navbar.tsx`. Únicos ficheros de
  traducción modificados: `messages/es.json` y `messages/en.json` (una clave nueva,
  `Navigation.toolsMenuToggle`, en cada uno).
