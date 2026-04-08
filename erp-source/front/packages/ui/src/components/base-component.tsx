'use client'

/**
 * Base Component Wrapper
 *
 * Provides common visibility, class, and ordering for all layout components.
 * Simplified from monorepo fork — hooks (useDataLoader, useResponsive) stripped
 * to avoid pulling in external infrastructure.
 */

import React from 'react'

export interface BaseComponentProps {
    name?: string
    visible?: boolean
    class_name?: string
    order?: number
    attributes?: Record<string, any>
    /** Arbitrary schema-level fields forwarded to children */
    [key: string]: any
}

export interface BaseComponentWrapperProps {
    component: BaseComponentProps
    children: React.ReactNode
}

export const BaseComponent: React.FC<BaseComponentWrapperProps> = ({
    component,
    children,
}) => {
    if (component.visible === false) {
        return null
    }

    const { name, class_name, order, attributes } = component
    const { style: attrStyle, ...restAttrs } = (attributes as any) ?? {}

    return (
        <div
            id={name}
            className={class_name}
            style={{ order, ...attrStyle }}
            {...restAttrs}
        >
            {children}
        </div>
    )
}

export default BaseComponent
