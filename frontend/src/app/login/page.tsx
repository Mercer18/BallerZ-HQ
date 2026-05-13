'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, ChevronRight, Mail, Lock, ShieldAlert } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    let loginEmail = identifier;
    
    // If identifier doesn't have an '@', treat it as a username and lookup the email
    if (!identifier.includes('@')) {
      const { data: lookedUpEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: identifier });
        
      if (rpcError || !lookedUpEmail) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      loginEmail = lookedUpEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="page-container hero-gradient-bg items-center justify-center p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <Link href="/" className="flex justify-center mb-8 group">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-glass group-hover:bg-primary-500/20 transition-all duration-300 group-hover:scale-105">
            <Activity className="w-10 h-10 text-primary-400 group-hover:text-primary-300" />
          </div>
        </Link>
        
        <div className="card shadow-2xl border-white/10 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-gray-400 mt-2">Log in to your intelligence dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start animate-fade-in">
                <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="label">Email / Username</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input pl-11 focus:ring-primary-500/50 focus:border-primary-500/50"
                  placeholder="you@example.com or baller_123"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Authenticating...' : 'Secure Log In'}</span>
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-400 font-medium hover:text-primary-300 transition-colors">
                Sign up free
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
