'use client'
import React from 'react'
import { IconMap } from '@bixo/icons'
import { useIconMap } from './icon-provider'

export type IconPackage = 'bixo' | 'custom'

export interface IconRendererProps {
    /** Icon name - can be server name (e.g., 'inbox') or direct Bixo name (e.g., 'LiInbox') */
    iconName?: string
    /** Icon size in pixels */
    size?: number
    /** Custom styles */
    style?: React.CSSProperties
    /** CSS classes */
    className?: string
    /** Fallback icon if resolution fails */
    fallback?: string
    /** Icon map for server name resolution (optional, uses context if not provided) */
    iconMap?: Record<string, string>
}

const DEFAULT_FALLBACK = 'LiInfoSquare'

/**
 * Resolve icon name to Bixo icon component.
 * Tries: direct name -> Li-prefixed -> PascalCase conversion -> compound word handling
 */
const resolveBixoIcon = (name?: string): any => {
    if (!name) return undefined

    // Try direct name first (e.g., 'LiInbox')
    let icon = (IconMap as any)[name]
    if (icon) return icon

    // Try with Li prefix directly if not already present (e.g., 'list' -> 'LiList')
    if (!name.startsWith('Li')) {
        const liDirectName = 'Li' + name.charAt(0).toUpperCase() + name.slice(1)
        icon = (IconMap as any)[liDirectName]
        if (icon) return icon
    }

    // Try PascalCase for kebab/space/underscore names (e.g., 'inbox' -> 'Inbox')
    const pascal = name
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')

    if (pascal !== name) {
        icon = (IconMap as any)[pascal]
        if (icon) return icon

        if (!pascal.startsWith('Li')) {
            const liPascal = 'Li' + pascal
            icon = (IconMap as any)[liPascal]
            if (icon) return icon
        }
    }

    // Try splitting on known boundaries for compound lowercase words
    const compoundWords = ['down', 'up', 'left', 'right', 'full', 'empty', 'check', 'open', 'close', 'cloud']
    for (const word of compoundWords) {
        if (name.endsWith(word) && name.length > word.length) {
            const prefix = name.slice(0, -word.length)
            const titleCased =
                prefix.charAt(0).toUpperCase() +
                prefix.slice(1) +
                word.charAt(0).toUpperCase() +
                word.slice(1)

            icon = (IconMap as any)[titleCased]
            if (icon) return icon

            const liTitleCased = 'Li' + titleCased
            icon = (IconMap as any)[liTitleCased]
            if (icon) return icon
        }
    }

    return undefined
}

/**
 * Resolve icon through mapping and icon packages.
 * Priority: direct Bixo name -> mapped name (via iconMap) -> PascalCase -> fallback
 */
export const IconRenderer: React.FC<IconRendererProps> = ({
    iconName,
    size = 20,
    style,
    className,
    fallback = DEFAULT_FALLBACK,
    iconMap: propsIconMap,
}) => {
    const contextIconMap = useIconMap()
    const iconMap = propsIconMap || contextIconMap

    if (!iconName) return null

    let resolvedIconName = iconName

    // Try to map the icon name using provided iconMap
    if (iconMap && iconName.toLowerCase() in iconMap) {
        resolvedIconName = iconMap[iconName.toLowerCase()]
    }

    // Try to resolve as Bixo icon
    const BixoIcon = resolveBixoIcon(resolvedIconName)
    if (BixoIcon) {
        return <BixoIcon size={size} style={style} className={className} />
    }

    // Try fallback
    if (fallback && fallback !== iconName) {
        const FallbackIcon = resolveBixoIcon(fallback)
        if (FallbackIcon) {
            return <FallbackIcon size={size} style={style} className={className} />
        }
    }

    return null
}

export default IconRenderer
