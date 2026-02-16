import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center border border-foreground bg-foreground">
                <span className="text-lg font-serif text-background">K</span>
              </div>
              <span className="text-lg font-serif text-foreground">Kakebo</span>
            </div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Control de gastos minimalista basado en el método japonés Kakebo.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">Producto</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/herramientas/regla-50-30-20"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Calculadora 50/30/20
                </Link>
              </li>
              <li>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Calculadora Inflación
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">Cuenta</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground font-light">
              © {new Date().getFullYear()} Kakebo Ahorro
            </p>

            <div className="flex items-center gap-6 text-xs text-muted-foreground font-light">
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
