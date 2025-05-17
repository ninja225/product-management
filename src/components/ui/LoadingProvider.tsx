'use client'

import NavigationEvents from './NavigationEvents'

interface LoadingProviderProps {
    color?: string;
    height?: number;
}

/**
 * Client component wrapper for loading bar
 */
export default function LoadingProvider({ color = '#3d82f7', height = 3 }: LoadingProviderProps) {
    return <NavigationEvents color={color} height={height} />
}
