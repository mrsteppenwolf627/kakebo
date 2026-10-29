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
- **Copiloto IA** con herramientas: clasifica gastos, responde preguntas ("si gasto X, ¿cuánto me queda?"), y ayuda a mantener el sistema ordenado *(disponible hoy para todos; en la capa gratuita futura no se incluirá — ADR-003)*
- **Auth + seguridad**: control de acceso y permisos con **Row-Level Security (RLS)** en Postgres

## Modelo de negocio

**Estado actual (código en `main` y última evidencia de producción, 2026-10-05; modo compatible):** Kakebo es gratuito para todo usuario autenticado, sin planes de pago ni paywalls activos.

**Decisión de producto vigente (ADR-003), todavía NO activada:** la capa gratuita permitirá como máximo **30 gastos al mes** (mes natural en Europa/Madrid), **sin chatbot/IA conversacional, sin informes PDF y sin funciones premium/Plus**. Los usuarios existentes conservarán sus privilegios actuales. El trial queda **PENDIENTE DE DECISIÓN DEL PROPIETARIO** (no se confirma ninguna duración). Stripe y los pagos siguen desactivados. Detalle y estado de producción en [`docs/planning/phase3b-migration-runbook.md`](docs/planning/phase3b-migration-runbook.md).

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

- 📑 **Reportes PDF**: Genera informes mensuales detallados para guardar o imprimir. *(Disponible hoy para todos; en la capa gratuita futura no se incluirá — ADR-003.)*
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

## 🧾 Escáner de tickets — guía operativa completa

Esta sección documenta el escáner de tickets que se desarrolla en la rama
`feature/ticket-scanner-fase-8`. El escáner es una funcionalidad del único plan
de pago de la aplicación (Plus). Una cuenta Free puede ver el acceso y el
mensaje de mejora, pero no puede iniciar un escaneo. Esta restricción se aplica
en servidor y no debe sustituirse por un bypass de cliente.

### Estado actual y límites

- **Código publicado:** integrado en `main` y servido mediante el flujo
  automático de Vercel. El estado real del deployment debe verificarse en
  Vercel; un commit local no demuestra que un deployment esté listo.
- **Entorno de prueba recomendado:** Preview de Vercel con una cuenta Plus de
  prueba y un ciclo abierto. La producción no debe usarse para pruebas con
  tickets reales.
- **OCR piloto:** Azure Document Intelligence, modelo `prebuilt-receipt`.
- **Plan Azure:** Free F0; no se ha elegido un plan de pago.
- **País y moneda iniciales:** España y euros.
- **Cuota:** hasta 5 tickets por ciclo, no por fecha del calendario. El ciclo se
  reinicia cuando el usuario cierra su ciclo en la aplicación.
- **Tamaño máximo de imagen:** 5 MiB.
- **Tipos permitidos por Storage:** JPEG, PNG, HEIC y HEIF. La interfaz actual
  de captura/selección limita el envío a JPEG y PNG; si se amplía la interfaz
  a HEIC/HEIF, hay que actualizar también selector, validación, pruebas y esta
  documentación.
- **Imágenes:** se guardan temporalmente en un bucket privado y se eliminan
  después de la confirmación o del abandono. Nunca se sirven como archivos
  públicos.
- **Datos extraídos:** proveedor, fecha, total y líneas del ticket. Las líneas
  pueden dividirse y repartirse entre las cuatro categorías Kakebo.
- **Confirmación humana:** los campos dudosos y la clasificación deben poder
  revisarse antes de crear gastos reales.

La prueba interactiva completa del flujo Premium queda pendiente hasta disponer
de una cuenta Plus de prueba en staging. No se debe registrar una cuenta Free y
esperar que pueda usar el escáner: ese bloqueo es intencionado.

### Flujo funcional

1. El usuario autenticado entra en la pantalla del escáner.
2. El servidor comprueba la sesión, el acceso Plus y el ciclo abierto.
3. El usuario selecciona una imagen local y la sube al bucket privado temporal.
4. Se crea un ticket en estado de procesamiento y se consume una unidad de la
   cuota del ciclo.
