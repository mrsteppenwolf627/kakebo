# SEO_ROADMAP_RESUME_2026_07_09 — Reconciliación del Plan Maestro SEO/GEO

**Fecha:** 2026-07-09
**Tarea:** SEO-ROADMAP-RESUME-01
**Tipo:** Solo análisis, reconciliación y documentación — sin cambios en código, contenido, UI ni configuración SEO
**Commit HEAD en el momento de esta reconciliación:** `552ef18`
**Documentos revisados:** `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md` · `docs/seo/SEO_ROADMAP_V1.md` · `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` · `docs/seo/SEO_MAP_V1.md` · `docs/seo/GSC_CHANGELOG_2026_07_03.md` · `docs/seo/POST_PUBLISH_INDEXATION_CHECK_2026_07_08.md` · `docs/PROJECT_STATUS.md` · `PROJECT_STATUS.md` (raíz) · `git log --oneline -12`

---

## 1. Estado actual del proyecto

- **Sprint SEO Técnico V1:** cerrado oficialmente el 2026-07-07 (commit `72f52a9`, documento `docs/seo/SEO_TECHNICAL_V1_COMPLETED.md`).
- **Sprint Contenido V1:** iniciado el 2026-07-07/08, en curso. Ha producido: un artículo nuevo (`cuentas-remuneradas`), una reescritura funcional de la calculadora de ahorro (V2), su auditoría y optimización SEO/GEO, y una verificación post-publicación.
- **Últimos 8 commits en `main`:** `552ef18` (POST-PUBLISH-INDEXATION-CHECK-01) ← `1b986e2` ← `ea3f17b` ← `c123eb0` ← `808c621` ← `e986a1d` ← `8ffbcfc` ← `011f42c` ← `72f52a9` (cierre técnico).
- **Verificación manual externa ya confirmada por el usuario** (fuera del repo, GSC/Rich Results):
  - `/blog/cuentas-remuneradas` está indexada en Google; Rich Results detecta `Artículo` + `Breadcrumbs`.
  - `/herramientas/calculadora-ahorro` está indexada en Google; Rich Results detecta `SoftwareApplication` válido. `aggregateRating` falta como campo opcional — **no corregir**, no hay reseñas reales que lo respalden.

### Nota sobre duplicidad documental detectada

Existen **dos archivos `PROJECT_STATUS.md` activos y desincronizados**:
- `docs/PROJECT_STATUS.md` (histórico, ~3620 líneas) — última entrada real es `SEO-TECHNICAL-V1-CLOSE-01` (2026-07-07). No refleja ninguna tarea del Sprint Contenido V1.
- `PROJECT_STATUS.md` (raíz, ~2230 líneas) — sí contiene las entradas de `TOOL-CALCULADORA-AHORRO-*`, `CONTENT-01` y `POST-PUBLISH-INDEXATION-CHECK-01`, además de una tabla resumen que se solapa parcialmente con la de `docs/PROJECT_STATUS.md` para el periodo 2026-06-30–07-01.

Además existe un `SEO_MAP_V1.md` **suelto en la raíz del repo** (sin trackear en git, fechado 2026-06-17, commit de referencia `1841721`), explícitamente superseded por `docs/seo/SEO_MAP_V1.md` (v1.1, 2026-06-30). Es un residuo local, no forma parte del histórico documentado del repositorio.

**Recomendación (no ejecutada en esta tarea, solo señalada):** consolidar ambos `PROJECT_STATUS.md` en uno solo y decidir si el root `SEO_MAP_V1.md` se descarta o se archiva, en una tarea de limpieza documental futura e independiente — no se toca en esta reconciliación porque excede el objetivo único definido.

---

## 2. Tareas cerradas recientemente

### Bloque técnico (roadmap `SEO_ROADMAP_V1.md`, sección "Bloque 1")

