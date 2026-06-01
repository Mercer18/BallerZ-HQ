'use client'

import { useEffect, useState, useRef, forwardRef, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import {
  ChevronRight, ChevronDown, ArrowRight, Search, ListOrdered, Swords, BarChart3, Bot,
  Crown, Check, Mail, CheckCircle2, Trophy, Users, Sparkles,
  Database, LineChart, Target, Calendar, ArrowUpRight, Shield, Lock
} from 'lucide-react'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import { AmbientParticles } from '@/components/AmbientParticles'
import { EliteBackground } from '@/components/EliteBackground'
import { CustomCursor } from '@/components/CustomCursor'

// ─── HOOKS ───────────────────────────────────────────────────────────────────

// Counts up on mount (after a short delay) so the ramp always plays in front of the user.
function useCounter(end: number, duration = 2800, delay = 350) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          setCount(Math.floor(eased * end))
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return { count, ref }
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        obs.disconnect()
      }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const CounterCard = forwardRef<HTMLDivElement, { value: string; label: string; icon: React.ReactNode }>(
  ({ value, label, icon }, ref) => (
    <div ref={ref} className="text-center py-5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
      <div className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1 tabular-nums">{value}</div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-350 font-semibold uppercase tracking-wider">
        {icon} {label}
      </div>
    </div>
  )
)
CounterCard.displayName = 'CounterCard'

