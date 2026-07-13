"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Link } from "@/i18n/routing";
import { analytics } from "@/lib/analytics";

export function ToolCTA({ title, description, href, cta }: {
    title: string;
    description: string;
    href: string;
    cta: string;
}) {
    const isLoginCta = href === "/" || href.startsWith("/login");
    return (
        <div className="not-prose my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <p className="mb-1.5 font-serif font-semibold text-foreground">{title}</p>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <Link
                href={href as any}
                onClick={isLoginCta ? () => analytics.track("click_cta_login", { source_page: window.location.pathname, cta_label: cta, cta_location: "blog_tool_cta" }) : undefined}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-6"
            >
                {cta}
            </Link>
        </div>
    );
}

export function SimpleCTA({ href, cta }: { href: string; cta: string }) {
    return (
        <div className="not-prose my-10 flex justify-center">
            <Link
                href={href as any}
                onClick={() => analytics.track("click_cta_login", { source_page: window.location.pathname, cta_label: cta, cta_location: "blog_simple_cta" })}
                className="inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </Link>
        </div>
    );
}

export function ChoiceCTA({ title, description, primaryHref, primaryCta, primaryLocation, secondaryHref, secondaryCta }: {
    title: string;
    description: string;
    primaryHref: string;
    primaryCta: string;
    primaryLocation: string;
    secondaryHref: string;
    secondaryCta: string;
}) {
    return (
        <div className="not-prose my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <p className="mb-1.5 font-serif font-semibold text-foreground">{title}</p>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                    href={primaryHref as any}
                    onClick={() => analytics.track("click_cta_login", { source_page: window.location.pathname, cta_label: primaryCta, cta_location: primaryLocation })}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-6"
                >
                    {primaryCta}
                </Link>
                <a
                    href={secondaryHref}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-6"
                >
                    {secondaryCta}
                </a>
            </div>
        </div>
    );
}

export function DownloadCTA({ href, cta }: { href: string; cta: string }) {
    return (
        <div className="not-prose my-8 flex justify-center">
            <a
                href={href}
                download
                onClick={() => analytics.track("download_template", { template_type: "excel", source_page: window.location.pathname, location: "blog_download_cta" })}
                className="inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </a>
        </div>
    );
}

export function ArticleCTA({ children, href, cta }: {
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
                onClick={() => analytics.track("click_cta_login", { source_page: window.location.pathname, cta_label: cta, cta_location: "blog_article_cta" })}
                className="inline-flex w-full max-w-xs items-center justify-center rounded-2xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-foreground sm:w-auto sm:rounded-full sm:px-8"
            >
                {cta}
            </Link>
        </div>
    );
}
