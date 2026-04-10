'use client'
import React, { createContext, useContext } from 'react'

export type IconMapContextType = {
    iconMap?: Record<string, string>
}

const IconMapContext = createContext<IconMapContextType>({})

/**
 * Provider to supply icon map to all IconRenderer components.
 * Wrap your app with this to enable icon name mapping.
 */
export const IconProvider: React.FC<{
    children: React.ReactNode
    iconMap?: Record<string, string>
}> = ({ children, iconMap }) => {
    return (
        <IconMapContext.Provider value={{ iconMap }}>
            {children}
        </IconMapContext.Provider>
    )
}

/**
 * Hook to access the icon map in components.
 */
export const useIconMap = () => {
    const context = useContext(IconMapContext)
    return context.iconMap
}

export default IconProvider
