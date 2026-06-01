'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  BarChart3,
  ListOrdered,
  Swords,
  MessageSquare,
  Users,
  LayoutDashboard,
  CornerDownLeft,
  Clock,
  Crown,
} from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL
const RECENT_KEY = 'ballerz_recent_search'
const RECENT_MAX = 5

interface Club { id: number; name: string; league: string | null; logo?: string | null }

type Section = 'recent' | 'clubs' | 'pages' | 'actions'

interface SearchResult {
  section: Section
  label: string
  sublabel?: string
  href: string
  icon: React.ReactNode
  /** Optional crest URL (used for clubs) */
  logoUrl?: string | null
}

const PAGES: SearchResult[] = [
  { section: 'pages', label: 'Dashboard',     href: '/dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { section: 'pages', label: 'Matches',       href: '/matches',      icon: <Search className="w-4 h-4" /> },
  { section: 'pages', label: 'Standings',     href: '/standings',    icon: <ListOrdered className="w-4 h-4" /> },
  { section: 'pages', label: 'Head-to-Head',  href: '/head-to-head', icon: <Swords className="w-4 h-4" /> },
  { section: 'pages', label: 'Clubs',         href: '/clubs',        icon: <BarChart3 className="w-4 h-4" /> },
  { section: 'pages', label: 'Players',       href: '/players',      icon: <Users className="w-4 h-4" /> },
  { section: 'pages', label: 'PRO',           href: '/premium',      icon: <Crown className="w-4 h-4" /> },
  { section: 'pages', label: 'Club IQ',    href: '/chat',         icon: <MessageSquare className="w-4 h-4" /> },
]

function loadRecent(): SearchResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SearchResult[]
  } catch { return [] }
}

function pushRecent(entry: SearchResult) {
  if (typeof window === 'undefined') return
  try {
    const list = loadRecent().filter(r => r.href !== entry.href)
    list.unshift({ ...entry, section: 'recent' })
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)))
  } catch {}
}