5. Azure OCR devuelve una propuesta de proveedor, fecha, total y líneas.
6. La aplicación normaliza los datos y marca como dudosos los campos que no
   pueda interpretar con suficiente confianza.
7. El usuario revisa, corrige y divide las líneas entre categorías si hace falta.
8. La confirmación crea los gastos mediante la función protegida de Supabase y
   enlaza esos gastos con el ticket.
9. Tras confirmar, se elimina el original temporal. Si el usuario abandona el
   flujo, el ticket se conserva como pendiente durante 24 horas y después se
   limpia automáticamente.
10. Si el procesamiento falla, el ticket queda identificado como fallido y la
    unidad de cuota puede devolverse según la lógica de persistencia.

### Mapa de archivos del escáner

| Responsabilidad | Ubicación |
|---|---|
| Pantalla y flujo de interfaz | `src/app/[locale]/app/scanner/` |
| API de creación y carga | `src/app/api/scanner/` |
| Estado y borrador del ticket | `src/lib/scanner/draft.ts` |
| Contrato de gastos resultantes | `src/lib/scanner/expense-contract.ts` |
| Control de acceso Plus | `src/lib/scanner/access.ts` |
| Cliente OCR de Azure | `src/lib/scanner/azure-receipt-provider.ts` |
| Seguridad HTTP y esquemas Zod | `src/lib/scanner/http.ts` |
| Procesamiento y limpieza | `src/lib/scanner/cleanup.ts` |
| Migración diferida de staging | `supabase/deferred/ticket-scanner/20261027120000_ticket_scanner_persistence.sql` |
| Exclusión de líneas y reparto de gastos | `supabase/deferred/ticket-scanner/20261028170000_ticket_line_inclusion.sql` |
| Rollback de la migración | `supabase/rollback/scanner/20261027120000_ticket_scanner_persistence.rollback.sql` |
| Contratos y arquitectura | `docs/ticket-scanner/` |
| Tests del dominio y APIs | `src/__tests__/` y `src/lib/scanner/` |

No se debe mover la migración del directorio `supabase/deferred/` a
`supabase/migrations/` sin una revisión específica. La ubicación diferida evita
que `supabase db push` la aplique accidentalmente.

### Variables de entorno

Los valores reales nunca se guardan en Git, README, capturas ni mensajes. Solo
se documentan los nombres y su finalidad:

| Variable | Finalidad | Dónde se configura |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase | `.env.local` / Vercel Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público de Supabase | `.env.local` / Vercel Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones server-side restringidas | Solo servidor y Vercel, nunca cliente |
| `SCANNER_OCR_ENABLED` | Activa el adaptador OCR | `.env.local` / Vercel Preview |
| `SCANNER_OCR_REAL_DATA_APPROVED` | Permite el uso explícito del OCR piloto | `.env.local` / Vercel Preview |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Endpoint del recurso Azure OCR | `.env.local` / Vercel Preview |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | Clave secreta del recurso Azure OCR | Secret del entorno que ejecuta OCR; nunca cliente ni Git |
| `PLUS_SUBSCRIPTIONS_ENABLED` | Activa el sistema de suscripciones Plus | Solo cuando el flujo de billing de staging esté preparado |
| `STRIPE_SECRET_KEY` | Clave Stripe TEST para staging | Secret; nunca usar una clave LIVE en Preview |
| `STRIPE_PLUS_PRICE_MONTHLY_ID` | Precio mensual Plus de TEST | Vercel Preview |
| `STRIPE_PLUS_PRICE_ANNUAL_ID` | Precio anual Plus de TEST | Vercel Preview |
| `STRIPE_PLUS_PORTAL_CONFIGURATION_ID` | Configuración del portal de TEST | Vercel Preview |
| `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` | Firma del webhook de suscripciones | Secret de staging |
| `CRON_SECRET` | Autorización de la limpieza programada | Secret del entorno que ejecute el cron |

En PowerShell, las variables locales se cargan en la terminal que ejecutará el
servidor. No se debe imprimir el contenido de ninguna variable secreta. La
clave OCR debe cargarse mediante el gestor de secretos o el mecanismo privado
que utilice el entorno; no se debe asignar un objeto `SecureString` directamente
a una variable que la aplicación espera recibir como texto:

