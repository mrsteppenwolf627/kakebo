import type { Metadata } from "next";
import type { ReactNode } from "react";

// La página es un componente cliente (no puede exportar metadata): el noindex va aquí,
// en metadata de servidor, para que llegue en el HTML inicial.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthCallbackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
