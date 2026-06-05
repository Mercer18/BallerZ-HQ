'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, Crown, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { apiFetch } from '@/lib/api'

interface Player {
  player_name: string
  position: string | null
  team_name: string
  league: string
  season: number
  matches_played: number
  starts: number
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

function seasonLabel(s: number) { return `${s}-${String(s + 1).slice(-2)}` }

type SortStat = 'goals' | 'assists' | 'matches_played' | 'minutes' | 'yellow_cards'

function PlayersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState(false)
  const [pairs, setPairs] = useState<{ league: string; season: number }[]>([])
  const [league, setLeague] = useState(searchParams.get('league') ?? '')
  const [season, setSeason] = useState(searchParams.get('season') ?? '')
  const [stat, setStat] = useState<SortStat>((searchParams.get('stat') as SortStat) || 'goals')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

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
    let cancelled = false
    apiFetch('/api/players/seasons')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((d: { league: string; season: number }[]) => {
        if (cancelled) return
        setPairs(d)
        if (!d.length) { setLoading(false); return } // genuinely no data → let empty state show
        if (!league || !season) {
          const latest = Math.max(...d.map(x => x.season))
          const leaguesForLatest = d.filter(x => x.season === latest).map(x => x.league).sort()
          setSeason(prev => prev || String(latest))
          setLeague(prev => prev || leaguesForLatest[0] || '')
        }
      })
      .catch(() => { if (!cancelled) { setError('Could not load player seasons.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [authed, reloadKey])

  const leagues = useMemo(() => Array.from(new Set(pairs.map(p => p.league))).sort(), [pairs])
  const seasons = useMemo(() => Array.from(new Set(pairs.map(p => p.season))).sort((a, b) => b - a), [pairs])

  // Sync filters → URL
  useEffect(() => {
    if (!league && !season) return
    const params = new URLSearchParams()
    if (league) params.set('league', league)
    if (season) params.set('season', season)
    if (stat !== 'goals') params.set('stat', stat)
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', url)
  }, [league, season, stat])

  useEffect(() => {
    if (!authed || !league || !season) return
    let cancelled = false
    setLoading(true); setError('')
    apiFetch(`/api/players/top?league=${encodeURIComponent(league)}&season=${season}&stat=${stat}&limit=30`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((d: Player[]) => { if (!cancelled) setPlayers(d) })
      .catch(() => { if (!cancelled) { setError('Could not load player stats.'); setPlayers([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authed, league, season, stat, reloadKey])

  const retry = () => { setError(''); setLoading(true); setReloadKey(k => k + 1) }

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        <div className="mb-6 pb-4 border-b border-dashed border-accent-amber/20">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <div className="w-11 h-11 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber shrink-0"><Users className="w-5 h-5" /></div>
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92] flex items-center gap-3" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>
              Player Stats
              <span className="inline-flex items-center gap-1 bg-accent-amber/10 border border-accent-amber/30 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold text-accent-amber uppercase tracking-wider self-center">
                <Crown className="w-3 h-3" /> PRO
              </span>
            </h1>
          </div>
          <p className="text-sm text-text-secondary">Top performers across Europe&apos;s top 5 leagues, powered by FBref data (2017-18 to 2025-26).</p>
        </div>

        <div className="card-terminal mb-5 p-5">
          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
            <div>
              <label className="label" htmlFor="p-league">League</label>
              <select id="p-league" className="input" value={league} onChange={e => setLeague(e.target.value)}>
                <option value="">Select league…</option>
                {leagues.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-season">Season</label>
              <select id="p-season" className="input" value={season} onChange={e => setSeason(e.target.value)}>
                <option value="">Select season…</option>
                {seasons.map(s => <option key={s} value={s}>{seasonLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-stat">Sort By</label>
              <select id="p-stat" className="input" value={stat} onChange={e => setStat(e.target.value as SortStat)}>
                <option value="goals">Goals</option>
                <option value="assists">Assists</option>
                <option value="matches_played">Appearances</option>
                <option value="minutes">Minutes</option>
                <option value="yellow_cards">Yellow Cards</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-4 rounded-lg flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}</span>
            <button onClick={retry} className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 border border-red-500/30 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/25 transition-colors shrink-0"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
          </div>
        ) : loading ? (
          <SkeletonTable rows={12} />
        ) : players.length === 0 ? (
          <div className="text-center py-20 text-text-secondary text-sm">No player data for this selection.</div>
        ) : (
          <div className="card-terminal !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashed border-accent-emerald/20 text-left bg-accent-emerald/[0.02]">
                    <th className="px-4 py-3 w-10"><span className="terminal-label">#</span></th>
                    <th className="px-4 py-3"><span className="terminal-label">PLAYER</span></th>
                    <th className="px-3 py-3"><span className="terminal-label">CLUB</span></th>
                    <th className="px-3 py-3 text-center w-12"><span className="terminal-label">POS</span></th>
                    <th className="px-3 py-3 text-center w-12"><span className="terminal-label">APP</span></th>
                    <th className="px-3 py-3 text-center w-14"><span className="terminal-label">MIN</span></th>
                    <th className={`px-3 py-3 text-center w-12`}><span className={`terminal-label ${stat === 'goals' ? 'text-accent-emerald' : ''}`}>G</span></th>
                    <th className={`px-3 py-3 text-center w-12`}><span className={`terminal-label ${stat === 'assists' ? 'text-accent-emerald' : ''}`}>A</span></th>
                    <th className={`px-3 py-3 text-center w-12`}><span className={`terminal-label ${stat === 'yellow_cards' ? 'text-accent-emerald' : ''}`}>YC</span></th>
                    <th className="px-3 py-3 text-center w-12"><span className="terminal-label">RC</span></th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={`${p.player_name}-${p.team_name}-${i}`} className="border-b border-dashed border-accent-emerald/8 last:border-0 hover:bg-accent-emerald/[0.02] transition-colors">
                      <td className="px-4 py-3 font-serif text-base font-semibold text-text-muted tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 text-text-primary font-semibold whitespace-nowrap">{p.player_name}</td>
                      <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{p.team_name}</td>
                      <td className="px-3 py-3 text-center font-mono text-[10px] text-text-muted tracking-wide">{p.position ?? '-'}</td>
                      <td className="px-3 py-3 text-center font-mono text-xs text-text-secondary tabular-nums">{p.matches_played}</td>
                      <td className="px-3 py-3 text-center font-mono text-xs text-text-secondary tabular-nums">{p.minutes?.toLocaleString()}</td>
                      <td className={`px-3 py-3 text-center tabular-nums ${stat === 'goals' ? 'font-serif text-lg font-semibold text-accent-emerald' : 'font-mono text-xs text-text-secondary'}`}>{p.goals}</td>
                      <td className={`px-3 py-3 text-center font-mono text-xs tabular-nums ${stat === 'assists' ? 'text-accent-emerald font-bold' : 'text-text-secondary'}`}>{p.assists}</td>
                      <td className={`px-3 py-3 text-center font-mono text-xs tabular-nums ${stat === 'yellow_cards' ? 'text-accent-emerald font-bold' : 'text-text-muted'}`}>{p.yellow_cards}</td>
                      <td className="px-3 py-3 text-center font-mono text-xs text-text-muted tabular-nums">{p.red_cards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>}>
      <PlayersContent />
    </Suspense>
  )
}
