# SEO_GEO_TERMINOLOGY_01 — Glosario Canónico SEO/GEO de MetodoKakebo.com

**Fecha:** 2026-06-30  
**Tipo:** Documentación estratégica semántica — sin cambios en código ni contenido  
**Estado:** Documento de referencia activo — usar obligatoriamente antes de cualquier tarea de contenido, metadata, schema o enlazado interno  
**Siguiente tarea que debe usarlo:** `SEO-SCHEMA-HOME-01`, `SEO-GEO-ENTITY-DEFINITION-01`, cualquier artículo nuevo

---

## 1. Resumen ejecutivo

MetodoKakebo.com usa cinco categorías de términos que pueden confundirse entre sí: el método histórico japonés, la marca del sitio, el producto digital, los formatos de recurso y las herramientas específicas. Sin una taxonomía clara, Google y los motores generativos no pueden distinguir correctamente a qué se refiere cada página, qué entidad representa y a quién debe mostrar cada URL.

Este documento establece la terminología canónica, los usos permitidos, las ambigüedades a evitar y las frases definicionales reutilizables para SEO y GEO.

**Regla principal:** Cada término tiene un papel específico. No son sinónimos intercambiables, aunque parezcan referirse a lo mismo.

---

## 2. Objetivo del glosario

1. Dar a cada término un significado preciso y consistente en todo el sitio.
2. Facilitar que Google entienda correctamente la jerarquía de entidades.
3. Permitir que motores generativos (ChatGPT, Perplexity, Gemini) citen correctamente el sitio.
4. Evitar que la mezcla de términos cree canibalización semántica o confusión de entidad.
5. Servir como referencia obligatoria para futuros prompts a Claude, Gemini o Codex.

---

## 3. Problema semántico actual

La auditoría `SEO_GEO_DEEP_AUDIT_01.md` identificó la ambigüedad terminológica como hallazgo G-02 de severidad alta. Evidencias específicas:

| Término | Dónde aparece | Problema |
|---|---|---|
| "Kakebo AI" | Layout, legales, app, blog CTA | Nombre del producto, correcto en ese contexto. Pero a veces usado también para referirse al método. |
| "método Kakebo" | Artículos, FAQ, herramientas | Correcto. Pero a veces aparece sin "método" como solo "Kakebo". |
| "app Kakebo online gratuita" | Hero subtitle | Mezcla tres descriptores en uno sin una estructura clara. |
| "Kakebo" (sin calificador) | Blog tag title (`| Blog Kakebo`), múltiples usos | Ambiguo: ¿el método? ¿la marca? ¿el producto? |
| "MetodoKakebo.com" | Apenas mencionado en el contenido | El dominio no aparece como entidad en el contenido — Google no lo puede identificar claramente. |
| "kakebo online" | Artículos, Home subtitle | Término de búsqueda, no necesariamente el nombre del producto. |
| Categorías Kakebo | FAQ schema en calculadora-ahorro: "Opcional o Vicio" | Nombre incorrecto — el canónico es "Ocio/Vicio". |

---

## 4. Principios de terminología

1. **Precisión de entidad**: Cada término identifica una entidad específica y distinta. No usar un término para referirse a otra entidad por conveniencia o brevedad.

2. **Consistencia entre páginas**: El mismo término debe significar lo mismo en Home, blog, herramientas, schema y FAQs.

3. **Preferencia por el término más específico**: Si el contexto lo permite, usar el término más específico. "Kakebo AI" en lugar de solo "Kakebo" cuando se habla del producto.

4. **Separación histórica/digital**: Siempre distinguir el método japonés histórico de la herramienta digital moderna. Nunca mezclarlos en la misma oración como si fueran lo mismo.

5. **Citabilidad**: Los términos y frases deben ser lo suficientemente precisos para ser citados directamente por motores generativos sin ambigüedad.

6. **Prioridad del contenido visible sobre el schema**: Si el H1 dice "método Kakebo" y el schema dice "Kakebo", hay inconsistencia. El schema debe reflejar el mismo término que el contenido visible.

---

