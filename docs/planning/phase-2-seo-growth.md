# Phase 2: SEO & Growth Strategy

**Goal**: Transform Kakebo into a "visit machine" by optimizing technical performance, creating high-value free tools (link magnets), and enhancing social sharing capabilities.

## User Review Required

> [!NOTE]
> **Engineering as Marketing**: We will build free, standalone calculators (e.g., "Calculadora 50/30/20") that provide value without requiring signup. These are proven to attract backlinks and traffic.

## Proposed Changes

### 1. Technical SEO & Performance (Core Web Vitals)
**Objective**: Achieve 95-100 Lighthouse score on Mobile & Desktop.
#### [optimize] Images & Fonts
- Implement `next/font` for zero layout shift.
- Ensure all images have explicit width/height or use `next/image` with placeholders.
- Defer non-critical scripts.

#### [new] Sitemap & Robots
- Ensure `sitemap.xml` includes all new tools and blog posts automatically.
- Valid `robots.txt` configuration.

### 2. Engineering as Marketing (Link Magnets)
Create specific pages that answer high-volume search queries.

#### [NEW] [src/app/(landing)/herramientas/regla-50-30-20/page.tsx](file:///src/app/(landing)/herramientas/regla-50-30-20/page.tsx)
- **Tool**: 50/30/20 Budget Rule Calculator.
- **Content**: Explanation of the rule, interactive slider, and call to action to use Kakebo for tracking.

#### [NEW] [src/app/(landing)/herramientas/calculadora-inflacion/page.tsx](file:///src/app/(landing)/herramientas/calculadora-inflacion/page.tsx)
- **Tool**: Simple inflation calculator (Past value vs Future value).
- **Keyword**: "Calculadora inflación España".

### 3. Usage & Conversion Tracking
#### [new] Analytics Events
- Track "Tool Used" events.
- Track "SignUp Start" from specific tool pages (attribution).

### 4. Social Sharing (Viral Growth)
#### [new] Dynamic Open Graph Images (`@vercel/og`)
- Generate custom social images for every blog post and tool.
- Dynamic text on images (e.g., "Calcula tu presupuesto 50/30/20").

## Verification Plan

### Automated
- Run Lighthouse CI or manual Lighthouse audit.
- Validate Structured Data (Schema.org) using Google's Rich Results Test.

### Manual
- Verify OG images appear correctly on Twitter/LinkedIn card validator.
- Verify tools function correctly and lead to Signup.
