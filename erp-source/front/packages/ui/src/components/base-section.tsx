'use client'

/**
 * Base Section Wrapper
 *
 * Provides common visibility, class, and ordering for layout sections.
 * ComponentRenderer is optional; pass renderComponents={false} when embedding
 * children directly.
 */

import React from 'react'

export interface BaseSectionProps {
    name?: string
    visible?: boolean
    class_name?: string
    order?: number
    attributes?: Record<string, any>
    components?: any[]
    slots?: Record<string, any[]>
    device_config?: any
    [key: string]: any
}

export interface BaseSectionWrapperProps {
    section: BaseSectionProps
    children?: React.ReactNode
    /** When true (default), sub-components are rendered via ComponentRenderer if available */
    renderComponents?: boolean
    ComponentRenderer?: React.ComponentType<{ component: any }>
}

export const BaseSection: React.FC<BaseSectionWrapperProps> = ({
    section,
    children,
    renderComponents = true,
    ComponentRenderer,
}) => {
    if (section.visible === false) {
        return null
    }

    const { name, class_name, order, attributes } = section
    const { style: attrStyle, ...restAttrs } = (attributes as any) ?? {}

    return (
        <div
            id={name}
            className={class_name}
            style={{ order, ...attrStyle }}
            {...restAttrs}
        >
            {children}

            {renderComponents && ComponentRenderer && section.components && (
                <div className="section-components">
                    {section.components.map((component: any, index: number) => (
                        <ComponentRenderer key={component.name ?? index} component={component} />
                    ))}
                </div>
            )}

            {renderComponents && ComponentRenderer && section.slots && (
                <>
                    {Object.entries(section.slots).map(([slotName, slotComponents]) => (
                        <div key={slotName} className={`section-slot slot-${slotName}`}>
                            {(slotComponents as any[]).map((component: any, index: number) => (
                                <ComponentRenderer key={component.name ?? index} component={component} />
                            ))}
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

export default BaseSection
