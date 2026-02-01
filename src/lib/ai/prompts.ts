/**
 * Versioned prompts for expense classification
 *
 * Each version contains:
 * - system: Instructions for the AI
 * - examples: Few-shot examples to guide the AI
 *
 * Versioning allows A/B testing and rollback if needed.
 */

export type ExpenseCategory = "survival" | "optional" | "culture" | "extra";

export interface ClassificationExample {
  input: string;
  category: ExpenseCategory;
  note: string;
}

export interface PromptVersion {
  version: string;
  description: string;
  system: string;
  examples: ClassificationExample[];
}

/**
 * Category descriptions in Spanish for the AI
 */
const CATEGORY_DESCRIPTIONS = `
CATEGORÍAS DE GASTOS (método Kakebo japonés):

1. SURVIVAL (Supervivencia): Gastos ESENCIALES para vivir
   - Comida y supermercado
   - Transporte (gasolina, metro, bus)
   - Salud (médico, farmacia)
   - Servicios básicos (luz, agua, gas, internet)
   - Alquiler/hipoteca

2. OPTIONAL (Opcional): Gastos NO esenciales pero comunes
   - Ropa y calzado
   - Restaurantes y bares
   - Peluquería y estética
   - Decoración del hogar
   - Regalos

3. CULTURE (Cultura): Ocio y desarrollo personal
   - Libros y revistas
   - Cine, teatro, conciertos
   - Cursos y formación
   - Suscripciones de streaming (Netflix, Spotify)
   - Videojuegos
   - Museos y exposiciones

4. EXTRA: Gastos inesperados o excepcionales
   - Reparaciones urgentes
   - Multas
   - Gastos médicos no previstos
   - Emergencias
   - Compras puntuales grandes no planificadas
`;

/**
 * Prompt versions
 */
export const PROMPT_VERSIONS: Record<string, PromptVersion> = {
  v1: {
    version: "v1",
    description: "Initial version - basic classification with few-shot examples",
    system: `Eres un asistente de finanzas personales especializado en el método Kakebo japonés.

Tu tarea es clasificar gastos en una de las 4 categorías y generar una nota descriptiva corta.

${CATEGORY_DESCRIPTIONS}

INSTRUCCIONES:
1. Analiza el texto del gasto
2. Determina la categoría más apropiada
3. Genera una nota breve y descriptiva (máximo 50 caracteres)
4. Responde SOLO en formato JSON válido

FORMATO DE RESPUESTA (JSON):
{
  "category": "survival|optional|culture|extra",
  "note": "Descripción breve del gasto",
  "confidence": 0.0-1.0
}

IMPORTANTE:
- Si no estás seguro, usa la categoría más probable y baja el confidence
- La nota debe ser concisa y descriptiva
- Responde SOLO el JSON, sin explicaciones adicionales`,

    examples: [
      { input: "Mercadona 47.50", category: "survival", note: "Compra supermercado" },
      { input: "Gasolina Repsol", category: "survival", note: "Combustible" },
      { input: "Netflix mensual", category: "culture", note: "Suscripción streaming" },
      { input: "Zara pantalones", category: "optional", note: "Ropa" },
      { input: "Cena cumple María", category: "optional", note: "Restaurante celebración" },
      { input: "Libro Clean Code", category: "culture", note: "Libro programación" },
      { input: "Fontanero urgente", category: "extra", note: "Reparación urgente" },
      { input: "Farmacia ibuprofeno", category: "survival", note: "Medicamentos" },
      { input: "Spotify premium", category: "culture", note: "Suscripción música" },
      { input: "Café con Juan", category: "optional", note: "Cafetería" },
    ],
  },

  v2: {
    version: "v2",
    description: "Improved version - more examples, better edge case handling",
    system: `Eres un experto en finanzas personales usando el método Kakebo japonés.

TAREA: Clasificar gastos y generar notas descriptivas.

${CATEGORY_DESCRIPTIONS}

REGLAS DE CLASIFICACIÓN:
- Supermercados SIEMPRE son "survival" (aunque compres caprichos)
- Restaurantes/bares son "optional" (comer fuera no es esencial)
- Streaming/suscripciones digitales son "culture"
- Si hay duda entre optional y culture, pregúntate: ¿es entretenimiento? → culture
- Reparaciones del hogar: si es urgente → extra, si es mejora → optional

RESPONDE SOLO EN JSON:
{
  "category": "survival|optional|culture|extra",
  "note": "descripción máximo 50 chars",
  "confidence": 0.0-1.0
}`,

    examples: [
      { input: "Mercadona 47.50", category: "survival", note: "Compra supermercado" },
      { input: "Lidl compra semanal", category: "survival", note: "Compra supermercado" },
      { input: "Carrefour", category: "survival", note: "Compra supermercado" },
      { input: "Gasolina Repsol", category: "survival", note: "Combustible" },
      { input: "Cepsa 40€", category: "survival", note: "Combustible" },
      { input: "Metro Madrid abono", category: "survival", note: "Transporte público" },
      { input: "Uber al aeropuerto", category: "survival", note: "Transporte" },
      { input: "Netflix mensual", category: "culture", note: "Streaming series/películas" },
      { input: "HBO Max", category: "culture", note: "Streaming series/películas" },
      { input: "Spotify premium", category: "culture", note: "Streaming música" },
      { input: "Audible suscripción", category: "culture", note: "Audiolibros" },
      { input: "Curso Udemy Python", category: "culture", note: "Formación online" },
      { input: "Zara pantalones", category: "optional", note: "Ropa" },
      { input: "Pull&Bear camiseta", category: "optional", note: "Ropa" },
      { input: "Cena cumple María", category: "optional", note: "Restaurante celebración" },
      { input: "Burger King", category: "optional", note: "Comida rápida" },
      { input: "Telepizza", category: "optional", note: "Comida a domicilio" },
      { input: "Café con Juan", category: "optional", note: "Cafetería" },
      { input: "Peluquería corte", category: "optional", note: "Peluquería" },
      { input: "Libro Clean Code", category: "culture", note: "Libro técnico" },
      { input: "Cine Yelmo 2 entradas", category: "culture", note: "Cine" },
      { input: "Fontanero urgente", category: "extra", note: "Reparación urgente" },
      { input: "Multa aparcamiento", category: "extra", note: "Multa" },
      { input: "Veterinario urgencias", category: "extra", note: "Veterinario urgente" },
      { input: "Farmacia ibuprofeno", category: "survival", note: "Medicamentos" },
      { input: "Dentista revisión", category: "survival", note: "Salud dental" },
      { input: "Luz factura enero", category: "survival", note: "Electricidad" },
      { input: "Vodafone fibra", category: "survival", note: "Internet" },
    ],
  },
};

/**
 * Get the current active prompt version
 */
export const CURRENT_PROMPT_VERSION = "v2";

/**
 * Get a specific prompt version
 */
export function getPromptVersion(version: string): PromptVersion {
  const prompt = PROMPT_VERSIONS[version];
  if (!prompt) {
    throw new Error(`Prompt version "${version}" not found`);
  }
  return prompt;
}

/**
 * Get the current active prompt
 */
export function getCurrentPrompt(): PromptVersion {
  return getPromptVersion(CURRENT_PROMPT_VERSION);
}

/**
 * Format examples for few-shot learning
 */
export function formatExamplesForPrompt(examples: ClassificationExample[]): string {
  return examples
    .map(
      (ex) =>
        `Input: "${ex.input}"
Output: {"category": "${ex.category}", "note": "${ex.note}", "confidence": 0.95}`
    )
    .join("\n\n");
}
