# SEO_GEO_ENTITY_DEFINITIONS_01 — Definiciones Factuales Citables para MetodoKakebo.com

**Fecha:** 2026-06-30  
**Tipo:** Documentación estratégica semántica/GEO — sin cambios en código ni contenido  
**Depende de:** `docs/seo/SEO_GEO_TERMINOLOGY_01.md` (leer primero)  
**Estado:** Documento de referencia activo — usar antes de aplicar cualquier definición en web, schema, FAQ o artículo  
**Próximas tareas que deben usarlo:** `SEO-GEO-ENTITY-DEFINITION-01` (implementación), `SEO-SCHEMA-HOME-01`, `SEO-SCHEMA-AHORRO-SYNC-01`, cualquier artículo nuevo

---

## 1. Resumen ejecutivo

MetodoKakebo.com no tiene un bloque definicional claro en ninguna página de la web que permita a Google ni a motores generativos entender correctamente qué es el método Kakebo, qué es el sitio y qué es el producto digital. Este documento crea las definiciones mínimas, factuales y reutilizables para 14 entidades, organizadas por nivel de uso (corta, ampliada, schema, FAQ, primer párrafo).

Todas las definiciones siguen el glosario canónico de `SEO_GEO_TERMINOLOGY_01.md`. Ninguna debe aplicarse en la web hasta que la tarea de implementación (`SEO-GEO-ENTITY-DEFINITION-01`) sea aprobada y ejecutada.

---

## 2. Objetivo del documento

1. Crear definiciones factuales, breves y citables para cada entidad del sitio.
2. Proporcionar bloques reutilizables listos para copiar en contenido, metadata, schema y FAQs.
3. Evitar improvización en futuras tareas — cada persona o agente que trabaje en el sitio tiene aquí la frase exacta que debe usar.
4. Facilitar que motores generativos (ChatGPT, Perplexity, Gemini, AI Overviews) citen correctamente el sitio.
5. Garantizar consistencia E-E-A-T para contenido financiero.

---

## 3. Relación con el glosario canónico

Este documento **no reemplaza** `SEO_GEO_TERMINOLOGY_01.md` — lo complementa. El glosario define qué significa cada término y cuándo usarlo. Este documento define **cómo formularlo** en frases completas, listas para insertarse en el contenido real.

---

## 4. Principios para definiciones GEO

| Principio | Descripción | Ejemplo de aplicación |
|---|---|---|
| **Claridad** | Una sola idea por frase. Sin subordinadas múltiples. | ✅ "El método Kakebo divide los gastos en cuatro categorías." ❌ "El método Kakebo, inventado en Japón, que divide…" |
| **Factualidad** | Solo hechos verificables. Sin interpretaciones ni valoraciones. | ✅ "Creado en 1904 por Motoko Hani." ❌ "El mejor sistema de ahorro del mundo." |
| **Neutralidad** | Sin adjetivos de marketing. | ✅ "Herramienta gratuita de MetodoKakebo.com." ❌ "Revolucionaria herramienta de ahorro." |
| **No hype** | Sin superlatiivos vacíos ni promesas de resultados. | ✅ "Ayuda a planificar el ahorro mensual." ❌ "Ahorra hasta el 40% de tus ingresos." |
| **No promesas financieras** | No garantizar resultados económicos. | ✅ "Permite visualizar la distribución del presupuesto." ❌ "Garantiza que ahorres más cada mes." |
| **Citabilidad** | Frases autosuficientes. Tienen sentido fuera de contexto. | ✅ Una frase que pueda aparecer en una respuesta de AI sin el contexto de la página. |
| **Compatibilidad española** | Orientadas al mercado hispanohablante. | Usar "ahorro", "gastos", "presupuesto" en lugar de términos anglosajones. |

---

## 5. Definiciones principales

---

### D-01 — El método Kakebo

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Concepto histórico / Sistema de gestión financiera |
| **Página principal** | `/blog/metodo-kakebo-guia-definitiva` |

**Definición corta (≤25 palabras):**  
Sistema japonés de ahorro personal creado en 1904 por Motoko Hani. Consiste en planificar y registrar ingresos y gastos en cuatro categorías antes de gastar.

**Definición ampliada (≤80 palabras):**  
El método Kakebo (家計簿, "libro de cuentas del hogar") es un sistema de gestión de finanzas personales originario de Japón, publicado en 1904 por la periodista Motoko Hani. El método organiza los gastos en cuatro categorías — Supervivencia, Ocio/Vicio, Cultura y Extras — y propone responder cuatro preguntas al cierre de cada mes para reflexionar sobre los hábitos de gasto y mejorar el ahorro de forma progresiva.

**Uso recomendado:** Primer párrafo de `metodo-kakebo-guia-definitiva`. Introducción en artículos que mencionan el método por primera vez. Schema `description` de páginas relacionadas.

**Posible uso en schema:**
```json
"description": "Sistema japonés de ahorro personal creado en 1904 por Motoko Hani. Organiza los gastos en cuatro categorías y propone una reflexión mensual para mejorar los hábitos financieros."
```

**Posible uso en FAQ:**
- P: "¿Qué es el método Kakebo?"
- R: "El método Kakebo es un sistema japonés de gestión de finanzas personales creado en 1904 por Motoko Hani. Consiste en registrar ingresos y gastos en cuatro categorías (Supervivencia, Ocio/Vicio, Cultura y Extras) y reflexionar mensualmente sobre los patrones de gasto para reducirlos."