export function SearchOverlay({ open, onClose, onOpenAnalyst }: { open: boolean; onClose: () => void; onOpenAnalyst?: (q?: string) => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [clubs, setClubs] = useState<Club[]>([])
  const [recent, setRecent] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)

  // Load clubs once + recent every open
  useEffect(() => {
    if (!open) return
    if (clubs.length === 0) {
      fetch(`${BACKEND}/api/matches/clubs`)
        .then(r => r.ok ? r.json() : [])
        .then(setClubs)
        .catch(() => {})
    }
    setRecent(loadRecent())
    setQuery('')
    setSelected(0)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, clubs.length])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const q = query.toLowerCase().trim()

  const results: SearchResult[] = useMemo(() => {
    const out: SearchResult[] = []
    if (q.length === 0) {
      // Empty state: recent + pages
      if (recent.length > 0) out.push(...recent)
      out.push(...PAGES)
    } else {
      // Clubs first
      const matchedClubs = clubs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8)
      for (const c of matchedClubs) {
        out.push({
          section: 'clubs',
          label: c.name,
          sublabel: c.league ?? undefined,
          href: `/clubs?club_id=${c.id}`,
          icon: <BarChart3 className="w-4 h-4" />,
          logoUrl: c.logo ?? null,
        })
      }
      // Matching pages
      out.push(...PAGES.filter(p => p.label.toLowerCase().includes(q)))
      // Ask AI fallback
      if (q.length > 2) {
        out.push({
          section: 'actions',
          label: `Ask Club IQ: "${query}"`,
          sublabel: 'Opens Club IQ with this question',
          href: `/chat?q=${encodeURIComponent(query)}`,
          icon: <MessageSquare className="w-4 h-4" />,
        })
      }
    }
    return out
  }, [q, clubs, recent, query])

  const navigate = useCallback((entry: SearchResult) => {
    pushRecent(entry)
    onClose()
    // The Club IQ is now a slide-out panel, not a route — open it instead of
    // navigating to the dead /chat route.
    if (entry.href.startsWith('/chat')) {
      const seed = entry.href.includes('?q=') ? decodeURIComponent(entry.href.split('?q=')[1]) : undefined
      onOpenAnalyst?.(seed)
      return
    }
    router.push(entry.href)
  }, [onClose, router, onOpenAnalyst])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' && results[selected]) {
        e.preventDefault()
        navigate(results[selected])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selected, results, navigate])

  // Reset selection when results change
  useEffect(() => { setSelected(0) }, [query])

  if (!open) return null

  // Group results by section for headers
  const sectioned = groupBySection(results)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command palette */}
      <div
        className="app-shell relative w-full max-w-2xl mx-4
                   bg-ink-1 border border-white/[0.08] rounded-2xl
                   shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)]
                   overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.05]">
          <Search className="w-5 h-5 text-white/35 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clubs, pages, or ask Club IQ…"
            className="flex-1 bg-transparent text-white text-[17px] placeholder-white/30 outline-none"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-white/[0.05] border border-white/[0.08] rounded-md text-[11px] text-white/50 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto py-2" data-lenis-prevent>
          {results.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="text-[15px] text-white/50 mb-1.5">No results for &ldquo;{query}&rdquo;</div>
              <div className="font-mono text-[11px] text-white/30 uppercase tracking-wider">Try a club name, page, or open question</div>
            </div>
          ) : (
            sectioned.map((group, gi) => (
              <div key={group.section + gi} className={gi > 0 ? 'mt-1.5' : ''}>
                <div className="px-5 pt-2.5 pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
                  {sectionLabel(group.section)}
                </div>
                {group.items.map((r) => {
                  const idx = results.indexOf(r)
                  const isSel = idx === selected
                  return (
                    <button
                      key={`${r.href}-${idx}`}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`group w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                        isSel
                          ? 'bg-white/[0.06]'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <ResultIcon r={r} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[15.5px] truncate ${isSel ? 'text-white' : 'text-white/85'}`}>
                          {r.label}
                        </div>
                        {r.sublabel && (
                          <div className="text-[12.5px] text-white/45 truncate mt-0.5">{r.sublabel}</div>
                        )}
                      </div>
                      {isSel && (
                        <CornerDownLeft className="w-4 h-4 text-white/45 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/[0.05] flex items-center gap-4 bg-ink-0/60">
          <FooterKey k="↑↓" label="Navigate" />
          <FooterKey k="↵" label="Open" />
          <FooterKey k="ESC" label="Close" />
        </div>
      </div>
    </div>
  )
}

function ResultIcon({ r }: { r: SearchResult }) {
  // Club crest if available
  if (r.section === 'clubs' && r.logoUrl) {
    return (
      <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
        { /* eslint-disable-next-line @next/next/no-img-element */ }
        <img src={r.logoUrl} alt="" className="w-6 h-6 object-contain" />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-white/55">
      {r.section === 'recent' ? <Clock className="w-[18px] h-[18px]" /> : <span className="[&_svg]:w-[18px] [&_svg]:h-[18px]">{r.icon}</span>}
    </div>
  )
}

function FooterKey({ k, label }: { k: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-white/45">
      <kbd className="px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-[11px] font-mono">{k}</kbd>
      <span className="uppercase tracking-wide">{label}</span>
    </span>
  )
}

function sectionLabel(s: Section): string {
  switch (s) {
    case 'recent':  return 'Recent'
    case 'clubs':   return 'Clubs'
    case 'pages':   return 'Pages'
    case 'actions': return 'Ask the analyst'
  }
}

function groupBySection(results: SearchResult[]): { section: Section; items: SearchResult[] }[] {
  const out: { section: Section; items: SearchResult[] }[] = []
  for (const r of results) {
    const last = out[out.length - 1]
    if (last && last.section === r.section) last.items.push(r)
    else out.push({ section: r.section, items: [r] })
  }
  return out
}
