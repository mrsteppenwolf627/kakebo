import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Footer, Navbar } from "@/components/landing";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { components } from "@/components/mdx/MDXComponents";
import { RelatedPosts } from "@/components/mdx/RelatedPosts";
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

interface Props {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

// Removed generateStaticParams to fix DYNAMIC_SERVER_USAGE error.
// The `[locale]` segment is inherently dynamic due to next-intl, so we must render these dynamically.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, locale } = await params;
    const post = getBlogPost(slug, locale);

    if (!post) {
        return {};
    }

    return {
        title: `${post.frontmatter.title} | Blog Kakebo`,
        description: post.frontmatter.excerpt,
        openGraph: {
            title: post.frontmatter.title,
            description: post.frontmatter.excerpt,
            type: "article",
            url: `/blog/${slug}`,
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
                "en": `https://www.metodokakebo.com/en/blog/${slug}`,
                "x-default": `https://www.metodokakebo.com/blog/${slug}`
            }
        },
        twitter: {
            card: "summary_large_image",
            title: post.frontmatter.title,
            description: post.frontmatter.excerpt,
            images: [post.frontmatter.image || "/og-image.jpg"],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug, locale } = await params;
    const post = getBlogPost(slug, locale);
    const t = await getTranslations({ locale, namespace: 'Blog.post' });

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <article className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-12 text-center">
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <time dateTime={post.frontmatter.date}>
                            {new Date(post.frontmatter.date).toLocaleDateString(locale === 'es' ? "es-ES" : "en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                        <span>•</span>
                        <span>{post.frontmatter.readingTime}</span>
                    </div>

                    <h1 className="mb-6 text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-5xl">
                        {post.frontmatter.title}
                    </h1>

                    <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold">
                            {post.frontmatter.author[0]}
                        </div>
                        <span className="text-sm font-medium">{post.frontmatter.author}</span>
                    </div>
                </header>

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
                <div className="prose prose-lg prose-stone dark:prose-invert mx-auto prose-headings:font-serif prose-headings:font-bold prose-p:font-light prose-p:leading-relaxed prose-li:font-light">
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

                {post.frontmatter.related && post.frontmatter.related.length > 0 && (
                    <RelatedPosts slugs={post.frontmatter.related} locale={locale} />
                )}

                {/* CTA */}
                <div className="mt-16 rounded-2xl bg-foreground px-6 py-10 text-center text-background sm:px-12">
                    <div className="mb-4 text-2xl font-serif font-bold">
                        {t('cta.title')}
                    </div>
                    <p className="mb-8 text-background/70">
                        {t('cta.text')}
                    </p>
                    <Link
                        href="/login?mode=signup"
                        className="inline-block rounded-full bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                    >
                        {t('cta.button')}
                    </Link>
                </div>
            </article>

            <Footer />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "BlogPosting",
                            headline: post.frontmatter.title,
                            image: [post.frontmatter.image || "https://www.metodokakebo.com/og-image.jpg"],
                            datePublished: post.frontmatter.date,
                            dateModified: post.frontmatter.date,
                            author: [{
                                "@type": "Person",
                                name: post.frontmatter.author,
                            }],
                            publisher: {
                                "@type": "Organization",
                                name: "Kakebo",
                                logo: {
                                    "@type": "ImageObject",
                                    url: "https://www.metodokakebo.com/logo.png"
                                }
                            },
                            mainEntityOfPage: {
                                "@type": "WebPage",
                                "@id": `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`
                            }
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            itemListElement: [
                                {
                                    "@type": "ListItem",
                                    position: 1,
                                    name: locale === 'es' ? "Inicio" : "Home",
                                    item: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}`
                                },
                                {
                                    "@type": "ListItem",
                                    position: 2,
                                    name: "Blog",
                                    item: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog`
                                },
                                {
                                    "@type": "ListItem",
                                    position: 3,
                                    name: post.frontmatter.title,
                                    item: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`
                                }
                            ]
                        },
                        ...(post.frontmatter.faq ? [{
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: post.frontmatter.faq.map(item => ({
                                "@type": "Question",
                                name: item.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: item.answer
                                }
                            }))
                        }] : []),
                        ...(slug === 'plantilla-kakebo-excel' ? [{
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "Plantilla Kakebo Excel Gratis",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Excel, Google Sheets",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "EUR"
                            },
                            "description": "Plantilla gratuita de Excel para llevar el método Kakebo de forma manual y organizada.",
                            "featureList": [
                                "4 categorías Kakebo",
                                "Control de ingresos y gastos fijos",
                                "Balance mensual automático",
                                "Gráficos de ahorro"
                            ]
                        }] : [])
                    ]),
                }}
            />
        </main>
    );
}