function PlanFeature({ children, available = false }: { children: React.ReactNode; available?: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {available
        ? <Check className="w-4 h-4 text-accent-emerald shrink-0" />
        : <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      <span className={available ? 'text-slate-100' : 'text-slate-450'}>{children}</span>
    </li>
  )
}

function PageContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const featuresReveal = useReveal()

  // Counters
  const matches = useCounter(28892)
  const tables = useCounter(1562)
  const players = useCounter(25257)
  const seasons = useCounter(16)

  // Custom Cursor logic
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 })
  const [ringOn, setRingOn] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    let animationFrameId: number
    const loop = () => {
      setRingPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.1,
        y: prev.y + (mousePos.y - prev.y) * 0.1
      }))
      animationFrameId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [mousePos])

  const interactiveProps = {
    onMouseEnter: () => setRingOn(true),
    onMouseLeave: () => setRingOn(false)
  }

  // Enable snap-scroll on the landing page only (cleaned up on unmount)
  useEffect(() => {
    document.documentElement.classList.add('snap-landing', 'landing-cursor')
    return () => { document.documentElement.classList.remove('snap-landing', 'landing-cursor') }
  }, [])

  // Magnetic CTA — buttons with [data-magnet] pull toward the cursor
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-magnet]'))
    const handlers = els.map(el => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left - r.width / 2
        const y = e.clientY - r.top - r.height / 2
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`
      }
      const onLeave = () => { el.style.transform = 'translate(0,0)' }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      return () => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    })
    return () => handlers.forEach(off => off())
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen text-white relative">
      <EliteBackground />
      <CustomCursor />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 h-[72px] bg-[#060b18]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center select-none" {...interactiveProps}>
            <AnimatedLogo size="sm" />
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-10">
            <button
              onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-[0.18em] transition-colors"
              {...interactiveProps}
            >
              Capabilities
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 text-[11px] font-bold text-accent-amber hover:text-accent-amber/70 uppercase tracking-[0.18em] transition-colors"
              {...interactiveProps}
            >
              Pro Access <Crown className="w-3 h-3" />
            </button>
          </div>

          {/* Right auth buttons */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-emerald to-accent-blue text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                {...interactiveProps}
              >
                Dashboard <ArrowRight className="w-4 h-4 ml-1.5 inline" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-[0.18em] transition-colors px-4 py-2"
                  {...interactiveProps}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-emerald to-accent-blue text-white text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity"
                  {...interactiveProps}
                >
                  Get Started <ChevronRight className="w-3.5 h-3.5 ml-0.5 inline" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="snap-section relative h-screen flex flex-col justify-center pt-[72px] overflow-hidden">
        {/* Stadium wallpaper — scoped to the hero section only, fades into the dark below */}
        <div className="hero-stadium" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex-1 flex items-start justify-center">
          <div className="w-full flex flex-col items-center text-center gap-6 pt-10 lg:pt-14 max-w-4xl">

            {/* Pill badge — "Updated · ..." (sheen sweep) */}
            <div
              className="lift inline-flex items-center gap-2.5 font-mono text-[10px] tracking-[0.25em] uppercase px-4 py-2 rounded-full sheen"
              style={{
                background: 'rgba(8,11,16,0.72)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(52,211,153,0.38)',
                color: '#D6DAE2',
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5), 0 0 18px -6px rgba(52,211,153,0.30)',
                transform: 'scale(1.025)',
              }}
            >
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-accent-emerald pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-accent-emerald" />
              </span>
              <span><b ref={matches.ref} className="text-accent-emerald font-bold tabular-nums">{matches.count.toLocaleString()}</b> matches · <b ref={players.ref} className="text-accent-emerald font-bold tabular-nums">{players.count.toLocaleString()}</b> players · <b className="text-accent-emerald font-bold">5</b> leagues · <b ref={seasons.ref} className="text-accent-emerald font-bold tabular-nums">{seasons.count}</b> seasons</span>
            </div>

            {/* Headline — Fraunces editorial (V3 spec): Every / number. / your team. */}
            <h1 className="font-serif leading-[0.92] tracking-[-0.03em] origin-left text-center">
              <span className="stinger block text-[clamp(3rem,9vw,7.5rem)] font-semibold text-[#ECEBE7]">Every</span>
              <span className="stinger stinger-d1 block text-[clamp(3rem,9vw,7.5rem)] font-semibold text-accent-emerald">number.</span>
              <span className="stinger stinger-d2 block text-[clamp(2.1rem,6vw,4.75rem)] italic font-medium text-accent-gold mt-1.5">your team.</span>
            </h1>

            {/* Body */}
            <p className="lift lift-d1 text-base md:text-lg leading-relaxed max-w-[620px] font-medium" style={{ color: '#E8EAEE', textShadow: '0 1px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6)' }}>
              A <span className="text-accent-emerald font-semibold" style={{ textShadow: '0 2px 16px rgba(52,211,153,0.5), 0 1px 4px rgba(0,0,0,0.8)' }}>personalised</span> football intelligence platform powered by <span className="text-accent-emerald font-semibold" style={{ textShadow: '0 2px 16px rgba(52,211,153,0.5), 0 1px 4px rgba(0,0,0,0.8)' }}>RAG</span>.
              <br />Over a decade of match data, standings computed from scratch, and an AI analyst that only speaks in verified numbers from your club&apos;s data.
              <br /><span className="italic font-semibold text-accent-emerald" style={{ marginLeft: '1.73em', textShadow: '0 2px 16px rgba(52,211,153,0.5), 0 1px 4px rgba(0,0,0,0.8)' }}>Europe&apos;s top five leagues. Every number accounted for.</span>
            </p>

            {/* CTAs — Magnetic emerald "Pick your club" + amber glass Pro pill */}
            <div className="lift lift-d2 flex flex-wrap justify-center pt-1" style={{ gap: '0.825rem', marginLeft: '-0.825em' }}>
              <Link
                href={isLoggedIn ? '/dashboard' : '/signup'}
                data-magnet
                className="glass-pill glass-pill-emerald"
                {...interactiveProps}
              >
                <span>{isLoggedIn ? 'Open your hub' : 'Pick your club'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                data-magnet
                className="glass-pill glass-pill-amber"
                {...interactiveProps}
              >
                <Crown className="w-4 h-4" /> <span>Explore Pro</span>
              </button>
            </div>

          </div>
        </div>

        {/* Scroll to explore — text + glowing beam line + chevron, with dark backing so it reads over the ball */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3.5 px-10 py-4">
          <span className="font-mono text-[11px] font-bold text-accent-emerald uppercase tracking-[0.45em]" style={{ textShadow: '0 0 12px rgba(16,185,129,0.5)', paddingLeft: '0.45em', marginLeft: '1.05em' }}>Scroll to explore</span>
          <div className="scroll-line relative w-px h-11 overflow-hidden">
            <span className="scroll-beam" />
          </div>
          <ChevronDown className="w-5 h-5 text-accent-emerald animate-bounce" style={{ filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.9))' }} />
        </div>
      </section>

      {/* ─── PLATFORM CAPABILITIES (ELABORATE BENTO GRID) ─── */}
      <section id="platform" className="snap-section relative z-10 min-h-screen flex flex-col">


        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center py-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-[11px] font-bold text-accent-emerald uppercase tracking-[0.2em] border border-accent-emerald/22 rounded-lg px-3.5 py-1.5 mb-6">Capabilities</span>
            <h2 className="font-serif text-4xl lg:text-[3.4rem] font-medium tracking-[-0.02em] leading-[1.05]">
              <span className="text-[#ECEBE7]">Professional-grade</span><br />
              <span className="italic text-accent-emerald">football intelligence</span>
            </h2>
            <p className="mt-5 text-base max-w-md mx-auto" style={{ color: '#A9ADB6' }}>Six tools built with a single obsession: the club you support.</p>
          </div>

          {/* 2-col feature grid (reference .cap-grid) */}
          <div className="grid md:grid-cols-2 gap-5">

            {/* 01 — Match Browser */}
            <FCard ord="01" label="Match Analysis" title="Match Browser"
              desc="Browse every match across 5 leagues and 16 seasons. Scores, lineups, referees, cards, corners, and xG timelines."
              meta="16 seasons · 5 leagues">
              <MiniWidget head="Match Feed" live>
                <MiniRow tm="Arsenal vs Chelsea" val="3–1" />
                <MiniRow tm="Real Madrid vs Barcelona" val="2–1" />
                <MiniRow tm="Man City vs Bayern" val="3–2" />
              </MiniWidget>
            </FCard>

            {/* 02 — League Standings */}
            <FCard ord="02" label="Table History" title="League Standings"
              desc="Historical table snapshots across every season and competition. Form curves, matchday splits, custom campaigns.">
              <MiniWidget head="Club" headRight="Pts">
                <MiniRow tm={<><span className="text-accent-emerald font-bold mr-2 tabular-nums">1</span>Real Madrid</>} val="92" valClass="text-text-primary" />
                <MiniRow tm={<><span className="text-accent-emerald font-bold mr-2 tabular-nums">2</span>Barcelona</>} val="88" valClass="text-text-primary" />
                <MiniRow tm={<><span className="text-accent-emerald font-bold mr-2 tabular-nums">3</span>Atletico</>} val="78" valClass="text-text-primary" />
              </MiniWidget>
            </FCard>

            {/* 03 — Head-to-Head */}
            <FCard ord="03" label="Club Comparison" title="Head-to-Head"
              desc="Compare any two clubs across 16 seasons. Win rates, goal ratios, and outcome margins computed instantly.">
              <MiniWidget head="H2H Record" headRight="Last 10">
                <MiniRow tm="Real Madrid Wins" val="5" />
                <MiniRow tm="Draws" val="2" valClass="text-text-primary" />
                <MiniRow tm="Barcelona Wins" val="3" valClass="text-accent-coral" />
              </MiniWidget>
            </FCard>

            {/* 04 — Club IQ (gold flagship) */}
            <FCard ord="04" gold label="Ask Your Club" title="Club IQ"
              desc="Ask anything about your club in plain English — form, results, top scorers, season history. Answers grounded in your data only, zero hallucination."
              meta="Free now · Pro unlocks advanced analysis">
              <MiniWidget>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent-emerald mb-2">Your Question</div>
                <div className="font-serif italic text-[13px] leading-snug mb-3" style={{ color: '#A9ADB6' }}>&ldquo;How&apos;s our form going into the run-in?&rdquo;</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent-emerald mb-1.5">Club IQ Says</div>
                <div className="text-[13px] leading-relaxed" style={{ color: '#A9ADB6' }}>You&apos;re on a <b className="text-text-primary">3-game win streak</b> — 4 wins in the last 5, scoring 11 and conceding 3. Best run of the season.</div>
              </MiniWidget>
            </FCard>

            {/* 05 — Club Deep-Dive */}
            <FCard ord="05" label="Club Profile" title="Club Deep-Dive"
              desc="Full profile analytics. xG trends, press intensity curves, and player composition across every season in the dataset.">
              <MiniWidget head="Tactical Metrics" headRight="Value">
                <MiniRow tm="Field Tilt" val="64.5%" />
                <MiniRow tm="PPDA (Defensive)" val="9.4" valClass="text-text-primary" />
                <MiniRow tm="xG per 90" val="1.72" valClass="text-text-primary" />
              </MiniWidget>
            </FCard>

            {/* 06 — Players (gold flagship) */}
            <FCard ord="06" gold label="Player Database" title="Player Stats"
              desc="25,000+ player records from FBref — goals, assists, minutes, xG, progressive actions. Filter by league, season, or club."
              meta="Free now · Pro unlocks xG &amp; scouting">
              <MiniWidget head="Top Scorers" headRight="2025-26">
                <MiniRow tm={<><span className="text-accent-amber font-bold mr-2 tabular-nums">1</span>Salah</>} val="19" />
                <MiniRow tm={<><span className="text-accent-amber font-bold mr-2 tabular-nums">2</span>Haaland</>} val="18" valClass="text-text-primary" />
                <MiniRow tm={<><span className="text-accent-amber font-bold mr-2 tabular-nums">3</span>Palmer</>} val="16" valClass="text-text-primary" />
              </MiniWidget>
            </FCard>

          </div>
        </div>
      </section>


      {/* ─── PRICING + FOOTER (single snap section) ─── */}
      <section id="pricing" className="snap-section relative z-10 min-h-screen flex flex-col border-t border-white/[0.05]">
        <div className="max-w-[1000px] mx-auto px-4 flex-1 flex flex-col justify-center py-16 w-full">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-bold text-accent-emerald uppercase tracking-[0.2em] border border-accent-emerald/22 rounded-lg px-3.5 py-1.5 mb-5">Pricing</span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#ECEBE7] tracking-[-0.02em]">
              Free today. <span className="italic text-accent-emerald">More coming.</span>
            </h2>
            <p className="text-base mt-4 max-w-lg mx-auto" style={{ color: '#A9ADB6' }}>
              The full historical platform is free. Player depth and advanced AI land as Premium.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">

            {/* Free Plan */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(8,14,28,0.8)] flex flex-col">
              {/* Card header strip */}
              <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.06]">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-emerald via-accent-emerald/60 to-transparent rounded-t-2xl" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[9px] font-bold text-accent-emerald/50 uppercase tracking-[0.3em] mb-1.5">Tier 01</div>
                    <h3 className="font-serif text-3xl font-semibold text-[#ECEBE7] tracking-tight">Free</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Full access, no card required</p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] font-black text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/25 px-3 py-1.5 rounded-lg uppercase tracking-widest mt-1">
                    Live Now
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-5xl font-semibold text-[#ECEBE7] tracking-tight">£0</span>
                  <span className="text-slate-500 text-sm">/ forever</span>
                </div>
              </div>
              <div className="px-7 py-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-3">
                  <PlanFeature available>27,000+ matches, 2010-11 to today</PlanFeature>
                  <PlanFeature available>League standings for every season</PlanFeature>
                  <PlanFeature available>Head-to-head history</PlanFeature>
                  <PlanFeature available>Club deep-dives</PlanFeature>
                  <PlanFeature available>Club IQ — AI grounded in real data</PlanFeature>
                </ul>
                {!isLoggedIn && (
                  <Link href="/signup" className="mt-7 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-emerald text-black text-[11px] font-black uppercase tracking-[0.15em] hover:bg-accent-emerald/90 transition-colors" {...interactiveProps}>
                    Launch Free Terminal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative overflow-hidden rounded-2xl border border-accent-amber/15 bg-[rgba(8,14,28,0.8)] flex flex-col">
              {/* Card header strip */}
              <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.06]">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-amber via-accent-amber/60 to-transparent rounded-t-2xl" />
                <div className="absolute top-0 right-0 w-32 h-24 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.06)_0%,transparent_70%)]" />
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div>
                    <div className="font-mono text-[9px] font-bold text-accent-amber/50 uppercase tracking-[0.3em] mb-1.5">Tier 02</div>
                    <h3 className="font-serif text-3xl font-semibold text-[#ECEBE7] tracking-tight flex items-center gap-2">
                      <Crown className="w-5 h-5 text-accent-amber" /> Premium
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">Advanced analytics &amp; AI</p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] font-black text-accent-amber bg-accent-amber/10 border border-accent-amber/25 px-3 py-1.5 rounded-lg uppercase tracking-widest mt-1">
                    Coming Soon
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 relative z-10">
                  <span className="font-serif text-5xl font-semibold text-accent-amber tracking-tight">TBD</span>
                  <span className="text-slate-500 text-sm">/ month</span>
                </div>
              </div>
              <div className="px-7 py-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-3">
                  <PlanFeature>Player stats &amp; deep analysis</PlanFeature>
                  <PlanFeature>Advanced AI analysis mode</PlanFeature>
                  <PlanFeature>Club logos &amp; polished presentation</PlanFeature>
                  <PlanFeature>Bookmaker odds comparison</PlanFeature>
                </ul>
                <div className="mt-7">
                  <WaitlistForm />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer pinned at the bottom of the snap section */}
        <footer className="border-t border-white/[0.05] bg-[#0c1425] relative z-10 py-8 mt-auto">
          <div className="max-w-[1280px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <AnimatedLogo size="sm" />
            <div className="flex items-center gap-8">
              <Link href="#" className="text-sm text-slate-450 hover:text-white transition-colors" {...interactiveProps}>Privacy Policy</Link>
              <Link href="#" className="text-sm text-slate-450 hover:text-white transition-colors" {...interactiveProps}>Terms of Service</Link>
            </div>
            <p className="text-sm text-slate-500">&copy; 2026 BallerZ HQ. All rights reserved.</p>
          </div>
        </footer>
      </section>
    </div>
  )
}

// ── Landing capabilities helpers (reference .fcard / .mini) ──
function FCard({ ord, label, title, desc, meta, gold = false, pro = false, children }: {
  ord: string; label: string; title: string; desc: string; meta?: string
  gold?: boolean; pro?: boolean; children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] p-8 border border-white/[0.07] bg-[rgba(16,18,22,0.55)] hover:border-accent-emerald/30 hover:-translate-y-1 transition-all duration-300 group">
      <span className="absolute right-4 -bottom-5 font-serif font-semibold text-[140px] leading-none text-white/[0.025] select-none pointer-events-none">{ord}</span>
      <div className="relative z-10">
        <div className="relative pl-4 mb-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-sm ${gold ? 'bg-accent-gold' : 'bg-accent-emerald'}`} />
          {label}
        </div>
        <h3 className="font-serif text-[27px] font-semibold tracking-[-0.01em] text-text-primary mb-3.5 flex items-center gap-2.5">
          {title}
          {pro && <span className="text-[9px] font-extrabold tracking-[0.1em] text-accent-gold border border-accent-gold/40 rounded px-1.5 py-0.5 uppercase">Pro</span>}
        </h3>
        <p className="text-[14.5px] leading-relaxed max-w-[440px]" style={{ color: '#A9ADB6' }}>{desc}</p>
        {children}
        {meta && <div className="text-[10px] font-bold uppercase tracking-[0.12em] mt-5" style={{ color: '#474C58' }}>{meta}</div>}
      </div>
    </div>
  )
}

