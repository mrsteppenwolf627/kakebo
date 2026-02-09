# Kakebo - Personal Finance Management

**Version:** 2.0.0
**Status:** ✅ Production Ready (Staging)
**Last Updated:** 2026-02-09

---

## Overview

Kakebo is a modern personal finance management application powered by AI. It helps users track expenses, manage budgets, and gain insights into their spending patterns through conversational AI.

**Key Features:**
- 💬 **Conversational AI Assistant** - Ask questions about your spending in natural language (Spanish)
- 📊 **Smart Analytics** - Automatic spending pattern detection and trend analysis
- 💰 **Budget Tracking** - Set and monitor budgets across 4 categories
- 🔍 **Anomaly Detection** - Identifies unusual spending automatically
- 📈 **Predictive Insights** - Projects end-of-month spending
- 🎯 **User-Adaptive** - Adjusts behavior based on your data quality

---

## Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **OpenAI API Key**
- **Supabase Account**

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/kakebo.git
cd kakebo

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Setup

Create `.env.local` with:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Feature Flags (optional)
USE_FUNCTION_CALLING_AGENT=true  # Enable KakeBot v2
```

---

## Documentation

### Core Documentation

- **[Architecture Guide](docs/KAKEBOT_V2_ARCHITECTURE.md)** - Complete system architecture, data flow, and hardening layers
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment, monitoring, and troubleshooting
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API reference, request/response formats, and examples
- **[Manual Testing Guide](docs/MANUAL_TESTING_GUIDE.md)** - Comprehensive manual testing checklist (60-90 min)
- **[Changelog](CHANGELOG.md)** - Version history and migration guides

### Implementation Logs

- **[Sprint 1 Implementation](SPRINT1_IMPLEMENTATION.md)** - Hardening features (transparency, validation, errors)
- **[Sprint 2 Implementation](SPRINT2_IMPLEMENTATION.md)** - Adaptive features (context, tool limits)

---

## KakeBot v2 (AI Assistant)

### What's New in v2

KakeBot v2 is a complete rewrite of the AI agent with production-grade hardening:

**Architecture:**
- ✅ Migrated from LangGraph → OpenAI Function Calling
- ✅ 40-60% faster response times (1-2 LLM calls instead of 3)
- ✅ Parallel tool execution
- ✅ 40% cost reduction

**Hardening:**
- ✅ **Transparency**: Always mentions period + transaction count
- ✅ **Validation**: Pre-LLM numerical consistency checks
- ✅ **Error Handling**: Honest acknowledgment, no invented data
- ✅ **User Adaptation**: Behavior adjusts based on data quality
- ✅ **Cost Control**: Max 3 tools per query, redundancy elimination

**Quality:**
- ✅ 40 passing tests (100% core coverage)
- ✅ 9/10 production readiness score
- ✅ 3,133 lines of production code

### Using the API

```typescript
// POST /api/ai/agent-v2
const response = await fetch('/api/ai/agent-v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '¿Cuánto he gastado en comida este mes?',
    history: [], // Optional conversation history
  }),
});

const data = await response.json();
/*
{
  message: "Has gastado €180 en supervivencia este mes...",
  toolsUsed: ["analyzeSpendingPattern"],
  metrics: {
    latencyMs: 1850,
    costUsd: 0.00032,
    ...
  }
}
*/
```

See [API Documentation](docs/API_DOCUMENTATION.md) for complete details.

---

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)
- OpenAI API (gpt-4o-mini)

**AI:**
- OpenAI Function Calling
- Custom hardening layers
- User context adaptation

**Testing:**
- Vitest
- 40 integration tests

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run all tests
npm test -- agents-v2 --run  # Run v2 tests only

# Linting
npm run lint         # Check code quality
```

---

## Project Structure

```
kakebo/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/ai/
│   │   │   ├── agent-v2/       # KakeBot v2 endpoint
│   │   │   └── agent/          # Legacy v1 endpoint
│   │   └── ...
│   ├── lib/
│   │   ├── agents-v2/          # KakeBot v2 implementation
│   │   │   ├── function-caller.ts       # Main orchestrator
│   │   │   ├── context-analyzer.ts      # User adaptation
│   │   │   ├── prompts.ts               # Hardened system prompt
│   │   │   └── tools/
│   │   │       ├── definitions.ts       # OpenAI schemas
│   │   │       ├── executor.ts          # Tool execution
│   │   │       └── validator.ts         # Output validation
│   │   └── ...
│   └── __tests__/
│       └── agents-v2/          # Test suites (40 tests)
├── docs/                       # Documentation
│   ├── KAKEBOT_V2_ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── API_DOCUMENTATION.md
├── CHANGELOG.md                # Version history
└── README.md                   # This file
```

---

## Deployment

### Staging

```bash
# Deploy to staging
git checkout staging
git merge main
git push origin staging
```

Staging URL: `https://staging.kakebo.app`

### Production

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for complete rollout strategy:
1. Canary (10% traffic)
2. Ramp (50% traffic)
3. Full rollout (100%)
4. Cleanup (remove v1)

---

## Testing

```bash
# Run all tests
npm test -- agents-v2 --run

# Expected output: 40/40 tests passing
# ✓ function-caller.test.ts (15 tests)
# ✓ hardening-integration.test.ts (10 tests)
# ✓ sprint2-integration.test.ts (15 tests)
```

---

## Contributing

This is a private project. For team members:

1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all tests pass (`npm test`)
4. Create PR to `main`
5. After approval, merge and deploy to staging
6. Monitor metrics before production rollout

---

## Monitoring

**Key Metrics:**
- Latency p95: < 2.5s
- Error rate: < 1%
- User corrections: < 2%
- Cost per 1K queries: < $5

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md#monitoring) for alerting thresholds.

---

## Support

**Technical Issues:** support@kakebo.app
**API Questions:** api@kakebo.app
**Documentation:** https://docs.kakebo.app

---

## License

Proprietary - All rights reserved

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

### Latest Release: v2.0.0 (2026-02-09)

**Major Changes:**
- Complete AI agent rewrite (LangGraph → OpenAI Function Calling)
- Production hardening (transparency, validation, error handling)
- User adaptation (data quality-based behavior)
- Cost control (tool calling limits)
- 40 passing tests, 9/10 production readiness

**Performance:**
- 40-60% faster responses
- 40% cost reduction
- Parallel tool execution

---

**Maintained by:** AI Team @ Kakebo
**Last Updated:** 2026-02-09
**Status:** ✅ Production Ready (Staging)
