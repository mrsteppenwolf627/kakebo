# ADRs: Decisiones Arquitectónicas

---

## ADR-001: Cambio de modelo SaaS a herramienta gratuita

**Status:** CONGELADA  
**Fecha:** 2026-06-15

### Decisión

MetodoKakebo abandona el modelo SaaS de suscripción y pasa a ser una herramienta gratuita.

### Motivo

La monetización principal futura será mediante blog financiero, SEO, afiliación, comparadores financieros, bancos digitales, apps financieras y recursos recomendados.

### Impacto

- Se elimina Stripe y toda la infraestructura de pagos.
- Se eliminan trial, pricing y premium de la UX y el código.
- La herramienta se mantiene gratuita para todos los usuarios autenticados.
- El blog pasa a ser activo estratégico principal.
- La autenticación se mantiene para guardar datos de usuario.

### Cambios técnicos ejecutados

| Fase | Commit | Descripción |
|------|--------|-------------|
| P0.2 | `4cd29e1` | Desactivar Stripe, SubscriptionGuard, TrialBanner, PremiumPrompt |
| P0.3 | (este commit) | Eliminar stripe del package.json, limpiar CSP, SettingsClient, Navbar, Footer, Hero, ExpenseCalendar |

### Restricción

No reintroducir funcionalidades de pago sin crear una nueva ADR.

---

## ADR-002: Conservar autenticación Supabase post-migración

**Status:** ACTIVA  
**Fecha:** 2026-06-15

### Decisión

Mantener la autenticación de usuarios con Supabase aunque la herramienta sea gratuita.

### Motivo

Los datos financieros del usuario (gastos, ingresos, meses, configuración) están ligados a su `user_id`. Sin autenticación, no hay persistencia de datos entre sesiones.

### Restricción

No eliminar las tablas `profiles`, `user_settings`, `expenses`, `months`, `incomes`, `fixed_expenses` de Supabase. Las columnas `tier`, `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at` pueden mantenerse sin uso hasta que se decida una migración formal de limpieza de esquema.
