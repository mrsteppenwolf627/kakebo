/**
 * Precios de Kakebo Plus SOLO PARA MOSTRAR. El cobro real lo decide el servidor con los price IDs de Stripe;
 * el navegador nunca envía importes ni identificadores de precio.
 */
export const PLUS_MONTHLY_CENTS = 399;
export const PLUS_ANNUAL_CENTS = 3990;
/** Ahorro anual frente a pagar 12 meses: 2 meses gratis (7,98 EUR). */
export const PLUS_ANNUAL_SAVING_CENTS = PLUS_MONTHLY_CENTS * 12 - PLUS_ANNUAL_CENTS;
export const FREE_EXPENSE_LIMIT = 30;

export function formatEur(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}
