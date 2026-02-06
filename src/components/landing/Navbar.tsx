import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Kakebo Ahorro
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#pricing"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-violet-600"
          >
            Precios
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-violet-600"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-violet-600"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center rounded-xl border border-gray-300 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-white hover:border-violet-300 hover:text-violet-700"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
