import Link from "next/link";
import React from "react";
import Image from "next/image";

function CustomLink(props: any) {
    const href = props.href;

    if (href.startsWith("/")) {
        return (
            <Link href={href} {...props} className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors">
                {props.children}
            </Link>
        );
    }

    if (href.startsWith("#")) {
        return <a {...props} />;
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors" />;
}

function RoundedImage(props: any) {
    return <Image alt={props.alt} className="rounded-xl border border-stone-200 shadow-sm my-8" {...props} />;
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
