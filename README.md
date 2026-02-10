<div align="center">

<img src="https://img.shields.io/badge/Kakebo-AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="Kakebo AI" />

# 🏮 Kakebo AI

### *Tu asistente financiero personal con IA que aprende de ti*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#-características"><strong>Características</strong></a> ·
  <a href="#-demo"><strong>Demo</strong></a> ·
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="#-documentación"><strong>Docs</strong></a> ·
  <a href="#-freemium-model"><strong>Pricing</strong></a>
</p>

</div>

---

## 🌸 ¿Qué es Kakebo?

**Kakebo** es una aplicación moderna de gestión financiera inspirada en el método japonés tradicional, pero potenciada con **Inteligencia Artificial de última generación**.

A diferencia de otras apps financieras, Kakebo AI:

- 🧠 **Aprende de ti**: Se vuelve más inteligente con cada interacción
- 💬 **Habla tu idioma**: Consultas en lenguaje natural, sin jerga técnica
- 🎯 **Se adapta**: Ajusta su comportamiento según la calidad de tus datos
- 🌍 **Aprende globalmente**: Se beneficia del conocimiento compartido de todos los usuarios (respetando tu privacidad)

---

## ✨ Características

### 🤖 Agente IA Premium

<details>
<summary><b>Chat conversacional ilimitado</b></summary>

Pregunta cualquier cosa sobre tus finanzas en **lenguaje natural**:

```
👤 "Busca vicios del mes pasado"
🤖 "He encontrado 12 gastos relacionados con vicios (€127.50)..."

👤 "¿Cuánto he gastado en restaurantes caros?"
🤖 "Has gastado €245 en restaurantes este mes. Es un 30% más que el mes anterior..."

👤 "La insulina NO es un vicio"
🤖 "Entendido. He aprendido que 'insulina' no debe considerarse vicio. ✓"
```

**Powered by GPT-4o-mini con Function Calling**

</details>

<details>
<summary><b>Sistema de aprendizaje (Personal + Global)</b></summary>

Kakebo AI **aprende permanentemente**:

1. **Feedback Personal**: Corrige cualquier resultado y el AI lo recuerda para siempre
2. **Consenso Global**: Si 3+ usuarios corrigen lo mismo, todos se benefician
3. **Búsqueda Semántica**: Encuentra conceptos relacionados aunque uses palabras diferentes

**Ejemplo de aprendizaje colectivo:**
```
7 usuarios: "insulina" = NO es vicio
3 usuarios: "insulina" = Sí es vicio
→ 70% consenso → Marcado globalmente como NO vicio
```

**Privacidad garantizada**: Solo se comparte el patrón (ej: "X NO es Y"), nunca tus datos personales.

</details>

<details>
<summary><b>Análisis avanzado</b></summary>

- 📊 **Patrones de gasto**: Identifica tendencias por categoría
- 🔮 **Predicciones**: Proyecta cuánto gastarás al final del mes
- ⚠️ **Detección de anomalías**: Te avisa de gastos inusuales
- 📈 **Trends históricos**: Compara con meses anteriores

</details>

### 💰 Gestión Financiera

- ✅ **Categorías Kakebo** auténticas: Supervivencia, Opcional, Cultura, Extra
- 📅 **Vista calendario** con control mensual
- 💳 **Tracking de gastos** rápido y visual
- 🎯 **Presupuestos por categoría**

### 📄 Reportes Premium

- 📑 **PDF profesionales** con gráficos
- 📊 **Análisis detallado** por periodo
- 💾 **Exportación** de datos

### 🎨 Diseño Wabi-Sabi

- 🌸 Estética zen inspirada en Japón
- 🌓 **Modo oscuro** perfecto
- 📱 **Responsive** (móvil, tablet, desktop)
- ⚡ **Rápido** y fluido

---

## 🎬 Demo

> 🚧 **Screenshots en desarrollo**  
> Muy pronto añadiremos capturas del dashboard, chat AI, y reportes.

