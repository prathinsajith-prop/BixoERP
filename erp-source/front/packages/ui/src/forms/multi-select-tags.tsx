'use client'

import React, { useMemo } from 'react'

interface MultiSelectTagsOption {
    value?: string | number
    key?: string | number
    name?: string
    label?: string
    [key: string]: any
}

export interface MultiSelectTagsProps {
    field?: Record<string, any>
    name?: string
    label?: string
    value?: any
    onChange?: (key: string, value: any) => void
    isDisabled?: boolean
    disabled?: boolean
    required?: boolean
    error?: boolean
    helperText?: string
    options?: MultiSelectTagsOption[]
    placeholder?: string
}

export const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
    field,
    name,
    label,
    value,
    onChange,
    isDisabled,
    disabled,
    required,
    error,
    helperText,
    options: propOptions,
    placeholder = 'Select options',
}) => {
    const isDisabledFinal =
        isDisabled || disabled || field?.disabled || field?.isDisabled || field?.readonly || field?.readOnly

    const fieldKey = field?.key || field?.name || name || ''
    const displayLabel = label || field?.label || ''
    const fieldOptions = propOptions || field?.options || []

    // Normalize options to consistent shape
    const normalizedOptions = useMemo<{ raw: any; id: string; label: string }[]>(() => {
        return fieldOptions.map((opt: any) => {
            const id: string = String(opt.value ?? opt.key ?? opt.name ?? '')
            const displayLabel: string = String(opt.label ?? opt.name ?? opt.value ?? opt.key ?? id)
            return { raw: opt, id, label: displayLabel }
        })
    }, [fieldOptions])

    const originalIsObjectArray =
        Array.isArray(value) && value.some((v) => typeof v === 'object' && v !== null)

    // Convert incoming value to primitive id array
    const internalValue: string[] = useMemo(() => {
        if (!value) return []
        if (Array.isArray(value)) {
            return value
                .map((v: any) =>
                    typeof v === 'object' && v !== null ? String(v.value ?? v.key ?? v.name ?? '') : String(v ?? '')
                )
                .filter(Boolean)
        }
        return [typeof value === 'object' ? String(value.value ?? value.key ?? value.name ?? '') : String(value)]
    }, [value])

    const handleSelectChange = (selectedPrimitives: string[]) => {
        if (originalIsObjectArray) {
            const mapped = selectedPrimitives
                .map((id) => normalizedOptions.find((o) => o.id === id)?.raw)
                .filter(Boolean)
            onChange?.(fieldKey, mapped)
        } else {
            onChange?.(fieldKey, selectedPrimitives)
        }
    }

    const handleRemove = (id: string) => {
        handleSelectChange(internalValue.filter((v) => v !== id))
    }

    const handleAdd = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        if (id && !internalValue.includes(id)) {
            handleSelectChange([...internalValue, id])
        }
        // Reset select
        e.target.value = ''
    }

    const borderClass = error
        ? 'border-red-400'
        : 'border-gray-300 focus-within:border-[var(--gogo-primary)]'

    return (
        <div className="space-y-1.5">
            {displayLabel && (
                <label className={`block text-sm font-medium ${error ? 'text-red-600' : 'text-[var(--gogo-text-primary)]'}`}>
                    {displayLabel}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}

            {/* Tags display */}
            {internalValue.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-[var(--radius-md)] bg-white min-h-[40px] border-gray-200">
                    {internalValue.map((id) => {
                        const opt = normalizedOptions.find((o) => o.id === id)
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--gogo-primary)]/10 text-[var(--gogo-primary)]"
                            >
                                {opt?.label || id}
                                {!isDisabledFinal && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(id)}
                                        className="hover:text-red-500 transition-colors ml-0.5"
                                        aria-label={`Remove ${opt?.label || id}`}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </span>
                        )
                    })}
                </div>
            )}

            {/* Dropdown to add items */}
            {!isDisabledFinal && (
                <select
                    disabled={isDisabledFinal}
                    onChange={handleAdd}
                    defaultValue=""
                    className={`gogo-input w-full px-3 py-2 text-sm border rounded-[var(--radius-md)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gogo-primary)]/20 ${borderClass} disabled:opacity-50`}
                    aria-label={`Add ${displayLabel}`}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {normalizedOptions
                        .filter((o) => !internalValue.includes(o.id))
                        .map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                </select>
            )}

            {helperText && (
                <p className={`text-xs ${error ? 'text-red-600' : 'text-[var(--gogo-text-secondary)]'}`}>
                    {helperText}
                </p>
            )}
        </div>
    )
}

export default MultiSelectTags
