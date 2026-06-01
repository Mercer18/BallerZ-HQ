'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Physics-based smooth scrolling for the whole document.
 * Wheel/touch input becomes a momentum scroll with eased decay — replaces
 * native scrolling. Anchor clicks (a[href^="#"]) are intercepted and routed
 * through Lenis with a 64px offset so they clear the sticky nav.
 *
 * Render once near the top of the tree (e.g. in the root layout).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Route in-page anchor clicks through Lenis so the smooth animation
    // matches wheel/touch (and respects the nav offset).
    const onAnchorClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!link) return
      const id = link.getAttribute('href')?.slice(1)
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -64, duration: 1.4 })
    }
    document.addEventListener('click', onAnchorClick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', onAnchorClick)
      lenis.destroy()
    }
  }, [])

  return null
}
