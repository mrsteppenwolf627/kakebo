# SEO_AUTHOR_AUDIT_01 — Auditoría de Autoría del Contenido Indexable

**Fecha:** 2026-07-07
**Tarea:** SEO-AUTHOR-AUDIT-01 (deriva de G-03 en `docs/seo/SEO_GEO_DEEP_AUDIT_01.md`)
**Tipo:** Solo diagnóstico — sin cambios en código, contenido ni configuración SEO
**Método:** Lectura directa del frontmatter de los 30 artículos de blog (15 ES + 15 EN), del componente que renderiza autoría y schema (`blog/[slug]/page.tsx`), de `layout.tsx` (metadata global), de las 3 páginas de herramientas, de la Home (schema `Organization`) y del contenido visible de `/sobre-nosotros` en ambos idiomas

---

## 1. Resumen ejecutivo

MetodoKakebo.com usa **hasta 6 identidades distintas** para atribuir su contenido, dependiendo de la superficie (frontmatter de blog, metadata global, schema JSON-LD, contenido visible de `/sobre-nosotros`). El hallazgo más relevante de esta auditoría no es una simple inconsistencia de nombre — es una **contradicción narrativa real**: 14 de 15 artículos ES y los 15 artículos EN atribuyen el contenido a un "equipo" ("Equipo Kakebo" / "Kakebo Team"), mientras que `/sobre-nosotros` (en ambos idiomas) afirma explícitamente en primera persona que **no hay equipo, sino un único desarrollador independiente llamado Aitor** ("No somos una gran corporación ni un equipo enorme. Soy Aitor..."). Esto no es solo un problema de coherencia de marca: es una señal de autoría potencialmente engañosa que compromete E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) precisamente en el eje que Google y los motores generativos evalúan con más peso — si la fuente es lo que dice ser.

Un solo artículo, `metodo-kakebo-guia-definitiva.es.mdx`, usa el nombre real ("Aitor Alarcón"), y ni siquiera su versión EN lo hace (usa "Kakebo Team" como el resto).

No se ha modificado ningún archivo. Este documento es solo diagnóstico.

---

## 2. Alcance revisado

| Superficie | Cantidad | Verificado |
|---|---|---|
| Artículos de blog ES (`.es.mdx`) — frontmatter `author` | 15 | ✅ Los 15 leídos |
| Artículos de blog EN (`.en.mdx`) — frontmatter `author` | 15 | ✅ Los 15 leídos |
| Componente de render del blog post (badge visible + schema `BlogPosting.author`) | 1 (`blog/[slug]/page.tsx`) | ✅ Código leído — mismo campo `post.frontmatter.author` alimenta ambos |
| Metadata global (`authors`, `creator`, `publisher` de Next.js) | 1 (`layout.tsx`) | ✅ Código leído |
| Schema `Organization` de Home (`@id` `#organization`) | 1 | ✅ Código leído — sin campo `founder` |
| Schema de herramientas (`author`/`publisher`) | 3 (`calculadora-ahorro`, `regla-50-30-20`, `calculadora-inflacion`) | ✅ Los 3 leídos |
| Schema del blog index (`publisher`) | 1 | ✅ Ya verificado en G-12 (resuelto: `MetodoKakebo.com`) |
| Contenido visible de `/sobre-nosotros` (sección "team") | 2 (ES + EN) | ✅ Ambos leídos |

**Total de páginas/superficies revisadas: 38** (15 + 15 + 1 + 1 + 1 + 3 + 1 + 2 = 40, contando cada artículo y cada superficie de metadata/schema por separado; ver desglose exacto en la tabla anterior — **39 unidades de verificación individuales**, agrupadas en 8 categorías de superficie).

---

## 3. Estado actual — inventario completo de identidades usadas

