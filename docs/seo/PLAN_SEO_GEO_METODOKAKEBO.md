# Plan Maestro SEO/GEO — MetodoKakebo.com

**Proyecto:** MetodoKakebo.com  
**Documento:** Plan estratégico de trabajo SEO/GEO  
**Versión:** V1  
**Fecha:** 2026-06-30  
**Estado:** Documento base para referencia en ChatGPT Project y repositorio Kakebo

---

## 1. Propósito del documento

Este documento define el orden lógico de trabajo SEO/GEO para MetodoKakebo.com.

El objetivo es evitar trabajar de forma reactiva, saltando entre tareas sin estructura, y pasar a una metodología profesional basada en:

- mapa SEO maestro;
- auditoría profunda;
- priorización por evidencia;
- optimización URL por URL;
- enlazado interno después de tener cada URL bien definida;
- expansión de contenido solo cuando exista un hueco estratégico;
- medición continua con Google Search Console, Google Analytics y cambios documentados en el repo.

La idea central es simple: **orden antes que ejecución**.

---

## 2. Principios de trabajo

### 2.1. No tocar por tocar

No se modificará una URL solo porque exista una oportunidad teórica. Cada cambio debe responder a una hipótesis clara:

- mejorar CTR;
- mejorar intención de búsqueda;
- corregir estructura semántica;
- reforzar autoridad interna;
- mejorar conversión;
- resolver canibalización;
- preparar mejor la web para buscadores tradicionales y motores generativos.

### 2.2. Proteger las URLs que ya funcionan

Las URLs que ya traen tráfico orgánico real no se tocarán de forma agresiva.

Ejemplo actual:

- `/blog/plantilla-kakebo-excel`

Esta URL funciona como activo SEO principal. Se puede auditar, monitorizar y reforzar alrededor, pero cualquier modificación directa debe ser quirúrgica, aislada y justificada.

### 2.3. Una tarea, un objetivo

Cada tarea SEO/GEO debe tener:

- identificador claro;
- objetivo único;
- restricciones;
- validación;
- documentación;
- commit separado;
- push a `origin/main`.

No se mezclan SEO técnico, contenido, UI, enlazado interno y medición en un mismo cambio.

### 2.4. Primero mapa, luego profundidad, luego ejecución

Antes de optimizar URLs de forma individual hay que tener:

1. mapa SEO maestro;
2. auditoría SEO/GEO profunda;
3. roadmap priorizado.

Solo después se ejecutan optimizaciones URL por URL.

---

## 3. Fuentes de datos

### 3.1. Google Search Console

GSC responde a lo que ocurre antes del clic:

- queries;
- impresiones;
- clics;
- CTR;
- posición media;
- URLs que Google muestra;
- oportunidades por bajo CTR;
- páginas con posición 6-15;
- canibalización potencial;
- evolución por país y dispositivo.

GSC es la fuente principal para decidir oportunidades SEO de captación.

### 3.2. Google Analytics 4

GA4 responde a lo que ocurre después del clic:

- landing pages reales;
- engagement;
- sesiones con interacción;
- eventos;
- descargas;
- navegación interna;
- tráfico por canal;
- retención por URL;
- calidad del tráfico orgánico.

GA4 sirve para decidir qué tráfico merece la pena potenciar.

### 3.3. Repositorio / código / contenido

El repo permite validar:

- metadatos;
- estructura de headings;
- schema;
- canonical;
- hreflang;
- sitemap;
- componentes;
- contenido real;
- rutas legacy;
- arquitectura interna.

### 3.4. Manual de identidad visual

Aunque este documento es SEO/GEO, la identidad visual afecta al comportamiento del usuario y a la confianza.

Referencia:

- `docs/brand/IDENTIDAD_VISUAL_KAKEBO.md`
- `docs/brand/PROMPT_VISUAL_KAKEBO.md`
- `docs/brand/UI_BRAND_AUDIT_01.md`

---

## 4. Diferencia entre SEO y GEO

### 4.1. SEO

SEO es optimizar para buscadores tradicionales como Google.

Incluye:

