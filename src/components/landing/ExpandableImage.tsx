"use client";

import { useState } from "react";
import Image from "next/image";

export default function ExpandableImage({ src, alt, title }: { src: string; alt: string; title?: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <div
                className="cursor-zoom-in group relative w-full h-full overflow-hidden rounded-xl border border-border bg-muted/10 shadow-sm transition-all hover:ring-2 hover:ring-primary/50 overflow-hidden"
                onClick={() => setIsExpanded(true)}
                title="Haz click para ampliar"
            >
                <Image
                    src={src}
                    alt={alt}
                    title={title || alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>

            {isExpanded && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 animate-in fade-in cursor-zoom-out"
                    onClick={() => setIsExpanded(false)}
                >
                    <div className="relative w-full max-w-6xl aspect-[16/9] animate-in zoom-in-95 rounded-xl overflow-hidden shadow-2xl border border-border">
                        <Image
                            src={src}
                            alt={alt}
                            title={title || alt}
                            fill
                            className="object-contain bg-muted/20"
                            sizes="100vw"
                        />
                        <div className="absolute top-4 right-4 bg-background/80 text-foreground p-2 rounded-full shadow-sm backdrop-blur-sm hover:bg-background transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