| Identidad | Dónde aparece | Cantidad de superficies |
|---|---|---|
| **"Equipo Kakebo"** | Frontmatter `author` de 14/15 artículos ES; visible en el badge de autor de cada artículo; `BlogPosting.author.name` en el schema de esos mismos 14 artículos | 14 artículos × 3 superficies (frontmatter + visible + schema) = mismo dato replicado, no 3 fuentes independientes |
| **"Aitor Alarcón"** | Frontmatter `author` de 1/15 artículos ES (`metodo-kakebo-guia-definitiva.es.mdx`); visible + schema del mismo artículo | 1 artículo |
| **"Kakebo Team"** | Frontmatter `author` de los 15/15 artículos EN (incluida la versión EN de `metodo-kakebo-guia-definitiva`, que en ES sí usa el nombre real) | 15 artículos |
| **"Kakebo AI Team"** | `layout.tsx` → `metadata.authors: [{ name: "Kakebo AI Team" }]` — meta tag `<meta name="author">`, aplicado globalmente a **todas** las páginas del sitio (blog, herramientas, Home, legales, app) | 1 (global, pero afecta a todas las páginas) |
| **"Kakebo AI"** | `layout.tsx` → `metadata.creator` y `metadata.publisher` (meta tags `<meta name="generator">`/`<meta name="publisher">`), aplicado globalmente | 1 (global) |
| **"MetodoKakebo.com"** | `Organization.name` en Home; `publisher.name`/`publisher.@id` en blog posts (tras G-12), blog index, y las 3 herramientas; `author.name` explícito solo en `calculadora-inflacion` | Múltiple, pero coherente entre sí (es la única identidad que sí se usa de forma consistente en todo el schema de `publisher`) |
| **"Aitor" (nombre de pila, sin apellido)** | Contenido visible de `/sobre-nosotros`, sección "Quién está detrás de Kakebo AI" / "Who is behind Kakebo AI", en primera persona, ES y EN | 2 (ES + EN) |

**Total de identidades textuales distintas en uso: 7.**

---

## 4. Respuestas al análisis solicitado

### 4.1 ¿Todas las páginas muestran la misma identidad?

**No.** Ninguna de las tres capas (contenido visible, metadata Next.js, schema JSON-LD) usa una identidad única y consistente en todo el sitio. La única identidad que sí es coherente en su propio subsistema es `"MetodoKakebo.com"` dentro de los campos `publisher` del schema — pero eso es la entidad/organización, no el autor humano del contenido.

### 4.2 ¿Existe mezcla entre "Equipo Kakebo", "Kakebo", "MetodoKakebo.com", "Aitor Alarcón" y otras variantes?

**Sí, mezcla confirmada de 7 variantes distintas** (tabla §3): "Equipo Kakebo", "Kakebo Team", "Aitor Alarcón", "Kakebo AI Team", "Kakebo AI", "MetodoKakebo.com" y "Aitor". No se encontró el término "Kakebo" a secas como identidad de autoría (ese problema específico, en el campo `publisher` del schema `BlogPosting`, ya se corrigió en la tarea G-12).

### 4.3 ¿Hay diferencias entre contenido visible, schema y metadata?

**Dentro de cada artículo de blog: no.** El componente `blog/[slug]/page.tsx` lee el mismo campo `post.frontmatter.author` tanto para el badge visible (avatar + nombre) como para `BlogPosting.author.name` en el JSON-LD — están sincronizados por diseño, no pueden divergir entre sí para un mismo artículo.

**Entre artículos y entre capas globales: sí, y de forma significativa:**
- La metadata global (`layout.tsx`) declara "Kakebo AI Team" como autor de **todas** las páginas del sitio — incluidas las que en su propio frontmatter/contenido dicen otra cosa (p. ej. `metodo-kakebo-guia-definitiva`, cuyo `<meta name="author">` heredado del layout sigue diciendo "Kakebo AI Team" aunque el artículo declare "Aitor Alarcón" en su frontmatter y en pantalla).
- El contenido visible de `/sobre-nosotros` contradice directamente el concepto de "equipo" usado en el resto del sitio.
- El schema de herramientas es inconsistente entre sí: `calculadora-inflacion` declara un `author` explícito (Organization/MetodoKakebo.com) que `calculadora-ahorro` y `regla-50-30-20` no declaran.
- Ningún schema (`Organization` de Home incluido) conecta formalmente a "Aitor" con la organización mediante un campo `founder` o `author` de tipo `Person` — la persona real detrás del proyecto no tiene ninguna entidad estructurada que la represente, pese a ser mencionada por nombre en contenido visible e indexable.

