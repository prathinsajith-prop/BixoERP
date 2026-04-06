'use client';

import React from 'react';

export interface TabItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
}

interface TabsProps {
    tabs: TabItem[];
    activeKey: string;
    onChange: (key: string) => void;
    variant?: 'pills' | 'line';
    className?: string;
}

export function Tabs({ tabs, activeKey, onChange, variant = 'line', className = '' }: TabsProps) {
    if (variant === 'pills') {
        return (
            <div
                className={`flex gap-1 overflow-x-auto p-1 ${className}`}
                style={{
                    backgroundColor: 'var(--gogo-surface)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                }}
                role="tablist"
            >
                {tabs.map((tab) => {
                    const isActive = tab.key === activeKey;
                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={isActive}
                            disabled={tab.disabled}
                            onClick={() => !tab.disabled && onChange(tab.key)}
                            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition
                ${tab.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                            style={{
                                borderRadius: 'var(--radius-button)',
                                backgroundColor: isActive ? 'var(--gogo-primary)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--gogo-text-secondary)',
                                boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive && !tab.disabled)
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--gogo-grey-100)';
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive && !tab.disabled)
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                            }}
                        >
                            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className="ml-1 min-w-[18px] rounded-full px-1 text-[10px] font-bold leading-[18px] text-center"
                                    style={{
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--gogo-grey-100)',
                                        color: isActive ? '#fff' : 'var(--gogo-text-secondary)',
                                    }}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // variant === 'line'
    return (
        <div
            className={`flex overflow-x-auto ${className}`}
            style={{ borderBottom: '1px solid var(--gogo-divider)' }}
            role="tablist"
        >
            {tabs.map((tab) => {
                const isActive = tab.key === activeKey;
                return (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={isActive}
                        disabled={tab.disabled}
                        onClick={() => !tab.disabled && onChange(tab.key)}
                        className={`flex items-center gap-1.5 whitespace-nowrap pb-3 pr-6 text-sm font-medium transition
              ${tab.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                        style={{
                            color: isActive ? 'var(--gogo-primary)' : 'var(--gogo-text-secondary)',
                            borderBottom: isActive ? '2px solid var(--gogo-primary)' : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive && !tab.disabled)
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--gogo-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive && !tab.disabled)
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--gogo-text-secondary)';
                        }}
                    >
                        {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span
                                className="ml-1 min-w-[18px] rounded-full px-1 text-[10px] font-bold leading-[18px] text-center"
                                style={{
                                    backgroundColor: isActive ? 'var(--gogo-primary)' : 'var(--gogo-grey-100)',
                                    color: isActive ? '#fff' : 'var(--gogo-text-secondary)',
                                }}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
