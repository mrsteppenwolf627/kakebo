"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function TopNav() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // Estado
  const [email, setEmail] = useState<string | null>(null);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  // Enlaces base
  const items = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/fixed", label: "Gastos fijos" },
    { href: "/app/settings", label: "Ajustes" },
  ];

  // Cargar sesión (solo para mostrar email y botón de logout)
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

      <Link
        href="/app/new"
        className="px-3 py-1 text-sm border border-black bg-black text-white hover:opacity-90"
      >
        + Nuevo Gasto
      </Link>

      {email && (
        <>
          <button
            onClick={onLogout}
            className="ml-auto px-3 py-1 text-sm border border-black/20 hover:border-black"
          >
            Cerrar sesión
          </button>

          <span className="ml-2 text-sm text-black/60 truncate max-w-[200px]">
            {email}
          </span>
        </>
      )}
    </nav>
  );
}
