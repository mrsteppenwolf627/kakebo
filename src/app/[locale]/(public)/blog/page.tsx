import { getBlogPosts } from "@/lib/blog";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Footer, Navbar } from "@/components/landing";
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Blog.index' });
    return {
        title: t('title'),
        description: t('subtitle'),
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog`,
            languages: {
                "es": "https://www.metodokakebo.com/blog",
                "en": "https://www.metodokakebo.com/en/blog",
                "x-default": "https://www.metodokakebo.com/blog"
            }
        },
    };
}

function hasPublicImage(imagePath: string | undefined): imagePath is string {
    if (!imagePath) return false;
    return fs.existsSync(path.join(process.cwd(), 'public', imagePath));
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Blog.index' });
    const posts = getBlogPosts(locale);
    const [featured, ...rest] = posts;

    const baseUrl = `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}`;
    const indexablePosts = posts.filter(p => !p.frontmatter.noindex);
    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": t('title'),
        "description": t('subtitle'),
        "url": `${baseUrl}/blog`,
        "publisher": {
            "@type": "Organization",
            "name": "MetodoKakebo.com",
            "url": "https://www.metodokakebo.com"
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": indexablePosts.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": post.frontmatter.title,
                "description": post.frontmatter.excerpt,
                "url": `${baseUrl}/blog/${post.slug}`
            }))
        }
    };

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />

            <div className="pt-24 pb-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-serif font-bold text-foreground sm:text-5xl mb-4">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Featured post — most recent article */}
                    {featured && (
                        <article className="group flex flex-col md:flex-row overflow-hidden rounded-xl border border-primary/20 bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 mb-12">
                            <div className="relative aspect-video md:aspect-auto md:w-1/2 overflow-hidden bg-muted shrink-0">
                                {hasPublicImage(featured.frontmatter.image) ? (
                                    <Image
                                        src={featured.frontmatter.image}
                                        alt={featured.frontmatter.title}
                                        fill
                                        priority
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                                        <span className="text-6xl font-serif">K</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center p-6 md:p-10 flex-1">
                                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary font-medium px-2.5 py-1">
                                        {locale === 'es' ? 'Artículo destacado' : 'Featured'}
                                    </span>
                                    <span>·</span>
                                    <time dateTime={featured.frontmatter.date}>
                                        {new Date(featured.frontmatter.date).toLocaleDateString(locale === 'es' ? "es-ES" : "en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </time>
                                    {featured.frontmatter.readingTime && (
                                        <>
                                            <span>·</span>
                                            <span>{featured.frontmatter.readingTime}</span>
                                        </>
                                    )}
                                </div>

                                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                                    <Link href={`/blog/${featured.slug}`}>
                                        {featured.frontmatter.title}
                                    </Link>
                                </h2>

                                <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                                    {featured.frontmatter.excerpt}
                                </p>

                                <Link
                                    href={`/blog/${featured.slug}`}
                                    className="inline-flex items-center text-sm font-medium text-primary hover:underline self-start"
                                >
                                    {t('readMore')}
                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </article>
                    )}

                    {/* Remaining posts grid */}
                    {rest.length > 0 && (
                        <>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 border-t border-border/50" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest shrink-0">
                                {locale === 'es' ? 'Todos los artículos' : 'All articles'}
                            </p>
                            <div className="flex-1 border-t border-border/50" />
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {rest.map((post) => (
                                <article
                                    key={post.slug}
                                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                                >
                                    {hasPublicImage(post.frontmatter.image) ? (
                                        <div className="relative aspect-video w-full overflow-hidden">
                                            <Image
                                                src={post.frontmatter.image}
                                                alt={post.frontmatter.title}
                                                fill
                                                className="object-cover transition-transform hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video w-full bg-muted/50 flex items-center justify-center text-muted-foreground/20">
                                            <span className="text-4xl font-serif">K</span>
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <time dateTime={post.frontmatter.date}>
                                                {new Date(post.frontmatter.date).toLocaleDateString(locale === 'es' ? "es-ES" : "en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </time>
                                            <span>•</span>
                                            <span>{post.frontmatter.readingTime || t('readMore')}</span>
                                        </div>

                                        <h3 className="mb-2 text-xl font-serif font-bold text-foreground">
                                            <Link href={`/blog/${post.slug}`} className="hover:underline">
                                                {post.frontmatter.title}
                                            </Link>
                                        </h3>

                                        <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {post.frontmatter.excerpt}
                                        </p>

                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                                        >
                                            {t('readMore')}
                                            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
