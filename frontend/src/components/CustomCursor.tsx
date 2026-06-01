'use client'

import { useEffect, useRef } from 'react'

/**
 * Elite cursor — Cinema-magnetic emerald dot + Liquid-frosted glass ring.
 * - The dot tracks the pointer exactly.
 * - The ring trails with subtle lag and grows over clickable elements.
 * - Adds `html.app-cursor` so globals.css can hide the native cursor.
 * - Disabled on touch / coarse-pointer devices (native cursor stays).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    document.documentElement.classList.add('app-cursor')

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = mx + 'px'
      dot.style.top = my + 'px'
    }
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      const interactive = !!el?.closest(
        'a, button, input, textarea, select, label, [role="button"], .glass-pill, .btn-primary, .btn-accent, .btn-ghost, .card, .card-terminal'
      )
      document.body.classList.toggle('hovering', interactive)
    }
    const onDown = () => document.body.classList.add('clicking')
    const onUp = () => document.body.classList.remove('clicking')

    const loop = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    loop()

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('app-cursor')
      document.body.classList.remove('hovering', 'clicking')
    }
  }, [])

  return (
    <>
      <div ref={ringRef} id="c-ring" aria-hidden="true" />
      <div ref={dotRef} id="c-dot" aria-hidden="true" />
    </>
  )
}
