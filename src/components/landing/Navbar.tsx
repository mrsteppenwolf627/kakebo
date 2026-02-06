import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70">
          <div className="flex h-10 w-10 items-center justify-center border border-stone-900 bg-stone-900">
            <span className="text-lg font-serif text-white">K</span>
          </div>
          <span className="text-lg font-serif text-stone-900">
            Kakebo
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#pricing"
            className="text-sm font-light text-stone-700 transition-colors hover:text-stone-900"
          >
            Precios
          </Link>
          <Link
            href="#features"
            className="text-sm font-light text-stone-700 transition-colors hover:text-stone-900"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-light text-stone-700 transition-colors hover:text-stone-900"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center border border-stone-300 bg-white px-4 py-2 text-sm font-light text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-light text-white transition-colors hover:bg-stone-800"
          >
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
}
