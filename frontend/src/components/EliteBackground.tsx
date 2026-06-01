'use client'

import { InteractiveParticles } from '@/components/InteractiveParticles'

/**
 * Dark app background + interactive particle field.
 * - Solid deep-ink base with a very subtle dark vignette (no colored blobs).
 * - InteractiveParticles renders a mouse-reactive constellation on top of it.
 * Sits behind all content.
 */
export function EliteBackground() {
  return (
    <>
      <div className="elite-bg" aria-hidden="true">
        <div className="dark-base" />
        <div className="dark-vignette" />
      </div>
      <InteractiveParticles />
    </>
  )
}
