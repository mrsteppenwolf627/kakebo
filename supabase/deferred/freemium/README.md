# Freemium diferido — NO SE APLICA NI SE EJECUTA AUTOMÁTICAMENTE

Esta carpeta contiene el modelo freemium **preparado pero inactivo**. NO es una carpeta de migraciones:
ningún `supabase db push`, pipeline ni `npm` script la ejecuta, y nada aquí cambia el comportamiento
actual de Kakebo (modo compatible: sin límite de gastos, IA y PDF disponibles para todos, trial de 14 días).

## Qué activaría (solo cuando el propietario decida lanzar el modelo)
- Usuarios nuevos gratuitos: máximo 30 gastos/mes, sin chatbot de IA, sin informes PDF.
- Usuarios Pro: todas las funciones.
- Usuarios existentes antes de la activación: conservan sus privilegios actuales (`legacy_full`).

## Orden de aplicación (siempre en este orden, tras backup y verificación)
| # | Archivo | Qué hace | ¿Activa el límite? |
|---|---|---|---|
| 1 | `01_access_foundation.sql` | `access_grants`, `fn_resolve_access_state`, `handle_new_user` freemium (trial 14 días) | No |
| 2 | `02_usage_backfill.sql` | Rellena `expense_monthly_usage` del mes actual (idempotente, nunca reduce) | No |
| 3 | `04_legacy_access_grants.sql` | Concede `legacy_full` a TODOS los usuarios existentes | No |
| 4 | `03_enforce_expense_limit.sql` | **Único script que activa el límite de 30 gastos** | **Sí** |
| 5 | `05_close_direct_expense_insert.sql` | Cierra el INSERT directo en `expenses` | No (endurece) |
| — | `rollback_freemium.sql` | Vuelve al modo compatible sin borrar datos | — |

(El 04 va ANTES del 03: sin grants legacy, el 03 se niega a ejecutarse.)

## Cómo se protegen contra ejecución accidental
Cada script empieza con un guard que aborta salvo que la sesión haya fijado explícitamente
`SET kakebo.freemium_activation = 'confirmed';` (el rollback usa `kakebo.freemium_rollback`).
Además están fuera de `supabase/migrations/`. Un test estático lo verifica.

NO ejecutar contra Supabase sin leer `docs/planning/phase3b-migration-runbook.md`.
