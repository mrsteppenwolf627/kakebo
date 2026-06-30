# SEO-PILLAR-EXCEL-AUDIT-01 — Auditoría de Página Pilar Orgánica

**Fecha de auditoría:** 2026-06-30  
**URL auditada:** `https://www.metodokakebo.com/blog/plantilla-kakebo-excel`  
**Tipo:** Solo documentación — sin cambios en código, contenido, SEO, routing ni imágenes  
**Estado:** Completado

---

## Resumen ejecutivo

`/blog/plantilla-kakebo-excel` es la página con mayor tracción orgánica actual del sitio. Combina intención transaccional de recurso gratuito (descarga de plantilla) con intención informacional (cómo usar el método Kakebo), lo cual explica su rendimiento. La página tiene una base SEO sólida: keyword en H1, JSON-LD especializado `SoftwareApplication`, FAQPage con 5 preguntas y recurso descargable real. Sin embargo, presenta riesgos accionables: meta title truncado en SERP (~93 chars vs. límite ~65), jerarquía de headings rota (H3 antes del primer H2), enlazado interno incompleto hacia herramientas estratégicas, y `dateModified` congelado en la fecha de publicación. Ningún riesgo es bloqueante, pero varios limitan el CTR y el rendimiento a escala.

---

## Datos conocidos de GSC / GA4

| Señal | Dato |
|---|---|
| GA4 | Principal landing page orgánica del sitio |
| GA4 | Engagement superior a otras URLs del blog |
| GSC — Keywords principales | `kakebo excel`, `kakebo excel gratis`, `plantilla kakebo excel`, `plantilla kakebo excel gratis` |
| GSC | Concentra la mayor parte de clics orgánicos del dominio |
| Posición estimada | Top resultados para términos de nicho |

*Nota: Los datos numéricos exactos de clics, impresiones y CTR deben contrastarse con el panel GSC actualizado antes de cualquier tarea de optimización.*

---

## Intención de búsqueda principal

**Categoría:** Transaccional-informacional mixta  
**Núcleo de intención:** El usuario busca descargar una plantilla de Excel para llevar el Kakebo. Quiere un recurso gratuito y listo para usar, no teoría pura.

**Evidencia en la página:**
- Título: *"Plantilla Kakebo en Excel Gratis: Cómo empezar…"* — captura "gratis" + "cómo empezar"
- `DownloadCTA` con descarga real del `.xlsx` posicionado en el primer tercio del artículo
- FAQ incluye: "¿La plantilla es completamente gratuita?", "¿Funciona en Google Sheets?"
- JSON-LD `SoftwareApplication` señaliza explícitamente que es un recurso descargable, precio 0

---

## Intención de búsqueda secundaria

**Categoría:** Informacional comparativa  
**Núcleo:** El usuario también busca entender si el Excel es la mejor opción o si existe una alternativa digital. La pregunta implícita es *"¿debería usar Excel o una app?"*

**Evidencia en la página:**
- Sección "¿Por qué el Excel (casi) siempre suele fracasar?" — aborda el problema del método
- Tabla comparativa: Papel / Excel / Google Sheets / Kakebo AI
- Sección "La evolución: De la plantilla de Excel a Kakebo AI" — narrativa de conversión
- `SimpleCTA` hacia `/` (Home): "Empieza gratis y di adiós al Excel"

---

## Estructura actual de la página

### Metadatos SEO

| Campo | Valor actual | Observación |
|---|---|---|
| **Meta title (generado)** | `Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla \| Blog Kakebo` | ~93 chars — **truncado por Google** (límite ~65) |
| **H1 visible** | `Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla` | Coincide con title frontmatter — correcto en semántica, largo en SERP |
| **Meta description (excerpt)** | `Descarga tu primera plantilla Kakebo en Excel gratis y descubre por qué miles de personas acaban abandonando el registro manual para pasarse a la IA.` | ~149 chars — borderline (límite ~155); empieza con verbo de acción — bien |
| **Canonical** | `https://www.metodokakebo.com/blog/plantilla-kakebo-excel` | Correcto (sin prefijo `/es/`) |
| **hreflang ES** | `https://www.metodokakebo.com/blog/plantilla-kakebo-excel` | Correcto |
| **hreflang EN** | `https://www.metodokakebo.com/en/blog/plantilla-kakebo-excel` | Existe versión legacy EN |
| **hreflang x-default** | `https://www.metodokakebo.com/blog/plantilla-kakebo-excel` | Correcto |
| **Open Graph** | title + excerpt + image `/images/blog/plantilla-kakebo-excel-gratis.png` | Correcto |
| **Twitter Card** | `summary_large_image` | Correcto |
| **Fecha publicación** | `2026-01-27` | Relativamente reciente |

