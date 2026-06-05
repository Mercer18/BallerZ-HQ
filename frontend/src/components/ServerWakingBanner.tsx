'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { onWakingChange } from '@/lib/api'

/**
 * Global, app-wide notice that appears only when a backend request has been
 * pending long enough to suggest the Render free-tier dyno is cold-starting.
 * Mounted once in the root layout; driven by apiFetch's waking signal.
 */
export function ServerWakingBanner() {
  const [waking, setWaking] = useState(false)

  useEffect(() => onWakingChange(setWaking), [])

  if (!waking) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[120] px-4 max-w-[92vw] pointer-events-none">
      <div className="flex items-center gap-2.5 rounded-full border border-accent-emerald/30 bg-[#0b0f17]/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-black/40">
        <Loader2 className="w-4 h-4 text-accent-emerald animate-spin shrink-0" />
        <span className="text-xs sm:text-sm text-text-secondary">
          Waking the server — the first load after a quiet spell can take up to a minute.
        </span>
      </div>
    </div>
  )
}
