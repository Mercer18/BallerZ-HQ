'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { TrendingUp, MessageSquare, Search, ListOrdered, Swords, BarChart3, ChevronRight, Award, Loader2, Sparkles, Flame, Trophy, Zap, Users, History, Crown } from 'lucide-react'
import Link from 'next/link'
import { FormChart } from '@/components/charts/FormChart'
import { formatDate } from '@/lib/utils'
import { getClubColor, hexToRgb } from '@/lib/clubColors'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

interface ClubInfo { id: number; name: string; league: string | null }
interface SeasonStats {
  played: number; won: number; drawn: number; lost: number
  goals_for: number; goals_against: number; goal_difference: number
  points: number; shots: number; fouls: number
  yellow_cards: number; red_cards: number
}
interface RecentMatch {
  id: number; match_date: string | null; season: number | null
  home_club_id: number; away_club_id: number
  home_score: number | null; away_score: number | null
  home_club: { name: string } | null; away_club: { name: string } | null
}
interface GoalsSeason { season: number; goals_for: number; goals_against: number }
interface SeasonStory { headline: string; story: string; powered_by_ai: boolean }

function seasonLabel(s: number | null) {
  return s == null ? '—' : `${s}-${String(s + 1).slice(-2)}`
}

function shortSeason(s: number) {
  return `${String(s).slice(-2)}/${String(s + 1).slice(-2)}`
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th'
  const r = n % 10
  if (r === 1) return n + 'st'
  if (r === 2) return n + 'nd'
  if (r === 3) return n + 'rd'
  return n + 'th'
}

