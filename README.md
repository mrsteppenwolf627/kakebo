<div align="center">

<img src="https://img.shields.io/badge/Kakebo-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="Kakebo" />

# 🏮 Kakebo

### *Finanzas personales con método japonés e Inteligencia Artificial*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#-características"><strong>Características</strong></a> ·
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="#-documentación"><strong>Docs</strong></a> ·
  <a href="#-freemium-model"><strong>Pricing</strong></a>
</p>

</div>

---

## 🌸 ¿Qué es Kakebo?

**Kakebo** es una aplicación moderna de gestión financiera que digitaliza el método tradicional japonés de ahorro. Combina la filosofía del "ahorro consciente" con un **Copiloto Financiero IA** que te ayuda a registrar, entender y optimizar tus gastos sin esfuerzo.

A diferencia de un Excel o una app bancaria, Kakebo:

- 🧠 **Es Proactivo**: Tu copiloto sugiere presupuestos, detecta anomalías y proyecta tu ahorro.
- 💬 **Es Conversacional**: Registra gastos ("Café 2€") o consulta datos ("¿Cuánto gasté en ocio?") por chat.
- 🎯 **Es Metódico**: Se basa en las 4 categorías Kakebo (Supervivencia, Opcional, Cultura, Extra) para dar sentido a tu dinero.
- 🌍 **Es Privado**: Tus datos son tuyos. El sistema aprende patrones globales sin exponer tu información.

---

## ✨ Características

### 🤖 Kakebo Copilot (v3)

<details>
<summary><b>Tu Asistente Financiero Personal</b></summary>

**El Copilot no solo responde, ¡ACTÚA!** Gestiona tus finanzas conversacionalmente:

```
👤 "Registra 50€ de comida"
🤖 "¿Quieres que registre un gasto de 50€ en supervivencia con concepto 'comida'?"
👤 "Sí"
🤖 "✅ Registrado: Gasto de 50€ en supervivencia - 'comida'"

👤 "Cambia el último gasto a 45€"
🤖 "¿Cambio el importe de 50€ a 45€?"
👤 "Sí"
🤖 "✅ Actualizado: importe modificado"

👤 "Quiero ahorrar 1200€ para vacaciones en agosto"
🤖 "¿Confirmas escenario 'Vacaciones Agosto' (1200€, categoría opcional)?"
👤 "Sí"
🤖 "✅ Escenario creado. Necesitas ahorrar 200€/mes durante 6 meses"
```

**Powered by GPT-4o-mini con Function Calling + 12 herramientas especializadas**

</details>

### 💰 Gestión Financiera Avanzada

- ✅ **Método Kakebo Digital**: Clasificación automática en Supervivencia, Opcional, Cultura, Extra.
- 📅 **Calendario Inteligente**: Vista mensual con estados (Abierto/Cerrado) y desglose de días restantes.
- 💸 **Gestión de Ingresos Flexible**: Soporte para nóminas, extras y regalos con cálculo de "Dinero Realmente Disponible".
- 🎯 **Presupuestos Dinámicos**: Configura límites por categoría y recibe alertas visuales.
- 💳 **Registro Dual**: Añade gastos vía Chat (Copilot) o interfaz rápida (Quick Add).
- 🎲 **Escenarios What-If**: Planifica gastos futuros y ve cómo afectan a tu ahorro.

### 📄 Reportes & Análisis

- 📑 **Reportes PDF**: Genera informes mensuales detallados para guardar o imprimir.
- 📊 **Análisis Visual**: Gráficos de distribución (Donut) y evolución (Barras).
- 💾 **Exportación**: Tus datos siempre disponibles.

### 🎨 Diseño Zen (Wabi-Sabi)

- 🌸 Interfaz minimalista que reduce la ansiedad financiera.
- 🌓 **Modo Oscuro** automático y cuidado.
- 🌓 **Modo Oscuro** automático y cuidado.
- 📱 **Totalmente Responsive** (PWA-ready).

### 🛠️ Herramientas Gratuitas (SEO Magnets)
- 📉 **Calculadora de Inflación**: Visualiza la pérdida de poder adquisitivo de tus ahorros.
- 🍰 **Regla 50/30/20**: Distribuye tu sueldo idealmente entre necesidades, caprichos y ahorro.
- 🕵️ **Analytics Privado**: Sistema de tracking propio sin cookies invasivas.

---

## 🚀 Quick Start

### Prerrequisitos

```bash
Node.js ≥ 18.0.0
npm ≥ 9.0.0
```

### Instalación en 3 pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/mrsteppenwolf627/kakebo.git
cd kakebo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus keys (ver abajo)

# 4. Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

### ⚙️ Variables de Entorno

Crea `.env.local` con:

```env
# Supabase (Database + Auth)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI (AI Copilot)
OPENAI_API_KEY=sk-proj-...

# Stripe (Suscripciones)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_PRICE_DISPLAY=3.99€

# Admin & Config
NEXT_PUBLIC_ADMIN_EMAILS=tu-email@ejemplo.com
NEXT_PUBLIC_APP_URL=http://localhost:3000 # O tu dominio en prod
USE_FUNCTION_CALLING_AGENT=true
```

