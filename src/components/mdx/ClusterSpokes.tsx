import { getBlogPosts, type BlogCluster } from '@/lib/blog';
import { Link } from '@/i18n/routing';

interface ClusterSpokesProps {
    cluster: BlogCluster;
    /** Slug del propio pilar: no se lista a sí mismo. */
    slug: string;
    locale?: string;
}

/**
 * Lista las guías (spokes) del clúster de una página pilar. Server component.
 * Solo enlaza artículos indexables: un enlace interno a una página noindex no aporta nada.
 */
export function ClusterSpokes({ cluster, slug, locale = 'es' }: ClusterSpokesProps) {
    "use no memo";
    const spokes = getBlogPosts(locale).filter(
        (p) => p.frontmatter.cluster === cluster && p.slug !== slug && !p.frontmatter.noindex,
    );

    if (spokes.length === 0) return null;

    return (
        <section className="not-prose my-10" aria-labelledby="cluster-spokes-title">
            <h2 id="cluster-spokes-title" className="font-serif font-bold text-2xl text-foreground mb-6">
                {locale === 'es' ? 'Guías de este tema' : 'Guides on this topic'}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {spokes.map((post) => (
                    <li key={post.slug}>
                        <Link
                            href={`/blog/${post.slug}`}
                            className="group block h-full rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <h3 className="font-serif font-semibold text-foreground text-base leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                                {post.frontmatter.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {post.frontmatter.excerpt}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
