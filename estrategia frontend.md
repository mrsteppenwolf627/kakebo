# Kakebo AI: Frontend Architecture & UX Strategy

**Fase:** 2.5 (Front End & UX)
**Estado:** En Progreso
**Stack:** Next.js 14, shadcn/ui, Recharts, OpenAI V2
**Objetivo:** Portfolio AI Systems Engineer (Observabilidad + Orquestación)

---

## 1. Concepto UX: "AI-First Hybrid Dashboard"

Para diferenciar este proyecto de una app de finanzas tradicional y alinearlo con un perfil de **AI Solutions Engineer**, el frontend no será solo una vista pasiva de datos. Se diseñará como una **consola de control híbrida**:

1.  **Capa Estática (Observabilidad):** Métricas financieras tradicionales y estado del sistema.
2.  **Capa Dinámica (Orquestación):** Una interfaz de chat/agente que actúa como el motor principal de interacción, exponiendo la lógica de *Function Calling V2*.

---

## 2. Arquitectura de Componentes

### A. App Shell (`layout.tsx`)
El contenedor principal debe comunicar estabilidad y tecnología.

* **Sidebar Navigation:** Navegación colapsable (Dashboard, Transacciones, Configuración).
* **Header "System Aware":**
    * Indicador de estado del Agente: Un badge (`Online` / `Processing`).
    * Selector de Modelo (Visual): Muestra "GPT-4o" o "Mini" para denotar capacidad de configuración.

### B. Dashboard Principal (`page.tsx`)
Compuesto por organismos reactivos que consumen datos de Supabase y análisis del Agente.

1.  **Kakebo Smart Cards:**
    * Componente: `Card` (shadcn/ui).
    * **Contenido:** Presupuesto Restante vs. Gasto Actual.
    * **AI Feature:** Indicador de tendencia ("12% mejor que la media") calculado por backend.

2.  **Spending Breakdown (Visualización):**
    * Componente: `Recharts` (Pie/Donut Chart).
    * **Lógica:** Desglose estricto por las 4 categorías Kakebo (Supervivencia, Ocio, Cultura, Extras).
    * **Interacción:** Clic en segmento -> Invoca filtro en el chat ("Muéstrame gastos de Ocio").

3.  **Smart Transaction List:**
    * Componente: `DataTable` (TanStack Table).
    * **Columna Clave:** "AI Confidence".
    * **Visual:** Badge de color según la confianza de la clasificación (Verde: Alta, Amarillo: Revisar). Muestra que el backend "piensa".

### C. The Agent Interface (Chat UI)
El componente más crítico para el portfolio. No es un chat de soporte, es una terminal de lenguaje natural.

* **Ubicación:** Drawer lateral persistente o panel derecho fijo.
* **Visibilidad de Procesos ("Thoughts"):**
    * La UI debe renderizar los pasos intermedios del **OpenAI Function Calling**.
    * *Ejemplo visual:*
        1.  User: "Añade cena 20€"
        2.  System (dimmed): `⚙️ Calling tool: categorize_expense...`
        3.  System (dimmed): `✅ Output: { category: "Supervivencia", confidence: 0.98 }`
        4.  Agent: "He registrado 20€ en Supervivencia."

---

## 3. Wireframe de Referencia

Estructura para implementación en Desktop/Tablet:

```text
+-----------------------------------------------------------------------------------+
|  SIDEBAR  |  HEADER: [Kakebo AI]            [🟢 System Ready] [👤 User]           |
| (shadcn)  |-----------------------------------------------------------------------|
|           |                                            |                          |
|  Dashboard|  [ MAIN DASHBOARD AREA - Grid Layout ]     |  [ AI AGENT DRAWER ]     |
|           |                                            |  (Interactive Console)   |
|  Transac- |  +------------------+  +----------------+  |                          |
|  ciones   |  | BUDGET REMAINING |  | AI INSIGHT     |  |  [ Chat History... ]   |
|           |  |                  |  |                |  |  User: Analiza mi mes  |
|  Debug    |  |   850.00 €       |  | "Alerta: Ocio  |  |                        |
|  Mode     |  |                  |  |  excede 20%    |  |  Agent:                |
|           |  | [Progress Bar]   |  |  del plan"     |  |  [⚙️ Calling Analysis] |
|           |  +------------------+  +----------------+  |  [📊 Rendering Graph]  |
|           |                                            |                        |
|           |  +--------------------------------------+  |  "Tu proyección indica |
|           |  |  SPENDING TRENDS (Recharts)          |  |   déficit el día 25."  |
|           |  |                                      |  |                        |
|           |  |   [|||||||||||||......]              |  |  [ Action Buttons ]    |
|           |  |   Sup.  Ocio   Cult.                 |  |  [ Ver Detalle ]       |
|           |  +--------------------------------------+  |  [ Ajustar Plan ]      |
|           |                                            |                        |
|           |  +--------------------------------------+  |  ----------------------  |
|           |  |  RECENT ACTIVITY (DataTable)         |  |  [ Input Area ]        |
|           |  |                                      |  |  "Añade 15€ taxi..."   |
|           |  |  [Icon] Taxi ... [AI: Superv. ✅]    |  |                        |
|           |  +--------------------------------------+  |                        |
+-----------------------------------------------------------------------------------+