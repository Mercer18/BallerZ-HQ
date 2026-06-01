'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ChevronRight, Check, Search, Loader2 } from 'lucide-react'
import { AmbientParticles } from '@/components/AmbientParticles'
import { AnimatedLogo } from '@/components/AnimatedLogo'

interface Club {
  id: number
  name: string
  league: string
  country: string
  logo?: string
}

export default function Onboarding() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClub, setSelectedClub] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      if (clubData && !error) {
        setClubs(clubData)
      }
      setFetching(false)
    }

    initData()
  }, [router])

  const handleSubmit = async () => {
    if (!selectedClub || !userId) return

    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingPrefs) {
      await supabase
        .from('user_preferences')
        .update({ favorite_club_id: selectedClub })
        .eq('id', existingPrefs.id)
    } else {
      await supabase.from('user_preferences').insert({
        user_id: userId,
        favorite_club_id: selectedClub,
      })
    }

    router.push('/dashboard')
  }

  const query = searchQuery.toLowerCase()
  const filteredClubs = clubs.filter(club =>
    (club.name ?? '').toLowerCase().includes(query) ||
    (club.league ?? '').toLowerCase().includes(query)
  )

  if (fetching) {
    return (
      <div className="page-container stadium-bg items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-emerald animate-spin" />
        <p className="mt-4 text-lg text-text-secondary">Loading clubs...</p>
      </div>
    )
  }

  return (
    <div className="page-container h-screen overflow-hidden stadium-bg py-8 px-4 flex flex-col items-center justify-center">
      <AmbientParticles />

      <div className="w-full max-w-lg animate-scale-in flex flex-col h-full max-h-[85vh] relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <AnimatedLogo />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">Pick Your Club</h1>
          <p className="text-text-secondary">We&apos;ll tailor your dashboard around them</p>
        </div>

        <div className="card flex-1 min-h-0 flex flex-col">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by club or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5" data-lenis-prevent>
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(club.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
                    selectedClub === club.id
                      ? 'bg-accent-emerald/10 border-accent-emerald/30 shadow-glow'
                      : 'bg-base-50/50 border-white/[0.05] hover:border-accent-emerald/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${selectedClub === club.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {club.name}
                    </span>
                    {selectedClub === club.id && (
                      <div className="bg-accent-emerald rounded-full p-1 animate-scale-in">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-muted mt-0.5 block">{[club.league, club.country].filter(Boolean).join(' · ') || '—'}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-text-muted">
                <p>No clubs found matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!selectedClub || loading}
            className="btn-primary text-base px-10 py-3.5 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Setting up...' : 'Complete Setup'}</span>
            {!loading && <ChevronRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  )
}
