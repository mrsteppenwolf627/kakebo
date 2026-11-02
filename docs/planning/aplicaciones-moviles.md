# Plan de aplicaciones Android y iPhone

Fecha de diagnóstico: 29 de octubre de 2026. Alcance activo: convertir Kakebo en una aplicación móvil Android funcional y verificable, preservando la web y los datos existentes. La versión iPhone queda expresamente aplazada hasta nueva instrucción. La entrega requerida para este alcance es una aplicación Android instalable; una web responsive, una PWA o un simple enlace a la web no satisfacen el objetivo.

## Punto de partida comprobado

- La raíz examinada es el proyecto Next.js de Kakebo. El árbol contiene cambios previos ajenos a este trabajo; deben conservarse.
- La interfaz depende de rutas y funciones de servidor, sesiones Supabase mediante cookies y redirecciones; el acceso con Google utiliza un callback basado en el origen web. No equivale a un paquete estático listo para Capacitor.
- Existe un manifiesto web, pero esto no demuestra que exista una aplicación nativa ni que funcione en dispositivos. El manifiesto referencia `/icon-512.png`, ausente de `public` en esta copia.
- En este Windows se han localizado Node y npm; no se han encontrado Java, adb ni Gradle en PATH, ni el SDK Android en su ubicación habitual. Esto no descarta instalaciones en otras ubicaciones.
- No hay acceso actual a un Mac o servicio macOS, según ha indicado el propietario. Por tanto, la compilación y prueba de iOS están pendientes de disponer de ese entorno.

## Arquitectura propuesta y decisión técnica

Mantener Next.js y Supabase como servicios existentes y construir un cliente móvil compartido para Android e iOS, reutilizando lógica y componentes compatibles donde resulte seguro. La base elegida es una aplicación híbrida instalable con proyectos Android/iOS nativos y archivos web empaquetados localmente; no cargará una URL remota ni se entregará como PWA. La estética seguirá el lenguaje visual de la web, con adaptación a navegación táctil, tamaños pequeños, áreas seguras y patrones propios de cada plataforma. Si las pruebas o la revisión de tienda demuestran que una pantalla necesita controles nativos específicos, se añadirá el módulo nativo correspondiente.

La elección definitiva requiere un prototipo de autenticación y una revisión de los contratos reales de las operaciones de finanzas. No modificar producción, esquemas de base de datos ni credenciales como parte del prototipo. La paridad de funcionalidades con la web es un criterio de aceptación: cada función existente debe quedar inventariada, implementada o documentada explícitamente como una limitación antes de dar la aplicación por entregada.

## Fases y criterios de aceptación

1. **Inventario y diseño:** identificar pantallas, operaciones, rutas protegidas, sesiones, callback de Google, exportación PDF, navegación y permisos. Definir contratos cliente-servidor, identificadores de aplicación y entorno de pruebas. Resultado: arquitectura y alcance contrastados con el código.
2. **Base móvil:** crear cliente compartido y proyectos Android/iOS; configurar navegación, iconos, pantalla inicial, áreas seguras, enlaces externos y estados sin conexión. Mantener los secretos en el servidor. Resultado: arranque comprobado en ambos sistemas.
3. **Sesión y privacidad:** adaptar correo, Google, confirmación y recuperación, persistencia y cierre de sesión; diseñar borrado de cuenta y datos con confirmación y controles del servidor. Probar redirecciones y aislamiento entre usuarios sin datos de producción.
4. **Funciones principales:** implementar y verificar ciclos, ingresos, gastos, categorías, presupuestos, panel, historial y ajustes; luego copiloto y exportación si forman parte de la versión. Comparar resultados con la web y probar fallos de red y duplicados.
5. **Distribución y políticas:** revisar la política vigente de compras digitales y las reglas de Apple y Google para cada producto ofrecido; definir datos de privacidad, cuentas de prueba, versiones y firma. No activar pagos ni publicar sin una decisión específica.
6. **Pruebas y entrega:** ejecutar pruebas automatizadas y manuales en Android e iPhone, incluido inicio de sesión, operaciones completas, interrupciones de red y accesibilidad. Generar un APK de prueba Android y una compilación iOS instalable mediante el método de distribución y firma disponible. Registrar versiones, resultados y limitaciones. La publicación en tiendas es una etapa separada.

### Avance realizado en esta copia

