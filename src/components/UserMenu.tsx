"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Billing Portal Logic
  async function handleBilling() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Billing error:", e);
      alert("Error cargando el portal de facturación.");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  function goLogin() {
    setOpen(false);
    router.push("/login");
  }

  if (loading) {
    return <div className="text-sm text-stone-500 px-2 font-mono">...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={goLogin}
        className="ml-4 px-4 py-2 text-sm border border-stone-300 hover:border-stone-900 transition-colors text-stone-600 hover:text-stone-900"
      >
        Entrar
      </button>
    );
  }

  const label = user.email ? user.email.split('@')[0] : "Cuenta";

  return (
    <div className="relative ml-2 md:ml-4">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border transition-colors ${open ? "border-stone-900 text-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
          }`}
      >
        <div className="w-5 h-5 bg-stone-200 flex items-center justify-center text-xs font-serif text-stone-600">
          {label[0].toUpperCase()}
        </div>
        <span className="hidden sm:inline-block">{label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 border border-stone-200 bg-stone-50 z-50 p-1 animate-in fade-in zoom-in-95 duration-100 shadow-md">

            <div className="px-3 py-2 text-xs text-stone-500 border-b border-stone-200 mb-1 font-mono break-all">
              {user.email}
            </div>

            <button
              onClick={() => router.push('/app/settings')} // Assuming a profile/settings page
              className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Configuración de Cuenta
            </button>

            <button
              onClick={handleBilling}
              className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-200 transition-colors flex justify-between items-center group"
            >
              <span>Suscripción</span>
              <span className="text-[10px] text-stone-400 group-hover:text-stone-600">Stripe ↗</span>
            </button>

            <div className="h-px bg-stone-200 my-1" />

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