- indexación;
- arquitectura;
- intención de búsqueda;
- titles;
- meta descriptions;
- headings;
- contenido;
- enlazado interno;
- schema;
- autoridad;
- experiencia de usuario;
- medición.

### 4.2. GEO

GEO significa Generative Engine Optimization.

El objetivo es preparar la web para que motores generativos como ChatGPT, Gemini, Perplexity, Copilot u otros sistemas de respuesta puedan entender, resumir y citar mejor el contenido.

Incluye:

- definiciones claras;
- respuestas directas;
- estructura pregunta-respuesta;
- tablas comparativas;
- pasos accionables;
- entidades bien definidas;
- autoridad de marca;
- autoría;
- fechas de actualización;
- datos estructurados;
- contenido factual y reutilizable;
- consistencia entre páginas.

### 4.3. Aplicación a MetodoKakebo.com

MetodoKakebo.com debe trabajar ambas capas:

- SEO tradicional para captar tráfico desde Google;
- GEO para convertirse en referencia entendible sobre Kakebo, ahorro mensual, presupuesto personal, plantillas y herramientas gratuitas.

---

## 5. Orden lógico de trabajo

## Fase 1 — SEO-MAP-V1-AUDIT-01: Mapa SEO maestro

### Objetivo

Crear un inventario completo de URLs y definir el papel estratégico de cada una.

### Qué debe incluir

Para cada URL:

- URL;
- idioma;
- tipo de página;
- indexable/no indexable;
- canonical;
- intención principal;
- intención secundaria;
- keyword principal;
- keywords secundarias;
- estado en GSC;
- estado en GA4;
- tráfico orgánico actual;
- engagement;
- prioridad;
- riesgo;
- acción recomendada;
- estado: tocar ahora / esperar / no tocar.

### Tipos de URL

- Home;
- herramientas;
- artículos pilar;
- artículos soporte;
- blog index;
- app;
- páginas legales;
- legacy inglés;
- rutas históricas `/es` si aparecen en datos;
- recursos descargables.

### Resultado esperado

Documento:

- `docs/seo/SEO_MAP_V1.md`

Este documento será la base para ordenar todas las tareas posteriores.

---

## Fase 1.5 — SEO-GEO-DEEP-AUDIT-01: Auditoría SEO profunda + GEO

### Objetivo

Auditar el sitio a nivel técnico, semántico y generativo antes de seguir optimizando URL por URL.

Esta fase evita hacer cambios superficiales y permite detectar problemas estructurales.

---

### 5.1. SEO técnico profundo

Revisar:

- arquitectura indexable;
- sitemap;
- robots;
- canonicals;
- hreflang;
- redirects;
- rutas `/es` vs rutas canónicas sin prefijo;
- legacy inglés;
- paginación si aplica;
- breadcrumbs;
- schema global;
- schema por tipo de página;
- errores semánticos;
- duplicidades;
- thin content;
- canibalización;
- estructura global de headings;
- consistencia de metadata;
- imágenes, alt, peso y lazy loading;
- profundidad de clics;
- enlazado estructural;
- Core Web Vitals si hay datos disponibles.

---

### 5.2. SEO semántico

Revisar entidades y cobertura temática.

Entidades principales:

- Kakebo;
- método Kakebo;
- MetodoKakebo.com;
- ahorro mensual;
- presupuesto personal;
- gastos mensuales;
- plantilla Excel;
- app de ahorro;
- kakebo online;
- calculadora de ahorro;
- regla 50/30/20;
- inflación;
- finanzas personales.

Analizar:

- qué entidad domina cada URL;
- qué URLs compiten por la misma intención;
- qué clusters existen;
- qué clusters faltan;
- qué páginas son pilares;
- qué páginas son soporte;
- qué URLs no tienen función clara;
- qué páginas podrían canibalizarse;
- qué contenidos necesitan más profundidad.

---

### 5.3. GEO / Generative Engine Optimization

Revisar si el sitio es fácil de entender para motores generativos.

Criterios:

