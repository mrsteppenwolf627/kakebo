/**
 * Merchant extraction utilities (P1-1)
 *
 * Extracts merchant/brand names from transaction concepts for rule-based classification.
 * Examples:
 * - "Mercadona compra semanal" → "mercadona"
 * - "Vaper El Estanco" → "vaper"
 * - "Netflix suscripción" → "netflix"
 */

import { apiLogger } from "@/lib/logger";

/**
 * Known merchant patterns (regex-based)
 *
 * These patterns are checked first for common merchants to ensure
 * accurate extraction even in complex concepts.
 */
const KNOWN_MERCHANT_PATTERNS: Array<{
  pattern: RegExp;
  name: string;
  priority: number; // Higher = checked first
}> = [
  // Supermarkets (priority: 10)
  { pattern: /\bmercadona\b/i, name: "mercadona", priority: 10 },
  { pattern: /\bcarrefour\b/i, name: "carrefour", priority: 10 },
  { pattern: /\blidl\b/i, name: "lidl", priority: 10 },
  { pattern: /\baldi\b/i, name: "aldi", priority: 10 },
  { pattern: /\bdía\b/i, name: "día", priority: 10 },
  { pattern: /\beroski\b/i, name: "eroski", priority: 10 },
  { pattern: /\balcampo\b/i, name: "alcampo", priority: 10 },

  // Streaming services (priority: 9)
  { pattern: /\bnetflix\b/i, name: "netflix", priority: 9 },
  { pattern: /\bspotify\b/i, name: "spotify", priority: 9 },
  { pattern: /\bamazon\s*prime\b/i, name: "amazon prime", priority: 9 },
  { pattern: /\byoutube\s*premium\b/i, name: "youtube premium", priority: 9 },
  { pattern: /\bdisney\s*\+?\b/i, name: "disney", priority: 9 },
  { pattern: /\bhbo\b/i, name: "hbo", priority: 9 },

  // Food delivery (priority: 9 - check before generic "uber")
  { pattern: /\buber\s*eats\b/i, name: "uber eats", priority: 9 },
  { pattern: /\bjust\s*eat\b/i, name: "just eat", priority: 9 },
  { pattern: /\bglovo\b/i, name: "glovo", priority: 9 },

  // Transport (priority: 8)
  { pattern: /\buber\b/i, name: "uber", priority: 8 },
  { pattern: /\bcabify\b/i, name: "cabify", priority: 8 },
  { pattern: /\brenfe\b/i, name: "renfe", priority: 8 },
  { pattern: /\bcercanías\b/i, name: "renfe", priority: 8 }, // Alias for renfe

  // Tobacco/Vices (priority: 7)
  { pattern: /\bvaper\b/i, name: "vaper", priority: 7 },
  { pattern: /\bestanco\b/i, name: "estanco", priority: 7 },
  { pattern: /\btabaco\b/i, name: "tabaco", priority: 7 },

  // Pharmacies (priority: 7)
  { pattern: /\bfarmacia\b/i, name: "farmacia", priority: 7 },

  // Books/Education (priority: 6)
  { pattern: /\bcasa\s*del\s*libro\b/i, name: "casa del libro", priority: 6 },
  { pattern: /\bfnac\b/i, name: "fnac", priority: 6 },
  { pattern: /\budemy\b/i, name: "udemy", priority: 6 },
  { pattern: /\bcoursera\b/i, name: "coursera", priority: 6 },

  // Gyms (priority: 6)
  { pattern: /\bgimnasio\b/i, name: "gimnasio", priority: 6 },
  { pattern: /\bgym\b/i, name: "gimnasio", priority: 6 },

  // Generic e-commerce (priority: 5)
  { pattern: /\bamazon\b/i, name: "amazon", priority: 5 },
  { pattern: /\baliexpress\b/i, name: "aliexpress", priority: 5 },
];

/**
 * Sort patterns by priority (higher first)
 */
KNOWN_MERCHANT_PATTERNS.sort((a, b) => b.priority - a.priority);

/**
 * Extract merchant name from transaction concept
 *
 * Strategy:
 * 1. Check against known merchant patterns (highest priority)
 * 2. If no match, extract first significant word (>3 chars)
 * 3. Normalize to lowercase and trim
 *
 * @param concept - Transaction concept (e.g., "Mercadona compra semanal")
 * @returns Normalized merchant name or null if cannot extract
 *
 * @example
 * extractMerchant("Mercadona compra semanal") // → "mercadona"
 * extractMerchant("Netflix suscripción") // → "netflix"
 * extractMerchant("Vaper El Estanco") // → "vaper"
 * extractMerchant("Café") // → null (too short)
 */
