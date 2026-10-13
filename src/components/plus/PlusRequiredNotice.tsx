"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

/**
 * Aviso para cuando una función devuelve 403 PLUS_REQUIRED. Explica que la función es Plus, no muestra errores
 * técnicos, ofrece ver los planes y NO toca el estado de la pantalla (el texto escrito por el usuario se conserva).
 */
export function PlusRequiredNotice({ className = "" }: { className?: string }) {
  const t = useTranslations("Plus");
  return (
    <div
      role="status"
      data-testid="plus-required-notice"
      className={`rounded-md border border-primary/40 bg-primary/5 p-4 text-sm text-foreground ${className}`}
    >
      <p className="font-semibold">
        <span aria-hidden="true">★ </span>
        {t("plusRequiredTitle")}
      </p>
      <p className="mt-1 text-muted-foreground">{t("plusRequiredDesc")}</p>
      <Link
        href="/app/subscription"
        className="mt-3 inline-flex items-center rounded-md border border-foreground px-3 py-1.5 font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
      >
        {t("seePlans")}
      </Link>
    </div>
  );
}
