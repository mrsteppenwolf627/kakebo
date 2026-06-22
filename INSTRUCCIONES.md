# INSTRUCCIONES: Cuándo Usar Claude Code vs Antigravity

**Fecha:** 5 de Febrero 2026  
**Proyecto:** Kakebo AI

---

## Resumen Ejecutivo

Este documento define cuándo es mejor trabajar con **Claude Code (Cursor)** o con **Antigravity** para maximizar la productividad en el desarrollo.

---

## Cuándo Usar CLAUDE CODE (Cursor)

### ✅ **Ideal para: VISUAL POLISH & UI FINE-TUNING**

1.  **"Magic" Styling**
    -   Ejemplo: "Haz que este componente tenga un efecto glassmorphism y bordes suaves"
    -   Razón: Excelente sugiriendo clases de Tailwind y estilos modernos.

2.  **Micro-interacciones**
    -   Ejemplo: "Que el botón pulse suavemente al hacer hover"
    -   Razón: Itera rápido en animaciones y feeling.

3.  **Refinamiento de Contenido (Copy)**
    -   Ejemplo: "Reescribe este párrafo para que sea más zen y corto"
    -   Razón: Buen sentido del tono y lenguaje.

4.  **Arreglos Rápidos (Hotfixes)**
    -   Ejemplo: "El margen en móvil está roto, arréglalo"
    -   Razón: Perfecto para ediciones de archivo único.

### Casos prácticos:
- Añadir validación a un campo en un formulario
- Cambiar estilos CSS/Tailwind en un componente
- Renombrar una función y actualizar sus usos
- Ajustar tipos TypeScript
- Iterar en UI (botones, layouts, animaciones)

---

## Cuándo Usar ANTIGRAVITY

### ✅ **Ideal para: ARQUITECTURA, LOGICA COMPLEJA & HEAVY LIFTING**

1.  **Implementación SaaS & Backend**
    -   Ejemplo: "Configura Stripe, los Webhooks y la base de datos"
    -   Razón: Maneja múltiples archivos (API, Libs, DB) simultáneamente sin perder el hilo.

2.  **Creación de Estructuras Nuevas**
    -   Ejemplo: "Crea la página de Pricing, Legal y el panel de Admin desde cero"
    -   Razón: Genera el esqueleto robusto y funcional sobre el que luego se diseña.

3.  **Lógica de Negocio Crucial**
    -   Ejemplo: "Implementa el sistema de control de acceso y trials"
    -   Razón: Menos propenso a errores lógicos en flujos complejos que cruzan frontend y backend.

4.  **Planificación y Estrategia**
    -   Ejemplo: "Diseña el roadmap para la fase móvil"
    -   Razón: Mantiene el contexto global del proyecto (documentos, tareas, objetivos).

5.  **Tareas Multi-archivo**
    -   Cualquier cosa que toque >3 archivos a la vez.

### Casos prácticos:
- Implementar un sistema completo de agentes IA
- Añadir una nueva feature grande (ej: RAG, métricas, dashboard)
- Debuggear errores sistémicos que abarcan múltiples archivos
- Migrar de una tecnología a otra
- Crear estructura inicial de un proyecto

---

## Comparativa Técnica

| Característica | Antigravity | Claude Code (Cursor) |
|---|---|---|
| Edición simultánea multi-archivo | ✅ Excelente | ⚠️ Limitado |
| Inline suggestions | ❌ No | ✅ Excelente |
| Modo Planning | ✅ Sí (artifacts) | ❌ No |
| Ejecución autónoma (build/test) | ✅ Sí | ⚠️ Manual |
| Búsqueda en codebase | ✅ Sí (grep, find) | ⚠️ Limitado |
| Velocidad para 1 archivo | ⚠️ Normal | ✅ Muy rápido |
| Context window | Grande | Medio-Grande |
| Documentación automática | ✅ Sí | ❌ No |

---

## Workflow Híbrido Recomendado

