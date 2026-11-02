import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, type Session } from "@supabase/supabase-js";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import "./style.css";
import { Movements } from "./Movements";
import { History } from "./History";
import { Dashboard } from "./Dashboard";
import { Settings } from "./Settings";
import { FixedExpenses } from "./FixedExpenses";
import { Assistant } from "./Assistant";
import { AIMetrics } from "./AIMetrics";
import { Reports } from "./Reports";
import { Subscription } from "./Subscription";
import { Cycles } from "./Cycles";

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <main><h1>Kakebo</h1><section><h2>Se ha producido un problema</h2><p role="alert">No se ha podido mostrar esta pantalla. Tus datos no se han eliminado.</p><button type="button" onClick={() => this.setState({ hasError: false })}>Reintentar</button></section></main>;
    return this.props.children;
  }
}

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Public API endpoint used by the installed app; no private credential is bundled.
const apiBaseUrl = "https://www.metodokakebo.com";
// Supabase persists the access/refresh session in the Android WebView storage. No service key is stored.
const supabase = url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [view, setView] = useState<"dashboard" | "movements" | "history" | "cycles" | "fixed" | "assistant" | "metrics" | "reports" | "subscription" | "settings">("dashboard");

  useEffect(() => {
    if (!supabase) return;
    const completeOAuth = async (callbackUrl: string) => {
      try {
        const callback = new URL(callbackUrl);
        const code = callback.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) setMessage("No se ha podido completar el acceso con Google.");
          else await Browser.close();
        } else {
          const hash = new URLSearchParams(callback.hash.replace(/^#/, ""));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (error) setMessage("No se ha podido completar el acceso con Google.");
            else await Browser.close();
          }
        }
      } catch { setMessage("No se ha podido completar el acceso con Google."); }
      finally { setBusy(false); }
    };
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));
    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => { void completeOAuth(url); });
    void CapacitorApp.getLaunchUrl().then((launch) => { if (launch?.url) void completeOAuth(launch.url); });
    return () => { data.subscription.unsubscribe(); void listener.then((handle) => handle.remove()); };
  }, []);

  async function signInWithGoogle() {
    if (!supabase || busy) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "com.metodokakebo.app://auth/callback", skipBrowserRedirect: true, queryParams: { prompt: "select_account" } } });
      if (error || !data.url) throw error || new Error("No se ha podido iniciar Google OAuth.");
      await Browser.open({ url: data.url, presentationStyle: "popover" });
    } catch { setMessage("No se ha podido iniciar el acceso con Google. Comprueba la configuración OAuth de Supabase."); setBusy(false); }
  }

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setMessage("");
    try {
      if (authMode === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setMessage("Si existe una cuenta con ese correo, recibirás instrucciones para recuperar la contraseña.");
      } else if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(data.session ? "Cuenta creada correctamente." : "Cuenta creada. Revisa tu correo para confirmarla.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error || !data.session) { setMessage("No se ha podido iniciar sesión. Comprueba tus datos y tu conexión."); return; }
        setSession(data.session); setPassword("");
      }
    } catch {
      setMessage(authMode === "recovery" ? "No se ha podido solicitar la recuperación. Comprueba el correo y la conexión." : "No se ha podido completar la operación. Comprueba tus datos y tu conexión.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null); setMessage("");
    } catch {
      setMessage("No se ha podido cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.");
    } finally { setBusy(false); }
  }

  return (
    <main>
      <header className="app-header"><div className="brand"><span aria-hidden="true">🏮</span><h1>Kakebo</h1></div><p>Tu economía, con calma y claridad.</p></header>
      {!online && <p className="offline-banner" role="status">Sin conexión. Los datos se actualizarán cuando vuelva Internet.</p>}
      {!supabase ? <p role="status">Falta configurar la conexión de pruebas.</p> : session ? (
        <section>
          <nav aria-label="Secciones" className="mobile-nav"><div className="nav-group">{([["dashboard", "Resumen"], ["movements", "Movimientos"], ["history", "Historial"], ["cycles", "Ciclos"]] as const).map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => setView(key)}>{label}</button>)}</div><div className="nav-group nav-group-secondary">{([["fixed", "Gastos fijos"], ["assistant", "Asistente"], ["metrics", "Métricas"], ["reports", "Informes"], ["subscription", "Plan"], ["settings", "Ajustes"]] as const).map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => setView(key)}>{label}</button>)}</div></nav>
          {view === "dashboard" && <Dashboard client={supabase} userId={session.user.id} />}
          {view === "movements" && <Movements client={supabase} userId={session.user.id} accessToken={session.access_token} apiBaseUrl={apiBaseUrl} />}
          {view === "history" && <History client={supabase} userId={session.user.id} />}
          {view === "cycles" && <Cycles accessToken={session.access_token} apiBaseUrl={apiBaseUrl} />}
          {view === "fixed" && <FixedExpenses client={supabase} userId={session.user.id} />}
          {view === "assistant" && <Assistant accessToken={session.access_token} apiBaseUrl={apiBaseUrl} />}
          {view === "metrics" && <AIMetrics accessToken={session.access_token} apiBaseUrl={apiBaseUrl} />}
          {view === "reports" && <Reports accessToken={session.access_token} apiBaseUrl={apiBaseUrl} />}
          {view === "subscription" && <Subscription client={supabase} userId={session.user.id} />}
          {view === "settings" && <Settings client={supabase} userId={session.user.id} />}
          <button type="button" onClick={signOut} disabled={busy}>Cerrar sesión</button>
        </section>
      ) : (
        <form onSubmit={signIn}>
          <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {authMode !== "recovery" && <label>Contraseña<input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          <button disabled={busy}>{busy ? "Procesando…" : authMode === "signup" ? "Crear cuenta" : authMode === "recovery" ? "Enviar recuperación" : "Iniciar sesión"}</button>
          {authMode !== "recovery" && <button type="button" className="google-button" onClick={() => void signInWithGoogle()} disabled={busy}>Continuar con Google</button>}
          <p className="auth-actions">{authMode !== "signin" && <button type="button" onClick={() => { setAuthMode("signin"); setMessage(""); }}>Volver a iniciar sesión</button>}{authMode === "signin" && <><button type="button" onClick={() => { setAuthMode("signup"); setMessage(""); }}>Crear cuenta</button><button type="button" onClick={() => { setAuthMode("recovery"); setMessage(""); }}>¿Has olvidado la contraseña?</button></>}</p>
        </form>
      )}
      {message && <p role="alert">{message}</p>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