**Posible uso en primer párrafo:**  
> "El método Kakebo es un sistema japonés de ahorro personal publicado en 1904 por la periodista Motoko Hani. A diferencia de las apps bancarias modernas, el Kakebo no conecta con tu cuenta corriente: el usuario registra cada gasto manualmente, lo clasifica en una de cuatro categorías y reflexiona mensualmente sobre sus patrones de consumo."

**Ejemplo correcto:** "El método Kakebo fue creado en Japón y divide los gastos en cuatro categorías."  
**Ejemplo incorrecto:** "El método Kakebo es la mejor herramienta para ahorrar dinero." (valorativo, no factual)  
**Riesgo si se usa mal:** Google puede no identificar el método Kakebo como un concepto histórico, confundiéndolo con el producto digital.

---

### D-02 — Kakebo (nombre abreviado)

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Abreviatura controlada / Término ambiguo |
| **Página principal** | — (no tiene URL propia) |

**Definición corta (≤25 palabras):**  
Abreviatura de "método Kakebo". Puede usarse cuando el contexto ya ha establecido claramente que se habla del sistema japonés histórico.

**Definición ampliada (≤80 palabras):**  
"Kakebo" es la forma abreviada de "método Kakebo". Puede usarse en lugar del término completo cuando el párrafo ya ha introducido el concepto. Sin contexto previo, "Kakebo" es ambiguo: puede referirse al método histórico, al producto Kakebo AI o al dominio MetodoKakebo.com. Por ello, no debe usarse como único identificador al inicio de un texto ni en schemas ni en el primer párrafo definicional.

**Uso recomendado:** Solo como sustituto de "el método Kakebo" cuando el contexto ya está establecido en el mismo bloque de texto.

**Ejemplo correcto:** "El método Kakebo fue creado en 1904. El Kakebo usa cuatro categorías de gasto." (contexto establecido)  
**Ejemplo incorrecto:** "Kakebo te ayuda a ahorrar dinero." (ambiguo: ¿método? ¿app? ¿web?)  
**Riesgo:** Google puede no determinar a qué entidad se refiere.

---

### D-03 — MetodoKakebo.com

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Organización / Plataforma web |
| **Página principal** | `/sobre-nosotros` |

**Definición corta (≤25 palabras):**  
Plataforma web gratuita de herramientas y artículos para aplicar el método Kakebo en formato digital, sin conectar cuentas bancarias.

**Definición ampliada (≤80 palabras):**  
MetodoKakebo.com es un sitio web de finanzas personales que ofrece herramientas gratuitas, artículos educativos y la aplicación Kakebo AI para aplicar el método Kakebo japonés de ahorro en formato digital. No conecta con cuentas bancarias ni procesa datos financieros externos. Todo el registro de gastos es manual o asistido por inteligencia artificial dentro de la propia plataforma. Disponible en español para mercados hispanohablantes.

**Uso recomendado:** Schema `Organization`. Página `sobre-nosotros`. CTAs que no se refieren específicamente al producto Kakebo AI. Contextos donde se habla de la web como conjunto.

**Posible uso en schema:**
```json
{
  "@type": "Organization",
  "name": "MetodoKakebo.com",
  "url": "https://www.metodokakebo.com",
  "description": "Plataforma gratuita de herramientas y artículos para aplicar el método Kakebo de ahorro personal en formato digital.",
  "foundingDate": "2024",
  "areaServed": "ES"
}
```

**Posible uso en FAQ:**
- P: "¿Qué es MetodoKakebo.com?"
- R: "MetodoKakebo.com es una plataforma web gratuita que ofrece herramientas de ahorro, artículos sobre finanzas personales y la aplicación Kakebo AI, todo basado en el método Kakebo japonés. No requiere conexión bancaria."

**Posible uso en primer párrafo (sobre-nosotros):**  
> "MetodoKakebo.com es una plataforma web gratuita de finanzas personales. Ofrecemos herramientas de cálculo, artículos educativos y la aplicación Kakebo AI para ayudar a cualquier persona a aplicar el método Kakebo japonés de ahorro en su vida diaria, sin conectar cuentas bancarias ni ceder datos financieros."

**Ejemplo correcto:** "MetodoKakebo.com ofrece herramientas gratuitas basadas en el método Kakebo."  
**Ejemplo incorrecto:** "MetodoKakebo.com inventó el método Kakebo." (el método lo creó Motoko Hani en 1904)  
**Riesgo:** Atribuir la invención del método al sitio web genera un claim falso que puede perjudicar la E-E-A-T.

---

### D-04 — Kakebo AI

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Producto digital / Aplicación web |
| **Página principal** | `/` (Home) |

**Definición corta (≤25 palabras):**  
Aplicación web gratuita de MetodoKakebo.com para registrar gastos, planificar el presupuesto mensual y ahorrar con asistencia de inteligencia artificial.

**Definición ampliada (≤80 palabras):**  
Kakebo AI es el producto digital principal de MetodoKakebo.com. Permite registrar ingresos y gastos en las cuatro categorías del método Kakebo, establecer objetivos de ahorro mensuales y recibir apoyo de un agente de inteligencia artificial para clasificar los gastos automáticamente. Es gratuita, funciona como Progressive Web App (PWA) en móvil y escritorio, y no conecta con cuentas bancarias. El usuario es el único propietario de sus datos.

**Uso recomendado:** CTAs de conversión. Schema del producto en la Home. FAQ sobre el producto. Primer párrafo de la Home.

