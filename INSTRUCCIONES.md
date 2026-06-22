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

## Contacto y Soporte

Si otro desarrollador trabaja en este proyecto en otro ordenador:
1. Lee el archivo `CONTEXT.md` del proyecto
2. Lee la última `actualización X.txt` disponible
3. Sigue este documento de INSTRUCCIONES
4. Haz pull del repositorio antes de empezar

---

**Fin del documento.**
