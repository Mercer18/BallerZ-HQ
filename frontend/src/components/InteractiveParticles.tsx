'use client'

import { useEffect, useRef } from 'react'

/**
 * Dark-themed interactive particle field.
 * - Subtle emerald/white dots drift slowly across a dark backdrop.
 * - Particles within range of the cursor are gently pushed away (repel),
 *   and faint lines connect nearby particles + the cursor — a living
 *   "constellation" that reacts when you move/touch.
 * Canvas is fixed behind all content (pointer-events: none).
 */
export function InteractiveParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const COUNT = Math.min(90, Math.floor((w * h) / 22000))
    const particles: P[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
    }))

    const mouse = { x: -9999, y: -9999 }
    const REPEL = 120
    const LINK = 130

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onLeave)
    window.addEventListener('resize', onResize)

    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // drift
        p.x += p.vx
        p.y += p.vy
        // wrap
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0

        // cursor repel
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < REPEL && dist > 0) {
          const force = (REPEL - dist) / REPEL
          p.x += (dx / dist) * force * 2.4
          p.y += (dy / dist) * force * 2.4
        }

        // dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(52,211,153,0.45)'
        ctx.fill()
      }

      // links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(52,211,153,${0.12 * (1 - d / LINK)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
        // link to cursor
        const a = particles[i]
        const dc = Math.hypot(a.x - mouse.x, a.y - mouse.y)
        if (dc < LINK * 1.4) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(110,231,183,${0.22 * (1 - dc / (LINK * 1.4))})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    if (!reduce) tick()
    else { // static single frame for reduced-motion
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(52,211,153,0.35)'; ctx.fill()
      }
    }

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-[9] pointer-events-none"
    />
  )
}
