import { Fragment } from "react";
import { Link } from "@/i18n/routing";
import { siteCopy, type Crumb, type Locale } from "@/lib/seo/jsonld";

/**
 * Miga de pan visible. Recibe los MISMOS items que se pasan a `S.webPage({ breadcrumbs })`: el texto que se pinta es,
 * carácter a carácter, el `name` del BreadcrumbList del JSON-LD (una sola fuente por página).
 * Servidor puro. La última miga no es enlace y lleva aria-current="page".
 */
function toHref(url: string, locale: Locale): string {
  const { pathname } = new URL(url);
  // `Link` de next-intl añade el prefijo de idioma: se quita aquí para no duplicarlo (/en/blog → /blog).
  const stripped = locale === "en" ? pathname.replace(/^\/en(?=\/|$)/, "") : pathname;
  return stripped === "" ? "/" : stripped;
}

export default function Breadcrumbs({
  items,
  locale,
  align = "start",
  className = "mb-6",
}: {
  items: readonly Crumb[];
  locale: Locale;
  align?: "start" | "center";
  className?: string;
}) {
  const last = items.length - 1;
  return (
    <nav aria-label={siteCopy[locale].breadcrumbLabel} className={`${className} text-sm font-light text-muted-foreground`}>
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1${align === "center" ? " justify-center" : ""}`}>
        {items.map((item, i) => (
          <Fragment key={item.url}>
            {i > 0 && <li aria-hidden="true">/</li>}
            {i === last ? (
              <li aria-current="page">{item.name}</li>
            ) : (
              <li>
                <Link href={toHref(item.url, locale)} className="hover:text-primary hover:underline">
                  {item.name}
                </Link>
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
