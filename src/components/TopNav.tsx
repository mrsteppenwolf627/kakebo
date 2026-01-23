"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function isYm(s: string | null) {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

function parseYm(ym: string) {
  const [y, m] = ym.split("-");
  return { year: Number(y), month: Number(m) };
}

export default function TopNav() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ym = searchParams?.get("ym");
  const ymValid = isYm(ym);

  // Enlaces base
  const dashboardHref = "/app";
  const settingsHref = "/app/settings"; // todavÃ­a estÃ¡ en raÃ­z (ya lo moveremos luego)
  const newHref = ymValid && ym ? `/app/new?ym=${ym}` : "/app/new";

  // Estado
  const [email, setEmail] = useState<string | null>(null);
  const [monthClosed, setMonthClosed] = useState(false);
  const [checking, setChecking] = useState(false);

  // Solo consideramos "en dashboard" cuando estamos en /app (y opcionalmente /app/* en el futuro)
  const isOnDashboard = pathname === "/app";

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) return;

      const userEmail = data.session?.user?.email ?? null;
      if (!cancelled) setEmail(userEmail);
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Si estamos en /app?ym=YYYY-MM, comprobamos si el mes estÃ¡ cerrado para bloquear "Nuevo gasto" (o avisar)
  useEffect(() => {
    let cancelled = false;

    async function checkMonth() {
      setMonthClosed(false);

      // Solo comprobamos si estamos en dashboard y hay ym vÃ¡lido
      if (!isOnDashboard || !ymValid || !ym) return;

      setChecking(true);

      try {
        const { data: sessionRes, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const userId = sessionRes.session?.user?.id;
        if (!userId) return;

        const { year, month } = parseYm(ym);

        const { data, error } = await supabase
          .from("months")
          .select("status")
          .eq("user_id", userId)
          .eq("year", year)
          .eq("month", month)
          .limit(1);

        if (error) throw error;

        const status =
          (data?.[0]?.status as "open" | "closed" | undefined) ?? "open";

        if (!cancelled) setMonthClosed(status === "closed");
      } catch {
        // Si falla la comprobaciÃ³n, no bloqueamos por defecto (mejor UX).
        if (!cancelled) setMonthClosed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkMonth();

    return () => {
      cancelled = true;
    };
  }, [supabase, isOnDashboard, ymValid, ym]);

  const items = [
    { href: dashboardHref, label: "Dashboard" },
    { href: settingsHref, label: "Ajustes" },
  ];

  // BotÃ³n nuevo gasto: si mes cerrado en dashboard, lo deshabilitamos
  const newDisabled = isOnDashboard && ymValid && !!ym && (monthClosed || checking);

  return (
    <nav className="flex items-center gap-3">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="px-3 py-1 text-sm border border-black/20 hover:border-black"
        >
          {it.label}
        </Link>
      ))}

      {newDisabled ? (
        <span
          className="px-3 py-1 text-sm border border-black/20 opacity-50 cursor-not-allowed"
          title={checking ? "Comprobando mesâ€¦" : "Mes cerrado: no puedes aÃ±adir gastos"}
        >
          + Nuevo Gasto
        </span>
      ) : (
        <Link
          href={newHref}
          className="px-3 py-1 text-sm border border-black bg-black text-white hover:opacity-90"
        >
          + Nuevo Gasto
        </Link>
      )}

      {email && (
        <span className="ml-2 text-sm text-black/60 truncate max-w-[200px]">
          {email}
        </span>
      )}
    </nav>
  );
}


