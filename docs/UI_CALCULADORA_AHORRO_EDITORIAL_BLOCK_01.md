# UI-CALCULADORA-AHORRO-EDITORIAL-BLOCK-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado
**URL afectada:** `https://www.metodokakebo.com/herramientas/calculadora-ahorro`

## Estado visual anterior

El bloque "¿Para qué sirve la calculadora de ahorro mensual?" estaba envuelto en una clase
utilitaria genérica de tipografía (`prose prose-stone dark:prose-invert ... prose-p:font-light`)
que no coincidía con el resto de la página (que usa tipografía y espaciado manuales: `font-serif
font-bold text-foreground`, `text-sm text-muted-foreground font-light leading-relaxed`, etc.).
Consecuencias:
- El heading `whyTitle` no compartía tamaño/peso con el resto de H2 de la página (p. ej. "¿Cómo
  interpretar el resultado?").
- Los dos párrafos explicativos no tenían el mismo tratamiento tipográfico que el resto del
  contenido editorial de la página.
- No había separación visual entre la explicación y la lista de enlaces relacionados
  ("Sigue mejorando tu plan de ahorro:").
- Los 7 enlaces se renderizaban como una lista `<ul>` sin estilo (bullets por defecto del
  navegador vía `prose`), enlaces en texto plano azul subrayado, sin área clicable ampliada,
  sin indicación visual de interactividad más allá del subrayado.

## Solución implementada

Se sustituyó el contenedor `prose` por dos bloques manuales, reutilizando exactamente las clases
ya usadas en el resto de `SavingsCalculator.tsx` (sección "¿Cómo interpretar el resultado?"):

1. **Bloque explicativo** (`¿Para qué sirve...`): `h2` con `text-2xl md:text-3xl font-serif
   font-bold text-foreground` (idéntico al H2 de interpretación) y párrafos con `text-sm
   text-muted-foreground font-light leading-relaxed` (mismo tratamiento que el resto de texto
   secundario de la página).
2. **Separador visual**: `border-t border-border` + `mt-10 pt-8` entre el bloque explicativo y la
   lista de enlaces, para dar la separación clara solicitada antes de "Sigue mejorando tu plan de
   ahorro:".
3. **Lista de recursos relacionados**: cada `<li>` contiene un único `<Link>` con estilo de fila
   con borde (`rounded-xl border border-border bg-card px-4 py-3`), fondo suave en hover
   (`hover:bg-primary/5 hover:border-primary/40`) e icono de flecha discreta (`ArrowRight` de
   `lucide-react`) que se desplaza al hacer hover (`group-hover:translate-x-1`), replicando el
   patrón de tarjeta de recurso ya usado en `RelatedPosts.tsx` y el patrón de CTA con flecha de
   `ToolsSection.tsx`.

## Componentes o patrones reutilizados

- Estilo de H2/H3 y párrafo secundario: mismo `SavingsCalculator.tsx` (sección de interpretación
  de resultados), sin inventar una nueva escala tipográfica.
- Patrón de tarjeta-enlace con borde y fondo `bg-card`: `src/components/mdx/RelatedPosts.tsx`.
- Icono de flecha interactiva con transición: `src/components/landing/ToolsSection.tsx`
  (`ArrowRight` + `group-hover:translate-x-1`).
- Anillo de foco accesible: mismo patrón `focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background` usado en
  `Hero.tsx`, `HeroCTA.tsx` y `Navbar.tsx`.

No se creó ningún componente nuevo: el bloque se usa en un único sitio (esta página), así que se
implementó directamente en `SavingsCalculator.tsx` reutilizando clases existentes, sin abstraer un
componente genérico innecesario.

## Archivos modificados

- `src/components/landing/tools/SavingsCalculator.tsx`
  - Import añadido: `ArrowRight` desde `lucide-react`.
  - Reemplazado el contenedor `prose` por dos `<div>` con clases manuales (bloque explicativo +
    lista de recursos), manteniendo exactamente las mismas claves de traducción
    (`t("content.whyTitle")`, `t("content.whyText1")`, `t.rich("content.whyText2", ...)`,
    `t("content.interlinkingTitle")`, `t("content.link0")` … `t("content.link6")`) y los mismos
    `href` en el mismo orden.

No se modificó `messages/es.json` ni `messages/en.json` (ningún texto, ninguna clave añadida ni
eliminada). No se modificó `page.tsx` (metadata, schema, H1, canonical). No se tocó el footer.

## Confirmación: texto y enlaces sin cambios

- Los 7 `href` se mantienen literalmente idénticos y en el mismo orden:
  `/blog/como-hacer-un-presupuesto-personal`, `/blog/metodo-kakebo-para-autonomos`,
  `/blog/ahorro-pareja`, `/herramientas/calculadora-inflacion`,
  `/blog/como-ahorrar-dinero-cada-mes`, `/blog/cuentas-remuneradas`,
  `/blog/eliminar-gastos-hormiga`.
- Los anchors se siguen resolviendo desde las mismas claves i18n (`content.link0`…`content.link6`),
  sin reescribir ninguna frase.
- El heading `whyTitle` y los dos párrafos (`whyText1`, `whyText2` con `<bold>`) usan exactamente
  el mismo texto/clave i18n que antes.
- Verificado en producción local: navegación real por clic al primer enlace
  (`/blog/como-hacer-un-presupuesto-personal`) confirma destino y funcionamiento correctos.

## Validación responsive

- **Escritorio (1568px efectivos):** heading, párrafos y lista de tarjetas se integran
  visualmente con el resto del artículo; separador visible antes de la lista de enlaces; cada
  fila ocupa el ancho del contenedor `max-w-3xl` con icono alineado a la derecha.
- **Ancho estrecho tipo móvil (~390px, verificado constriñendo el contenedor de contenido):** las
  filas de enlaces envuelven el texto a dos líneas sin romper el borde ni desbordar
  horizontalmente; el icono permanece alineado y de tamaño fijo (`flex-none`); el área clicable
  (`px-4 py-3`) cubre toda la fila, no solo el texto.
- **Limitación del entorno de pruebas:** la herramienta de automatización de navegador de esta
  sesión no permitió forzar un cambio real de `window.innerWidth` (el redimensionado de ventana no
  tuvo efecto en este entorno), por lo que no se pudo capturar una emulación exacta del breakpoint
  `md:` de Tailwind. La verificación de envoltura de texto/tarjetas a ancho estrecho se hizo
  constriñendo el contenedor visual del documento. Las clases responsivas usadas
  (`text-2xl md:text-3xl`, `text-lg md:text-xl`) son las mismas ya validadas en producción en la
  sección de interpretación de resultados de esta misma página.
- Tablet: no se detectan breakpoints intermedios propios en el bloque (usa los mismos `md:` que el
  resto de la página, ya validados).

## Accesibilidad

- Lista real `<ul>`/`<li>`, cada `<li>` contiene un único `<a>` (vía `next/link`), sin roles
  artificiales.
- Foco visible por teclado: anillo `focus-visible:ring-2 ring-primary/40` en cada enlace.
- Contraste: `text-foreground` sobre `bg-card` (mismo par ya usado en tarjetas de interpretación,
  cumple contraste del sistema existente); icono en `text-muted-foreground` que pasa a
  `text-primary` en hover/foco.
- Área clicable: todo el bloque de la fila (`px-4 py-3`, ancho completo) es parte del enlace, no
  solo el texto.

## Validación de build/lint/tests

- `npm run build` → PASS
- `npm run lint` → 0 errores (76 warnings preexistentes, idénticos a los previos a este cambio;
  ningún error ni warning nuevo introducido)
- `npm test` → 585/586 (mismo fallo preexistente y ajeno en
  `src/__tests__/agents/tools/calculate-whatif.test.ts`, ya documentado en `PROJECT_STATUS.md`, no
  relacionado con este cambio)
- Servidor de producción local (`npm run start`): recuento de `<footer>` en
  `/herramientas/calculadora-ahorro` → 1 (sin regresión respecto al fix de
  `UI-CALCULADORA-AHORRO-FOOTER-DUPLICATE-01`, commit `52a0f77`).
- Calculadora verificada funcional tras el cambio: al introducir 3000€ de ingresos, el margen y la
  tasa de ahorro se recalculan correctamente en tiempo real.
- No se modificó metadata, `title`, H1, `canonical` ni ningún `schema`/JSON-LD de la página.

## Fuera de alcance (no tocado, conforme al STOP de la tarea)

- No se corrigieron los footers duplicados detectados en otras rutas (`/blog`, artículos de blog,
  `/tutorial`, `/herramientas`, `/herramientas/regla-50-30-20`), documentados como hallazgo
  pendiente en `UI_CALCULADORA_AHORRO_FOOTER_DUPLICATE_01.md`.
- No se optimizó SEO ni se modificó ningún otro bloque de la página.