```
1. ANTIGRAVITY: Planificación + implementación inicial
   → Crea 5-10 archivos base, estructura, integración
   → Hace build/tests para validar
   → Genera doc de contexto
   → Push a GitHub

2. CLAUDE CODE (Cursor): Refinamiento y ajustes
   → Mejoras UX de componentes específicos
   → Añades validaciones puntuales
   → Arreglas bugs pequeños que encuentras mientras pruebas
   → Iteras rápido en styling/UI

3. ANTIGRAVITY: Nuevas features grandes
   → Push tus cambios a GitHub
   → Lee el contexto actualizado
   → Implementa la siguiente feature compleja
```

---

## Protocolo de Sincronización (Handoff)

### **Cuando pasas de Antigravity → Claude Code:**
1. Antigravity genera documento de contexto (`actualización X.txt`)
2. Antigravity hace commit y push
3. Claude Code lee el contexto desde el archivo

### **Cuando pasas de Claude Code → Antigravity:**
1. Haces commit y push de tus cambios
2. Antigravity hace `git pull`
3. Antigravity lee el código actualizado y continúa

---

## Reglas de Oro

1. **Nunca edites el mismo archivo simultáneamente** con ambos agentes
2. **Siempre haz commit antes de cambiar** de herramienta
3. **Lee el contexto actualizado** antes de continuar trabajando
4. **Usa Antigravity para builds** finales y validación
5. **Usa Cursor para iteración rápida** de UI
6. **Solo español para contenido editorial SEO** — no crear archivos `.en.mdx` nuevos salvo orden explícita (ver `PROJECT_STATUS.md` → Política SEO de Idiomas)
7. **Actualiza documentación/contexto tras cada tarea** — el estado persistente del proyecto vive en los archivos del repositorio, no en el chat (ver sección "Protocolo obligatorio de memoria persistente")

---

## Ejemplos del Proyecto Kakebo

### Antigravity hizo:
- ✅ Arquitectura multi-agente (Fase 4)
- ✅ Sistema RAG completo (Fase 3)
- ✅ API REST completa (Fase 1)
- ✅ Frontend inicial del chat (Fase 5)
- ✅ Documentación y arquitectura

### Claude Code debería hacer:
- 🎨 Añadir markdown rendering a mensajes
- 🎨 Persistencia de historial con localStorage
- 🐛 Ajustes finos de validaciones
- 🎨 Animaciones y transiciones suaves
- 🎨 Responsive design refinado

---

## Protocolo obligatorio de memoria persistente

**La memoria persistente del proyecto vive en los archivos del repositorio, no en el chat.**

Cada sesión de chat termina. Cada modelo cambia. Cada agente empieza sin contexto previo. La única fuente de verdad que sobrevive a todos esos cambios son los archivos del repositorio.

### Regla principal

> Toda tarea completada debe actualizar la documentación de estado antes de avanzar a la siguiente.

### Qué debe registrarse tras cada tarea

| Elemento | Dónde |
|---|---|
| Objetivo y resultado de la tarea | `docs/PROJECT_STATUS.md` o `PROJECT_STATUS.md` (raíz) |
| Archivos creados o modificados | `docs/PROJECT_STATUS.md` |
| Validación: build, tests, lint | `docs/PROJECT_STATUS.md` |
| Commit hash y rama | `docs/PROJECT_STATUS.md` |
| Restricciones activas | `PROJECT_STATUS.md` (raíz) |
| Siguiente tarea recomendada | Ambos archivos de estado |
| Reglas nuevas o cambios de política | `INSTRUCCIONES.md` o `PROJECT_STATUS.md` (raíz) |

### Cuándo ejecutar build y tests

| Tipo de cambio | Build | Tests |
|---|---|---|
| Solo archivos `.md` de documentación | No necesario | No necesario |
| Código fuente (`.ts`, `.tsx`, componentes) | Obligatorio | Obligatorio |
| Configuración (`next.config.ts`, `routing.ts`, etc.) | Obligatorio | Obligatorio |
| Contenido MDX del blog (`.mdx`) | Recomendado | Recomendado |

### Cuándo hacer commit y push

