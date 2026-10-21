// Consentimiento de analítica. Se guarda en la misma clave que ya usaba el banner de cookies
// ("true" = aceptado, "false" = rechazado). Sin valor guardado no hay consentimiento.
export const CONSENT_KEY = "kakebo-cookie-consent";
export const CONSENT_EVENT = "kakebo-consent-change";

// "pending" solo existe en el servidor y antes de hidratar: tampoco permite analítica.
export type ConsentState = "pending" | "unknown" | "accepted" | "rejected";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "pending";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "true") return "accepted";
    if (value === "false") return "rejected";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function writeConsent(accepted: boolean): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, accepted ? "true" : "false");
  } catch {
    // Sin almacenamiento disponible: la elección solo vale para esta carga y no se persiste.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const analyticsAllowed = () => readConsent() === "accepted";
