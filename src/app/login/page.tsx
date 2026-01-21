"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loginGoogle() {
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" }, // fuerza selector de cuenta
        },
      });

      if (error) throw error;
    } catch (e: any) {
      setMsg(e?.message ?? "Error desconocido");
      setLoading(false);
    }
  }

  async function authEmail() {
    setLoading(true);
    setMsg(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Cuenta creada. Ahora inicia sesión.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-black/10 p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Acceso</h1>
        <p className="text-sm text-black/60">
          Entra para ver tu calendario y tus gastos.
        </p>

        <button
          onClick={loginGoogle}
          disabled={loading}
          className="w-full border border-black px-4 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-60"
        >
          {loading ? "Abriendo Google..." : "Entrar con Google"}
        </button>

        <div className="border-t border-black/10 pt-4 space-y-3">
          <div className="space-y-2">
            <label className="text-xs text-black/60">Email</label>
            <input
              className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-black/60">Contraseña</label>
            <input
              className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          {msg && <p className="text-sm text-black/60">{msg}</p>}

          <button
            onClick={authEmail}
            disabled={loading || !email || !password}
            className="w-full bg-black text-white py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {mode === "login" ? "Entrar con email" : "Crear cuenta"}
          </button>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-black/60 hover:text-black"
          >
            {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
        </div>
      </div>
    </main>
  );
}
