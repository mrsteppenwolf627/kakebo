# INSTRUCCIONES: Cuándo Usar Claude Code vs Antigravity

**Fecha:** 5 de Febrero 2026  
**Proyecto:** Kakebo AI

---

## Resumen Ejecutivo

Este documento define cuándo es mejor trabajar con **Claude Code (Cursor)** o con **Antigravity** para maximizar la productividad en el desarrollo.

---

## Cuándo Usar CLAUDE CODE (Cursor)

### ✅ **Ideal para:**

1. **Ediciones puntuales y rápidas** (1-3 archivos)
   - Ejemplo: "Arregla este bug en esta función específica"
   - Razón: El inline editing de Cursor es más rápido y fluido para cambios pequeños

2. **Refactorización de código existente**
   - Ejemplo: "Renombra esta variable en todo el archivo", "Extrae esta lógica a una función"
   - Razón: Cursor ve el contexto del archivo completo y puede sugerir cambios en tiempo real

3. **Cuando YA sabes qué archivo modificar**
   - Ejemplo: Estás mirando `AIChat.tsx` y necesitas añadir una feature pequeña
   - Razón: No necesitas búsqueda global; Cursor es más directo

4. **Debugging interactivo**
   - Ejemplo: Tienes un error de TypeScript y necesitas iterar rápido
   - Razón: Puedes ver los errores en el editor mientras Code sugiere fixes

5. **Autocomplete y snippets**
   - Ejemplo: Escribir componentes React nuevos siguiendo patrones existentes
   - Razón: El autocomplete de Cursor aprende de tu código

### Casos prácticos:
- Añadir validación a un campo en un formulario
- Cambiar estilos CSS/Tailwind en un componente
- Renombrar una función y actualizar sus usos
- Ajustar tipos TypeScript
- Iterar en UI (botones, layouts, animaciones)

---

## Cuándo Usar ANTIGRAVITY

### ✅ **Ideal para:**

1. **Tareas multi-archivo** (4+ archivos)
   - Ejemplo: "Implementa un sistema de autenticación completo" (hooks, componentes, API, tipos)
   - Razón: Puede crear/editar múltiples archivos en paralelo y mantener coherencia

2. **Planificación y arquitectura**
   - Ejemplo: "Diseña la estructura de datos para un sistema de notificaciones"
   - Razón: Tiene modo PLANNING dedicado que genera artifacts antes de escribir código

3. **Tareas que requieren investigación**
   - Ejemplo: "Analiza el código existente y dime cómo integrar X librería"
   - Razón: Puede usar `grep_search`, `view_file_outline`, leer docs, etc.

4. **Automatización completa** (build, test, deploy)
   - Ejemplo: "Implementa esta feature y asegúrate de que el build pase"
   - Razón: Ejecuta `npm run build`, ve errores, corrige, y lo valida automáticamente

5. **Cuando NO sabes dónde está el código relevante**
   - Ejemplo: "Hay un bug en la autenticación, encuéntralo"
   - Razón: Puede buscar en todo el proyecto y explorar la estructura

6. **Documentación y handoffs**
   - Ejemplo: Generar reportes de contexto, actualizar README, crear documentación técnica
   - Razón: Genera artifacts, actualiza docs, mantiene historia

7. **Features end-to-end**
   - Ejemplo: "Implementa el chat completo desde cero"
   - Razón: Coordina frontend + backend + navegación + tests + docs

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
