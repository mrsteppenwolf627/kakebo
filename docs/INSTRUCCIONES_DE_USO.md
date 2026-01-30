# 📦 INSTRUCCIONES DE USO - ARCHIVOS GENERADOS

**Fecha:** 2025-01-30
**Archivos generados:** 4
**Propósito:** Sistema de gestión de contexto para proyecto Kakebo AI

---

## ✅ PASO 1: CREAR CLAUDE PROJECT

### Ir a Claude.ai:

1. Menú lateral → "Projects"
2. Click "Create Project"
3. Nombre: **Kakebo AI Professional**

### Agregar archivos de conocimiento:

En la sección "Project knowledge", sube estos archivos:
- `CONTEXT.md` (este contiene el estado global)
- `claude_project_rules.md` (las reglas del proyecto)
- Tu `Plan_Estudios_AI_Systems_Kakebo.pdf` (el plan original)

### Custom Instructions:

Copia TODO el contenido de `claude_project_rules.md` y pégalo en "Custom Instructions" del proyecto.

---

## 📁 PASO 2: ORGANIZAR ARCHIVOS EN TU REPOSITORIO

### Estructura recomendada:

```
kakebo-ai-professional/
│
├── .ai/                                    ← CREAR esta carpeta
│   ├── CONTEXT.md                         ← Poner aquí
│   ├── CURRENT_TASK.md                    ← Poner aquí
│   └── prompts/
│       └── claude_project_rules.md        ← Poner aquí
│
├── docs/
│   ├── SESSION_LOGS/
│   │   └── 2025-01-30_session.md         ← Poner aquí
│   ├── PLAN_COMPLETO.pdf                  (ya lo tienes)
│   ├── ARCHITECTURE.md                    (crear después)
│   ├── CODE_ANALYSIS.md                   (crear después)
│   └── DECISIONS.md                       (crear después)
│
├── src/                                    (tu código)
├── README.md
└── ...
```

### Comandos para crear la estructura:

```bash
# Desde la raíz de tu proyecto:
mkdir -p .ai/prompts
mkdir -p docs/SESSION_LOGS

# Mover archivos descargados:
mv claude_project_rules.md .ai/prompts/
mv CONTEXT.md .ai/
mv CURRENT_TASK.md .ai/
mv 2025-01-30_session.md docs/SESSION_LOGS/
```

---

## 🚀 PASO 3: CÓMO USAR ESTO EN CADA SESIÓN

### ESCENARIO A: Chat nuevo con Claude (en el proyecto)

1. Claude automáticamente leerá los archivos del proyecto
2. Al inicio de cada chat, Claude te pedirá:
   - Ver `.ai/CONTEXT.md`
   - Ver `.ai/CURRENT_TASK.md`
3. Le muestras esos archivos
4. Claude resume dónde estabas
5. Continuáis trabajando

### ESCENARIO B: Rotación de LLM (Claude → ChatGPT → Gemini)

**Si trabajas con ChatGPT o Gemini:**

1. Al inicio del chat, di:
   ```
   "Estoy trabajando en proyecto Kakebo AI.
   Aquí está el contexto completo: [pega CONTEXT.md]
   Aquí está la tarea actual: [pega CURRENT_TASK.md]
   Último SESSION_LOG: [pega último log]
   
   Resume dónde estábamos y qué toca hacer."
   ```

2. El LLM leerá todo y retomará el trabajo

3. Al final de la sesión:
   - Actualiza CONTEXT.md (si cambió el progreso)
   - Actualiza CURRENT_TASK.md (si cambió la tarea)
   - Genera nuevo SESSION_LOG

---

## 📝 PASO 4: MANTENER ARCHIVOS ACTUALIZADOS

### Al final de CADA sesión de trabajo:

1. **CONTEXT.md:**
   - Marcar tareas completadas con [x]
   - Actualizar % de progreso
   - Añadir bloqueadores si los hay
   - Actualizar fecha de "Última actualización"

2. **CURRENT_TASK.md:**
   - Marcar checklist items completados
   - Si terminaste la tarea → crear nueva CURRENT_TASK
   - Añadir notas de la sesión al final

