"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
  
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
  
      const { data: { session } } = await supabase.auth.getSession();
  
      if (session) router.replace("/app");
      else router.replace("/login");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Finalizando login...</p>
    </main>
  );
}
