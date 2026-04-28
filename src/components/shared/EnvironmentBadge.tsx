'use client'

import { FEATURES, getEnvironmentName, CURRENT_BRANCH } from '@/lib/config'

/**
 * Environment Badge
 * Shows current environment in non-production deployments
 * Useful for testing and debugging
 *
 * Usage: Add to your layout or header component
 * Example: <EnvironmentBadge />
 */
export function EnvironmentBadge() {
  // Only show in non-production environments
  if (!FEATURES.SHOW_ENV_BADGE) {
    return null
  }

  const envName = getEnvironmentName()

  // Color coding
  const colors = {
    Staging: 'bg-amber-500/90',
    Development: 'bg-blue-500/90',
    Preview: 'bg-gray-500/90',
    Local: 'bg-gray-500/90',
    Production: 'bg-black',
  }

  const bgColor = colors[envName as keyof typeof colors] ?? colors.Local

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} text-white px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2`}>
        <span className="font-semibold">{envName}</span>
        <span className="opacity-75">·</span>
        <span className="opacity-90">{CURRENT_BRANCH}</span>
      </div>
    </div>
  )
}
