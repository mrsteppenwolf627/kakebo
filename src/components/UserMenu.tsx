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
    return <div className="text-sm text-gray-500 px-2">...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={goLogin}
        className="ml-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-500 hover:text-black hover:bg-gray-50"
      >
        Entrar / Crear cuenta
      </button>
    );
  }

  const label = user.email ?? "Cuenta";

  return (
    <div className="relative ml-2">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-500 hover:text-black hover:bg-gray-50"
      >
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 border border-black/10 bg-white shadow-sm rounded-lg overflow-hidden z-50">
          <div className="px-3 py-2 text-xs text-black/60 border-b border-black/10">
            Sesión iniciada como
            <div className="text-sm text-black break-all">{label}</div>
          </div>

          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-white"
          >
            Cerrar sesión
          </button>

          <button
            onClick={goLogin}
            className="w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-white"
          >
            Cambiar de cuenta
          </button>
        </div>
      )}
    </div>
  );
}