3. **SESSION_LOG:**
   - Generar nuevo archivo `YYYY-MM-DD_session.md`
   - Usar el template del log de hoy
   - Documentar qué se hizo, decidió, y qué sigue

---

## 🔄 FLUJO DE TRABAJO TÍPICO

### Inicio de sesión:

```
Tú: "Hola Claude, continuamos con Kakebo"

Claude: "Antes de empezar, necesito contexto.
         Muéstrame .ai/CONTEXT.md y .ai/CURRENT_TASK.md"

Tú: [Muestras archivos]

Claude: "Entendido. Estamos en Fase 1, trabajando en backend API.
         Completado 20%. Pendiente: implementar validación con Zod.
         ¿Continuamos con esto?"

Tú: "Sí" o "No, quiero hacer X"
```

### Durante trabajo:

- Claude te guía según la fase actual
- Toma decisiones técnicas
- Genera código
- Explica fundamentos

### Final de sesión:

```
Claude: "Sesión terminada. He actualizado:
         - CONTEXT.md (ahora 25% completado)
         - CURRENT_TASK.md (validación marcada como completa)
         - Generado SESSION_LOG del 2025-01-31
         
         Próxima sesión: Implementar error handling.
         ¿Quieres descargar los archivos actualizados?"
```

---

## 🎯 PRÓXIMOS PASOS (DESPUÉS DE SETUP)

### Cuando estés listo para continuar:

1. **Abre chat nuevo** en el proyecto Claude "Kakebo AI Professional"

2. **Claude te pedirá contexto** automáticamente

3. **Tú dices:** "Muéstrame CONTEXT.md y CURRENT_TASK.md"

4. **Claude resume** estado actual

5. **Tú dices:** "Quiero analizar el código de Kakebo"

6. **Claude pedirá:**
   - Estructura del proyecto (puede ser screenshot o `tree` command)
   - Archivos principales a revisar
   - Acceso al repo (GitHub link o compartir código)

7. **Claude analizará** y generará `docs/CODE_ANALYSIS.md`

---

## ❓ FAQ

### ¿Tengo que usar los 3 archivos siempre?

- **CONTEXT.md:** SÍ, siempre al inicio de chat
- **CURRENT_TASK.md:** SÍ, siempre al inicio de chat
- **SESSION_LOG:** Solo el último, para recordar sesión anterior

### ¿Qué pasa si olvido actualizar los archivos?

- Pierdes continuidad entre sesiones
- El próximo LLM no sabrá qué se hizo
- Tendrás que explicar todo de nuevo
- **Solución:** Siempre actualizar al final de sesión

### ¿Puedo usar esto con ChatGPT y Gemini?

SÍ, ese es el objetivo. Solo tienes que:
- Pegar el contenido de CONTEXT.md + CURRENT_TASK.md al inicio
- Ellos retoman el trabajo
- Al final, actualizan los archivos

### ¿Cada cuánto genero SESSION_LOG?

- **Ideal:** Cada sesión de trabajo (cada día)
- **Mínimo:** Cada semana
- **Obligatorio:** Cuando tomas decisiones arquitectónicas importantes

---

## 🚨 IMPORTANTE - NO OLVIDAR

1. ✅ Crear Claude Project con instrucciones
2. ✅ Organizar archivos en estructura .ai/
3. ✅ SIEMPRE mostrar CONTEXT + CURRENT_TASK al inicio
4. ✅ Actualizar archivos al final de sesión
5. ✅ Generar SESSION_LOG de cada sesión importante

---

## 💡 RESUMEN ULTRA-RÁPIDO

```bash
# Setup (una sola vez):
1. Crear Claude Project "Kakebo AI Professional"
2. Subir archivos al proyecto
3. Organizar en tu repo: .ai/CONTEXT.md, .ai/CURRENT_TASK.md, etc.

# Cada sesión:
1. Claude pide CONTEXT.md + CURRENT_TASK.md
2. Le muestras
3. Trabajáis
4. Al final: actualizas archivos + generas SESSION_LOG

# Listo!
```

---

**¿Dudas?** Pregunta en el próximo chat. Claude recordará este sistema y te ayudará a usarlo correctamente.

**Siguiente paso:** Cuando estés listo, di "quiero analizar el código de Kakebo" y arrancamos Fase 1. 🚀
