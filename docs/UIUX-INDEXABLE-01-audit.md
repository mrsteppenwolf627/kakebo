# UIUX-INDEXABLE-01 — Auditoría Visual y UX
## Páginas Públicas Indexables · MetodoKakebo.com

**Fecha:** 2026-06-22  
**Tipo:** Etapa 1 — solo diagnóstico. Sin cambios de código.  
**Scope:** Parte pública indexable (`/`, `/blog`, `/blog/[slug]`, `/herramientas/*`, Navbar, Footer)  
**Excluye:** `/app/*`, dashboard, autenticación, lógica de negocio

---

## Archivos y componentes revisados

| Archivo | Qué representa |
|---|---|
| `src/app/globals.css` | Paleta completa, variables CSS, fuentes, dark mode |
| `tailwind.config.ts` | Tokens de diseño, tipografía, plugins |
| `src/app/[locale]/(public)/page.tsx` | Estructura completa de la home |
| `src/components/landing/Navbar.tsx` | Navbar fijo, dropdown herramientas, CTAs, mobile menu |
| `src/components/landing/Hero.tsx` | Sección hero, H1, badge, stats, Product Hunt badge |
| `src/components/landing/Features.tsx` | Grid de features, tarjetas |
| `src/components/landing/HowItWorks.tsx` | Timeline de pasos, ejemplo de presupuesto |
| `src/components/landing/Testimonials.tsx` | Sección testimonios, avatares emoji |
| `src/components/landing/SavingsSimulator.tsx` | Simulador interactivo de ahorro |
| `src/components/landing/FAQ.tsx` | Acordeón de preguntas frecuentes |
| `src/components/landing/SeoContent.tsx` | Sección SEO al final de la home |
| `src/components/landing/Footer.tsx` | Footer 4 columnas, Product Hunt widget embebido |
| `src/app/[locale]/(public)/blog/page.tsx` | Índice del blog, featured card, grid |
| `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Artículo individual, prose, CTA |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Página de herramienta pública |

---

## Diagnóstico general

La interfaz pública de MetodoKakebo.com tiene **una base visual correcta**: paleta Zen/Wabi-Sabi coherente en intención, tipografía con carácter (Playfair Display + Inter), y un tono sobrio apropiado para finanzas personales.

El problema no es que la estética sea mala. El problema es que **la ejecución está al ~60% de lo que el sistema de diseño promete**. Hay inconsistencias estructurales que hacen que el conjunto se perciba como un proyecto en progreso más que como un producto terminado.

**Tres tensiones principales:**

1. La home actúa como landing de producto SaaS genérica (hero → features → cómo funciona → testimonios → FAQ). Patrón de plantilla reconocible que no diferencia la marca.
2. El blog funciona bien como experiencia editorial — `max-w-3xl`, `prose-lg`, tipografía serif en encabezados. Es la parte más pulida del sitio.
3. La tensión entre "app de producto" y "blog editorial de autoridad" no está resuelta visualmente.

---

## 1. Tipografía

### Paleta tipográfica activa

- `font-serif` = Playfair Display
- `font-sans` = Inter (default)
- Intención: Playfair para jerarquía/autoridad, Inter para lectura/cuerpo

### Hallazgos

**T1 — CRÍTICO: El H2 de sección no tiene regla tipográfica coherente**

| Sección | Clase tipográfica H2 |
|---|---|
| Features | `text-4xl font-serif font-normal` |
| HowItWorks | `text-4xl font-bold tracking-tight` ← sin serif |
| Testimonials | `text-3xl font-bold tracking-tight` ← sin serif |
| SavingsSimulator | `text-3xl font-serif font-medium` |
| FAQ | `text-4xl font-serif font-normal` |

HowItWorks y Testimonials rompen el sistema al abandonar `font-serif`. La home no tiene un ritmo tipográfico consistente entre secciones. El usuario no lo nota conscientemente pero lo siente como ruido visual.

**T2 — IMPORTANTE: HowItWorks abandona la voz visual de la marca**

Los `h3` de los pasos usan `text-2xl font-bold` (sans, bold) mientras que las cards de Features usan `text-lg font-serif`. HowItWorks parece de otro producto dentro del mismo sitio.

**T3 — IMPORTANTE: Los H2 de sección varían en tamaño sin razón aparente**

`text-4xl` (Features, HowItWorks, FAQ) vs `text-3xl` (SavingsSimulator, Testimonials). En un sistema bien definido, todas las secciones del mismo nivel usan el mismo tamaño base.

**T4 — SECUNDARIO: Pesos de serif inconsistentes**

`font-normal` (Features, FAQ) vs `font-medium` (SavingsSimulator) vs `font-bold` (Hero H1, blog). No hay una regla documentada para cuándo el serif es ligero vs negrita.

**T5 — POSITIVO: Experiencia de lectura del artículo individual es excelente**

`prose-lg prose-stone`, `prose-headings:font-serif`, `prose-p:font-light`, `max-w-3xl`. El blog tiene la tipografía más resuelta del sitio.

---

## 2. Color

### Paleta en uso

| Token | Valor | Uso |
|---|---|---|
| `background` | `#fafaf9` — papel de arroz cálido | Correcto |
| `foreground` | `#1c1917` — negro tinta suave | Correcto |
| `primary` | `#cf5c5c` — terracota/arcilla | Bien aplicado y diferenciador |
| `muted-foreground` | `#57534e` | Consistente |
| `border` | `#e7e5e4` | Correcto, muy sutil |
| `accent` | `#818cf8` — índigo lavanda | **Definido pero ausente en la UI pública** |