| Tarea | Estado | Commit |
|---|---|---|
| `SEO-HREFLANG-NOINDEX-GUARD-01` | ✅ Cerrada | (2026-07-07) |
| `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01` | ✅ Cerrada | (2026-07-07) |
| `SEO-SITEMAP-HERRAMIENTAS-01` | ✅ Cerrada | (2026-07-07) |
| `SEO-SITEMAP-LASTMODIFIED-01` | ✅ Cerrada | (2026-07-07) |
| `SEO-SCHEMA-HERRAMIENTAS-HUB-01` | ✅ Cerrada | `b5787c8` |

### Bloque arquitectura / autoría

| Tarea | Estado | Commit |
|---|---|---|
| `SEO-GEO-AUTHORSHIP-AUDIT-01` (ejecutada como `SEO-AUTHOR-AUDIT-01`) | ✅ Cerrada | `9638874` |
| `SEO-AUTHOR-NORMALIZATION-01` | ✅ Cerrada | `a23e809` |
| `SEO-INTERNAL-LINKING-EXEC-METODO-01` (Fase 1 — gap real ejecutado como `SEO-AHORRO-INBOUND-01`) | ✅ Cerrada para el alcance de Fase 1 | (2026-07-07) |
| `SEO-INTERNAL-LINK-CANONICAL-01` | ✅ Cerrada | `7c232f3` |

### Bloque Sprint Contenido V1 (no formaba parte de `SEO_ROADMAP_V1.md` — trabajo posterior a su fecha de cierre)

| Tarea | Estado | Commit |
|---|---|---|
| `CONTENT-01` — artículo `/blog/cuentas-remuneradas` | ✅ Cerrada | `011f42c` |
| `TOOL-CALCULADORA-AHORRO-V2-AUDIT-01` | ✅ Cerrada | `8ffbcfc` |
| `TOOL-CALCULADORA-AHORRO-V2-IMPL-01` | ✅ Cerrada | `e986a1d` |
| `TOOL-CALCULADORA-AHORRO-SEO-GEO-AUDIT-01` | ✅ Cerrada | `c123eb0` |
| `TOOL-CALCULADORA-AHORRO-SEO-GEO-IMPL-01` | ✅ Cerrada | `ea3f17b` |
| `POST-PUBLISH-INDEXATION-CHECK-01` | ✅ Cerrada | `552ef18` |

**Conclusión de esta sección:** todo el Bloque 1 (técnico) y la mayor parte del Bloque 2 (arquitectura/autoría) de `SEO_ROADMAP_V1.md` están cerrados. El Sprint Contenido V1 ha producido su primera pieza de contenido y ha optimizado su primera herramienta de forma completa (funcional + SEO/GEO), con verificación post-publicación cerrada.

---

## 3. URLs en fase de medición (no tocar)

| URL | Motivo | Ventana | Vence |
|---|---|---|---|
| `/blog/cuentas-remuneradas` | Artículo nuevo, recién indexado | 8-12 semanas desde publicación (2026-07-08) | ~2026-09-02 a 2026-09-30 |
| `/herramientas/calculadora-ahorro` | Cambios title/meta (SEO/GEO IMPL) | 2-4 semanas desde `ea3f17b` (2026-07-08) | ~2026-07-22 a 2026-08-05 |
| `/herramientas/calculadora-ahorro` (FAQ/HowTo visible) | Contenido/enlazado interno nuevo | 4-8 semanas desde `ea3f17b` (2026-07-08) | ~2026-08-05 a 2026-09-02 |
| Todo el bloque técnico julio (hreflang, publisher, sitemap, autoría) | Cambios técnicos/estructurales de julio | Snapshot GSC ya fijado | **2026-07-17 a 2026-07-31** |

**Regla aplicable (heredada de `PLAN_SEO_GEO_METODOKAKEBO.md` §2.1 y `GSC_CHANGELOG_2026_07_03.md` §5):** no interpretar impacto antes de estas ventanas; no modificar estas URLs por ansiedad de resultado.

---

## 4. Deudas resueltas (no requieren más acción)