## 5. Tabla canónica de términos

| Término canónico | Qué significa | Usar para | No usar para | Tipo de entidad | Página principal asociada | Ejemplo correcto | Riesgo si se usa mal |
|---|---|---|---|---|---|---|---|
| **El método Kakebo** | Sistema japonés centenario de ahorro personal creado por Motoko Hani en 1904. Consiste en registrar ingresos, gastos y reflexionar mensualmente. | Hablar del sistema de gestión financiera histórico y sus principios. | Referirse al producto digital ni a la web. | Concepto / Método histórico | `/blog/metodo-kakebo-guia-definitiva` | "El método Kakebo divide los gastos en cuatro categorías" | Google puede atribuir características del producto al método histórico |
| **Kakebo** (solo) | Nombre abreviado del método o de la marca, según contexto. Nunca usarlo solo cuando el contexto pueda ser ambiguo. | Variante abreviada de "método Kakebo" cuando el contexto ya ha establecido de qué se habla. En el nombre del blog (`Blog Kakebo`) como marca. | Como único identificador del producto digital. Como sinónimo de "Kakebo AI". | Abreviatura (uso controlado) | — | "El Kakebo fue creado en Japón en 1904" (contexto ya establecido) | Ambigüedad de entidad: Google no sabe si habla del método o del producto |
| **MetodoKakebo.com** | Dominio y nombre de la plataforma web. El sitio web que ofrece herramientas y artículos sobre el método Kakebo. | Identificar la web/plataforma como entidad. En schema `Organization`. En `sobre-nosotros`. En descripciones de la web como producto. | Referirse al método histórico. Referirse al agente de IA específicamente. | Organización / Dominio / Plataforma | `/sobre-nosotros` | "MetodoKakebo.com es una plataforma gratuita de herramientas basadas en el método Kakebo" | Google no identifica la entidad de la marca si no aparece en el contenido |
| **Kakebo AI** | Nombre oficial del producto digital: la app web + agente de inteligencia artificial de MetodoKakebo.com. | Nombrar el producto en CTAs, legales, app, schema de la app, FAQ sobre el producto. | Referirse al método Kakebo histórico. Referirse a la plataforma/web en general. | Producto / Aplicación digital | `/` (Home) y `/app/` | "Kakebo AI es la app gratuita de MetodoKakebo.com para controlar gastos con IA" | Confunde el producto con el método. Un motor de IA puede decir "Kakebo AI fue creado en 1904" |
| **App Kakebo** | Forma coloquial de referirse a Kakebo AI. Aceptable como variante conversacional pero no como identificador principal. | Copy de blog y artículos, respuestas FAQ, texto conversacional. | Títulos y meta descriptions donde "Kakebo AI" es más preciso. Schema JSON-LD. | Variante coloquial aceptada | — | "La app Kakebo disponible en MetodoKakebo.com es gratuita" | Sin riesgo grave si siempre va acompañada de MetodoKakebo.com o Kakebo AI |
| **Kakebo online** | Forma de describir la versión digital del método Kakebo. No es el nombre del producto — es una descripción de su modalidad de uso. | Queries de búsqueda en artículos y meta descriptions. Copy educativo. | Como nombre propio del producto. En schema. Como sinónimo de "Kakebo AI". | Descriptor funcional / Query keyword | `/blog/kakebo-online-gratis` · `/blog/kakebo-online-guia-completa` | "Llevar tu kakebo online es más fácil que nunca con MetodoKakebo.com" | Google puede tratar "kakebo online" como entidad propia, compitiendo con la Home y el artículo |
| **Plantilla Kakebo Excel** | Recurso descargable en formato `.xlsx` que permite aplicar el método Kakebo manualmente en Excel o Google Sheets. | Referirse específicamente al archivo descargable. En el artículo pilar del cluster Excel. En el DownloadCTA. | Referirse a la app ni al método en general. | Recurso descargable | `/blog/plantilla-kakebo-excel` | "La plantilla Kakebo Excel es un archivo gratuito compatible con Excel y Google Sheets" | Confusión entre "planilla" (el método en papel) y la app digital. Puede crear canibalización con la Home si se usa para describir la app. |
| **Herramientas gratuitas de ahorro** | Conjunto de calculadoras interactivas disponibles en `/herramientas/` de MetodoKakebo.com. | Referirse al hub de herramientas como categoría. En la navegación y en el blog index. | Referirse a la app Kakebo AI (que es una herramienta de diferente tipo). | Categoría de recursos | `/herramientas` | "MetodoKakebo.com ofrece herramientas gratuitas de ahorro como la calculadora de inflación" | Confusión entre "herramientas" (calculadoras) y "app" (Kakebo AI) |
| **Calculadora de ahorro mensual** | Herramienta interactiva en `/herramientas/calculadora-ahorro` que calcula cuánto ahorrar al mes según los ingresos del usuario. | Referirse específicamente a esa herramienta. En el H1, schema y CTAs de esa página. | Referirse a la app Kakebo AI ni al método en general. | Herramienta específica | `/herramientas/calculadora-ahorro` | "La calculadora de ahorro mensual de MetodoKakebo.com indica cuánto puedes ahorrar según tu sueldo" | Mezcla con "calculadora Kakebo" — el adjetivo "mensual" es necesario para diferenciarla |
| **Calculadora de inflación e IPC** | Herramienta interactiva en `/herramientas/calculadora-inflacion` que calcula la pérdida de poder adquisitivo según el IPC. | Referirse específicamente a esa herramienta. | Referirse a cualquier otra herramienta o al método. | Herramienta específica | `/herramientas/calculadora-inflacion` | "La calculadora de inflación e IPC de MetodoKakebo.com muestra cuánto vale tu dinero en el tiempo" | Sin "e IPC" el término es genérico y no diferencia la herramienta |
| **Calculadora 50/30/20** | Herramienta interactiva en `/herramientas/regla-50-30-20` que divide el sueldo según la regla del 50% necesidades / 30% deseos / 20% ahorro. | Referirse específicamente a esa herramienta. | Referirse a la regla como concepto sin la herramienta. | Herramienta específica | `/herramientas/regla-50-30-20` | "La calculadora 50/30/20 de MetodoKakebo.com divide tu sueldo en tres bloques al instante" | Confusión entre la herramienta y el concepto de la regla |
| **Regla 50/30/20** | Principio de presupuesto personal que asigna el 50% de los ingresos a necesidades, 30% a deseos y 20% a ahorro. No es un invento de MetodoKakebo.com. | Hablar del concepto financiero genérico. En artículos educativos. | Como nombre de la herramienta de MetodoKakebo.com (usar "calculadora 50/30/20"). | Concepto financiero externo | `/herramientas/regla-50-30-20` · futuro artículo de blog | "La regla 50/30/20 es un método de presupuesto personal popularizado por Elizabeth Warren" | Apropiación de un concepto externo como si fuera propio de MetodoKakebo.com |
| **Presupuesto personal** | Planificación de ingresos y gastos de un individuo. Término financiero genérico y de alto volumen de búsqueda. | Artículos informativos, cluster de presupuesto personal, texto de apoyo. | Como descriptor del producto Kakebo AI directamente. | Concepto financiero genérico | `/blog/como-hacer-un-presupuesto-personal` | "Aprende a hacer tu presupuesto personal con el método Kakebo" | Demasiado genérico para definir el producto. Riesgo de perder especificidad |
| **Gastos mensuales** | Los gastos que una persona tiene en un mes. Término genérico de alto volumen de búsqueda. | Artículos TOFU, copy descriptivo, FAQ. | Como identificador de ninguna entidad específica. | Descriptor genérico | Múltiples artículos | "Controla tus gastos mensuales con las categorías del método Kakebo" | Sin riesgo si se usa como descriptor, no como nombre |
| **Finanzas personales** | Disciplina de gestión del dinero personal. Término paraguas de todo el contenido del sitio. | Framing general del sitio, blog index, sobre-nosotros. | Como identificador de ninguna entidad específica del sitio. | Categoría temática | Blog index · Home | "MetodoKakebo.com ayuda a mejorar tus finanzas personales con herramientas gratuitas" | Demasiado genérico para queries específicas. Úsalo para contexto, no para posicionamiento directo |

