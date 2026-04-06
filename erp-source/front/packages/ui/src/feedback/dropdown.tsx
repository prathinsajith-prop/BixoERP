'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface DropdownItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    onClick?: () => void;
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className = '' }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className={`relative inline-block ${className}`} ref={ref}>
            <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
            {open && (
                <div
                    className={`absolute top-full z-50 mt-1 min-w-48 overflow-hidden py-1
            border border-[var(--gogo-divider)] bg-[var(--gogo-surface)]
            shadow-[var(--shadow-hover)]
            ${align === 'right' ? 'right-0' : 'left-0'}`}
                    style={{ borderRadius: 'var(--radius-modal)' }}
                >
                    {items.map((item, i) => {
                        if (item.divider) {
                            return <hr key={i} className="my-1 border-[var(--gogo-divider)]" />;
                        }
                        return (
                            <button
                                key={item.key}
                                type="button"
                                disabled={item.disabled}
                                onClick={() => { item.onClick?.(); setOpen(false); }}
                                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition
                  ${item.danger
                                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        : 'text-[var(--gogo-text-primary)] hover:bg-[var(--gogo-grey-100)]'}
                  ${item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                            >
                                {item.icon && (
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                        {item.icon}
                                    </span>
                                )}
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