### Jerarquía de headings

```
H1  Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla
│
├─ [intro párrafo]
│
├─ H3  ¿Qué incluye la plantilla Kakebo Excel gratuita?        ← RIESGO: H3 antes del primer H2
│
├─ H2  La anatomía perfecta de un Excel Kakebo
│   ├─ H3  1. La Pestaña de Previsión
│   ├─ H3  2. Las Cuatro Categorías Japonesas
│   │   ├─ H4  Supervivencia
│   │   ├─ H4  Ocio y Vicio
│   │   ├─ H4  Cultura
│   │   └─ H4  Extras
│   └─ H3  3. La Pestaña de Reflexión
│
├─ H2  ¿Por qué el Excel (casi) siempre suele fracasar?
│   └─ H3  ¿Papel, Excel, Google Sheets o app? Comparativa rápida
│
├─ H2  La evolución: De la plantilla de Excel a Kakebo AI
│
├─ H2  3 Trucos para que tu Excel Kakebo no muera en el intento
│   ├─ H3  1. El ritual del domingo por la tarde
│   ├─ H3  2. Sincronización en la nube (Obligatorio)
│   └─ H3  3. Redondeo sin piedad
│
├─ H2  Preguntas frecuentes sobre la plantilla Kakebo Excel
│
└─ H2  ¿Sigues con el Excel? Prueba la alternativa sin fricción
```

**Problema detectado:** Sección de apertura `### ¿Qué incluye la plantilla Kakebo Excel gratuita?` es H3 y aparece **antes del primer H2** del artículo. Rompe la jerarquía semántica.

### JSON-LD implementado

| Tipo | Estado |
|---|---|
| `BlogPosting` | ✅ Presente — headline, image, datePublished, dateModified, author, publisher |
| `BreadcrumbList` | ✅ Presente — Inicio > Blog > [título] |
| `FAQPage` | ✅ Presente — 5 preguntas del frontmatter |
| `SoftwareApplication` | ✅ Presente — **específico para este slug**, price: 0, operatingSystem: Excel + Google Sheets |

**Observación `dateModified`:** En `page.tsx` la implementación actual pone `dateModified: post.frontmatter.date` (igual que `datePublished`). Si el contenido se actualiza en el futuro, la fecha de modificación no se actualizará automáticamente en el JSON-LD a menos que se cambie el frontmatter.

### CTAs y recursos descargables

| CTA | Posición en el artículo | Destino | Tipo |
|---|---|---|---|
| `DownloadCTA` "Descargar Plantilla" | Primer tercio — después de lista de características | `/docs/Plantilla_Kakebo_Simplificada.xlsx` | Recurso descargable |
| `SimpleCTA` "Empieza gratis y di adiós al Excel" | Después de sección de trucos | `/` (Home) | Conversión a app |

### Imagen

| Campo | Valor |
|---|---|
| Hero image | `/images/blog/plantilla-kakebo-excel-gratis.png` |
| Inline image (body) | `/images/blog/plantilla-kakebo-excel-gratis.png` — **mismo fichero que el hero** |
| Alt de la imagen inline | `"Plantilla Kakebo Excel Gratis - Descarga este formato para llevar el control de gastos mensuales desde el ordenador"` |
| Alt del hero (page.tsx) | Usa `post.frontmatter.title` como alt (`title` fill) |
| loading inline | `lazy` (correcto para imágenes mid-body) |

### Enlaces internos desde la página

| Destino | Texto ancla | Ubicación |
|---|---|---|
| `/blog/metodo-kakebo-guia-definitiva` | "El método Kakebo" | Body (sección anatomía) |
| `/blog/libro-kakebo-pdf` | "libro Kakebo en PDF" | Body (tabla comparativa) |
| `/blog/kakebo-online-guia-completa` | "Kakebo online" | Body (sección evolución) |
| `/herramientas/calculadora-ahorro` | "calculadora de ahorro" | FAQ (pregunta autónomos) |
| `/` | CTA "Empieza gratis" | SimpleCTA body |

