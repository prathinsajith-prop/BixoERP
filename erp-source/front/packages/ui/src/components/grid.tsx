'use client'

import React from 'react'

export interface GridComponentProps {
    type?: 'grid'
    name?: string
    columns?: number
    gap?: string | number
    align?: 'start' | 'center' | 'end' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
    templateColumns?: string
    columnSizes?: number[]
    visible?: boolean
    components?: any[]
    slots?: { items?: { name?: string; meta?: any; components?: any[] } }
    children?: React.ReactNode
    /** Optional ComponentRenderer passed in to avoid circular imports */
    ComponentRenderer?: React.ComponentType<{ component: any }>
}

const GAP: Record<string, string> = { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px' }

const toFlex = (v: string) =>
    v === 'start' || v === 'left'
        ? 'flex-start'
        : v === 'end' || v === 'right'
            ? 'flex-end'
            : v

export const Grid: React.FC<GridComponentProps> = (props) => {
    const {
        columns = 1,
        gap = 'md',
        align = 'start',
        justify = 'start',
        templateColumns,
        columnSizes,
        visible = true,
        components: direct,
        slots,
        children,
        ComponentRenderer,
    } = props

    if (!visible) return null

    const items = direct ?? slots?.items?.components ?? []
    const gapValue = typeof gap === 'number' ? `${gap * 8}px` : GAP[gap] ?? `${parseFloat(String(gap)) * 8 || 8}px`
    const alignItems = toFlex(align)
    const justifyContent = toFlex(justify)

    const renderItem = (component: any, index: number) =>
        ComponentRenderer ? (
            <ComponentRenderer key={component.name ?? index} component={component} />
        ) : null

    if (templateColumns) {
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: templateColumns,
                    gap: gapValue,
                    alignItems,
                    width: '100%',
                }}
            >
                {items.map(renderItem)}
                {children}
            </div>
        )
    }

    if (columnSizes?.length) {
        const total = columnSizes.reduce((s, n) => s + n, 0)
        return (
            <div style={{ display: 'flex', gap: gapValue, alignItems, width: '100%' }}>
                {items.map((component: any, index: number) => (
                    <div
                        key={component.name ?? index}
                        style={{ flex: `0 0 ${((columnSizes[index] ?? 1) / total) * 100}%`, minWidth: 0 }}
                    >
                        {renderItem(component, index)}
                    </div>
                ))}
                {children}
            </div>
        )
    }

    if (columns === 1) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: gapValue,
                    alignItems,
                    justifyContent,
                    width: '100%',
                }}
            >
                {items.map(renderItem)}
                {children}
            </div>
        )
    }

    // Multi-column CSS grid
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: gapValue,
                alignItems,
                width: '100%',
            }}
        >
            {items.map(renderItem)}
            {children}
        </div>
    )
}

export default Grid
