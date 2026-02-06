import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-gray-200/50 bg-gradient-to-b from-white to-violet-50/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
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
              <span className="text-lg font-bold text-gray-900">Kakebo Ahorro</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Control de gastos minimalista basado en el método japonés Kakebo. Simple, efectivo,
              sin humo.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-gray-900">Producto</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-gray-900">Cuenta</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-sm text-gray-600 transition-colors hover:text-violet-600"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-gray-900">Legal</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-gray-600">Privacidad</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Términos</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Cookies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200/50 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Kakebo Ahorro. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Pagos por Stripe
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Datos seguros
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
