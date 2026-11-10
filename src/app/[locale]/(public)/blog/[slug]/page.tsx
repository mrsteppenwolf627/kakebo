import { getBlogPost, getBlogPosts, CLUSTER_HUBS } from "@/lib/blog";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { components } from "@/components/mdx/MDXComponents";
import { RelatedPosts } from "@/components/mdx/RelatedPosts";
import { ClusterSpokes } from "@/components/mdx/ClusterSpokes";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Image from 'next/image';
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";

interface Props {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

// Prerenderiza cada artículo en cada locale en que existe. Es seguro porque el layout raíz y esta página fijan el locale
// con setRequestLocale (sin eso next-intl lee cabeceras y la ruta vuelve a ser dinámica: DYNAMIC_SERVER_USAGE).
// Los slugs que no existen se resuelven con notFound() (dynamicParams por defecto).
export function generateStaticParams() {
    return routing.locales.flatMap((locale) => getBlogPosts(locale).map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, locale } = await params;
    const post = getBlogPost(slug, locale);

    if (!post) {
        return {};
    }

    // Single source of truth for EN indexability: the `noindex` frontmatter
    // flag on the EN post itself, read via the same lib/blog.ts helper that
    // sitemap.ts uses to build `enNoindexSlugs`. No separate slug list here.
    const enPost = getBlogPost(slug, 'en');
    const enIsIndexable = !!enPost && !enPost.frontmatter.noindex;

    // Decoupled SEO title: falls back to the H1 (`title`) when a post has no
    // dedicated `seoTitle`, so this only changes behavior for posts that opt in.
    const seoTitle = post.frontmatter.seoTitle || post.frontmatter.title;

    return {
        title: `${seoTitle} | Blog Kakebo`,
        description: post.frontmatter.excerpt,
        ...(post.frontmatter.noindex && {
            robots: { index: false, follow: false },
        }),
        openGraph: {
            title: seoTitle,
            description: post.frontmatter.excerpt,
            type: "article",
            url: `/blog/${slug}`,
            siteName: "MetodoKakebo.com",
            images: [
                {
                    url: post.frontmatter.image || "/og-image.jpg",
                    width: 1200,
                    height: 630,
                    alt: post.frontmatter.title,
                },
            ],
        },
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`,
            languages: {
                "es": `https://www.metodokakebo.com/blog/${slug}`,
                ...(enIsIndexable && { "en": `https://www.metodokakebo.com/en/blog/${slug}` }),
                "x-default": `https://www.metodokakebo.com/blog/${slug}`
            }
        },
        twitter: {
            card: "summary_large_image",
            title: seoTitle,
            description: post.frontmatter.excerpt,
            images: [post.frontmatter.image || "/og-image.jpg"],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug, locale } = await params;
    setRequestLocale(locale);
    const post = getBlogPost(slug, locale);
    const t = await getTranslations({ locale, namespace: 'Blog.post' });

    if (!post) {
        notFound();
    }

    // FAQ: las preguntas del frontmatter que ya se leen en el cuerpo no se repiten; las que no aparecen se muestran en una
    // sección «Preguntas frecuentes» antes de los artículos relacionados. Así el FAQPage del JSON-LD coincide con lo que ve el usuario.
    const loc: S.Locale = locale === 'en' ? 'en' : 'es';
    const fmFaq = post.frontmatter.faq ?? [];
    const bodyVisible = S.visibleFaq(fmFaq, post.content);
    const faqToRender = fmFaq.filter((q) => !bodyVisible.includes(q));
    const faq = S.faqForJsonLd(fmFaq, [post.content, ...faqToRender.map((q) => `**${q.question}**\n\n${q.answer}`)].join('\n\n'));
    const graph = S.graph(
        S.blogPost({
            locale: loc,
            slug,
            title: post.frontmatter.title,
            excerpt: post.frontmatter.excerpt,
            author: post.frontmatter.author,
            date: post.frontmatter.date,
            updatedDate: post.frontmatter.updatedDate,
            image: post.frontmatter.image,
            faq,
        }),
    );

