'use client'

import React from 'react'

export interface RowComponentProps {
    type?: 'row'
    name?: string
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    align?: 'start' | 'center' | 'end' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
    wrap?: boolean
    visible?: boolean
    slots?: {
        items?: {
            name?: string
            meta?: any
            components?: any[]
        }
    }
    children?: React.ReactNode
    /** Optional ComponentRenderer passed in to avoid circular imports */
    ComponentRenderer?: React.ComponentType<{ component: any }>
}

const gapClasses: Record<string, string> = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4',
}

const alignClasses: Record<string, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
}

const justifyClasses: Record<string, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
}

const normalize = (v: string) => (v === 'left' ? 'start' : v === 'right' ? 'end' : v)

export const Row: React.FC<RowComponentProps> = ({
    gap = 'md',
    align = 'start',
    justify = 'start',
    wrap = false,
    visible = true,
    slots,
    children,
    ComponentRenderer,
}) => {
    if (!visible) return null

    const components = slots?.items?.components ?? []
    const alignClass = alignClasses[normalize(align)] ?? 'items-start'
    const justifyClass = justifyClasses[normalize(justify)] ?? 'justify-start'
    const gapClass = gapClasses[gap] ?? 'gap-2'

    return (
        <div
            className={`flex flex-row ${gapClass} ${alignClass} ${justifyClass} ${wrap ? 'flex-wrap' : 'flex-nowrap'
                }`}
        >
            {ComponentRenderer
                ? components.map((component: any, index: number) => (
                    <ComponentRenderer key={component.name ?? index} component={component} />
                ))
                : null}
            {children}
        </div>
    )
}

export default Row