### 4.4 ¿Qué páginas necesitan cambios?

Sin implementar nada todavía, las páginas/superficies que una futura estrategia de autoría debería resolver, por orden de impacto:

1. Los 15 artículos ES (14 con "Equipo Kakebo" + verificar si `metodo-kakebo-guia-definitiva` debe ser el modelo a replicar o si necesita ajuste).
2. Los 15 artículos EN (15/15 con "Kakebo Team" — incluida la versión EN del artículo que en ES ya usa el nombre real).
3. `layout.tsx` — metadata global (`authors`, `creator`, `publisher`).
4. Schema `Organization` de Home — añadir (o no, según la decisión de estrategia) un campo `founder`/`employee` de tipo `Person`.
5. Los 3 schemas de herramientas — decidir si `author` debe declararse de forma uniforme en las 3 o en ninguna.
6. `/sobre-nosotros` — no necesita cambios de contenido (es la página más honesta y factual del sitio en este eje), pero sí debería ser la fuente de verdad que el resto de páginas reflejen.

---

## 5. Riesgos

| Riesgo | Severidad | Descripción |
|---|---|---|
| **Contradicción narrativa equipo vs. individuo** | **Alta** | El 93% de los artículos ES y el 100% de los EN atribuyen el contenido a un "equipo" plural que la propia página `/sobre-nosotros` niega explícitamente que exista. Si un usuario o un crawler cruza ambas páginas, la contradicción es directa y verificable, no una sutileza de estilo. |
| **E-E-A-T débil por autoría no verificable** | **Alta** | Google y los sistemas de respuesta generativa dan más peso a contenido con autoría real y verificable. Un byline genérico como "Equipo Kakebo"/"Kakebo Team" sin ninguna página de autor, bio o credenciales asociada es, en la práctica, autoría anónima — el peor escenario posible para E-E-A-T en contenido financiero (categoría YMYL-adyacente: dinero personal). |
| **Fragmentación de la entidad "autor" en metadata global** | **Media** | `layout.tsx` impone "Kakebo AI Team" a todas las páginas vía metadata de Next.js, sobrescribiendo semánticamente cualquier autoría específica declarada a nivel de artículo en la capa de metadata (no en el JSON-LD, que sí es correcto por artículo). |
| **Falta de entidad `Person` vinculada a la Organización** | **Media** | No hay ningún schema (`founder`, `author` a nivel de Organization, o página de autor con `Person` + `sameAs`) que conecte formalmente "Aitor" con "MetodoKakebo.com". Esto limita la elegibilidad para señales de autoría enriquecida (Google Knowledge Graph, citación en IA generativa con atribución a persona real). |
| **Inconsistencia estructural entre schemas de herramientas** | **Baja** | Un campo `author` presente en una herramienta y ausente en las otras dos no es incorrecto por sí mismo (schema.org no lo exige), pero es una asimetría sin justificación documentada. |
| **Divergencia ES/EN dentro del mismo artículo pilar** | **Baja-Media** | `metodo-kakebo-guia-definitiva` es el único caso donde la versión ES usa el nombre real y la EN no — sugiere que el cambio a autoría real no se replicó de forma sistemática ni siquiera dentro del mismo artículo entre idiomas. |
| **Email de contacto en dominio personal** | **Baja** | `/sobre-nosotros` publica `aitor@aitoralmu.xyz` (dominio personal) en lugar de un dominio `@metodokakebo.com`. No es un riesgo SEO/GEO en sí, pero es otra pequeña discrepancia de coherencia de marca entre "MetodoKakebo.com" como entidad y el canal de contacto real. |

---

## 6. Recomendación

**No ejecutar un cambio masivo de "Equipo Kakebo" → "Aitor Alarcón" en los 30 artículos sin antes decidir la estrategia de autoría** (ver §7). Cambiar la autoría de 30 archivos es una modificación de contenido indexable con impacto en E-E-A-T que merece su propia tarea deliberada, no un efecto colateral de esta auditoría.

Lo que sí se recomienda evaluar como próximos pasos, en orden de impacto/esfuerzo:

