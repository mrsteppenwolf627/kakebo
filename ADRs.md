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

### Sin trial premium

**Decisión cerrada (2026-10-06): no hay trial premium.** Las cuentas nuevas empiezan directamente en la capa gratuita (30 gastos/mes, sin IA/chatbot, sin PDF, sin premium/Plus). Los valores de 14 días (histórico, febrero de 2026) y 30 días (diseño de Fase 3, septiembre de 2026) no son vigentes ni están verificados en producción.

### Estado

- **No activada.** Hoy el código (`canUsePremium` → true; `access-state.ts` sin cablear) y la producción conservan acceso completo, sin límite de gastos. El modelo está preparado, inactivo, en `supabase/deferred/freemium/`; las migraciones compatibles `20260916`, `20260917` y `20261001` no alteran el comportamiento.
- Producción (evidencia fechada del 2026-10-05, no re-verificada): Vercel servía el deployment `41a4c98` y a Supabase le faltaban funciones y tablas que requiere el código posterior. **Conclusión operativa: mantener la producción actual y no promover el código posterior hasta aplicar las migraciones compatibles y verificarlas.** Ver `docs/planning/phase3b-migration-runbook.md`.
- Stripe, checkout y pagos permanecen desactivados. Cualquier activación de cobro requiere su propia implementación y revisión legal.

### Restricciones

- No activar el límite, el cierre del INSERT directo ni la restricción de IA/PDF sin ejecutar el procedimiento del runbook.
- Cablear en la app los permisos de IA/chatbot y de informes PDF por estado de acceso es trabajo pendiente (hoy no están cableados).

---

## ADR-004: Kakebo Master System — producto digital de pago (no disponible todavía)

**Status:** ACTIVA (decisión de producto) — **LANDING PREPARADA; COMPRA, COBRO Y DESCARGA DESACTIVADOS**

**Fecha:** 2026-10-06

### Decisión

- **Producto:** Kakebo Master System, un pack digital con tres archivos: plantilla Excel premium (12 hojas, sin macros), el ebook «El arte de mirar tu dinero» (unas 20 páginas) y un tutorial/PDF de instrucciones.
- **Condiciones:** 9,90 € IVA incluido; compra única; acceso permanente a los archivos del pack; no se exige registro de cuenta al comprador.
- **Es un producto distinto de la plantilla gratuita de Excel** (`/blog/plantilla-kakebo-excel`), que sigue siendo gratuita, descargable y es la URL con más tráfico: debe enlazar de forma contextual a la landing del pack, conservando primero su CTA de descarga gratuita.
- **Independiente de la aplicación:** comprar el pack no concede IA, informes de la app, funciones Plus ni suscripciones.
- **Landing pública e indexable** (`/herramientas/plantilla-kakebo-excel-premium`, ES/EN), con SEO y GEO; mientras no se pueda comprar, muestra "Próximamente", el CTA está inactivo y el schema no declara oferta ni disponibilidad.

### Restricciones

- Stripe, checkout, cobro y descarga comercial se configuran al final y permanecen desactivados (`PREMIUM_COMMERCE_ENABLED` apagado).
- Los archivos del pack permanecen fuera de `public/`, sin URLs públicas directas (almacenamiento privado, entrega futura con URLs firmadas).
- La compra sin registro con acceso permanente requiere un diseño de entrega propio (ver `docs/planning/premium-commerce-architecture.md`); no se conecta a Stripe en esta fase.
- Producción no se promueve hasta aplicar y verificar las migraciones compatibles (`docs/planning/phase3b-migration-runbook.md`).
