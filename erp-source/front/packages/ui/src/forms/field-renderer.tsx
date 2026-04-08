'use client'

/**
 * Field Renderer Component
 * Centralised field-rendering logic that maps field types to form components.
 * Used across Form, Modal, Drawer and Gallery for consistency.
 *
 * NOTE: Some component prop APIs differ between the monorepo fork and Bixo ERP
 * (e.g. `value` vs `checked` for SingleCheckbox, `onValueChange` vs `onChange`
 * for Input). Adapt the component call-sites below if your form components
 * deviate from the fork's expectations.
 */

import React, { useMemo, useCallback } from 'react'
import { Input } from '../forms/form'
import { Textarea as TextArea } from '../forms/form'
import { Select } from '../forms/form'
import { DatePicker } from '../forms/date-picker'
import { MultiCheckBox as MultiCheckbox } from '../forms/multi-check-box'
import { SingleCheckbox } from '../forms/single-checkbox'
import { Switch as SwitchSingle } from '../forms/switch'
import { Radio } from '../forms/radio'
import { Slider } from '../forms/slider'
import { Rating } from '../forms/rating'
import { Tags } from '../forms/tags'
import { ToggleButtonGroup } from '../navigation/toggle-button-group'
import TextEditor from '../forms/text-editor'
import PhoneInput from '../forms/phone-input'
// Gallery is placed in forms/ — make sure you have migrated gallery.tsx
import Gallery from '../forms/gallery'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldAttributes {
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    rows?: number
    options?: any[]
    min?: number
    max?: number
    allowCustom?: boolean
    maxTags?: number
    [key: string]: any
}

interface Field {
    name: string
    label?: string
    type: string
    value?: any
    default_value?: any
    key?: string
    disabled?: boolean
    isDisabled?: boolean
    readonly?: boolean
    readOnly?: boolean
    required?: boolean
    placeholder?: string
    rows?: number
    options?: any[]
    min?: number
    max?: number
    allowCustom?: boolean
    maxTags?: number
    pickerType?: 'date' | 'time' | 'datetime' | 'daterange'
    isEditingMode?: boolean
    attributes?: FieldAttributes
    [key: string]: any
}

interface SettingsConfig {
    groups?: Record<string, { show?: boolean; edit?: boolean }>
    fields?: Record<string, { show?: boolean; edit?: boolean }>
}

