import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Navigation");

  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
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
              {useTranslations("Common")("description")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">{t('product')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link
                  href="/herramientas/calculadora-ahorro"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('toolsSavings')}
                </Link>
              </li>
              <li>
                <Link
                  href="/herramientas/regla-50-30-20"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('tools503020')}
                </Link>
              </li>
              <li>
                <Link
                  href="/herramientas/calculadora-inflacion"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('toolsInflation')}
                </Link>
              </li>
              <li>
                <Link
                  href="#alternatives"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('alternatives')}
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">{t('account')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('createAccount')}
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">{t('legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('cookies')}
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
                {t('secure')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
