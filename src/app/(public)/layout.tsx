import type React from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // NO h-screen, NO overflow-hidden, NO fixed, NO wrappers raros
  return <>{children}</>;
}
