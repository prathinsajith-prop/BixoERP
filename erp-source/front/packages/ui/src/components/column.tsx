'use client'

import React from 'react'

export interface ColumnComponentProps {
    type?: 'column'
    name?: string
    title?: string
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    align?: 'start' | 'center' | 'end' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
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

export const Column: React.FC<ColumnComponentProps> = ({
    gap = 'md',
    align = 'start',
    justify = 'start',
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
        <div className={`flex flex-col ${gapClass} ${alignClass} ${justifyClass}`}>
            {ComponentRenderer
                ? components.map((component: any, index: number) => (
                    <ComponentRenderer key={component.name ?? index} component={component} />
                ))
                : null}
            {children}
        </div>
    )
}

export default Column
