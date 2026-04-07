"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, Film, Music } from "lucide-react";

export interface FileUploadFile {
    name: string;
    size?: number;
    type?: string;
    file?: File;
    url?: string;
}

export interface FileUploadProps {
    name?: string;
    label?: string;
    value?: FileUploadFile[];
    onChange?: (files: File[]) => void;
    onRemove?: (index: number, file: FileUploadFile) => void;
    multiple?: boolean;
    accept?: string;
    maxSize?: number; // MB
    maxFiles?: number;
    disabled?: boolean;
    readonly?: boolean;
    error?: boolean;
    helperText?: string;
    required?: boolean;
    className?: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileIcon(type?: string): React.ReactNode {
    if (!type) return <FileText className="w-5 h-5" />;
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith("video/")) return <Film className="w-5 h-5" />;
    if (type.startsWith("audio/")) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
}

export function FileUpload({
    name,
    label,
    value = [],
    onChange,
    onRemove,
    multiple = false,
    accept,
    maxSize,
    maxFiles,
    disabled = false,
    readonly = false,
    error = false,
    helperText,
    required = false,
    className = "",
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState<string | null>(null);

    const isDisabled = disabled || readonly;

    const processFiles = useCallback((fileList: FileList | null) => {
        if (!fileList || isDisabled) return;
        setSizeError(null);
        const files = Array.from(fileList);
        if (maxSize) {
            const oversize = files.find((f) => f.size > maxSize * 1024 * 1024);
            if (oversize) { setSizeError(`File "${oversize.name}" exceeds ${maxSize}MB limit`); return; }
        }
        if (maxFiles && value.length + files.length > maxFiles) {
            setSizeError(`Max ${maxFiles} file(s) allowed`); return;
        }
        onChange?.(files);
    }, [isDisabled, maxSize, maxFiles, value.length, onChange]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label className="block text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}

            {!readonly && (
                <div
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer ${dragging ? "border-[var(--gogo-primary)] bg-[var(--gogo-primary)]/5" : ""} ${error ? "border-red-400" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={!error && !dragging ? { borderColor: "var(--gogo-divider)" } : {}}
                    onClick={() => !isDisabled && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={isDisabled ? -1 : 0}
                    onKeyDown={(e) => e.key === "Enter" && !isDisabled && inputRef.current?.click()}
                >
                    <Upload className="w-8 h-8" style={{ color: "var(--gogo-text-secondary)" }} />
                    <div>
                        <p className="text-sm font-medium" style={{ color: "var(--gogo-primary)" }}>Click to upload</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>
                            or drag and drop {accept ? `(${accept})` : ""}
                            {maxSize ? ` — max ${maxSize}MB each` : ""}
                        </p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        name={name}
                        accept={accept}
                        multiple={multiple}
                        disabled={isDisabled}
                        required={required && value.length === 0}
                        className="sr-only"
                        onChange={(e) => processFiles(e.target.files)}
                    />
                </div>
            )}

            {(sizeError || helperText || error) && (
                <p className={`text-xs ${sizeError || error ? "text-red-500" : ""}`} style={!sizeError && !error ? { color: "var(--gogo-text-secondary)" } : {}}>
                    {sizeError || helperText}
                </p>
            )}

            {value.length > 0 && (
                <ul className="space-y-2">
                    {value.map((file, idx) => (
                        <li
                            key={idx}
                            className="flex items-center gap-3 px-3 py-2 rounded-md"
                            style={{ backgroundColor: "var(--gogo-grey-100)" }}
                        >
                            <span style={{ color: "var(--gogo-text-secondary)" }}>{fileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--gogo-text-primary)" }}>{file.name}</p>
                                {file.size !== undefined && (
                                    <p className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{formatBytes(file.size)}</p>
                                )}
                            </div>
                            {!readonly && onRemove && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(idx, file)}
                                    className="flex-shrink-0 p-1 rounded-full hover:opacity-70 focused:outline-none"
                                    style={{ color: "var(--gogo-text-secondary)" }}
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