**Posible uso en schema:**
```json
{
  "@type": "SoftwareApplication",
  "name": "Kakebo AI",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, Android, iOS (PWA)",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "description": "Aplicación web gratuita para registrar gastos y planificar el ahorro mensual con el método Kakebo japonés y asistencia de IA.",
  "author": { "@type": "Organization", "name": "MetodoKakebo.com" }
}
```

**Posible uso en FAQ:**
- P: "¿Qué es Kakebo AI?"
- R: "Kakebo AI es la aplicación gratuita de MetodoKakebo.com para controlar gastos y planificar el ahorro mensual. Aplica el método Kakebo japonés con apoyo de inteligencia artificial para clasificar los gastos automáticamente, sin conectar cuentas bancarias."

**Posible uso en primer párrafo (Home):**  
> "Kakebo AI es la aplicación gratuita de MetodoKakebo.com basada en el método Kakebo japonés de ahorro. Registra tus ingresos y gastos, establece tu objetivo de ahorro mensual y deja que el agente de inteligencia artificial clasifique tus gastos automáticamente. Sin banco, sin publicidad, sin coste."

**Ejemplo correcto:** "Kakebo AI es la app gratuita de MetodoKakebo.com para controlar gastos."  
**Ejemplo incorrecto:** "Kakebo AI es el método Kakebo digitalizado." (el método es histórico, Kakebo AI es un producto independiente basado en él)  
**Riesgo:** Confundir el producto con el método histórico puede generar claims incorrectos en respuestas de IA.

---

### D-05 — App Kakebo

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Variante coloquial de Kakebo AI |
| **Página principal** | `/` (Home) |

**Definición corta (≤25 palabras):**  
Forma coloquial de referirse a Kakebo AI, la aplicación web gratuita de MetodoKakebo.com para controlar gastos con el método Kakebo.

**Definición ampliada (≤80 palabras):**  
"App Kakebo" es la forma informal con la que los usuarios se refieren a Kakebo AI. Es aceptable en copy conversacional, artículos de blog y respuestas FAQ. No debe usarse en schemas ni en títulos oficiales donde el nombre correcto es "Kakebo AI". Siempre que se use, debe acompañarse de MetodoKakebo.com o Kakebo AI como referencia para que el contexto sea claro.

**Uso recomendado:** Copy de blog, respuestas FAQ conversacionales, texto de artículos.  
**No usar en:** Schema `name`, title, H1.

**Posible uso en FAQ:**
- P: "¿Existe una app de Kakebo para el móvil?"
- R: "Sí. Kakebo AI, la app gratuita de MetodoKakebo.com, funciona en móvil como PWA (Progressive Web App). Puedes instalarla en tu pantalla de inicio sin pasar por ninguna tienda de aplicaciones."

**Ejemplo correcto:** "La app Kakebo de MetodoKakebo.com es gratuita."  
**Ejemplo incorrecto:** "Descarga la app Kakebo en App Store." (no está en App Store como app nativa — es PWA)  
**Riesgo:** Afirmar que existe en App Store o Play Store como app nativa es un claim incorrecto.

---

### D-06 — Kakebo online

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Descriptor funcional / Keyword de búsqueda |
| **Página principal** | `/blog/kakebo-online-gratis` · `/blog/kakebo-online-guia-completa` |

**Definición corta (≤25 palabras):**  
Forma de aplicar el método Kakebo en formato digital, a través de una aplicación web, hoja de cálculo en la nube o herramienta online.

**Definición ampliada (≤80 palabras):**  
"Kakebo online" describe cualquier modalidad digital de aplicar el método Kakebo: con la app Kakebo AI, con una plantilla de Google Sheets, con una hoja de Excel en la nube o con cualquier herramienta web. No es el nombre de un producto específico — es una descripción funcional. MetodoKakebo.com ofrece la opción más completa de Kakebo online a través de Kakebo AI, aunque también proporciona plantillas descargables para quien prefiera el formato manual.

**Uso recomendado:** Artículos informativos sobre el uso digital del método. Queries objetivo en meta descriptions. Copy educativo.  
**No usar en:** Schema `name`, title como nombre propio con mayúsculas.

**Posible uso en FAQ:**
- P: "¿Qué es el Kakebo online?"
- R: "El kakebo online es cualquier forma de llevar el método Kakebo en formato digital, sin libreta física. Puede hacerse con la app Kakebo AI de MetodoKakebo.com, con una plantilla de Google Sheets o con cualquier herramienta web de registro de gastos."

**Ejemplo correcto:** "Llevar tu kakebo online con Kakebo AI evita la fricción del papel."  
**Ejemplo incorrecto:** "Kakebo Online es la app más descargada." (no es un nombre propio ni tiene datos de descargas verificables)  
**Riesgo:** Tratarlo como nombre propio puede crear una entidad SEO fantasma que compita con la Home y los artículos.

---

### D-07 — Plantilla Kakebo Excel

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Recurso descargable |
| **Página principal** | `/blog/plantilla-kakebo-excel` |

**Definición corta (≤25 palabras):**  
Archivo gratuito en formato .xlsx para llevar el método Kakebo de forma manual en Microsoft Excel o Google Sheets.

**Definición ampliada (≤80 palabras):**  
La plantilla Kakebo Excel es un recurso descargable gratuito de MetodoKakebo.com en formato .xlsx. Incluye las cuatro categorías del método Kakebo (Supervivencia, Ocio/Vicio, Cultura y Extras), pestañas de previsión mensual, registro semanal de gastos, balance automático y reflexión mensual. Es compatible con Microsoft Excel y Google Sheets sin modificaciones. Orientada a usuarios que prefieren el registro manual en hoja de cálculo frente al registro digital en una app.