---

## 6. Términos permitidos y sus variantes aceptadas

| Término canónico | Variantes aceptadas | Variantes a evitar |
|---|---|---|
| El método Kakebo | "el método japonés", "el método Kakebo japonés", "el Kakebo" (con contexto previo) | "el Kakebo" sin contexto, "la metodología Kakebo" (redundante), "el sistema Kakebo" |
| MetodoKakebo.com | "MetodoKakebo", "la web de MetodoKakebo" | "el sitio de Kakebo", "la plataforma Kakebo" sin más contexto |
| Kakebo AI | "la app Kakebo AI", "Kakebo AI (la app)" | "el Kakebo AI", "KakeboAI" (sin espacio), "Kakebo IA" (en inglés usa AI) |
| App Kakebo | "la app", "la herramienta digital" (con MetodoKakebo.com en contexto) | "la aplicación Kakebo" (muy formal), "el programa Kakebo" |
| Kakebo online | "el Kakebo online", "llevar el Kakebo online" | "Kakebo Online" (como nombre propio con mayúsculas), "el KakeboOnline" |
| Plantilla Kakebo Excel | "plantilla de Excel Kakebo", "plantilla kakebo para Excel" | "la hoja Kakebo", "el Excel Kakebo" (ambiguo), "la plantilla" solo |
| Calculadora de ahorro mensual | "calculadora de ahorro", "simulador de ahorro mensual" | "calculadora Kakebo" (sin especificar cuál), "la calculadora" solo |
| Calculadora de inflación e IPC | "calculadora de inflación", "calculadora IPC" | "calculadora inflación Kakebo" (demasiado genérico) |
| Calculadora 50/30/20 | "calculadora de la regla 50/30/20", "calculadora de presupuesto 50/30/20" | "la regla" solo, "la herramienta de distribución" |