- definiciones claras al inicio de las páginas;
- respuestas breves y reutilizables;
- secciones tipo FAQ;
- tablas comparativas;
- listas de pasos;
- contenido factual;
- autoría reconocible;
- fechas de actualización;
- schema adecuado;
- consistencia terminológica;
- claridad entre método Kakebo, app Kakebo, plantilla Kakebo y herramientas;
- páginas explicativas sobre qué es MetodoKakebo.com;
- contenido citabile;
- evitar ambigüedad o claims exagerados.

### Resultado esperado

Documento:

- `docs/seo/SEO_GEO_DEEP_AUDIT_01.md`

---

## Fase 2 — SEO-ROADMAP-V1-01: Roadmap SEO priorizado

### Objetivo

Convertir el mapa y la auditoría profunda en una secuencia clara de tareas.

### Qué debe incluir

- próximas 5-10 tareas SEO/GEO;
- prioridad;
- impacto esperado;
- riesgo;
- dependencia;
- tipo de tarea;
- URL afectada;
- validación necesaria;
- si requiere datos GSC/GA4 adicionales;
- si debe esperar más tiempo.

### Criterios de priorización

Priorizar en este orden:

1. errores técnicos que afectan indexación;
2. canibalizaciones reales;
3. URLs con impresiones y bajo CTR;
4. URLs en posición 6-15 con potencial;
5. URLs importantes de negocio sin tracción;
6. oportunidades GEO estructurales;
7. mejoras de conversión;
8. contenido nuevo solo si hay hueco real.

### Resultado esperado

Documento:

- `docs/seo/SEO_ROADMAP_V1.md`

---

## Fase 3 — Optimización URL por URL

### Objetivo

Optimizar cada URL importante de forma individual, con intención clara.

### Orden recomendado

1. URLs con tráfico real que deben protegerse.
2. URLs con impresiones y CTR bajo.
3. URLs con posición 6-15.
4. URLs de negocio con potencial pero sin tracción.
5. URLs débiles que necesitan reorientación.
6. URLs legacy que generan ruido.

### Elementos a revisar por URL

- keyword principal;
- intención principal;
- title;
- meta description;
- H1;
- primer bloque visible;
- H2/H3;
- FAQ;
- schema;
- imágenes;
- enlaces internos actuales;
- CTA;
- conversión;
- canibalización;
- engagement GA4;
- queries GSC;
- oportunidad GEO.

### Regla clave

No se optimiza una URL sin saber:

- qué query quiere capturar;
- qué intención resuelve;
- qué papel cumple dentro del sitio;
- qué URL no debe pisar.

---

## Fase 4 — Arquitectura y enlazado interno

### Objetivo

Conectar las URLs cuando cada una ya tenga su función clara.

El enlazado interno no debe hacerse antes del mapa y la optimización URL por URL, porque podría reforzar páginas que todavía no están bien orientadas.

### Tipos de enlaces

- Home → clusters principales;
- artículos pilar → herramientas;
- artículos soporte → artículos pilar;
- herramientas → artículos explicativos;
- artículos relacionados → recursos descargables;
- blog index → categorías estratégicas;
- footer/navbar solo si aporta arquitectura real.

### Criterios

- anchor text natural;
- contexto semántico real;
- no enlazar por enlazar;
- evitar sobreoptimización;
- distribuir autoridad desde páginas tractoras con cuidado;
- proteger URLs que ya funcionan.

### Resultado esperado

Documento o tarea:

- `SEO-INTERNAL-LINKING-V1-01`

---

## Fase 5 — Expansión de contenido

### Objetivo

Crear contenido nuevo solo cuando el mapa detecte huecos reales.

No publicar por calendario si no hay intención clara.

### Posibles líneas futuras

- cuánto ahorrar al mes;
- cómo hacer un presupuesto mensual;
- método Kakebo para parejas;
- Kakebo vs Excel;
- plantilla de gastos mensuales;
- app para ahorrar dinero sin conectar banco;
- alternativas a Fintonic;
- método japonés para ahorrar;
- control de gastos para autónomos.

### Criterios antes de crear un artículo

Antes de crear una URL nueva debe existir:

