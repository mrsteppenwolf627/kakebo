import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center border border-stone-900 bg-stone-900">
                <span className="text-lg font-serif text-white">K</span>
              </div>
              <span className="text-lg font-serif text-stone-900">Kakebo</span>
            </div>
            <p className="text-sm text-stone-600 font-light leading-relaxed">
              Control de gastos minimalista basado en el método japonés Kakebo.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-stone-900">Producto</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-stone-900">Cuenta</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-sm text-stone-600 font-light transition-colors hover:text-stone-900"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-stone-900">Legal</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-stone-600 font-light">Privacidad</span>
              </li>
              <li>
                <span className="text-sm text-stone-600 font-light">Términos</span>
              </li>
              <li>
                <span className="text-sm text-stone-600 font-light">Cookies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-stone-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-stone-500 font-light">
              © {new Date().getFullYear()} Kakebo Ahorro
            </p>

            <div className="flex items-center gap-6 text-xs text-stone-500 font-light">
              <span className="flex items-center gap-1">
                Stripe
              </span>
              <span className="flex items-center gap-1">
                Seguro
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