```powershell
$env:SCANNER_OCR_ENABLED = "true"
$env:SCANNER_OCR_REAL_DATA_APPROVED = "true"
$env:AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://<recurso>.cognitiveservices.azure.com/"
# Carga AZURE_DOCUMENT_INTELLIGENCE_KEY desde un gestor de secretos local.
npm run dev
```

La clave anterior es solo un ejemplo de carga local: el proceso de la
aplicación debe recibir una cadena y no debe registrarse el valor. En Vercel,
`AZURE_DOCUMENT_INTELLIGENCE_KEY` se crea como **Secret** en el entorno que
ejecuta el OCR. Para que funcione en producción debe existir también en
**Production**; los deployments anteriores no reciben variables añadidas
posteriormente y necesitan un nuevo deployment. El valor nunca debe aparecer
en README, logs, capturas, comandos compartidos o código cliente.

### Supabase: esquema y Storage

La migración crea estas tablas privadas:

- `public.scanner_tickets`: un intento de escaneo ligado al usuario y al ciclo.
- `public.scanner_ticket_lines`: líneas editables mientras el ticket está en
  revisión.
- `public.scanner_quota_ledger`: consumos y devoluciones de cuota por ciclo.
- `public.scanner_expense_links`: relación entre ticket confirmado y gastos.

También crea las funciones protegidas `fn_scanner_create_ticket_v2`,
`fn_scanner_start_processing`, `fn_scanner_confirm_ticket` y
`fn_scanner_cleanup_candidates`, entre otras funciones de transición y borrado.
Las cuatro tablas tienen RLS activado.

El bucket privado se llama `kakebo-ticket-temp` y debe tener:

- `public = false`;
- límite de 5 MiB;
- MIME permitido `image/jpeg`, `image/png`, `image/heic` y `image/heif`;
- políticas privadas de insertar, leer y borrar solo el objeto propio del
  usuario.

Para comprobar el estado sin mostrar secretos se puede consultar únicamente la
configuración estructural desde el SQL Editor de staging. Nunca se debe ejecutar
la migración diferida contra Producción sin una autorización independiente,
backup reciente y revisión del plan de rollback.

### OCR y privacidad

El adaptador de Azure está en
`src/lib/scanner/azure-receipt-provider.ts`. Usa el modelo prebuilt de recibos y
solo debe ejecutarse cuando los dos interruptores OCR están activos. La imagen
original es temporal; el producto no ofrece almacenamiento online permanente de
tickets. Si el usuario quiere conservarla, debe descargarla localmente y asumir
su custodia.

No se deben enviar a Analytics imágenes, texto completo del ticket, proveedor,
importes, fechas, líneas, categorías derivadas ni identificadores que permitan
reconstruir esos datos. Los logs de limpieza devuelven recuentos técnicos, no
rutas privadas ni importes.

### Acceso Premium y pruebas

`src/lib/scanner/access.ts` resuelve el acceso a partir del `AccessState`
existente:

- `plus_active` y `plus_canceled_pending`: permitido;
- estados Free: respuesta de plan requerido;
- `founder` y `legacy_full`: bloqueado por decisión pendiente;
- estado ausente o desconocido: denegado por defecto.

Por tanto, una cuenta nueva por email es Free y no sirve para probar el flujo
completo. Para una prueba legítima hay dos opciones:

1. usar una cuenta Plus de staging ya existente;
2. activar Stripe TEST solo en Preview, realizar una suscripción de prueba sin
   cargo real y comprobar que el webhook/sync actualiza el acceso.

No se debe insertar manualmente una fila falsa en `subscriptions` ni cambiar el
tier de un usuario para saltarse la puerta: eso probaría un estado que el flujo
real de billing no garantiza.

### Validación local

Comandos habituales desde el worktree del escáner:

```powershell
npm test -- --run
npm run build
npx tsc --noEmit
npm run lint
```

Tests especialmente relacionados con esta funcionalidad:

- `src/__tests__/api/scanner/`
- `src/__tests__/lib/scanner/`
- `src/__tests__/components/`
- `src/__tests__/security/`