---

## 7. Términos a evitar o usar con extremo cuidado

| Término problemático | Problema | En su lugar, usar |
|---|---|---|
| **"Kakebo"** (solo, sin calificador, como nombre del producto) | Ambiguo entre método histórico y producto digital | "Kakebo AI" para el producto, "el método Kakebo" para el sistema |
| **"la aplicación"** (sin especificar cuál) | No identifica la entidad — hay muchas apps | "Kakebo AI", "la app de MetodoKakebo.com" |
| **"el método japonés"** (solo, sin "Kakebo") | Genérico — hay muchos métodos japoneses | "el método Kakebo", "el método Kakebo japonés" |
| **"herramienta Kakebo"** (sin especificar) | No distingue entre la app y las calculadoras | "Kakebo AI" para la app, nombre específico para cada calculadora |
| **"Opcional o Vicio"** (categoría) | Nombre incorrecto de la categoría | "Ocio/Vicio" o "Ocio y Vicio" |
| **"Extra"** (categoría) | Nombre incorrecto — el canónico es plural | "Extras" |
| **"Kakebo Online"** (con mayúsculas como nombre propio) | No es un nombre propio, es una descripción | "kakebo online" (minúsculas) como descriptor, o "Kakebo AI" para el producto |
| **"app de finanzas"** (solo) | Demasiado genérico | "app de ahorro", "app de control de gastos con el método Kakebo" |
| **"la IA"** (referida al producto) | Reduce el producto a una característica | "Kakebo AI", "el agente de Kakebo AI" |

---

## 8. Diferencias entre términos clave

### El método Kakebo ≠ Kakebo AI ≠ MetodoKakebo.com

