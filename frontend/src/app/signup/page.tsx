'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, ChevronRight, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react'

export default function Signup() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username,
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <div className="page-container hero-gradient-bg items-center justify-center p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <Link href="/" className="flex justify-center mb-8 group">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-glass group-hover:bg-primary-500/20 transition-all duration-300 group-hover:scale-105">
            <Activity className="w-10 h-10 text-primary-400 group-hover:text-primary-300" />
          </div>
        </Link>
        
        <div className="card shadow-2xl border-white/10 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Join BallerZ HQ</h1>
            <p className="text-gray-400 mt-2">Create your account to start dominating</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start animate-fade-in">
                <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="label">Name / Username</label>
              <div className="relative">
                <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-11 focus:ring-accent-500/50 focus:border-accent-500/50"
                  placeholder="baller_123"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11 focus:ring-accent-500/50 focus:border-accent-500/50"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password <span className="text-gray-500 font-normal text-xs ml-1">(min 6 chars)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 focus:ring-accent-500/50 focus:border-accent-500/50"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full py-3 mt-4 flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              {!loading && <Sparkles className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-accent-400 font-medium hover:text-accent-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
