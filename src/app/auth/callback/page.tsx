"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      // Esto hace que supabase-js lea el hash (#access_token=...) y guarde sesión
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Callback error:", error.message);
        router.replace("/login");
        return;
      }

      // Si ya hay sesión, vamos al dashboard (o home)
      if (data.session) {
        router.replace("/");
        return;
      }

      // Si no hay sesión todavía, reintenta un poco
      setTimeout(async () => {
        const again = await supabase.auth.getSession();
        if (again.data.session) router.replace("/");
        else router.replace("/login");
      }, 300);
    }

    run();
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      Procesando login…
    </div>
  );
}