```
El método Kakebo
│ Sistema de ahorro personal japonés (1904, Motoko Hani)
│ Concepto histórico, educativo, no comercial
│ Página: /blog/metodo-kakebo-guia-definitiva
│
├── MetodoKakebo.com
│   │ Plataforma web que enseña y aplica el método Kakebo
│   │ Incluye artículos, herramientas y la app
│   │ Entidad: organización / dominio
│   │ Página: /sobre-nosotros
│   │
│   ├── Kakebo AI
│   │   │ El producto digital (app web + agente IA)
│   │   │ Herramienta para aplicar el método Kakebo digitalmente
│   │   │ Página principal: / (Home)
│   │   │
│   │   └── App Kakebo (variante coloquial de Kakebo AI)
│   │
│   └── Herramientas gratuitas de ahorro
│       │ Calculadoras interactivas (sin IA, sin registro)
│       ├── Calculadora de ahorro mensual (/herramientas/calculadora-ahorro)
│       ├── Calculadora de inflación e IPC (/herramientas/calculadora-inflacion)
│       └── Calculadora 50/30/20 (/herramientas/regla-50-30-20)
│
└── Recursos descargables
    └── Plantilla Kakebo Excel (/blog/plantilla-kakebo-excel + descarga .xlsx)
```

### Kakebo online ≠ Kakebo AI

- **Kakebo online** = forma de usar el método Kakebo de forma digital (puede ser con la app, con Google Sheets, con la plantilla Excel en la nube, etc.)
- **Kakebo AI** = el producto específico de MetodoKakebo.com

Ejemplo correcto: *"Puedes llevar tu kakebo online con Kakebo AI o con una plantilla de Google Sheets."*

### Método Kakebo ≠ Regla 50/30/20

El método Kakebo usa 4 categorías (Supervivencia, Ocio/Vicio, Cultura, Extras). La regla 50/30/20 es un framework de presupuesto externo al Kakebo. MetodoKakebo.com ofrece ambos como recursos complementarios, pero no son lo mismo ni deben presentarse como equivalentes.

### Las 4 categorías canónicas del método Kakebo

| Nombre canónico | Variante aceptada | Nombre incorrecto |
|---|---|---|
| **Supervivencia** | — | "Necesidades", "Gastos básicos" |
| **Ocio/Vicio** | "Ocio y Vicio" | "Opcional", "Opcional o Vicio", "Entretenimiento" |
| **Cultura** | — | "Formación", "Educación" |
| **Extras** | "Gastos extra" | "Extra" (singular), "Imprevistos" |

---

## 9. Uso recomendado por tipo de página

### Home (`/`)

| Elemento | Término recomendado | Evitar |
|---|---|---|
| H1 | "Kakebo Online" (keyword de búsqueda) o "Kakebo AI" | "el método" solo |
| Subtítulo | "la app Kakebo online gratuita" + "método japonés" | "Kakebo IA", "KakeboAI" |
| Schema `Organization` | `"name": "MetodoKakebo.com"` o `"name": "Kakebo AI"` | `"name": "Kakebo"` solo |
| Schema `WebSite` | `"name": "MetodoKakebo.com"` | — |
| CTAs | "Empieza gratis con Kakebo AI" | "Empieza con Kakebo" (ambiguo) |
| SEO description | "MetodoKakebo.com + app Kakebo online gratuita + método japonés" | "finanzas personales" solo |

### Artículos pilar (`/blog/metodo-kakebo-guia-definitiva`, `como-hacer-un-presupuesto-personal`)

| Elemento | Término recomendado |
|---|---|
| H1 | El término de búsqueda exacto ("método Kakebo", "presupuesto personal") |
| Primer párrafo | Definición factual del concepto (ver sección 11) |
| Schema `BlogPosting` `headline` | Mismo que H1 |
| FAQ | Preguntas sobre el concepto, no sobre el producto |
| CTA | Referencia a "Kakebo AI" y/o "MetodoKakebo.com" |

### Artículos soporte (`/blog/kakebo-online-gratis`, `eliminar-gastos-hormiga`, etc.)

| Elemento | Término recomendado |
|---|---|
| H1 | Keyword de búsqueda del artículo |
| Cuerpo | Distinguir siempre "método Kakebo" (concepto) de "Kakebo AI" (producto) |
| CTA | "Prueba Kakebo AI gratis" o "Accede a MetodoKakebo.com" |
| Related posts | Usar nombres exactos de artículos, no términos genéricos |

