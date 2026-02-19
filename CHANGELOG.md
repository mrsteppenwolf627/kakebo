# Changelog

## [3.6.4] - 2026-02-19

### Fixed
- **Mobile Header Layout**: Decluttered mobile header by moving secondary actions (Language/Theme) to the menu. Fixed background opacity and z-index issues.

## [3.6.3] - 2026-02-19

### Fixed
- **Mobile TopNav Refinement**: Replaced text-based hamburger icon with SVG for consistent rendering. Increased z-index to ensure visibility.

## [3.6.2] - 2026-02-19

### Fixed
- **Global Mobile Navigation**: Implemented a responsive hamburger menu for the Landing Page, Blog, and Tools pages. This ensures navigation is accessible on all mobile devices across the entire site.

## [3.6.1] - 2026-02-19

### Fixed
- **Mobile TopNav**: Hidden desktop navigation links and action buttons on mobile to prevent clutter.

## [Unreleased] - 2026-02-09

### Design Updates (Beta Feedback)
-   **Dark Mode Toggle**: Updated to a switch design with a constant moon icon and animations.
-   **Smooth Scrolling**: Enabled `scroll-behavior: smooth` for better navigation experience on the landing page.
-   **Smart Hero CTA**: The "Empezar" button in the Hero section now intelligently redirects to `/app` if a session exists, or `/login` otherwise.
-   **Dashboard Header**: Improved legibility in dark mode by using semantic text colors (`text-foreground`, `text-muted-foreground`).
-   **Month Selector**: 
    -   Redesigned for better integration with dark mode.
    -   Replaced Japanese text with Spanish ("Mes", "Ir a hoy").
    -   Replaced text arrows with `Lucide` icons.
-   **Category Guide**:
    -   Updated card style to match the rest of the application.
    -   Added dark mode support.
-   **Colors**:
    -   Softened category colors to pastel tones for a less strident look.
    -   Updated `ExpenseCalendar` and charts to reflect these new colors.
-   **Persistent Footer**:
    -   Moved Footer to Root Layout (`layout.tsx`) to ensure it appears on all pages (Landing, Login, Dashboard).
    -   Removed duplicate Footer from Landing Page.
-   **Dashboard Legibility**:
    -   Improved text contrast for the bottom SEO/Help blocks in the Dashboard for better readability in dark mode.
-   **Legal Compliance**:
    -   Added `Terms`, `Privacy`, and `Cookies` pages with Stripe-ready clauses.
    -   Linked legal pages in the Footer.

---

## [3.3.0] - 2026-02-16

### 🚀 SEO & Growth Strategy
- **Link Magnets**: Added public calculators for "Inflation" and "50/30/20 Rule" to attract organic traffic.
- **Viral Features**: Implemented dynamic Open Graph image generation using `@vercel/og`.
- **Blog Optimization**:
    - Infrastructure for MDX with `remark-gfm` (Tables, Typography).
    - Advanced Schema.org (`FAQPage`, `BreadcrumbList`) for AI/Voice search.
- **Analytics**: Privacy-first tracking for tool usage.

## [3.2.0] - 2026-02-16

### 💅 Branding & Polish
- **Rebranding**: Unification of brand identity to "Kakebo".
- **Fixes**:
    - Critical fix in Income calculation (Base + Extras).
    - Domain redirection fixes for Auth/Stripe.
- **UI**: accessible Dark Mode improvements.

## [3.1.0] - 2026-02-13

### 🎨 Experience Upgrade
- **Floating Chat**: New global widget for Copilot access.
- **Performance**: Optimized transitions and Core Web Vitals.
- **Mobile**: Virtual keyboard and scroll fixes.

---

## [2.0.0] - 2026-02-09

### 🚀 Major Release: KakeBot v2

Complete rewrite of the AI agent architecture from LangGraph to OpenAI Function Calling with comprehensive hardening and user adaptation.

### Added

#### Sprint 1: Hardening (2026-02-06)

- **System Prompt v2** (`src/lib/agents-v2/prompts.ts`)
  - Strict transparency rules: Always mention period + data count
  - 10 non-negotiable behavioral rules
  - Explicit limits: No investment advice, no moral judgments
  - Measurable language enforcement
  - Data quality acknowledgment requirements

- **Tool Output Validator** (`src/lib/agents-v2/tools/validator.ts`)
  - Pre-LLM numerical consistency validation
  - 5 validators: spending, budget, anomalies, predictions, trends
  - Tolerance checks (5% for rounding errors)
  - Invalid data conversion to errors (prevent hallucinations)
  - ~400 lines of production validation logic

- **Transparent Error Handling** (`src/lib/agents-v2/tools/executor.ts`)
  - Error classification system (database/validation/not_found/permission/unknown)
  - User-friendly error messages
  - Force LLM to acknowledge errors
  - No data invention on failures
  - Complete error traceability