export interface FieldRendererProps {
    field: Field
    value: any
    onChange: (value: any) => void
    disabled?: boolean
    readonly?: boolean
    error?: boolean
    helperText?: string
    baseUrl?: string
    _settings?: SettingsConfig
    groupKey?: string
    isEditingMode?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const determineFieldEditability = (
    groupSettings: { show?: boolean; edit?: boolean } | null | undefined,
    fieldSettings: { show?: boolean; edit?: boolean } | null | undefined,
    isInEditMode: boolean
): { disabled: boolean; readonly: boolean } => {
    if (groupSettings?.edit === false) return { disabled: true, readonly: true }
    if (groupSettings?.edit === true && !isInEditMode) return { disabled: true, readonly: true }
    if (groupSettings?.edit === true && isInEditMode) {
        const isFieldEditable = fieldSettings?.edit !== false
        return { disabled: !isFieldEditable, readonly: !isFieldEditable }
    }
    return { disabled: !isInEditMode, readonly: !isInEditMode }
}

const createCleanedField = (
    field: Field,
    attributes: FieldAttributes,
    hasGroupSettings: boolean,
    disabled: boolean,
    readonly: boolean
): Field => {
    if (!hasGroupSettings) return field
    return {
        ...field,
        disabled,
        isDisabled: disabled,
        readonly,
        readOnly: readonly,
        attributes: { ...attributes, disabled, readonly },
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

const FieldRendererComponent: React.FC<FieldRendererProps> = ({
    field,
    value,
    onChange,
    disabled = false,
    readonly = false,
    error = false,
    helperText = '',
    _settings = {},
    baseUrl,
    groupKey,
    isEditingMode = false,
}) => {
    const attributes = useMemo(() => field?.attributes || {}, [field])
    const fieldValue = value ?? field?.value ?? field?.default_value ?? null
    const fieldKey = field?.key || field?.name
    const isInEditMode = isEditingMode || field?.isEditingMode || false

    const groupSettings = useMemo(
        () => (groupKey ? _settings?.groups?.[groupKey] ?? null : null),
        [groupKey, _settings]
    )
    const fieldSettings = useMemo(
        () => (fieldKey ? _settings?.fields?.[fieldKey] ?? null : null),
        [fieldKey, _settings]
    )

    const { disabled: finalDisabled, readonly: finalReadonly } = useMemo(
        () => determineFieldEditability(groupSettings, fieldSettings, isInEditMode),
        [groupSettings, fieldSettings, isInEditMode]
    )

    const cleanedField = useMemo(
        () => createCleanedField(field, attributes, !!groupSettings, finalDisabled, finalReadonly),
        [field, attributes, groupSettings, finalDisabled, finalReadonly]
    )

    const resolvedDisabled = groupSettings
        ? finalDisabled
        : !!(disabled || field?.disabled || field?.isDisabled || attributes.disabled)
    const resolvedReadonly = groupSettings
        ? finalReadonly
        : !!(readonly || field?.readonly || field?.readOnly || attributes.readonly)

    const commonProps = useMemo(
        () => ({
            name: field?.name ?? '',
            label: field?.label,
            disabled: resolvedDisabled,
            readonly: resolvedReadonly,
            required: !!(field?.required || attributes.required),
            error,
            helperText,
            fullWidth: true,
        }),
        [
            field?.name,
            field?.label,
            field?.required,
            attributes.required,
            resolvedDisabled,
            resolvedReadonly,
            error,
            helperText,
        ]
    )

    const handleSwitchChange = useCallback(
        (_key: string, val: any) => onChange(val),
        [onChange]
    )
    const handleSliderChange = useCallback((val: number | number[]) => onChange(val), [onChange])
    const handleRatingChange = useCallback((val: number | null) => onChange(val), [onChange])
    const handleGalleryChange = useCallback(
        (_fieldKey: string, galleryValue: any[]) => onChange(galleryValue),
        [onChange]
    )

    const fieldComponents = useMemo(
        (): Record<string, () => React.ReactNode> => ({
            text: () => (
                <Input
                    {...(commonProps as any)}
                    type="text"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            email: () => (
                <Input
                    {...(commonProps as any)}
                    type="email"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            password: () => (
                <Input
                    {...(commonProps as any)}
                    type="password"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            number: () => (
                <Input
                    {...(commonProps as any)}
                    type="number"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            url: () => (
                <Input
                    {...(commonProps as any)}
                    type="url"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            search: () => (
                <Input
                    {...(commonProps as any)}
                    type="search"
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                />
            ),
            tel: () => (
                <PhoneInput
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            phone: () => (
                <PhoneInput
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            mobile: () => (
                <PhoneInput
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            textarea: () => (
                <TextArea
                    {...(commonProps as any)}
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                    placeholder={cleanedField.placeholder}
                    rows={cleanedField.rows || cleanedField.attributes?.rows || 3}
                />
            ),
            select: () => (
                <Select
                    {...(commonProps as any)}
                    value={fieldValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                    options={cleanedField.options || cleanedField.attributes?.options || []}
                />
            ),
            multiselect: () => (
                <Select
                    {...(commonProps as any)}
                    value={fieldValue}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                    options={cleanedField.options || cleanedField.attributes?.options || []}
                    multiple
                />
            ),
            checkbox: () => {
                const opts = cleanedField.options || cleanedField.attributes?.options
                return opts?.length ? (
                    <MultiCheckbox
                        {...(commonProps as any)}
                        field={cleanedField}
                        value={fieldValue}
                        onChange={onChange}
                    />
                ) : (
                    <SingleCheckbox
                        {...(commonProps as any)}
                        checked={!!fieldValue}
                        onChange={onChange}
                    />
                )
            },
            multicheckbox: () => (
                <MultiCheckbox
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                />
            ),
            toggle: () => (
                <ToggleButtonGroup
                    {...(commonProps as any)}
                    value={fieldValue}
                    onChange={onChange}
                    options={cleanedField.options || cleanedField.attributes?.options || []}
                />
            ),
            switch: () => (
                <SwitchSingle
                    {...(commonProps as any)}
                    checked={!!fieldValue}
                    onChange={(checked: boolean) => handleSwitchChange(cleanedField.name, checked)}
                />
            ),
            radio: () => (
                <Radio
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    options={cleanedField.options || cleanedField.attributes?.options || []}
                />
            ),
            slider: () => (
                <Slider
                    {...(commonProps as any)}
                    value={fieldValue}
                    onChange={handleSliderChange}
                    min={cleanedField.min || cleanedField.attributes?.min}
                    max={cleanedField.max || cleanedField.attributes?.max}
                />
            ),
            rating: () => (
                <Rating
                    {...(commonProps as any)}
                    value={fieldValue}
                    onChange={handleRatingChange}
                />
            ),
            tags: () => (
                <Tags
                    name={cleanedField.name}
                    label={cleanedField.label}
                    value={fieldValue}
                    onChange={onChange}
                    disabled={commonProps.disabled}
                    readonly={commonProps.readonly}
                    required={commonProps.required}
                    help={commonProps.helperText}
                    options={cleanedField.options || cleanedField.attributes?.options}
                    allowCustom={cleanedField.allowCustom || cleanedField.attributes?.allowCustom}
                    maxTags={cleanedField.maxTags || cleanedField.attributes?.maxTags}
                />
            ),
            date: () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType={cleanedField.pickerType || 'date'}
                />
            ),
            time: () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType="time"
                />
            ),
            datetime: () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType="datetime"
                />
            ),
            'datetime-local': () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType="datetime"
                />
            ),
            month: () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType="date"
                />
            ),
            week: () => (
                <DatePicker
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue}
                    onChange={onChange}
                    pickerType="date"
                />
            ),
            richtext: () => (
                <TextEditor
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            editor: () => (
                <TextEditor
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            wysiwyg: () => (
                <TextEditor
                    {...(commonProps as any)}
                    field={cleanedField}
                    value={fieldValue ?? ''}
                    onChange={onChange}
                />
            ),
            file: () => (
                <Gallery
                    field={cleanedField}
                    value={fieldValue}
                    baseUrl={baseUrl}
                    onChange={handleGalleryChange}
                    fieldRenderer={FieldRenderer as any}
                />
            ),
            image: () => (
                <Gallery
                    field={cleanedField}
                    value={fieldValue}
                    baseUrl={baseUrl}
                    onChange={handleGalleryChange}
                    fieldRenderer={FieldRenderer as any}
                />
            ),
            color: () => (
                <Input
                    {...(commonProps as any)}
                    type="color"
                    value={fieldValue ?? '#000000'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                />
            ),
        }),
        [
            commonProps,
            cleanedField,
            fieldValue,
            onChange,
            handleSwitchChange,
            handleSliderChange,
            handleRatingChange,
            handleGalleryChange,
            baseUrl,
        ]
    )

    // Guards — must come after all hooks
    if (!field || !field.name) return null
    if (fieldSettings?.show === false) return null

    const renderField =
        fieldComponents[field.type] ??
        (() => (
            <Input
                {...(commonProps as any)}
                type="text"
                value={fieldValue ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={cleanedField.placeholder}
            />
        ))

    return <React.Fragment key={field.name}>{renderField()}</React.Fragment>
}

/**
 * Memoized FieldRenderer
 */
export const FieldRenderer = React.memo(FieldRendererComponent, (prev, next) => {
    return (
        prev.field === next.field &&
        prev.value === next.value &&
        prev.onChange === next.onChange &&
        prev.disabled === next.disabled &&
        prev.readonly === next.readonly &&
        prev.error === next.error &&
        prev.helperText === next.helperText &&
        prev.baseUrl === next.baseUrl &&
        prev._settings === next._settings &&
        prev.groupKey === next.groupKey &&
        prev.isEditingMode === next.isEditingMode
    )
})

/**
 * Hook-based wrapper for functional usage
 */
export const useFieldRenderer = (
    field: Field,
    value: any,
    onChange: (value: any) => void,
    options?: Omit<FieldRendererProps, 'field' | 'value' | 'onChange'>
) => <FieldRenderer field={field} value={value} onChange={onChange} {...options} />

/**
 * Error Boundary for FieldRenderer
 */
class FieldRendererErrorBoundary extends React.Component<
    { children: React.ReactNode; fieldName?: string },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode; fieldName?: string }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[FieldRenderer Error]', { fieldName: this.props.fieldName, error, errorInfo })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-2 text-sm text-red-600">
                    Error rendering field: {this.props.fieldName || 'Unknown'}
                </div>
            )
        }
        return this.props.children
    }
}

/**
 * Safe Field Renderer with Error Boundary (recommended for production)
 */
export const SafeFieldRenderer: React.FC<FieldRendererProps> = (props) => (
    <FieldRendererErrorBoundary fieldName={props.field?.name}>
        <FieldRenderer {...props} />
    </FieldRendererErrorBoundary>
)

export default FieldRenderer
