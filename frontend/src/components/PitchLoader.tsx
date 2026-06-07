'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Post-login dashboard loader: a tactics-board pitch with a 4-3-3 that keeps
 * possession (a looping passing build-up) WHILE the dashboard data loads. The
 * instant the data is ready (`done` flips true) the move finishes — a pass to
 * the striker, a shot, the ball hits the net ("GOAL!") — and then we reveal the
 * dashboard via `onComplete`.
 *
 * The possession loop is open-ended, so a slow (cold-start) backend just means
 * more keep-ball; we never block longer than the load itself plus the short
 * goal finish.
 */

type Pt = { x: number; y: number }

// 4-3-3 attacking right (toward the goal at x≈116). Indices used by POSSESSION.
const PLAYERS: Pt[] = [
  { x: 14, y: 39 }, // 0  GK
  { x: 34, y: 16 }, // 1  LB
  { x: 32, y: 31 }, // 2  LCB
  { x: 32, y: 47 }, // 3  RCB
  { x: 34, y: 62 }, // 4  RB
  { x: 56, y: 24 }, // 5  LCM
  { x: 61, y: 39 }, // 6  CM (dead-centre, overlapping the pitch centre dot)
  { x: 56, y: 54 }, // 7  RCM
  { x: 84, y: 18 }, // 8  LW
  { x: 88, y: 39 }, // 9  ST
  { x: 84, y: 60 }, // 10 RW
]
const ST = 9
const GOAL: Pt = { x: 116, y: 39 }

// A believable keep-ball sequence (lots of the CM as the pivot).
const POSSESSION = [0, 2, 5, 6, 1, 5, 6, 7, 4, 7, 6, 3, 6, 8, 6, 10, 6, 5]

