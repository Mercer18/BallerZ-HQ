'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Globe, Loader2, Sparkles, MapPin, AlertCircle } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

// ── types ───────────────────────────────────────────────────────────
interface Confed { code: string; name: string; teams: number }
interface Team {
  id: number; name: string; confederation: string; flag_emoji: string
  elo_rating: number; wc_group: string | null
}
interface MatchIQ {
  home_win: number; draw: number; away_win: number; likely_score: string
  home_xg: number; away_xg: number; confidence: number
}
interface Fixture {
  id: number; date: string; group: string; venue_city: string; host_country: string
  neutral: boolean; status: string; home_score: number | null; away_score: number | null
  home: { id: number; name: string; flag: string; confederation: string }
  away: { id: number; name: string; flag: string; confederation: string }
  match_iq: MatchIQ
}
interface GroupRow {
  team_id: number; name: string; flag: string; group: string; elo: number
  played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number
}
interface GroupBlock { group: string; standings: GroupRow[] }

// emerald #34D399 · gold #E6B84E · coral #F2786B (design tokens)
const CONFED_COLORS: Record<string, string> = {
  UEFA: '#34D399', CONMEBOL: '#E6B84E', CONCACAF: '#60a5fa',
  CAF: '#F2786B', AFC: '#c084fc', OFC: '#2dd4bf',
}

const COUNTRY_CODES: Record<string, string> = {
  'mexico': 'mx',
  'south africa': 'za',
  'south korea': 'kr',
  'czech republic': 'cz',
  'canada': 'ca',
  'bosnia and herzegovina': 'ba',
  'qatar': 'qa',
  'switzerland': 'ch',
  'brazil': 'br',
  'morocco': 'ma',
  'haiti': 'ht',
  'scotland': 'gb-sct',
  'united states': 'us',
  'paraguay': 'py',
  'australia': 'au',
  'turkey': 'tr',
  'germany': 'de',
  'curaçao': 'cw',
  'curacao': 'cw',
  'ivory coast': 'ci',
  'ecuador': 'ec',
  'netherlands': 'nl',
  'japan': 'jp',
  'sweden': 'se',
  'tunisia': 'tn',
  'belgium': 'be',
  'egypt': 'eg',
  'iran': 'ir',
  'new zealand': 'nz',
  'spain': 'es',
  'cape verde': 'cv',
  'saudi arabia': 'sa',
  'uruguay': 'uy',
  'france': 'fr',
  'senegal': 'sn',
  'iraq': 'iq',
  'norway': 'no',
  'argentina': 'ar',
  'algeria': 'dz',
  'austria': 'at',
  'jordan': 'jo',
  'portugal': 'pt',
  'dr congo': 'cd',
  'uzbekistan': 'uz',
  'colombia': 'co',
  'england': 'gb-eng',
  'croatia': 'hr',
  'ghana': 'gh',
  'panama': 'pa'
}

function renderFlag(countryName: string, className = "h-4 object-contain rounded-sm") {
  const code = COUNTRY_CODES[countryName.toLowerCase()]
  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        alt={countryName}
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      />
    )
  }
  return <span className="text-xs">🌐</span>
}