La validación debe separar siempre tres niveles: tests automatizados, Preview
con sesión y datos de prueba, y Producción. Un build correcto no demuestra que
Azure, Supabase Storage, OAuth, Stripe o la sesión de usuario estén
configurados en el entorno remoto.

### Checklist de diagnóstico en producción

Comprobar en este orden, sin imprimir secretos:

1. El deployment de Vercel está listo y contiene el commit esperado.
2. En Vercel están definidas, para el entorno correcto, las variables públicas
   de Supabase, la clave de servicio server-side, los dos interruptores OCR y
   el endpoint/clave de Azure. La clave no se comprueba pegándola en el
   navegador.
3. En Supabase existe `kakebo-ticket-temp`, es privado, tiene límite de 5 MiB
   y conserva sus tres políticas privadas.
4. La cuenta de prueba tiene acceso Plus, sesión válida y un ciclo abierto.
5. El flujo funciona de principio a fin: seleccionar JPEG/PNG, subir,
   procesar, revisar, excluir una línea, asignar categorías y confirmar.
6. Tras confirmar, se crean solo los gastos incluidos y la imagen temporal no
   queda disponible públicamente.
7. Si falla la limpieza de abandonados, revisar `CRON_SECRET` y la ejecución
   del cron; la ruta de limpieza no se invoca desde el navegador.

### Preview y producción en Vercel

El Preview sirve para validar una rama aislada; Producción sirve el deployment
asociado a `main`. La URL concreta de cada Preview cambia entre deployments y
debe consultarse en Vercel. Después de modificar variables de entorno hay que
crear un nuevo deployment del entorno correspondiente: los deployments
anteriores no reciben automáticamente las variables nuevas.

Reglas operativas:

- no copiar secretos entre entornos ni ponerlos en el repositorio;
- no probar con datos reales si el entorno, la retención y el proveedor no
  están aprobados para ese uso;
- comprobar que el deployment muestra `Environment: Preview`, la rama correcta
  y el commit esperado;
- para producción, comprobar de forma equivalente que el deployment está
  asociado a `main` y figura como listo;
- si `/app/scanner` redirige a `/login`, iniciar sesión en ese mismo dominio de
  Preview; las cookies de otro deployment no garantizan una sesión compartida;
- Google OAuth requiere que el proveedor Google esté habilitado en el proyecto
  Supabase de staging. Si aparece `Unsupported provider: provider is not
  enabled`, no es un fallo del escáner.

### Limpieza y fallos

Los tickets abandonados se consideran candidatos a limpieza a las 24 horas. La
ruta `src/app/api/scanner/cleanup/route.ts` está protegida por `CRON_SECRET`.
La tarea programada debe invocar la limpieza con un secreto del entorno, nunca
desde el navegador. La limpieza debe ser idempotente: repetirla no puede
duplicar borrados ni crear gastos.

Estados relevantes del ticket:

`draft` → `processing` → `needs_review` → `confirmed`.

Las ramas de error terminan en `failed` o `discarded`. Si el usuario cierra el
ciclo con un ticket pendiente, la política del producto es cancelarlo; no se
debe convertir automáticamente en gasto.

### Documentación relacionada

- [`docs/ticket-scanner/product-requirements.md`](docs/ticket-scanner/product-requirements.md)
- [`docs/ticket-scanner/technical-architecture.md`](docs/ticket-scanner/technical-architecture.md)
- [`docs/ticket-scanner/api-contracts.md`](docs/ticket-scanner/api-contracts.md)
- [`docs/ticket-scanner/privacy-security-architecture.md`](docs/ticket-scanner/privacy-security-architecture.md)
- [`docs/ticket-scanner/state-machine.md`](docs/ticket-scanner/state-machine.md)
- [`docs/ticket-scanner/phase-7-persistence.md`](docs/ticket-scanner/phase-7-persistence.md)
- [`docs/planning/plus-stripe-test-integration.md`](docs/planning/plus-stripe-test-integration.md)


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

### v4.0.0 (2026-06-15) — Migración a herramienta gratuita *(histórico: parcialmente sustituido por ADR-003, 2026-10-06)*

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
