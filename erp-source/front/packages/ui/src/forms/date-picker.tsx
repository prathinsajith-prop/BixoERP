'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ')
}

// ── Module-scope pure helpers ─────────────────────────────────────────────────

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function toDate(v: Date | string | undefined | null): Date | undefined {
    if (v == null || v === '') return undefined
    const d = v instanceof Date ? v : new Date(v as string)
    return isNaN(d.getTime()) ? undefined : d
}

function getDaysInMonth(d: Date) {
    const y = d.getFullYear(), m = d.getMonth()
    return {
        daysInMonth: new Date(y, m + 1, 0).getDate(),
        firstDay: new Date(y, m, 1).getDay(),
    }
}

function formatHHMM(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface DatePickerProps {
    value?: Date | string | null
    onChange?: (date: any) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    pickerType?: 'date' | 'time' | 'datetime' | 'daterange'
    field?: any
    name?: string
    type?: string
    label?: string
    error?: boolean
    errorText?: string
    helperText?: string
    required?: boolean
    readonly?: boolean
    variant?: string
    size?: 'small' | 'medium' | 'large' | string | number
    min?: string | number
    max?: string | number
    fullWidth?: boolean
    width?: string | number
    onBlur?: React.FocusEventHandler<HTMLInputElement>
}

const INPUT_CLS =
    'flex h-10 rounded-md border border-[var(--gogo-divider)] px-3 py-2 text-sm ' +
    'placeholder:text-[var(--gogo-text-secondary)] focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-[var(--gogo-primary)] focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-50'

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
    (
        {
            value,
            onChange,
            placeholder = 'Pick a date',
            className,
            disabled,
            field,
            pickerType: pickerTypeProp = 'date',
            label,
            error,
            errorText,
            helperText,
        },
        ref
    ) => {
        const type = field?.type || pickerTypeProp || 'date'
        const locked =
            disabled || (field as any)?.disabled || (field as any)?.isDisabled ||
            (field as any)?.readonly || (field as any)?.readOnly

        const [date, setDate] = useState<Date | undefined>(() => toDate(value as string | Date))
        const [startDate, setStartDate] = useState<Date | undefined>()
        const [endDate, setEndDate] = useState<Date | undefined>()
        const [time, setTime] = useState('')
        const [isOpen, setIsOpen] = useState(false)
        const [currentMonth, setCurrentMonth] = useState(new Date())
        const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 })

        const calendarRef = useRef<HTMLDivElement>(null)
        const triggerRef = useRef<HTMLDivElement>(null)

        useEffect(() => {
            if (value == null || value === '') return
            if (type === 'time') {
                if (typeof value === 'string') setTime(value)
            } else if (type === 'date' || type === 'datetime') {
                const d = toDate(value as string | Date)
                if (d) {
                    setDate(d)
                    setCurrentMonth(d)
                    if (type === 'datetime') setTime(formatHHMM(d))
                }
            } else if (type === 'daterange') {
                const rv = value as any
                const s = toDate(rv?.start)
                const e = toDate(rv?.end)
                if (s) { setStartDate(s); setCurrentMonth(s) }
                if (e) setEndDate(e)
            }
        }, [value, type])

        const updatePosition = useCallback(() => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            setPopupPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            })
        }, [])

        useEffect(() => {
            if (!isOpen) return
            updatePosition()
            const handleClickOutside = (e: MouseEvent) => {
                if (
                    !calendarRef.current?.contains(e.target as Node) &&
                    !triggerRef.current?.contains(e.target as Node)
                ) setIsOpen(false)
            }
            window.addEventListener('scroll', updatePosition, true)
            window.addEventListener('resize', updatePosition)
            document.addEventListener('mousedown', handleClickOutside)
            return () => {
                window.removeEventListener('scroll', updatePosition, true)
                window.removeEventListener('resize', updatePosition)
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }, [isOpen, updatePosition])

        const handleDateChange = useCallback((newDate: Date | undefined, newTime?: string) => {
            setDate(newDate)
            if (newTime !== undefined) setTime(newTime)
            if (type === 'time' && newTime) {
                onChange?.(newTime)
            } else if (type === 'datetime' && newDate && newTime) {
                const dt = new Date(newDate)
                const [h, m] = newTime.split(':')
                dt.setHours(+h, +m)
                onChange?.(dt)
            } else if (type === 'date' && newDate) {
                onChange?.(newDate)
                setIsOpen(false)
            }
        }, [type, onChange])

        const handleDateRangeSelect = useCallback((selected: Date) => {
            if (!startDate || endDate) {
                setStartDate(selected)
                setEndDate(undefined)
            } else if (selected >= startDate) {
                setEndDate(selected)
                onChange?.({ start: startDate, end: selected })
                setIsOpen(false)
            } else {
                setStartDate(selected)
                setEndDate(undefined)
            }
        }, [startDate, endDate, onChange])

        const goToPreviousMonth = useCallback(() =>
            setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1)), [])

        const goToNextMonth = useCallback(() =>
            setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1)), [])

        const displayValue = useMemo(() => {
            if (type === 'time') return time || placeholder
            if (type === 'datetime') return date ? `${date.toLocaleDateString()} ${time}` : placeholder
            if (type === 'daterange') {
                if (startDate && endDate)
                    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                if (startDate) return `${startDate.toLocaleDateString()} - ...`
                return placeholder
            }
            return date ? date.toLocaleDateString() : placeholder
        }, [type, date, time, startDate, endDate, placeholder])

        const calendarDays = useMemo(() => {
            const { daysInMonth, firstDay } = getDaysInMonth(currentMonth)
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const cells: React.ReactNode[] = Array.from({ length: firstDay }, (_, i) => (
                <div key={`e-${i}`} className="p-2" />
            ))
            for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(year, month, day)
                const dStr = d.toDateString()
                const isSelected = !!date && dStr === date.toDateString()
                const isRangeStart = type === 'daterange' && !!startDate && dStr === startDate.toDateString()
                const isRangeEnd = type === 'daterange' && !!endDate && dStr === endDate.toDateString()
                const isInRange = type === 'daterange' && !!startDate && !!endDate && d > startDate && d < endDate
                cells.push(
                    <button
                        key={day}
                        type="button"
                        onClick={() => type === 'daterange' ? handleDateRangeSelect(d) : handleDateChange(d, time)}
                        className={cn(
                            'p-2 text-sm rounded-md hover:bg-[var(--gogo-grey-100)] transition-colors',
                            (isSelected || isRangeStart || isRangeEnd) && 'bg-[var(--gogo-primary)] text-white hover:bg-[var(--gogo-primary-dark)]',
                            isInRange && 'bg-[var(--gogo-grey-100)]'
                        )}
                    >
                        {day}
                    </button>
                )
            }
            return cells
        }, [currentMonth, date, startDate, endDate, time, type, handleDateChange, handleDateRangeSelect])

        return (
            <div ref={ref} className={cn('flex flex-col gap-1 w-full', className)}>
                {(field?.label || label) && (
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gogo-text-primary)' }}>
                        {field?.label || label}
                    </label>
                )}

                {type === 'time' && (
                    <input
                        type="time"
                        value={time}
                        onChange={e => handleDateChange(date, e.target.value)}
                        disabled={!!locked}
                        className={cn(INPUT_CLS, 'w-full', error && 'border-red-500')}
                    />
                )}

                {type !== 'time' && (
                    <div className="flex gap-2 w-full">
                        <div
                            ref={triggerRef}
                            onClick={() => !locked && setIsOpen(o => !o)}
                            className={cn(
                                INPUT_CLS,
                                'w-full cursor-pointer flex items-center justify-start',
                                !date && !startDate && 'text-[var(--gogo-text-secondary)]',
                                locked && 'opacity-50 cursor-not-allowed',
                                error && 'border-red-500'
                            )}
                        >
                            {type === 'time'
                                ? <Clock className="mr-2 h-4 w-4 shrink-0" />
                                : <Calendar className="mr-2 h-4 w-4 shrink-0" />
                            }
                            <span>{displayValue}</span>
                        </div>

                        {type === 'datetime' && (
                            <input
                                type="time"
                                value={time}
                                onChange={e => handleDateChange(date, e.target.value)}
                                disabled={!!locked}
                                className={cn(INPUT_CLS, 'w-32', error && 'border-red-500')}
                            />
                        )}
                    </div>
                )}

                {error && errorText && (
                    <span className="text-xs text-red-500 mt-1">{errorText}</span>
                )}
                {helperText && !error && (
                    <span className="text-xs mt-1" style={{ color: 'var(--gogo-text-secondary)' }}>{helperText}</span>
                )}

                {isOpen && type !== 'time' && typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            ref={calendarRef}
                            style={{
                                position: 'absolute',
                                top: `${popupPosition.top}px`,
                                left: `${popupPosition.left}px`,
                                minWidth: `${popupPosition.width}px`,
                                zIndex: 9999,
                                backgroundColor: 'var(--gogo-surface)',
                                border: '1px solid var(--gogo-divider)',
                            }}
                            className="p-3 rounded-md shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <button type="button" onClick={goToPreviousMonth} className="p-1 hover:bg-[var(--gogo-grey-100)] rounded-md">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="font-medium text-sm" style={{ color: 'var(--gogo-text-primary)' }}>
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                                <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-[var(--gogo-grey-100)] rounded-md">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {WEEKDAYS.map(d => (
                                    <div key={d} className="text-center text-xs font-medium p-2" style={{ color: 'var(--gogo-text-secondary)' }}>{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
                        </div>,
                        document.body
                    )
                }
            </div>
        )
    }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