**Uso recomendado:** Artículo pilar del cluster Excel. Schema `SoftwareApplication` con precio 0.  
**No usar en:** Para describir la app Kakebo AI.

**Posible uso en schema:**
```json
{
  "@type": "SoftwareApplication",
  "name": "Plantilla Kakebo Excel Gratis",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Microsoft Excel, Google Sheets",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "description": "Plantilla gratuita en formato .xlsx para llevar el método Kakebo de forma manual en Excel o Google Sheets.",
  "author": { "@type": "Organization", "name": "MetodoKakebo.com" }
}
```

**Posible uso en FAQ:**
- P: "¿Qué incluye la plantilla Kakebo Excel?"
- R: "La plantilla Kakebo Excel de MetodoKakebo.com incluye las cuatro categorías del método (Supervivencia, Ocio/Vicio, Cultura y Extras), una pestaña de previsión mensual, un registro semanal de gastos, el balance automático y las cuatro preguntas de reflexión mensual del método Kakebo."

**Posible uso en primer párrafo:**  
> "La plantilla Kakebo Excel es un archivo gratuito en formato .xlsx creado por MetodoKakebo.com para llevar el método Kakebo de forma manual. Es compatible con Microsoft Excel y Google Sheets, incluye las cuatro categorías del método y calcula automáticamente el balance mensual."

**Ejemplo correcto:** "Descarga la plantilla Kakebo Excel gratis y empieza a registrar tus gastos hoy."  
**Ejemplo incorrecto:** "La plantilla Kakebo Excel es la herramienta de MetodoKakebo.com." (confunde la plantilla con la app Kakebo AI)  
**Riesgo:** Presentar la plantilla como sinónimo de la app puede confundir a usuarios y a Google sobre qué es cada recurso.

---

### D-08 — Herramientas gratuitas de ahorro

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Categoría de recursos / Hub de herramientas |
| **Página principal** | `/herramientas` |

**Definición corta (≤25 palabras):**  
Conjunto de calculadoras interactivas gratuitas de MetodoKakebo.com para planificar el ahorro, calcular la inflación y distribuir el presupuesto mensual.

**Definición ampliada (≤80 palabras):**  
MetodoKakebo.com ofrece tres herramientas gratuitas de ahorro: la calculadora de ahorro mensual, la calculadora de inflación e IPC y la calculadora de la regla 50/30/20. Son herramientas web interactivas, sin registro, sin conexión bancaria y sin coste. Complementan el uso del método Kakebo y de la app Kakebo AI, pero pueden usarse de forma independiente para calcular objetivos de ahorro, pérdida de poder adquisitivo o distribución del sueldo.

**Uso recomendado:** Texto del hub `/herramientas`. Menciones desde artículos del blog. Schema de la página hub.

**Ejemplo correcto:** "Las herramientas gratuitas de ahorro de MetodoKakebo.com incluyen calculadoras de ahorro mensual, inflación y presupuesto."  
**Ejemplo incorrecto:** "Las herramientas de Kakebo te ayudan a ahorrar dinero garantizado." (claim de resultado garantizado)

---

### D-09 — Calculadora de ahorro mensual

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Herramienta específica |
| **Página principal** | `/herramientas/calculadora-ahorro` |

**Definición corta (≤25 palabras):**  
Herramienta web gratuita que calcula cuánto dinero puede ahorrar un usuario al mes según sus ingresos y los porcentajes del método Kakebo.

**Definición ampliada (≤80 palabras):**  
La calculadora de ahorro mensual de MetodoKakebo.com es una herramienta web interactiva y gratuita. El usuario introduce sus ingresos netos mensuales y la herramienta calcula automáticamente cuánto destinar a cada categoría del método Kakebo para alcanzar un objetivo de ahorro del 20%. No requiere registro ni conexión bancaria. Proporciona un desglose inmediato en euros por categoría (Supervivencia, Ocio/Vicio, Cultura, Extras y Ahorro).

**Posible uso en schema:**
```json
{
  "@type": "SoftwareApplication",
  "name": "Calculadora de Ahorro Mensual",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "description": "Herramienta gratuita para calcular cuánto dinero puedes ahorrar al mes según tus ingresos y el método Kakebo.",
  "author": { "@type": "Organization", "name": "MetodoKakebo.com" }
}
```

**Posible uso en FAQ:**
- P: "¿Cuánto debería ahorrar al mes?"
- R: "El método Kakebo recomienda destinar al menos el 20% de los ingresos netos al ahorro. La calculadora de ahorro mensual de MetodoKakebo.com calcula este importe en euros automáticamente según tu sueldo."

**Ejemplo correcto:** "La calculadora de ahorro mensual de MetodoKakebo.com indica cuánto puedes ahorrar según tus ingresos."  
**Ejemplo incorrecto:** "La calculadora Kakebo te dice cuánto vas a ahorrar." (no es una calculadora de predicción, sino de planificación; además, "calculadora Kakebo" es ambiguo)

---

### D-10 — Calculadora de inflación e IPC

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Herramienta específica |
| **Página principal** | `/herramientas/calculadora-inflacion` |

**Definición corta (≤25 palabras):**  
Herramienta web gratuita que calcula cuánto pierde de valor un capital ahorrado según la tasa de inflación e IPC a lo largo del tiempo.

