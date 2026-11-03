"use client";

import { useTranslations } from "next-intl";
import { PlusRequiredNotice } from "@/components/plus/PlusRequiredNotice";

/**
 * Guarda de interfaz para funciones Plus. NO es la barrera de seguridad (esa es requireAccess en el servidor):
 * solo evita mostrar una pantalla que fallaría. `allowed` llega calculado en servidor (undefined/true = pasar), así que
 * con PLUS_SUBSCRIPTIONS_ENABLED apagado el contenido se muestra siempre, igual que antes.
 */
export default function SubscriptionGuard({
  children,
  allowed = true,
  title,
}: {
  children: React.ReactNode;
  allowed?: boolean;
  title?: "ai";
}) {
  const t = useTranslations("Plus");
  if (allowed) return <>{children}</>;
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-10">
      {title === "ai" && (
        <>
          <h1 className="font-serif text-xl font-bold text-foreground">{t("aiBlockedTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("aiBlockedDesc")}</p>
        </>
      )}
      <PlusRequiredNotice />
    </main>
  );
}
