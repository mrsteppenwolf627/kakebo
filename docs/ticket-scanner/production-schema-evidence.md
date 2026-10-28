# Evidencia de esquema de producción para el escáner

**Fecha de extracción:** 2026-10-27

**Fuente:** `C:\Users\a.alarcon\Backups\kakebo\kakebo-production.dump`
**Método:** `pg_restore --schema-only --no-owner --no-acl` sobre el backup local. No se consultó ni modificó Supabase y no se extrajeron filas.

## Resultado

El backup demuestra que el diseño del escáner puede vincularse al ciclo y al gasto existente sin asumir columnas inexistentes:

- `public.months.id` es `uuid NOT NULL` y la tabla tiene `user_id`, `status`, `year`, `month`, `closed_at`, `income`, `saving_goal` y `savings_done`.
- `public.expenses.id` es `uuid`, `user_id` es obligatorio, `amount` es `numeric(12,2)`, `date` es `date`, `category` y `note` existen, y también existen `month_id uuid` y `subcategory text`.
- `expenses.month_id` tiene la FK `expenses_month_fk` hacia `months(id)` con `ON DELETE SET NULL`.
- `fn_create_expense` recibe `p_month_id`, valida que el ciclo pertenezca a `auth.uid()` y que no esté cerrado, y escribe `month_id` y `subcategory` en `expenses`.
- `expenses` tiene RLS habilitado con políticas de lectura, inserción, actualización y borrado propias.
- `months` tiene RLS habilitado con políticas de lectura, inserción y actualización propias.

## Implicación

La observación anterior del dashboard era incompleta: no debe usarse para bloquear el contrato de creación de gastos. Sí sigue siendo necesaria una tabla propia de vínculo ticket→gasto y una función atómica de confirmación, porque `expenses` no contiene una referencia al ticket. La función debe comprobar propietario y ciclo abierto, crear todos los gastos, registrar sus IDs, marcar el ticket como `confirmed` y ser idempotente dentro de una única transacción.

## Límites

Esto demuestra la estructura incluida en el backup, no que una futura migración del escáner sea segura sin probarla en staging. Tampoco demuestra el estado operativo del bucket, sus políticas efectivas, el cifrado, el planificador de limpieza ni los términos de un proveedor OCR.
