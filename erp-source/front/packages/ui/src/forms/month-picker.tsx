'use client';

import * as React from 'react';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ')
}

export interface MonthPickerProps {
    value?: string | null;
    onChange?: (month: string) => void;
    minMonth?: string;
    maxMonth?: string;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
    value,
    onChange,
    minMonth,
    maxMonth,
    disabled,
    size = 'small',
    className,
}) => {
    return (
        <input
            type="month"
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            min={minMonth}
            max={maxMonth}
            disabled={disabled}
            className={cn(
                'px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--gogo-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                'border-[var(--gogo-divider)]',
                size === 'small' ? 'text-sm h-9' : size === 'large' ? 'text-lg h-12' : 'text-base h-10',
                className
            )}
        />
    );
};

export default MonthPicker;