### Hallazgos

**C1 — CRÍTICO: Colores hardcoded en HowItWorks rompen el sistema de tokens**

```tsx
// HowItWorks.tsx
<span className="font-bold text-green-600 dark:text-green-400">1.800€</span>
<span className="font-bold text-red-600 dark:text-red-400">-950€</span>
```

Son los únicos colores con nombre explícito en toda la parte pública. El verde y el rojo de Tailwind no tienen relación con la paleta Zen/Wabi-Sabi.

**C2 — IMPORTANTE: Testimonials usa `bg-stone-50 dark:bg-stone-900/50` hardcoded**

El resto de secciones alternas usan el token semántico `bg-muted/30`. Testimonials usa un hardcode que en dark mode genera incoherencia visual.

**C3 — IMPORTANTE: CTA del artículo usa `bg-stone-900` hardcoded**

```tsx
<div className="mt-16 rounded-2xl bg-stone-900 px-6 py-10 text-center text-white">
```

En dark mode, `bg-stone-900` sobre `background: #1c1917` crea contraste mínimo. Debería usar `bg-foreground` o un token semántico.

**C4 — SECUNDARIO: El token `accent` (#818cf8 índigo) no se usa en la UI pública**

Está definido en el tema pero es invisible al usuario. Oportunidad de segundo punto de acento sin trabajo adicional.

**C5 — POSITIVO: Uso de `primary/10` como fondo de badge**

El patrón `bg-primary/10 text-primary` en el badge de artículo destacado y el avatar de autor es un uso elegante que crea relaciones visuales suaves.

---

## 3. Motion / Interacción

### Patrones presentes

| Elemento | Hover / Transición |
|---|---|
| Navbar links | `transition-colors hover:text-foreground` — sutil |
| FeatureCards | `hover:border-primary/50` — solo border |
| Blog cards | `hover:border-primary/50 hover:shadow-md transition-all` |
| Featured card + imagen | `group-hover:scale-105 transition-transform duration-300` |
| Blog grid imágenes | `hover:scale-105` sin `group` |
| Blog CTA button | `hover:scale-105` |
| Navbar CTA buttons | `hover:bg-primary/90 transition-colors` — sin scale |
| Mobile menu | `animate-in slide-in-from-top-2` — bien aplicado |
| FAQ items | `hover:border-foreground/50` — correcto |

### Hallazgos

**M1 — IMPORTANTE: No existe regla unificada para el hover de botones**

| Elemento | Hover |
|---|---|
| Navbar CTA (primario) | `bg-primary/90` — solo color |
| Blog artículo CTA button | `scale-105` — solo escala |
| Blog "Leer más" links | `hover:underline` |
| Hero CTA secundario | `hover:border-foreground` — solo border |

Cuatro patrones distintos para acciones de llamada. El resultado es incoherencia gestual.

**M2 — IMPORTANTE: Dropdown de herramientas es solo CSS hover, sin teclado**

```tsx
<div className="relative group">
  <button>Herramientas</button>
  <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible ...">
```

No se puede abrir con teclado, no tiene `aria-expanded`, no funciona en táctil. Gap de accesibilidad real.

**M3 — SECUNDARIO: Scale-105 en imágenes del grid sin `group` explícito**

Las imágenes del grid usan `hover:scale-105` directamente en `<Image>`. Funciona, pero el patrón `group` del featured card es más correcto y mantenible.

**M4 — POSITIVO: Mobile menu con `animate-in slide-in-from-top-2`**

Es la animación más cuidada del sitio. Uso correcto de tailwindcss-animate.

---

## 4. Fondos y separación visual

### Secuencia de fondos en la home

| Sección | Fondo |
|---|---|
| Hero | `bg-background` |
| Features | `bg-muted/30` |
| SavingsSimulator | `bg-primary/5 border-y border-primary/10` |
| HowItWorks | `bg-muted/30` (absolute inset) |
| Testimonials | `bg-stone-50 dark:bg-stone-900/50` ← hardcoded, rompe el patrón |
| SEO whatIs | `bg-background` + card `bg-card border` |
| SEO categories | `bg-muted/30` + card `backdrop-blur-sm` |
| FAQ | `bg-background` |
| SeoContent | `border-t border-border` |

### Hallazgos

**F1 — CRÍTICO: Ancho de contenido cambia arbitrariamente al hacer scroll**

| Sección | Max-width |
|---|---|
| Navbar | `max-w-6xl` |
| Hero | `max-w-6xl` |
| Features | `max-w-7xl` ← más ancho |
| SavingsSimulator | `max-w-4xl` (inner card) ← más estrecho |
| HowItWorks | `max-w-7xl` ← más ancho |
| Testimonials | `max-w-7xl lg:max-w-none` ← sin límite |
| SEO whatIs | `max-w-5xl` |
| SEO categories | `max-w-5xl` |
| FAQ | `max-w-4xl` ← más estrecho |
| SeoContent | `max-w-5xl` |

El contenido respira a distintos anchos según la sección. El eje visual izquierdo y derecho se mueve al hacer scroll. Es el problema estructural más crítico de la home.

**F2 — IMPORTANTE: `backdrop-blur-sm` en la card de SEO categories no hace nada visible**

El card tiene `bg-card/60 backdrop-blur-sm`. Para que el blur sea perceptible necesita un fondo con transparencia real detrás. El `bg-muted/30` de la sección no es suficientemente texturado.

**F3 — IMPORTANTE: FeatureCards sin diferenciadores visuales internos**

Solo `border border-border bg-card` + texto. Sin icono, sin acento de color, sin elemento gráfico. 4 cards idénticas en estructura. Correctas pero sin personalidad — cualquier proyecto shadcn/tailwind tiene la misma grid.

**F4 — SECUNDARIO: Alternado bg-background/bg-muted/30 se rompe con Testimonials**

La alternancia de fondos crea ritmo de lectura. Cuando Testimonials usa `bg-stone-50` hardcoded en lugar de `bg-muted/30`, ese ritmo se interrumpe aunque el color sea muy similar.

**F5 — POSITIVO: `bg-primary/5 border-y border-primary/10` de SavingsSimulator**

Es el uso más elegante de la paleta en la home. Señaliza "sección especial" sin gritar. Modelo para otras secciones que necesiten destacar.

---

## 5. Layout

### Hallazgos

**L1 — CRÍTICO: Features grid tiene 4 tarjetas en `lg:grid-cols-3`**

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  <FeatureCard ... />  {/* 1 */}
  <FeatureCard ... />  {/* 2 */}
  <FeatureCard ... />  {/* 3 */}
  <FeatureCard ... />  {/* 4 ← sola en la segunda fila en desktop */}
```

En `lg:grid-cols-3`, el cuarto card ocupa 1/3 del ancho en una segunda fila, alineado a la izquierda. Asimetría sin propósito.

**L2 — CRÍTICO: Navbar muestra hash links a secciones de home desde cualquier página**

```tsx
<Link href={getHashPath("#features") as any}>Funcionalidades</Link>
<Link href={getHashPath("#how-it-works") as any}>Cómo funciona</Link>
```

`getHashPath("#features")` devuelve `/#features` cuando el usuario no está en home. Desde un artículo del blog, hacer clic en "Funcionalidades" lleva al usuario fuera del artículo y de vuelta a la home. UX trap que interrumpe la lectura.

**L3 — IMPORTANTE: Blog article CTA atrapada dentro de `max-w-3xl`**

El bloque de conversión al final del artículo (`bg-stone-900 rounded-2xl`) está dentro del contenedor de texto (`max-w-3xl`). A 768px de ancho máximo, el bloque se ve estrecho. Los CTAs de conversión suelen tener más peso visual si rompen o amplían el contenedor de texto.

**L4 — IMPORTANTE: Footer con Product Hunt widget de estilos inline extraños al sistema**

```tsx
<div style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI"...',
  background: 'rgb(255, 255, 255)',
  borderRadius: '12px',
  ...
}}>
  <a style={{ background: 'rgb(255, 97, 84)', color: 'rgb(255, 255, 255)' }}>
    Check it out on Product Hunt →
  </a>
```

Estilos inline hardcoded, tipografía system font, fondo blanco fijo y botón naranja. Es el elemento más ruidoso y menos integrado de toda la parte pública.

**L5 — SECUNDARIO: Blog index sin separación visual entre featured y grid**

El featured card tiene `mb-10` pero no hay elemento visual (título, separador, label) que diferencie el artículo destacado del grid. En mobile la transición es abrupta.

**L6 — SECUNDARIO: Hero con siete elementos apilados verticalmente**

Badge → H1 → H2/subtítulo → CTAs → Trust signal → Product Hunt badge → Stats card. Demasiados niveles de contenido para una sola sección. El stats card en particular (`max-w-4xl`) es más ancho que la columna de texto (`max-w-3xl` del subtítulo), lo que crea una asimetría dentro del propio Hero.

---

## 6. Atmósfera / Dirección estética

### Qué transmite actualmente

La web transmite **"herramienta fintech minimalista con aspiraciones editoriales"**. El intento Zen/Wabi-Sabi está en los comentarios del CSS y en algunos tokens, pero el usuario sin esa información no lee "japonés" — lee "neutral moderno con color terracota".

### Aciertos de identidad

- El nombre "Kakebo" es distintivo y la paleta terracota + fondo cálido tiene coherencia interna.
- Playfair Display en el blog da autoridad editorial real.
- La propuesta "sin conexión bancaria, gratis para siempre, privacidad" es clara y diferenciadora.
- El sistema de colores semánticos (cuando se usa correctamente) es sólido.

### Problemas de identidad

**A1 — CRÍTICO: Las secciones de la home siguen estructura de SaaS template genérica**

Hero → Features grid → Cómo funciona (timeline) → Testimonios (masonry) → FAQ (acordeón). Es la secuencia estándar de cualquier herramienta SaaS construida con shadcn/tailwind. El contenido es correcto pero el patrón es reconocible como template y no diferencia la marca.

**A2 — IMPORTANTE: Testimonios con avatares emoji comprometen la credibilidad**

```tsx
{ id: 't1', emoji: "👩‍🎨" },
{ id: 't2', emoji: "👨‍💻" },
```

Los emojis como representación de personas reales no transmiten credibilidad. En un producto de finanzas personales, la confianza es esencial. Los testimonios en este estado se perciben como prototipo.

**A3 — IMPORTANTE: Product Hunt widget en dos ubicaciones rompe la atmósfera**

El badge en Hero (imagen externa con fondo blanco visible) y el widget en Footer (caja blanca, tipografía system font, botón naranja hardcoded) son elementos importados que hablan un idioma visual completamente distinto al del sitio. Añaden prueba social a un coste visual alto.

**A4 — POSITIVO: El blog como experiencia editorial es la parte más lograda**

Cuando el usuario lee un artículo — `max-w-3xl`, prose-lg, serif en H2/H3, fondo limpio, no hay nada extraño. Es sereno, legible, con autoridad. Esta es la experiencia que la home debería emular más.

### Oportunidades no aprovechadas

**O1 — `.bg-sakura` definida en CSS pero sin usar en páginas públicas**

```css
.bg-sakura {
  background-image: linear-gradient(rgba(250, 250, 249, 0.85), ...), url("/bg-sakura.png");
}
```

Existe una textura de cerezos preparada en el sistema. Sería el único elemento que ancla visualmente la identidad japonesa. No se usa en ninguna página pública.

**O2 — Token `accent` (#818cf8 índigo lavanda) completamente dormido**

La paleta tiene un segundo color de acento definido que no aparece en la interfaz pública. Podría crear momentos de énfasis visual sin trabajo adicional.

**O3 — Patrón `bg-primary/5 border-y border-primary/10` como referencia**

El SavingsSimulator usa el patrón más elegante de la home. Podría usarse como referencia para otras secciones que necesiten destacar.

---

## Resumen por prioridad

### Críticos — bloquean percepción de producto terminado

| ID | Problema | Componente |
|---|---|---|
| F1 | Max-width cambia en cada sección (6xl → 7xl → 5xl → 4xl) | Home page.tsx + cada componente |
| L2 | Hash links a home desde blog — UX trap | Navbar.tsx |
| L1 | Features grid: 4 tarjetas en 3-col → card huérfana | Features.tsx |
| T1 | H2 de sección sin regla: serif/non-serif, normal/bold | Features, HowItWorks, Testimonials, SavingsSimulator |
| C1 | Hardcoded `text-green-600 text-red-600` | HowItWorks.tsx |
| A1 | Estructura de home = SaaS template genérica | page.tsx (home) |

### Importantes — degradan calidad visual percibida

| ID | Problema | Componente |
|---|---|---|
| A2 | Avatares emoji en testimonios | Testimonials.tsx |
| A3 | Product Hunt widget en footer | Footer.tsx |
| M1 | Hover de CTAs inconsistente (scale / color / border / underline) | Navbar, Hero, blog/[slug]/page |
| L3 | CTA de artículo atrapada en max-w-3xl | blog/[slug]/page.tsx |
| C2 | `bg-stone-50` hardcoded en Testimonials | Testimonials.tsx |
| C3 | `bg-stone-900` hardcoded en CTA artículo | blog/[slug]/page.tsx |
| M2 | Dropdown herramientas solo CSS hover, sin teclado | Navbar.tsx |
| F3 | FeatureCards sin diferenciadores visuales (solo texto) | Features.tsx |

### Secundarios — refinamiento

| ID | Problema | Componente |
|---|---|---|
| L4 | Product Hunt widget footer demasiado pesado | Footer.tsx |
| T3 | Tamaños H2 inconsistentes (4xl vs 3xl) | múltiples |
| F2 | `backdrop-blur-sm` invisible en SEO categories | page.tsx (home) |
| L5 | Blog index sin separación visual featured / grid | blog/page.tsx |
| L6 | Hero con 7 elementos apilados verticalmente | Hero.tsx |
| T4 | Pesos de serif sin regla (normal/medium/bold) | múltiples |
| M3 | Scale-105 en blog grid sin grupo explícito | blog/page.tsx |

### Oportunidades

| ID | Oportunidad | Coste de implementación |
|---|---|---|
| O1 | `.bg-sakura` disponible, no usada — anclaría identidad japonesa | Muy bajo |
| O2 | Token `accent` (#818cf8) sin usar — segundo punto de acento | Bajo |
| O3 | Experiencia blog es el modelo visual a replicar | Referencia |
| O4 | Patrón `bg-primary/5 border-y` de SavingsSimulator como referencia | Referencia |
| O5 | Propuesta "sin banco + gratis + privacidad" podría tener más protagonismo visual | Bajo-Medio |

---

## Dirección estética recomendada

**Nombre:** *Editorial financiero con identidad japonesa propia*

MetodoKakebo.com no debería parecerse a un SaaS genérico ni a un blog personal de finanzas. Debería sentirse como **una publicación editorial de finanzas personales que tiene una herramienta integrada**. La referencia visual está entre una revista financiera minimalista y una papelería japonesa de calidad.

### 6 decisiones concretas de dirección

**1. Un solo max-width rector**
Todo el contenido principal de la home en `max-w-6xl`. Secciones de lectura/editorial en `max-w-4xl`. Artículos en `max-w-3xl`. Sin más variaciones. El eje visual debe ser estable.

**2. Regla tipográfica para H2 de sección**
`font-serif font-normal` para la landing (tono elegante/suave). `font-serif font-bold` para el blog (tono editorial/autoritativo). Una regla, dos contextos documentados.

**3. Navbar contextual según sección**
Cuando el usuario lee un artículo, el Navbar debe sentirse editorial. Sin hash links a secciones de la home. El contexto de lectura no debería competir con la navegación del producto.

**4. Testimonios sin emoji**
Texto puro con nombre, rol y quizás una inicial estilizada en `font-serif`. La credibilidad en finanzas no se construye con emojis.

**5. Product Hunt en una sola ubicación**
El Hero es el lugar correcto. Eliminarlo del footer preserva el peso editorial del cierre de página.

**6. Activar `.bg-sakura` en una sección**
Sutilmente, al nivel de opacidad ya configurado en el CSS (85% overlay en light, 92% en dark). Sería el único elemento que ancla visualmente la identidad japonesa del nombre.

---

## Lista de tareas de implementación (Etapa 3)

*Pendientes de que se apruebe la dirección estética en Etapa 2.*

| ID | Tarea | Impacto | Dificultad estimada |
|---|---|---|---|
| UIUX-02 | Estandarizar max-width: `max-w-6xl` home, `max-w-4xl` editorial | Muy alto | Bajo |
| UIUX-03 | Contextualizar Navbar en blog: quitar hash links home | Alto | Medio |
| UIUX-04 | Resolver Features grid: 2×2 o añadir 5ª feature para completar 3-col | Alto | Muy bajo |
| UIUX-05 | Unificar H2 de sección: `font-serif font-normal` en landing | Alto | Bajo |
| UIUX-06 | Reemplazar avatares emoji en Testimonials por atribución textual | Alto | Bajo |
| UIUX-07 | Eliminar widget Product Hunt del footer | Medio-Alto | Muy bajo |
| UIUX-08 | Reemplazar hardcoded colors con tokens semánticos | Medio | Bajo |
| UIUX-09 | Activar `.bg-sakura` en una sección de la home | Medio | Muy bajo |
| UIUX-10 | Añadir diferenciadores visuales a FeatureCards (icono o acento) | Medio | Medio |
| UIUX-11 | Definir y aplicar regla unificada de hover para CTAs | Bajo-Medio | Bajo |
| UIUX-12 | Ampliar o separar CTA de artículo del contenedor de texto | Bajo-Medio | Bajo |
| UIUX-13 | Hacer dropdown de herramientas accesible con teclado | Bajo | Medio |
| UIUX-14 | Añadir separación visual labeled entre featured y grid en blog index | Bajo | Muy bajo |
| UIUX-15 | Explorar uso del token `accent` en un elemento de énfasis | Bajo | Medio |

---

## Estado

| Punto | Estado |
|---|---|
| Código modificado | Ninguno. Solo lectura y diagnóstico. |
| Siguiente tarea | UIUX-DIRECCIÓN-01 — Acordar dirección estética con el usuario |
| Implementación | Etapa 3 — pendiente de aprobación de Etapa 2 |