**Definición ampliada (≤80 palabras):**  
La calculadora de inflación e IPC de MetodoKakebo.com es una herramienta web interactiva y gratuita. El usuario introduce un capital inicial, una tasa de inflación anual estimada y un número de años, y la herramienta calcula el valor real resultante y la pérdida de poder adquisitivo acumulada. Permite comparar el efecto de distintas tasas de inflación sobre los ahorros. No requiere registro y no conecta con datos del INE en tiempo real.

**Posible uso en schema:**
```json
{
  "@type": "SoftwareApplication",
  "name": "Calculadora de Inflación e IPC",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "description": "Herramienta gratuita para calcular la pérdida de poder adquisitivo de tus ahorros según la tasa de inflación e IPC.",
  "author": { "@type": "Organization", "name": "MetodoKakebo.com" }
}
```

**Posible uso en FAQ:**
- P: "¿Cómo afecta la inflación a mis ahorros?"
- R: "La inflación reduce el poder adquisitivo del dinero ahorrado. La calculadora de inflación e IPC de MetodoKakebo.com permite calcular cuánto pierde de valor un capital específico en un número determinado de años según la tasa de inflación estimada."

**Ejemplo correcto:** "La calculadora de inflación e IPC de MetodoKakebo.com muestra cuánto vale tu dinero en el futuro."  
**Ejemplo incorrecto:** "La calculadora de inflación Kakebo usa datos del INE en tiempo real." (no lo hace — usa la tasa que introduce el usuario)

---

### D-11 — Calculadora 50/30/20

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Herramienta específica |
| **Página principal** | `/herramientas/regla-50-30-20` |

**Definición corta (≤25 palabras):**  
Herramienta web gratuita que divide los ingresos mensuales según la regla del 50% necesidades, 30% deseos y 20% ahorro.

**Definición ampliada (≤80 palabras):**  
La calculadora 50/30/20 de MetodoKakebo.com es una herramienta web interactiva y gratuita. El usuario introduce sus ingresos netos mensuales y la herramienta calcula automáticamente cuánto destinar a necesidades (50%), deseos (30%) y ahorro (20%) según la regla 50/30/20. Proporciona el desglose en euros de forma inmediata. No requiere registro ni conexión bancaria. La regla 50/30/20 es un concepto financiero externo a MetodoKakebo.com; la herramienta es la implementación digital de dicho concepto.

**Posible uso en FAQ:**
- P: "¿Qué es la regla 50/30/20?"
- R: "La regla 50/30/20 es un principio de presupuesto personal que propone destinar el 50% de los ingresos netos a necesidades básicas, el 30% a deseos y el 20% al ahorro. MetodoKakebo.com ofrece una calculadora gratuita para aplicarla en segundos."

**Ejemplo correcto:** "La calculadora 50/30/20 de MetodoKakebo.com divide tu sueldo en tres bloques automáticamente."  
**Ejemplo incorrecto:** "La calculadora 50/30/20 es el sistema Kakebo de presupuesto." (la regla 50/30/20 no es parte del método Kakebo — son sistemas distintos)

---

### D-12 — Presupuesto personal

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Concepto financiero genérico |
| **Página principal** | `/blog/como-hacer-un-presupuesto-personal` |

**Definición corta (≤25 palabras):**  
Planificación anticipada de ingresos y gastos de una persona para un periodo determinado, con el objetivo de controlar el gasto y ahorrar.

**Definición ampliada (≤80 palabras):**  
El presupuesto personal es la estimación y control de los ingresos y gastos de una persona en un periodo de tiempo determinado, normalmente mensual. Implica definir cuánto se espera ingresar, cuánto se quiere ahorrar y cuánto se puede gastar en cada categoría. El método Kakebo, la regla 50/30/20 y la calculadora de ahorro mensual de MetodoKakebo.com son herramientas para elaborar y controlar el presupuesto personal.

**Uso recomendado:** Artículos TOFU de alto volumen. Cluster de presupuesto personal. No usar como identificador del producto.

**Posible uso en primer párrafo (como-hacer-un-presupuesto-personal):**  
> "Un presupuesto personal es la planificación anticipada de los ingresos y gastos de una persona en un mes. Permite saber cuánto puedes gastar en cada área de tu vida y cuánto puedes ahorrar. El método Kakebo es uno de los sistemas más eficaces para elaborarlo."

---

### D-13 — Gastos mensuales

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Descriptor genérico |
| **Página principal** | Múltiples artículos |

**Definición corta (≤25 palabras):**  
Total de dinero gastado por una persona en un mes, distribuido entre las distintas categorías de consumo necesarias o discrecionales.

**Definición ampliada (≤80 palabras):**  
Los gastos mensuales son todos los desembolsos de dinero que realiza una persona en un mes natural: desde el alquiler o la hipoteca hasta el café diario. El método Kakebo los organiza en cuatro categorías (Supervivencia, Ocio/Vicio, Cultura y Extras) para identificar patrones de consumo y oportunidades de ahorro. Registrar los gastos mensuales es el primer paso del método Kakebo y el objetivo central de la app Kakebo AI.

**Uso recomendado:** Texto descriptivo, artículos, FAQ. No como nombre de entidad.

---

### D-14 — Finanzas personales

| Campo | Contenido |
|---|---|
| **Tipo de entidad** | Categoría temática |
| **Página principal** | Blog index · Home |

