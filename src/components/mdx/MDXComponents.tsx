/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "@/i18n/routing";
import React from "react";

function CustomLink(props: any) {
    const { href, className, ...restProps } = props;
    const customClass = className || "";
    const baseClass = "text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors";
    const combinedClass = customClass ? `${baseClass} ${customClass}` : baseClass;

    if (!href) {
        return <a {...restProps} className={combinedClass} />;
    }

    if (href.startsWith("/")) {
        // If the URL already contains the localized prefix (e.g. href="/es" or href="/en/blog"),
        // next-intl's Link will crash with a 500 Server Error because it expects un-prefixed paths.
        // We strip the locale before passing it to the internal Link component.
        const unPrefixedHref = href.replace(/^\/(es|en)(\/|$)/, '/') || '/';
        const finalHref = unPrefixedHref === '//' ? '/' : unPrefixedHref;

        return (
            <Link href={finalHref} {...restProps} className={combinedClass}>
                {props.children}
            </Link>
        );
    }

    if (href.startsWith("#")) {
        return <a href={href} {...restProps} className={combinedClass} />;
    }

    return <a href={href} target="_blank" rel="noopener noreferrer" {...restProps} className={combinedClass} />;
}

function RoundedImage(props: any) {
    return <img alt={props.alt || "Blog image"} className="rounded-xl border border-border my-8 w-full h-auto object-cover" {...props} />;
}

function Callout(props: any) {
    return (
        <div className="flex gap-4 p-5 my-8 bg-muted/30 border border-border rounded-xl text-foreground not-prose">
            {props.emoji && <div className="text-xl select-none shrink-0 mt-0.5">{props.emoji}</div>}
            <div className="flex-1 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_strong]:font-semibold">{props.children}</div>
        </div>
    );
}

function Table(props: any) {
    return (
        <div className="my-8 w-full overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm" {...props} />
        </div>
    );
}

function TableHead(props: any) {
    return <thead className="bg-muted/50 text-foreground font-serif border-b border-border" {...props} />;
}

function TableRow(props: any) {
    return <tr className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors" {...props} />;
}

function TableHeader(props: any) {
    return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide align-middle [&:has([role=checkbox])]:pr-0" {...props} />;
}

function TableCell(props: any) {
    return <td className="px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0" {...props} />;
}

function Blockquote(props: any) {
    return (
        <blockquote className="not-prose my-8 border-l-[3px] border-primary pl-5 py-3 pr-4 bg-muted/20 rounded-r-lg text-muted-foreground text-base leading-relaxed" {...props} />
    );
}

function HorizontalRule() {
    return (
        <div className="not-prose my-10 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            </div>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function ToolCTA({ title, description, href, cta }: {
    title: string;
    description: string;
    href: string;
    cta: string;
}) {
    return (
        <div className="not-prose my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <p className="mb-1.5 font-serif font-semibold text-foreground">{title}</p>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <Link
                href={href as any}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-6"
            >
                {cta}
            </Link>
        </div>
    );
}

function SimpleCTA({ href, cta }: { href: string; cta: string }) {
    return (
        <div className="not-prose my-10 flex justify-center">
            <Link
                href={href as any}
                className="inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </Link>
        </div>
    );
}

function DownloadCTA({ href, cta }: { href: string; cta: string }) {
    return (
        <div className="not-prose my-8 flex justify-center">
            <a
                href={href}
                download
                className="inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </a>
        </div>
    );
}

function ArticleCTA({ children, href, cta }: {
    children: React.ReactNode;
    href: string;
    cta: string;
}) {
    return (
        <div className="not-prose my-10 rounded-2xl bg-foreground px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="mb-6 [&_h3]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-background sm:[&_h3]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-background/70">
                {children}
            </div>
            <Link
                href={href as any}
                className="inline-flex w-full max-w-xs items-center justify-center rounded-2xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-foreground sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </Link>
        </div>
    );
}

function FaqSection(props: any) {
    return (
        <div
            className="not-prose my-10 rounded-xl border border-border bg-muted/30 overflow-hidden divide-y divide-border"
            {...props}
        />
    );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
    return (
        <div className="px-6 py-5">
            <div className="flex items-start gap-2.5 mb-3">
                <span className="mt-0.5 shrink-0 text-primary font-bold leading-none select-none">?</span>
                <span className="font-serif font-semibold text-foreground text-base leading-snug">{question}</span>
            </div>
            <div className="pl-6 text-sm text-muted-foreground leading-relaxed [&>p]:m-0 [&_strong]:text-foreground [&_strong]:font-semibold">
                {children}
            </div>
        </div>
    );
}

export const components = {
    a: CustomLink,
    img: RoundedImage,
    hr: HorizontalRule,
    Callout,
    ToolCTA,
    ArticleCTA,
    SimpleCTA,
    DownloadCTA,
    FaqSection,
    FaqItem,
    table: Table,
    thead: TableHead,
    tr: TableRow,
    th: TableHeader,
    td: TableCell,
    blockquote: Blockquote,
};
