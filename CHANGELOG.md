# Changelog

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
