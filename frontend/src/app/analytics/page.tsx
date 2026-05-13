'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { BarChart3, TrendingUp, MessageSquare, Target, CheckCircle2, XCircle } from 'lucide-react'

interface HistoryItem {
  id: number
  is_correct: boolean | null
  confidence: string
  home_win_pct: number
  draw_pct: number
  away_win_pct: number
  match: {
    id: number
    date: number
    status: string
    home_score: number
    away_score: number
    home_club: { name: string }
    away_club: { name: string }
  }
}

export default function Analytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    chatCount: 0,
    predCount: 0,
    accuracy: 0,
    history: [] as HistoryItem[]
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get Chat Count
      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      // Get User Pref
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favorite_club_id')
        .eq('user_id', session.user.id)
        .single()

      let predHistory: HistoryItem[] = []
      let totalCorrect = 0
      let totalResolved = 0

      if (prefs) {
        const clubId = prefs.favorite_club_id

        // Fetch matches associated with this club
        const { data: matches } = await supabase
          .from('matches')
          .select('id')
          .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)

        if (matches && matches.length > 0) {
          const matchIds = matches.map(m => m.id)

          // Fetch predictions for these matches
          const { data: preds } = await supabase
            .from('predictions')
            .select(`
              *,
              match:match_id (
                id, date, status, home_score, away_score,
                home_club:home_club_id(name),
                away_club:away_club_id(name)
              )
            `)
            .in('match_id', matchIds)
            .order('match_id', { ascending: false })

          if (preds) {
            predHistory = preds.filter(p => p.match && p.match.status === 'finished') as unknown as HistoryItem[]
            predHistory = predHistory.sort((a, b) => b.match.date - a.match.date)
            
            predHistory.forEach(p => {
              if (p.is_correct !== null) {
                totalResolved++
                if (p.is_correct) totalCorrect++
              }
            })
          }
        }
      }

      const acc = totalResolved > 0 ? Math.round((totalCorrect / totalResolved) * 100) : 0

      setStats({
        chatCount: chatCount || 0,
        predCount: predHistory.length,
        accuracy: acc,
        history: predHistory
      })

      // Artificial delay for Analytics to showcase Playmaker v2
      await new Promise(resolve => setTimeout(resolve, 5000))

      setLoading(false)
    }

    fetchAnalytics()
  }, [router])

  if (loading) {
    return (
      <div className="page-container h-[calc(100vh-4rem)] min-h-0 overflow-hidden hero-gradient-bg flex flex-col items-center justify-center relative">
        
        {/* Playmaker v2 Effect */}
        <div className="relative flex flex-col items-center justify-center mb-8">
          {/* Pitch */}
          <div className="relative w-96 h-60 bg-gradient-to-br from-green-900/40 to-dark-900 border-2 border-white/20 rounded-md overflow-hidden shadow-[0_0_50px_rgba(51,139,255,0.15)]">
            
            {/* Pitch Markings */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 w-24 h-24 border-[2px] border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-16 h-32 border-[2px] border-l-0 border-white -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-6 h-14 border-[2px] border-l-0 border-white -translate-y-1/2" />
              <div className="absolute top-1/2 right-0 w-16 h-32 border-[2px] border-r-0 border-white -translate-y-1/2" />
              <div className="absolute top-1/2 right-0 w-6 h-14 border-[2px] border-r-0 border-white -translate-y-1/2" />
            </div>

            {/* Team A (Attacking) */}
            <div className="absolute top-[50%] left-[5%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* GK */}
            <div className="absolute top-[20%] left-[25%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* LB */}
            <div className="absolute top-[70%] left-[45%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* CDM */}
            <div className="absolute top-[80%] left-[65%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* RW */}
            <div className="absolute top-[40%] left-[75%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* CAM */}
            <div className="absolute top-[30%] left-[85%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 -translate-x-1/2" /> {/* ST */}

            {/* Team B (Defending) */}
            <div className="absolute top-[50%] left-[95%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* GK */}
            <div className="absolute top-[35%] left-[85%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* CB1 */}
            <div className="absolute top-[65%] left-[80%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* CB2 */}
            <div className="absolute top-[80%] left-[75%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* LB */}
            <div className="absolute top-[20%] left-[75%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* RB */}
            <div className="absolute top-[50%] left-[65%] w-3 h-3 bg-accent-500 rounded-full shadow-[0_0_10px_rgba(255,50,50,0.8)] -translate-y-1/2 -translate-x-1/2" /> {/* CDM */}

            {/* The Ball */}
            <div className="absolute w-2.5 h-2.5 bg-primary-400 rounded-full shadow-[0_0_15px_rgba(51,139,255,1)] z-10 -translate-y-1/2 -translate-x-1/2" 
              style={{ animation: 'playmaker-pass-v2 5s linear infinite' }}
            />
            
            {/* Goal Net Flash */}
            <div className="absolute top-[50%] right-[0%] w-3 h-14 bg-primary-400 -translate-y-1/2 blur-sm"
              style={{ animation: 'playmaker-flash-v2 5s linear infinite' }}
            />

          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes playmaker-pass-v2 {
              0%, 5% { top: 50%; left: 5%; opacity: 1; transform: scale(1) translate(-50%, -50%); }
              15%, 20% { top: 20%; left: 25%; opacity: 1; transform: scale(1.2) translate(-50%, -50%); }
              35%, 40% { top: 70%; left: 45%; opacity: 1; transform: scale(1.2) translate(-50%, -50%); }
              55%, 60% { top: 80%; left: 65%; opacity: 1; transform: scale(1.2) translate(-50%, -50%); }
              70%, 75% { top: 40%; left: 75%; opacity: 1; transform: scale(1.2) translate(-50%, -50%); }
              85% { top: 30%; left: 85%; opacity: 1; transform: scale(1) translate(-50%, -50%); }
              90% { top: 45%; left: 85%; opacity: 1; transform: scale(1) translate(-50%, -50%); }
              96% { top: 50%; left: 98%; opacity: 1; transform: scale(1) translate(-50%, -50%); }
              98% { top: 50%; left: 98%; opacity: 0; transform: scale(3) translate(-50%, -50%); }
              100% { top: 50%; left: 5%; opacity: 0; transform: scale(1) translate(-50%, -50%); }
            }
            @keyframes playmaker-flash-v2 {
              0%, 94% { opacity: 0; transform: scaleY(1) translateY(-50%); }
              96% { opacity: 1; transform: scaleY(2) translateY(-25%); box-shadow: 0 0 40px 15px rgba(51,139,255,0.8); }
              100% { opacity: 0; transform: scaleY(1) translateY(-50%); }
            }
          `}} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
          <h2 className="text-2xl font-black text-white tracking-tight mb-3 flex items-center drop-shadow-md">
            <BarChart3 className="w-6 h-6 mr-3 text-primary-400 animate-pulse" />
            Aggregating Telemetry
          </h2>
          
          <p className="text-xs text-white/80 uppercase tracking-[0.4em] font-bold animate-pulse drop-shadow-md" style={{ animationDuration: '2s' }}>
            Compiling historical analytics
          </p>
        </div>
      </div>
    )
  }

  const formatMatchDate = (timestamp: number) => {
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="page-container h-[calc(100vh-4rem)] min-h-0 overflow-hidden hero-gradient-bg flex flex-col">
      <main className="content-container space-y-6 flex-1 overflow-y-auto pb-6 custom-scrollbar">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-accent-500/10 border border-accent-500/20 rounded-full px-3 py-1 mb-3 animate-fade-in">
              <TrendingUp className="w-4 h-4 text-accent-400" />
              <span className="text-sm font-medium text-accent-300">Model Performance</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-400">
              Historical accuracy mapping and AI engagement telemetry.
            </p>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Accuracy Card */}
          <div className="card-glow flex flex-col justify-center items-center py-8 relative overflow-hidden group text-center animate-fade-in-up">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-medium mb-1">Historical Accuracy</p>
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-400">
                {stats.predCount > 0 ? `${stats.accuracy}%` : '--'}
              </h2>
              <p className="text-sm text-gray-500 mt-2">Win/Draw/Loss correctly predicted</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="card flex items-center p-5 bg-dark-800/60 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mr-4 border border-primary-500/30">
                <BarChart3 className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Predictions</p>
                <h3 className="text-2xl font-bold text-white">{stats.predCount}</h3>
              </div>
            </div>
            <div className="card flex items-center p-5 bg-dark-800/60 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-lg bg-accent-500/20 flex items-center justify-center mr-4 border border-accent-500/30">
                <MessageSquare className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">AI Chat Events</p>
                <h3 className="text-2xl font-bold text-white">{stats.chatCount}</h3>
              </div>
            </div>
          </div>

          {/* Setup Placeholder (Since Metabase integration takes time, display nice UI state) */}
          <div className="card border border-white/5 bg-dark-900/50 flex flex-col justify-center items-center py-8 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="bg-dark-800 p-4 rounded-full mb-3 border border-white/5">
              <BarChart3 className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Deep Insights DB</h3>
            <p className="text-sm text-gray-400 max-w-[200px] mb-3">
              Advanced Metabase BI deployment required for complex graphing.
            </p>
            <span className="text-xs bg-dark-800 px-3 py-1 rounded text-gray-500 border border-white/5">Pending Infrastructure</span>
          </div>

        </div>

        {/* Prediction History Table */}
        <div className="card mt-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-xl font-bold text-white mb-4">Historical Prediction Ledger</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500 bg-dark-900/30">
                  <th className="px-6 py-4 font-medium">Match</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Actual Result</th>
                  <th className="px-6 py-4 font-medium">Model Output</th>
                  <th className="px-6 py-4 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.history.length > 0 ? (
                  stats.history.map((h) => {
                    const m = h.match
                    return (
                      <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{m.home_club?.name}</span>
                          <span className="text-gray-500 mx-2">vs</span>
                          <span className="font-semibold text-white">{m.away_club?.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                          {formatMatchDate(m.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm tracking-widest text-primary-300 bg-primary-500/10 px-2 py-1 rounded-md border border-primary-500/20">
                            {m.home_score} - {m.away_score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                             <div className="w-16 h-1.5 bg-dark-800 rounded-full overflow-hidden flex">
                               <div className="bg-accent-500 h-full" style={{ width: `${h.home_win_pct}%` }} />
                               <div className="bg-amber-500 h-full" style={{ width: `${h.draw_pct}%` }} />
                               <div className="bg-red-500 h-full" style={{ width: `${h.away_win_pct}%` }} />
                             </div>
                             <span className="text-xs text-gray-500 uppercase">{h.confidence}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {h.is_correct === true ? (
                            <div className="inline-flex items-center text-sm font-medium text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-md border border-accent-500/20">
                              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Correct
                            </div>
                          ) : h.is_correct === false ? (
                            <div className="inline-flex items-center text-sm font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                              <XCircle className="w-4 h-4 mr-1.5" /> Miss
                            </div>
                          ) : (
                            <div className="inline-flex items-center text-sm font-medium text-gray-400 bg-gray-500/10 px-2.5 py-1 rounded-md border border-gray-500/20">
                              Awaiting Data
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 border-b-0">
                      <p>No historical prediction data available yet.</p>
                      <p className="text-sm mt-1">Data builds as real matches are completed and ingested.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
