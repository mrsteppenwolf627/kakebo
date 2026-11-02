# Fase marketingmail

## Objetivo

Enviar comunicaciones útiles de Kakebo únicamente a personas que hayan dado consentimiento explícito, con baja sencilla y registro auditable. El envío automático queda desactivado hasta validar textos, calendario y configuración del proveedor.

## Audiencia

- Solo cuentas con `communication_preferences.marketing_email_consent = true`.
- Se excluyen las cuentas con `unsubscribed_at` y cualquier destinatario sin email.
- Una misma campaña no se envía dos veces al mismo usuario: se consulta `marketing_email_events` antes de crear la audiencia.
- El consentimiento se recoge en el registro, en el aviso inicial dentro de la aplicación y en Ajustes. El valor por defecto es no aceptar.

## Ciclo recomendado

Se propone un ciclo de ocho semanas, con un máximo de un email semanal y pausa si las métricas empeoran. El ciclo puede repetirse; las novedades solo se envían cuando existe una novedad real.

| Semana | Tipo | Objetivo |
| --- | --- | --- |
| 1 | Recordatorio de uso | Volver a registrar gastos pendientes |
| 2 | Consejo práctico | Aportar una acción breve y aplicable |
| 3 | Recordatorio de uso | Reforzar el hábito sin saturar |
| 4 | Resumen mensual | Revisar categorías, desviaciones y ahorro |
| 5 | Consejo práctico | Mantener el aprendizaje |
| 6 | Recordatorio de uso | Recuperar usuarios inactivos |
| 7 | Novedades | Comunicar mejoras verificadas |
| 8 | Resumen mensual | Cerrar el ciclo y preparar el siguiente |

Si no hay novedades en la semana 7, se sustituye por un consejo práctico. No se envían campañas de reactivación a personas sin consentimiento.

## Operativa y controles

- El endpoint de previsualización permite comprobar audiencia y duplicados sin enviar.
- El endpoint de envío requiere autenticación de administrador, una variable explícita y la confirmación `SEND`.
- La automatización programada usa un cron semanal los lunes a las 08:00 UTC. El ciclo y las campañas se calculan automáticamente y el identificador de entrega cambia por ciclo para permitir repetirlo sin duplicados.
- La automatización permanece desactivada hasta configurar `CRON_SECRET` y cambiar `MARKETING_AUTOMATION_ENABLED=true` después de validar un envío de prueba.
- Cada envío y fallo se registra en `marketing_email_events`, asociado al usuario y a la campaña.
- Cada mensaje incluye baja individual y el proveedor debe mantener sus supresiones.

## Pendiente antes del primer envío

1. Revisar y aprobar los cuatro textos definitivos.
2. Confirmar en producción `MARKETING_MAIL_PROVIDER`, `RESEND_API_KEY`, `MARKETING_MAIL_FROM_EMAIL`, `MARKETING_UNSUBSCRIBE_SECRET` y el dominio remitente.
3. Hacer un envío de prueba a una cuenta propia.
4. Activar el primer envío manual y observar rebotes, bajas y respuestas antes de programar el ciclo.
5. Activar la automatización semanal con `MARKETING_AUTOMATION_ENABLED=true`.
