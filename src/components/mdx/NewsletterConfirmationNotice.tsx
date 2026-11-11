"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Outcome = "confirmed" | "invalid" | "error";

const MESSAGES: Record<Outcome, { title: string; body: string }> = {
  confirmed: {
    title: "Suscripción confirmada",
    body: "Gracias, ya estás suscrito. Recibirás de vez en cuando consejos Kakebo por email y puedes darte de baja desde cualquier correo que te enviemos.",
  },
  invalid: {
    title: "Enlace no válido",
    body: "Este enlace de confirmación no es válido o ha caducado. Si quieres suscribirte, vuelve a introducir tu email en el formulario.",
  },
  error: {
    title: "No hemos podido confirmar tu suscripción",
    body: "Ha ocurrido un error al confirmar. Inténtalo de nuevo pulsando el enlace del correo dentro de unos minutos.",
  },
};

const subscribeNoop = () => () => {};
const readSearch = () => window.location.search;
const readServerSearch = () => "";

function outcomeFromSearch(search: string): Outcome | null {
  const value = new URLSearchParams(search).get("newsletter");
  return value === "confirmed" || value === "invalid" || value === "error" ? value : null;
}

/**
 * Muestra el resultado de la confirmación de newsletter (`?newsletter=confirmed|invalid|error`)
 * y elimina el parámetro de la URL para que no reaparezca al recargar.
 */
export function NewsletterConfirmationNotice() {
  // La query solo existe en el cliente: en el servidor (y en la hidratación) el snapshot es "" y no se renderiza nada.
  const fromUrl = outcomeFromSearch(useSyncExternalStore(subscribeNoop, readSearch, readServerSearch));
  // El resultado se conserva aunque después se limpie la URL (ajuste de estado durante el render, sin setState dentro de un efecto).
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  if (fromUrl && outcome !== fromUrl) setOutcome(fromUrl);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fromUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("newsletter");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [fromUrl]);

  useEffect(() => {
    if (outcome && typeof ref.current?.scrollIntoView === "function") {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [outcome]);

  if (!outcome) return null;
  const message = MESSAGES[outcome];
  const ok = outcome === "confirmed";

  return (
    <div
      ref={ref}
      role={ok ? "status" : "alert"}
      className={`not-prose my-8 rounded-xl border p-5 sm:p-6 ${ok ? "border-primary/20 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}
    >
      <p className="font-serif font-semibold text-foreground">{message.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{message.body}</p>
    </div>
  );
}
