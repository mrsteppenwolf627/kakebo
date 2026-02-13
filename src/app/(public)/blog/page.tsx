import { getBlogPosts } from "@/lib/blog";
import { Metadata } from "next";
import Link from "next/link";
import { Footer, Navbar } from "@/components/landing";

export const metadata: Metadata = {
    title: "Blog de Finanzas Kakebo | Ahorro y Método Japonés",
    description:
        "Artículos sobre el método Kakebo, ahorro inteligente, finanzas personales y estilo de vida minimalista. Aprende a gestionar tu dinero con Kakebo AI.",
    alternates: {
        canonical: "/blog",
    },
};

export default function BlogIndexPage() {
    const posts = getBlogPosts();

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-serif font-bold text-foreground sm:text-5xl mb-4">
                            Blog Kakebo
                        </h1>
                        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                            Consejos prácticos sobre ahorro, finanzas personales y vida consciente.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <article
                                key={post.slug}
                                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                {/* Image placeholder - In real app, use next/image with post.frontmatter.image */}
                                <div className="aspect-video w-full bg-muted/50 flex items-center justify-center text-muted-foreground/20">
                                    <span className="text-4xl font-serif">K</span>
                                </div>

                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <time dateTime={post.frontmatter.date}>
                                            {new Date(post.frontmatter.date).toLocaleDateString("es-ES", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </time>
                                        <span>•</span>
                                        <span>{post.frontmatter.readingTime || "5 min lectura"}</span>
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
                                        Leer artículo
                                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
