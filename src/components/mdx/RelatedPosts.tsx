import { getBlogPost } from '@/lib/blog';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

interface RelatedPostsProps {
    slugs: string[];
    locale?: string;
}

export function RelatedPosts({ slugs, locale = 'es' }: RelatedPostsProps) {
    const posts = slugs
        .map(slug => getBlogPost(slug, locale))
        .filter((p): p is NonNullable<typeof p> => p !== null);

    if (posts.length === 0) return null;

    return (
        <div className="not-prose my-10">
            <h2 className="font-serif font-bold text-2xl text-foreground mb-6">
                {locale === 'es' ? 'Artículos relacionados' : 'Related articles'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map(post => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                        {post.frontmatter.image && (
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                <Image
                                    src={post.frontmatter.image}
                                    alt={post.frontmatter.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                                />
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-serif font-semibold text-foreground text-base leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                                {post.frontmatter.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {post.frontmatter.excerpt}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
