'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Ranking } from '@phosphor-icons/react'
import { SkeletonTable } from '@/components/ui/Skeleton'

interface Row {
  id: number; position: number; points: number; played: number
  won: number; drawn: number; lost: number
  club: { id: number; name: string } | null
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL
function seasonLabel(s: number) { return `${s}-${String(s + 1).slice(-2)}` }

function StandingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState(false)
  const [pairs, setPairs] = useState<{ league: string; season: number }[]>([])
  const [league, setLeague] = useState(searchParams.get('league') ?? '')
  const [season, setSeason] = useState(searchParams.get('season') ?? '')
  const [rows, setRows] = useState<Row[]>([])
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
    fetch(`${BACKEND}/api/matches/standings/seasons`).then(r => r.ok ? r.json() : []).then((d: { league: string; season: number }[]) => {
      setPairs(d)
      // Only set defaults if no URL params were provided
      if (d.length && !league && !season) {
        const latest = Math.max(...d.map(x => x.season))
        const leaguesForLatest = d.filter(x => x.season === latest).map(x => x.league).sort()
        setSeason(String(latest)); setLeague(leaguesForLatest[0] ?? '')
      }
    }).catch(() => {})
  }, [authed])

  const leagues = useMemo(() => Array.from(new Set(pairs.map(p => p.league))).sort(), [pairs])
  const seasons = useMemo(() => Array.from(new Set(pairs.map(p => p.season))).sort((a, b) => b - a), [pairs])

  // Sync filters → URL
  useEffect(() => {
    if (!league && !season) return
    const params = new URLSearchParams()
    if (league) params.set('league', league)
    if (season) params.set('season', season)
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', url)
  }, [league, season])

  useEffect(() => {
    if (!authed || !league || !season) return
    let cancelled = false
    setLoading(true); setError('')
    fetch(`${BACKEND}/api/matches/standings?league=${encodeURIComponent(league)}&season=${season}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((d: Row[]) => { if (!cancelled) setRows(d) })
      .catch(e => { if (!cancelled) { setError(e.message); setRows([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authed, league, season])

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        <div className="mb-6 pb-4 border-b border-dashed border-accent-emerald/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-11 h-11 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shrink-0"><Ranking className="w-5 h-5" /></div>
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>League Standings</h1>
          </div>
          <p className="text-sm text-text-secondary">Full tables computed from real results, every season 2010-11 to 2025-26.</p>
        </div>

        <div className="card-terminal mb-5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="terminal-label text-text-secondary">Filters</span>
            <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
            <div>
              <label className="label" htmlFor="s-league">League</label>
              <select id="s-league" className="input" value={league} onChange={e => setLeague(e.target.value)}>
                <option value="">Select league…</option>
                {leagues.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-season">Season</label>
              <select id="s-season" className="input" value={season} onChange={e => setSeason(e.target.value)}>
                <option value="">Select season…</option>
                {seasons.map(s => <option key={s} value={s}>{seasonLabel(s)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center text-sm mb-6"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}</div>}

        {loading ? (
          <SkeletonTable rows={10} />
        ) : rows.length === 0 ? (
          <div className="text-center py-20 text-text-secondary text-sm">No standings for this selection.</div>
        ) : (
          <div className="card-terminal !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dashed border-accent-emerald/20 text-left bg-accent-emerald/[0.02]">
                  <th className="px-4 py-3 w-12"><span className="terminal-label">#</span></th>
                  <th className="px-4 py-3"><span className="terminal-label">CLUB</span></th>
                  <th className="px-3 py-3 text-center w-10"><span className="terminal-label">P</span></th>
                  <th className="px-3 py-3 text-center w-10"><span className="terminal-label">W</span></th>
                  <th className="px-3 py-3 text-center w-10"><span className="terminal-label">D</span></th>
                  <th className="px-3 py-3 text-center w-10"><span className="terminal-label">L</span></th>
                  <th className="px-3 py-3 text-center w-14"><span className="terminal-label text-accent-emerald">PTS</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  // Zone color: top 3 → emerald, 4-6 → gold (Europa), rest → muted
                  const rankColor = r.position <= 3 ? 'text-accent-emerald' : r.position <= 6 ? 'text-accent-gold' : 'text-text-muted'
                  return (
                  <tr key={r.id} className="border-b border-dashed border-accent-emerald/8 last:border-0 hover:bg-accent-emerald/[0.02] transition-colors">
                    <td className={`px-4 py-4 font-serif text-2xl font-semibold tabular-nums ${rankColor}`}>{r.position}</td>
                    <td className="px-4 py-4 text-text-primary font-semibold text-base">{r.club?.name ?? 'Unknown'}</td>
                    <td className="px-3 py-4 text-center font-mono text-sm text-text-secondary tabular-nums">{r.played}</td>
                    <td className="px-3 py-4 text-center font-mono text-sm text-text-secondary tabular-nums">{r.won}</td>
                    <td className="px-3 py-4 text-center font-mono text-sm text-text-secondary tabular-nums">{r.drawn}</td>
                    <td className="px-3 py-4 text-center font-mono text-sm text-text-secondary tabular-nums">{r.lost}</td>
                    <td className="px-3 py-4 text-center font-serif text-2xl font-semibold text-accent-emerald tabular-nums">{r.points}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>}>
      <StandingsContent />
    </Suspense>
  )
}
