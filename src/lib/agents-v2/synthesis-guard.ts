/**
 * Hotfix 2.2: backstop determinista contra síntesis con placeholders.
 *
 * Bug real de producción: ante una petición compuesta ("alimentación básica
 * y comer fuera, por separado, con el importe de todo") tras resolver
 * correctamente `cycle_scope: "previous"` y ejecutar `analyzeSpendingPattern`
 * con datos reales, la síntesis final del modelo (segunda llamada, la que
 * redacta la respuesta a partir del resultado de la herramienta) ignoró los
 * datos reales y emitió una plantilla de ejemplo literal ("Basado en N
 * gastos", "€X,XX", "[Concepto] - €importe", IDs de ejemplo como
 * "xxx-xxx-xxx") — copiada de los propios ejemplos de formato del prompt en
 * vez de sustituida por los valores reales devueltos por la tool.
 *
 * Ninguna instrucción de prompt puede GARANTIZAR que un modelo no repita un
 * patrón así bajo incertidumbre. Este módulo es la protección de código: un
 * detector puro y barato de los patrones de plantilla conocidos, aplicado al
 * texto COMPLETO de la síntesis antes de entregarlo al usuario (nunca token
 * a token — un placeholder puede completarse solo tras varios chunks). Si se
 * detecta un patrón, se sustituye toda la respuesta por un mensaje seguro y
 * honesto en vez de reenviar texto potencialmente inventado — nunca se
 * bloquea ni se reescribe texto legítimo que no contenga estos patrones.
 */

const PLACEHOLDER_PATTERNS: RegExp[] = [
  // "€X" / "€Y" — un importe real nunca es una letra, siempre dígitos.
  /€\s*[XY](?![a-zA-Z0-9])/,
  // "X,XX" / "X.XX" — plantilla de decimales sin sustituir.
  /\bX[.,]XX\b/,
  // "N gastos" / "N gasto" — recuento sin sustituir (N literal, no un número).
  /\bN\s+gastos?\b/i,
  // "[Concepto]" — corchete de plantilla copiado literalmente.
  /\[Concepto\]/i,
  // "€importe" — plantilla de importe sin sustituir.
  /€\s*importe\b/i,
  // IDs de ejemplo tipo "xxx-xxx-xxx" o "ID: xxx...".
  /\bxxx-xxx\b/i,
  /\bID:\s*xxx/i,
];

/**
 * Ofertas de una capacidad que el producto NO tiene implementada: ninguna
 * herramienta reclasifica/reasigna gastos históricos en bloque. Un modelo
 * bajo incertidumbre puede "inventar" esta capacidad igual que inventa una
 * cifra — mismo tipo de daño (promete algo que no puede cumplir), así que
 * se bloquea con el mismo mecanismo.
 */
const FALSE_CAPABILITY_PATTERNS: RegExp[] = [
  // Cubre cualquier conjugación del verbo ("reasigne", "reasignar",
  // "reasignaría"...), no solo el infinitivo.
  /reasign\w*\s+autom[aá]ticamente/i,
  /reclasific\w*\s+autom[aá]ticamente/i,
  /reasignaci[oó]n\s+autom[aá]tica/i,
  /reclasificaci[oó]n\s+autom[aá]tica/i,
  /corregir\w*\s+autom[aá]ticamente\s+en\s+bloque/i,
];

const UNSAFE_SYNTHESIS_PATTERNS: RegExp[] = [
  ...PLACEHOLDER_PATTERNS,
  ...FALSE_CAPABILITY_PATTERNS,
];

/**
 * true si el texto contiene algún patrón de plantilla/placeholder sin
 * sustituir, o la oferta de una capacidad de reclasificación/reasignación
 * masiva que no existe — nunca un juicio sobre si el contenido "parece"
 * inventado, solo los patrones literales que ya han aparecido en producción
 * (copiados de los propios ejemplos de formato del prompt, o inventados bajo
 * incertidumbre).
 */
export function containsSynthesisPlaceholder(text: string): boolean {
  return UNSAFE_SYNTHESIS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Mensaje de respaldo cuando la síntesis se descarta por contener un
 * placeholder detectado. Deliberadamente genérico: no repite ni resume el
 * texto descartado (podría contener el propio placeholder), no inventa
 * ningún dato nuevo, y ofrece una vía honesta para reintentar.
 */
export const SYNTHESIS_SAFETY_FALLBACK_MESSAGE =
  "He consultado tus datos, pero no puedo mostrarte el desglose con la fiabilidad necesaria en este mensaje. ¿Puedes pedírmelo de nuevo, o indicarme si quieres ver primero solo una de las partes (por ejemplo, alimentación básica o comer fuera por separado)? Así te lo muestro con las cifras reales.";
