<div align="center">

<img src="https://img.shields.io/badge/Kakebo-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="Kakebo" />

# 🏮 Kakebo

### *Finanzas personales con método japonés e Inteligencia Artificial*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#-características"><strong>Características</strong></a> ·
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="#-documentación"><strong>Docs</strong></a>
</p>

</div>

---

# Kakebo — Case Study (Portfolio)

**Kakebo** es una app **full-stack** de budgeting inspirada en el método Kakeibo, construida como **producto real** (no demo) y diseñada para demostrar capacidades de **AI + automatización + data + UX**.

- **Demo:** <<www.metodokakebo.com>>
- **Stack:** Next.js + TypeScript + Tailwind, Supabase (Postgres/RLS), OpenAI (tool/function calling + streaming), Vercel
- **Rol:** End-to-end (producto, arquitectura, DB, frontend, backend, IA, despliegue)

## Problema

La mayoría de apps de finanzas personales son "cajas negras" o cobran por funciones básicas. Quería un sistema propio para:
- registrar ingresos/gastos con categorías,
- controlar presupuestos mensuales y sub-presupuestos,
- visualizar métricas claras,
- y contar con un **copiloto IA** capaz de responder y calcular sobre mis datos.

## Solución (qué hace)

- **Gestión de presupuestos y gastos** (mensual, categorías y sub-presupuestos)
- **Dashboard y métricas** (visión de estado, evolución y hábitos de gasto)
- **Copiloto IA** con herramientas: clasifica gastos, responde preguntas ("si gasto X, ¿cuánto me queda?"), y ayuda a mantener el sistema ordenado
- **Auth + seguridad**: control de acceso y permisos con **Row-Level Security (RLS)** en Postgres

## Modelo de negocio

**Kakebo es gratuito.** No hay trial, no hay planes de pago, no hay paywalls.

La monetización futura se basa en:
- Blog financiero con SEO orgánico
- Afiliación a productos financieros (bancos digitales, apps, comparadores)
- Comparativas y recursos recomendados

## Arquitectura (alto nivel)

**UI (Next.js)** → **API/Server Actions** → **Supabase (Postgres + RLS)**  
Copiloto IA: **LLM con tool calling** → lee datos (select) → calcula → propone acciones → (opcional) escribe con confirmación del usuario  
Streaming de respuestas para UX tipo "chat" (SSE/streaming).

## Highlights técnicos (lo que demuestra)

- **Diseño de data model** para budgeting (entidades, categorías, agregaciones)
- **Seguridad real** con RLS y control de permisos por usuario
- **Integración LLM** con tool/function calling (y reglas de escritura segura)
- **Experiencia de producto**: UX clara, flujos simples, y métricas entendibles
- **Despliegue** (Vercel) y prácticas de proyecto listas para entorno real

## Por qué importa (para un rol técnico)

Kakebo no es "una web bonita": es un **sistema de datos + producto** que integra IA de forma útil, con seguridad, y con capacidad de escalar a un producto real.

## Roadmap (próximos pasos)

- Memoria y personalización del copiloto (preferencias + hábitos)
- Mejora de observabilidad (logs, trazas, métricas de uso del copiloto)
- Reglas de negocio más avanzadas (objetivos, alertas, recomendaciones)
- Importación de movimientos (CSV/banco) y conciliación
- Blog financiero como activo SEO principal

## Contacto

**Aitor Alarcón Muñoz** — <<https://www.linkedin.com/in/aitoralarcon/>> — <<aitor@aitoralmu.xyz>>

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

### 🤖 Kakebo Copilot

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
```

**Powered by GPT-4o-mini con Function Calling + herramientas especializadas**

</details>

### 💰 Gestión Financiera

- ✅ **Método Kakebo Digital**: Clasificación automática en Supervivencia, Opcional, Cultura, Extra.
- 📅 **Calendario Inteligente**: Vista mensual con estados (Abierto/Cerrado) y desglose de días restantes.
- 💸 **Gestión de Ingresos Flexible**: Soporte para nóminas, extras y regalos con cálculo de "Dinero Realmente Disponible".
- 🎯 **Presupuestos Dinámicos**: Configura límites por categoría y recibe alertas visuales.
- 💳 **Registro Dual**: Añade gastos vía Chat (Copilot) o interfaz rápida (Quick Add).
- 🔄 **Embeddings Automáticos**: Sistema de búsqueda semántica que aprende automáticamente cada 5 gastos (global).

### 📄 Reportes & Análisis

- 📑 **Reportes PDF**: Genera informes mensuales detallados para guardar o imprimir.
- 📊 **Análisis Visual**: Gráficos de distribución (Donut) y evolución (Barras).
- 💾 **Exportación**: Tus datos siempre disponibles, exportables también nativamente a CSV y Excel (XLS).

### 🎨 Diseño Zen (Wabi-Sabi)

- 🌸 Interfaz minimalista que reduce la ansiedad financiera.
- 🌓 **Modo Oscuro** automático y cuidado.
- 📱 **Totalmente Responsive** (PWA-ready).

### 🛠️ Herramientas Gratuitas (SEO Magnets)

- 📖 **Tutorial Interactivo Kakebo**: Guía paso a paso sobre el método y uso de la plataforma.
- 📉 **Calculadora de Inflación**: Visualiza la pérdida de poder adquisitivo de tus ahorros.
- 🍰 **Regla 50/30/20**: Distribuye tu sueldo idealmente entre necesidades, caprichos y ahorro.

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

# Admin & Config
NEXT_PUBLIC_ADMIN_EMAILS=tu-email@ejemplo.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend

- ⚡ **Next.js 16** (App Router)
- ⚛️ **React 19**
- 🔷 **TypeScript**
- 🎨 **Tailwind CSS**
- 📊 **Recharts**
- 📄 **React-PDF Renderer**
- 🌍 **next-intl** (i18n)

</td>
<td valign="top" width="50%">

### Backend

- 🟢 **Next.js API Routes**
- 🐘 **PostgreSQL** (Supabase)
- 🔐 **Supabase Auth**
- 🧠 **OpenAI API** (GPT-4o-mini)
- 🔍 **pgvector** (embeddings)

</td>
</tr>
</table>

---

## 📖 Documentación

### 📚 Guías Principales

- [📘 Arquitectura del Sistema](CONTEXT.md) - Overview completo
- [📋 Decisiones Arquitectónicas](ADRs.md) - ADRs del proyecto
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Deploy a producción
- [🧪 Testing Guide](docs/MANUAL_TESTING_GUIDE.md) - Testing manual

---

## 📦 Changelog

### v4.0.0 (2026-06-15) — Migración a herramienta gratuita

- Eliminado modelo SaaS y Stripe
- Eliminados trial, pricing y paywalls
- Todo usuario autenticado tiene acceso completo
- Monetización futura: blog, SEO, afiliación

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
