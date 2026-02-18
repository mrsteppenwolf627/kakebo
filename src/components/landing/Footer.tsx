import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Navigation");

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
              {useTranslations("Common")("description")}
            </p>

            {/* Product Hunt Widget */}
            <div className="mt-6">
              <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', border: '1px solid rgb(224, 224, 224)', borderRadius: '12px', padding: '20px', maxWidth: '100%', background: 'rgb(255, 255, 255)', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 2px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img alt="Kakebo AI" src="https://ph-files.imgix.net/d1cd4cfe-7e75-46f8-a1f8-0690e8027122.png?auto=format&fit=crop&w=80&h=80" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: '1 1 0%', minWidth: '0px' }}>
                    <h3 style={{ margin: '0px', fontSize: '18px', fontWeight: 600, color: 'rgb(26, 26, 26)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kakebo AI</h3>
                    <p style={{ margin: '4px 0px 0px', fontSize: '14px', color: 'rgb(102, 102, 102)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>Minimalist Japanese Kakebo method, now powered by AI</p>
                  </div>
                </div>
                <a href="https://www.producthunt.com/products/kakebo-ai?embed=true&utm_source=embed&utm_medium=post_embed" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', padding: '8px 16px', background: 'rgb(255, 97, 84)', color: 'rgb(255, 255, 255)', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>Check it out on Product Hunt →</a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-serif text-foreground">{t('product')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground font-light transition-colors hover:text-foreground"
                >
                  {t('pricing')}
                </Link>
              </li>
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
                Stripe
              </span>
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
