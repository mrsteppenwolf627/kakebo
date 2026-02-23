import { Link } from "@/i18n/routing";
import React from "react";
import Image from "next/image";

function CustomLink(props: any) {
    const href = props.href;
    const customClass = props.className || "";
    const baseClass = "text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors";
    const combinedClass = customClass ? `${baseClass} ${customClass}` : baseClass;

    if (!href) {
        return <a {...props} className={combinedClass} />;
    }

    if (href.startsWith("/")) {
        // If the URL already contains the localized prefix (e.g. href="/es" or href="/en/blog"),
        // next-intl's Link will crash with a 500 Server Error because it expects un-prefixed paths.
        // We strip the locale before passing it to the internal Link component.
        const unPrefixedHref = href.replace(/^\/(es|en)(\/|$)/, '/') || '/';
        const finalHref = unPrefixedHref === '//' ? '/' : unPrefixedHref;

        return (
            <Link href={finalHref} {...props} className={combinedClass}>
                {props.children}
            </Link>
        );
    }

    if (href.startsWith("#")) {
        return <a {...props} className={combinedClass} />;
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} className={combinedClass} />;
}

function RoundedImage(props: any) {
    return <img alt={props.alt || "Blog image"} className="rounded-xl border border-stone-200 shadow-sm my-8 w-full h-auto object-cover" {...props} />;
}

function Callout(props: any) {
    return (
        <div className="flex gap-4 p-4 my-8 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
            {props.emoji && <div className="text-xl select-none">{props.emoji}</div>}
            <div className="flex-1">{props.children}</div>
        </div>
    );
}

function Table(props: any) {
    return (
        <div className="my-8 w-full overflow-y-auto rounded-xl border border-stone-200 shadow-sm">
            <table className="w-full text-sm" {...props} />
        </div>
    );
}

function TableHead(props: any) {
    return <thead className="bg-stone-50 text-stone-900 font-serif border-b border-stone-200" {...props} />;
}

function TableRow(props: any) {
    return <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors" {...props} />;
}

function TableHeader(props: any) {
    return <th className="px-4 py-3 text-left font-medium align-middle [&:has([role=checkbox])]:pr-0" {...props} />;
}

function TableCell(props: any) {
    return <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props} />;
}

function Blockquote(props: any) {
    return (
        <blockquote className="my-8 border-l-4 border-primary pl-6 italic text-stone-600 bg-stone-50/50 py-4 pr-4 rounded-r-xl" {...props} />
    );
}

export const components = {
    a: CustomLink,
    img: RoundedImage,
    Callout,
    table: Table,
    thead: TableHead,
    tr: TableRow,
    th: TableHeader,
    td: TableCell,
    blockquote: Blockquote,
};
