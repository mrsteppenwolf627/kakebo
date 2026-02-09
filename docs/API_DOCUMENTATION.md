# KakeBot v2 - API Documentation

**Version:** 2.0
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Request/Response Formats](#requestresponse-formats)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Examples](#examples)

---

## Overview

KakeBot v2 provides a conversational AI interface for financial analysis. Users can ask questions in natural language (Spanish) about their spending, budgets, and financial patterns.

**Base URL:** `https://kakebo.app/api/ai`

**Supported Languages:** Spanish (primary)

---

## Authentication

All API requests require a valid Supabase session token.

### Headers

```http
Authorization: Bearer <SESSION_TOKEN>
Content-Type: application/json
```

### Obtaining Session Token

```javascript
// Client-side (Next.js)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## Endpoints

### POST /api/ai/agent-v2

Primary endpoint for KakeBot v2 (OpenAI Function Calling).

**URL:** `/api/ai/agent-v2`

**Method:** `POST`

**Auth:** Required

**Request Body:**

```typescript
{
  message: string;           // User's question (Spanish)
  history?: Array<{          // Optional conversation history
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**Response:**

```typescript
{
  message: string;           // Bot's response
  toolsUsed: string[];       // Tools called (e.g., ["analyzeSpendingPattern"])
  metrics: {
    model: string;           // "gpt-4o-mini"
    latencyMs: number;       // Total request time
    inputTokens: number;     // Tokens in request
    outputTokens: number;    // Tokens in response
    totalTokens: number;     // Sum of input + output
    costUsd: number;         // Cost of this query
    toolCalls: number;       // Number of tools called
  };
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `401` - Unauthorized (invalid/missing token)
- `500` - Server error

---

### POST /api/ai/agent (Legacy)

Original endpoint using LangGraph (v1). Use `/agent-v2` instead.

**URL:** `/api/ai/agent`

**Method:** `POST`

**Note:** This endpoint will be deprecated after successful v2 rollout.

---

## Request/Response Formats

### Minimal Request

```json
{
  "message": "¿Cuánto he gastado este mes?"
}
```

### Request with History

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
      "content": "Has gastado €450 en total este mes (basado en 12 transacciones del 1 al 9 de febrero)."
    }
  ]
}
```

### Success Response

```json
{
  "message": "Has gastado €180 en supervivencia este mes (basado en 5 transacciones de comida y alimentación).",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": {
    "model": "gpt-4o-mini",
    "latencyMs": 1850,
    "inputTokens": 320,
    "outputTokens": 180,
    "totalTokens": 500,
    "costUsd": 0.00032,
    "toolCalls": 1
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token",
    "details": "Please provide a valid Supabase session token in Authorization header"
  }
}
```

---

## Error Handling

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHORIZED` | Invalid/missing token | Re-authenticate user |
| `INVALID_REQUEST` | Malformed request body | Check request format |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff |
| `INTERNAL_ERROR` | Server-side error | Retry with exponential backoff |
| `SERVICE_UNAVAILABLE` | Database/OpenAI down | Display maintenance message |

### Error Response Format

```typescript
{
  error: {
    code: string;           // Error code
    message: string;        // Human-readable message
    details?: string;       // Additional context (optional)
    timestamp: string;      // ISO 8601 timestamp
    requestId?: string;     // For support tracking
  }
}
```

### Client-Side Error Handling

```typescript
async function queryKakeBot(message: string) {
  try {
    const response = await fetch('/api/ai/agent-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          router.push('/login');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          // Show rate limit message
          toast.error('Demasiadas consultas. Espera un momento.');
          break;
        default:
          // Generic error
          toast.error('Error al procesar tu consulta. Inténtalo de nuevo.');
      }

      return null;
    }

    return await response.json();
  } catch (error) {
    // Network error
    toast.error('No se pudo conectar al servidor.');
    return null;
  }
}
```

---

## Rate Limits

### Current Limits

- **Per User:** 60 requests per minute
- **Per IP:** 100 requests per minute
- **Burst:** Up to 10 concurrent requests

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1644444444
```

### Exceeding Rate Limit

**Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": "You have exceeded 60 requests per minute. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

**Recommended Backoff:**
```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function queryWithRetry(message: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch('/api/ai/agent-v2', { ... });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await delay(parseInt(retryAfter) * 1000);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

---

## Examples

### Example 1: Simple Spending Query

**Request:**
```bash
curl -X POST https://kakebo.app/api/ai/agent-v2 \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto he gastado en comida este mes?"
  }'
```

**Response:**
```json
{
  "message": "Has gastado €180 en supervivencia este mes (basado en 5 transacciones: 2 del supermercado y 3 de alimentación, del 1 al 9 de febrero).",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": {
    "model": "gpt-4o-mini",
    "latencyMs": 1650,
    "inputTokens": 285,
    "outputTokens": 145,
    "totalTokens": 430,
    "costUsd": 0.00026,
    "toolCalls": 1
  }
}
```

---

### Example 2: Budget Status

**Request:**
```json
{
  "message": "¿Cómo va mi presupuesto?"
}
```

**Response:**
```json
{
  "message": "Este mes has gastado €450 de €600 presupuestados (75%). Te quedan €150 para los próximos 21 días. Vas bien encaminado: al ritmo actual gastarás €630, apenas €30 por encima del límite.",
  "toolsUsed": ["getBudgetStatus", "predictMonthlySpending"],
  "metrics": {
    "model": "gpt-4o-mini",
    "latencyMs": 2100,
    "inputTokens": 420,
    "outputTokens": 220,
    "totalTokens": 640,
    "costUsd": 0.00042,
    "toolCalls": 2
  }
}
```

---

### Example 3: Multi-Turn Conversation

**Turn 1:**
```json
{
  "message": "¿Cuánto he gastado este mes?",
  "history": []
}
```

**Response:**
```json
{
  "message": "Has gastado €450 en total este mes (basado en 12 transacciones del 1 al 9 de febrero).",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": { ... }
}
```

**Turn 2:**
```json
{
  "message": "¿Y en ocio específicamente?",
  "history": [
    {
      "role": "user",
      "content": "¿Cuánto he gastado este mes?"
    },
    {
      "role": "assistant",
      "content": "Has gastado €450 en total este mes (basado en 12 transacciones del 1 al 9 de febrero)."
    }
  ]
}
```

**Response:**
```json
{
  "message": "En ocio has gastado €120 este mes (basado en 3 transacciones: 1 restaurante, 1 cine, 1 bar).",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": { ... }
}
```

---

### Example 4: New User (No Data)

**Request:**
```json
{
  "message": "¿Cuánto he gastado?"
}
```

**Response:**
```json
{
  "message": "Aún no has registrado gastos en tu cuenta. Para empezar, registra tus primeros gastos y luego podré ayudarte a analizar tus patrones de gasto.",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": {
    "model": "gpt-4o-mini",
    "latencyMs": 1450,
    "inputTokens": 240,
    "outputTokens": 85,
    "totalTokens": 325,
    "costUsd": 0.00019,
    "toolCalls": 1
  }
}
```

---

### Example 5: Error Handling (Database Down)

**Request:**
```json
{
  "message": "¿Cuánto he gastado?"
}
```

**Response:**
```json
{
  "message": "Lo siento, no pude acceder a tu información en este momento debido a un problema técnico. Por favor, inténtalo de nuevo en unos momentos.",
  "toolsUsed": ["analyzeSpendingPattern"],
  "metrics": {
    "model": "gpt-4o-mini",
    "latencyMs": 850,
    "inputTokens": 180,
    "outputTokens": 65,
    "totalTokens": 245,
    "costUsd": 0.00015,
    "toolCalls": 1
  }
}
```

**Note:** Even on error, the bot provides a transparent, user-friendly message without inventing data.

---

## Available Tools (Internal)

These tools are called automatically by the AI based on user queries. You don't need to specify them directly.

### 1. analyzeSpendingPattern

**Purpose:** Analyze spending by category and time period

**Semantic Triggers:**
- "¿Cuánto he gastado en...?"
- "Gastos de..."
- "¿Cuál es mi gasto en...?"

**Parameters (inferred):**
- `category`: "survival" | "optional" | "culture" | "extra"
- `period`: "current_week" | "current_month" | "last_month" | "last_3_months"
- `groupBy`: "day" | "week" | "month"

---

### 2. getBudgetStatus

**Purpose:** Check spending vs budget limits

**Semantic Triggers:**
- "¿Cómo va mi presupuesto?"
- "¿Estoy dentro del presupuesto?"
- "¿Me queda presupuesto?"

**Parameters (inferred):**
- `month`: Current month (default)
- `category`: Optional filter

---

### 3. detectAnomalies

**Purpose:** Find unusual spending patterns

**Semantic Triggers:**
- "¿Gastos raros?"
- "¿Algo inusual?"
- "¿Anomalías?"

**Requirements:**
- User must have 30+ days of data
- Blocked for new users

---

### 4. predictMonthlySpending

**Purpose:** Project end-of-month spending

**Semantic Triggers:**
- "¿Cuánto voy a gastar este mes?"
- "¿Proyección del mes?"
- "¿Llegaré al presupuesto?"

**Requirements:**
- User must have 30+ days of data
- At least 5 days into current month

---

### 5. getSpendingTrends

**Purpose:** Long-term trend analysis

**Semantic Triggers:**
- "¿Tendencia de gastos?"
- "¿Estoy gastando más o menos?"
- "¿Cómo evolucionan mis gastos?"

**Requirements:**
- User must have 60+ days of data
- Blocked for users with limited history

---

## Best Practices

### 1. Conversation History

- **Include history** for multi-turn conversations
- **Limit to last 10 messages** to avoid token bloat
- **Clear history** when switching topics

### 2. Error Handling

- **Always check response status** before parsing JSON
- **Implement retry logic** with exponential backoff
- **Display user-friendly messages** (don't expose technical details)

### 3. Performance

- **Debounce user input** (wait 500ms after typing stops)
- **Show loading indicator** during queries (avg 1.8s latency)
- **Cache responses** for identical queries (optional)

### 4. User Experience

- **Display tool usage** to show transparency ("Analizando tus gastos...")
- **Show metrics** for power users (optional)
- **Handle edge cases** (new users, no data, etc.)

---

## Changelog

### v2.0.0 (2026-02-09)

- Initial API documentation for KakeBot v2
- OpenAI Function Calling architecture
- Hardened error handling
- User context adaptation

---

## Support

**Technical Issues:** [support@kakebo.app](mailto:support@kakebo.app)
**API Questions:** [api@kakebo.app](mailto:api@kakebo.app)
**Documentation:** [https://docs.kakebo.app](https://docs.kakebo.app)

---

**Last Updated:** 2026-02-09
**API Version:** 2.0
**Status:** ✅ Production Ready
