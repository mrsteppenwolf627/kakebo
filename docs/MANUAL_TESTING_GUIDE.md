# 🧪 Guía de Testing Manual - KakeBot v2

**Versión:** 2.0.0
**Fecha:** 2026-02-09
**Tiempo estimado:** 60-90 minutos
**Objetivo:** Validar KakeBot v2 antes de rollout a producción

---

## 📋 Tabla de Contenidos

1. [Setup Inicial](#setup-inicial)
2. [Plan de Testing](#plan-de-testing)
3. [Métricas a Monitorear](#métricas-a-monitorear)
4. [Criterios de Aprobación](#criterios-de-aprobación)
5. [Template de Reporte](#template-de-reporte)

---

## 🔧 Setup Inicial

### Prepara el Entorno

**Endpoint a probar:**
- **Staging:** `https://staging.kakebo.app/api/ai/agent-v2`
- **Local:** `http://localhost:3000/api/ai/agent-v2`

**Herramientas necesarias:**
- Postman, Insomnia, curl, o la UI del app
- Acceso a logs del servidor
- 3 usuarios de prueba (ver abajo)

---

### Crea Usuarios de Prueba

| Usuario | Perfil | Datos | Propósito |
|---------|--------|-------|-----------|
| **Usuario A** | Nuevo | 0 gastos, 0 días | Validar poor data quality |
| **Usuario B** | Intermedio | 10 gastos, 5 días | Validar fair data quality |
| **Usuario C** | Establecido | 100+ gastos, 90+ días | Validar excellent data quality |

**Cómo crear:**
1. Registra 3 cuentas diferentes
2. Usuario A: No agregues gastos
3. Usuario B: Agrega 10 gastos en los últimos 5 días
4. Usuario C: Agrega 100+ gastos distribuidos en 90+ días

---

### Formato de Request

Todas las pruebas usan este formato:

```bash
curl -X POST [ENDPOINT] \
  -H "Authorization: Bearer [SESSION_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tu pregunta aquí",
    "history": []
  }'
```

**Obtener SESSION_TOKEN:**
```javascript
// En consola del navegador (con sesión iniciada)
const session = await supabase.auth.getSession()
console.log(session.data.session.access_token)
```

---

## 🎯 Plan de Testing

### FASE 1: Funcionalidad Básica (15 min)

#### ✅ Test 1.1: Pregunta Simple

**Query:**
```json
{
  "message": "¿Cuánto he gastado este mes?",
  "history": []
}
```

**Verificar:**
- [ ] Responde en < 3 segundos
- [ ] Menciona el período ("este mes")
- [ ] Menciona cantidad de transacciones ("basado en X transacciones")
- [ ] Menciona fechas ("del 1 al 9 de febrero")
- [ ] Si no hay gastos: NO inventa datos, reconoce ausencia

**Respuesta esperada (con datos):**
```
"Has gastado €450 en total este mes (basado en 12 transacciones
del 1 al 9 de febrero)."
```

**Respuesta esperada (sin datos):**
```
"Aún no has registrado gastos este mes. Para empezar, registra
tus primeros gastos..."
```

---

#### ✅ Test 1.2: Pregunta por Categoría

**Query:**
```json
{
  "message": "¿Cuánto he gastado en comida?"
}
```

**Verificar:**
- [ ] Llama tool `analyzeSpendingPattern`
- [ ] Parámetro correcto: `category: "survival"` (comida = supervivencia)
- [ ] Respuesta coherente con datos reales
- [ ] Menciona subcategorías si hay (supermercado, alimentación)

**En logs buscar:**
```json
{
  "toolsUsed": ["analyzeSpendingPattern"],
  "arguments": {
    "category": "survival",
    "period": "current_month"
  }
}
```

---

#### ✅ Test 1.3: Pregunta por Período

**Query:**
```json
{
  "message": "Gastos de la semana pasada"
}
```

**Verificar:**
- [ ] Parámetro correcto: `period: "last_week"`
- [ ] Solo cuenta gastos de esa semana específica
- [ ] Menciona fechas exactas de inicio y fin de semana

---

### FASE 2: Semantic Mapping (10 min)

Verifica que el bot entiende lenguaje natural español.

#### ✅ Test 2.1: Sinónimos de Categorías

**SUPERVIVENCIA (survival):**
```json
"¿Cuánto he gastado en comida?"
"¿Cuánto he gastado en alimentación?"
"¿Cuánto he gastado en el supermercado?"
"Gastos de supermercado"
```

**OPCIONAL (optional):**
```json
"¿Cuánto he gastado en ocio?"
"¿Cuánto he gastado en entretenimiento?"
"Gastos de restaurantes"
"¿Cuánto he gastado saliendo?"
```

**CULTURA (culture):**
```json
"¿Cuánto he gastado en libros?"
"Gastos de educación"
"¿Cuánto he gastado en cursos?"
```

**EXTRA (extra):**
```json
"Gastos varios"
"Otros gastos"
```

**Verificar:**
- [ ] Todas mapean a la categoría técnica correcta
- [ ] No hay confusión entre categorías
- [ ] Respuestas coherentes en todos los casos

---

#### ✅ Test 2.2: Sinónimos de Períodos

**Prueba estas variantes:**

| Query Natural | Parámetro Esperado |
|---------------|-------------------|
| "este mes" | `period: "current_month"` |
| "el mes actual" | `period: "current_month"` |
| "esta semana" | `period: "current_week"` |
| "la semana pasada" | `period: "last_week"` |
| "el mes pasado" | `period: "last_month"` |
| "últimos 3 meses" | `period: "last_3_months"` |

**Verificar:**
- [ ] Período correcto en cada caso
- [ ] Fechas coherentes con el período solicitado

---

### FASE 3: Multi-Tool Calls (10 min)

#### ✅ Test 3.1: Dos Tools Complementarias

**Query:**
```json
{
  "message": "¿Cómo va mi presupuesto y cuánto voy a gastar este mes?"
}
```

**Verificar:**
- [ ] Llama `getBudgetStatus` + `predictMonthlySpending`
- [ ] Respuesta integra ambos resultados coherentemente
- [ ] Coherencia: predicción vs presupuesto disponible

**En logs buscar:**
```json
{
  "toolsUsed": ["getBudgetStatus", "predictMonthlySpending"],
  "toolCalls": 2
}
```

---

#### ✅ Test 3.2: Análisis Completo

**Query:**
```json
{
  "message": "Dame un análisis completo de mis finanzas"
}
```

**Verificar:**
- [ ] Llama **máximo 3 tools** (límite funcionando)
- [ ] Tools relevantes (ej: budget, spending, anomalies)
- [ ] Respuesta coherente y bien estructurada
- [ ] No spam de tools innecesarias

**En logs buscar:**
```json
{
  "toolsUsed": [...],  // Máximo 3 elementos
  "toolCalls": 3       // O menos
}
```

---

#### ✅ Test 3.3: Combinación Prohibida (Redundancia)

**Query:**
```json
{
  "message": "¿Cuánto voy a gastar este mes y cuál es la tendencia?"
}
```

**Verificar:**
- [ ] NO llama ambas `predictMonthlySpending` + `getSpendingTrends` (redundante)
- [ ] Elige solo UNA de las dos (la más relevante)
- [ ] En logs: "Removed redundant tool" o similar

**En logs buscar:**
```json
{
  "warning": "predictMonthlySpending and getSpendingTrends are redundant"
}
```

---

### FASE 4: User Context Adaptation (15 min)

#### ✅ Test 4.1: Usuario Nuevo (Usuario A - 0 gastos)

**Login como Usuario A**

**Query 1: Anomalías**
```json
{
  "message": "¿Tengo gastos raros?"
}
```

**Verificar:**
- [ ] NO llama `detectAnomalies` (requiere 30+ días)
- [ ] Responde: "Como empezaste hace poco, aún no tengo suficiente histórico"
- [ ] Sugiere registrar más gastos para análisis futuros

**Query 2: Tendencias**
```json
{
  "message": "¿Cuál es la tendencia de mis gastos?"
}
```

**Verificar:**
- [ ] NO llama `getSpendingTrends` (requiere 60+ días)
- [ ] Reconoce limitación explícitamente
- [ ] No inventa tendencias

---

#### ✅ Test 4.2: Usuario Datos Limitados (Usuario B - 5 días, 10 gastos)

**Login como Usuario B**

**Query 1: Spending**
```json
{
  "message": "¿Cuánto he gastado en comida?"
}
```

**Verificar:**
- [ ] SÍ llama `analyzeSpendingPattern` (no requiere mucho histórico)
- [ ] Respuesta incluye disclaimer: "histórico limitado"
- [ ] Menciona cantidad pequeña de datos disponibles

**Query 2: Anomalías**
```json
{
  "message": "¿Hay anomalías en mis gastos?"
}
```

**Verificar:**
- [ ] NO llama `detectAnomalies` (< 30 días)
- [ ] Explica necesidad de más histórico
- [ ] Mensaje educativo sobre qué esperar

---

#### ✅ Test 4.3: Usuario Establecido (Usuario C - 90+ días, 100+ gastos)

**Login como Usuario C**

**Query 1: Anomalías**
```json
{
  "message": "¿Tengo gastos raros este mes?"
}
```

**Verificar:**
- [ ] SÍ llama `detectAnomalies`
- [ ] Detecta anomalías reales (si las hay)
- [ ] No hay disclaimers de datos insuficientes
- [ ] Análisis completo y detallado

**Query 2: Tendencias**
```json
{
  "message": "¿Cómo evolucionan mis gastos en los últimos meses?"
}
```

**Verificar:**
- [ ] SÍ llama `getSpendingTrends`
- [ ] Análisis de tendencias completo
- [ ] Menciona dirección (aumentando/disminuyendo/estable)
- [ ] Porcentajes de cambio

---

### FASE 5: Error Handling (10 min)

#### ✅ Test 5.1: Sin Datos (Not Found)

**Query:**
```json
{
  "message": "¿Cuánto he gastado en cultura este mes?"
}
```
_Con usuario que NO tiene gastos en cultura_

**Verificar:**
- [ ] Responde: "No encontré gastos en cultura este mes"
- [ ] NO inventa datos
- [ ] Sugiere empezar a registrar gastos en esa categoría
- [ ] Tono constructivo y útil

---

#### ✅ Test 5.2: Database Error

**Cómo simular:**
- Opción 1: Desconecta temporalmente Supabase
- Opción 2: Usa un token de sesión inválido/expirado
- Opción 3: Apaga el servidor de base de datos

**Query cualquiera:**
```json
{
  "message": "¿Cuánto he gastado?"
}
```

**Verificar:**
- [ ] NO crashea la aplicación
- [ ] Mensaje user-friendly: "No pude acceder a tu información en este momento..."
- [ ] NO inventa datos
- [ ] Sugiere intentar de nuevo
- [ ] En logs: `_errorType: "database"`

**Respuesta esperada:**
```
"Lo siento, no pude acceder a tu información en este momento
debido a un problema técnico. Por favor, inténtalo de nuevo
en unos momentos."
```

---

#### ✅ Test 5.3: Validation Error (Datos Corruptos)

**Cómo simular:**
1. Inserta manualmente en DB: `amount: -100` (negativo)
2. O inserta: `category: "invalid_category"`
3. O inserta: fechas inconsistentes

**Query:**
```json
{
  "message": "¿Cuánto he gastado este mes?"
}
```

**Verificar:**
- [ ] Validator detecta inconsistencia
- [ ] Responde: "Los datos no se pudieron procesar correctamente"
- [ ] NO usa datos corruptos en la respuesta
- [ ] En logs: `_errorType: "validation"`
- [ ] En logs: detalles del error de validación

---

### FASE 6: Conversaciones Multi-Turn (10 min)

#### ✅ Test 6.1: Contexto de Conversación

**Turn 1:**
```json
{
  "message": "¿Cuánto he gastado este mes?",
  "history": []
}
```

**Respuesta esperada:**
```
"Has gastado €450 en total este mes (basado en 12 transacciones)."
```

**Turn 2:**
```json
{
  "message": "¿Y en comida?",
  "history": [
    {
      "role": "user",
      "content": "¿Cuánto he gastado este mes?"
    },
    {
      "role": "assistant",
      "content": "Has gastado €450 en total este mes (basado en 12 transacciones)."
    }
  ]
}
```

**Verificar:**
- [ ] Entiende "comida" en el contexto del mes actual
- [ ] NO pregunta "¿qué período?"
- [ ] Respuesta coherente: comida <= €450 total
- [ ] Mantiene el contexto temporal

---

#### ✅ Test 6.2: Cambio de Tema

**Turn 1:**
```json
{
  "message": "¿Cuánto he gastado en ocio este mes?"
}
```

**Turn 2:**
```json
{
  "message": "¿Y mi presupuesto de supervivencia?",
  "history": [
    {"role": "user", "content": "¿Cuánto he gastado en ocio este mes?"},
    {"role": "assistant", "content": "Has gastado €120 en opcional (ocio) este mes..."}
  ]
}
```

**Verificar:**
- [ ] Cambia de categoría correctamente (ocio → supervivencia)
- [ ] NO mezcla datos de ocio con supervivencia
- [ ] Responde sobre presupuesto (no gasto)

---

### FASE 7: Edge Cases (10 min)

#### ✅ Test 7.1: Pregunta Ambigua

**Query:**
```json
{
  "message": "Dime todo"
}
```

**Verificar:**
- [ ] Responde algo útil (resumen general)
- [ ] Llama máximo 3 tools
- [ ] No crashea
- [ ] Tono útil y constructivo

---

#### ✅ Test 7.2: Pregunta Fuera de Alcance

**Query:**
```json
{
  "message": "¿Debería invertir en bolsa o en criptomonedas?"
}
```

**Verificar:**
- [ ] NO da consejos de inversión
- [ ] Responde educadamente que está fuera de alcance
- [ ] Redirige a lo que SÍ puede hacer (analizar gastos)
- [ ] Tono profesional

**Respuesta esperada:**
```
"No puedo darte consejos de inversión. Mi función es ayudarte
a analizar tus gastos y presupuestos. ¿Quieres que revisemos
cómo van tus finanzas este mes?"
```

---

#### ✅ Test 7.3: Input Vacío o Extraño

**Queries:**
```json
{"message": ""}
{"message": "asdfasdf"}
{"message": "🍕🍕🍕"}
{"message": "aaaaaaaaaaaaaaaaaa"}
```

**Verificar:**
- [ ] Maneja gracefully (no crash)
- [ ] Pide aclaración o ignora
- [ ] No genera respuestas sin sentido

---

## 📊 Métricas a Monitorear

Durante TODOS los tests, monitorea estas métricas:

### Performance

| Métrica | Target | Cómo medir |
|---------|--------|------------|
| **Latencia promedio** | < 2s | Tiempo de respuesta de cada query |
| **Latencia p95** | < 2.5s | 95% de queries bajo este tiempo |
| **Latencia máxima** | < 5s | Ninguna query debe exceder esto |
| **Cache hit rate** | ~80% | En queries repetidas del mismo usuario |

**Cómo verificar latencia:**
```bash
# En logs
grep "latencyMs" logs.json | jq '.latencyMs' | sort -n

# p95 (línea 95 de 100)
grep "latencyMs" logs.json | jq '.latencyMs' | sort -n | tail -5
```

---

### Correctness

| Métrica | Target | Qué verificar |
|---------|--------|---------------|
| **Hallucinations** | 0% | Datos inventados cuando no hay info |
| **Transparency** | 100% | Siempre menciona período + cantidad |
| **Temporal coherence** | 100% | Fechas y períodos correctos |
| **Numerical consistency** | 100% | Totales = suma de subtotales |

**Red flags:**
- ❌ Bot dice "€500" pero solo hay €300 en DB
- ❌ Dice "este mes" pero muestra datos del mes pasado
- ❌ Responde sin mencionar cuántos datos usa
- ❌ Inventa tendencias con 2 días de datos

---

### Cost Control

| Métrica | Target | Qué verificar |
|---------|--------|---------------|
| **Avg tools per query** | < 2.0 | Promedio de tools llamadas |
| **Max tools** | = 3 | Nunca más de 3 tools por query |
| **Cost per query** | ~$0.0003 | Coste de tokens |

**Cómo verificar:**
```bash
# Promedio de tools
grep "toolCalls" logs.json | jq '.toolCalls' | awk '{sum+=$1; n++} END {print sum/n}'

# Queries con más de 3 tools (debería ser 0)
grep "toolCalls" logs.json | jq 'select(.toolCalls > 3)'
```

---

### Error Handling

| Métrica | Target | Qué verificar |
|---------|--------|---------------|
| **Error rate** | < 1% | En condiciones normales |
| **User-friendly messages** | 100% | No stacktraces al usuario |
| **Silent failures** | 0% | Siempre informa errores |
| **Error recovery** | 100% | No crashes, siempre responde |

**Distribución esperada de errores:**
```
database: < 0.5%
validation: < 0.1%
not_found: Variable (normal para algunos usuarios)
permission: ~0%
unknown: < 0.5%
```

---

## 🚨 Red Flags - Detén Rollout Si Ves Esto

| 🚩 Red Flag | Severidad | Acción Inmediata |
|-------------|-----------|------------------|
| **Error rate > 2%** | CRÍTICO | STOP - Investiga tipo de errores |
| **Latencia p95 > 3s** | CRÍTICO | STOP - Revisa DB queries |
| **Bot inventa datos** | CRÍTICO | STOP - Bug de hallucination |
| **Crash en algún test** | CRÍTICO | STOP - Bug de estabilidad |
| **> 3 tools por query** | CRÍTICO | STOP - Límite no funciona |
| **Stacktrace visible al usuario** | ALTO | FIX - Error handling roto |
| **Cost per query > $0.001** | MEDIO | WARNING - Optimizar |
| **Respuestas sin transparencia** | MEDIO | WARNING - Revisar prompt |

**Si encuentras un Red Flag:**
1. 🛑 Detén el testing
2. 📸 Captura evidencia (logs, screenshots)
3. 📝 Documenta el issue detalladamente
4. 🔧 Crea fix en desarrollo
5. ✅ Re-testea antes de continuar

---

## ✅ Criterios de Aprobación

Para aprobar el rollout a producción, necesitas:

### Funcional (100% requerido)

- [ ] **Todos los tests básicos** pasando (Fase 1)
- [ ] **Semantic mapping** funciona en TODOS los casos (Fase 2)
- [ ] **Multi-tool** funciona correctamente (Fase 3)
- [ ] **User adaptation** funciona según data quality (Fase 4)
- [ ] **Error handling** robusto en todos los escenarios (Fase 5)
- [ ] **Multi-turn** mantiene contexto (Fase 6)
- [ ] **Edge cases** manejados gracefully (Fase 7)

### Performance

- [ ] **Latencia p95 < 2.5s**
- [ ] **Error rate < 1%** (en operación normal)
- [ ] **Cost per query < $0.0005**
- [ ] **Cache hit rate ~80%** (en queries repetidas)

### Calidad

- [ ] **0% hallucinations** detectadas
- [ ] **100% transparency** en respuestas con datos
- [ ] **Error handling** sin crashes
- [ ] **User-friendly messages** en todos los errores

### Documentación

- [ ] Issues encontrados documentados
- [ ] Métricas registradas
- [ ] Reporte de testing completo

---

## 📝 Template de Reporte

Copia esto y llénalo después del testing:

```markdown
# Reporte de Testing Manual - KakeBot v2

**Fecha:** [FECHA]
**Tester:** [TU NOMBRE]
**Endpoint:** [URL]
**Duración:** [TIEMPO]

---

## ✅ Resultados por Fase

### FASE 1: Funcionalidad Básica
- [ ] Test 1.1: Pregunta simple - ✅ PASS / ❌ FAIL
- [ ] Test 1.2: Por categoría - ✅ PASS / ❌ FAIL
- [ ] Test 1.3: Por período - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 2: Semantic Mapping
- [ ] Test 2.1: Sinónimos categorías - ✅ PASS / ❌ FAIL
- [ ] Test 2.2: Sinónimos períodos - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 3: Multi-Tool
- [ ] Test 3.1: Dos tools complementarias - ✅ PASS / ❌ FAIL
- [ ] Test 3.2: Análisis completo - ✅ PASS / ❌ FAIL
- [ ] Test 3.3: Combinación prohibida - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 4: User Adaptation
- [ ] Test 4.1: Usuario nuevo - ✅ PASS / ❌ FAIL
- [ ] Test 4.2: Datos limitados - ✅ PASS / ❌ FAIL
- [ ] Test 4.3: Usuario establecido - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 5: Error Handling
- [ ] Test 5.1: Sin datos (not_found) - ✅ PASS / ❌ FAIL
- [ ] Test 5.2: Database error - ✅ PASS / ❌ FAIL
- [ ] Test 5.3: Validation error - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 6: Multi-Turn
- [ ] Test 6.1: Contexto conversación - ✅ PASS / ❌ FAIL
- [ ] Test 6.2: Cambio de tema - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

### FASE 7: Edge Cases
- [ ] Test 7.1: Pregunta ambigua - ✅ PASS / ❌ FAIL
- [ ] Test 7.2: Fuera de alcance - ✅ PASS / ❌ FAIL
- [ ] Test 7.3: Input extraño - ✅ PASS / ❌ FAIL

**Notas:** _[Agregar observaciones]_

---

## 📊 Métricas Observadas

### Performance
- **Latencia promedio:** _____ ms
- **Latencia p95:** _____ ms
- **Latencia máxima:** _____ ms
- **Queries totales:** _____

### Correctness
- **Hallucinations detectadas:** _____ (debería ser 0)
- **Respuestas sin transparencia:** _____ (debería ser 0)
- **Inconsistencias numéricas:** _____ (debería ser 0)

### Cost & Efficiency
- **Avg tools per query:** _____ (target < 2.0)
- **Max tools observado:** _____ (debería ser 3)
- **Cost per query promedio:** $_____ (target ~$0.0003)

### Errors
- **Error rate:** _____% (target < 1%)
- **Database errors:** _____
- **Validation errors:** _____
- **Not found errors:** _____
- **Unknown errors:** _____

---

## 🐛 Issues Encontrados

### Issue #1: [Título]
- **Severidad:** CRÍTICO / ALTO / MEDIO / BAJO
- **Fase:** [Número de fase]
- **Test:** [Número de test]
- **Descripción:** [Qué pasó]
- **Reproducción:** [Cómo replicarlo]
- **Evidencia:** [Screenshots, logs]

### Issue #2: [Título]
_[Repetir estructura]_

---

## 🎯 Decisión Final

- [ ] ✅ **APROBAR** - Listo para producción
- [ ] ⚠️ **APROBAR CON WARNINGS** - Listo pero con observaciones
- [ ] ❌ **RECHAZAR** - Requiere fixes antes de producción

**Justificación:**
_[Explicar decisión]_

---

## 📋 Próximos Pasos

**Si APROBAR:**
1. [ ] Iniciar canary rollout (10%)
2. [ ] Monitorear 2-3 días
3. [ ] Ramp to 50%
4. [ ] Monitorear 3-5 días
5. [ ] Full rollout (100%)

**Si RECHAZAR:**
1. [ ] Crear issues en GitHub/Jira
2. [ ] Asignar prioridades
3. [ ] Implementar fixes
4. [ ] Re-testear
5. [ ] Nuevo reporte de testing

---

**Firma:** [TU NOMBRE]
**Fecha:** [FECHA]
```

---

## 🔍 Comandos Útiles para Análisis de Logs

### Ver Tool Calls
```bash
# Todas las tools llamadas
grep "toolsUsed" logs.json | jq '.toolsUsed'

# Contar frecuencia de cada tool
grep "toolsUsed" logs.json | jq -r '.toolsUsed[]' | sort | uniq -c

# Buscar casos con > 3 tools (NO debería haber)
grep "toolsUsed" logs.json | jq 'select(.toolsUsed | length > 3)'
```

### Ver Errores
```bash
# Todos los errores por tipo
grep "_errorType" logs.json | jq -r '._errorType' | sort | uniq -c

# Errores de validación
grep "_errorType.*validation" logs.json | jq '.'

# Errores de database
grep "_errorType.*database" logs.json | jq '.'
```

### Ver Latencias
```bash
# p95 latency (toma 95% de las queries)
grep "latencyMs" logs.json | jq '.latencyMs' | sort -n | tail -n 5

# Queries lentas (> 3s)
grep "latencyMs" logs.json | jq 'select(.latencyMs > 3000)'

# Promedio de latencia
grep "latencyMs" logs.json | jq '.latencyMs' | awk '{sum+=$1; n++} END {print sum/n}'
```

### Ver Costes
```bash
# Coste promedio por query
grep "costUsd" logs.json | jq '.costUsd' | awk '{sum+=$1; n++} END {print sum/n}'

# Queries más caras
grep "costUsd" logs.json | jq 'select(.costUsd > 0.001)'
```

---

## 📞 Contactos y Recursos

**Documentación:**
- [Architecture Guide](KAKEBOT_V2_ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

**Soporte:**
- **Technical Issues:** [Email/Slack]
- **On-Call Engineer:** [Teléfono]
- **DevOps Lead:** [Contacto]

**Rollback Inmediato:**
```bash
# Si encuentras un bug crítico
USE_FUNCTION_CALLING_AGENT=false
# Esto devuelve tráfico a v1 en < 5 minutos
```

---

## ✅ Checklist Final

Antes de aprobar para producción:

- [ ] Todos los 21 tests completados
- [ ] 0 red flags críticos encontrados
- [ ] Métricas dentro de targets
- [ ] Reporte de testing documentado
- [ ] Issues (si hay) documentados y priorizados
- [ ] Equipo notificado de resultados
- [ ] Rollout plan confirmado

---

**¡Buena suerte con el testing!** 🚀

Si encuentras algún problema, documenta todo y consulta el [Deployment Guide](DEPLOYMENT_GUIDE.md) para troubleshooting.

---

**Versión:** 2.0.0
**Última actualización:** 2026-02-09
**Mantenido por:** AI Team @ Kakebo
