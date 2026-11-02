# Fase marketingmail

## Objetivo

Preparar una comunicación por correo útil y conforme a las preferencias de los usuarios, sin enviar mensajes hasta validar proveedor, textos y autorización.

## Alcance ejecutado en esta fase

- Preferencias por usuario en Supabase con RLS y consentimiento explícito por defecto desactivado.
- Registro de versión de política, fecha de consentimiento y fecha de baja.
- Aviso dentro de la aplicación para usuarios existentes.
- Gestión posterior desde Ajustes, incluyendo retirada del consentimiento.
- Actualización de la política de privacidad para explicar los correos opcionales.
- Prueba automatizada de la migración y del requisito de consentimiento explícito.

## Pendiente antes de enviar correos

- Elegir proveedor de envío y configurar dominio, SPF, DKIM y DMARC.
- Definir categorías de correo y plantillas.
- Revisar textos legales y base jurídica con asesoría profesional.
- Crear un proceso de baja visible en cada correo y una lista de supresión.
- Hacer una prueba con una cuenta interna y validar métricas y límites.

## Criterio de seguridad

Esta fase no envía correos ni importa automáticamente las 195 direcciones. Solo registra preferencias cuando el usuario las elige dentro de la aplicación.