1. **Decidir la estrategia de autoría (ver §7) antes de tocar cualquier archivo.** Es la decisión que condiciona todo lo demás.
2. **Corregir la metadata global de `layout.tsx`** para que sea coherente con la estrategia elegida — es un solo archivo, afecta a todo el sitio, y hoy contradice tanto el contenido de blog como `/sobre-nosotros`.
3. **Alinear la versión EN de `metodo-kakebo-guia-definitiva`** con su versión ES una vez decidida la estrategia (hoy es el caso más flagrante de inconsistencia interna del mismo artículo).
4. **Considerar añadir una entidad `Person` (`founder`) al schema `Organization` de Home**, enlazándola con `/sobre-nosotros`, si la estrategia elegida es la de autoría real.
5. **Unificar el campo `author` en los 3 schemas de herramientas** (presente en las 3 o ausente en las 3, con justificación documentada).

---

## 7. Propuesta de estrategia de autoría (para decisión, no para ejecutar aquí)

Dos caminos razonables, con trade-offs distintos:

### Opción A — Autoría real única ("Aitor Alarcón" en todo el sitio)

- **A favor:** máxima coherencia con `/sobre-nosotros` (que ya cuenta la historia real de un indie hacker). Mejor E-E-A-T potencial si se complementa con una bio de autor y credenciales visibles. Es la opción que la propia auditoría GEO anterior (G-03) ya apuntaba como deseable.
- **En contra:** cambiar 30 archivos de contenido es una operación no trivial; requiere decidir también qué pasa con la metadata global y si se crea una página de autor (`/autor/aitor-alarcon` o similar) con bio y `sameAs`.
- **Alcance estimado:** 30 archivos `.mdx` (author frontmatter) + `layout.tsx` (metadata) + opcionalmente 1 página nueva de autor + schema `Organization` con `founder`.

### Opción B — Mantener "MetodoKakebo.com" como entidad autora/editora, sin personificar

- **A favor:** cambio mínimo — ya es la identidad usada en `publisher` en todo el sitio (post-G-12). Evita la complejidad de gestionar una entidad `Person` pública. Adecuado si no se quiere exponer más la identidad personal del fundador.
- **En contra:** no resuelve el problema de fondo (contenido financiero sin autoría humana verificable es más débil en E-E-A-T que contenido con un autor real y trazable). Requeriría igualmente reescribir `/sobre-nosotros` para dejar de mencionar a "Aitor" en primera persona, lo cual iría en contra de la autenticidad que esa página aporta hoy.

### Recomendación de esta auditoría, si se pide una preferencia

La **Opción A** es la más coherente con lo que el propio sitio ya comunica en `/sobre-nosotros` y con la dirección que marcaba G-03 en la auditoría GEO. Pero esta es una decisión de producto/marca, no solo técnica — se deja explícitamente para que el usuario decida antes de convertirla en tarea de implementación.

---

## 8. Validación de la auditoría

- **Número de páginas/superficies revisadas:** 39 unidades individuales (15 artículos ES + 15 artículos EN + 1 componente de render + 1 archivo de metadata global + 1 schema Organization de Home + 3 schemas de herramientas + 1 schema de blog index + 2 versiones de `/sobre-nosotros`).
- **Número de inconsistencias encontradas:** 7 identidades textuales distintas en uso, agrupadas en 6 hallazgos de riesgo (tabla §5), siendo 2 de severidad Alta, 2 de severidad Media, y 3 de severidad Baja/Baja-Media.
- **Nivel de prioridad general:** **Media-Alta.** No bloquea indexación ni funcionalidad, pero es un hallazgo de E-E-A-T con impacto directo en contenido financiero (categoría sensible), y la contradicción "equipo" vs. "individuo" es fácilmente detectable tanto por un usuario que lea dos páginas del sitio como por un motor generativo que cruce fuentes. Se recomienda decidir la estrategia (§7) en el próximo ciclo de planificación, sin urgencia de bloqueo inmediato.

---

*SEO_AUTHOR_AUDIT_01.md — 2026-07-07*
*Solo diagnóstico — sin cambios en código, contenido ni configuración SEO.*
