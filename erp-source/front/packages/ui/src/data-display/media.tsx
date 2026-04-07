"use client";

import React, { useState } from "react";
import { X, ZoomIn } from "lucide-react";

type MediaType = "image" | "video" | "audio";

export interface MediaProps {
    src: string;
    type?: MediaType;
    alt?: string;
    title?: string;
    caption?: string;
    width?: number | string;
    height?: number | string;
    fit?: "cover" | "contain" | "fill";
    rounded?: boolean;
    lightbox?: boolean;
    className?: string;
}

function detectType(src: string): MediaType {
    const ext = src.split(".").pop()?.toLowerCase() ?? "";
    if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) return "audio";
    return "image";
}

export function Media({ src, type, alt = "", title, caption, width, height, fit = "cover", rounded = true, lightbox = false, className = "" }: MediaProps) {
    const [open, setOpen] = useState(false);
    const mediaType = type ?? detectType(src);

    const fitClass = { cover: "object-cover", contain: "object-contain", fill: "object-fill" }[fit];
    const roundedClass = rounded ? "rounded-lg" : "";

    const renderMedia = (inLightbox = false) => {
        const style: React.CSSProperties = {
            width: inLightbox ? "auto" : width,
            height: inLightbox ? "auto" : height,
            maxWidth: inLightbox ? "90vw" : undefined,
            maxHeight: inLightbox ? "90vh" : undefined,
        };
        if (mediaType === "video") {
            return <video src={src} controls className={`${roundedClass} ${fitClass} w-full`} style={style} title={title} />;
        }
        if (mediaType === "audio") {
            return <audio src={src} controls className="w-full" title={title} />;
        }
        return (
            <img
                src={src}
                alt={alt}
                className={`${inLightbox ? "" : `w-full h-full ${fitClass}`} ${roundedClass}`}
                style={style}
                loading="lazy"
            />
        );
    };

    return (
        <>
            <figure
                className={`inline-block overflow-hidden ${roundedClass} ${className}`}
                style={{ width, height }}
            >
                <div className={`relative group ${mediaType === "image" && lightbox ? "cursor-zoom-in" : ""}`} onClick={() => lightbox && mediaType === "image" && setOpen(true)}>
                    {renderMedia()}
                    {lightbox && mediaType === "image" && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                        </div>
                    )}
                </div>
                {(title || caption) && (
                    <figcaption className="px-2 py-1.5 text-xs" style={{ color: "var(--gogo-text-secondary)" }}>
                        {title && <span className="font-medium">{title}</span>}
                        {title && caption && " – "}
                        {caption}
                    </figcaption>
                )}
            </figure>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                        {renderMedia(true)}
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
