"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/new", label: "+ Nuevo Gasto", primary: true },
  { href: "/settings", label: "Ajustes" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {items.map((item) => {
        const active = pathname === item.href;

        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="ml-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
            >
              {item.label}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              active
                ? "bg-gray-100 text-black"
                : "text-gray-500 hover:text-black hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Menú de usuario */}
      <UserMenu />
    </nav>
  );
}
