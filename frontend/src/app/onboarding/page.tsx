'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Activity, Globe, ChevronRight, Check, Search, Shield } from 'lucide-react'

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
  const [countries, setCountries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedClub, setSelectedClub] = useState<number | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  
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

      // Fetch clubs from database (instead of hardcoded)
      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      if (clubData && !error) {
        setClubs(clubData)
        
        // Extract unique countries
        const uniqueCountries = Array.from(new Set(clubData.map(c => c.country))).filter(Boolean).sort()
        setCountries(uniqueCountries)
      }
      setFetching(false)
    }
    
    initData()
  }, [router])

  const handleSubmit = async () => {
    if (!selectedClub || !selectedCountry || !userId) return

    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check if preference already exists
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingPrefs) {
      await supabase
        .from('user_preferences')
        .update({
          favorite_club_id: selectedClub,
          favorite_country: selectedCountry,
        })
        .eq('id', existingPrefs.id)
    } else {
      await supabase.from('user_preferences').insert({
        user_id: userId,
        favorite_club_id: selectedClub,
        favorite_country: selectedCountry,
      })
    }

    router.push('/dashboard')
  }

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    club.league.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (fetching) {
    return (
      <div className="page-container hero-gradient-bg items-center justify-center">
        <Activity className="w-12 h-12 text-primary-400 animate-pulse" />
        <h2 className="mt-4 text-xl font-medium text-white">Loading database...</h2>
      </div>
    )
  }

  return (
    <div className="page-container h-screen overflow-hidden hero-gradient-bg py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl animate-scale-in flex flex-col h-full max-h-[90vh]">
        <div className="text-center mb-12">
          <div className="inline-flex justify-center mb-6 bg-white/5 p-4 rounded-2xl shadow-glass border border-white/10">
            <Shield className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Customize Your Experience</h1>
          <p className="text-lg text-gray-400">Select your favorite club and region so we can tailor your intelligence feed</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8 w-full flex-1 min-h-0">
          {/* Club Selection */}
          <div className="card h-full flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary-400" />
                Select Your Club
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by club or league..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 py-2.5 bg-dark-900/50 backdrop-blur-md border-white/10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {filteredClubs.length > 0 ? (
                filteredClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClub(club.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 border ${
                      selectedClub === club.id
                        ? 'bg-primary-600/20 border-primary-500 shadow-glow'
                        : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${selectedClub === club.id ? 'text-white' : 'text-gray-200'}`}>
                        {club.name}
                      </span>
                      {selectedClub === club.id && (
                        <div className="bg-primary-500 rounded-full p-1 shadow-glow animate-scale-in">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 mt-1 block">{club.league} • {club.country}</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No clubs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Country Selection */}
          <div className="card h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center shrink-0">
              <Globe className="w-5 h-5 mr-2 text-accent-400" />
              Select National Team
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`w-full text-left px-4 py-3.5 rounded-lg transition-all duration-300 border ${
                    selectedCountry === country
                      ? 'bg-accent-600/20 border-accent-500 shadow-glow-accent'
                      : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${selectedCountry === country ? 'text-white' : 'text-gray-200'}`}>
                      {country}
                    </span>
                    {selectedCountry === country && (
                      <div className="bg-accent-500 rounded-full p-1 shadow-glow-accent animate-scale-in">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!selectedClub || !selectedCountry || loading}
            className="btn-primary text-lg px-10 py-4 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
          >
            <span>{loading ? 'Initializing Dashboard...' : 'Complete Setup'}</span>
            {!loading && <ChevronRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  )
}