### Related posts (frontmatter)

```
- kakebo-online-gratis
- eliminar-gastos-hormiga
- libro-kakebo-pdf
```

---

## Fortalezas SEO

1. **Keyword exacta en H1** — "plantilla kakebo excel gratis" está literalmente en el H1, alineado con las queries principales de GSC.
2. **Recurso descargable real** — El `.xlsx` en `/docs/` es una señal de intención cubierta que satisface la búsqueda transaccional de forma directa. Google favorece páginas que entregan lo que prometen.
3. **JSON-LD `SoftwareApplication` específico** — Este esquema especial está condicionado únicamente a este slug en `page.tsx`. Es una señal rica que puede activar rich results de aplicación/recurso gratuito en SERP.
4. **FAQPage con 5 preguntas** — El frontmatter `faq` activa el JSON-LD de FAQ con 5 entradas que cubren dudas prácticas de alta intención (Google Sheets, autónomos, gratuito, conocimientos técnicos).
5. **Canonical sin prefijo `/es/`** — Correcto y consistente con la arquitectura i18n del sitio.
6. **hreflang bien configurado** — ES, EN y x-default correctamente diferenciados; implementado a nivel de layout de `page.tsx`.
7. **Compatibilidad Google Sheets mencionada** — Amplía el alcance semántico a búsquedas como "kakebo google sheets" o "plantilla kakebo sheets" sin keyword stuffing.
8. **Tabla comparativa** — Papel / Excel / Google Sheets / Kakebo AI crea valor diferencial y contexto competitivo; potencial para featured snippet tipo tabla.
9. **Narrativa de conversión integrada** — El artículo no es solo informativo: lleva al usuario de "quiero la plantilla" a "quizá la app es mejor", con dos CTAs diferenciados (descarga + conversión).
10. **Estructura con tres pilares temáticos** — Anatomía (cómo funciona), Fricción (por qué falla), Evolución (alternativa): cubre el ciclo completo del usuario en un solo artículo.
11. **FAQ visible en página** — Las `FaqSection`/`FaqItem` en el cuerpo del artículo refuerzan las respuestas del JSON-LD FAQPage.
12. **Fecha 2026-01-27** — Artículo suficientemente reciente para competir sin señales de contenido obsoleto.

---

## Riesgos SEO

1. **Meta title truncado en SERP** — El title generado `Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla | Blog Kakebo` tiene ~93 chars. Google trunca alrededor de 55-65 chars. El SERP probablemente muestra solo *"Plantilla Kakebo en Excel Gratis: Cómo empezar y…"*, perdiendo el gancho de propuesta de valor. Impacto directo en CTR.

2. **H3 antes del primer H2 (jerarquía rota)** — La sección `### ¿Qué incluye la plantilla Kakebo Excel gratuita?` es un H3 que aparece como primera sección del cuerpo del artículo, antes de cualquier H2. Los crawlers esperan jerarquía H1→H2→H3. Este error puede dificultar la generación de featured snippets de tipo lista o definición a partir de esa sección.

3. **`dateModified` congelado en `datePublished`** — En `page.tsx` el JSON-LD usa `dateModified: post.frontmatter.date`, que es la fecha de publicación. Cualquier actualización de contenido no se reflejará en el esquema sin cambiar manualmente el frontmatter. Google valora la frescura para contenido práctico.

4. **Imagen duplicada hero + body** — El hero y la imagen inline del body usan el mismo fichero (`plantilla-kakebo-excel-gratis.png`). No es un riesgo SEO grave, pero representa una oportunidad visual desaprovechada: la imagen del body podría mostrar un screenshot real de la plantilla Excel con alt text más descriptivo.

5. **Enlazado interno insuficiente hacia herramientas estratégicas** — Solo `/herramientas/calculadora-ahorro` está enlazada (en FAQ). `/herramientas/regla-50-30-20` y `/herramientas/calculadora-inflacion` no están mencionadas. Las herramientas son URLs con potencial de posicionamiento propio que se beneficiarían del link equity de la página pilar.

6. **SimpleCTA a `/` puede filtrar usuarios demasiado pronto** — El CTA "Empieza gratis y di adiós al Excel" enviando a la Home aparece antes de la sección de FAQs y antes del cierre del artículo. Usuarios que aún están evaluando pueden salir sin terminar de leer, reduciendo el tiempo en página.