### Herramientas (`/herramientas/`)

| Elemento | Término recomendado |
|---|---|
| H1 | Nombre específico de la herramienta ("Calculadora de Ahorro Mensual") |
| Schema `SoftwareApplication` `name` | Nombre específico (no solo "Kakebo") |
| Schema `SoftwareApplication` `author.name` | "MetodoKakebo.com" o "Kakebo AI" |
| CTA | "Usar Kakebo AI para registro diario" (diferencia herramienta de app) |

### Blog index (`/blog`)

| Elemento | Término recomendado |
|---|---|
| H1 | "Blog Kakebo" o "Blog de MetodoKakebo.com" |
| Description | "Guías del método Kakebo, herramientas de ahorro y finanzas personales" |

### Páginas legales

| Elemento | Término recomendado |
|---|---|
| Todas | "Kakebo AI" como nombre del producto/servicio → ya es consistente en el sistema actual |

### Contenido GEO (bloques definicionales, FAQs, schema)

| Elemento | Término recomendado |
|---|---|
| Definiciones de entidad | Siempre incluir MetodoKakebo.com como origen |
| FAQPage | Preguntas que usen el término canónico exacto |
| Schema `description` | Frases de las secciones 11 y 12 de este documento |

---

## 10. Uso recomendado por elemento SEO

| Elemento | Regla terminológica |
|---|---|
| **Title** | Usar el término de búsqueda exacto que la página quiere posicionar. No mezclar términos en un solo title. Siempre ≤65 chars. |
| **Meta description** | Incluir el término canónico + MetodoKakebo.com o Kakebo AI para señal de entidad. Verbo de acción + beneficio. |
| **H1** | Exactamente igual al title o variante muy cercana. Un solo H1. Siempre el término principal de la página. |
| **Primer párrafo** | El párrafo más importante para GEO. Debe definir el término principal de forma factual en 2-3 frases. Incluir el nombre canónico del método/producto. |
| **FAQ** | Las preguntas deben usar el término canónico exacto. Las respuestas deben ser directas y citables. |
| **Schema `name`** | Siempre el nombre más específico posible. Nunca solo "Kakebo". |
| **Anchors internos** | El texto ancla debe ser el término canónico de la página destino. Ej: "método Kakebo" apunta a la guía definitiva. "calculadora de ahorro mensual" apunta a la herramienta. |
| **CTAs** | Usar "Kakebo AI" cuando el CTA lleva a la app/login. Usar "MetodoKakebo.com" cuando el CTA es genérico al sitio. |

---

## 11. Frases definicionales recomendadas (citables y reutilizables)

Estas frases están diseñadas para ser cortas, factuales y reutilizables. Pueden insertarse en primeros párrafos, FAQs y schemas. **No aplicar en la web todavía** — pendiente de tarea `SEO-GEO-ENTITY-DEFINITION-01`.

### Sobre el método Kakebo

> "El método Kakebo es un sistema japonés de ahorro personal creado en 1904 por la periodista Motoko Hani. Consiste en registrar ingresos y gastos divididos en cuatro categorías (Supervivencia, Ocio/Vicio, Cultura y Extras) y reflexionar mensualmente sobre los patrones de gasto para mejorar el ahorro."

> "El Kakebo es un cuaderno de cuentas japonés que obliga a planificar el gasto antes de producirse, no a justificarlo después."

### Sobre MetodoKakebo.com

> "MetodoKakebo.com es una plataforma web gratuita de herramientas y artículos para aplicar el método Kakebo de ahorro personal en formato digital, sin conectar cuentas bancarias."

> "MetodoKakebo.com ofrece herramientas gratuitas de ahorro, guías del método Kakebo y la aplicación Kakebo AI para registrar gastos con inteligencia artificial."

### Sobre Kakebo AI

> "Kakebo AI es la herramienta digital de MetodoKakebo.com para controlar gastos y planificar el ahorro mensual con apoyo de inteligencia artificial. Es gratuita y no requiere conectar cuentas bancarias."

