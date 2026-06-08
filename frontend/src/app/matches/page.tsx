'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SkeletonRows } from '@/components/ui/Skeleton'

interface Club { id: number; name: string; logo: string | null; league: string | null }
interface Match {
  id: number; match_date: string | null; league_name: string | null; season: number | null
  status: string; home_club_id: number; away_club_id: number
  home_score: number | null; away_score: number | null
  half_time_home_score: number | null; half_time_away_score: number | null
  home_shots: number | null; away_shots: number | null
  home_shots_on_target: number | null; away_shots_on_target: number | null
  home_fouls: number | null; away_fouls: number | null
  home_corners: number | null; away_corners: number | null
  home_yellow_cards: number | null; away_yellow_cards: number | null
  home_red_cards: number | null; away_red_cards: number | null
  referee: string | null
  home_club: { id: number; name: string } | null
  away_club: { id: number; name: string } | null
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

function seasonLabel(s: number | null) {
  return s == null ? '—' : `${s}-${String(s + 1).slice(-2)}`
}

function MatchesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState(false)
  const [seasonsRaw, setSeasonsRaw] = useState<{ league: string; season: number }[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [league, setLeague] = useState(searchParams.get('league') ?? '')
  const [season, setSeason] = useState(searchParams.get('season') ?? '')
  const [clubId, setClubId] = useState(searchParams.get('club_id') ?? '')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const PAGE_SIZE = 100

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
    fetch(`${BACKEND}/api/matches/standings/seasons`).then(r => r.ok ? r.json() : []).then(setSeasonsRaw).catch(() => {})
  }, [authed])

  useEffect(() => {
    if (!authed) return
    const q = league ? `?league=${encodeURIComponent(league)}` : ''
    fetch(`${BACKEND}/api/matches/clubs${q}`).then(r => r.ok ? r.json() : []).then(setClubs).catch(() => setClubs([]))
    setClubId('')
  }, [authed, league])

  const leagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1']
  const seasons = useMemo(() => Array.from(new Set(seasonsRaw.map(s => s.season))).sort((a, b) => b - a), [seasonsRaw])

  const fetchPage = async (offset: number) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (league) params.set('league', league)
    if (season) params.set('season', season)
    if (clubId) params.set('club_id', clubId)
    const res = await fetch(`${BACKEND}/api/matches/?${params.toString()}`)
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return await res.json() as Match[]
  }

  const loadMatches = async () => {
    setLoading(true); setError(''); setHasMore(true)
    // Sync filters → URL
    const urlParams = new URLSearchParams()
    if (league) urlParams.set('league', league)
    if (season) urlParams.set('season', season)
    if (clubId) urlParams.set('club_id', clubId)
    const qs = urlParams.toString()
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
    try {
      const page = await fetchPage(0)
      setMatches(page)
      setHasMore(page.length === PAGE_SIZE)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load matches'); setMatches([]); setHasMore(false) }
    finally { setLoading(false) }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true); setError('')
    try {
      const page = await fetchPage(matches.length)
      setMatches(prev => [...prev, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load more') }
    finally { setLoadingMore(false) }
  }

  useEffect(() => { if (authed) loadMatches() }, [authed])

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        <PageHeader icon={<span aria-hidden className="inline-block w-5 h-5 bg-current" style={{ WebkitMaskImage: 'url(/football-icon.png)', maskImage: 'url(/football-icon.png)', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />} title="Match Browser" subtitle="Every domestic-league result across Europe's top five leagues, 2010-11 to 2025-26." />

        <div className="card-terminal mb-5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-accent-emerald/60" />
            <span className="terminal-label text-text-secondary">Filters</span>
            <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label" htmlFor="f-league">League</label>
              <select id="f-league" className="input" value={league} onChange={e => setLeague(e.target.value)}>
                <option value="">All leagues</option>
                {leagues.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-season">Season</label>
              <select id="f-season" className="input" value={season} onChange={e => setSeason(e.target.value)}>
                <option value="">All seasons</option>
                {seasons.map(s => <option key={s} value={s}>{seasonLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-club">Club</label>
              <select id="f-club" className="input" value={clubId} onChange={e => setClubId(e.target.value)}>
                <option value="">All clubs</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={loadMatches} className="btn-primary w-full flex justify-center py-2.5" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <SkeletonRows count={8} />
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-text-secondary text-sm">No matches for these filters.</div>
        ) : (
          <div className="space-y-2">
            {matches.map(m => {
              const isOpen = expanded === m.id
              const hs = m.home_score, as = m.away_score
              const homeWon = hs != null && as != null && hs > as
              const awayWon = hs != null && as != null && as > hs
              const boxBase = 'w-9 h-9 grid place-items-center rounded-lg font-serif text-lg font-semibold tabular-nums border shrink-0'
              const winBox = 'bg-accent-emerald/[0.12] border-accent-emerald/25 text-accent-emerald'
              const loseBox = 'bg-accent-coral/[0.12] border-accent-coral/25 text-accent-coral'
              const drawBox = 'bg-white/[0.04] border-white/[0.08] text-text-secondary'
              return (
                <div key={m.id} className="card-terminal !p-0 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-accent-emerald/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="font-mono text-[10px] text-text-muted w-24 shrink-0 tracking-wide">{m.match_date ? formatDate(m.match_date) : '—'}</div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-text-primary text-sm font-semibold truncate text-right w-36">{m.home_club?.name ?? 'Unknown'}</span>
                        <span className={`${boxBase} ${homeWon ? winBox : awayWon ? loseBox : drawBox}`}>{hs ?? '-'}</span>
                        <span className="text-xs" style={{ color: 'var(--faint)' }}>:</span>
                        <span className={`${boxBase} ${awayWon ? winBox : homeWon ? loseBox : drawBox}`}>{as ?? '-'}</span>
                        <span className="text-text-primary text-sm font-semibold truncate w-36">{m.away_club?.name ?? 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="hidden md:block font-mono text-[10px] text-text-muted shrink-0 ml-4 tracking-wide uppercase">
                      {m.league_name} · {seasonLabel(m.season)}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 border-t border-dashed border-accent-emerald/15 bg-accent-emerald/[0.01]">
                      {/* Mirror the header's column structure so stats line up under the team names */}
                      <div className="flex items-start gap-4">
                        <div className="w-24 shrink-0" aria-hidden="true" />
                        <div className="flex flex-col gap-y-1.5 pt-1">
                          <StatRow label="Half-time" h={m.half_time_home_score} a={m.half_time_away_score} />
                          <StatRow label="Shots" h={m.home_shots} a={m.away_shots} />
                          <StatRow label="On target" h={m.home_shots_on_target} a={m.away_shots_on_target} />
                          <StatRow label="Corners" h={m.home_corners} a={m.away_corners} />
                          <StatRow label="Fouls" h={m.home_fouls} a={m.away_fouls} />
                          <StatRow label="Yellow" h={m.home_yellow_cards} a={m.away_yellow_cards} />
                          <StatRow label="Red" h={m.home_red_cards} a={m.away_red_cards} />
                          {m.referee && (
                            <p className="font-mono text-[10px] text-text-muted mt-2 tracking-wide pl-1">
                              REFEREE: <span className="text-text-secondary">{m.referee}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Load more / end-of-list */}
            <div className="flex justify-center pt-4 pb-2">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="font-mono text-xs uppercase tracking-[0.15em] font-bold px-6 py-2.5 rounded-lg
                             bg-accent-emerald/[0.08] border border-dashed border-accent-emerald/30 text-accent-emerald
                             hover:bg-accent-emerald/[0.16] hover:border-accent-emerald/50
                             transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingMore ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>) : `Load older matches (${matches.length} so far)`}
                </button>
              ) : (
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.18em]">
                  ── End of archive · {matches.length} matches ──
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>}>
      <MatchesContent />
    </Suspense>
  )
}

function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-dashed border-accent-emerald/20">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-11 h-11 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shrink-0">{icon}</div>
        <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>{title}</h1>
      </div>
      <p className="text-sm text-text-secondary">{subtitle}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center text-sm mb-6">
      <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {message}
    </div>
  )
}

function StatRow({ label, h, a }: { label: string; h: number | null; a: number | null }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-primary font-bold tabular-nums text-right w-36 shrink-0">{h ?? '—'}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-secondary font-bold text-center w-24 shrink-0 px-3 py-1 rounded-md bg-white/[0.02] border border-dashed border-accent-emerald/10">
        {label}
      </span>
      <span className="text-text-primary font-bold tabular-nums text-left w-36 shrink-0">{a ?? '—'}</span>
    </div>
  )
}