7. **Canibalización potencial con la Home** — La Home compite en parte por términos como "kakebo online gratis" y "kakebo app". El artículo enviá tráfico a la Home vía SimpleCTA. Si Google interpreta que ambas páginas compiten por las mismas queries, puede dificultar la posición de ambas. Actualmente no hay evidencia de canibalización activa, pero conviene monitorizarla.

8. **Versión EN legacy activa** — Existe `/en/blog/plantilla-kakebo-excel` como contenido legacy. Si el artículo EN tuviese señales de autoridad superiores a las del ES (como ocurría con `kakebo-online-gratis` según SEO-I18N-KAKEBO-ONLINE-VALIDATE-01), podría interferir con el posicionamiento ES. Estado actual: no verificado — requiere revisión en GSC.

9. **Author genérico ("Equipo Kakebo")** — Para contenido financiero personal, Google da más peso a autores identificables con experiencia demostrable (E-E-A-T). El autor genérico no penaliza activamente, pero es una señal de E-E-A-T sub-óptima para el nicho.

10. **Sin `dateModified` en frontmatter** — El frontmatter actual solo tiene `date`. No existe campo `updatedDate` o similar. Si el contenido se actualiza en el futuro, no hay mecanismo para reflejar la fecha de actualización en JSON-LD sin modificar el `page.tsx`.

---

## Oportunidades de enlazado interno

### Desde este artículo hacia herramientas estratégicas (tareas futuras)

| URL destino | Contexto de inserción sugerido | Justificación |
|---|---|---|
| `/herramientas/calculadora-ahorro` | Sección "Pestaña de Previsión" — al mencionar el "Ahorro objetivo 20%" | Ya existe link en FAQ; añadir un segundo link contextual en el body consolidaría la señal |
| `/herramientas/regla-50-30-20` | Sección "Pestaña de Previsión" — junto a "págate a ti mismo primero" o cerca de la tabla comparativa | La regla 50/30/20 es un framework complementario al método Kakebo para presupuesto |
| `/herramientas/calculadora-inflacion` | Sección "3 Trucos" — al hablar de "objetivo de ahorro" o de planificación a largo plazo | Relevancia contextual menor pero posible en nota a pie de sección de trucos |

### Desde otros artículos hacia esta página (enlazado entrante)

| URL origen | Oportunidad | Prioridad |
|---|---|---|
| `/blog/como-hacer-un-presupuesto-personal` | Al mencionar herramientas de registro — "si prefieres Excel, plantilla gratuita disponible" | Alta — artículo pilar con alta autoridad interna |
| `/blog/kakebo-online-gratis` | Al comparar métodos de registro — puede enlazar a la plantilla como alternativa física | Alta — artículo relacionado con solapamiento temático |
| `/blog/regla-30-dias` | Al mencionar técnicas de control de gastos — plantilla como recurso complementario | Media |
| `/blog/kakebo-vs-ynab` | Al mencionar alternativas manuales vs. digitales | Media |
| `/blog/metodo-kakebo-para-autonomos` | FAQ de este artículo menciona autónomos — el artículo de autónomos podría enlazar de vuelta | Media |
| `/blog/libro-kakebo-pdf` | Artículo del libro puede mencionar la plantilla Excel como alternativa digital gratuita | Baja-media |

### Desde la Home hacia este artículo

| Ubicación en Home | Oportunidad |
|---|---|
| `ToolsSection` | Añadir tarjeta de "Plantilla Excel" junto a las herramientas — la descarga gratuita es un recurso de captación equivalente a una herramienta |
| `SeoContent` (si existe sección de recursos) | Link textual en prose de la sección SEO de la Home |

---

## Oportunidades de mejora de conversión

*(No implementar — solo documentar)*

1. **ToolCTA hacia calculadora** — Añadir un `ToolCTA` en la sección de Pestaña de Previsión enlazando a `/herramientas/calculadora-ahorro` puede mantener al usuario dentro del ecosistema en lugar de perderlo al simplemente descargar el Excel.

2. **Reposicionar `SimpleCTA`** — Mover el `SimpleCTA` "Empieza gratis y di adiós al Excel" al final del artículo (después del FAQ) en lugar de antes, para no interrumpir el flujo informacional del usuario.