**Definición corta (≤25 palabras):**  
Disciplina que estudia la gestión del dinero personal: ingresos, gastos, ahorro, inversión y planificación financiera de un individuo o familia.

**Definición ampliada (≤80 palabras):**  
Las finanzas personales abarcan todas las decisiones económicas de un individuo o unidad familiar: cómo ganar dinero, cómo gastarlo, cómo ahorrarlo y cómo invertirlo. MetodoKakebo.com se enfoca en la primera capa de las finanzas personales: el control de gastos y el ahorro mensual mediante el método Kakebo. No ofrece asesoramiento financiero ni de inversión. Toda la información del sitio es educativa y de gestión personal.

**Uso recomendado:** Framing general del sitio. Blog index. Sobre-nosotros. No como keyword de posicionamiento principal (demasiado competida).

---

## 6. Definiciones secundarias

### Las 4 categorías del método Kakebo

| Categoría | Definición corta | Qué incluye | Qué excluye |
|---|---|---|---|
| **Supervivencia** | Gastos imprescindibles para vivir y trabajar | Alquiler, hipoteca, alimentación básica, transporte habitual, suministros, medicamentos | Restaurantes de ocio, ropa de lujo, suscripciones de entretenimiento |
| **Ocio/Vicio** | Gastos elegidos por placer o hábito, no imprescindibles | Restaurantes, salidas, ropa no esencial, tabaco, alcohol, entretenimiento, streaming | Nada que sea estrictamente necesario para vivir |
| **Cultura** | Inversión en conocimiento, formación y desarrollo personal | Libros, museos, cursos, teatro independiente, formación online | Netflix, blockbusters comerciales, videojuegos de entretenimiento puro |
| **Extras** | Gastos imprevistos o no recurrentes | Reparaciones del hogar, regalos, emergencias, gastos médicos puntuales | Gastos fijos recurrentes que pertenecen a Supervivencia |

---

## 7. Diferencias entre entidades (resumen ejecutivo)

| Comparativa | Diferencia clave |
|---|---|
| Método Kakebo vs Kakebo AI | El método es un sistema centenario japonés (1904). Kakebo AI es un producto digital moderno basado en ese método. No son lo mismo. |
| MetodoKakebo.com vs Kakebo AI | MetodoKakebo.com es la plataforma/organización. Kakebo AI es el producto digital específico dentro de esa plataforma. |
| Kakebo AI vs Plantilla Kakebo Excel | Kakebo AI es la app con IA para registro digital. La plantilla Excel es un archivo descargable para registro manual. Son formatos alternativos del mismo método. |
| Herramientas vs Kakebo AI | Las herramientas son calculadoras (sin registro de datos). Kakebo AI es una app (con cuenta de usuario y registro de gastos). |
| Kakebo online vs Kakebo AI | "Kakebo online" describe cualquier forma digital del método. "Kakebo AI" es el nombre específico del producto de MetodoKakebo.com. |
| Regla 50/30/20 vs Método Kakebo | Son sistemas distintos. El método Kakebo usa 4 categorías. La regla 50/30/20 usa 3 bloques porcentuales. MetodoKakebo.com ofrece herramientas para ambos. |

---

## 8. Bloques reutilizables por tipo de página

### Home (`/`)

**Bloque de introducción a la entidad del producto:**
```
Kakebo AI es la aplicación gratuita de MetodoKakebo.com para controlar gastos y planificar el ahorro con el método Kakebo japonés. Sin banco, sin publicidad, sin coste.
```

**Bloque de descripción del método (para sección educativa):**
```
El método Kakebo es un sistema japonés de ahorro personal publicado en 1904. Divide los gastos en cuatro categorías — Supervivencia, Ocio/Vicio, Cultura y Extras — y propone reflexionar mensualmente sobre los hábitos de consumo.
```

---

### Artículo pilar del método (`/blog/metodo-kakebo-guia-definitiva`)

**Primer párrafo recomendado:**
```
El método Kakebo (家計簿) es un sistema japonés de gestión de finanzas personales publicado en 1904 por la periodista Motoko Hani. Consiste en registrar todos los ingresos y gastos del mes, clasificarlos en cuatro categorías (Supervivencia, Ocio/Vicio, Cultura y Extras) y responder cuatro preguntas de reflexión al cierre de cada periodo para identificar oportunidades de ahorro.
```

---

### Artículo `/blog/plantilla-kakebo-excel`

**Primer párrafo recomendado:**
```
La plantilla Kakebo Excel es un archivo gratuito en formato .xlsx creado por MetodoKakebo.com para llevar el método Kakebo de forma manual. Compatible con Microsoft Excel y Google Sheets, incluye las cuatro categorías del método, un registro semanal de gastos y el balance mensual automático.
```

---

### Artículo `/blog/kakebo-online-gratis`

**Primer párrafo recomendado:**
```
Llevar el kakebo online es aplicar el método Kakebo japonés en formato digital, sin libretas ni papel. MetodoKakebo.com ofrece la forma más completa de hacerlo a través de Kakebo AI, una aplicación gratuita que no conecta con el banco y protege la privacidad del usuario.
```

---

### Herramienta `/herramientas/calculadora-ahorro`

**Texto introductorio recomendado:**
```
La calculadora de ahorro mensual de MetodoKakebo.com calcula cuánto deberías ahorrar al mes según tus ingresos netos y los porcentajes del método Kakebo. Introduce tu sueldo y obtén el desglose en euros por categoría de forma inmediata. Gratuita, sin registro y sin conexión bancaria.
```

---

### Página `sobre-nosotros`

