import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Navbar } from "@/components/landing";
import { MDXRemote } from "next-mdx-remote/rsc";

interface Props {
    params: {
        slug: string;
    };
}

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = getBlogPost(params.slug);

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
            url: `/blog/${params.slug}`,
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
            canonical: `/blog/${params.slug}`,
        },
    };
}

export default function BlogPostPage({ params }: Props) {
    const post = getBlogPost(params.slug);

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
                            {new Date(post.frontmatter.date).toLocaleDateString("es-ES", {
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

                {/* Content */}
                <div className="prose prose-lg prose-stone dark:prose-invert mx-auto">
                    <MDXRemote source={post.content} />
                </div>

                {/* CTA */}
                <div className="mt-16 rounded-2xl bg-stone-900 px-6 py-10 text-center text-white sm:px-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">
                        ¿Quieres aplicar el método Kakebo sin esfuerzo?
                    </h2>
                    <p className="mb-8 text-stone-300">
                        Regístrate gratis en Kakebo AI y empieza a controlar tus gastos hoy mismo.
                    </p>
                    <Link
                        href="/login?mode=signup"
                        className="inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-stone-900 transition-transform hover:scale-105"
                    >
                        Crear cuenta gratis
                    </Link>
                </div>
            </article>

            <Footer />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
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
                    }),
                }}
            />
        </main>
    );
}