> "Kakebo AI aplica los principios del método Kakebo japonés en un entorno digital moderno: el usuario registra gastos en lenguaje natural y la IA los clasifica automáticamente en las cuatro categorías del método."

### Sobre la plantilla Kakebo Excel

> "La plantilla Kakebo Excel es un archivo gratuito en formato .xlsx compatible con Microsoft Excel y Google Sheets para llevar el método Kakebo de forma manual en una hoja de cálculo."

### Sobre las herramientas

> "MetodoKakebo.com ofrece tres calculadoras gratuitas para planificar el ahorro: la calculadora de ahorro mensual, la calculadora de inflación e IPC, y la calculadora de la regla 50/30/20."

---

## 12. Ejemplos de copy correcto e incorrecto

### Correcto ✅

- "El **método Kakebo** fue creado por Motoko Hani en 1904. Puedes aplicarlo hoy de forma digital con **Kakebo AI**, la herramienta gratuita de **MetodoKakebo.com**."
- "Descarga la **plantilla Kakebo Excel** gratuita o usa **Kakebo AI** si prefieres un sistema sin fricciones."
- "La **calculadora de ahorro mensual** de MetodoKakebo.com te indica cuánto deberías guardar según tu sueldo."
- "Llevar el **kakebo online** con **Kakebo AI** es más rápido que rellenar una hoja de cálculo."
- "Las categorías del **método Kakebo** son: Supervivencia, **Ocio/Vicio**, Cultura y Extras."
- Schema: `"name": "MetodoKakebo.com"`, `"description": "Plataforma gratuita de herramientas basadas en el método Kakebo"`

### Incorrecto ❌

- "**Kakebo** fue creado en 1904. Usa **Kakebo** para controlar tus gastos." → Kakebo como nombre del producto y del método en el mismo párrafo.
- "La **app** te ayuda a seguir el método." → "la app" sin identificar cuál.
- "Aprende el **método japonés** y descarga la **herramienta**." → Demasiado genérico, ninguna entidad identificable.
- "Las categorías son: Supervivencia, **Opcional o Vicio**, Cultura y **Extra**." → Nombres incorrectos de categorías.
- Schema: `"name": "Kakebo"` → Ambiguo, no identifica la entidad.
- "**Kakebo Online** es la alternativa sin banco." → Trata "Kakebo Online" como nombre propio de una entidad, cuando es un descriptor.
- CTA: "Empieza con **la IA**." → No identifica qué producto ni qué web.
- "**MetodoKakebo.com** inventó el método Kakebo." → Atribuye al sitio web la creación del método histórico.

---

## 13. Reglas para futuros prompts a Claude, Gemini o Codex

Cuando se cree contenido, metadata, schema o enlazado interno, incluir estas instrucciones en los prompts:

```
GLOSARIO CANÓNICO ACTIVO — MetodoKakebo.com (docs/seo/SEO_GEO_TERMINOLOGY_01.md)

Reglas obligatorias:
- "el método Kakebo" = sistema japonés histórico (1904, Motoko Hani) — NO es el producto digital
- "Kakebo AI" = nombre oficial del producto digital de MetodoKakebo.com
- "MetodoKakebo.com" = nombre de la plataforma/web como entidad
- "kakebo online" (minúsculas) = descriptor de uso digital, NO nombre propio
- Categorías del método: Supervivencia / Ocio/Vicio / Cultura / Extras (no "Opcional o Vicio", no "Extra")
- No mezclar en el mismo contexto el método histórico con el producto digital sin transición explícita
- En schema, usar "MetodoKakebo.com" como Organization.name, y el nombre específico de cada herramienta
- Toda frase definicional debe separar: qué es el método + qué es el producto + qué ofrece la web
```

---

## 14. Riesgos si no se respeta el glosario