const SEG_MS = 440 // a normal pass
const APPROACH_MS = 380 // the final feed to the striker
const SHOT_MS = 230 // the strike
const GOAL_HOLD_MS = 600 // savour the goal before revealing

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function PitchLoader({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const ballRef = useRef<SVGGElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const doneRef = useRef(done)
  const completeRef = useRef(onComplete)
  const [phase, setPhase] = useState<'play' | 'shoot' | 'goal'>('play')

  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => { completeRef.current = onComplete }, [onComplete])

  useEffect(() => {
    // Respect reduced-motion: skip the choreography, reveal as soon as data is ready.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const id = setInterval(() => { if (doneRef.current) { clearInterval(id); completeRef.current() } }, 120)
      if (doneRef.current) { clearInterval(id); completeRef.current() }
      return () => clearInterval(id)
    }

    let raf = 0
    let mode: 'play' | 'approach' | 'shoot' | 'goal' = 'play'
    let seqIdx = 0
    let from: Pt = PLAYERS[POSSESSION[0]]
    let to: Pt = PLAYERS[POSSESSION[1]]
    let segStart = performance.now()

    const place = (x: number, y: number) => {
      ballRef.current?.setAttribute('transform', `translate(${x} ${y})`)
      lineRef.current?.setAttribute('x2', String(x))
      lineRef.current?.setAttribute('y2', String(y))
    }
    const startSeg = (f: Pt, t: Pt) => {
      from = f; to = t; segStart = performance.now()
      const ln = lineRef.current
      if (ln) {
        ln.setAttribute('x1', String(f.x)); ln.setAttribute('y1', String(f.y))
        ln.setAttribute('x2', String(f.x)); ln.setAttribute('y2', String(f.y))
      }
    }
    startSeg(PLAYERS[POSSESSION[0]], PLAYERS[POSSESSION[1]])

    const loop = (now: number) => {
      const dur = mode === 'shoot' ? SHOT_MS : mode === 'approach' ? APPROACH_MS : SEG_MS
      let t = (now - segStart) / dur
      if (t > 1) t = 1
      const e = ease(t)
      place(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e)

      if (t >= 1) {
        if (mode === 'play') {
          if (doneRef.current) {
            mode = 'approach'
            setPhase('shoot')
            startSeg(to, PLAYERS[ST]) // slip it to the striker
          } else {
            seqIdx = (seqIdx + 1) % POSSESSION.length
            startSeg(PLAYERS[POSSESSION[seqIdx]], PLAYERS[POSSESSION[(seqIdx + 1) % POSSESSION.length]])
          }
        } else if (mode === 'approach') {
          mode = 'shoot'
          startSeg(PLAYERS[ST], GOAL)
        } else if (mode === 'shoot') {
          mode = 'goal'
          setPhase('goal')
          place(GOAL.x, GOAL.y)
          window.setTimeout(() => completeRef.current(), GOAL_HOLD_MS)
          return // ball rests in the net; stop the loop
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const label =
    phase === 'goal' ? 'GOAL!' : phase === 'shoot' ? 'Shooting…' : 'Keeping possession…'

  return (
    <div className="page-container app-bg h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-full max-w-[600px] px-6">
        <svg viewBox="0 0 122 78" className="w-full h-auto" role="img" aria-label="Loading your dashboard">
          <defs>
            <radialGradient id="pitchG" cx="62%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#0c2018" />
              <stop offset="100%" stopColor="#07130d" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.1" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* pitch + markings */}
          <g>
            <rect x="3" y="3" width="116" height="72" rx="3" fill="url(#pitchG)" stroke="rgba(52,211,153,0.28)" strokeWidth="0.5" />
            <g stroke="rgba(52,211,153,0.22)" strokeWidth="0.5" fill="none">
              <line x1="61" y1="3" x2="61" y2="75" />
              <circle cx="61" cy="39" r="9" />
              {/* left box */}
              <rect x="3" y="22" width="15" height="34" />
              <rect x="3" y="31" width="6" height="16" />
              {/* right box */}
              <rect x="104" y="22" width="15" height="34" />
              <rect x="113" y="31" width="6" height="16" />
            </g>
            <circle cx="61" cy="39" r="0.8" fill="rgba(52,211,153,0.5)" />
            {/* right goal net */}
            <g stroke="rgba(230,184,78,0.5)" strokeWidth="0.4" fill="none">
              <rect x="119" y="33" width="3" height="12" fill="rgba(230,184,78,0.06)" />
              <line x1="119.7" y1="33" x2="119.7" y2="45" />
              <line x1="120.6" y1="33" x2="120.6" y2="45" />
              <line x1="119" y1="37" x2="122" y2="37" />
              <line x1="119" y1="41" x2="122" y2="41" />
            </g>
            {/* goal ripple on score */}
            {phase === 'goal' && (
              <circle cx="118" cy="39" r="4" fill="none" stroke="#E6B84E" strokeWidth="0.7" className="animate-ping" style={{ transformOrigin: '118px 39px' }} />
            )}
          </g>

          {/* players (GK gold, rest emerald) */}
          {PLAYERS.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill={i === 0 ? '#E6B84E' : '#34d399'}
              filter="url(#glow)"
              opacity={0.92}
            />
          ))}

          {/* pass line (follows the ball) */}
          <line ref={lineRef} x1="14" y1="39" x2="14" y2="39" stroke="#34d399" strokeWidth="0.7" strokeLinecap="round" strokeDasharray="1.5 1.5" opacity="0.5" />

          {/* the ball */}
          <g ref={ballRef} transform="translate(14 39)">
            <circle r="2.6" fill="#E6B84E" opacity="0.35" filter="url(#glow)" />
            <circle r="1.5" fill="#F5F5F0" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 h-8">
        <span
          className={`font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 ${
            phase === 'goal' ? 'text-accent-gold font-bold text-base' : 'text-text-secondary'
          }`}
          style={phase === 'goal' ? { transform: 'scale(1.08)', textShadow: '0 0 16px rgba(230,184,78,0.6)' } : undefined}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
