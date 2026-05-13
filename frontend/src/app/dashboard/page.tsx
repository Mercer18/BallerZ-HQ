'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Activity, TrendingUp, Calendar, Trophy, MessageSquare, BarChart3, ChevronRight, Shield, Award, Globe, Brain } from 'lucide-react'
import Link from 'next/link'
import { FormChart } from '@/components/charts/FormChart'
import { PredictionBar } from '@/components/charts/PredictionBar'

interface DashboardData {
  club: {
    id: number
    name: string
    league: string
    league_position: number
    points: number
    played: number
    won: number
    drawn: number
    lost: number
  } | null
  recentMatches: any[]
  form: string[]
  formString: string
  nextMatch: any | null
  prediction: any | null
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    club: null,
    recentMatches: [],
    form: [],
    formString: '',
    nextMatch: null,
    prediction: null
  })
  const [trackingMode, setTrackingMode] = useState<'club' | 'international'>('club')

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 1. Get User Preferences & Club Data
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select(`
          favorite_club_id,
          favorite_country,
          clubs (*)
        `)
        .eq('user_id', session.user.id)
        .single()

      if (!prefs || (!prefs.clubs && trackingMode === 'club')) {
        router.push('/onboarding')
        return
      }

      let clubId = prefs.favorite_club_id
      let clubData = prefs.clubs as any

      if (trackingMode === 'international' && prefs.favorite_country) {
        // Find the national team club
        const { data: intlClub } = await supabase
          .from('clubs')
          .select('*')
          .eq('name', prefs.favorite_country)
          .limit(1)
          .single()
        
        if (intlClub) {
          clubId = intlClub.id
          clubData = intlClub
        } else {
          // Fallback if not found yet (e.g. data ingestion not done)
          clubData = { name: prefs.favorite_country, league: 'International', league_position: null }
        }
      }

      // 2. Get Recent Form (Last 5 matches)
      const { data: recent } = await supabase
        .from('matches')
        .select(`
          *,
          home_club:home_club_id(name),
          away_club:away_club_id(name)
        `)
        .eq('status', 'finished')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('date', { ascending: false })
        .limit(5)

      // Calculate form
      let formArray: string[] = []
      let wins = 0, draws = 0, losses = 0
      
      if (recent) {
        // Reverse to get chronological order [oldest ... newest]
        const chronRecent = [...recent].reverse()
        
        formArray = chronRecent.map(match => {
          const isHome = match.home_club_id === clubId
          const clubGoals = isHome ? match.home_score : match.away_score
          const oppGoals = isHome ? match.away_score : match.home_score
          
          if (clubGoals > oppGoals) { wins++; return 'W' }
          if (clubGoals === oppGoals) { draws++; return 'D' }
          losses++; return 'L'
        })
      }

      // 3. Get Next Fixture
      const { data: next } = await supabase
        .from('matches')
        .select(`
          *,
          home_club:home_club_id(name),
          away_club:away_club_id(name)
        `)
        .eq('status', 'scheduled')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('date', { ascending: true })
        .limit(1)
        .single()

      // 4. Get Prediction for Next Fixture (if exists)
      let predictionData = null
      if (next) {
        const { data: pred } = await supabase
          .from('predictions')
          .select('*')
          .eq('match_id', next.id)
          .single()
        predictionData = pred
      }

      setData({
        club: clubData,
        recentMatches: recent || [],
        form: formArray,
        formString: `${wins}W - ${draws}D - ${losses}L`,
        nextMatch: next,
        prediction: predictionData
      })
      // Artificial delay to showcase the premium loading animation
      await new Promise(resolve => setTimeout(resolve, 5000))

      setLoading(false)
    }

    fetchDashboardData()
  }, [router, trackingMode])

  if (loading) {
    return (
      <div className="page-container hero-gradient-bg h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Fluid 4-3-3 Effect */}
        <div className="relative flex flex-col items-center justify-center mb-10 mt-[-20px]">
          {/* Vertical Pitch */}
          <div className="relative w-56 h-80 bg-gradient-to-t from-green-900/30 to-dark-900 border-2 border-white/10 rounded-lg shadow-[0_0_40px_rgba(51,139,255,0.15)] mb-4 overflow-hidden">
            {/* Pitch Markings */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-[2px] border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-1/2 w-28 h-14 border-[2px] border-b-0 border-white -translate-x-1/2" />
              <div className="absolute top-0 left-1/2 w-28 h-14 border-[2px] border-t-0 border-white -translate-x-1/2" />
            </div>

            {/* Formation Nodes (4-3-3 transitioning to 2-3-5) */}
            {/* GK */}
            <div className="absolute w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-x-1/2 -translate-y-1/2" style={{ bottom: '5%', left: '50%' }} />
            
            {/* DEFENDERS */}
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'lb-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'lcb-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'rcb-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'rb-move 5s ease-in-out infinite' }} />

            {/* MIDFIELDERS */}
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'lcm-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'cdm-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'rcm-move 5s ease-in-out infinite' }} />

            {/* ATTACKERS */}
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'lw-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'st-move 5s ease-in-out infinite' }} />
            <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 -translate-y-1/2" style={{ animation: 'rw-move 5s ease-in-out infinite' }} />

            {/* Tactical overlay scanning */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-50" style={{ animation: 'tactical-scan 2.5s linear infinite' }} />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            /* Fullbacks push up high and wide */
            @keyframes lb-move { 0%, 10%, 90%, 100% { bottom: 25%; left: 20%; } 40%, 60% { bottom: 55%; left: 10%; background-color: #338bff; box-shadow: 0 0 15px #338bff; } }
            @keyframes rb-move { 0%, 10%, 90%, 100% { bottom: 25%; left: 80%; } 40%, 60% { bottom: 55%; left: 90%; background-color: #338bff; box-shadow: 0 0 15px #338bff; } }
            
            /* Centerbacks split wide */
            @keyframes lcb-move { 0%, 10%, 90%, 100% { bottom: 20%; left: 40%; } 40%, 60% { bottom: 25%; left: 30%; } }
            @keyframes rcb-move { 0%, 10%, 90%, 100% { bottom: 20%; left: 60%; } 40%, 60% { bottom: 25%; left: 70%; } }
            
            /* CDM drops between centerbacks */
            @keyframes cdm-move { 0%, 10%, 90%, 100% { bottom: 40%; left: 50%; } 40%, 60% { bottom: 25%; left: 50%; background-color: #338bff; } }
            
            /* CMs push up to edge of box */
            @keyframes lcm-move { 0%, 10%, 90%, 100% { bottom: 45%; left: 30%; } 40%, 60% { bottom: 65%; left: 35%; background-color: #338bff; } }
            @keyframes rcm-move { 0%, 10%, 90%, 100% { bottom: 45%; left: 70%; } 40%, 60% { bottom: 65%; left: 65%; background-color: #338bff; } }
            
            /* Wingers cut inside */
            @keyframes lw-move { 0%, 10%, 90%, 100% { bottom: 70%; left: 25%; } 40%, 60% { bottom: 80%; left: 35%; background-color: #338bff; box-shadow: 0 0 15px #338bff; } }
            @keyframes rw-move { 0%, 10%, 90%, 100% { bottom: 70%; left: 75%; } 40%, 60% { bottom: 80%; left: 65%; background-color: #338bff; box-shadow: 0 0 15px #338bff; } }
            
            /* Striker pins center backs */
            @keyframes st-move { 0%, 10%, 90%, 100% { bottom: 80%; left: 50%; } 40%, 60% { bottom: 85%; left: 50%; } }
            
            @keyframes tactical-scan {
              0% { transform: translateY(100%); }
              100% { transform: translateY(-100%); }
            }
          `}} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
          <h2 className="text-2xl font-black text-white tracking-tight mb-3 flex items-center drop-shadow-md">
            <Activity className="w-5 h-5 mr-3 text-primary-400 animate-pulse" />
            Synchronizing Roster
          </h2>
          
          <p className="text-xs text-white/80 uppercase tracking-[0.4em] font-bold animate-pulse drop-shadow-md" style={{ animationDuration: '2s' }}>
            Fetching Club Telemetry
          </p>
        </div>
      </div>
    )
  }

  const { club, form, formString, nextMatch, prediction } = data

  const formatMatchDate = (timestamp: number) => {
    // API-Football timestamp is often in seconds, multiply by 1000 if needed
    // Assuming Unix timestamp in seconds here based on typical football APIs
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div className="page-container hero-gradient-bg min-h-0 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <main className="content-container space-y-4 flex-1 overflow-hidden pb-2">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-3 py-1 mb-3">
              {trackingMode === 'club' ? (
                <Shield className="w-4 h-4 text-primary-400" />
              ) : (
                <Globe className="w-4 h-4 text-primary-400" />
              )}
              <span className="text-sm font-medium text-primary-300">Active Tracking</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              {club?.name || 'Your Team'}
            </h1>
            <p className="text-base text-gray-400 flex items-center mt-1">
              <Award className="w-4 h-4 mr-1 opacity-70" /> {club?.league || 'N/A'}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex bg-dark-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setTrackingMode('club')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                trackingMode === 'club' 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow' 
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Club
            </button>
            <button
              onClick={() => setTrackingMode('international')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                trackingMode === 'international' 
                  ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30 shadow-glow-accent' 
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <Globe className="w-4 h-4 mr-2" />
              International
            </button>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Recent Form */}
          <div className="card-glow flex flex-col justify-between p-4">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-accent-400" />
                  Recent Form
                </h2>
                <span className="text-sm font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                  {formString}
                </span>
              </div>
              
              <div className="flex space-x-2 mb-4">
                {form.length > 0 ? form.map((result, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-10 rounded-md flex items-center justify-center font-bold text-sm text-white shadow-sm border border-white/5 ${
                      result === 'W' ? 'bg-accent-500/80' :
                      result === 'D' ? 'bg-amber-500/80' : 'bg-red-500/80'
                    }`}
                  >
                    {result}
                  </div>
                )) : (
                  <div className="w-full text-center text-sm text-gray-500 py-4">No recent matches played yet.</div>
                )}
              </div>
            </div>
            <div className="mt-2">
               <FormChart form={form} teamName={club?.name || ''} />
            </div>
          </div>

          {/* Next Fixture */}
          <div className="card flex flex-col justify-center p-4">
             <div className="flex justify-between items-center mb-4 absolute top-5 left-5 right-5">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                Next Fixture
              </h2>
            </div>
            
            {nextMatch ? (
              <div className="mt-8">
                <div className="text-center py-5 bg-dark-900/50 rounded-xl border border-white/5 mb-3">
                  <div className="flex items-center justify-between px-6 space-x-4">
                    <div className="text-right flex-1">
                      <p className={`font-bold text-lg ${nextMatch.home_club_id === club?.id ? 'text-primary-400' : 'text-white'}`}>
                        {nextMatch.home_club?.name || 'Home'}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Home</p>
                    </div>
                    <div className="px-4 py-2 bg-dark-800 rounded-lg text-sm font-bold text-gray-400 border border-white/5">
                      VS
                    </div>
                    <div className="text-left flex-1">
                      <p className={`font-bold text-lg ${nextMatch.away_club_id === club?.id ? 'text-primary-400' : 'text-white'}`}>
                        {nextMatch.away_club?.name || 'Away'}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Away</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-primary-300 font-medium">{formatMatchDate(nextMatch.date)}</p>
                  <p className="text-sm text-gray-500 mt-1">{nextMatch.venue || 'TBA'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">No upcoming fixtures scheduled.</p>
              </div>
            )}
          </div>

          {/* League Position */}
          <div className="card-glow relative overflow-hidden flex flex-col justify-center text-center group p-4">
            <div className="absolute -right-4 -top-4 text-primary-500/10 group-hover:text-primary-500/20 transition-colors pointer-events-none">
              <Trophy className="w-40 h-40" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-lg font-semibold text-white/80 mb-3">Current Standings</h2>
              
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-primary-400 mb-2">
                {club?.league_position || '-'}
                <span className="text-2xl font-bold align-top text-primary-400/80">
                  {club?.league_position === 1 ? 'st' : club?.league_position === 2 ? 'nd' : club?.league_position === 3 ? 'rd' : 'th'}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 font-medium mb-5">in {club?.league}</p>
              
              <div className="inline-flex items-center space-x-3 bg-dark-900/80 px-4 py-2 rounded-lg border border-white/5 text-sm">
                <span className="text-white"><span className="text-gray-500">P</span> {club?.played || 0}</span>
                <span className="text-accent-400"><span className="text-gray-500">W</span> {club?.won || 0}</span>
                <span className="text-amber-400"><span className="text-gray-500">D</span> {club?.drawn || 0}</span>
                <span className="text-red-400"><span className="text-gray-500">L</span> {club?.lost || 0}</span>
                <span className="pl-3 border-l border-white/10 font-bold text-white">{club?.points || 0} <span className="text-gray-500 font-normal">pts</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Section */}
        <div className="card border-primary-500/20 bg-gradient-to-br from-dark-800/80 to-dark-900/80 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-5">
            <div className="flex items-center mb-3 md:mb-0">
              <div className="bg-primary-500/20 p-2 rounded-lg mr-3 border border-primary-500/20">
                <Activity className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Match Prediction</h2>
                <p className="text-sm text-gray-400">{nextMatch ? `${nextMatch.home_club?.name} vs ${nextMatch.away_club?.name}` : 'Awaiting next fixture'}</p>
              </div>
            </div>
            {prediction && (
              <Link href="/predictions" className="btn-secondary text-sm group flex items-center">
                View Deep Dive <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
          
          {prediction && nextMatch ? (
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                 <PredictionBar 
                  homeWinPct={prediction.home_win_pct} 
                  drawPct={prediction.draw_pct} 
                  awayWinPct={prediction.away_win_pct} 
                  homeTeam={nextMatch.home_club?.name} 
                  awayTeam={nextMatch.away_club?.name} 
                />
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400">Model Confidence</span>
                  <span className={`font-bold uppercase tracking-wider text-sm px-3 py-1 rounded-full ${
                    prediction.confidence === 'high' ? 'bg-accent-500/20 text-accent-400' :
                    prediction.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {prediction.confidence}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Expected Scoreline</h4>
                  <div className="flex items-center justify-center space-x-6 text-2xl font-black">
                    <span className="text-white">{prediction.home_score_prediction}</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-white">{prediction.away_score_prediction}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-dark-900/30 rounded-xl border border-dark-700 border-dashed">
              Model requires an upcoming fixture to generate predictions.
            </div>
          )}
        </div>

        {/* Quick Modules */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/chat" className="card-glow block group p-4">
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500/20 p-3 rounded-xl border border-primary-500/20 group-hover:bg-primary-500/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                  Dual-Mode AI Chat <ChevronRight className="w-5 h-5 ml-1 text-primary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">Launch the tactical analyst or hype mode companion.</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics" className="card-glow block group p-4">
            <div className="flex items-start space-x-4">
              <div className="bg-accent-500/20 p-3 rounded-xl border border-accent-500/20 group-hover:bg-accent-500/30 transition-colors">
                <BarChart3 className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                  Predictive Analytics <ChevronRight className="w-5 h-5 ml-1 text-accent-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">Explore full model accuracy tracking and performance.</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
