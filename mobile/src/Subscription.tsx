import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Profile = { is_admin?: boolean; is_founder?: boolean; plus_access_until?: string | null };
export function Subscription({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let cancelled = false; client.from("profiles").select("is_admin,is_founder,plus_access_until").eq("id", userId).maybeSingle().then(({ data, error: queryError }) => { if (cancelled) return; if (queryError) setError("No se ha podido consultar el plan."); else setProfile(data as Profile | null); }); return () => { cancelled = true; }; }, [client, userId]);
  const plus = Boolean(profile?.is_admin || profile?.is_founder || (profile?.plus_access_until && new Date(profile.plus_access_until) > new Date()));
  return <section><h2>Tu plan</h2>{error && <p role="alert">{error}</p>}<div className="plan-card"><h3>Plan actual: {plus ? "Plus" : "gratuito"}</h3><p>{plus ? "Tu cuenta tiene acceso a las funciones avanzadas." : "Puedes usar las funciones básicas. Los informes y algunas funciones avanzadas requieren acceso Plus."}</p><ul><li>Registro de gastos e ingresos</li><li>Dashboard y ciclos</li><li>Historial y gastos fijos</li><li>{plus ? "Informes y funciones avanzadas disponibles" : "Informes y funciones avanzadas no disponibles"}</li></ul><p className="muted">La facturación Stripe está actualmente desactivada en el backend; no se inicia ningún pago desde la aplicación.</p></div></section>;
}
