'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Activity, TrendingUp, AlertCircle, Info, Brain, Target, Shield } from 'lucide-react'
import { PredictionBar } from '@/components/charts/PredictionBar'

interface PredictionWithMatch {
  id: number
  home_win_pct: number
  draw_pct: number
  away_win_pct: number
  home_score_prediction: number
  away_score_prediction: number
  confidence: string
  match: {
    id: number
    date: number
    status: string
    home_club: { name: string, elo_rating: number }
    away_club: { name: string, elo_rating: number }
  }
}

export default function Predictions() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])

  useEffect(() => {
    const fetchPredictions = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch upcoming predictions
      const { data: preds } = await supabase
        .from('predictions')
        .select(`
          *,
          match:match_id (
            id, date, status,
            home_club:home_club_id(name, elo_rating),
            away_club:away_club_id(name, elo_rating)
          )
        `)
        
      if (preds) {
        // Filter out predictions for matches that are already finished
        const upcomingPreds = preds.filter(p => p.match && p.match.status === 'scheduled')
        
        // Sort by match date
        upcomingPreds.sort((a, b) => a.match.date - b.match.date)
        setPredictions(upcomingPreds)
      }
      
      setLoading(false)
    }

    fetchPredictions()
  }, [router])

  const formatMatchDate = (timestamp: number) => {
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  const getTacticalInsight = (p: PredictionWithMatch) => {
    if (p.home_win_pct > 65) return "Home team dominating strength index. High press and territorial dominance expected.";
    if (p.away_win_pct > 60) return "Away team possesses superior quality. Likely to dictate tempo despite being on the road.";
    if (p.draw_pct > 30) return "Tight midfield battle anticipated. Set-pieces could be the differentiator in a low-margin game.";
    return "Balanced matchup. Individual brilliance or managerial adjustments will be key.";
  }

  if (loading) {
    return (
      <div className="page-container hero-gradient-bg items-center justify-center">
        <Activity className="w-12 h-12 text-primary-400 animate-pulse" />
        <h2 className="mt-4 text-xl font-medium text-white">Loading intelligence model...</h2>
      </div>
    )
  }

  return (
    <div className="page-container h-[calc(100vh-4rem)] min-h-0 overflow-hidden hero-gradient-bg flex flex-col">
      <main className="content-container space-y-6 flex-1 overflow-y-auto pb-6 custom-scrollbar">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-accent-500/10 border border-accent-500/20 rounded-full px-3 py-1 mb-3 animate-fade-in">
              <Brain className="w-4 h-4 text-accent-400" />
              <span className="text-sm font-medium text-accent-300">Model Insights</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              Match Predictions
            </h1>
            <p className="text-base text-gray-400">
              Elo-based tactical forecasting for upcoming fixtures.
            </p>
          </div>
        </div>

        {predictions.length > 0 ? (
          <div className="space-y-8">
            {predictions.map((p, index) => {
              const homeElo = p.match.home_club?.elo_rating || 1500;
              const awayElo = p.match.away_club?.elo_rating || 1500;
              const eloDiff = homeElo - awayElo;

              return (
                <div 
                  key={p.id} 
                  className="card-glow p-0 overflow-hidden animate-fade-in-up" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header Row */}
                  <div className="bg-dark-900/80 p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <p className="text-primary-400 font-bold text-sm mb-1 tracking-wider uppercase">
                        {formatMatchDate(p.match.date)}
                      </p>
                      <h3 className="text-2xl font-black text-white">
                        {p.match.home_club?.name} <span className="text-gray-500 font-normal mx-2">vs</span> {p.match.away_club?.name}
                      </h3>
                    </div>
                    <div className="mt-3 md:mt-0 flex space-x-3">
                      <div className="bg-dark-800 px-4 py-2 rounded-lg border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Confidence</p>
                        <span className={`font-bold uppercase tracking-wider text-sm ${
                          p.confidence === 'high' ? 'text-accent-400' :
                          p.confidence === 'medium' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {p.confidence}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Grid */}
                  <div className="p-5 grid lg:grid-cols-3 gap-6">
                    
                    {/* Left: Probabilities */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="min-h-[110px] flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-primary-400" /> Win Probability
                        </h4>
                        <PredictionBar 
                          homeWinPct={p.home_win_pct} 
                          drawPct={p.draw_pct} 
                          awayWinPct={p.away_win_pct} 
                          homeTeam={p.match.home_club?.name} 
                          awayTeam={p.match.away_club?.name} 
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="bg-dark-900/50 p-5 rounded-xl border border-white/5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
                            <Shield className="w-3 h-3 mr-1.5" /> Elo Disparity
                          </h4>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300">{p.match.home_club?.name}</span>
                            <span className="font-mono text-primary-400 font-bold">{homeElo}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">{p.match.away_club?.name}</span>
                            <span className="font-mono text-accent-400 font-bold">{awayElo}</span>
                          </div>
                          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-500">
                            Diff: <strong className={eloDiff > 0 ? "text-primary-400" : eloDiff < 0 ? "text-accent-400" : "text-gray-400"}>
                              {eloDiff > 0 ? '+' : ''}{eloDiff}
                            </strong> points
                          </div>
                        </div>

                        <div className="bg-dark-900/50 p-5 rounded-xl border border-white/5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
                            <Brain className="w-3 h-3 mr-1.5" /> Tactical Context
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {getTacticalInsight(p)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Score Expectation */}
                    <div className="bg-gradient-to-b from-dark-800 to-dark-900 p-5 rounded-xl border border-white/5 h-full flex flex-col justify-center items-center text-center">
                      <h4 className="text-sm font-medium text-gray-400 mb-5 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-accent-400" />
                        Most Likely Scoreline
                      </h4>
                      
                      <div className="flex items-center justify-center space-x-5 text-5xl font-black mb-7">
                        <span className="text-white drop-shadow-lg">{p.home_score_prediction}</span>
                        <span className="text-gray-600 text-3xl">-</span>
                        <span className="text-white drop-shadow-lg">{p.away_score_prediction}</span>
                      </div>

                      <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20 text-sm text-primary-200 text-left w-full">
                        <div className="flex items-start">
                          <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-primary-400" />
                          <p>Based on a logistic regression of current Elo ratings factored with +100 home advantage.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-16 animate-fade-in-up">
            <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Upcoming Predictions</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Our model generates forecasts once fixtures are confirmed and data ingestion completes (runs daily at 6AM UTC).
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
