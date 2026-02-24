# 🚀 PLAN DE ACCIÓN SEO Y MARKETING (KAKEBO 2026)
*Documento Estratégico basado en la auditoría de Febrero 2026*

---

## 📋 VISIÓN GENERAL Y OBJETIVO
La web de Kakebo (metodokakebo.com) tiene una base técnica muy sólida construida en Next.js 14, pero actualmente su visibilidad orgánica en Google es prácticamente nula. Al enfrentar una competencia de altísima autoridad en el nicho de finanzas (BBVA, Xataka, Raisin), este plan estratégico no atacará de frente términos genéricos imposibles, sino que implementará una **estrategia de guerrilla SEO**: *Long-tails, herramientas interactivas (link baiting) y optimización de arquitectura de la información.*

**Meta a 3 meses:** Conseguir indexación total, corregir arquitectura, eliminar fricción técnica, empezar a rankear para long-tails de baja competencia y captar los primeros >100 visitantes orgánicos al día.

---

## 🔴 FASE 1: EMERGENCIAS TÉCNICAS (SEMANA 1)
*El objetivo inmediato es salir de la invisibilidad asegurándonos de que Googlebot pueda y quiera leer la web correctamente.*

### 1. Desbloqueo de Indexación y Rastreo
- **Acción:** Revisar `public/robots.txt` para asegurar que todo el portal no esté bloqueado (quitar cualquier `Disallow: /`).
- **Acción:** Verificar la existencia y correcta generación del `sitemap.xml` dinámico.
- **Acción:** Entrar a **Google Search Console** y solicitar la inspección e indexación manual de la Homepage y todas las sub-rutas primarias (`/es`, `/es/blog`, `/es/herramientas/...`).

### 2. Estructura de URLs y Canonicals
*Nota:* La web fue recientemente migrada a una arquitectura bilingüe (español/inglés) bajo los prefijos `/es/` y `/en/`. Mantendremos este prefijo porque SÍ existe una intención activa de internacionalización.
- **Acción:** Asegurar que `metodokakebo.com/` realice una redirección 301 definitiva a `metodokakebo.com/es/` de base según el idioma o preferencia, y que los **atributos hreflang** estén perfectamente configurados en el `<head>` apuntando a cada versión lingüística y al `x-default`.
- **Acción:** Revisar los metadatos de Next.js para asegurar que la **URL Canonical** de cada página apunte siempre hacia ella misma para evitar contenido duplicado entre los parámetros y variables.

### 3. SEO On-Page de la Homepage
- **Title Tag:** Cambiar la actual por una más limpia sin redundancias que ataque la palabra clave principal con diferenciación:
  - *Nuevo:* `Kakebo AI: App de Control de Gastos con Método Japonés | Sin Bancos`
- **H1:** Reemplazar el escaso "Kakebo AI":
  - *Nuevo:* `Kakebo AI: App de Ahorro Japonés con Inteligencia Artificial`
- **Jerarquía de Headings (H2/H3):** Re-estructurar los subtítulos de la web para orientarlos a keywords informacionales en vez de slogans de marketing, por ejemplo de "Minimalismo Financiero" a "¿Cómo funciona el Método de Ahorro Kakebo Digital?".
- **Meta Description:** Añadir descripciones atractivas orientadas al CTR, que destaquen "app inteligente", "control gastos", "gratuitamente", resolviendo el problema directo del usuario.

### 4. Implementación de Datos Estructurados (Schema)
Mejorará enormemente la presentación en Google.
- **Homepage:** Añadir `SoftwareApplication` (con rating/review placeholders temporales y precios `$0-$3.99` o "Free Trial").
- **FAQ:** Implementar `FAQPage` schema para ganar el bloque de acordeón en los resultados de Google.

---

## 🟡 FASE 2: ARQUITECTURA ESTRATÉGICA Y CONTENIDOS (SEMANAS 2-4)
*Solucionar el problema crítico de canibalización y preparar el terreno del Blog.*

