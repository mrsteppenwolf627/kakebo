-- ============================================================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA DE AUTO-EMBEDDINGS
-- ============================================================================
-- Ejecuta estas queries en orden para verificar que todo funciona
-- ============================================================================

-- 1️⃣ VERIFICAR TABLA expense_counter
-- Debe existir y tener exactamente 1 fila con el contador actual
SELECT
  '1️⃣ CONTADOR GLOBAL' as check_name,
  id,
  count as total_expenses,
  updated_at
FROM expense_counter;

-- 2️⃣ VERIFICAR TRIGGER
-- Debe mostrar el trigger 'auto_increment_expense_counter'
SELECT
  '2️⃣ TRIGGER ACTIVO' as check_name,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE
    WHEN tgenabled = 'O' THEN '✅ Activo'
    WHEN tgenabled = 'D' THEN '❌ Deshabilitado'
    ELSE '⚠️ Estado desconocido'
  END as status
FROM pg_trigger
WHERE tgname = 'auto_increment_expense_counter';

-- 3️⃣ VERIFICAR FUNCIONES
-- Deben existir las 2 funciones necesarias
SELECT
  '3️⃣ FUNCIONES' as check_name,
  proname as function_name,
  CASE
    WHEN proname = 'increment_expense_counter' THEN '✅ Función de incremento'
    WHEN proname = 'trigger_increment_expense_counter' THEN '✅ Función de trigger'
    ELSE '⚠️ Otra función'
  END as description
FROM pg_proc
WHERE proname IN ('increment_expense_counter', 'trigger_increment_expense_counter');

-- 4️⃣ GASTOS TOTALES vs CONTADOR
-- El contador debe coincidir con el total de gastos
SELECT
  '4️⃣ SINCRONIZACIÓN' as check_name,
  (SELECT COUNT(*) FROM expenses) as gastos_reales,
  (SELECT count FROM expense_counter WHERE id = 1) as contador_global,
  CASE
    WHEN (SELECT COUNT(*) FROM expenses) = (SELECT count FROM expense_counter WHERE id = 1)
    THEN '✅ Sincronizado'
    ELSE '⚠️ Desincronizado (ejecuta resincronización)'
  END as status;

-- 5️⃣ GASTOS CON Y SIN EMBEDDINGS
-- Muestra cuántos gastos tienen embeddings y cuántos faltan
SELECT
  '5️⃣ ESTADO EMBEDDINGS' as check_name,
  total_expenses,
  with_embeddings,
  without_embeddings,
  ROUND((with_embeddings::numeric / NULLIF(total_expenses, 0)) * 100, 1) as porcentaje_completado
FROM (
  SELECT
    COUNT(DISTINCT e.id) as total_expenses,
    COUNT(DISTINCT ee.expense_id) as with_embeddings,
    COUNT(DISTINCT e.id) - COUNT(DISTINCT ee.expense_id) as without_embeddings
  FROM expenses e
  LEFT JOIN expense_embeddings ee ON e.id = ee.expense_id
  WHERE e.note IS NOT NULL AND e.note != ''
) stats;

-- 6️⃣ ÍNDICE DE BÚSQUEDA
-- Verifica que el índice de optimización existe
SELECT
  '6️⃣ ÍNDICE DE BÚSQUEDA' as check_name,
  indexname as index_name,
  tablename as table_name,
  CASE
    WHEN indexname = 'idx_expense_embeddings_lookup' THEN '✅ Índice creado'
    ELSE '⚠️ Índice no encontrado'
  END as status
FROM pg_indexes
WHERE indexname = 'idx_expense_embeddings_lookup';

-- 7️⃣ POLÍTICAS RLS
-- Verifica que las políticas de seguridad están activas
SELECT
  '7️⃣ POLÍTICAS RLS' as check_name,
  policyname as policy_name,
  CASE
    WHEN policyname LIKE '%read%' THEN '✅ Lectura configurada'
    WHEN policyname LIKE '%service_role%' THEN '✅ Service role configurado'
    ELSE '⚠️ Otra política'
  END as description
FROM pg_policies
WHERE tablename = 'expense_counter';

-- ============================================================================
-- QUERIES DE RESINCRONIZACIÓN (si es necesario)
-- ============================================================================
-- Si el contador está desincronizado, ejecuta esto:
/*
UPDATE expense_counter
SET count = (SELECT COUNT(*) FROM expenses),
    updated_at = NOW()
WHERE id = 1;
*/

-- ============================================================================
-- TEST MANUAL DEL TRIGGER
-- ============================================================================
-- Para probar que el trigger funciona:
/*
-- 1. Guardar contador actual
SELECT count FROM expense_counter WHERE id = 1;

-- 2. Insertar un gasto de prueba
INSERT INTO expenses (user_id, month_id, date, amount, category, note)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM months LIMIT 1),
  CURRENT_DATE,
  1.00,
  'extra',
  'Test auto-embeddings trigger'
);

-- 3. Verificar que el contador aumentó en 1
SELECT count FROM expense_counter WHERE id = 1;

-- 4. Eliminar el gasto de prueba
DELETE FROM expenses WHERE note = 'Test auto-embeddings trigger';
*/
