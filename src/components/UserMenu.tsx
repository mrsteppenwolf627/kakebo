"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut, Settings, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="px-2 font-mono text-sm text-muted-foreground">...</div>;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted"
      >
        <LogIn className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
        Entrar
      </button>
    );
  }

  const label = user.user_metadata?.full_name || user.email?.split("@")[0] || "Cuenta";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Abrir menu de ${label}`}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm font-semibold text-primary">
          {initial || <UserRound className="h-4 w-4" />}
        </span>
        <span className="hidden max-w-28 truncate font-medium sm:inline">{label}</span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuenta</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => router.push("/app/settings")}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="h-4 w-4 text-primary" strokeWidth={1.8} />
            Ajustes
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}