**Bloque de identidad de la organización:**
```
MetodoKakebo.com es una plataforma gratuita de finanzas personales basada en el método Kakebo japonés. Ofrecemos artículos educativos, herramientas de cálculo y la aplicación Kakebo AI para ayudar a cualquier persona a controlar sus gastos y mejorar su ahorro mensual, sin conectar cuentas bancarias.
```

---

## 9. Bloques reutilizables para schema

### `Organization` (para Home o sobre-nosotros)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MetodoKakebo.com",
  "url": "https://www.metodokakebo.com",
  "logo": "https://www.metodokakebo.com/logo.png",
  "description": "Plataforma gratuita de herramientas y artículos para aplicar el método Kakebo de ahorro personal en formato digital.",
  "foundingDate": "2024",
  "areaServed": ["ES", "MX", "CO", "AR", "CL", "PE"],
  "inLanguage": "es",
  "knowsAbout": ["método Kakebo", "ahorro personal", "presupuesto personal", "finanzas personales"]
}
```

### `WebSite` (para Home)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MetodoKakebo.com",
  "url": "https://www.metodokakebo.com",
  "description": "Herramientas y guías gratuitas para aplicar el método Kakebo de ahorro personal en español.",
  "inLanguage": "es",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.metodokakebo.com/blog?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### `SoftwareApplication` — Kakebo AI (para Home)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Kakebo AI",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, Android (PWA), iOS (PWA)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "description": "Aplicación web gratuita de MetodoKakebo.com para registrar gastos y planificar el ahorro mensual con el método Kakebo japonés y asistencia de inteligencia artificial.",
  "author": {
    "@type": "Organization",
    "name": "MetodoKakebo.com"
  }
}
```

---

## 10. Bloques reutilizables para FAQ

### FAQ — ¿Qué es el método Kakebo?
**Q:** ¿Qué es el método Kakebo?  
**R:** El método Kakebo es un sistema japonés de ahorro personal creado en 1904 por Motoko Hani. Consiste en registrar los ingresos y gastos del mes en cuatro categorías — Supervivencia, Ocio/Vicio, Cultura y Extras — y reflexionar al final de cada mes sobre los hábitos de consumo para identificar oportunidades de ahorro.

### FAQ — ¿Qué ofrece MetodoKakebo.com?
**Q:** ¿Qué ofrece MetodoKakebo.com?  
**R:** MetodoKakebo.com ofrece tres tipos de recursos gratuitos: artículos educativos sobre el método Kakebo y finanzas personales, herramientas de cálculo (calculadora de ahorro mensual, de inflación e IPC, y de la regla 50/30/20) y la aplicación Kakebo AI para registrar gastos y planificar el ahorro con inteligencia artificial.

### FAQ — ¿Qué es Kakebo AI?
**Q:** ¿Qué es Kakebo AI?  
**R:** Kakebo AI es la aplicación gratuita de MetodoKakebo.com para controlar gastos y planificar el ahorro mensual. Aplica el método Kakebo japonés con apoyo de inteligencia artificial para clasificar los gastos automáticamente. No conecta con cuentas bancarias ni accede a datos financieros externos.

### FAQ — ¿Qué diferencia hay entre la app Kakebo y la plantilla Excel?
**Q:** ¿Cuál es la diferencia entre Kakebo AI y la plantilla Kakebo Excel?  
**R:** Kakebo AI es una aplicación web con cuenta de usuario, registro continuo de gastos y asistencia de inteligencia artificial. La plantilla Kakebo Excel es un archivo .xlsx descargable para llevar el método de forma manual en una hoja de cálculo. Ambas son gratuitas y aplican el mismo método Kakebo, pero con formatos y niveles de automatización distintos.

---

## 11. Bloques reutilizables para primer párrafo de páginas clave

*(Listos para insertar cuando se ejecute `SEO-GEO-ENTITY-DEFINITION-01`)*

### Para `/blog/metodo-kakebo-guia-definitiva`
> El método Kakebo (家計簿) es un sistema japonés de gestión de finanzas personales publicado en 1904 por la periodista Motoko Hani. Organiza todos los gastos en cuatro categorías — Supervivencia, Ocio/Vicio, Cultura y Extras — y propone responder cuatro preguntas de reflexión al cierre de cada mes para mejorar el ahorro de forma progresiva. MetodoKakebo.com ofrece herramientas digitales y artículos gratuitos para aplicar este método en el día a día.

### Para `/sobre-nosotros`
> MetodoKakebo.com es una plataforma web gratuita de finanzas personales basada en el método Kakebo japonés. Ofrecemos artículos educativos, calculadoras interactivas y la aplicación Kakebo AI para ayudar a cualquier persona a controlar sus gastos y mejorar su ahorro mensual. No conectamos con cuentas bancarias ni asesoramos en inversiones. Toda la información es educativa y de gestión personal.

### Para `/` (Home — bloque explicativo secundario)
> MetodoKakebo.com aplica el método Kakebo japonés en formato digital gratuito. El método fue creado en 1904 por Motoko Hani y se basa en registrar cada gasto, clasificarlo en cuatro categorías y reflexionar mensualmente. Kakebo AI, nuestra aplicación, automatiza este proceso con inteligencia artificial, sin conectar tu banco.

---

## 12. Frases que NO deben usarse