### 1. Keyword Mapping (1 URL = 1 Intención de Búsqueda)
Para arreglar la canibalización:
- **Homepage (`/es/`):** Exclusiva para la Marca ("Kakebo AI") y el concepto principal competitivo ("app de ahorro japonés", "app control gastos metodokakebo").
- **Sección Tutorial (`/es/tutorial`):** Optimizada exclusivamente para "cómo funciona kakebo paso a paso".
- **Calculadoras y Herramientas (`/es/herramientas/...`):** Serán la punta de lanza transaccional ("calculadora regla 50 30 20", "calculadora inflacion ahorros").
- **Blog (`/es/blog/...`):** Términos netamente informacionales y consultas pain-point concretas de long-tail (ver abajo).

### 2. Puesta a punto del Blog (El Motor Orgánico)
El blog debe poblarse con al menos 8-10 artículos súper nicho que las entidades bancarias rechazan cubrir.
- **Temas propuestos (Baja Competencia):**
  1. *Plantilla kakebo excel gratis (y por qué una AI es mejor)*
  2. *Cómo adaptar el cuaderno kakebo al formato digital en 2026*
  3. *Eliminar gastos hormiga paso a paso con el método japonés*
  4. *Qué es la regla 50/30/20 y cómo aplicarla en España*
  5. *Alternativas gratuitas a Fintonic u otras apps bancarias*

---

## 🟢 FASE 3: AUTORIDAD Y LINK BUILDING (MES 2-3)
*Afrontar la realidad del DA/DR casi 0 del dominio. Una vez la casa esté ordenada, hay que traer reputación.*

### 1. Estrategia de Menciones Base ("Guerrilla Marketing")
Conseguir tráfico y links iniciales desde comunidades hispanas, promocionando Kakebo NO como spam, sino como alguien que "ha creado una alternativa útil y gratuita a las apps de bancos".
- Foros: **Rankia**, **Forocoches** (sección Finanzas).
- Comunidades: **Reddit** (`r/SpainFinance`, `r/SpainFIRE`, `r/PersonalFinance`).

### 2. Promoción de Herramientas (Link Baiting)
- Coger la Herramienta "Calculadora 50/30/20" y "Calculadora de Inflación" y presentarla proactivamente en directorios SaaS, o escribirle a bloggers de finanzas pequeñas/medianas que explican el concepto en sus webs ofreciéndoles incrustar/enlazar las herramientas gratuitas que hemos diseñado en Kakebo.

### 3. Competencia "Kakeboai.com"
Este es el portal competidor de origen italiano (control por voz).
- Asegurar que nuestra keyword "Kakebo AI" (marca propia) destaque que el enfoque es: "Método Japonés de 4 Categorías + Agente Conversacional Analítico", logrando diferenciación en marca por calidad del producto.

---

## 📈 FASE 4: ANÁLISIS DE RESULTADOS FINALES Y CORE WEB VITALS (MESES 3+)
- Asegurarnos del performance en Lighthouse, revisar si existe algún cuello de botella inyectado por scripts externos (como el widget de Product Hunt) usando *lazy loading* o `next/script` en estrategia "worker".
- Monitoreo mensual de posiciones en Google Search Console para los Main/Long-tail keywords detectados.

---

## ✅ MEJORAS DE CONTENIDO BLOG APLICADAS (2026-02-24)

*Todas las mejoras del documento `docs/marketing/blog-mejoras-seo.md` fueron aplicadas a los 12 artículos `.es.mdx`.*

### Cambios globales (todos los artículos)
- Emojis eliminados de todos los H2
- Fechas escalonadas (de `2025-11-18` a `2026-02-13`)
- CTA H2 único y específico por artículo antes del botón final
- Sección `## Artículos relacionados` con 3 links internos en cada artículo

### Expansiones de contenido (artículos críticos)
- **`kakebo-online-gratis`**: +800 palabras — paso a paso, tabla comparativa de opciones, FAQ, sección de uso en móvil
- **`metodo-kakebo-guia-definitiva`**: +1.200 palabras — historia de Motoko Hani, las 4 preguntas del método, errores frecuentes, comparativa vs YNAB/50-30-20

