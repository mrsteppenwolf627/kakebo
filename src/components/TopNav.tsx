"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/settings", label: "Ajustes" },
  { href: "/new", label: "Nuevo" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "py-4 border-b-2 transition-colors",
              active
                ? "text-black border-black"
                : "text-black/60 border-transparent hover:text-black hover:border-black/30",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
