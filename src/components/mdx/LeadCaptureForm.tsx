"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Formulario de suscripción por email bajo la descarga. No bloquea la descarga: es opcional.
 * Consentimiento explícito (casilla sin marcar) y confirmación posterior por correo.
 * El email nunca se envía a analítica; solo se registra un evento `generate_lead` sin datos personales.
 */
export function LeadCaptureForm({
  source = "plantilla_excel",
  title = "¿Quieres recibir consejos Kakebo por email?",
  description = "Un correo ocasional con ideas prácticas para ahorrar mejor. Sin spam y puedes darte de baja cuando quieras.",
}: {
  source?: string;
  title?: string;
  description?: string;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending" || !consent) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/marketing/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, consent, source, website }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      analytics.track("generate_lead", { source_page: window.location.pathname, lead_source: source, method: "newsletter" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="not-prose my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6" role="status">
        <p className="font-serif font-semibold text-foreground">Revisa tu correo</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Te hemos enviado un mensaje para confirmar tu suscripción. Hasta que pulses el enlace no recibirás nada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="not-prose my-8 rounded-xl border border-border bg-muted/30 p-5 sm:p-6" noValidate>
      <p className="font-serif font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="lead-email">Correo electrónico</label>
        <input
          id="lead-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        {/* Campo trampa: oculto para personas, visible para bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="lead-website">No rellenar</label>
          <input id="lead-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={!consent || status === "sending"}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "sending" ? "Enviando…" : "Suscribirme"}
        </button>
      </div>

      <label className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <span>
          Acepto recibir por email consejos y novedades de Kakebo. Puedo darme de baja en cualquier momento.{" "}
          <Link href="/privacy" className="underline underline-offset-2">Política de privacidad</Link>.
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          No se ha podido completar la suscripción. Comprueba el correo e inténtalo de nuevo en unos minutos.
        </p>
      )}
    </form>
  );
}
