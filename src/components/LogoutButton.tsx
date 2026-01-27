"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";


export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    router.refresh();   // limpia estado/caché de server components
    router.push("/");   // o "/login" si tienes una ruta de login
  };

  return (
    <button
      onClick={onLogout}
      className="rounded-lg border px-3 py-2 text-sm"
    >
      Cerrar sesión
    </button>
  );
}
