import React from "react";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";

/**
 * Simula next-intl con los textos REALES de messages/{es,en}.json para poder probar la interfaz en ambos idiomas.
 * Si falta una clave devuelve "Namespace.key" (así los tests detectan textos sin traducir).
 */
const MESSAGES: Record<string, unknown> = { es, en };

export const intl = { locale: "es" as "es" | "en" };

function lookup(ns: string | undefined, key: string): string | undefined {
  const path = [...(ns ? ns.split(".") : []), ...key.split(".")];
  let cur: unknown = MESSAGES[intl.locale];
  for (const p of path) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

function translate(ns: string | undefined, key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(ns, key);
  if (raw === undefined) return `${ns ? ns + "." : ""}${key}`;
  return raw.replace(/\{(\w+)\}/g, (_, name) => (vars && name in vars ? String(vars[name]) : `{${name}}`));
}

export function useTranslations(ns?: string) {
  return (key: string, vars?: Record<string, string | number>) => translate(ns, key, vars);
}

export const useLocale = () => intl.locale;
export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export function text(key: string, vars?: Record<string, string | number>, locale: "es" | "en" = intl.locale): string {
  const prev = intl.locale;
  intl.locale = locale;
  try {
    return translate("Plus", key, vars);
  } finally {
    intl.locale = prev;
  }
}