// ── confederation filter (the international "league filter") ─────────
function ConfedFilter({ confeds, active, onChange }: {
  confeds: Confed[]; active: string; onChange: (c: string) => void
}) {
  const all = [{ code: '', name: 'All', teams: 48 }, ...confeds]
  return (
    <div className="flex flex-wrap gap-2">
      {all.map(c => {
        const on = active === c.code
        const color = c.code ? CONFED_COLORS[c.code] : '#34D399'
        return (
          <button key={c.code || 'all'} onClick={() => onChange(c.code)}
            className="px-3.5 py-2 rounded-full text-[13px] font-medium transition-all border"
            style={{
              background: on ? `color-mix(in srgb, ${color} 16%, transparent)` : 'rgba(255,255,255,0.03)',
              borderColor: on ? color : 'rgba(255,255,255,0.08)',
              color: on ? color : '#A9ADB6',
            }}>
            {c.code || 'All'} <span className="opacity-60 tabular-nums">{c.teams}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Match IQ probability bar ─────────────────────────────────────────
function IQBar({ iq, compact }: { iq: MatchIQ; compact?: boolean }) {
  return (
    <div className={compact ? '' : 'space-y-1.5'}>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
        <div style={{ width: `${iq.home_win}%`, background: '#34D399' }} />
        <div style={{ width: `${iq.draw}%`, background: '#E6B84E' }} />
        <div style={{ width: `${iq.away_win}%`, background: '#F2786B' }} />
      </div>
      {!compact && (
        <div className="flex justify-between font-mono text-[11px] tabular-nums">
          <span className="text-accent-emerald">{iq.home_win}%</span>
          <span className="text-accent-gold">DRAW {iq.draw}%</span>
          <span className="text-accent-coral">{iq.away_win}%</span>
        </div>
      )}
    </div>
  )
}

// ── interactive Match IQ predictor ──────────────────────────────────
function Predictor({ teams }: { teams: Team[] }) {
  const sorted = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams])
  const [homeId, setHomeId] = useState<number | null>(null)
  const [awayId, setAwayId] = useState<number | null>(null)
  const [iq, setIq] = useState<MatchIQ | null>(null)
  const [loading, setLoading] = useState(false)

  // sensible default marquee matchup once teams load
  useEffect(() => {
    if (!teams.length || homeId) return
    const find = (n: string) => teams.find(t => t.name === n)?.id ?? null
    setHomeId(find('Spain') ?? teams[0].id)
    setAwayId(find('Argentina') ?? teams[1]?.id ?? teams[0].id)
  }, [teams])

  useEffect(() => {
    if (!homeId || !awayId || homeId === awayId) { setIq(null); return }
    let cancel = false
    setLoading(true)
    fetch(`${BACKEND}/api/intl/predict?home_id=${homeId}&away_id=${awayId}&neutral=true`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancel && d) setIq(d.match_iq) })
      .finally(() => { if (!cancel) setLoading(false) })
    return () => { cancel = true }
  }, [homeId, awayId])

  const home = teams.find(t => t.id === homeId)
  const away = teams.find(t => t.id === awayId)

  return (
    <div className="card-terminal p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent-gold" />
        <span className="terminal-label text-accent-gold">Match IQ Predictor</span>
        <div className="flex-1 border-t border-dashed border-accent-gold/15" />
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-wide">Elo · Poisson model</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <select className="input" value={homeId ?? ''} onChange={e => setHomeId(Number(e.target.value))}>
          {sorted.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span className="font-serif italic text-text-muted text-lg px-1">vs</span>
        <select className="input" value={awayId ?? ''} onChange={e => setAwayId(Number(e.target.value))}>
          {sorted.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {homeId === awayId ? (
        <p className="text-center text-text-muted text-sm py-6">Pick two different nations.</p>
      ) : loading || !iq ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent-gold" /></div>
      ) : (
        <div>
          <div className="flex items-end justify-between mb-3">
            <div className="text-center flex-1">
              <div className="flex justify-center mb-2 h-7">{home && renderFlag(home.name, "h-7 object-contain")}</div>
              <div className="font-semibold text-text-primary text-sm">{home?.name}</div>
              <div className="font-mono text-[11px] text-text-muted">Elo {Math.round(home?.elo_rating ?? 0)}</div>
            </div>
            <div className="text-center px-3">
              <div className="font-serif text-3xl font-semibold text-text-primary leading-none">{iq.likely_score}</div>
              <div className="font-mono text-[10px] text-text-muted uppercase mt-1">likely</div>
            </div>
            <div className="text-center flex-1">
              <div className="flex justify-center mb-2 h-7">{away && renderFlag(away.name, "h-7 object-contain")}</div>
              <div className="font-semibold text-text-primary text-sm">{away?.name}</div>
              <div className="font-mono text-[11px] text-text-muted">Elo {Math.round(away?.elo_rating ?? 0)}</div>
            </div>
          </div>
          <IQBar iq={iq} />
          <div className="flex justify-center gap-6 mt-4 font-mono text-[11px] text-text-muted">
            <span>xG {iq.home_xg} – {iq.away_xg}</span>
            <span>confidence <span className="text-accent-emerald">{iq.confidence}%</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── groups grid ──────────────────────────────────────────────────────
function Groups({ groups, activeConfed }: { groups: GroupBlock[]; activeConfed: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {groups.map(g => (
        <div key={g.group} className="card-terminal !p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-dashed border-accent-emerald/15 bg-accent-emerald/[0.03] flex items-center justify-between">
            <span className="font-serif text-lg font-semibold text-text-primary">Group {g.group}</span>
            <span className="terminal-label text-text-muted">Elo</span>
          </div>
          <div>
            {g.standings.map((r, i) => {
              const dim = activeConfed !== '' && teamConfedOf(r) !== activeConfed
              return (
                <div key={r.team_id}
                  className="flex items-center gap-2.5 px-4 py-2 border-b border-dashed border-white/[0.04] last:border-0"
                  style={{ opacity: dim ? 0.28 : 1 }}>
                  <span className="font-mono text-[11px] text-text-muted w-3">{i + 1}</span>
                  <span className="shrink-0 flex items-center">{renderFlag(r.name, "h-4 w-6 object-contain rounded-sm")}</span>
                  <span className="text-sm text-text-primary font-medium flex-1 truncate">{r.name}</span>
                  <span className="font-mono text-[11px] text-text-secondary tabular-nums">{Math.round(r.elo)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
// confederation lookup helper (group rows don't carry confed; resolved via map injected below)
let CONFED_OF: Record<number, string> = {}
function teamConfedOf(r: GroupRow) { return CONFED_OF[r.team_id] ?? '' }

// ── fixtures list ────────────────────────────────────────────────────
function Fixtures({ fixtures }: { fixtures: Fixture[] }) {
  if (!fixtures.length) return <div className="text-center py-16 text-text-muted text-sm">No fixtures for this filter.</div>
  // group by date
  const byDate = fixtures.reduce<Record<string, Fixture[]>>((acc, f) => {
    (acc[f.date] ||= []).push(f); return acc
  }, {})
  return (
    <div className="space-y-5">
      {Object.entries(byDate).map(([date, fs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <span className="terminal-label text-accent-emerald">{new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
          </div>
          <div className="space-y-2">
            {fs.map(f => (
              <div key={f.id} className="card-terminal p-3.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-text-muted w-6 shrink-0">{f.group}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="text-sm text-text-primary font-medium truncate text-right">{f.home.name}</span>
                    <span className="shrink-0 flex items-center">{renderFlag(f.home.name, "h-4 w-6 shrink-0 object-contain rounded-sm")}</span>
                  </div>
                  <div className="shrink-0 w-20 text-center">
                    {f.status === 'finished'
                      ? <span className="font-serif text-xl font-semibold text-text-primary">{f.home_score}–{f.away_score}</span>
                      : <span className="font-serif text-base text-accent-gold">{f.match_iq.likely_score}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="shrink-0 flex items-center">{renderFlag(f.away.name, "h-4 w-6 shrink-0 object-contain rounded-sm")}</span>
                    <span className="text-sm text-text-primary font-medium truncate">{f.away.name}</span>
                  </div>
                </div>
                <div className="mt-2.5 px-9">
                  <IQBar iq={f.match_iq} />
                  <div className="flex items-center justify-center gap-1.5 mt-1.5 font-mono text-[10px] text-text-muted">
                    <MapPin className="w-2.5 h-2.5" /> {f.venue_city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────
function WorldCupContent() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [confeds, setConfeds] = useState<Confed[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [groups, setGroups] = useState<GroupBlock[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [confed, setConfed] = useState('')
  const [tab, setTab] = useState<'groups' | 'fixtures'>('groups')
  const [groupFilter, setGroupFilter] = useState('')
  const [loading, setLoading] = useState(true)
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
    setLoading(true); setError('')
    Promise.all([
      fetch(`${BACKEND}/api/intl/confederations`).then(r => r.json()),
      fetch(`${BACKEND}/api/intl/teams`).then(r => r.json()),
      fetch(`${BACKEND}/api/intl/groups`).then(r => r.json()),
      fetch(`${BACKEND}/api/intl/fixtures`).then(r => r.json()),
    ]).then(([c, t, g, f]: [Confed[], Team[], GroupBlock[], Fixture[]]) => {
      setConfeds(c); setTeams(t); setGroups(g); setFixtures(f)
      CONFED_OF = Object.fromEntries(t.map(x => [x.id, x.confederation]))
    }).catch(() => setError('Could not load World Cup data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [authed])

  const topTeam = useMemo(() => [...teams].sort((a, b) => b.elo_rating - a.elo_rating)[0], [teams])

  const shownFixtures = useMemo(() => fixtures.filter(f =>
    (!groupFilter || f.group === groupFilter) &&
    (!confed || f.home.confederation === confed || f.away.confederation === confed)
  ), [fixtures, groupFilter, confed])

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container">
        {/* header */}
        <div className="mb-6 pb-4 border-b border-dashed border-accent-emerald/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-11 h-11 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald shrink-0"><Globe className="w-5 h-5" /></div>
            <h1 className="font-serif font-semibold text-text-primary tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>World Cup 2026</h1>
          </div>
          <p className="text-sm text-text-secondary">48 nations · 12 groups · Canada, Mexico &amp; USA. Predictions powered by <span className="text-accent-gold font-medium">Match IQ</span> — an Elo + Poisson model trained on 150 years of international results.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center text-sm mb-6"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}</div>}

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-accent-emerald" /></div>
        ) : (
          <>
            {/* stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <Stat label="Nations" value="48" />
              <Stat label="Groups" value="12" />
              <Stat label="Group matches" value="72" />
              <Stat
                label="Match IQ favourite"
                value={topTeam ? (
                  <>
                    {renderFlag(topTeam.name, "h-4 object-contain rounded-sm")}
                    <span>{topTeam.name}</span>
                  </>
                ) : '—'}
                tone="gold"
              />
            </div>

            {/* confederation filter */}
            <div className="card-terminal p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="terminal-label text-text-secondary">Confederation</span>
                <div className="flex-1 border-t border-dashed border-accent-emerald/10" />
              </div>
              <ConfedFilter confeds={confeds} active={confed} onChange={setConfed} />
            </div>

            {/* interactive predictor */}
            <div className="mb-6">
              <Predictor teams={confed ? teams.filter(t => t.confederation === confed) : teams} />
            </div>

            {/* tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06]">
              {(['groups', 'fixtures'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${tab === t ? 'text-accent-emerald' : 'text-text-muted hover:text-text-secondary'}`}>
                  {t === 'groups' ? 'Groups' : 'Fixtures & Match IQ'}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-emerald" />}
                </button>
              ))}
            </div>

            {tab === 'groups' ? (
              <Groups groups={groups} activeConfed={confed} />
            ) : (
              <>
                <div className="mb-4 max-w-[200px]">
                  <label className="label" htmlFor="grp">Filter by group</label>
                  <select id="grp" className="input" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                    <option value="">All groups</option>
                    {groups.map(g => <option key={g.group} value={g.group}>Group {g.group}</option>)}
                  </select>
                </div>
                <Fixtures fixtures={shownFixtures} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'gold' }) {
  return (
    <div className="card-terminal p-3.5">
      <div className="terminal-label text-text-muted mb-1">{label}</div>
      <div className={`font-serif text-xl font-semibold ${tone === 'gold' ? 'text-accent-gold' : 'text-text-primary'} truncate flex items-center gap-2`}>{value}</div>
    </div>
  )
}

export default function WorldCupPage() {
  return (
    <Suspense fallback={<div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>}>
      <WorldCupContent />
    </Suspense>
  )
}
