'use client';

import * as React from 'react';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ')
}

export interface DateTimeRangePickerProps {
    value?: [string, string] | null;
    onChange?: (range: [string, string]) => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const DateTimeRangePicker: React.FC<DateTimeRangePickerProps> = ({
    value,
    onChange,
    disabled,
    size = 'small',
    className,
}) => {
    const [start, setStart] = React.useState(value?.[0] || '');
    const [end, setEnd] = React.useState(value?.[1] || '');

    React.useEffect(() => {
        if (value) {
            setStart(value[0] || '');
            setEnd(value[1] || '');
        }
    }, [value]);

    const inputCls = cn(
        'px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--gogo-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'border-[var(--gogo-divider)]',
        size === 'small' ? 'text-sm h-9' : size === 'large' ? 'text-lg h-12' : 'text-base h-10'
    );

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStart(e.target.value);
        if (onChange) onChange([e.target.value, end]);
    };
    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEnd(e.target.value);
        if (onChange) onChange([start, e.target.value]);
    };

    return (
        <div className={cn('flex gap-2 items-center flex-wrap', className)}>
            <input
                type="datetime-local"
                value={start}
                onChange={handleStartChange}
                disabled={disabled}
                className={inputCls}
            />
            <span className="text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>–</span>
            <input
                type="datetime-local"
                value={end}
                onChange={handleEndChange}
                disabled={disabled}
                className={inputCls}
            />
        </div>
    );
};

export default DateTimeRangePicker;