---

## 💎 Modelo de Suscripción (SaaS)

### 🎁 14 Días Premium Gratis
**Todo incluido al registrarte. Sin tarjeta de crédito.**

Disfruta de la experiencia completa de Kakebo durante 14 días:
- 🤖 **Copilot Ilimitado**: Chat y acciones automáticas
- 📊 **Histórico Completo**: Acceso a meses anteriores
- 📄 **Reportes PDF**: Descarga tus balances

### 🔒 Después del Trial — **€3.99/mes**
Si decides continuar con la ayuda de la IA:
- Mantén acceso a todas las funcionalidades Premium
- Cancela cuando quieras

*Si no te suscribes, tu cuenta pasa a modo "Manual Básico" (solo registro manual limitado, sin histórico antiguo ni IA).*

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend

- ⚡ **Next.js 14** (App Router)
- ⚛️ **React 18**
- 🔷 **TypeScript**
- 🎨 **Tailwind CSS**
- 📊 **Recharts**
- 📄 **React-PDF Renderer**

</td>
<td valign="top" width="50%">

### Backend

- 🟢 **Next.js API Routes**
- 🐘 **PostgreSQL** (Supabase)
- 🔐 **Supabase Auth**
- 💳 **Stripe** (pagos)
- 🧠 **OpenAI API** (GPT-4o-mini)
- 🔍 **pgvector** (embeddings)

</td>
</tr>
</table>

### 🤖 AI Architecture (v3 - Copilot)

- **Model**: GPT-4o-mini con Function Calling
- **Agent Type**: Proactive Copilot
- **Tools**: 12 herramientas especializadas (Lectura + Escritura)
- **Memory**: PostgreSQL + pgvector para búsqueda semántica y aprendizaje.
- **Safety**: Confirmación explícita para acciones críticas (Write operations).

---

## 📖 Documentación

### 📚 Guías Principales

- [📘 Arquitectura del Sistema](CONTEXT.md) - Overview completo
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Deploy a producción
- [🧪 Testing Guide](docs/MANUAL_TESTING_GUIDE.md) - Testing manual

### 🤖 Kakebo Copilot Internals

- [🛠️ Guía de Implementación](KAKEBO_COPILOT_IMPLEMENTATION.md) - Arquitectura Copilot
- [🧠 AI Agent Architecture](docs/KAKEBOT_V2_ARCHITECTURE.md) - Cómo funciona el agente
- [📡 API Documentation](docs/API_DOCUMENTATION.md) - Endpoints y ejemplos

---

## 📝 Changelog Reciente

### v3.2.0 (2026-02-16) - Branding & Polish 💅

**Novedades:**
- 🏷️ **Rebranding**: Unificación de marca a **"Kakebo"**. Despliegue de nueva identidad en Landing y App.
- 💰 **Corrección Financiera**: Fix crítico en cálculo de ingresos (Base + Extras) y visualización de déficit.
- 🔗 **Dominios**: Fix en redirecciones (Stripe/Auth) para soportar dominios personalizados.

- 🌗 **UI**: Mejoras de contraste en Modo Oscuro y accesibilidad en calendarios.

### v3.4.0 (2026-02-17) - SEO & Social Proof 🌟

**Novedades:**
- 🔍 **SEO Aggressive**: Optimización de keywords de alto valor ("Sin bancos", "Gastos hormiga", "Alternativa a Excel").
- 🌟 **Testimonios**: Nueva sección de prueba social con historias de usuarios reales.
- 🧲 **Calculadora 50/30/20**: Corrección de enlaces y mejora de metadata para captación.
- 🏷️ **Metadatos**: Títulos y descripciones optimizados para CTR.

### v3.3.0 (2026-02-16) - SEO & Growth 🚀

**Novedades:**
- 🧲 **Link Magnets**: Nuevas calculadoras públicas (Inflación & 50/30/20) optimizadas para SEO/GEO.
- 📊 **Analytics**: Tracking de uso de herramientas respetuoso con la privacidad.
- 🚦 **Performance**: Mejora de Core Web Vitals (Fuentes & Imágenes).

### v3.1.0 (2026-02-13) - Experience Upgrade 🎨

- 💬 **Floating Chat**: Nuevo widget flotante para acceso rápido al Copilot.
- ⚡ **Performance**: Transiciones suaves y optimización de carga.
- 📱 **Mobile**: Fixes de scroll y teclado virtual.

**Ver changelog completo**: [CHANGELOG.md](CHANGELOG.md)

---

## 📜 Licencia

**Proprietary** - Todos los derechos reservados
© 2026 Kakebo. Este software es propiedad privada.

---

<div align="center">

**Hecho con ❤️ y 🤖 AI**
Desarrollado por: [Aitor Alarcón Muñoz](mailto:aitoralmu21@gmail.com)

[⬆ Volver arriba](#-kakebo)

</div>
