# Agent System Quick Start Guide

## What Is This?

A multi-agent financial analysis system powered by LangGraph. Users ask questions in Spanish, and the system:

1. **Classifies** their intent (spending analysis, budget check, etc.)
2. **Executes** relevant analysis tools
3. **Synthesizes** a natural language response

---

## Using the Agent API

### Basic Request

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto he gastado?"
  }'
```

### With Conversation History

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Y en comida?",
    "history": [
      {
        "role": "user",
        "content": "¿Cuánto he gastado?"
      },
      {
        "role": "assistant",
        "content": "Has gastado €500 este mes."
      }
    ]
  }'
```

### Response Format

```json
{
  "success": true,
  "data": {
    "message": "Este mes has gastado €350 en comida.",
    "intent": "analyze_spending",
    "toolsUsed": ["analyzeSpendingPattern"],
    "metrics": {
      "model": "gpt-4o-mini",
      "latencyMs": 1234,
      "inputTokens": 45,
      "outputTokens": 120,
      "costUsd": 0.003,
      "toolCalls": 1
    }
  }
}
```

---

## Supported Intents

| Intent | Example | Tools Used |
|--------|---------|-----------|
| **analyze_spending** | "¿Cuánto en comida?" | analyzeSpendingPattern |
| **check_budget** | "¿Cómo va mi presupuesto?" | getBudgetStatus |
| **detect_anomalies** | "Detecta gastos raros" | detectAnomalies |
| **predict_spending** | "¿Cuánto gastaré?" | predictMonthlySpending |
| **view_trends** | "Muestra tendencias" | getSpendingTrends |
| **general_question** | "¿Qué es un presupuesto?" | None |

---

## File Architecture

### Core Files

**State & Types:**
- `src/lib/agents/state.ts` - AgentState interface & types

**Workflow:**
- `src/lib/agents/graph.ts` - LangGraph orchestration
- `src/lib/agents/prompts.ts` - LLM prompts

**Nodes:**
- `src/lib/agents/nodes/router.ts` - Intent classification
- `src/lib/agents/nodes/tools.ts` - Tool execution
- `src/lib/agents/nodes/synthesizer.ts` - Response generation

**API:**
- `src/lib/agents/index.ts` - Public function
- `src/app/api/ai/agent/route.ts` - HTTP endpoint

### Tests

- `src/__tests__/agents/nodes/*.test.ts` - Unit tests
- `src/__tests__/agents/graph.test.ts` - Integration tests
- `src/__tests__/api/ai/agent.test.ts` - API tests

---

## How The System Works

```
User Query
    ↓
┌─────────────────┐
│  ROUTER NODE    │  Classifies intent
│  Selects tools  │  Map: intent → tools
└────────┬────────┘
         ↓
   ┌─────────────────────────────┐
   │ Are tools needed?           │
   │ YES ↓         NO ↓           │
   └──────────────────────────────┘
      ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│ TOOL NODE        │  │ SYNTHESIZER NODE │
│ Extract params   │  │ Direct response  │
│ Execute tools    │  │ General answer   │
│ Aggregate results│  └────────┬─────────┘
└────────┬─────────┘           │
         ↓                      ↓
         └──────────┬───────────┘
                    ↓
          ┌──────────────────────┐
          │ SYNTHESIZER NODE     │
          │ Synthesize response  │
          │ Format as natural    │
          │ language (Spanish)   │
          └──────────┬───────────┘
                     ↓
                Natural Language
                Response in Spanish
```

---

## Key Concepts

### IntentType
Classifies what the user wants:
```typescript
type IntentType =
  | "analyze_spending"
  | "check_budget"
  | "detect_anomalies"
  | "predict_spending"
  | "view_trends"
  | "general_question"
  | "unclear"
```

### AgentState
Flows through the graph, updated by each node:
```typescript
{
  messages: [],              // Conversation history
  userMessage: "...",        // Current input
  userId: "user-123",        // Auth context
  intent: null,              // Set by Router
  toolsToCall: [],           // Set by Router
  toolResults: {},           // Set by Tools
  finalResponse: null,       // Set by Synthesizer
  metrics: {...}             // Execution metrics
}
```

---

## Development

### Run Tests
```bash
npm test src/__tests__/agents/
```

### Build
```bash
npm run build
```

### Type Check
```bash
npx tsc --noEmit
```

---

## Configuration

### Environment Variables
Required in `.env.local`:
```
OPENAI_API_KEY=sk-...
```

### Model
Currently uses: **gpt-4o-mini** (fast, cheap)

Cost: ~$0.003 per request

---

## Error Handling

The system gracefully handles:
- ❌ OpenAI API failures → Default response
- ❌ Tool execution failures → Partial results used
- ❌ Intent classification failures → Fallback to keywords
- ❌ Empty tool results → Informative error message

---

## Performance

| Operation | Time |
|-----------|------|
| Intent Classification | 200-400ms |
| Tool Execution | 500-800ms |
| Response Synthesis | 200-400ms |
| Total (typical) | 1-2 seconds |

---

## Adding New Tools

1. Implement tool function in `src/lib/agents/tools/`
2. Export from `src/lib/agents/tools/index.ts`
3. Add case to `executeAnalysisTool()` in `nodes/tools.ts`
4. Update `mapIntentToTools()` in `nodes/router.ts`
5. Add intent type if needed
6. Update prompts in `prompts.ts`
7. Add tests

---

## Adding New Intent Types

1. Add to `IntentType` in `state.ts`
2. Add classification example to `getIntentClassificationPrompt()` in `prompts.ts`
3. Add mapping in `mapIntentToTools()` in `nodes/router.ts`
4. Add fallback keywords in `fallbackClassifyIntent()` in `nodes/router.ts`
5. Add test cases

---

## Debugging

### Enable Verbose Logging
```typescript
// In any node
apiLogger.debug({ ...context }, "Your message");
```

### Check Metrics
Response includes execution metrics:
```json
"metrics": {
  "latencyMs": 1234,
  "costUsd": 0.003,
  "toolCalls": 1
}
```

### Test Intent Classification
```bash
# Send query that triggers interest
curl -X POST ... -d '{"message": "¿Cuánto he gastado?"}'
```

Check response for `intent` field.

---

## Common Issues

### Issue: Intent not classified correctly
**Solution:** Update keywords in `fallbackClassifyIntent()` or adjust prompts

### Issue: Tool parameters not extracted
**Solution:** Provide default parameters in `getDefaultParams()`

### Issue: Response not in Spanish
**Solution:** Update system prompt temperature or force Spanish in prompt

---

## API Endpoints

### `POST /api/ai/agent`
Process user message through agent

**Request:**
```json
{
  "message": "string (1-1000 chars)",
  "history": [{"role": "user"|"assistant", "content": "string"}]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "string",
    "intent": "IntentType",
    "toolsUsed": ["string"],
    "metrics": {...}
  }
}
```

**Errors:**
- 401: Not authenticated
- 422: Validation error
- 500: Server error

### `GET /api/ai/agent`
Health check

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "capabilities": ["analyze_spending", ...],
    "model": "gpt-4o-mini"
  }
}
```

---

## Next Steps

1. ✅ Test with real OPENAI_API_KEY
2. ⬜ Add conversation persistence
3. ⬜ Build chat UI
4. ⬜ Add more analysis tools
5. ⬜ Performance optimization
6. ⬜ Analytics dashboard

---

For detailed architecture, see: `IMPLEMENTATION_SUMMARY_PHASE4.md`