### Reescrituras de tono (artículos con léxico excesivo)
- `kakebo-sueldo-minimo`: Las 3 reglas y sección digital completamente reescritas
- `kakebo-vs-ynab`: Sección final "Lo mejor de ambos mundos" reescrita
- `metodo-kakebo-para-autonomos`: Introducción, cita y secciones extremas reescritas
- `libro-kakebo-pdf`: Sección `El Kakebo Digital` completamente reescrita
- `regla-30-dias`: Paso a paso y sección Kakebo AI reescritas
- `ahorro-pareja`: Modelos de cuenta y sección IA reescritas

### Contenido nuevo (secciones añadidas)
- `eliminar-gastos-hormiga`: Nueva sección "Cómo detectar tus gastos hormiga este mes"
- `alternativas-a-app-bancarias`: Párrafo final reescrito (más directo y creíble)
- `peligros-apps-ahorro-automatico`: Sección `Kakebo AI` reescrita sin hipérboles
- `plantilla-kakebo-excel`: Párrafo "veredicto final" mejorado en tono

---

## ✅ MEJORAS DE CONTENIDO BLOG EN INGLÉS APLICADAS (2026-02-24)

*Todas las mejoras equivalentes a los artículos `.es.mdx` fueron aplicadas a los 12 artículos `.en.mdx`.* (commit `0662cbb`)

### Cambios globales (todos los artículos EN)
- Emojis eliminados de todos los H2 (💻, 📱, 🤖, 🐜, 🕵️, 🇺🇸, 🇯🇵, 🏆, 🎢, 📖, 🧠, 👁️, etc.)
- Fechas escalonadas (de `2025-11-18` a `2026-02-10`, espejando versiones ES)
- CTA H2 único y específico por artículo antes del botón final
- Sección `## Related articles` con 3 links internos `/en/blog/` en cada artículo

### Expansiones de contenido
- **`kakebo-online-gratis.en.mdx`**: +800 palabras — paso a paso (5 pasos), tabla comparativa, FAQ, sección de uso en móvil
- **`metodo-kakebo-guia-definitiva.en.mdx`**: Reescritura completa de ~48 líneas a ~2000 palabras — historia de Motoko Hani, 4 preguntas del método, errores frecuentes, comparativa vs YNAB/50-30-20

### Reescrituras de tono (artículos con léxico hiperbólico/incoherente)
- `kakebo-sueldo-minimo.en.mdx`: Las 3 reglas y la sección digital completamente reescritas
- `kakebo-vs-ynab.en.mdx`: Sección `### 🚀 Kakebo AI` extremadamente verbosa reemplazada
- `metodo-kakebo-para-autonomos.en.mdx`: Paso 3, categorías, cita y sección IA reescritas
- `libro-kakebo-pdf.en.mdx`: Sección `## ⚡ Digital Kakebo` completamente reescrita (4 párrafos limpios)
- `regla-30-dias.en.mdx`: Paso a paso y sección Kakebo AI reescritas
- `ahorro-pareja.en.mdx`: Modelos de cuenta y sección IA reescritas
- `peligros-apps-ahorro-automatico.en.mdx`: Sección `## ⛩️ Kakebo AI` reescrita
- `alternativas-a-app-bancarias.en.mdx`: Sección `## 🎬 Decision Making` eliminada y reemplazada

### Contenido nuevo (secciones añadidas)
- `eliminar-gastos-hormiga.en.mdx`: Nueva sección "How to use Kakebo to detect your latte factor this month"
- `plantilla-kakebo-excel.en.mdx`: "The final verdict" reescrito con tono más equilibrado

---

**Resumen de Carga de Trabajo Inmediato:**
Hoy mismo hay que corregir el Site `robots.txt`, el `sitemap.xml`, lanzar la reindexación, modificar el `page.tsx` del index (Title, H1, Meta), el `page.tsx` (RootLayout para Canonicals) y configurar los schemas de forma manual o utilizando `next: metadata`.