export function extractMerchant(concept: string): string | null {
  if (!concept || concept.trim().length === 0) {
    return null;
  }

  // Normalize: lowercase, trim, remove special chars except spaces
  const normalized = concept
    .toLowerCase()
    .trim()
    .replace(/[€$£¥]/g, "") // Remove currency symbols
    .replace(/\s+/g, " "); // Normalize whitespace

  // Step 1: Check known merchant patterns
  for (const { pattern, name } of KNOWN_MERCHANT_PATTERNS) {
    if (pattern.test(normalized)) {
      apiLogger.debug(
        { concept, extractedMerchant: name, method: "pattern" },
        "Merchant extracted via known pattern"
      );
      return name;
    }
  }

  // Step 2: Extract first significant word (fallback)
  const words = normalized.split(" ").filter((w) => w.length > 0);

  if (words.length === 0) {
    return null;
  }

  // Get first word that's at least 4 characters (avoid "el", "la", "de", etc.)
  const significantWord = words.find((w) => w.length >= 4);

  if (significantWord) {
    apiLogger.debug(
      { concept, extractedMerchant: significantWord, method: "first_word" },
      "Merchant extracted via first significant word"
    );
    return significantWord;
  }

  // If all words are short, return first word (but warn)
  const firstWord = words[0];
  if (firstWord.length >= 3) {
    apiLogger.debug(
      {
        concept,
        extractedMerchant: firstWord,
        method: "first_word_short",
      },
      "Merchant extracted (short word)"
    );
    return firstWord;
  }

  // Cannot extract meaningful merchant
  apiLogger.debug({ concept }, "Could not extract merchant");
  return null;
}

/**
 * Extract multiple possible merchants from concept
 *
 * Sometimes a concept may mention multiple merchants or brands.
 * This function extracts all recognizable merchants.
 *
 * @param concept - Transaction concept
 * @returns Array of merchant names (empty if none found)
 *
 * @example
 * extractAllMerchants("Mercadona y Lidl") // → ["mercadona", "lidl"]
 * extractAllMerchants("Netflix") // → ["netflix"]
 */
export function extractAllMerchants(concept: string): string[] {
  if (!concept || concept.trim().length === 0) {
    return [];
  }

  const normalized = concept
    .toLowerCase()
    .trim()
    .replace(/[€$£¥]/g, "")
    .replace(/\s+/g, " ");

  const merchants: string[] = [];

  // Check all known patterns
  for (const { pattern, name } of KNOWN_MERCHANT_PATTERNS) {
    if (pattern.test(normalized)) {
      merchants.push(name);
    }
  }

  // If found via patterns, return those
  if (merchants.length > 0) {
    return merchants;
  }

  // Otherwise, fallback to single merchant extraction
  const merchant = extractMerchant(concept);
  return merchant ? [merchant] : [];
}

/**
 * Check if concept contains a specific merchant
 *
 * @param concept - Transaction concept
 * @param merchant - Merchant name to check
 * @returns true if merchant is found in concept
 *
 * @example
 * containsMerchant("Compra en Mercadona", "mercadona") // → true
 * containsMerchant("Café", "mercadona") // → false
 */
export function containsMerchant(concept: string, merchant: string): boolean {
  if (!concept || !merchant) {
    return false;
  }

  const normalizedConcept = concept.toLowerCase().trim();
  const normalizedMerchant = merchant.toLowerCase().trim();

  return normalizedConcept.includes(normalizedMerchant);
}

/**
 * Get confidence score for extracted merchant
 *
 * Higher confidence when:
 * - Matched via known pattern (1.0)
 * - Merchant name is longer (0.8)
 * - Merchant name is shorter (0.6)
 *
 * @param concept - Transaction concept
 * @param merchant - Extracted merchant
 * @returns Confidence score (0.0 to 1.0)
 */
export function getMerchantConfidence(
  concept: string,
  merchant: string
): number {
  if (!merchant) {
    return 0.0;
  }

  // Check if matched via known pattern (high confidence)
  const normalizedConcept = concept.toLowerCase().trim();
  const matchedPattern = KNOWN_MERCHANT_PATTERNS.find(({ pattern }) =>
    pattern.test(normalizedConcept)
  );

  if (matchedPattern) {
    return 1.0; // Perfect confidence for known merchants
  }

  // Fallback: confidence based on merchant length
  if (merchant.length >= 6) {
    return 0.8; // Good confidence for longer names
  } else if (merchant.length >= 4) {
    return 0.7; // Medium confidence
  } else {
    return 0.6; // Lower confidence for short names
  }
}