**Live Demo**: [kakebo-app.vercel.app](https://kakebo-app.vercel.app) *(pending)*

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

# OpenAI (AI Agent)
OPENAI_API_KEY=sk-proj-...

# Stripe (Pagos)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_PRICE_DISPLAY=3.99€

# Admin
NEXT_PUBLIC_ADMIN_EMAILS=tu-email@ejemplo.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
USE_FUNCTION_CALLING_AGENT=true
```

**Guías**:
- [Configurar Supabase](#-supabase-setup)
- [Configurar Stripe](#-stripe-setup)
- [Obtener OpenAI API Key](https://platform.openai.com/api-keys)

---

## 💎 Freemium Model

### 🆓 Tier Gratis

**Para siempre gratis**, incluye:

- ✅ Tracking de gastos ilimitado
- ✅ Dashboard con gráficos
- ✅ Vista calendario
- ✅ Presupuestos por categoría
- ✅ Categorización manual

### ⭐ Tier Premium — **€3.99/mes**

Desbloquea:

- 🤖 **Chat AI ilimitado** con el agente inteligente
- ✨ **Clasificación automática** de gastos con IA
- 📄 **Reportes PDF** profesionales
- 🔮 **Análisis predictivo** avanzado
- 🎯 **Detección de anomalías**
- 🌍 **Aprendizaje global** de la comunidad

**💝 Trial de 15 días** al suscribirte via Stripe

### 🎁 VIP Access

Acceso premium manual para:
- 👥 Beta testers
- ❤️ Amigos y familia
- 🛠️ Contributors

*Contacta al admin para solicitar acceso VIP*

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

### 🤖 AI Architecture

- **Model**: GPT-4o-mini con Function Calling
- **Embeddings**: text-embedding-3-small (1536 dims)
- **Vector Store**: PostgreSQL + pgvector
- **Learning**: Feedback híbrido (personal + global consensus)

---

## 📖 Documentación

### 📚 Guías Principales

- [📘 Arquitectura del Sistema](CONTEXT.md) - Overview completo
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Deploy a producción
- [🧪 Testing Guide](docs/MANUAL_TESTING_GUIDE.md) - Testing manual

### 🤖 KakeBot AI

- [🧠 AI Agent Architecture](docs/KAKEBOT_V2_ARCHITECTURE.md) - Cómo funciona el agente
- [📡 API Documentation](docs/API_DOCUMENTATION.md) - Endpoints y ejemplos
- [🔄 Learning System](CONTEXT.md#learning-system-architecture) - Sistema de aprendizaje

### 💰 SaaS & Freemium

- [💎 Freemium Setup](#-freemium-model) - Configuración de tiers
- [💳 Stripe Integration](stripe_setup_guide.md) - Configurar pagos
- [👑 Admin Panel](#-admin-panel) - Gestión de VIPs

---

## 🏗️ Estructura del Proyecto

```
kakebo/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (landing)/            # Landing page
│   │   ├── app/                  # App dashboard
│   │   │   ├── admin/            # Admin panel (VIP grants)
│   │   │   ├── agent/            # AI Chat page
│   │   │   └── new/              # Create expense
│   │   └── api/
│   │       ├── ai/               # AI endpoints
│   │       ├── admin/            # Admin APIs
│   │       ├── stripe/           # Stripe integration
│   │       └── webhooks/         # Stripe webhooks
│   ├── lib/
│   │   ├── agents-v2/            # AI Agent (v2 - current)
│   │   │   ├── function-caller.ts     # Orchestrator
│   │   │   ├── prompts.ts             # System prompts
│   │   │   └── tools/                 # Tool definitions + executor
│   │   ├── agents/               # Tool implementations
│   │   │   └── tools/
│   │   │       ├── search-expenses.ts      # Semantic search
│   │   │       ├── feedback.ts             # Learning system
│   │   │       ├── spending-analysis.ts
│   │   │       ├── predictions.ts
│   │   │       └── trends.ts
│   │   ├── ai/                   # AI utilities
│   │   │   └── embeddings.ts     # OpenAI embeddings
│   │   ├── auth/                 # Auth & Access Control
│   │   │   └── access-control.ts # Premium access logic
│   │   └── supabase/             # Supabase clients
│   │       ├── client.ts         # Browser client
│   │       ├── server.ts         # Server client
│   │       └── admin.ts          # Admin client (service role)
│   ├── components/               # React components
│   │   ├── saas/                 # Freemium components
│   │   │   ├── SubscriptionGuard.tsx
│   │   │   └── PremiumPrompt.tsx
│   │   └── reports/              # PDF reports
│   │       ├── ReportDialog.tsx
│   │       └── ReportPDF.tsx
│   └── __tests__/                # Tests
│       └── agents-v2/            # 40+ tests
├── supabase/                     # Database migrations
│   └── migrations/
├── docs/                         # Documentation
└── .env.local                    # Environment variables (not in git)
```

---

## 📊 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Dev server (port 3000)
npm run build            # Build producción
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm test -- agents-v2 --run   # Test AI agent

# Linting
npm run lint             # Check code quality

# Database
npm run db:push          # Push schema changes to Supabase
npm run db:migrate       # Run migrations
```

---

## 🔐 Configuración de Servicios

### 🗄️ Supabase Setup

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Ejecuta las migraciones SQL:
   - `supabase_migration_saas.sql` (profiles + SaaS)
   - `search_feedback_migration.sql` (learning system)
   - `update_trigger_to_free.sql` (free tier por defecto)
3. Habilita extensión `pgvector` en SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copia las keys de Settings → API

### 💳 Stripe Setup

1. Crea cuenta en [stripe.com](https://stripe.com)
2. Crea producto "Kakebo Premium": €3.99/mes con trial de 15 días
3. Configura webhook endpoint: `/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.deleted`
4. Copia Price ID y keys

**Ver guía detallada**: [stripe_setup_guide.md](stripe_setup_guide.md)

### 🤖 OpenAI Setup

1. Obtén API key en [platform.openai.com](https://platform.openai.com/api-keys)
2. Añade a `.env.local`
3. **Costo estimado**: ~$0.002-0.005 por conversación

---

## 👑 Admin Panel

Accede a `/app/admin` para:

- ✅ Otorgar acceso VIP manual
- ❌ Revocar acceso VIP
- 📋 Ver lista de usuarios VIP

**Configuración**:
```env
NEXT_PUBLIC_ADMIN_EMAILS=tu-email@ejemplo.com,otro@ejemplo.com
```

Requiere `SUPABASE_SERVICE_ROLE_KEY` para funcionar.

---

## 🧪 Testing

```bash
# Run all tests
npm test -- agents-v2 --run

# Expected: 40/40 tests passing ✓
```

**Coverage:**
- ✅ Function caller (15 tests)
- ✅ Hardening integration (10 tests)
- ✅ Sprint 2 features (15 tests)

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| **AI Response Time** | < 2.5s (p95) |
| **Cost per 1K queries** | < $5 |
| **Error Rate** | < 1% |
| **LLM Calls per query** | 1-2 (40-60% faster than v1) |

---

## 🌍 Roadmap

### ✅ Completado

- [x] Modelo freemium con Stripe
- [x] AI Agent v2 con Function Calling
- [x] Sistema de aprendizaje (personal + global)
- [x] Admin panel para VIP grants
- [x] Reportes PDF
- [x] Búsqueda semántica
- [x] Modo oscuro Wabi-Sabi

### 🚧 En progreso

- [ ] Stripe webhooks en producción
- [ ] Screenshots para README
- [ ] Tests E2E completos

### 🔮 Futuro

- [ ] App móvil (React Native)
- [ ] Integraciones bancarias (Plaid)
- [ ] Multi-idioma (EN, JP)
- [ ] Consenso regional (país/cultura)
- [ ] Confidence scores en feedback
- [ ] Analytics dashboard para admin

---

## 🤝 Contribuir

Este es un proyecto privado. Para miembros del equipo:

1. Fork el repo
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

**Guidelines:**
- ✅ Tests para nuevas features
- ✅ Seguir estructura del proyecto
- ✅ Comentarios en código complejo
- ✅ Actualizar documentación

---

## 📝 Changelog

### v2.1.0 (2026-02-10) - Freemium Model ✨

**Nuevo:**
- 💎 Modelo freemium completo (free + premium €3.99)
- 👑 Admin panel para VIP grants
- 🔐 Service role key para operaciones admin
- 💳 Integración Stripe (80% completa)
- 🎨 Dark mode fixes en prompts premium

### v2.0.0 (2026-02-09) - AI Agent v2 🤖

**Nuevo:**
- 🧠 AI Agent v2 con OpenAI Function Calling
- 📚 Sistema de aprendizaje (feedback + consenso global)
- 🔍 Búsqueda semántica con embeddings
- 🎯 Adaptación según calidad de datos
- ⚡ 40-60% más rápido que v1

**Ver changelog completo**: [CHANGELOG.md](CHANGELOG.md)

---

## 📞 Soporte & Contacto

**Autor**: Aitor Alarcón Muñoz

- 💬 **Issues**: [GitHub Issues](https://github.com/mrsteppenwolf627/kakebo/issues)
- 📧 **Email**: [aitoralmu21@gmail.com](mailto:aitoralmu21@gmail.com)
- 📞 **Teléfono**: Disponible para consultas
- 📖 **Docs**: [CONTEXT.md](CONTEXT.md)

---

## 📜 Licencia

**Proprietary** - Todos los derechos reservados

© 2026 Kakebo AI. Este software es propiedad privada y no puede ser distribuido, modificado o usado sin permiso explícito.

---

## 🙏 Agradecimientos

**Inspirado en:**
- 📘 Método Kakebo tradicional japonés
- 🎨 Filosofía Wabi-Sabi
- ☸️ Principios Zen de simplicidad

**Powered by:**
- [OpenAI](https://openai.com) - GPT-4o-mini
- [Supabase](https://supabase.com) - PostgreSQL + Auth
- [Vercel](https://vercel.com) - Deployment
- [Stripe](https://stripe.com) - Payments

---

<div align="center">

**Hecho con ❤️ y 🤖 AI**

**Desarrollado por**: [Aitor Alarcón Muñoz](mailto:aitoralmu21@gmail.com)

[⬆ Volver arriba](#-kakebo-ai)

</div>
