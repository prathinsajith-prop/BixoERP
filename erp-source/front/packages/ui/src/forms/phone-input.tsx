'use client'

import React, { useState, useCallback, useMemo } from 'react'

export interface Country {
    code: string
    name: string
    dialCode: string
    flag: string
    format?: string
}

export interface PhoneInputProps {
    field?: any
    name?: string
    label?: string
    value?: string
    onChange?: (value: string, country: Country) => void
    onCountryChange?: (country: Country) => void
    defaultCountry?: string
    countries?: Country[]
    disabled?: boolean
    readonly?: boolean
    error?: boolean
    helperText?: string
    size?: 'small' | 'medium'
    required?: boolean
    fullWidth?: boolean
    placeholder?: string
    autoFocus?: boolean
    preferredCountries?: string[]
    onlyCountries?: string[]
    excludeCountries?: string[]
    enableSearch?: boolean
    disableDropdown?: boolean
    showDialCode?: boolean
    className?: string
}

// Default countries list
const DEFAULT_COUNTRIES: Country[] = [
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ### ####' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####' },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '#### ### ###' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '### ########' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '###-####-####' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####' },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '(##) #####-####' },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '### ### ####' },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '### ### ###' },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '### ### ####' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '## ########' },
    { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: '###-### ## ##' },
    { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: '#### ####' },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: '## ### ####' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: '## ### ####' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: '### ### ####' },
    { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '### ### ###' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '###-####-####' },
    { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '### ### ####' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '## ### ####' },
]

export const PhoneInput: React.FC<PhoneInputProps> = ({
    field,
    name,
    label = 'Phone Number',
    value = '',
    onChange,
    onCountryChange,
    defaultCountry = 'US',
    countries = DEFAULT_COUNTRIES,
    disabled = false,
    readonly = false,
    error = false,
    helperText,
    size = 'medium',
    required = false,
    fullWidth = true,
    placeholder,
    autoFocus = false,
    preferredCountries = [],
    onlyCountries = [],
    excludeCountries = [],
    enableSearch = false,
    disableDropdown = false,
    showDialCode = true,
    className = '',
}) => {
    const isDisabled = disabled || field?.disabled || field?.isDisabled
    const isReadonly = readonly || field?.readonly || field?.readOnly

    const filteredCountries = useMemo(() => {
        let result = countries
        if (onlyCountries.length) result = result.filter((c) => onlyCountries.includes(c.code))
        if (excludeCountries.length) result = result.filter((c) => !excludeCountries.includes(c.code))
        if (preferredCountries.length) {
            const pref = result.filter((c) => preferredCountries.includes(c.code))
            const rest = result.filter((c) => !preferredCountries.includes(c.code))
            result = [...pref, ...rest]
        }
        return result
    }, [countries, onlyCountries, excludeCountries, preferredCountries])

    const [selectedCountry, setSelectedCountry] = useState<Country>(
        () => filteredCountries.find((c) => c.code === defaultCountry) || filteredCountries[0]
    )
    const [phoneNumber, setPhoneNumber] = useState(() => {
        if (value) {
            const dc = selectedCountry?.dialCode
            if (dc && value.startsWith(dc)) return value.slice(dc.length).trim()
        }
        return value
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const formatPhoneNumber = useCallback((input: string, format?: string): string => {
        if (!format) return input
        const numbers = input.replace(/\D/g, '')
        let formatted = ''
        let ni = 0
        for (let i = 0; i < format.length && ni < numbers.length; i++) {
            formatted += format[i] === '#' ? numbers[ni++] : format[i]
        }
        return formatted
    }, [])

    const handleCountrySelect = useCallback(
        (country: Country) => {
            setSelectedCountry(country)
            setDropdownOpen(false)
            setSearchTerm('')
            onCountryChange?.(country)
            onChange?.(`${country.dialCode} ${phoneNumber}`, country)
        },
        [phoneNumber, onChange, onCountryChange]
    )

    const handlePhoneChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value.replace(/[^\d\s-]/g, '')
            const formatted = formatPhoneNumber(input, selectedCountry.format)
            setPhoneNumber(formatted)
            onChange?.(`${selectedCountry.dialCode} ${formatted}`, selectedCountry)
        },
        [selectedCountry, onChange, formatPhoneNumber]
    )

    const searchFilteredCountries = useMemo(() => {
        if (!enableSearch || !searchTerm) return filteredCountries
        const t = searchTerm.toLowerCase()
        return filteredCountries.filter(
            (c) =>
                c.name.toLowerCase().includes(t) ||
                c.code.toLowerCase().includes(t) ||
                c.dialCode.includes(t)
        )
    }, [filteredCountries, searchTerm, enableSearch])

    const inputSizeClass = size === 'small' ? 'py-1.5 text-sm' : 'py-2 text-sm'
    const borderClass = error
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'focus:border-[var(--gogo-primary)] focus:ring-[var(--gogo-primary)]/20'

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className={`block text-sm font-medium mb-1 ${error ? 'text-red-600' : 'text-[var(--gogo-text-primary)]'}`}>
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}

            <div className="flex gap-2 items-stretch">
                {/* Country selector */}
                {!disableDropdown && (
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            disabled={isDisabled || isReadonly}
                            onClick={() => setDropdownOpen((p) => !p)}
                            className={`flex items-center gap-1.5 px-2.5 ${inputSizeClass} border ${borderClass} rounded-[var(--radius-md)] bg-white disabled:opacity-50 cursor-pointer h-full`}
                        >
                            <span className="text-base">{selectedCountry.flag}</span>
                            {showDialCode && (
                                <span className="text-sm text-[var(--gogo-text-secondary)]">
                                    {selectedCountry.dialCode}
                                </span>
                            )}
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute z-50 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-lg">
                                {enableSearch && (
                                    <div className="sticky top-0 bg-white p-2 border-b">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:border-[var(--gogo-primary)]"
                                            autoFocus
                                        />
                                    </div>
                                )}
                                {searchFilteredCountries.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left ${selectedCountry.code === country.code ? 'bg-blue-50 text-blue-700' : ''
                                            }`}
                                    >
                                        <span>{country.flag}</span>
                                        <span className="flex-1 truncate">{country.name}</span>
                                        <span className="text-gray-400 text-xs">{country.dialCode}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Phone input */}
                <div className={`relative ${fullWidth ? 'flex-1' : ''}`}>
                    {disableDropdown && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span>{selectedCountry.flag}</span>
                            <span className="text-sm text-gray-500">{selectedCountry.dialCode}</span>
                        </div>
                    )}
                    <input
                        type="tel"
                        name={name || field?.name}
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        disabled={isDisabled}
                        readOnly={isReadonly}
                        required={required}
                        autoFocus={autoFocus}
                        placeholder={
                            placeholder ||
                            selectedCountry.format?.replace(/#/g, '0') ||
                            'Enter phone number'
                        }
                        className={`gogo-input block w-full ${inputSizeClass} ${disableDropdown ? 'pl-20' : 'px-3'
                            } pr-3 border rounded-[var(--radius-md)] transition-colors focus:outline-none focus:ring-2 ${borderClass} disabled:opacity-50`}
                    />
                </div>
            </div>

            {helperText && (
                <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-[var(--gogo-text-secondary)]'}`}>
                    {helperText}
                </p>
            )}
        </div>
    )
}

export default PhoneInput
