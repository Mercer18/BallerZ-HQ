'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Swords, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Club { id: number; name: string }
interface Match {
  id: number; match_date: string | null; league_name: string | null; season: number | null
  home_club_id: number; away_club_id: number
  home_score: number | null; away_score: number | null
  home_club: { id: number; name: string } | null
  away_club: { id: number; name: string } | null
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL
const LEAGUES = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1']

export default function HeadToHeadPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [league, setLeague] = useState('')
  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [compared, setCompared] = useState(false)

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

  // Fetch clubs filtered by the selected league; reset selections + results when league changes
  useEffect(() => {
    if (!authed) return
    if (!league) { setClubs([]); setAId(''); setBId(''); setMatches([]); setCompared(false); setError(''); return }
    const url = `${BACKEND}/api/matches/clubs?league=${encodeURIComponent(league)}`
    fetch(url).then(r => r.ok ? r.json() : []).then(setClubs).catch(() => setClubs([]))
    setAId(''); setBId(''); setMatches([]); setCompared(false); setError('')
  }, [authed, league])

  const compare = async () => {
    if (!aId || !bId || aId === bId) { setError(aId && aId === bId ? 'Pick two different clubs' : 'Pick both clubs'); return }
    setLoading(true); setError(''); setCompared(true)
    try {
      const res = await fetch(`${BACKEND}/api/matches/head-to-head?club_a_id=${aId}&club_b_id=${bId}&limit=100`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setMatches(data)
      if (!data || data.length === 0) {
        setError(`${nameOf(aId)} and ${nameOf(bId)} never met in ${league} — they didn't share a season in the top flight. Try two clubs that overlapped (e.g. Arsenal, Chelsea, Liverpool, Man City).`)
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load'); setMatches([]) }
    finally { setLoading(false) }
  }

  const summary = useMemo(() => {
    const a = Number(aId), b = Number(bId)
    let aw = 0, d = 0, bw = 0, agf = 0, bgf = 0
    for (const m of matches) {
      if (m.home_score == null || m.away_score == null) continue
      const aHome = m.home_club_id === a
      const aScore = aHome ? m.home_score : m.away_score
      const bScore = aHome ? m.away_score : m.home_score
      agf += aScore; bgf += bScore
      if (aScore > bScore) aw++; else if (aScore < bScore) bw++; else d++
    }
    return { played: matches.length, aw, d, bw, agf, bgf }
  }, [matches, aId, bId])

  const nameOf = (id: string) => clubs.find(c => String(c.id) === id)?.name ?? ''

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        <div className="mb-6 pb-4 border-b border-dashed border-accent-emerald/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-11 h-11 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shrink-0"><Swords className="w-5 h-5" /></div>
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>Head-to-Head</h1>
          </div>
          <p className="text-sm text-text-secondary">Top-flight meetings only — Europe&apos;s big-5 leagues (no cups or lower divisions), 2010-11 to 2025-26.</p>
        </div>

        <div className="card-terminal mb-5 p-5">
          <div className="space-y-3">
            {/* League first — filters the club lists so both teams are always from the same league */}
            <div>
              <label className="label" htmlFor="h-league">League</label>
              <select id="h-league" className="input" value={league} onChange={e => setLeague(e.target.value)}>
                <option value="">Select a league…</option>
                {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="label" htmlFor="h-a">Club A</label>
                <select id="h-a" className="input disabled:opacity-50" value={aId} disabled={!league} onChange={e => setAId(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') compare() }}>
                  <option value="">{league ? 'Select club…' : 'Pick a league first'}</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="h-b">Club B</label>
                <select id="h-b" className="input disabled:opacity-50" value={bId} disabled={!league} onChange={e => setBId(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') compare() }}>
                  <option value="">{league ? 'Select club…' : 'Pick a league first'}</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={compare} className="btn-primary flex justify-center py-2.5 disabled:opacity-50" disabled={loading || !league}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Compare'}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center text-sm mb-6"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}</div>}

        {!loading && matches.length > 0 && (
          <div className="card-terminal mb-5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="terminal-label text-accent-emerald/70">Rivalry Summary</span>
              <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
            </div>
            <div className="grid grid-cols-3 text-center gap-4">
              <div>
                <div className="text-6xl font-serif font-semibold text-accent-emerald tabular-nums tracking-[-0.03em] leading-none">{summary.aw}</div>
                <div className="terminal-label mt-2.5 truncate">{nameOf(aId)} WINS</div>
              </div>
              <div>
                <div className="text-5xl font-serif font-semibold text-warm tabular-nums tracking-[-0.02em] leading-none" style={{ color: 'var(--warm)' }}>{summary.d}</div>
                <div className="terminal-label mt-2.5">DRAWS</div>
              </div>
              <div>
                <div className="text-6xl font-serif font-semibold text-accent-coral tabular-nums tracking-[-0.03em] leading-none">{summary.bw}</div>
                <div className="terminal-label mt-2.5 truncate">{nameOf(bId)} WINS</div>
              </div>
            </div>
            {/* Rivalry bar — proportional win / draw / loss segments (spec .rv-bar) */}
            <div className="flex gap-0.5 h-1.5 rounded-md overflow-hidden mt-7 mb-5" style={{ background: 'var(--s3)' }}>
              <div className="rounded-md" style={{ flexGrow: summary.aw || 0, background: 'var(--accent)' }} />
              <div style={{ flexGrow: summary.d || 0, background: 'rgba(224,185,120,.45)' }} />
              <div className="rounded-md" style={{ flexGrow: summary.bw || 0, background: 'var(--neg)' }} />
            </div>
            <div className="text-center font-mono text-xs text-text-muted tracking-wide">
              {summary.played} MEETINGS · GOALS {summary.agf}–{summary.bgf}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-sm"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-text-secondary text-sm">
            {compared
              ? <><span className="text-text-primary font-semibold">{nameOf(aId) || 'Club A'}</span> and <span className="text-text-primary font-semibold">{nameOf(bId) || 'Club B'}</span> never met in the {league} within 2010-25 — they didn&apos;t share a top-flight season (lower-division &amp; cup games aren&apos;t in this dataset). Pick two clubs that overlapped in the league.</>
              : league ? 'Pick two clubs and hit Compare.' : 'Pick a league, then choose two clubs to compare.'}
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map(m => {
              const hs = m.home_score, as = m.away_score
              const homeWon = hs != null && as != null && hs > as
              const awayWon = hs != null && as != null && as > hs
              const boxBase = 'w-9 h-9 grid place-items-center rounded-lg font-serif text-lg font-semibold tabular-nums border shrink-0'
              const winBox = 'bg-accent-emerald/[0.12] border-accent-emerald/25 text-accent-emerald'
              const loseBox = 'bg-accent-coral/[0.12] border-accent-coral/25 text-accent-coral'
              const drawBox = 'bg-white/[0.04] border-white/[0.08] text-text-secondary'
              return (
                <div key={m.id} className="card-terminal flex items-center justify-between px-5 py-3.5">
                  <div className="font-mono text-[10px] text-text-muted w-24 shrink-0 tracking-wide">{m.match_date ? formatDate(m.match_date) : '—'}</div>
                  <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
                    <span className="text-text-primary text-sm font-semibold truncate text-right flex-1">{m.home_club?.name ?? 'Unknown'}</span>
                    <span className={`${boxBase} ${homeWon ? winBox : awayWon ? loseBox : drawBox}`}>{hs ?? '-'}</span>
                    <span className="text-xs" style={{ color: 'var(--faint)' }}>:</span>
                    <span className={`${boxBase} ${awayWon ? winBox : homeWon ? loseBox : drawBox}`}>{as ?? '-'}</span>
                    <span className="text-text-primary text-sm font-semibold truncate flex-1">{m.away_club?.name ?? 'Unknown'}</span>
                  </div>
                  <div className="hidden md:block font-mono text-[10px] text-text-muted w-28 text-right shrink-0 tracking-wide uppercase">{m.league_name}</div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
