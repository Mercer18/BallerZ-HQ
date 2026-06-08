'use client'

import { useEffect, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Club { id: number; name: string; league: string | null }
interface SeasonStats {
  played: number; won: number; drawn: number; lost: number
  goals_for: number; goals_against: number; goal_difference: number
  points: number; shots: number; fouls: number
  yellow_cards: number; red_cards: number
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL
const SEASONS = Array.from({ length: 16 }, (_, i) => 2025 - i)
function seasonLabel(s: number) { return `${s}-${String(s + 1).slice(-2)}` }

function ClubsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubId, setClubId] = useState(searchParams.get('club_id') ?? '')
  const [season, setSeason] = useState('')
  const [stats, setStats] = useState<SeasonStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prefs } = await supabase.from('user_preferences').select('id').eq('user_id', session.user.id).single()
      if (!prefs) { router.push('/onboarding'); return }
      setAuthed(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!authed) return
    fetch(`${BACKEND}/api/matches/clubs`).then(r => r.ok ? r.json() : []).then(setClubs).catch(() => {})
  }, [authed])

  const loadStats = async (id: string, s: string) => {
    if (!id) { setError('Pick a club'); return }
    setLoading(true); setError('')
    try {
      const q = s ? `?season=${s}` : ''
      const res = await fetch(`${BACKEND}/api/matches/clubs/${id}/season-stats${q}`)
      if (!res.ok) throw new Error(`${res.status}`)
      setStats(await res.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load'); setStats(null) }
    finally { setLoading(false) }
  }

  // Auto-load if clubId is in URL
  useEffect(() => {
    if (authed && clubs.length > 0 && clubId) {
      loadStats(clubId, season)
    }
  }, [authed, clubs.length]) // Only run once clubs are loaded and authed

  const handleLoadClick = () => {
    if (clubId) {
      const params = new URLSearchParams()
      params.set('club_id', clubId)
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
    loadStats(clubId, season)
  }


  const clubName = clubs.find(c => String(c.id) === clubId)?.name ?? ''

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        <div className="mb-6 pb-4 border-b border-dashed border-accent-emerald/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-11 h-11 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shrink-0"><CrestIcon className="w-5 h-5" /></div>
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>Club Deep-Dive</h1>
          </div>
          <p className="text-sm text-text-secondary">Season-by-season performance, domestic league only.</p>
        </div>

        <div className="card-terminal mb-5 p-5">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="label" htmlFor="c-club">Club</label>
              <select id="c-club" className="input" value={clubId} onChange={e => setClubId(e.target.value)}>
                <option value="">Select club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-season">Season</label>
              <select id="c-season" className="input" value={season} onChange={e => setSeason(e.target.value)}>
                <option value="">All seasons</option>
                {SEASONS.map(s => <option key={s} value={s}>{seasonLabel(s)}</option>)}
              </select>
            </div>
            <button onClick={handleLoadClick} className="btn-primary flex justify-center py-2.5" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Stats'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center text-sm mb-6"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-sm"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Crunching numbers...</div>
        ) : !stats ? (
          <div className="text-center py-20 text-text-secondary text-sm">Pick a club to see the breakdown.</div>
        ) : (
          <div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text-primary mb-2 tracking-[-0.02em] leading-none">{clubName}</h2>
            <p className="font-mono text-xs text-text-muted mb-6 tracking-wide uppercase">{season ? `${seasonLabel(Number(season))} SEASON` : 'ALL SEASONS (2010-11 → 2025-26)'} · {stats.played} MATCHES</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Points" value={stats.points} tone="emerald" />
              <StatTile label="Won" value={stats.won} />
              <StatTile label="Drawn" value={stats.drawn} />
              <StatTile label="Lost" value={stats.lost} tone="coral" />
              <StatTile label="Goals For" value={stats.goals_for} tone="emerald" />
              <StatTile label="Goals Against" value={stats.goals_against} tone="coral" />
              <StatTile label="Goal Diff" value={stats.goal_difference >= 0 ? `+${stats.goal_difference}` : stats.goal_difference} tone="emerald" />
              <StatTile label="Shots" value={stats.shots} />
              <StatTile label="Fouls" value={stats.fouls} />
              <StatTile label="Yellow Cards" value={stats.yellow_cards} tone="warm" />
              <StatTile label="Red Cards" value={stats.red_cards} tone="coral" />
              <StatTile label="Played" value={stats.played} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>}>
      <ClubsContent />
    </Suspense>
  )
}

function StatTile({ label, value, tone = 'default' }: {
  label: string; value: number | string; tone?: 'default' | 'emerald' | 'coral' | 'warm'
}) {
  const toneClass =
    tone === 'emerald' ? 'text-accent-emerald'
    : tone === 'coral' ? 'text-accent-coral'
    : tone === 'warm'  ? 'text-accent-gold'
    : 'text-text-primary'
  return (
    <div className="card-terminal text-left px-6 py-6">
      <div className={`text-[2.6rem] font-serif font-semibold tabular-nums tracking-[-0.02em] leading-none ${toneClass}`}>{value}</div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted mt-3">{label}</div>
    </div>
  )
}

/** Club crest — heraldic shield: top banner, double edge, central crest shape (Clubs nav icon). */
function CrestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5.6" y="2.4" width="12.8" height="3" rx="1.3" fill="currentColor" />
      <path d="M5 6.4 H19 V11.6 C19 17 15.5 20.2 12 21.8 C8.5 20.2 5 17 5 11.6 Z" fill="currentColor" />
      <path d="M6.8 7.9 H17.2 V11.6 C17.2 16 14.5 18.7 12 20.1 C9.5 18.7 6.8 16 6.8 11.6 Z" fill="none" stroke="#0a0f1c" strokeWidth="0.85" />
      <path d="M12 9.7 C13.7 9.7 14.7 10.9 14.7 12.5 C14.7 14.4 13 15.9 12 17.1 C11 15.9 9.3 14.4 9.3 12.5 C9.3 10.9 10.3 9.7 12 9.7 Z" fill="#0a0f1c" />
    </svg>
  )
}