| Riesgo | Consecuencia SEO | Consecuencia GEO |
|---|---|---|
| Llamar al producto "Kakebo" sin calificador | Google no diferencia la entidad del producto de la del método histórico | Los motores de IA confunden el producto con el método y generan respuestas erróneas |
| Usar "Kakebo Online" como nombre propio | Google puede crear una entidad "Kakebo Online" separada que compite con la Home y el artículo | Los motores generativos citan "Kakebo Online" como si fuera una app distinta |
| Mezclar "método Kakebo" y "Kakebo AI" en el mismo párrafo sin distinción | Canibalización semántica en el mismo artículo | Las respuestas de IA atribuyen características del producto digital al método de 1904 |
| Categorías con nombres incorrectos en schema FAQ | El rich snippet de FAQ muestra términos distintos a los del contenido visible → inconsistencia | Los motores generativos citan los nombres incorrectos (ej: "Opcional o Vicio") |
| No mencionar MetodoKakebo.com en el contenido | Google no tiene fuente para identificar la entidad de la web en Knowledge Panel | Los motores de IA no saben a qué dominio atribuir el contenido sobre Kakebo |
| "MetodoKakebo.com inventó el Kakebo" | Claim factualmente incorrecto que puede llevar a penalizaciones de E-E-A-T | Los motores de IA propagan la afirmación incorrecta |

---

## 15. Próximas tareas que deben usar este documento

| Tarea | Por qué necesita este glosario |
|---|---|
| `SEO-GEO-ENTITY-DEFINITION-01` | Las frases definicionales de la sección 11 deben insertarse como primer párrafo en `metodo-kakebo-guia-definitiva` y/o `sobre-nosotros` |
| `SEO-SCHEMA-HOME-01` | El schema `Organization` debe usar `"name": "MetodoKakebo.com"` o `"name": "Kakebo AI"` (no "Kakebo") |
| `SEO-SCHEMA-AHORRO-SYNC-01` | El `SCHEMA.name` de calculadora-ahorro debe ser "Calculadora de Ahorro Mensual" y la categoría "Ocio/Vicio" debe corregirse en el FAQ_SCHEMA |
| `SEO-EXCEL-TITLE-01` | El nuevo title debe contener "plantilla kakebo excel gratis" (término canónico del artículo, no "Kakebo Excel" sin "plantilla") |
| `SEO-INTERNAL-LINKING-V1-01` | Los textos ancla deben usar los términos canónicos de la página destino |
| `SEO-BLOG-INFLACION-01` | El nuevo artículo debe separar "inflación" (concepto) de "calculadora de inflación e IPC de MetodoKakebo.com" (herramienta) |
| `SEO-BLOG-503020-01` | El nuevo artículo debe separar "regla 50/30/20" (concepto externo) de "calculadora 50/30/20 de MetodoKakebo.com" (herramienta) |
| Cualquier artículo nuevo | Primer párrafo con frase definicional canónica según el tema del artículo |
| Cualquier schema nuevo | `SoftwareApplication.name` y `Organization.name` deben seguir los términos de la tabla canónica (sección 5) |

---

## 16. Conclusión

La ambigüedad terminológica de MetodoKakebo.com no es un problema de branding — es un problema de señales semánticas para Google y motores generativos. Cuando "Kakebo" puede referirse al método japonés de 1904, a la app digital, al dominio web o a una plantilla de Excel, ningún motor de búsqueda puede indexar y presentar el contenido con precisión.

Las reglas de este glosario no son restrictivas — son habilitadoras. Al usar "Kakebo AI" para el producto, "el método Kakebo" para el sistema histórico y "MetodoKakebo.com" para la plataforma, cada término cumple su función sin solaparse con los demás. Esto permite que Google construya un grafo de entidades coherente y que los motores generativos citen el sitio correctamente.

El glosario debe consultarse antes de:
- Crear o modificar metadata (title, description)
- Escribir o editar artículos
- Crear o modificar schemas JSON-LD
- Definir textos ancla para enlaces internos
- Diseñar CTAs
- Formular prompts a modelos de IA para crear contenido

---

*SEO_GEO_TERMINOLOGY_01.md — 2026-06-30*  
*14 términos definidos · 3 principios de diferenciación · 6 frases definicionales citables*  
*Sin cambios en código, contenido ni configuración SEO.*
