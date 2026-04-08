'use client'

import React, { useCallback, useEffect, useRef } from 'react'

export interface TextEditorProps {
    name?: string
    label?: string
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    placeholder?: string
    helperText?: string
    error?: boolean
    minHeight?: number
    field?: Record<string, unknown>
    [key: string]: unknown
}

const TextEditor: React.FC<TextEditorProps> = ({
    name,
    label,
    value = '',
    onChange,
    disabled = false,
    readonly = false,
    required = false,
    placeholder = 'Enter text…',
    helperText,
    error = false,
    minHeight = 200,
    field,
}) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const suppressRef = useRef(false)

    const isDisabled = Boolean(disabled || field?.disabled)
    const isReadonly = Boolean(readonly || field?.readonly || field?.readOnly)
    const displayLabel = label || (field?.label as string) || ''

    // Sync external value → DOM without resetting cursor
    useEffect(() => {
        const el = editorRef.current
        if (!el) return
        if (suppressRef.current) { suppressRef.current = false; return }
        if (el.innerHTML !== (value ?? '')) {
            el.innerHTML = value ?? ''
        }
    }, [value])

    const handleInput = useCallback(() => {
        suppressRef.current = true
        onChange?.(editorRef.current?.innerHTML ?? '')
    }, [onChange])

    const borderColor = error
        ? 'var(--gogo-danger, #e53e3e)'
        : 'var(--gogo-border, #e2e8f0)'

    const toolbarActions: { cmd: string; label: string; title: string }[] = [
        { cmd: 'bold', label: '<b>B</b>', title: 'Bold' },
        { cmd: 'italic', label: '<i>I</i>', title: 'Italic' },
        { cmd: 'underline', label: '<u>U</u>', title: 'Underline' },
        { cmd: 'insertUnorderedList', label: '&#8226;&#8226;', title: 'Bullet list' },
        { cmd: 'insertOrderedList', label: '1.', title: 'Numbered list' },
    ]

    const execCmd = (cmd: string) => {
        if (isDisabled || isReadonly) return
        editorRef.current?.focus()
        document.execCommand(cmd, false)
        suppressRef.current = true
        onChange?.(editorRef.current?.innerHTML ?? '')
    }

    return (
        <div className="text-editor-wrapper space-y-1">
            {displayLabel && (
                <label
                    className="block text-sm font-medium text-[var(--gogo-text-primary)]"
                    htmlFor={name}
                >
                    {displayLabel}
                    {required && <span className="ml-1 text-[var(--gogo-danger,#e53e3e)]">*</span>}
                </label>
            )}

            {/* Toolbar */}
            {!isDisabled && !isReadonly && (
                <div
                    className="flex gap-1 rounded-t border border-b-0 bg-[var(--gogo-bg-secondary,#f7fafc)] p-1"
                    style={{ borderColor }}
                >
                    {toolbarActions.map(({ cmd, label, title }) => (
                        <button
                            key={cmd}
                            type="button"
                            title={title}
                            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd) }}
                            className="rounded px-2 py-0.5 text-xs hover:bg-[var(--gogo-bg-hover,#edf2f7)] text-[var(--gogo-text-primary)]"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    ))}
                </div>
            )}

            {/* Editable area */}
            <div
                ref={editorRef}
                id={name}
                contentEditable={!isDisabled && !isReadonly}
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className={[
                    'w-full rounded border px-3 py-2 text-sm outline-none',
                    'text-[var(--gogo-text-primary)] bg-[var(--gogo-bg-primary,#fff)]',
                    !isDisabled && !isReadonly && 'focus:ring-2 focus:ring-[var(--gogo-primary,#3b82f6)]',
                    isDisabled && 'cursor-not-allowed opacity-50',
                    isReadonly && 'bg-[var(--gogo-bg-secondary,#f7fafc)]',
                    !isDisabled && !isReadonly ? 'rounded-t-none' : 'rounded',
                ].filter(Boolean).join(' ')}
                style={{
                    minHeight,
                    borderColor,
                }}
            />

            {helperText && (
                <p
                    className="text-xs"
                    style={{ color: error ? 'var(--gogo-danger,#e53e3e)' : 'var(--gogo-text-secondary,#718096)' }}
                >
                    {helperText}
                </p>
            )}

            <style>{`
                [data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: var(--gogo-text-hint, #a0aec0);
                    pointer-events: none;
                }
            `}</style>
        </div>
    )
}

export default TextEditor