function MiniWidget({ head, headRight, live, children }: {
  head?: string; headRight?: string; live?: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[rgba(6,8,13,0.6)] p-4 mt-6">
      {(head || headRight || live) && (
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          <span>{head}</span>
          {live
            ? <span className="flex items-center gap-1.5 text-accent-emerald"><span className="w-1.5 h-1.5 rounded-full bg-accent-emerald" /> Live</span>
            : <span>{headRight}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

function MiniRow({ tm, val, valClass = 'text-accent-emerald' }: {
  tm: React.ReactNode; val: string; valClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px] border-t border-white/[0.04] first:border-t-0">
      <span style={{ color: '#A9ADB6' }}>{tm}</span>
      <span className={`font-serif font-semibold tabular-nums ${valClass}`}>{val}</span>
    </div>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address')
      return
    }
    setSaving(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.from('waitlist').insert([{ email: value }])
      if (error) throw error
      setSubmitted(true)
      setError('')
    } catch {
      setError('Could not save email. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 bg-accent-emerald/15 border border-accent-emerald/30 rounded-xl px-4 py-3.5">
        <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0" />
        <span className="text-xs text-white">You&apos;re on the list. We&apos;ll let you know when PRO drops.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="waitlist-email" className="font-mono text-[9px] uppercase tracking-wider text-accent-amber/80 mb-2 block">Reserve your slot</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="waitlist-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input pl-9 font-mono text-[11px]"
            disabled={saving}
          />
        </div>
        <button type="submit" className="btn-accent whitespace-nowrap font-mono uppercase tracking-wider text-xs" disabled={saving}>
          {saving ? '...' : 'Reserve Slot'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </form>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060b18] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent-emerald border-t-transparent animate-spin"></div></div>}>
      <PageContent />
    </Suspense>
  )
}
