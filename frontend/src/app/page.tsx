'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Activity, TrendingUp, MessageSquare, Shield, ChevronRight, Zap } from 'lucide-react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()
  }, [])

  return (
    <div className="page-container hero-gradient-bg">
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-500/20 p-2 rounded-xl">
                <Activity className="w-8 h-8 text-primary-400" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">BallerZ <span className="text-primary-400">HQ</span></span>
            </div>
            <div className="flex items-center space-x-6">
              {isLoggedIn ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-primary flex items-center shadow-primary-500/20">
                    Get Started <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

        <div className="max-w-[1600px] mx-auto px-4 relative z-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 shadow-glass-sm animate-float">
            <Zap className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-medium text-gray-300">Powered by real-time football data</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-tight">
            The Ultimate <br className="hidden md:block" />
            <span className="text-gradient">Football Intelligence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md mb-10 max-w-3xl mx-auto leading-relaxed">
            Get match predictions, team insights, and an AI chat companion that actually knows your club. No hallucinations, just pure data.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {!isLoggedIn && (
              <Link href="/signup" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex justify-center shadow-primary-500/25 shadow-2xl">
                Start For Free <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            )}
            <Link href="#features" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto flex justify-center backdrop-blur-md">
              Explore Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Dominate the Conversation
            </h2>
            <p className="text-white/90 drop-shadow-md max-w-2xl mx-auto">Everything you need to be the smartest fan in the room, packaged in a beautiful interface.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-primary-400" />}
              title="Match Predictions"
              description="Win/Draw/Loss probabilities with AI-generated tactical explanations backed by real data."
              delay="0.1s"
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-accent-400" />}
              title="Team Dashboard"
              description="Live form guides, upcoming fixtures, league standings, and Elo squad strength ratings."
              delay="0.2s"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-primary-400" />}
              title="Dual-Mode AI"
              description="Analyst Mode for deep tactical stats, or Hype Mode for pure fan banter and excitement."
              delay="0.3s"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-accent-400" />}
              title="Data-Backed"
              description="Zero hallucinations. Every chat response and prediction is grounded in real API data."
              delay="0.4s"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 relative z-10 text-center text-gray-300 drop-shadow-md">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Activity className="w-5 h-5 opacity-80" />
          <span className="font-bold tracking-wider text-white">BallerZ HQ</span>
        </div>
        <p className="opacity-80">&copy; 2026. Built by fans, for fans. Powered by Groq and API-Football.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
  return (
    <div className="card-glow group animate-fade-in-up" style={{ animationDelay: delay, animationFillMode: 'both' }}>
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10 shadow-glass-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  )
}