function computeStreak(form: string[]): { text: string; type: 'win' | 'loss' | 'unbeaten' | 'neutral' } | null {
  if (form.length === 0) return null

  let winStreak = 0
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === 'W') winStreak++; else break
  }

  let lossStreak = 0
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === 'L') lossStreak++; else break
  }

  let unbeatenStreak = 0
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] !== 'L') unbeatenStreak++; else break
  }

  if (winStreak >= 2) return { text: `${winStreak}-game win streak`, type: 'win' }
  if (lossStreak >= 2) return { text: `Lost last ${lossStreak}`, type: 'loss' }
  if (unbeatenStreak >= 3) return { text: `Unbeaten in ${unbeatenStreak}`, type: 'unbeaten' }

  const last = form[form.length - 1]
  if (last === 'W') return { text: 'Won last match', type: 'win' }
  if (last === 'L') return { text: 'Lost last match', type: 'loss' }
  return { text: 'Drew last match', type: 'neutral' }
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<ClubInfo | null>(null)
  const [stats, setStats] = useState<SeasonStats | null>(null)
  const [prevStats, setPrevStats] = useState<SeasonStats | null>(null)
  const [currentSeason, setCurrentSeason] = useState<number | null>(null)
  const [recent, setRecent] = useState<RecentMatch[]>([])
  const [form, setForm] = useState<string[]>([])
  const [story, setStory] = useState<SeasonStory | null>(null)
  const [leaguePosition, setLeaguePosition] = useState<{ position: number; total: number } | null>(null)
  const [goalsHistory, setGoalsHistory] = useState<GoalsSeason[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favorite_club_id, clubs (*)')
        .eq('user_id', session.user.id)
        .single()

      if (!prefs || !prefs.clubs) { router.push('/onboarding'); return }

      const clubData: any = prefs.clubs
      setClub({ id: clubData.id, name: clubData.name, league: clubData.league })

      let recentMatches: RecentMatch[] = []
      try {
        const r = await fetch(`${BACKEND}/api/matches/?club_id=${clubData.id}&limit=5`)
        if (r.ok) recentMatches = await r.json()
      } catch {}
      setRecent(recentMatches)

      setForm(
        recentMatches.slice().reverse().map(m => {
          const home = m.home_club_id === clubData.id
          const gf = home ? m.home_score : m.away_score
          const ga = home ? m.away_score : m.home_score
          if (gf == null || ga == null) return 'D'
          return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
        })
      )

      const cs = recentMatches.length ? recentMatches[0].season : null
      setCurrentSeason(cs)

      try {
        const q = cs != null ? `?season=${cs}` : ''
        const s = await fetch(`${BACKEND}/api/matches/clubs/${clubData.id}/season-stats${q}`)
        if (s.ok) setStats(await s.json())
      } catch {}

      setLoading(false)

      // B-3 fetches — non-blocking, fire in parallel after main load
      const b3: Promise<void>[] = []

      if (cs != null && clubData.league) {
        b3.push(
          fetch(`${BACKEND}/api/matches/standings?league=${encodeURIComponent(clubData.league)}&season=${cs}`)
            .then(async r => {
              if (!r.ok) return
              const rows: any[] = await r.json()
              const row = rows.find((x: any) => x.club_id === clubData.id || x.club?.id === clubData.id)
              if (row) setLeaguePosition({ position: row.position, total: rows.length })
            })
            .catch(() => {})
        )
      }

      if (cs != null && cs > 2010) {
        b3.push(
          fetch(`${BACKEND}/api/matches/clubs/${clubData.id}/season-stats?season=${cs - 1}`)
            .then(async r => { if (r.ok) setPrevStats(await r.json()) })
            .catch(() => {})
        )
      }

      b3.push(
        fetch(`${BACKEND}/api/matches/clubs/${clubData.id}/goals-history?seasons=5`)
          .then(async r => { if (r.ok) setGoalsHistory(await r.json()) })
          .catch(() => {})
      )

      await Promise.all(b3)

      try {
        const r = await fetch(`${BACKEND}/api/chat/season-story`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: session.user.id }),
        })
        if (r.ok) setStory(await r.json())
      } catch {}
    }
    run()
  }, [router])

  if (loading) {
    return (
      <div className="page-container app-bg h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent-emerald animate-spin" />
          <p className="text-sm text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const clubColor = getClubColor(club?.name)
  const clubRgb = hexToRgb(clubColor)
  const streak = computeStreak(form)

  const d = (a: number | undefined, b: number | undefined) =>
    a != null && b != null ? a - b : null

  const ptsDelta = d(stats?.points, prevStats?.points)
  const gfDelta = d(stats?.goals_for, prevStats?.goals_for)
  const gaDelta = d(stats?.goals_against, prevStats?.goals_against)
  const gdDelta = d(stats?.goal_difference, prevStats?.goal_difference)

  return (
    <div
      className="page-container app-bg pt-6"
      style={{ '--club-rgb': clubRgb, '--club-color': clubColor } as React.CSSProperties}
    >
      <main className="content-container space-y-5 pb-24">
        {/* Header */}
        <div className="pb-5 border-b border-dashed border-white/[0.06]">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>
              {club?.name || 'Your Team'}
            </h1>
            {leaguePosition && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border text-accent-emerald border-accent-emerald/25 bg-accent-emerald/[0.08]">
                <Trophy className="w-3.5 h-3.5" />
                {ordinal(leaguePosition.position)} in {club?.league}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1.5 flex items-center gap-2">
            <Award className="w-4 h-4 text-text-muted" />
            <span className="font-mono text-xs">{club?.league || 'N/A'}</span>
            {currentSeason != null && <span className="text-text-muted/40">|</span>}
            {currentSeason != null && <span className="font-mono text-xs text-text-muted">{seasonLabel(currentSeason)}</span>}
            {leaguePosition && (
              <>
                <span className="text-text-muted/40">|</span>
                <span className="font-mono text-xs text-text-muted">{leaguePosition.position} of {leaguePosition.total}</span>
              </>
            )}
          </p>
        </div>

        {/* ── 6-col stat grid (reference .sg) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCell label="Points"        value={stats?.points ?? '—'} tone="emerald" delta={ptsDelta} />
          <StatCell label="Played"        value={stats?.played ?? '—'} />
          <StatCell label="Goals For"     value={stats?.goals_for ?? '—'} tone="emerald" delta={gfDelta} />
          <StatCell label="Goals Against" value={stats?.goals_against ?? '—'} tone="coral" delta={gaDelta} invertDelta />
          <StatCell label="Goal Diff"     value={stats ? (stats.goal_difference >= 0 ? `+${stats.goal_difference}` : stats.goal_difference) : '—'} tone="emerald" delta={gdDelta} />
          <StatCell label="Shots"         value={stats?.shots ?? '—'} />
        </div>

        {/* ── Two-col: Recent Form | Season Record (reference .tc) ── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* RECENT FORM */}
          <div className="card-terminal p-6">
            <div className="flex justify-between items-center mb-5">
              <span className="terminal-label text-text-secondary">Recent Form</span>
              <span className="font-mono text-xs text-text-muted tabular-nums tracking-wide">
                {form.filter(f => f === 'W').length}W · {form.filter(f => f === 'D').length}D · {form.filter(f => f === 'L').length}L
              </span>
            </div>
            <div className="flex gap-2 mb-4">
              {form.length > 0 ? form.map((r, i) => (
                <div key={i} className={`w-11 h-11 rounded-xl grid place-items-center font-serif text-lg font-semibold border ${
                  r === 'W' ? 'bg-accent-emerald/[0.12] text-accent-emerald border-accent-emerald/25'
                  : r === 'D' ? 'bg-accent-gold/[0.12] text-accent-gold border-accent-gold/25'
                  : 'bg-accent-coral/[0.12] text-accent-coral border-accent-coral/25'
                }`}>{r}</div>
              )) : <div className="w-full text-center text-sm text-text-muted py-4">No recent matches.</div>}
            </div>
            <FormChart form={form} teamName={club?.name || ''} />
            {streak && (
              <div className="mt-4 inline-flex items-center gap-2 font-mono text-xs font-semibold text-accent-emerald">
                <Flame className="w-3.5 h-3.5" /> {streak.text}
              </div>
            )}
          </div>

          {/* SEASON RECORD */}
          <div className="card-terminal p-6 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="terminal-label text-text-secondary">Season Record</span>
              <span className="font-mono text-xs text-text-muted tracking-wide">W–D–L</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="font-serif text-6xl font-semibold text-text-primary tabular-nums tracking-[-0.02em] leading-none">
                {stats ? `${stats.won}–${stats.drawn}–${stats.lost}` : '—'}
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted mt-3">Wins · Draws · Losses</div>
            </div>
            {prevStats && stats && (
              <div className="grid grid-cols-3 gap-2 pt-5 mt-2 border-t border-dashed border-accent-emerald/10 text-center">
                <RecordDelta value={stats.won - prevStats.won} label="vs Last" />
                <RecordDelta value={stats.drawn - prevStats.drawn} label="Draws" tone="warm" />
                <RecordDelta value={stats.lost - prevStats.lost} label="Losses" invert />
              </div>
            )}
          </div>
        </div>

        {/* Goals history chart */}
        {goalsHistory.length > 0 && (
          <div className="card-terminal p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent-emerald" />
              <span className="terminal-label text-text-secondary">Goals History</span>
              <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="font-mono text-[9px] text-text-muted uppercase">Scored</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-red-500/60" />
                  <span className="font-mono text-[9px] text-text-muted uppercase">Conceded</span>
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {(() => {
                const maxGoals = Math.max(...goalsHistory.flatMap(s => [s.goals_for, s.goals_against]), 1)
                return goalsHistory.map(s => (
                  <div key={s.season} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-muted w-12 shrink-0 text-right tracking-wide">{shortSeason(s.season)}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded-sm bg-emerald-500/80"
                          style={{ width: `${(s.goals_for / maxGoals) * 100}%`, minWidth: '4px' }}
                        />
                        <span className="font-mono text-[10px] text-emerald-400 font-bold tabular-nums">{s.goals_for}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded-sm bg-red-500/40"
                          style={{ width: `${(s.goals_against / maxGoals) * 100}%`, minWidth: '4px' }}
                        />
                        <span className="font-mono text-[10px] text-red-400/80 font-bold tabular-nums">{s.goals_against}</span>
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Recent results */}
        <div className="card-terminal p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="terminal-label text-text-secondary">Recent Matches</span>
            <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
          </div>
          {recent.length === 0 ? (
            <p className="text-center text-text-muted py-6 text-sm">No matches found.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-base-50/50 rounded-lg px-4 py-3 border border-dashed border-accent-emerald/10 hover:border-accent-emerald/25 transition-colors">
                  <span className="font-mono text-[10px] text-text-muted w-24 shrink-0 tracking-wide">{m.match_date ? formatDate(m.match_date) : '—'}</span>
                  <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                    <span className="text-text-primary text-sm font-semibold truncate text-right flex-1">{m.home_club?.name ?? '—'}</span>
                    <span className="font-mono text-sm font-bold text-accent-emerald bg-accent-emerald/[0.06] rounded-lg px-3 py-1 shrink-0 tabular-nums border border-accent-emerald/10">
                      {m.home_score ?? '-'} : {m.away_score ?? '-'}
                    </span>
                    <span className="text-text-primary text-sm font-semibold truncate flex-1">{m.away_club?.name ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <QuickCard href="/matches" icon={<History className="w-4 h-4 text-accent-emerald" />} title="Matches" />
          <QuickCard href="/standings" icon={<ListOrdered className="w-4 h-4 text-accent-emerald" />} title="Standings" />
          <QuickCard href="/head-to-head" icon={<Swords className="w-4 h-4 text-accent-emerald" />} title="H2H" />
          <QuickCard href="/clubs" icon={<BarChart3 className="w-4 h-4 text-accent-emerald" />} title="Clubs" />
          <QuickCard href="/players" icon={<Users className="w-4 h-4 text-accent-amber" />} title="Players" pro />
        </div>
      </main>
    </div>
  )
}

function HeroStat({ label, value, accentColor, accentRgb, sub, delta, footer }: {
  label: string; value: number | string; accentColor?: string; accentRgb?: string
  sub?: string; delta?: number | null; footer?: React.ReactNode
}) {
  return (
    <div
      className="card-terminal text-center py-6 px-4"
      style={accentRgb ? { borderColor: `rgba(${accentRgb}, 0.25)` } : undefined}
    >
      <div
        className="text-5xl sm:text-6xl font-serif font-semibold tabular-nums tracking-[-0.02em] leading-none"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
      <div className="terminal-label mt-2">{label}</div>
      {sub && <div className="font-mono text-[9px] text-text-muted mt-0.5 tracking-wider">{sub}</div>}
      {delta != null && delta !== 0 && (
        <div className={`font-mono text-xs mt-1.5 font-bold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta > 0 ? '▲ +' : '▼ '}{delta}
        </div>
      )}
      {footer}
    </div>
  )
}

function StatCell({ label, value, tone = 'default', delta, invertDelta }: {
  label: string; value: number | string; tone?: 'default' | 'emerald' | 'coral'
  delta?: number | null; invertDelta?: boolean
}) {
  const toneClass = tone === 'emerald' ? 'text-accent-emerald' : tone === 'coral' ? 'text-accent-coral' : 'text-text-primary'
  const showDelta = delta != null && delta !== 0
  const good = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0
  return (
    <div className="card-terminal px-5 py-5 text-left">
      <div className={`text-[2.1rem] font-serif font-semibold tabular-nums tracking-[-0.02em] leading-none ${toneClass}`}>{value}</div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted mt-2.5">{label}</div>
      {showDelta && (
        <div className={`font-mono text-[11px] font-semibold mt-2 flex items-center gap-1 ${good ? 'text-accent-emerald' : 'text-accent-coral'}`}>
          {(delta ?? 0) > 0 ? '▲ +' : '▼ '}{delta}
        </div>
      )}
    </div>
  )
}

function RecordDelta({ value, label, tone, invert }: { value: number; label: string; tone?: 'warm'; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0
  const color = tone === 'warm' ? 'text-accent-gold' : good ? 'text-accent-emerald' : 'text-accent-coral'
  return (
    <div>
      <div className={`font-serif text-2xl font-semibold tabular-nums ${color}`}>{value > 0 ? '+' : ''}{value}{label === 'vs Last' ? 'W' : label === 'Draws' ? 'D' : 'L'}</div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mt-1.5">{label}</div>
    </div>
  )
}

function DeltaChip({ value, label, invert }: { value: number; label: string; invert?: boolean }) {
  if (value === 0) return null
  const isGood = invert ? value < 0 : value > 0
  return (
    <span className={`font-mono text-[10px] font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
      {value > 0 ? '▲' : '▼'}{value > 0 ? '+' : ''}{value}{label}
    </span>
  )
}

function MiniStat({ label, value, delta, invertDelta }: {
  label: string; value: number | string; delta?: number | null; invertDelta?: boolean
}) {
  const showDelta = delta != null && delta !== 0
  const isGood = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0
  return (
    <div className="bg-surface/60 border border-dashed border-accent-emerald/10 rounded-lg text-center py-2.5 px-2">
      <div className="text-2xl font-serif font-semibold tabular-nums text-text-primary tracking-[-0.01em] leading-none">{value}</div>
      <div className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1">{label}</div>
      {showDelta && (
        <div className={`font-mono text-[9px] font-bold mt-0.5 ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta! > 0 ? '▲+' : '▼'}{delta}
        </div>
      )}
    </div>
  )
}

function QuickCard({ href, icon, title, pro = false }: { href: string; icon: React.ReactNode; title: string; pro?: boolean }) {
  return (
    <Link
      href={href}
      className={`card-terminal group py-3 px-4 flex items-center gap-3 ${
        pro ? 'hover:border-accent-amber/60' : 'hover:border-accent-emerald/50'
      }`}
      style={pro ? { borderColor: 'rgba(230,184,78,0.30)', boxShadow: '0 0 22px -6px rgba(230,184,78,0.30), inset 0 0 0 1px rgba(230,184,78,0.05)' } : undefined}
    >
      <div className={`w-8 h-8 rounded-lg border border-dashed flex items-center justify-center group-hover:scale-105 transition-transform ${
        pro ? 'bg-accent-amber/[0.10] border-accent-amber/30' : 'bg-accent-emerald/[0.08] border-accent-emerald/20'
      }`}>
        {icon}
      </div>
      <span className={`font-mono text-xs font-bold flex items-center uppercase tracking-wider transition-colors ${
        pro ? 'text-accent-amber' : 'text-text-secondary group-hover:text-accent-emerald'
      }`}>
        {title}
        {pro && <span className="ml-2 inline-flex items-center gap-1 bg-accent-amber/15 border border-accent-amber/30 rounded px-1.5 py-0.5 text-[8px] tracking-widest"><Crown className="w-2.5 h-2.5" />PRO</span>}
        <ChevronRight className={`w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${pro ? 'text-accent-amber' : 'text-text-muted'}`} />
      </span>
    </Link>
  )
}