- keyword objetivo;
- intención clara;
- hueco dentro del cluster;
- diferenciación frente a URLs existentes;
- objetivo de conversión;
- posible enlazado interno;
- formato adecuado;
- oportunidad GEO.

---

## Fase 6 — Medición continua

### Objetivo

Medir impacto de forma iterativa cada 2-4 semanas.

### Fuentes

Google Search Console:

- clics;
- impresiones;
- CTR;
- posición;
- queries;
- páginas;
- países;
- dispositivos.

Google Analytics:

- landing pages orgánicas;
- engagement;
- sesiones con interacción;
- eventos;
- descargas;
- navegación interna;
- tráfico social/orgánico/directo;
- comportamiento por URL.

Repo:

- qué se tocó;
- cuándo se tocó;
- commit;
- deploy;
- hipótesis;
- resultado esperado.

### Regla

No evaluar impacto SEO de un cambio al día siguiente salvo errores técnicos.

Ventanas mínimas:

- cambios title/meta: 2-4 semanas;
- contenido: 4-8 semanas;
- enlazado interno: 4-8 semanas;
- contenido nuevo: 8-12 semanas.

---

## 6. Orden de tareas propuesto

### Bloque inmediato

1. `SEO-MAP-V1-AUDIT-01`  
   Crear mapa maestro SEO de URLs, intención, prioridad y estado.

2. `SEO-GEO-DEEP-AUDIT-01`  
   Auditar SEO técnico profundo, SEO semántico y GEO.

3. `SEO-ROADMAP-V1-01`  
   Ordenar las próximas tareas SEO/GEO por prioridad real.

### Bloque posterior

4. Optimización URL por URL según roadmap.

5. Enlazado interno estructural.

6. Expansión de contenido.

7. Medición y mejora continua.

---

## 7. Estado actual conocido

### URLs con tracción real

- `/blog/plantilla-kakebo-excel`
  - Principal landing page orgánica.
  - Buen engagement.
  - Activo SEO principal.
  - No tocar de forma agresiva.

### URLs con potencial pero poca tracción

- `/herramientas/calculadora-ahorro`
- `/herramientas/calculadora-inflacion`
- `/herramientas/regla-50-30-20`
- Home `/`

### Riesgos conocidos

- Dependencia excesiva de una URL tractora.
- Herramientas con poca entrada orgánica.
- Legacy inglés a vigilar.
- Posibles rutas históricas `/es` visibles en GSC.
- Falta de mapa maestro actualizado.
- Falta de eventos GA4 específicos para conversiones SEO.

---

## 8. Qué no hacer

No hacer:

- tocar la página ganadora por ansiedad;
- cambiar slugs con histórico;
- modificar titles/metas sin hipótesis;
- crear artículos sin mapa;
- hacer enlazado interno antes de definir la función de cada URL;
- mezclar SEO con rediseño visual;
- trabajar por intuición si hay datos disponibles;
- optimizar muchas URLs en un solo commit;
- tocar inglés legacy sin auditoría específica;
- asumir que CTR alto con poca muestra significa éxito estable;
- evaluar impacto demasiado pronto.

---

## 9. Forma de trabajo por tarea

Cada tarea debe seguir esta estructura:

1. Definición de tarea.
2. Objetivo único.
3. Contexto.
4. Documentos de referencia.
5. Restricciones.
6. Acciones.
7. Validación.
8. Actualización de documentación.
9. Commit.
10. Push.
11. Cierre con hash.

---

## 10. Conclusión

MetodoKakebo.com no debe seguir trabajando SEO como una lista de cambios sueltos.

La estrategia correcta es construir un sistema:

1. entender todas las URLs;
2. auditar la profundidad técnica, semántica y GEO;
3. ordenar prioridades;
4. optimizar URL por URL;
5. conectar internamente cuando cada URL tenga una función clara;
6. crear contenido solo donde falte una pieza estratégica;
7. medir con GSC, GA4 y commits documentados.

Este documento será la referencia base para las próximas decisiones SEO/GEO del proyecto.

**Orden y progreso.**
