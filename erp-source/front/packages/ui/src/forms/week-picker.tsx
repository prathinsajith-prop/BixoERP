'use client';

import * as React from 'react';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ')
}

export interface WeekPickerProps {
    value?: string | null;
    onChange?: (week: string) => void;
    minWeek?: string;
    maxWeek?: string;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const WeekPicker: React.FC<WeekPickerProps> = ({
    value,
    onChange,
    minWeek,
    maxWeek,
    disabled,
    size = 'small',
    className,
}) => {
    return (
        <input
            type="week"
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            min={minWeek}
            max={maxWeek}
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

export default WeekPicker;
