/**
 * Copy of the premium landing when purchase is OPEN (PREMIUM_COMMERCE_ENABLED === "true").
 * With the flag off the landing keeps its original "Próximamente / Coming soon" copy untouched.
 *
 * Fiscal wording: the phrase "IVA incluido / VAT included" is intentionally NOT used here until the
 * tax configuration of the Stripe price is resolved.
 */

type Locale = "es" | "en";
type Pair = [string, string];

const LIVE = {
  es: {
    label: "Disponible ahora",
    price: "Pago único de 9,90 € · descarga digital inmediata",
    status: "Compra disponible ahora. Recibirás acceso a los tres archivos tras confirmar el pago.",
    faqCanBuy: "Sí. Kakebo Master System está disponible como compra única y no requiere cuenta.",
    metaDescription:
      "Compra Kakebo Master System: pack con plantilla Kakebo Excel premium, ebook y tutorial en PDF. Pago único de 9,90 €, entrega digital. Disponible ahora.",
    answer:
      "Kakebo Master System es un pack digital de pago que reúne tres archivos: una plantilla Kakebo Excel premium, el ebook «El arte de mirar tu dinero» (unas 20 páginas) y un tutorial en PDF con instrucciones paso a paso. Cuesta 9,90 € en pago único, con acceso permanente a los archivos y sin necesidad de crear una cuenta. La plantilla no usa macros. Está disponible para comprar ahora.",
    priceTerm: "9,90 € en pago único.",
    priceFaq: "9,90 € en pago único. No es una suscripción.",
    finalTitle: "¿Prefieres probar antes? Empieza con la plantilla gratuita",
    productDescription:
      "Pack digital con plantilla Kakebo Excel premium (12 hojas, sin macros), el ebook «El arte de mirar tu dinero» y un tutorial en PDF. Compra única, acceso permanente.",
    purchase: {
      pending: "Abriendo el pago seguro…",
      unavailable: "No se ha podido iniciar el pago. Inténtalo de nuevo en unos minutos.",
    },
  },
  en: {
    label: "Available now",
    price: "€9.90 one-time payment · instant digital download",
    status: "Available now. You will receive access to all three files after payment confirmation.",
    faqCanBuy: "Yes. Kakebo Master System is available as a one-time purchase and does not require an account.",
    metaDescription:
      "Kakebo Master System: a premium kakeibo Excel template, ebook and PDF tutorial to plan, track and review your money. €9.90 one-time payment. Available now.",
    answer:
      "Kakebo Master System is a paid digital pack with three files: a premium Kakebo Excel template, the ebook “El arte de mirar tu dinero” (about 20 pages) and a PDF tutorial with step-by-step instructions. It costs €9.90 as a one-time payment, with permanent access to the files and no account required. The template uses no macros. It is available to buy now.",
    priceTerm: "€9.90, one-time payment.",
    priceFaq: "€9.90, one-time payment. It is not a subscription.",
    finalTitle: "Prefer to try first? Start with the free template",
    productDescription:
      "Digital pack with a premium Kakebo Excel template (12 sheets, no macros), the ebook “El arte de mirar tu dinero” and a PDF tutorial. One-time purchase, permanent access.",
    purchase: {
      pending: "Opening secure checkout…",
      unavailable: "We couldn't start the payment. Please try again in a few minutes.",
    },
  },
} as const;

const KEYS = {
  es: { termsPrice: "Precio", termsAvailability: "Disponibilidad", faqCost: "¿Cuánto cuesta?", faqCanBuy: "¿Ya se puede comprar?" },
  en: { termsPrice: "Price", termsAvailability: "Availability", faqCost: "How much does it cost?", faqCanBuy: "Can I buy it now?" },
} as const;

function swap(items: readonly Pair[], key: string, value: Pair): Pair[] {
  return items.map((p) => (p[0] === key ? value : [p[0], p[1]] as Pair));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyLiveCopy<T extends Record<string, any>>(c: T, locale: Locale): T {
  const l = LIVE[locale];
  const k = KEYS[locale];
  return {
    ...c,
    meta: { ...c.meta, description: l.metaDescription },
    status: l.label,
    price: l.price,
    statusNote: l.status,
    purchase: { ...c.purchase, ...l.purchase, soon: l.label, soonNote: l.status },
    answer: l.answer,
    compare: { ...c.compare, plus: { ...c.compare.plus, price: l.price, badge: l.label } },
    terms: {
      ...c.terms,
      items: swap(swap(c.terms.items, k.termsPrice, [k.termsPrice, l.priceTerm]), k.termsAvailability, [
        k.termsAvailability,
        l.status,
      ]),
    },
    faq: {
      ...c.faq,
      items: swap(swap(c.faq.items, k.faqCost, [k.faqCost, l.priceFaq]), k.faqCanBuy, [k.faqCanBuy, l.faqCanBuy]),
    },
    state: { ...c.state, body: [l.status] },
    finalCta: { ...c.finalCta, title: l.finalTitle },
    productDescription: l.productDescription,
  };
}
