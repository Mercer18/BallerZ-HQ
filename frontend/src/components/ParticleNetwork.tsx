'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Full-viewport interactive soccer playground for the PUBLIC pages
 * (landing, login, signup, onboarding). Replaced by `TacticalAnimation`
 * on logged-in pages.
 */

const PUBLIC_PATHS = ['/', '/login', '/signup', '/onboarding']

export function ParticleNetwork({
  ballRadius = 7,
  bootSize = 14,          // boot "footprint" — contact happens when cursor within ballRadius + bootSize
  kickStrength = 1.8,     // velocity transfer on contact
  damping = 0.978,        // ball naturally rolls and stops over ~2-3s after a kick
}: {
  ballRadius?: number
  bootSize?: number
  kickStrength?: number
  damping?: number
}) {
  const pathname = usePathname()
  const visible = PUBLIC_PATHS.includes(pathname)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState({ left: 0, right: 0 })
  const scoreRef = useRef(score)
  scoreRef.current = score

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    type Ball = { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; spawnFrames: number }
    let balls: Ball[] = []
    let w = 0, h = 0
    let mouseX = -9999, mouseY = -9999
    let prevMouseX = -9999, prevMouseY = -9999
    let mouseVx = 0, mouseVy = 0
    let raf = 0

    /* ── goal config ────────────────────────────── */
    const goalDepth = 48
    const goalHeightFactor = 0.4
    let goalTopY = 0
    let goalBotY = 0
    let leftFlash = 0    // 0–1 flash intensity, decays
    let rightFlash = 0

    /* ── pre-render the football texture (so we draw it once) ────── */
    const textureSize = ballRadius * 3   // extra room for outer halo
    const ballTexture = document.createElement('canvas')
    ballTexture.width = textureSize * dpr
    ballTexture.height = textureSize * dpr
    const bctx = ballTexture.getContext('2d')!
    bctx.scale(dpr, dpr)
    drawSoccerBall(bctx, ballRadius)

    function drawSoccerBall(c: CanvasRenderingContext2D, r: number) {
      const cx = r * 1.5, cy = r * 1.5   // centred in texture w/ halo room
      // soft outer glow so balls pop against dark backgrounds
      const halo = c.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.5)
      halo.addColorStop(0, 'rgba(255,255,255,0.18)')
      halo.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = halo
      c.beginPath()
      c.arc(cx, cy, r * 1.5, 0, Math.PI * 2)
      c.fill()

      // white sphere with subtle gradient for 3D look
      const grad = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.7, '#f1f5f9')
      grad.addColorStop(1, '#cbd5e1')
      c.fillStyle = grad
      c.beginPath()
      c.arc(cx, cy, r, 0, Math.PI * 2)
      c.fill()

      // central black pentagon
      c.fillStyle = '#0a0f1a'
      const pentR = r * 0.32
      c.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
        const px = cx + Math.cos(a) * pentR
        const py = cy + Math.sin(a) * pentR
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
      }
      c.closePath()
      c.fill()

      // surrounding partial hexagon panels (small black dots near the pentagon vertices)
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5 + Math.PI / 5
        const dx = cx + Math.cos(a) * r * 0.7
        const dy = cy + Math.sin(a) * r * 0.7
        c.beginPath()
        c.arc(dx, dy, r * 0.16, 0, Math.PI * 2)
        c.fill()
      }

      // outline
      c.strokeStyle = 'rgba(0,0,0,0.35)'
      c.lineWidth = 0.5
      c.beginPath()
      c.arc(cx, cy, r - 0.25, 0, Math.PI * 2)
      c.stroke()
    }

    /* ── balls ─────────────────────────────────── */
    // 4 balls nudge in from the corners by ~35px, 1 sits static in the middle.
    const initSpeed = 1.4       // small initial push
    const spawnFrames = 90      // ~1.5s of decay → total roll ≈ 35px
    const cornerOffsets = [
      { x: 0.05, y: 0.12 },  // top-left — very close to actual corner
      { x: 0.95, y: 0.12 },  // top-right
      { x: 0.05, y: 0.88 },  // bottom-left
      { x: 0.95, y: 0.88 },  // bottom-right
    ]

    const spawn = () => {
      balls = [
        ...cornerOffsets.map(off => {
          const x = w * off.x
          const y = h * off.y
          const dx = w * 0.5 - x
          const dy = h * 0.5 - y
          const len = Math.hypot(dx, dy) || 1
          return {
            x, y,
            vx: (dx / len) * initSpeed,
            vy: (dy / len) * initSpeed,
            rot: Math.random() * Math.PI * 2,
            vrot: 0,
            spawnFrames,
          }
        }),
        {
          // middle static ball
          x: w * 0.5,
          y: h * 0.5,
          vx: 0,
          vy: 0,
          rot: Math.random() * Math.PI * 2,
          vrot: 0,
          spawnFrames: 0,
        },
      ]
    }

    const respawnBall = (b: Ball, _fromLeft: boolean) => {
      // after a goal, drop the ball back near centre at rest — user has to kick it again
      b.x = w / 2
      b.y = h / 2 + (Math.random() - 0.5) * 80
      b.vx = 0
      b.vy = 0
      b.spawnFrames = 0
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      goalTopY = (h * (1 - goalHeightFactor)) / 2
      goalBotY = goalTopY + h * goalHeightFactor

      if (balls.length === 0) spawn()
    }

    /* ── input ─────────────────────────────────── */
    const onMouseMove = (e: MouseEvent) => {
      if (prevMouseX > -9000) {
        mouseVx = e.clientX - prevMouseX
        mouseVy = e.clientY - prevMouseY
      }
      prevMouseX = mouseX = e.clientX
      prevMouseY = mouseY = e.clientY
    }
    const onMouseLeave = () => { mouseX = -9999; mouseY = -9999; prevMouseX = -9999; mouseVx = 0; mouseVy = 0 }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) {
        if (prevMouseX > -9000) {
          mouseVx = t.clientX - prevMouseX
          mouseVy = t.clientY - prevMouseY
        }
        prevMouseX = mouseX = t.clientX
        prevMouseY = mouseY = t.clientY
      }
    }
    const onTouchEnd = () => { mouseX = -9999; mouseY = -9999; prevMouseX = -9999; mouseVx = 0; mouseVy = 0 }

    /* ── draw goal ─────────────────────────────── */
    const drawGoal = (side: 'left' | 'right', flash: number) => {
      const x0 = side === 'left' ? 0 : w - goalDepth
      const x1 = side === 'left' ? goalDepth : w

      // glow on score
      if (flash > 0.01) {
        const g = ctx.createLinearGradient(side === 'left' ? 0 : w, 0, side === 'left' ? goalDepth * 2 : w - goalDepth * 2, 0)
        g.addColorStop(0, `rgba(34, 197, 94, ${flash * 0.35})`)
        g.addColorStop(1, `rgba(34, 197, 94, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(side === 'left' ? 0 : w - goalDepth * 2, goalTopY - 20, goalDepth * 2, (goalBotY - goalTopY) + 40)
      }

      // net (subtle crosshatch)
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + flash * 0.3})`
      ctx.lineWidth = 0.5
      for (let x = x0; x <= x1; x += 9) {
        ctx.beginPath(); ctx.moveTo(x, goalTopY); ctx.lineTo(x, goalBotY); ctx.stroke()
      }
      for (let y = goalTopY; y <= goalBotY; y += 9) {
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
      }

      // frame (top crossbar, bottom crossbar, front post)
      ctx.strokeStyle = `rgba(255,255,255,${0.55 + flash * 0.4})`
      ctx.lineWidth = 2.5
      ctx.beginPath()
      if (side === 'left') {
        ctx.moveTo(0, goalTopY); ctx.lineTo(goalDepth, goalTopY)         // top
        ctx.moveTo(goalDepth, goalTopY); ctx.lineTo(goalDepth, goalBotY) // front post
        ctx.moveTo(0, goalBotY); ctx.lineTo(goalDepth, goalBotY)         // bottom
      } else {
        ctx.moveTo(w, goalTopY); ctx.lineTo(w - goalDepth, goalTopY)
        ctx.moveTo(w - goalDepth, goalTopY); ctx.lineTo(w - goalDepth, goalBotY)
        ctx.moveTo(w, goalBotY); ctx.lineTo(w - goalDepth, goalBotY)
      }
      ctx.stroke()
    }

    /* ── main loop ─────────────────────────────── */
    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // goals first (behind balls)
      drawGoal('left', leftFlash)
      drawGoal('right', rightFlash)
      leftFlash *= 0.94
      rightFlash *= 0.94

      // balls
      const contactRadius = ballRadius + bootSize
      for (const b of balls) {
        // cursor contact — only kicks if the boot actually overlaps the ball
        const dx = b.x - mouseX
        const dy = b.y - mouseY
        const distSq = dx * dx + dy * dy
        if (distSq < contactRadius * contactRadius && distSq > 0.01) {
          const dist = Math.sqrt(distSq)
          const overlap = contactRadius - dist
          // kick away from cursor + carry cursor's motion as momentum
          const nx = dx / dist
          const ny = dy / dist
          const kick = (overlap / contactRadius) * kickStrength * 6
          b.vx += nx * kick + mouseVx * 0.4
          b.vy += ny * kick + mouseVy * 0.4
          // physically push the ball out so it doesn't get stuck in the cursor
          b.x += nx * overlap * 0.6
          b.y += ny * overlap * 0.6
        }

        b.x += b.vx
        b.y += b.vy

        // during spawn phase the ball decelerates to a halt; afterwards we use the user's damping
        if (b.spawnFrames > 0) {
          b.vx *= 0.96
          b.vy *= 0.96
          b.spawnFrames--
          if (b.spawnFrames === 0) { b.vx = 0; b.vy = 0 }
        } else {
          b.vx *= damping
          b.vy *= damping
          // hard stop only when the ball is essentially still (in case of tiny floating-point drift)
          const checkSp = Math.hypot(b.vx, b.vy)
          if (checkSp < 0.02) { b.vx = 0; b.vy = 0 }
        }

        // rotation tied to current velocity (looks like rolling)
        const sp = Math.hypot(b.vx, b.vy)
        b.rot += (b.vx >= 0 ? 1 : -1) * sp * 0.08

        // top/bottom wrap
        if (b.y < -textureSize) b.y = h + textureSize
        else if (b.y > h + textureSize) b.y = -textureSize

        // side scoring — fires the moment the ball crosses the goal line
        const inGoalY = b.y > goalTopY && b.y < goalBotY
        if (b.x < goalDepth && inGoalY) {
          // scored in LEFT goal — right side gets the point
          leftFlash = 1
          setScore(s => ({ ...s, right: s.right + 1 }))
          respawnBall(b, false)
          continue
        }
        if (b.x > w - goalDepth && inGoalY) {
          // scored in RIGHT goal — left side gets the point
          rightFlash = 1
          setScore(s => ({ ...s, left: s.left + 1 }))
          respawnBall(b, true)
          continue
        }

        // bounce off the posts/walls when NOT in the goal mouth
        if (b.x < goalDepth + ballRadius && !inGoalY) {
          b.x = goalDepth + ballRadius; b.vx = Math.abs(b.vx) * 0.6
        } else if (b.x > w - goalDepth - ballRadius && !inGoalY) {
          b.x = w - goalDepth - ballRadius; b.vx = -Math.abs(b.vx) * 0.6
        }

        // draw the ball (rotated, with halo)
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.rot)
        ctx.drawImage(ballTexture, -textureSize / 2, -textureSize / 2, textureSize, textureSize)
        ctx.restore()
      }

      // decay cursor velocity each frame so it doesn't linger when the cursor stops
      mouseVx *= 0.7
      mouseVy *= 0.7

      raf = requestAnimationFrame(draw)
    }

    // init
    resize()
    raf = requestAnimationFrame(draw)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', resize)
    }
  }, [visible, ballRadius, bootSize, kickStrength, damping])

  if (!visible) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden
      />
      {/* Score counter — floats at bottom centre like a scoreboard */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-3 bg-dark-950/85 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        style={{ zIndex: 40 }}
      >
        <span className="text-primary-400 tabular-nums">{score.left.toString().padStart(2, '0')}</span>
        <span className="text-gray-500">⚽</span>
        <span className="text-accent-400 tabular-nums">{score.right.toString().padStart(2, '0')}</span>
      </div>
    </>
  )
}