- Se ha creado el proyecto Capacitor Android en `mobile/android` con interfaz empaquetada localmente. El proyecto iOS generado queda fuera del alcance y no se trabajará hasta nueva instrucción.
- La base móvil incluye inicio de sesión por correo, resumen del ciclo abierto, consulta de gastos e ingresos, historial de ciclos cerrados y alta de gastos con `fn_create_expense`.
- `npm test` pasa 16 pruebas y `npm run build`/`npm run sync` pasan en la carpeta móvil.
- No hay evidencia de ejecución contra Supabase, dispositivo real, APK firmado, simulador iOS ni archivo IPA. Esos entregables siguen pendientes.
- El cliente servidor de Supabase acepta el encabezado `Authorization: Bearer` para que la aplicación móvil pueda reutilizar las rutas API autenticadas. Esta adaptación está compilada, pero aún requiere validación contra un entorno de pruebas autorizado.
- Se ha añadido el alta móvil de ingresos mediante `/api/incomes`; la base móvil pasa ahora 8 pruebas y vuelve a sincronizar Android/iOS correctamente.
- Se ha añadido la lectura y actualización de los ajustes financieros mediante `/api/settings`; las pantallas móviles siguen utilizando el token Bearer y no contienen claves de servicio.
- Android Studio, Android SDK y Java 21 se han instalado en Windows. La compilación Android se ha verificado correctamente con Gradle y ha generado `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (4.189.763 bytes; SHA-256 `C807468D877810A075BE10C1BFD0765EA2D57A006D946F767E883071988C80F9`).
- Se ha vuelto a sincronizar y recompilar la APK con la URL y la clave pública de Supabase del proyecto, y con `https://www.metodokakebo.com` como API base. Las claves privadas no se han incorporado. No hay dispositivo Android conectado: la instalación y el flujo autenticado todavía requieren una prueba manual en un teléfono o emulador.
- Se ha añadido el bloque de gastos fijos en Android: alta, listado, total activo, activar/desactivar y eliminar, con navegación móvil y pruebas automatizadas.
- Se ha añadido el asistente móvil conectado al agente multiagente `/api/ai/agent`, enviando el token Bearer y el historial de conversación y respetando la autorización premium del backend, con estados de carga/error y prueba automatizada.
- Se ha añadido la pantalla de métricas de IA conectada a `/api/ai/metrics`, con métricas agregadas, aprendizaje y logs recientes, además de su prueba de autorización Bearer.
- Se ha añadido la pantalla de informes conectada a `/api/reports`, con periodos, resumen financiero, desglose por categoría y exportación CSV, además de su prueba de API autenticada.
- Se ha añadido la pantalla de plan/suscripción, conectada al perfil de Supabase. Refleja el acceso gratuito o Plus y documenta de forma explícita que los endpoints de Stripe del backend están desactivados actualmente; no se inventa un flujo de pago en Android.
- La autenticación Android ya usa `persistSession: true`, renovación automática y recuperación de sesión al abrir la aplicación; no guarda claves de servicio.
- La pantalla de autenticación Android incluye inicio de sesión, registro y recuperación de contraseña mediante Supabase Auth.
- Se ha añadido la gestión móvil de ciclos mediante `/api/months`: listado, abrir/reutilizar ciclo y cerrar ciclo con apertura automática del siguiente según la lógica existente.
- Los ajustes Android se han alineado con el contrato real de la tabla `user_settings` usado por la web, incluyendo presupuestos, saldo y los controles `ai_confirm_writes` y `allow_collective_learning`; ya no dependen de los nombres incompatibles de la API genérica.
- La lista Android de movimientos ahora permite editar y eliminar gastos mediante `PATCH`/`DELETE /api/expenses/[id]`, manteniendo la autorización Bearer y los bloqueos del backend para ciclos cerrados. Se han mantenido 16 pruebas automatizadas superadas y se ha regenerado la APK debug; SHA-256 actual `2F582CA5EB841519B5FD2029DA7E0D5631E75BA45E7A0DD1959DEF97E76EF3E2`.
- La misma lista permite eliminar ingresos mediante Supabase, igual que la gestión de ingresos de la web, con filtro por usuario y refresco tras la operación. Las 16 pruebas y la compilación Android siguen pasando.
- El asistente Android se ha alineado con `/api/ai/agent-v2/stream`: procesa SSE progresivo, muestra texto incremental y requiere confirmación explícita antes de reenviar un `confirmationId` opaco para operaciones de escritura. Se ha probado con un evento SSE simulado y se ha regenerado la APK debug actual con SHA-256 `5E5D2601F74C40E3A32948296D98F6B4D56C9D297E9DD4693E54EFCB35BAC2C5`; la instalación y el arranque de esta versión exacta han sido correctos en `emulator-5554`.
- El dashboard Android ahora consulta y muestra el gasto frente al límite de las cuatro categorías (`budget_supervivencia`, `budget_opcional`, `budget_cultura`, `budget_extra`) junto al resumen de ingresos, gastos, disponible y ahorro.
- Se ha ajustado la presentación móvil para acercarla a la estética web: tipografía serif en títulos, paleta piedra, tarjetas, navegación pegajosa y estados de interacción. La APK debug resultante tiene SHA-256 `6A2102EA6CE9484E22B8DB521F4D654EA6F50BEA12475B53713F89C18CE33509` y se ha instalado y arrancado correctamente en `emulator-5554`.
- Se ha verificado la conectividad anónima contra `https://www.metodokakebo.com`: `GET /api/months` responde `401 UNAUTHORIZED` y `POST /api/ai/agent-v2/stream` responde `401 Unauthorized`, confirmando que el backend publicado está accesible y mantiene la protección de sesión. No se ha usado ninguna credencial.
- Auditoría del APK actual: no aparecen `service_role`, `SUPABASE_SERVICE_ROLE`, `sk_live_`, `STRIPE_SECRET`, `CRON_SECRET` ni `OPENAI_API_KEY`; la compilación solo incorpora configuración pública de cliente.
- Metadatos Android comprobados con `aapt`: paquete `com.metodokakebo.app`, versión `1.0` (versionCode `1`), SDK mínimo `24`, target SDK `36`, y permisos limitados a Internet y el receptor dinámico no exportado de Capacitor.
- La aplicación muestra un aviso explícito cuando el dispositivo pierde Internet y lo retira al recuperarla. Esta APK se ha instalado y arrancado en el emulador sin `FATAL EXCEPTION` ni `AndroidRuntime`; SHA-256 `8481353961F886DB002ECC15ED41D09B5C2517DE3D47392A5B136966B081D85C`.
- Se ha añadido una barrera de errores de interfaz: un fallo inesperado de una pantalla muestra una recuperación controlada sin cerrar toda la aplicación. Las 16 pruebas siguen pasando y la APK resultante se ha instalado y arrancado sin excepciones; SHA-256 `6FE8E8AFB6E75FAD00652F45AA440342D36F65E6890B399F5A1DC5E76F2B0CF3`.
- Auditoría de configuración corregida: el bundle final contiene `signInWithPassword`, la URL Supabase pública y `https://www.metodokakebo.com`; ya no depende de una variable temporal para localizar la API. La APK final se ha instalado y arrancado sin excepciones; SHA-256 `D5F5AEFACB9D0FA3A552CE181D4A1A8B01126BD1C1D404DA2ECD8158E0D603A7`.
- Se ha añadido acceso con Google en Android mediante el plugin Browser de Capacitor, receptor `appUrlOpen`/`getLaunchUrl` y deep link `com.metodokakebo.app://auth/callback`. El callback admite tanto el flujo PKCE (`?code=`) como el flujo implícito de Supabase (`#access_token=&refresh_token=`). La URL debe estar en la lista Redirect URLs del proyecto Supabase.
- La APK corregida se ha instalado y el deep link se ha probado con Android: `am start` resuelve `com.metodokakebo.app://auth/callback` hacia `com.metodokakebo.app/.MainActivity`. SHA-256 actual `8CA3E51CBF9EF52E4F7F2BEE46FB32468556B6BFCBDA1367F3FBB1D5279E2432`. El bloqueo observado se debía a que el callback real devolvía tokens en el fragmento y la versión anterior solo procesaba `code`; ya está corregido.