- Hreflang contradictorio hacia 10 URLs EN noindexadas (T-13).
- `BlogPosting.publisher.name` inconsistente (G-12).
- Hub `/herramientas` ausente del sitemap y sin schema (T-01).
- `lastModified` no fiable en `coreRoutes` (T-10).
- 7 identidades editoriales distintas → normalizadas a Persona (Aitor Alarcón) + Organización (MetodoKakebo.com) (G-03 cerrado vía auditoría + normalización).
- Enlaces internos con prefijo `/es/` residual (17 ocurrencias).
- Gap de imagen OG, FAQ insuficiente (3→6 preguntas), ausencia de HowTo y de enlazado interno en `/herramientas/calculadora-ahorro` — resuelto en `TOOL-CALCULADORA-AHORRO-SEO-GEO-IMPL-01`.
- Calculadora de ahorro V2 funcionalmente rota (`fixedExpenses` capturado pero no usado, barras hardcodeadas) — resuelto en `TOOL-CALCULADORA-AHORRO-V2-IMPL-01`.
- Integración post-publicación de las dos URLs del Sprint Contenido V1 (sitemap, indexabilidad, metadata, schema, build/lint/typecheck, render local) — verificada en `POST-PUBLISH-INDEXATION-CHECK-01`, y confirmada externamente por el usuario en GSC/Rich Results.

---

## 5. Deudas pendientes reales