- **Siempre** que haya cambios en archivos del repositorio, incluyendo documentación.
- El commit debe ser atómico: solo los archivos de la tarea actual.
- El `.claude/settings.local.json` nunca se incluye en commits.
- Si el remote tiene cambios, hacer `git pull --rebase` antes de push.

### Fuentes de verdad del proyecto

| Archivo | Contenido |
|---|---|
| `docs/PROJECT_STATUS.md` | Historial detallado de sprints SEO/UI, decisiones arquitectónicas, próximas tareas |
| `PROJECT_STATUS.md` (raíz) | Estado rápido actual, política de idiomas, clusters de contenido |
| `INSTRUCCIONES.md` | Protocolo operativo, reglas de Oro, metodologías de fase |
| `CONTEXT.md` | Arquitectura técnica de la aplicación, historial de migración SaaS→gratuito |
| `ADRs.md` | Decisiones arquitectónicas de infraestructura |

### Lo que NO es fuente de verdad

- El historial del chat (se pierde entre sesiones).
- La memoria del agente (se reinicia con cada conversación).
- Cualquier información que no haya sido commiteada al repositorio.

---

## Metodología UI/UX indexable

**Aplicable a partir de UIUX-INDEXABLE-01.**

### Scope de la fase UI/UX

Esta fase se aplica **únicamente** a la parte pública e indexable de MetodoKakebo.com.

**Incluye:**
- Home (`/`)
- Índice del blog (`/blog`)
- Artículos del blog (`/blog/[slug]`)
- Páginas de herramientas (`/herramientas/*`)
- Navegación pública (Navbar, Footer)
- CTAs y experiencia de lectura

**Excluye explícitamente:**
- Herramienta interna / dashboard (`/app/*`)
- Lógica de negocio y autenticación
- Cualquier ruta que requiera login

### Orden de la fase

La fase UI/UX se divide en tres etapas que no deben mezclarse:

1. **Auditoría** — observar y diagnosticar el estado visual actual sin tocar código.
2. **Dirección estética** — definir dirección visual concreta antes de implementar.
3. **Implementación** — ejecutar cambios aprobados en la dirección acordada.

**UIUX-INDEXABLE-01 es etapa 1 (auditoría únicamente).** No se implementa nada hasta tener la dirección aprobada.

### Principios de la metodología visual

Basada en el enfoque de *frontend aesthetics*: cada decisión visual debe tener una razón concreta, no seguir una plantilla.

| Dimensión | Qué evaluar |
|---|---|
| **Tipografía** | Jerarquía, legibilidad, peso, espaciado, coherencia entre serif/sans |
| **Color** | Contraste, paleta activa vs. neutral, uso de tokens de diseño |
| **Motion** | Transiciones, hover states, feedback visual, sensación de respuesta |
| **Fondos** | Textura, separación de secciones, uso de `bg-muted`, espaciado vertical |
| **Layout** | Anchura de columnas, márgenes, densidad de información, respiración |
| **Atmósfera** | Sensación general: ¿moderno, zen, confiable, editorial, minimalista? |

### Lo que se evita

- Decisiones visuales genéricas sin dirección ("parece un template").
- Cambios decorativos sin propósito funcional o comunicativo.
- Consistencia falsa (usar el mismo componente donde no encaja).
- Implementar antes de acordar la dirección estética.

### Restricciones activas para toda la fase UI/UX

- No tocar herramienta interna/dashboard en ningún momento.
- No abrir SEO-02 ni crear nuevos artículos durante esta fase.
- No modificar routing, i18n, hreflang ni middleware.
- No cambiar contenido SEO ni slugs.
- Cada tarea UI/UX completada debe actualizar `docs/PROJECT_STATUS.md` con lo ejecutado.

---

## Contacto y Soporte

Si otro desarrollador trabaja en este proyecto en otro ordenador:
1. Lee el archivo `CONTEXT.md` del proyecto
2. Lee `docs/PROJECT_STATUS.md` para el estado operativo actual
3. Lee `PROJECT_STATUS.md` (raíz) para el estado rápido y restricciones activas
4. Sigue este documento de INSTRUCCIONES
5. Haz pull del repositorio antes de empezar

---

**Fin del documento.**
