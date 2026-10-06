# ADRs: Decisiones Arquitectónicas

---

## ADR-001: Cambio de modelo SaaS a herramienta gratuita

**Status:** CONGELADA — **parcialmente SUPERSEDIDA por ADR-003 (2026-10-06)**. Se conserva como registro histórico de la decisión del 2026-06-15.

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

No reintroducir funcionalidades de pago sin crear una nueva ADR. *(Cumplida: la nueva ADR es ADR-003.)*

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

---

## ADR-003: Capa gratuita limitada y reintroducción de funciones premium (no activada)

**Status:** ACTIVA (decisión de producto) — **IMPLEMENTACIÓN DIFERIDA, NO ACTIVADA**

**Fecha:** 2026-10-06

**Sustituye parcialmente a:** ADR-001 (modelo gratuito sin restricciones y eliminación de trial/premium)

### Decisión

La capa gratuita permite:

- Registrar como **máximo 30 gastos al mes**. Definición temporal ya implementada en los scripts: mes natural en zona horaria `Europe/Madrid` (periodo `YYYY-MM` calculado en servidor al crear el gasto); borrar un gasto no decrementa el contador.
- **No** usar el chatbot ni las funciones de conversación con IA.
- **No** generar informes PDF.
- **No** acceder a funciones premium o Plus.

Los usuarios existentes antes de la activación conservan sus privilegios actuales (concesión `legacy_full`, script diferido `04_legacy_access_grants.sql`).

### Trial

**PENDIENTE DE DECISIÓN DEL PROPIETARIO**: no se confirma si habrá trial ni su duración. Los valores de 14 días (histórico, febrero de 2026) y 30 días (diseño de Fase 3, septiembre de 2026) no están verificados en producción ni son vigentes.

### Estado

- **No activada.** Hoy el código (`canUsePremium` → true; `access-state.ts` sin cablear) y la producción conservan acceso completo, sin límite de gastos. El modelo está preparado, inactivo, en `supabase/deferred/freemium/`; las migraciones compatibles `20260916`, `20260917` y `20261001` no alteran el comportamiento.
- Producción (evidencia fechada del 2026-10-05, no re-verificada): Vercel servía el deployment `41a4c98` y a Supabase le faltaban funciones y tablas que requiere el código posterior. **Conclusión operativa: mantener la producción actual y no promover el código posterior hasta aplicar las migraciones compatibles y verificarlas.** Ver `docs/planning/phase3b-migration-runbook.md`.
- Stripe, checkout y pagos permanecen desactivados. Cualquier activación de cobro requiere su propia implementación y revisión legal.

### Restricciones

- No activar el límite, el cierre del INSERT directo ni la restricción de IA/PDF sin ejecutar el procedimiento del runbook.
- Cablear en la app los permisos de IA/chatbot y de informes PDF por estado de acceso es trabajo pendiente (hoy no están cableados).
