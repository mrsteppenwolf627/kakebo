"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState("Verificando sesión...");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        // Get the URL parameters
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        // Handle OAuth errors
        if (error) {
          console.error("[Auth Callback] OAuth error:", error, errorDescription);
          setStatus(`Error: ${errorDescription || error}`);
          setTimeout(() => router.replace("/login"), 2000);
          return;
        }

        // Exchange code for session if present
        if (code) {
          setStatus("Iniciando sesión...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[Auth Callback] Exchange error:", exchangeError);
            setStatus("Error al iniciar sesión. Redirigiendo...");
            setTimeout(() => router.replace("/login"), 2000);
            return;
          }
        }

        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check for session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[Auth Callback] Session error:", sessionError);
          setStatus("Error de sesión. Redirigiendo...");
          setTimeout(() => router.replace("/login"), 2000);
          return;
        }

        if (!mounted) return;

        if (session) {
          setStatus("¡Sesión iniciada! Redirigiendo al dashboard...");
          // Use window.location for a full page reload to ensure cookies are set
          window.location.href = "/app";
        } else {
          // No session found, try listening for auth state change
          setStatus("Esperando autenticación...");

          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return;

            if (event === "SIGNED_IN" && newSession) {
              setStatus("¡Sesión iniciada! Redirigiendo al dashboard...");
              subscription.unsubscribe();
              window.location.href = "/app";
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            if (mounted) {
              subscription.unsubscribe();
              setStatus("No se pudo establecer sesión. Redirigiendo...");
              router.replace("/login");
            }
          }, 5000);
        }
      } catch (err) {
        console.error("[Auth Callback] Unexpected error:", err);
        if (mounted) {
          setStatus("Error inesperado. Redirigiendo...");
          setTimeout(() => router.replace("/login"), 2000);
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
        <p className="text-sm text-black/70">{status}</p>
      </div>
    </main>
  );
}