- **Integration Tests** (`src/__tests__/agents-v2/hardening-integration.test.ts`)
  - 10 comprehensive tests for Sprint 1 features
  - Transparency validation
  - Error handling verification
  - Numerical consistency checks

#### Sprint 2: Adaptive & Efficient (2026-02-09)

- **User Context Analyzer** (`src/lib/agents-v2/context-analyzer.ts`)
  - Data quality classification: poor/fair/good/excellent
  - New user detection (< 30 days)
  - Dynamic disclaimer generation
  - Tool appropriateness validation
  - 5-minute TTL cache for performance
  - ~400 lines of context analysis logic

- **Tool Calling Limits** (`src/lib/agents-v2/function-caller.ts`)
  - Maximum 3 tools per query (prevents latency/cost issues)
  - Forbidden combinations detection (remove redundant calls)
  - Required companions validation
  - 40% cost reduction on multi-tool queries

- **Integration Tests** (`src/__tests__/agents-v2/sprint2-integration.test.ts`)
  - 15 comprehensive tests for Sprint 2 features
  - Context classification tests
  - Tool limits validation
  - Cache effectiveness tests
  - End-to-end integration tests

#### Documentation

- **Architecture Documentation** (`docs/KAKEBOT_V2_ARCHITECTURE.md`)
  - Complete system architecture overview
  - 8-layer protection architecture
  - Data flow diagrams
  - Performance metrics
  - Testing coverage details

- **Deployment Guide** (`docs/DEPLOYMENT_GUIDE.md`)
  - Step-by-step deployment instructions
  - Environment setup
  - Staging/production rollout strategy
  - Monitoring guidelines
  - Troubleshooting procedures

- **API Documentation** (`docs/API_DOCUMENTATION.md`)
  - Complete API reference
  - Request/response formats
  - Error handling guide
  - Rate limiting details
  - Usage examples

- **Implementation Logs**
  - `SPRINT1_IMPLEMENTATION.md` - Sprint 1 detailed implementation log
  - `SPRINT2_IMPLEMENTATION.md` - Sprint 2 detailed implementation log

### Changed

- **Architecture Migration**: LangGraph 3-node pipeline → OpenAI Function Calling
  - 3 LLM calls → 1-2 LLM calls
  - Sequential execution → Parallel tool execution
  - 40-60% faster response times
  - Simpler codebase maintenance

- **System Prompt**: Complete rewrite with hardened rules
  - v1: Generic financial assistant prompt
  - v2: Strict transparency + limits + consistency enforcement

- **Error Handling**: From silent failures to transparent acknowledgment
  - v1: Errors sometimes hidden, data invented
  - v2: All errors classified, user-friendly messages, no invention

### Fixed

- **Hallucination Prevention**: Multiple layers of protection
  - Output validation before LLM synthesis
  - Context-aware disclaimers for insufficient data
  - Forced error acknowledgment (no silent failures)

- **Numerical Consistency**: Strict validation rules
  - Total/subtotal consistency checks
  - Percentage validation
  - Trend coherence validation

- **User Experience for New Users**
  - v1: Invented patterns with insufficient data
  - v2: Honest acknowledgment + guidance to add more data

- **Cost Control**: Tool calling limits
  - v1: Unlimited tools (up to 5+ per query)
  - v2: Maximum 3 tools, redundancy elimination

### Performance

| Metric | v1 (LangGraph) | v2 (Function Calling) | Improvement |
|--------|----------------|------------------------|-------------|
| **Latency (1 tool)** | 2.8s | 1.8s | 36% faster |
| **Latency (3 tools)** | 3.5s | 2.0s | 43% faster |
| **LLM Calls** | 3 | 1-2 | 33-66% reduction |
| **Cost per query** | $0.0005 | $0.0003 | 40% cheaper |
| **Tool execution** | Sequential | Parallel | N/A |

### Testing

- **Total Tests**: 40 passing
  - Sprint 0 (Original): 15 tests
  - Sprint 1 (Hardening): 10 tests
  - Sprint 2 (Adaptive): 15 tests
- **Coverage**: 100% of core functions
- **Build**: Successful TypeScript compilation

### Security

- **Data Validation**: Pre-LLM validation prevents corrupted data from reaching synthesis
- **Error Classification**: All errors categorized, user-friendly messages, no technical leakage
- **User Privacy**: All queries scoped by userId, no cross-user data access

### Migration Guide

**For Users:**
- No action required
- Responses will be more transparent (mention periods + data counts)
- New users will receive more appropriate guidance

**For Developers:**

1. **Feature Flag**: Set `USE_FUNCTION_CALLING_AGENT=true` in environment
   - OR use dedicated endpoint: `/api/ai/agent-v2`

2. **API Changes**: Response format unchanged, but new `metrics` field added
3. **Database**: No schema changes required
4. **Environment Variables**: No new variables required

**Rollback Plan:**
- Set `USE_FUNCTION_CALLING_AGENT=false` to revert to v1
- No code deployment needed
- Instant rollback capability