3. **Segunda oportunidad de descarga** — El artículo tiene un solo `DownloadCTA` en el primer tercio. Un segundo `DownloadCTA` al final ("¿Todavía con el Excel? Descárgala gratis") podría capturar lectores que llegaron directamente a la parte inferior vía scroll o búsqueda.

4. **Expandir FAQ con pregunta sobre pareja** — "¿Sirve para gestionar las finanzas en pareja?" existe en `FaqSection` del body pero no está en el frontmatter `faq`. No aparece en el JSON-LD FAQPage. Si se añadiera al frontmatter, tendría presencia en rich results.

---

## Qué NO conviene tocar

| Elemento | Razón |
|---|---|
| Slug `/blog/plantilla-kakebo-excel` | Es la URL con mayor tracción orgánica — cambiarla destruiría el histórico de posicionamiento |
| Descarga `/docs/Plantilla_Kakebo_Simplificada.xlsx` | Enlace real que satisface la intención de búsqueda — no reubicar ni eliminar |
| Keywords en H1 | "Plantilla Kakebo en Excel Gratis" es coincidencia exacta con queries principales de GSC |
| JSON-LD `SoftwareApplication` hardcodeado en `page.tsx` para este slug | Es un activo SEO diferencial único en el sitio |
| Related posts actuales | `kakebo-online-gratis`, `eliminar-gastos-hormiga`, `libro-kakebo-pdf` — buenos vecinos temáticos |
| Estructura narrativa del artículo | El flujo descarga → anatomía → fricción → evolución → conversión funciona |
| hreflang y canonical | Configuración correcta — no tocar |
| Imágenes | No tocar hasta tener alternativa con mayor valor informativo |
| Contenido EN legacy | No tocar — política DOC-I18N-01 activa |

---

## Tareas futuras recomendadas

*(Solo propuestas — no ejecutar sin aprobación explícita)*

| ID propuesto | Descripción | Prioridad |
|---|---|---|
| `SEO-EXCEL-TITLE-01` | Acortar meta title a ~60 chars máximo preservando keywords clave (`plantilla kakebo excel gratis`) para evitar truncación en SERP | Alta |
| `SEO-EXCEL-H3-FIX-01` | Convertir el H3 inicial `### ¿Qué incluye la plantilla Kakebo Excel gratuita?` a H2 para corregir la jerarquía de headings | Media |
| `SEO-EXCEL-DATE-01` | Añadir campo `updatedDate` al frontmatter y actualizar `page.tsx` para usar `dateModified` correctamente en JSON-LD cuando el contenido se actualice | Media |
| `SEO-EXCEL-INTERNAL-LINKS-01` | Añadir enlace a `/herramientas/regla-50-30-20` en sección "Pestaña de Previsión" y a `/herramientas/calculadora-ahorro` en body (no solo FAQ) | Media |
| `SEO-EXCEL-INBOUND-PILAR-01` | Añadir enlace desde `/blog/como-hacer-un-presupuesto-personal` hacia este artículo como recurso de registro manual | Media |
| `SEO-EXCEL-FAQ-FRONTMATTER-01` | Añadir pregunta "finanzas en pareja" al frontmatter `faq` para que aparezca en JSON-LD FAQPage además del FaqSection visible | Baja |
| `SEO-EXCEL-EN-VALIDATE-01` | Revisar en GSC si la versión EN legacy (`/en/blog/plantilla-kakebo-excel`) tiene señales que interfieran con el posicionamiento ES — análogo a SEO-I18N-KAKEBO-ONLINE-VALIDATE-01 | Baja |
| `SEO-EXCEL-CTA-REORDER-01` | Mover `SimpleCTA` al final del artículo (después de FAQ) para no interrumpir el flujo informacional | Baja |

---

## Conclusión

`/blog/plantilla-kakebo-excel` es el activo SEO más valioso del sitio en este momento. Su rendimiento se explica por la coincidencia exacta entre la intención de búsqueda ("plantilla + excel + gratis") y lo que la página entrega (descarga real de `.xlsx` + método explicado). La estructura JSON-LD con `SoftwareApplication` es un diferencial único en el sitio. Los riesgos más urgentes son el meta title truncado (impacto directo en CTR) y la jerarquía de headings rota (H3 antes de H2). Las oportunidades de enlazado interno hacia herramientas son las de mayor potencial de distribución de autoridad. **No se debe tocar el slug, el H1 ni la estructura general** — cualquier mejora debe ser quirúrgica y aislada.
