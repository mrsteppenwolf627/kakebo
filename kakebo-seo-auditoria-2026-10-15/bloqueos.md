# Bloqueos — Auditoría SEO-1.1 (2026-10-15)

Estado: **auditoría NO realizada. No se ha extraído ninguna cifra de GSC ni de GA4.**

## 1. Navegador (corregido 2026-10-15)
- El navegador conectado a la sesión ("Browser 1") SÍ es Brave (comprobado: navigator.brave presente, brands = Brave 154).
  La versión anterior de este fichero decía "Chrome local": era un error mío.
- Ese Brave arrancó la sesión con una pestaña nueva y SIN pestañas de GSC ni de GA4. La sesión de Google activa en ese
  perfil es aitoralmu21@gmail.com, que no tiene permiso sobre la propiedad. Lo más probable es que las pestañas de GSC/GA4
  del usuario estén en OTRO perfil o ventana de Brave (con la cuenta propietaria), al que la extensión no está conectada.
- list_connected_browsers solo muestra un navegador conectado. No hay forma de elegir otro perfil desde aquí.

## 2. Google Search Console
- Se abrió `search.google.com/search-console?resource_id=sc-domain:metodokakebo.com`.
- Resultado: "Vaya, no puedes acceder a esta propiedad". La cuenta con sesión en este Chrome es la del usuario
  (aitoralmu21@gmail.com) y no tiene permiso sobre la propiedad de dominio `metodokakebo.com`.
- Se probó también la propiedad de prefijo de URL `https://www.metodokakebo.com/`; no se pudo confirmar el resultado
  (la captura posterior falló por tiempo de espera).
- Por la regla 3 no se cambió de cuenta ni se intentó saltar el bloqueo. Botón "Verificar la propiedad": NO pulsado.

## 3. Google Analytics 4
- Se abrió `analytics.google.com/analytics/web/`. Redirigió a `#/a187173198p0/admin` (cuenta a187173198, sin propiedad
  seleccionada: `p0`).
- El renderizador de la pestaña dejó de responder (Page.captureScreenshot agotó 30 s, dos veces), por lo que no se pudo ver
  qué propiedades hay ni extraer datos. No se reintentó en bucle.

## 4. Qué NO se ha hecho
- Ninguna extracción (pasos 2 a 5), ningún CSV de datos, ninguna recomendación basada en datos.
- No se modificó nada en GSC ni en GA4. No se tocó el repositorio ni producción.

## 5. Qué hace falta para continuar
Una de estas opciones:
1. Que el usuario inicie sesión, en el Chrome conectado, con la cuenta Google que tenga acceso a GSC y GA4 de metodokakebo.com
   (yo no introduzco credenciales ni cambio de cuenta); o
2. Que el usuario conecte la extensión al Brave donde ya tiene ambas aplicaciones abiertas (selección de navegador); o
3. Que el usuario exporte desde GSC y GA4 los CSV (rendimiento, páginas, consultas, países, dispositivos, indexación,
   eventos) y los deje en esta carpeta; yo los analizo y redacto el informe.

## 6. Actualización tras reconectar la extensión (2026-10-15)
- GA4: accesible. Propiedad "metodokakebo" (cuenta a378788667, propiedad 543004992), sesión Google u/2 (authuser=2).
  La pantalla de inicio muestra datos (últimos 7 días: 171 sesiones, 90 usuarios nuevos). Aún sin extracción formal.
- GSC: BLOQUEADO con la sesión u/2 (aitor@aitoralmu.xyz). `sc-domain:metodokakebo.com` -> "no tienes acceso a esta propiedad"
  y la pantalla de bienvenida de GSC de esa cuenta no lista ninguna propiedad.
- Las sesiones u/0 (aitoralmu21@gmail.com) ya habían dado el mismo bloqueo. No se probaron otras sesiones (u/1, u/3...): sería
  cambiar de cuenta, y la regla 3 lo prohíbe.
- Pendiente de decisión del usuario: qué cuenta/propiedad de GSC usar o exportar los CSV de GSC.

## 8. Actualización GSC (2026-10-15)
- GSC accesible: propiedad de prefijo de URL https://www.metodokakebo.com/ (sesión Google u/2, aitor@aitoralmu.xyz). La propiedad de dominio sc-domain:metodokakebo.com no existe para esa cuenta.
- Extraído: rendimiento (consultas 203, páginas 60, países top 10 de 130, dispositivos, mensual), indexación, sitemaps, manuales, seguridad, enlaces.
- No extraído: Core Web Vitals (GSC: "Not enough usage data" en móvil y escritorio); apariencia en búsqueda (no abierta); detalle por URL de las 26 páginas "rastreadas sin indexar".
- La paginación de tablas de GSC obligó a leer por páginas; las sumas por página (1.352 clics, 14.310 impresiones) superan los totales de propiedad (1.320 / 13.076): comportamiento normal de GSC.