    // Hub & Spoke: migas Blog › pilar del clúster (solo si el artículo tiene clúster y no es el propio pilar).
    const cluster = post.frontmatter.cluster;
    const hub = cluster ? CLUSTER_HUBS[cluster] : undefined;
    const showCrumbs = !!hub && hub.slug !== slug;
    const hubExists = !!hub && getBlogPost(hub.slug, locale) !== null;
    const hubAnchorEn = { metodo: 'Kakebo method', plantillas: 'Kakebo templates', ahorro: 'how to save money each month', apps: 'Fintonic alternatives' } as const;
    const hubLabel = hub && cluster ? (locale === 'es' ? hub.anchor : hubAnchorEn[cluster]) : '';

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <article className="mx-auto max-w-3xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-10 text-center">
                    {/* Editorial eyebrow */}
                    <div className="mb-6 flex items-center justify-center gap-3" aria-hidden="true">
                        <div className="h-px w-8 bg-primary/30" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary/60">Blog</span>
                        <div className="h-px w-8 bg-primary/30" />
                    </div>

                    <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                        <time dateTime={post.frontmatter.date}>
                            {new Date(post.frontmatter.date).toLocaleDateString(locale === 'es' ? "es-ES" : "en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                        {post.frontmatter.updatedDate && post.frontmatter.updatedDate !== post.frontmatter.date && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>
                                    {locale === 'es' ? "Actualizado el " : "Updated "}
                                    <time dateTime={post.frontmatter.updatedDate}>
                                        {new Date(post.frontmatter.updatedDate).toLocaleDateString(locale === 'es' ? "es-ES" : "en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </time>
                                </span>
                            </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{post.frontmatter.readingTime}</span>
                    </div>

                    {showCrumbs && hub && (
                        <nav aria-label={locale === 'es' ? 'Migas de pan' : 'Breadcrumb'} className="mb-5 text-sm text-muted-foreground">
                            <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                                <li>
                                    <Link href="/blog" className="hover:text-primary hover:underline">Blog</Link>
                                </li>
                                {hubExists && (
                                    <>
                                        <li aria-hidden="true">›</li>
                                        <li>
                                            <Link href={`/blog/${hub.slug}`} className="hover:text-primary hover:underline">{hubLabel}</Link>
                                        </li>
                                    </>
                                )}
                            </ol>
                        </nav>
                    )}

                    <h1 className="mb-7 text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-5xl">
                        {post.frontmatter.title}
                    </h1>

                    <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-sm select-none">
                            {post.frontmatter.author[0]}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{post.frontmatter.author}</span>
                    </div>
                </header>

                {/* Separator between header and body */}
                <div className="mb-10 h-px bg-border" aria-hidden="true" />

                {post.frontmatter.image && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-12">
                        <Image
                            src={post.frontmatter.image}
                            alt={post.frontmatter.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 768px"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert mx-auto prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground prose-p:font-light prose-p:leading-relaxed prose-li:font-light prose-li:marker:text-primary">
                    <MDXRemote
                        source={post.content}
                        components={components}
                        options={{
                            mdxOptions: {
                                remarkPlugins: [remarkGfm],
                            },
                        }}
                    />
                </div>

                {faqToRender.length > 0 && (
                    <section aria-labelledby="blog-faq-title" className="mt-12">
                        <h2 id="blog-faq-title" className="mb-4 text-2xl font-serif font-bold text-foreground">{t('faqTitle')}</h2>
                        <components.FaqSection>
                            {faqToRender.map((item) => (
                                <components.FaqItem key={item.question} question={S.plain(item.question)}>
                                    {S.plain(item.answer)}
                                </components.FaqItem>
                            ))}
                        </components.FaqSection>
                    </section>
                )}

                {post.frontmatter.role === 'pillar' && cluster && (
                    <ClusterSpokes cluster={cluster} slug={slug} locale={locale} />
                )}

                {post.frontmatter.related && post.frontmatter.related.length > 0 && (
                    <RelatedPosts slugs={post.frontmatter.related} locale={locale} cluster={cluster} />
                )}

            </article>

            {/* CTA */}
            <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
                <div className="rounded-2xl bg-foreground px-8 py-12 text-center text-background sm:px-16">
                    <div className="mb-4 text-2xl font-serif font-bold">
                        {t('cta.title')}
                    </div>
                    <p className="mx-auto mb-8 max-w-md text-background/70 font-light leading-relaxed">
                        {t('cta.text')}
                    </p>
                    <Link
                        href="/login?mode=signup"
                        className="inline-block rounded-full bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                    >
                        {t('cta.button')}
                    </Link>
                </div>
            </div>


            <JsonLd graph={graph} />
        </main>
    );
}
