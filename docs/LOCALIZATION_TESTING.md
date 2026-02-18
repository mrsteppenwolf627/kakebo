# 🌍 Guía de Testing de Localización - Kakebo

**Objetivo:** Validar que la internacionalización (i18n) funcione correctamente en todas las páginas públicas y privadas.

## 📋 Checklist de Verificación

### 1. Detección de Idioma
- [ ] Entrar a `kakebo.app` (o `localhost:3000`) sin path.
- [ ] Debe redirigir automáticamente a `/es` o `/en` según el navegador.
- [ ] Cambiar idioma del navegador y verificar la redirección.

### 2. Navegación y Rutas
- [ ] Navegar a `/es` -> Debe mostrar contenido en Español.
- [ ] Navegar a `/en` -> Debe mostrar contenido en Inglés.
- [ ] Verificar que el **Language Switcher** en el Navbar funcione correctamente y cambie la URL.

### 3. Traducción de Páginas Públicas
Verificar que los textos clave estén traducidos en:
- [ ] **Landing Page** (`/`)
  - Hero title, description, features.
- [ ] **Privacy Policy** (`/privacy`)
  - Título, secciones legales, fecha de actualización.
- [ ] **Cookies Policy** (`/cookies`)
  - Banner de cookies (si aparece), texto de política.
- [ ] **Terms & Conditions** (`/terms`)
  - Cláusulas legales.

### 4. Componentes Globales
- [ ] **Navbar**: Enlaces (Blog, Herramientas, Login) traducidos.
- [ ] **Footer**: Enlaces legales y copyright traducidos.
- [ ] **Metadata**:
  - `title` y `description` deben cambiar según el idioma en la pestaña del navegador.
  - Verificar `og:locale` en el código fuente.

## 🛠️ Pruebas Técnicas

### 1. Build Verification
Ejecutar el comando de build para asegurar que no hay claves faltantes:
```bash
npm run build
```
*Debe terminar con "Exit code: 0" y sin errores de validación de claves `t(...)`.*

### 2. Archivos de Traducción
- Verificar que `messages/es.json` y `messages/en.json` tengan estructura simétrica.
- Ninguna clave debe faltar en uno de los idiomas (Next-intl suele avisar en consola dev).

## 🚨 Edge Cases
- [ ] Navegar a una ruta no existente (`/es/ruta-falsa`) -> Debe mostrar 404 traducido (si aplica) o genérico.
- [ ] Cambiar manualmente la URL de `/es/privacy` a `/en/privacy` -> Debe cargar la versión en inglés correctamente.
