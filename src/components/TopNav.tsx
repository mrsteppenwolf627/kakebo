"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { createClient } from "@/lib/supabase/browser";

function isYm(s: string | null) {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

function parseYm(ym: string) {
  const [y, m] = ym.split("-");
  return { year: Number(y), month: Number(m) };
}

export default function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const ym = searchParams?.get("ym");
  const ymValid = isYm(ym);

  const [isClosed, setIsClosed] = useState(false);
  const [checking, setChecking] = useState(false);

  // Queremos que el botón "Nuevo gasto" respete el mes seleccionado
  const newHref = ymValid ? `/new?ym=${ym}` : "/new";

  useEffect(() => {
    let cancelled = false;

    async function checkClosed() {
      // Solo comprobamos cierre si estamos en Dashboard con ym válido
      if (pathname !== "/" || !ymValid || !ym) {
        setIsClosed(false);
        return;
      }

      setChecking(true);

      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const userId = sessionRes.session?.user?.id;

        if (!userId) {
          setIsClosed(false);
          return;
        }

        const { year, month } = parseYm(ym);

        const { data, error } = await supabase
          .from("months")
          .select("status")
          .eq("user_id", userId)
          .eq("year", year)
          .eq("month", month)
          .limit(1);

        if (error) throw error;

        const status = (data?.[0]?.status as "open" | "closed" | undefined) ?? "open";
        if (!cancelled) setIsClosed(status === "closed");
      } catch {
        if (!cancelled) setIsClosed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkClosed();

    return () => {
      cancelled = true;
    };
  }, [pathname, ymValid, ym, supabase]);

  const items = [
    { href: "/", label: "Dashboard" },
    { href: "/settings", label: "Ajustes" },
  ];

  return (
    <nav className="flex items-center gap-2">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              active ? "bg-gray-100 text-black" : "text-gray-500 hover:text-black hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Botón principal: Nuevo Gasto, respetando mes */}
      {pathname === "/" && ymValid && isClosed ? (
        <button
          type="button"
          disabled
          className="ml-2 px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-full cursor-not-allowed"
          title="Mes cerrado: no se pueden añadir gastos"
        >
          Mes cerrado
        </button>
      ) : (
        <Link
          href={newHref}
          className="ml-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
          title={pathname === "/" && ymValid ? `Añadir gasto en ${ym}` : "Añadir gasto"}
        >
          {checking && pathname === "/" && ymValid ? "…" : "+ Nuevo Gasto"}
        </Link>
      )}

      <UserMenu />
    </nav>
  );
}