## Bloqueos y dependencias del alcance Android

- Android: la APK actual (`2F582CA5EB841519B5FD2029DA7E0D5631E75BA45E7A0DD1959DEF97E76EF3E2`) se ha instalado y arrancado en el emulador `kakeboApi35` (`emulator-5554`) con `adb install -r` correcto, `MainActivity` en primer plano y sin `FATAL EXCEPTION`/`AndroidRuntime` asociado. La jerarquía de accesibilidad confirma el WebView de la aplicación. Sigue pendiente validar el flujo autenticado y operaciones contra un entorno de pruebas autorizado; la APK debug no es una versión firmada de distribución.
- Determinar identificadores definitivos, nombre e identidad visual antes de la distribución; no inventar cuentas ni credenciales.
- Las políticas de las tiendas y la disponibilidad real de los servicios deben revisarse en el momento de entregar o publicar. No presentar una compilación sin pruebas de dispositivo como producto terminado.

## Referencias

- [Requisitos de Capacitor para una aplicación web existente](https://capacitorjs.com/docs/getting-started)
- [Configuración de Capacitor y uso de server.url](https://next.capacitorjs.com/docs/next/config)
- [Requisitos de entorno de Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Normas de revisión de Apple](https://developer.apple.com/app-store/review/guidelines/)
- [Política de pagos de Google Play](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en)
