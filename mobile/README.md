# Kakebo móvil para Android

Esta carpeta contiene la aplicación Android híbrida de Kakebo. Incluye autenticación, sesión persistente, dashboard, presupuestos, movimientos, historial, ciclos, gastos fijos, asistente IA con streaming y confirmaciones, métricas, informes, ajustes y estado del plan. La aplicación empaqueta sus propios archivos web y funciona como APK instalada; no es una PWA ni carga la web mediante `server.url`. La versión iPhone queda aplazada hasta nueva instrucción.

El acceso con Google usa el navegador del sistema solo durante la autenticación y vuelve a la APK mediante el enlace profundo `com.metodokakebo.app://auth/callback`. Para activarlo en Supabase, añade exactamente esa URL en Authentication → URL Configuration → Redirect URLs y asegúrate de tener Google habilitado como proveedor OAuth. La APK abre el navegador con el plugin Browser de Capacitor, procesa tanto el retorno en caliente como el arranque mediante deep link y cierra el navegador al recuperar la sesión.

El identificador actual es `com.metodokakebo.app`. Las claves privadas nunca se incorporan al cliente: solo se usan la URL Supabase, la clave pública anon y la URL pública de la API.

Con Node 22 o superior: `npm ci`, `npm run sync`. Para compilar Android se necesitan JDK y SDK Android. Véase `docs/planning/aplicaciones-moviles.md`.

Para probar el acceso, crear `mobile/.env.local` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_API_BASE_URL` de un entorno de pruebas autorizado antes de ejecutar `npm run sync`. El alta de gastos usará `/api/expenses` con el token Bearer cuando `VITE_API_BASE_URL` esté configurada; sin ella queda disponible una ruta provisional directa a `fn_create_expense` para pruebas aisladas. Las variables se incorporan al cliente: solo deben contener la URL, la clave pública y la URL del API, nunca una clave de servicio. No copiar automáticamente las credenciales del proyecto web ni utilizar datos de producción para esta prueba.

Android Studio, Android SDK y Java 21 están instalados. La compilación Android genera `android/app/build/outputs/apk/debug/app-debug.apk`. Para instalarla directamente en un teléfono, habilita la instalación de aplicaciones desconocidas y abre ese archivo; para depuración puede usarse `adb install -r`. Es una APK debug instalable, no una versión firmada para Google Play.

Estado actual verificable: `npm test` pasa 16 pruebas; `npm run build`, `npm run sync` y `./android/gradlew assembleDebug` pasan. La APK se ha instalado y arrancado en el emulador `kakeboApi35` sin excepciones fatales. La validación autenticada con una cuenta real de Supabase requiere una cuenta de pruebas autorizada. La versión iPhone queda aplazada.
