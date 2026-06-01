'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Looping corner-kick animation for logged-in pages.
 *
 * Top-down tactical view: subtle pitch lines, dot players (attackers + defenders + GK),
 * the kicker swings a corner in from a bottom corner, the ball arcs into the box,
 * and the outcome is randomly chosen each cycle: GOAL / SAVE / CLEAR.
 *
 * Hidden on landing / auth pages.
 */

const PUBLIC_PATHS = ['/', '/login', '/signup', '/onboarding']

type Phase = 'SETUP' | 'APPROACH' | 'KICK' | 'FLIGHT' | 'CONTACT' | 'OUTCOME' | 'RESET'
type Outcome = 'GOAL' | 'SAVE' | 'CLEAR'

const PHASE_MS: Record<Phase, number> = {
  SETUP:    600,
  APPROACH: 500,
  KICK:     120,
  FLIGHT:  1500,
  CONTACT:  100,
  OUTCOME: 1100,
  RESET:    700,
}

const ORDER: Phase[] = ['SETUP', 'APPROACH', 'KICK', 'FLIGHT', 'CONTACT', 'OUTCOME', 'RESET']

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => 1 - Math.pow(1 - t, 3)        // ease-out cubic
const easeIn = (t: number) => t * t

export function TacticalAnimation() {
  const pathname = usePathname()
  const visible = !PUBLIC_PATHS.includes(pathname)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0
    let raf = 0
    let phase: Phase = 'SETUP'
    let phaseStartedAt = performance.now()
    let outcome: Outcome = 'GOAL'
    let goalOnLeft = false           // which side has the goal this cycle
    let kickerTop = false             // which corner of that side the kicker is at
    let contactPlayerIdx = 0
    let netFlash = 0

    type Player = {
      role: 'ATK' | 'DEF' | 'GK' | 'KICKER'
      // base position is the "starting" position; tx/ty is the lerp target updated per phase
      bx: number; by: number
      x: number; y: number
      tx: number; ty: number
    }

    let players: Player[] = []

    // Ball state — height offset (z) gives 3D-ish flight (top-down with shadow)
    type Ball = { x: number; y: number; z: number; rot: number }
    const ball: Ball = { x: 0, y: 0, z: 0, rot: 0 }
    let ballPath: { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; peakZ: number } | null = null

    /* ── geometry: goal lives on a side; box extends inward ───────── */
    const layout = () => {
      // goal mouth = vertical bar on left or right edge
      const goalH = Math.min(220, h * 0.45)              // goal mouth height
      const box18W = Math.min(220, w * 0.20)             // 18-yard box depth (into the pitch)
      const box6W  = Math.min(110, w * 0.10)
      const box18H = Math.min(380, h * 0.70)
      const box6H  = Math.min(220, h * 0.45)
      const goalThickness = 14
      const endX = goalOnLeft ? 24 : w - 24              // pitch end-line x-coord

      const goalTop = h / 2 - goalH / 2
      const goalBot = h / 2 + goalH / 2

      const goalNear = endX                              // post-line (the line balls cross to score)
      const goalDeep = goalOnLeft ? endX - goalThickness : endX + goalThickness  // back of net

      const box18Near = goalOnLeft ? endX + box18W : endX - box18W
      const box6Near  = goalOnLeft ? endX + box6W  : endX - box6W

      const box18Top = h / 2 - box18H / 2
      const box18Bot = h / 2 + box18H / 2
      const box6Top  = h / 2 - box6H / 2
      const box6Bot  = h / 2 + box6H / 2

      return {
        endX, goalOnLeft,
        goalTop, goalBot, goalNear, goalDeep,
        box18Near, box18Top, box18Bot,
        box6Near, box6Top, box6Bot,
        penaltySpot: { x: goalOnLeft ? endX + box18W * 0.55 : endX - box18W * 0.55, y: h / 2 },
        cornerTop:    { x: endX, y: 18 },
        cornerBot:    { x: endX, y: h - 18 },
      }
    }

    /* ── reset the world for a new cycle ──────────────────────────── */
    const newCycle = () => {
      goalOnLeft = Math.random() < 0.5
      kickerTop  = Math.random() < 0.5
      outcome = (['GOAL', 'SAVE', 'CLEAR'] as Outcome[])[Math.floor(Math.random() * 3)]
      netFlash = 0

      const L = layout()
      const corner = kickerTop ? L.cornerTop : L.cornerBot

      // attackers + defenders cluster in the box (offsets relative to penalty spot)
      const into = goalOnLeft ? +1 : -1   // direction into the pitch (away from goal)
      const jitter = (m: number) => (Math.random() - 0.5) * m
      const atkSlots = [
        { x: L.penaltySpot.x - 30 * into + jitter(15), y: L.penaltySpot.y - 50 + jitter(20) },
        { x: L.penaltySpot.x - 50 * into + jitter(15), y: L.penaltySpot.y + 50 + jitter(20) },
        { x: L.penaltySpot.x + 20 * into + jitter(15), y: L.penaltySpot.y - 20 + jitter(15) },
        { x: L.penaltySpot.x + 10 * into + jitter(15), y: L.penaltySpot.y + 30 + jitter(15) },
      ]
      const defSlots = atkSlots.map((s, i) => ({
        x: s.x + (8 * (i % 2 === 0 ? 1 : -1)) * into + jitter(6),
        y: s.y + (i % 2 === 0 ? -6 : 6) + jitter(6),
      }))

      contactPlayerIdx = Math.floor(Math.random() * atkSlots.length)
      const target = outcome === 'SAVE'
        ? { x: L.goalNear + 18 * into, y: L.penaltySpot.y + jitter(40) }
        : { x: atkSlots[contactPlayerIdx].x, y: atkSlots[contactPlayerIdx].y }

      // bezier mid-point arcs the ball INWARD (toward centre of pitch) and slightly toward goal-y
      const midX = (corner.x + target.x) / 2 + 60 * into
      const midY = (corner.y + target.y) / 2 + (kickerTop ? +40 : -40)
      ballPath = {
        x0: corner.x, y0: corner.y,
        x1: target.x, y1: target.y,
        cx: midX, cy: midY,
        peakZ: 26,
      }
      ball.x = corner.x
      ball.y = corner.y
      ball.z = 0
      ball.rot = 0

      const gkX = goalOnLeft ? L.goalNear + 10 : L.goalNear - 10
      const gkY = L.penaltySpot.y

      players = []
      players.push({ role: 'KICKER', bx: corner.x, by: corner.y, x: corner.x, y: corner.y, tx: corner.x, ty: corner.y })
      players.push({ role: 'GK',     bx: gkX,      by: gkY,      x: gkX,      y: gkY,      tx: gkX,      ty: gkY })
      atkSlots.forEach(s => players.push({ role: 'ATK', bx: s.x, by: s.y, x: s.x, y: s.y, tx: s.x, ty: s.y }))
      defSlots.forEach(s => players.push({ role: 'DEF', bx: s.x, by: s.y, x: s.x, y: s.y, tx: s.x, ty: s.y }))
    }

    /* ── per-frame update ─────────────────────────────────────────── */
    const update = (t: number) => {
      const phaseElapsed = t - phaseStartedAt
      const phaseDur = PHASE_MS[phase]
      let phaseT = Math.min(phaseElapsed / phaseDur, 1)

      const L = layout()

      // --- per-phase logic ------------------------------------------------
      if (phase === 'APPROACH') {
        const kicker = players[0]
        // back up slightly INTO the pitch and along the touchline
        kicker.tx = kicker.bx + (goalOnLeft ? +8 : -8)
        kicker.ty = kicker.by + (kickerTop ? +6 : -6)
      }

      if (phase === 'FLIGHT' && ballPath) {
        const tt = ease(phaseT)
        const oneMinusT = 1 - tt
        ball.x = oneMinusT * oneMinusT * ballPath.x0 + 2 * oneMinusT * tt * ballPath.cx + tt * tt * ballPath.x1
        ball.y = oneMinusT * oneMinusT * ballPath.y0 + 2 * oneMinusT * tt * ballPath.cy + tt * tt * ballPath.y1
        ball.z = Math.sin(tt * Math.PI) * ballPath.peakZ
        ball.rot += 0.18

        players.forEach(p => {
          if (p.role === 'GK') {
            // GK now tracks the ball VERTICALLY along the goal mouth
            const gkX = goalOnLeft ? L.goalNear + 10 : L.goalNear - 10
            p.tx = gkX
            p.ty = lerp(L.penaltySpot.y, ball.y, 0.35)
          } else if (p.role === 'ATK' || p.role === 'DEF') {
            p.tx = lerp(p.bx, ball.x, 0.05)
            p.ty = lerp(p.by, ball.y, 0.05)
          }
        })
      }

      if (phase === 'CONTACT') {
        if (outcome === 'SAVE') {
          // GK steps onto the ball
          const gk = players.find(p => p.role === 'GK')!
          gk.tx = ball.x
          gk.ty = ball.y
        } else {
          // contact player lunges
          const idx = 2 + contactPlayerIdx
          const cp = players[outcome === 'CLEAR' ? idx + 4 : idx]   // defender or attacker
          if (cp) { cp.tx = ball.x; cp.ty = ball.y }
        }
      }

      if (phase === 'OUTCOME') {
        const ot = ease(phaseT)
        if (outcome === 'GOAL') {
          // ball flies through the goal line (toward the back of net)
          const targetX = goalOnLeft ? L.goalDeep - 4 : L.goalDeep + 4
          ball.x = lerp(ball.x, targetX, ot * 0.95)
          ball.y = lerp(ball.y, L.penaltySpot.y + (Math.random() - 0.5) * 30, ot * 0.6)
          ball.z = Math.max(0, ball.z - 1)
          ball.rot += 0.3
          if (ot > 0.55) netFlash = Math.min(1, (ot - 0.55) / 0.45)
        } else if (outcome === 'SAVE') {
          const gk = players.find(p => p.role === 'GK')!
          ball.x = lerp(ball.x, gk.x, 0.25)
          ball.y = lerp(ball.y, gk.y, 0.25)
          ball.z = Math.max(0, ball.z - 2)
        } else {
          // CLEAR — ball flies AWAY from the goal into the pitch
          const dirX = goalOnLeft ? +1 : -1
          ball.x += dirX * 6
          ball.y += (Math.random() < 0.5 ? -2 : 2)
          ball.z = Math.max(0, ball.z + (1 - ot) * 2)
          ball.rot += 0.4
        }
      }

      if (phase === 'RESET') {
        // fade flash, ball stays put
        netFlash *= 0.92
      }

      // lerp all player positions smoothly
      players.forEach(p => {
        p.x = lerp(p.x, p.tx, 0.12)
        p.y = lerp(p.y, p.ty, 0.12)
      })

      // advance phase
      if (phaseElapsed >= phaseDur) {
        const next = ORDER[(ORDER.indexOf(phase) + 1) % ORDER.length]
        phase = next
        phaseStartedAt = t
        if (phase === 'SETUP') newCycle()
      }
    }

    /* ── draw ─────────────────────────────────────────────────────── */
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const L = layout()
      const alpha = 0.55                  // global opacity

      // pitch boxes (18-yd + 6-yd) drawn as rectangles extending from the end-line inward
      ctx.save()
      ctx.globalAlpha = alpha * 0.35
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 4])
      const x18 = Math.min(L.endX, L.box18Near)
      const w18 = Math.abs(L.box18Near - L.endX)
      ctx.strokeRect(x18, L.box18Top, w18, L.box18Bot - L.box18Top)
      const x6 = Math.min(L.endX, L.box6Near)
      const w6 = Math.abs(L.box6Near - L.endX)
      ctx.strokeRect(x6, L.box6Top, w6, L.box6Bot - L.box6Top)
      // end-line (vertical line at the goal's side)
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(L.endX, 0); ctx.lineTo(L.endX, h)
      ctx.stroke()
      ctx.restore()

      // penalty spot
      ctx.save()
      ctx.globalAlpha = alpha * 0.5
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(L.penaltySpot.x, L.penaltySpot.y, 1.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // goal — vertical bar on the side, with net crosshatch + flash on GOAL
      const goalGlow = netFlash * 0.7
      ctx.save()
      ctx.globalAlpha = alpha * (0.7 + goalGlow * 0.3)
      const goalX = Math.min(L.goalNear, L.goalDeep)
      const goalW = Math.abs(L.goalDeep - L.goalNear)
      // goal interior fill (slight glow)
      ctx.fillStyle = `rgba(255,255,255,${0.08 + goalGlow * 0.35})`
      ctx.fillRect(goalX, L.goalTop, goalW, L.goalBot - L.goalTop)
      // frame
      ctx.strokeStyle = `rgba(255,255,255,${0.85 + goalGlow * 0.15})`
      ctx.lineWidth = 2
      ctx.strokeRect(goalX, L.goalTop, goalW, L.goalBot - L.goalTop)
      // net crosshatch
      ctx.strokeStyle = `rgba(255,255,255,${0.20 + goalGlow * 0.35})`
      ctx.lineWidth = 0.5
      for (let y = L.goalTop + 6; y < L.goalBot; y += 7) {
        ctx.beginPath(); ctx.moveTo(goalX + 2, y); ctx.lineTo(goalX + goalW - 2, y); ctx.stroke()
      }
      for (let xN = goalX + 3; xN < goalX + goalW; xN += 4) {
        ctx.beginPath(); ctx.moveTo(xN, L.goalTop + 2); ctx.lineTo(xN, L.goalBot - 2); ctx.stroke()
      }
      ctx.restore()

      // corner flag at the kicker's corner
      const cFlagX = L.endX
      const cFlagY = kickerTop ? 14 : h - 14
      const flagDir = goalOnLeft ? +1 : -1
      ctx.save()
      ctx.globalAlpha = alpha * 0.45
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(cFlagX, cFlagY)
      ctx.lineTo(cFlagX, cFlagY + (kickerTop ? +14 : -14) * 0.0001)  // tiny vertical pole stub
      ctx.lineTo(cFlagX, cFlagY)
      ctx.stroke()
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.moveTo(cFlagX, cFlagY)
      ctx.lineTo(cFlagX + flagDir * 9, cFlagY + (kickerTop ? +3 : -3))
      ctx.lineTo(cFlagX, cFlagY + (kickerTop ? +6 : -6))
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // players
      ctx.save()
      ctx.globalAlpha = alpha
      for (const p of players) {
        const color =
          p.role === 'ATK' ? '#22c55e' :
          p.role === 'DEF' ? '#f59e0b' :
          p.role === 'GK'  ? '#facc15' :
                            '#a855f7'   // kicker

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.beginPath()
        ctx.arc(p.x + 1, p.y + 1.5, 4.2, 0, Math.PI * 2)
        ctx.fill()
        // body
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        // outline
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }
      ctx.restore()

      // ball — shadow on ground + lifted ball above
      ctx.save()
      ctx.globalAlpha = alpha * 0.7
      // shadow (size shrinks as ball climbs) — clamp so a high ball
      // can't drive the radius negative (IndexSizeError on ctx.ellipse)
      const shadowScale = Math.max(0.05, 1 - ball.z / 60)
      ctx.fillStyle = `rgba(0,0,0,${0.4 * shadowScale})`
      ctx.beginPath()
      ctx.ellipse(ball.x, ball.y, 3.5 * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = alpha
      // halo
      const haloGrad = ctx.createRadialGradient(ball.x, ball.y - ball.z, 1, ball.x, ball.y - ball.z, 6)
      haloGrad.addColorStop(0, 'rgba(255,255,255,0.5)')
      haloGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = haloGrad
      ctx.beginPath()
      ctx.arc(ball.x, ball.y - ball.z, 6, 0, Math.PI * 2)
      ctx.fill()
      // ball
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y - ball.z, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.lineWidth = 0.5
      ctx.stroke()
      ctx.restore()
    }

    /* ── main loop ────────────────────────────────────────────────── */
    const tick = (t: number) => {
      update(t)
      draw(t)
      raf = requestAnimationFrame(tick)
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      newCycle()
    }

    resize()
    newCycle()
    phaseStartedAt = performance.now()
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [visible])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden
    />
  )
}
