"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * Client-side OAuth callback handler
 *
 * This page handles the OAuth callback from Google. It:
 * 1. Extracts the code from URL (if present)
 * 2. Lets Supabase browser client handle the session
 * 3. Redirects to /app on success or /login on failure
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState("Verificando sesión...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for error in URL params
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        if (error) {
          console.error("[Auth Callback Client] OAuth error:", error, errorDescription);
          router.replace(`/login?error=${encodeURIComponent(errorDescription || error)}`);
          return;
        }

        // Check if we have a code to exchange
        const code = params.get("code");

        if (code) {
          setStatus("Intercambiando código...");

          // The browser client should handle the PKCE exchange automatically
          // when we call getSession after an OAuth redirect
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("[Auth Callback Client] Session error:", sessionError);
            router.replace(`/login?error=${encodeURIComponent(sessionError.message)}`);
            return;
          }

          if (session) {
            console.log("[Auth Callback Client] Session found, redirecting to /app");
            setStatus("¡Sesión iniciada! Redirigiendo...");
            router.replace("/app");
            return;
          }

          // If no session yet, try exchangeCodeForSession explicitly
          setStatus("Estableciendo sesión...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[Auth Callback Client] Exchange error:", exchangeError);
            router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`);
            return;
          }

          // Check session again
          const { data: { session: newSession } } = await supabase.auth.getSession();

          if (newSession) {
            console.log("[Auth Callback Client] Session established after exchange");
            setStatus("¡Sesión iniciada! Redirigiendo...");
            router.replace("/app");
          } else {
            console.error("[Auth Callback Client] No session after exchange");
            router.replace("/login?error=No se pudo establecer la sesión");
          }
        } else {
          // No code - check if we already have a session (e.g., from implicit flow)
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            router.replace("/app");
          } else {
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("[Auth Callback Client] Unexpected error:", err);
        router.replace("/login?error=Error inesperado");
      }
    }

    handleCallback();
  }, [router, supabase.auth]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-black/60">{status}</p>
      </div>
    </main>
  );
}