| ID | Tarea | Prioridad | Bloqueada por |
|---|---|---|---|
| `SEO-SITENAME-UNIFY-01` | Unificar `siteName` ("Kakebo AI" vs "MetodoKakebo.com" en `calculadora-inflacion`) | P1 | Nada — ejecutable ya |
| `SEO-TECHNICAL-TUTORIAL-PRIORITY-01` | Ajustar prioridad de sitemap de `/tutorial` (T-12) | P2 | Nada — ejecutable ya |
| `SEO-BREADCRUMB-AUDIT-01` | Auditar si existe `BreadcrumbList` en blog/herramientas | P3 | Nada — ejecutable ya (solo lectura) |
| `SEO-INTERNAL-LINKING-EXEC-EXCEL-01` | Enlaces salientes desde `plantilla-kakebo-excel` hacia herramientas | P1 | **Autorización explícita del usuario** — política vigente desde `GSC_CHANGELOG_2026_07_03.md`, no se ha concedido todavía |
| `SEO-BLOG-INFLACION-01` | Artículo de respaldo para `calculadora-inflacion` | P2 | Snapshot GSC 2026-07-17/31 |
| `SEO-BLOG-503020-01` | Artículo de respaldo para `regla-50-30-20` | P2 | Snapshot GSC 2026-07-17/31 |
| `SEO-KAKEBO-VS-FINTONIC-01` | Segunda comparativa BOFU | P3 | Snapshot GSC 2026-07-17/31 + resultados de los dos artículos de herramientas |
| `SEO-GEO-FAQ-PAGE-01` | Página `/faq` global | P3 | Cierre completo de Bloques 1-4 (no urgente por diseño) |
| Decisión sobre 3 artículos EN "dudosos" (`como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `metodo-kakebo-guia-definitiva` EN) | — | — | Snapshot GSC 2026-07-17/31 |
| Consolidación documental: dos `PROJECT_STATUS.md` desincronizados + `SEO_MAP_V1.md` residual en raíz | — | — | Sin bloqueo — tarea de limpieza a programar |

Las tres primeras (`SITENAME-UNIFY`, `TUTORIAL-PRIORITY`, `BREADCRUMB-AUDIT`) son las **únicas tareas técnicas P1-P3 sin ejecutar y sin ninguna dependencia** — son candidatas naturales si se prioriza cerrar el 100% del bloque técnico antes de continuar con contenido.

---

## 6. Tareas que deben esperar

Todas las de la sección 5 marcadas con dependencia de **Snapshot GSC 2026-07-17/31**, más:

- Cualquier optimización adicional de `/blog/como-hacer-un-presupuesto-personal` (publicado 2026-06-22; primeras señales fiables esperadas a partir de 2026-08-17, 8 semanas).
- Cualquier modificación de `/blog/cuentas-remuneradas` o de los cambios de metadata de `/herramientas/calculadora-ahorro` — están en ventana de medición activa (ver sección 3), no se tocan hasta que venza.
- `SEO-INTERNAL-LINKING-EXEC-EXCEL-01` — sin autorización explícita, no se ejecuta bajo ninguna circunstancia.

---

## 7. Tareas que NO deben hacerse todavía

- No publicar contenido nuevo (`SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`, `SEO-KAKEBO-VS-FINTONIC-01`) — bloqueadas hasta snapshot GSC.
- No tocar `/blog/plantilla-kakebo-excel` sin autorización explícita.
- No modificar `/blog/cuentas-remuneradas` ni `/herramientas/calculadora-ahorro` mientras estén en ventana de medición.
- No crear la página `/faq` global (`SEO-GEO-FAQ-PAGE-01`) — P3 por diseño, no debe competir por atención.
- No interpretar los resultados de Rich Results/GSC ya confirmados por el usuario como señal de que hay que optimizar más esas URLs — la confirmación es un checkpoint de validación, no una invitación a iterar antes de tiempo.

---

## 8. Revisión de puntos específicos solicitados

**¿La calculadora de ahorro ya debe considerarse optimizada funcional + SEO/GEO?**
Sí. V2 resolvió el problema funcional (cálculo real con gastos fijos + variables, barras dinámicas). La auditoría e implementación SEO/GEO posteriores cerraron los 3 hallazgos P0 (OG, FAQ insuficiente, sin bloque intro) y todos los P1 (título, meta, HowTo, interpretación, enlazado, schema). La verificación post-publicación confirmó indexación y `SoftwareApplication` válido en Rich Results. **No requiere más trabajo hasta que la ventana de medición (2-8 semanas) aporte datos.**

**¿El artículo cuentas remuneradas debe quedar en fase de medición, no de modificación?**
Sí. Está indexado, con `Artículo` + `Breadcrumbs` confirmados en Rich Results. Ventana de medición: 8-12 semanas (hasta ~2026-09-02/30). No modificar contenido, slug, schema ni metadata hasta entonces salvo error técnico real.

**¿Hay que proteger `/blog/plantilla-kakebo-excel` sin tocarla?**
Sí, sin cambios. Sigue siendo el activo dominante y la única tarea que la toca (`SEO-INTERNAL-LINKING-EXEC-EXCEL-01`) permanece bloqueada por falta de autorización explícita.

**¿Cuál debe ser el siguiente paso: medición, enlazado interno, otra herramienta, o revisión de una URL concreta?**
El siguiente paso natural es **esperar el snapshot GSC del 2026-07-17/31** — es el evento que desbloquea todo el Bloque 4 (contenido nuevo) y valida si el sprint técnico de julio funcionó. Mientras se espera esa fecha, el único trabajo ejecutable sin dependencias es el resto del bloque técnico P1-P3 de bajo riesgo (`SEO-SITENAME-UNIFY-01`, `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`, `SEO-BREADCRUMB-AUDIT-01`).

**¿Hay documentos antiguos que mencionan deudas ya resueltas y puedan confundir?**
Sí, dos casos:
1. `docs/PROJECT_STATUS.md` no refleja ninguna tarea del Sprint Contenido V1 (se detiene en 2026-07-07) — quien lo lea sin cruzar con `PROJECT_STATUS.md` (raíz) creerá que el proyecto sigue en el cierre del Sprint Técnico.
2. El `SEO_MAP_V1.md` suelto en la raíz del repo (2026-06-17, sin trackear) está explícitamente superseded por `docs/seo/SEO_MAP_V1.md` — riesgo de que alguien lo lea por error como la versión vigente.

Ambos casos están documentados en la sección 1 de este documento; no se han modificado en esta tarea (fuera de su objetivo único).

---

## 9. Dependencias temporales

| Evento | Fecha | Qué desbloquea |
|---|---|---|
| Snapshot GSC | 2026-07-17 a 2026-07-31 | Bloque 4 de contenido (`SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`), decisión sobre 3 artículos EN dudosos, validación del sprint técnico de julio |
| Fin ventana medición metadata calculadora | ~2026-08-05 | Posible ajuste de title/meta de `calculadora-ahorro` si el snapshot lo justifica |
| Fin ventana medición FAQ/HowTo calculadora | ~2026-09-02 | Evaluación de impacto en rich results / CTR |
| Fin ventana medición artículo cuentas remuneradas | ~2026-09-02 a 2026-09-30 | Evaluación de indexación/posicionamiento del artículo, decisión sobre si el patrón editorial se repite |

---

## 10. Próxima ventana de medición

**2026-07-17 a 2026-07-31** — snapshot GSC ya fijado (`SEO-GSC-SNAPSHOT-2026-07-17` en `SEO_ROADMAP_V1.md`, prioridad P0 programada). Debe comparar contra el baseline de `GSC_CHANGELOG_2026_07_03.md` y cubrir explícitamente: Home (queries de marca), las 10 URLs EN noindexadas (caída de impresiones), `/herramientas/regla-50-30-20`, `/blog/kakebo-online-guia-completa`, y los 3 artículos EN dudosos.

---

## 11. Recomendación de próximas 3 tareas

1. **Esperar y ejecutar `SEO-GSC-SNAPSHOT-2026-07-17`** en su fecha natural (2026-07-17/31) — es la tarea P0 programada que desbloquea todo el bloque de contenido siguiente.
2. **`SEO-SITENAME-UNIFY-01`** — única deuda técnica P1 sin ejecutar y sin dependencias; cierre de una línea, riesgo muy bajo, completa el 100% del bloque técnico.
3. **`SEO-BREADCRUMB-AUDIT-01`** — auditoría pura (solo lectura), sin riesgo, cierra la única incertidumbre documental que queda abierta sobre `BreadcrumbList` en el sitio.

---

## 12. Tarea recomendada como siguiente paso único

### `SEO-SITENAME-UNIFY-01` — Unificar `siteName` a un único valor consistente

**Justificación según el Plan Maestro SEO/GEO:**

- `PLAN_SEO_GEO_METODOKAKEBO.md` (Fase 3, "Regla clave") establece que no se optimiza una URL sin saber su función — pero esto es una corrección técnica cross-site, no una optimización de contenido, por lo que no está sujeta a las restricciones de "no tocar URLs en medición".
- Es la única tarea del Bloque 1 (técnico) de `SEO_ROADMAP_V1.md` que quedó sin ejecutar cuando el sprint se cerró el 2026-07-07 — cerrarla completa al 100% el bloque de menor riesgo y mayor disciplina de ejecución ya validada en el proyecto.
- No depende de ninguna fecha, dato GSC ni autorización — es ejecutable hoy mismo sin violar ninguna ventana de medición activa (no toca `cuentas-remuneradas` ni `calculadora-ahorro`, y no es `plantilla-kakebo-excel`).
- Impacto GEO bajo-medio (coherencia de entidad de marca, criterio central del documento maestro §4.2) con dificultad y riesgo "muy bajo" según la propia clasificación del roadmap.
- Ejecutarla ahora, mientras se espera el snapshot GSC del 2026-07-17/31, aprovecha la ventana de espera sin abrir ningún bloque de contenido nuevo ni tocar URLs en medición — exactamente el tipo de trabajo que el Plan Maestro permite hacer "mientras se espera" (§Fase 6, medición continua).

**Nota:** esta reconciliación NO ejecuta `SEO-SITENAME-UNIFY-01` — solo la identifica como la tarea recomendada para la próxima sesión de trabajo, conforme a la restricción de esta tarea de no implementar cambios de SEO, UI, contenido ni funcionalidad.

---

*SEO_ROADMAP_RESUME_2026_07_09.md — creado 2026-07-09*
*Solo análisis, reconciliación y documentación — sin cambios en código, contenido ni configuración SEO*
