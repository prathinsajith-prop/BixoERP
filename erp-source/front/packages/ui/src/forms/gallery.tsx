'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileUpload } from './file-upload'

type GalleryLayout = 'grid' | 'masonry' | 'carousel'
type GalleryItemType = 'image' | 'video' | 'audio' | 'file'

export interface GalleryItem {
    id: string
    name: string
    url?: string
    path?: string
    file?: File
    expiry?: string | null
    type: GalleryItemType
    metadata?: Record<string, any>
}

export interface GalleryProps {
    field?: Record<string, unknown>
    value?: unknown[]
    onChange?: (key: string, value: GalleryItem[]) => void
    label?: string
    disabled?: boolean
    readonly?: boolean
    commonSettings?: Record<string, unknown> | null
    layout?: GalleryLayout
    allowLayoutToggle?: boolean
    columns?: number
    maxFiles?: number
    maxSize?: number
    uploadUrl?: string
    baseUrl?: string
    metadata?: Record<string, unknown>
    chunked?: boolean
    chunkSize?: number
    resetKey?: string | number
    /** Optional FieldRenderer component — passed in to avoid a circular import */
    fieldRenderer?: React.ComponentType<any>
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac'])

const guessTypeFromName = (name?: string): GalleryItemType => {
    if (!name) return 'file'
    const ext = name.split('.').pop()?.toLowerCase()
    if (!ext) return 'file'
    if (IMAGE_EXTENSIONS.has(ext)) return 'image'
    if (VIDEO_EXTENSIONS.has(ext)) return 'video'
    if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
    return 'file'
}

const resolveDisplayUrl = (
    item: GalleryItem,
    commonSettings?: Record<string, unknown> | null
): string => {
    if (item.url) return item.url
    if (!commonSettings) return ''
    const base = (commonSettings.cdn_path || commonSettings.base_path || '') as string
    const imageUrls = commonSettings.image_urls as Record<string, string> | undefined
    const display = imageUrls?.display_md || imageUrls?.display_url || imageUrls?.display_xs || ''
    if (item.path) return `${base}${display}${item.path}`
    return ''
}

const mapInitialValue = (incoming: Record<string, unknown>, index: number): GalleryItem => {
    const fallbackName = (incoming?.name || incoming?.title || `File ${index + 1}`) as string
    const source = (incoming?.url || incoming?.src || incoming?.img || incoming?.path) as string
    return {
        id: (incoming?.id || incoming?.key || `gallery-${index}-${Date.now()}`) as string,
        name: fallbackName,
        url: (incoming?.url || incoming?.src || incoming?.img) as string | undefined,
        path: incoming?.path as string | undefined,
        file: incoming?.file as File | undefined,
        expiry: (incoming?.expiry as string) || null,
        type: (incoming?.type as GalleryItemType) || guessTypeFromName(source || fallbackName),
    }
}

const Gallery: React.FC<GalleryProps> = memo(
    ({
        field,
        value,
        onChange,
        label,
        disabled,
        readonly,
        commonSettings,
        layout = 'grid',
        columns = 4,
        maxFiles,
        maxSize,
        uploadUrl,
        baseUrl,
        metadata,
        resetKey,
    }) => {
        const isDisabled = Boolean(disabled || field?.disabled || field?.isDisabled)
        const isReadonly = Boolean(readonly || field?.readonly || field?.readOnly)
        const maxFilesAllowed = (field?.maxFiles as number) || maxFiles || 20
        const fieldKey = ((field?.key || field?.name) as string) || 'gallery'
        const displayLabel = label || (field?.label as string) || ''

        const defaultBaseUrl = baseUrl || (field?.baseUrl as string) || ''
        const fieldUploadUrl = field?.uploadUrl as string
        const propUploadUrl = uploadUrl
        let resolvedUploadUrl =
            fieldUploadUrl
                ? fieldUploadUrl.startsWith('http') ? fieldUploadUrl : `${defaultBaseUrl}${fieldUploadUrl}`
                : propUploadUrl
                    ? propUploadUrl.startsWith('http') ? propUploadUrl : `${defaultBaseUrl}${propUploadUrl}`
                    : `${defaultBaseUrl}/api/upload`

        const [items, setItems] = useState<GalleryItem[]>([])
        const [layoutMode] = useState<GalleryLayout>(
            (field?.layout as GalleryLayout) || layout
        )
        const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
        const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

        const justEmittedRef = useRef(false)
        const itemsRef = useRef<GalleryItem[]>([])
        const objectUrlsRef = useRef<Set<string>>(new Set())

        useEffect(() => {
            itemsRef.current = items
        }, [items])

        useEffect(() => {
            const urls = objectUrlsRef.current
            return () => {
                urls.forEach((url) => URL.revokeObjectURL(url))
            }
        }, [])

        useEffect(() => {
            if (resetKey !== undefined) {
                objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
                objectUrlsRef.current.clear()
                setItems([])
                itemsRef.current = []
            }
        }, [resetKey])

        useEffect(() => {
            if (!value || !Array.isArray(value) || value.length === 0) {
                if (itemsRef.current.length > 0) {
                    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
                    objectUrlsRef.current.clear()
                    setItems([])
                    itemsRef.current = []
                }
                justEmittedRef.current = false
                return
            }
            if (justEmittedRef.current) {
                justEmittedRef.current = false
                return
            }
            const mapped = value.map((item, index) =>
                mapInitialValue(item as Record<string, unknown>, index)
            )
            setItems(mapped)
            itemsRef.current = mapped
        }, [value])

        const emitChange = useCallback(
            (next: GalleryItem[]) => {
                justEmittedRef.current = true
                setItems(next)
                itemsRef.current = next
                onChange?.(fieldKey, next)
            },
            [fieldKey, onChange]
        )

        const handleUploadChange = useCallback(
            (newFiles: File[] | FileList | any[] | null) => {
                if (!newFiles || isDisabled || isReadonly) return
                const filesArray = Array.isArray(newFiles) ? newFiles : Array.from(newFiles)
                const currentItems = itemsRef.current
                const existingFileRefs = new Set(currentItems.map((i) => i.file).filter(Boolean))
                const existingUrls = new Set(currentItems.map((i) => i.url).filter(Boolean))

                const trulyNewFiles = filesArray.filter((f) => {
                    const file = f instanceof File ? f : f?.file
                    const url = f instanceof File ? undefined : f?.url
                    if (file && existingFileRefs.has(file)) return false
                    if (url && existingUrls.has(url)) return false
                    return true
                })
                if (!trulyNewFiles.length) return

                const mappedFiles = trulyNewFiles.map((f) => {
                    const isFileObject = f instanceof File
                    const file = isFileObject ? f : f?.file
                    const name = isFileObject ? f.name : f?.name
                    const uploadedUrl = isFileObject ? undefined : f?.url
                    let url = uploadedUrl
                    if (!url && file) {
                        url = URL.createObjectURL(file)
                        objectUrlsRef.current.add(url)
                    }
                    return {
                        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                        name: name?.replace(/\.[^/.]+$/, '') || name || 'file',
                        url,
                        file,
                        expiry: null,
                        path: uploadedUrl,
                        type: guessTypeFromName(name || ''),
                    }
                })

                const merged = [...currentItems, ...mappedFiles].slice(0, maxFilesAllowed)
                emitChange(merged)
            },
            [emitChange, isDisabled, isReadonly, maxFilesAllowed]
        )

        const handleRemove = useCallback(
            (index: number) => {
                if (isDisabled || isReadonly) return
                const currentItems = itemsRef.current
                const removed = currentItems[index]
                if (removed?.url && objectUrlsRef.current.has(removed.url)) {
                    URL.revokeObjectURL(removed.url)
                    objectUrlsRef.current.delete(removed.url)
                }
                emitChange(currentItems.filter((_, i) => i !== index))
            },
            [emitChange, isDisabled, isReadonly]
        )

        const handleDragStart = useCallback(
            (e: React.DragEvent<HTMLDivElement>, index: number) => {
                if (isDisabled || isReadonly) return
                setDraggedIndex(index)
                e.dataTransfer.effectAllowed = 'move'
            },
            [isDisabled, isReadonly]
        )

        const handleDragOver = useCallback(
            (e: React.DragEvent<HTMLDivElement>, index: number) => {
                if (isDisabled || isReadonly) return
                e.preventDefault()
                setDraggedOverIndex(index)
            },
            [isDisabled, isReadonly]
        )

        const handleDragEnd = useCallback(() => {
            if (
                draggedIndex !== null &&
                draggedOverIndex !== null &&
                draggedIndex !== draggedOverIndex &&
                !isDisabled &&
                !isReadonly
            ) {
                const next = [...itemsRef.current]
                const [moved] = next.splice(draggedIndex, 1)
                next.splice(draggedOverIndex, 0, moved)
                emitChange(next)
            }
            setDraggedIndex(null)
            setDraggedOverIndex(null)
        }, [draggedIndex, draggedOverIndex, isDisabled, isReadonly, emitChange])

        const gridCols = useMemo(() => {
            const c = (columns || (field?.columns as number) || 4)
            return `repeat(${c}, minmax(120px, 1fr))`
        }, [columns, field?.columns])

        const renderItem = (item: GalleryItem, index: number) => {
            const src = resolveDisplayUrl(item, commonSettings)
            const isImage = item.type === 'image'
            return (
                <div
                    key={item.id}
                    draggable={!isDisabled && !isReadonly}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex flex-col gap-1 transition-all duration-200 ${draggedIndex === index ? 'opacity-60' : ''
                        } ${draggedOverIndex === index && draggedIndex !== index ? 'scale-[1.02]' : ''
                        }`}
                >
                    <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
                        {isImage && src ? (
                            <img
                                src={src}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                    className="w-10 h-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        )}

                        {!isDisabled && !isReadonly && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="p-1.5 rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-[var(--gogo-text-secondary)] truncate">{item.name}</p>
                </div>
            )
        }

        const renderCarousel = () => (
            <div className="flex gap-3 overflow-x-auto pb-2">
                {items.map((item, index) => (
                    <div key={item.id} className="flex-shrink-0 w-36">
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        )

        return (
            <div className="gallery-component space-y-3">
                {displayLabel && (
                    <label className="block text-sm font-medium text-[var(--gogo-text-primary)]">
                        {displayLabel}
                    </label>
                )}

                {!isDisabled && !isReadonly && (
                    <FileUpload
                        name={fieldKey}
                        multiple
                        maxFiles={maxFilesAllowed}
                        maxSize={maxSizeMb ? maxSizeMb * 1024 * 1024 : undefined}
                        uploadUrl={resolvedUploadUrl || undefined}
                        metadata={metadata as any}
                        onChange={handleUploadChange as any}
                    />
                )}

                {items.length > 0 && (
                    <>
                        {layoutMode === 'carousel' ? (
                            renderCarousel()
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '12px' }}>
                                {items.map((item, index) => renderItem(item, index))}
                            </div>
                        )}
                    </>
                )}

                {items.length === 0 && (isDisabled || isReadonly) && (
                    <p className="text-sm text-[var(--gogo-text-secondary)] py-3 text-center">
                        No files added
                    </p>
                )}
            </div>
        )
    }
)

Gallery.displayName = 'Gallery'
export default Gallery