| Frase prohibida | Razón | Alternativa |
|---|---|---|
| "La mejor app de finanzas personales" | Superlativo vacío y no verificable | "Una app gratuita de finanzas personales basada en el método Kakebo" |
| "Ahorra dinero garantizado" | Promesa de resultado financiero | "Ayuda a planificar el ahorro mensual" |
| "Control total de tus finanzas" | "Total" es una exageración | "Control de tus gastos mensuales" |
| "MetodoKakebo.com inventó el Kakebo" | Falso — lo inventó Motoko Hani en 1904 | "MetodoKakebo.com aplica digitalmente el método Kakebo, creado en 1904" |
| "Kakebo AI es el método Kakebo" | Confunde el producto con el método histórico | "Kakebo AI está basado en el método Kakebo japonés" |
| "Hazte rico con Kakebo" | Promesa financiera exagerada | — (no usar ninguna variante de esto) |
| "El único Kakebo online gratis" | Superlativo exclusivo no verificable | "Una opción gratuita de Kakebo online" |
| "Asesoramiento financiero gratuito" | MetodoKakebo.com no es asesor financiero | "Herramientas educativas de finanzas personales gratuitas" |
| "Datos de inflación actualizados en tiempo real" | Las calculadoras usan datos introducidos por el usuario, no del INE | "Introduce la tasa de inflación estimada y calcula el resultado" |
| "La app más descargada" | Sin datos verificables de descargas | — (no usar hasta tener datos reales) |
| "El método japonés milenario" | El Kakebo es de 1904, no milenario | "El método japonés creado en 1904" |

---

## 13. Riesgos de claims exagerados

| Claim exagerado | Riesgo SEO | Riesgo GEO | Riesgo legal/ético |
|---|---|---|---|
| Promesas de ahorro garantizado | Penalización E-E-A-T en contenido YMYL | Motores de IA propagan la promesa como hecho | Posible conflicto con normativa de publicidad financiera |
| "Inventamos el Kakebo" | Google puede marcar el sitio como información incorrecta | Los motores de IA generan respuestas incorrectas sobre la historia del Kakebo | Apropiación indebida de un patrimonio cultural japonés |
| "La mejor app" | Google no puede verificar el superlativo → reduce la confianza en la entidad | Los motores de IA evitan citar fuentes que usan superlativos no verificables | Riesgo de competencia desleal |
| "Control total" | Sobreprometido vs. la experiencia real → aumenta el rebote | — | Potencial reclamación de usuario |

---

## 14. Reglas para futuras tareas

Antes de insertar cualquier definición en contenido, metadata o schema, verificar:

1. ¿La frase distingue claramente entre método Kakebo (histórico) y Kakebo AI (producto)?
2. ¿El schema `name` usa el nombre específico de la entidad (no solo "Kakebo")?
3. ¿El primer párrafo del artículo es autosuficiente para ser citado fuera de contexto?
4. ¿El texto evita todos los claims de la sección 12?
5. ¿El término usado es el canónico según `SEO_GEO_TERMINOLOGY_01.md`?
6. ¿La definición es verificable (factual) o es una valoración?

---

## 15. Próximas tareas que deben usar este documento

| Tarea | Qué usar de este documento |
|---|---|
| `SEO-GEO-ENTITY-DEFINITION-01` (implementación) | Bloques de primer párrafo de las secciones 8 y 11 para insertar en `metodo-kakebo-guia-definitiva` y `sobre-nosotros` |
| `SEO-SCHEMA-HOME-01` | Bloques schema de la sección 9 (`Organization`, `WebSite`, `SoftwareApplication`) |
| `SEO-SCHEMA-AHORRO-SYNC-01` | D-09 (calculadora de ahorro mensual) — `name` y `description` del schema a actualizar |
| `SEO-EXCEL-TITLE-01` | D-07 (plantilla Kakebo Excel) — definición corta para inspirar el nuevo title |
| `SEO-BLOG-INFLACION-01` | D-10 (calculadora de inflación e IPC) — primer párrafo del artículo y FAQ |
| `SEO-BLOG-503020-01` | D-11 (calculadora 50/30/20) + D-12 (regla 50/30/20 como concepto externo) |
| `SEO-INTERNAL-LINKING-V1-01` | Definiciones cortas de sección 5 para determinar el anchor text correcto |
| Cualquier artículo nuevo | Bloque de primer párrafo de sección 8 según el tema del artículo |
| Cualquier schema nuevo | Bloques de sección 9 como base. Siempre `"author": { "name": "MetodoKakebo.com" }` |

---

## 16. Conclusión

Las definiciones de este documento son la respuesta a la pregunta que cualquier motor de búsqueda o motor generativo debería poder responder con claridad: "¿Qué es MetodoKakebo.com, qué ofrece y en qué se diferencia del método Kakebo histórico?"

La implementación de estas definiciones — especialmente los primeros párrafos de `metodo-kakebo-guia-definitiva` y `sobre-nosotros` — es el cambio editorial de mayor impacto GEO que puede hacerse en el sitio con mínimo riesgo y máximo efecto en la citabilidad por motores generativos.

La regla más importante: **nunca confundir el método (1904, Motoko Hani, histórico) con el producto (Kakebo AI, MetodoKakebo.com, digital)**. Esa distinción es la base de la coherencia semántica del sitio.

---

*SEO_GEO_ENTITY_DEFINITIONS_01.md — 2026-06-30*  
*14 entidades definidas · 6 bloques por tipo de página · 4 bloques schema · 4 bloques FAQ · 4 bloques primer párrafo · 11 frases prohibidas*  
*Sin cambios en código, contenido ni configuración SEO.*
