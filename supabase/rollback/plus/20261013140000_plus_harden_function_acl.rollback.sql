-- ROLLBACK de la migración 6/6. Intencionadamente vacío: la migración solo reafirma permisos restrictivos
-- (idempotente) y volver a abrir EXECUTE a anon/authenticated sería una regresión de seguridad.
-- Si alguna vez hiciera falta, restaurar manualmente el ACL concreto del entorno afectado.
SELECT 1;
