"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      // En OAuth, Supabase suele guardar la sesión automáticamente con el hash (#access_token...)
      // Esto fuerza a refrescar y comprobar sesión antes de redirigir.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
      } else {
        router.replace("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Finalizando login...</p>
    </main>
  );
}
