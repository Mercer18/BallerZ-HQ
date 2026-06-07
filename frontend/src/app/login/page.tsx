'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Mail, Lock, ShieldAlert } from 'lucide-react'
import { AmbientParticles } from '@/components/AmbientParticles'
import { AnimatedLogo } from '@/components/AnimatedLogo'

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

    let loginEmail = identifier

    if (!identifier.includes('@')) {
      const { data: lookedUpEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: identifier })

      if (rpcError || !lookedUpEmail) {
        setError('Invalid username or password')
        setLoading(false)
        return
      }
      loginEmail = lookedUpEmail
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#060b18]">
      {/* Stadium wallpaper */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/cinematic_clean.png')] bg-cover bg-center bg-no-repeat opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,24,0.65)_0%,rgba(6,11,24,0.45)_50%,rgba(6,11,24,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_100%)]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <AmbientParticles />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-6 group">
          <AnimatedLogo />
        </Link>

        {/* Auth card */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-[rgba(8,14,28,0.75)] backdrop-blur-xl p-8 shadow-2xl"
          style={{ boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), 0 0 32px -8px rgba(16,185,129,0.10)' }}
        >
          <div className="text-center mb-7">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-2">Log in to your intelligence dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-[rgba(6,11,24,0.7)] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent-emerald/50 focus:ring-2 focus:ring-accent-emerald/20 transition-colors"
                  placeholder="you@example.com or baller_123"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-[rgba(6,11,24,0.7)] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent-emerald/50 focus:ring-2 focus:ring-accent-emerald/20 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end -mt-1.5">
              <Link
                href="/forgot-password"
                className="text-[12px] text-slate-400 hover:text-accent-emerald transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-lg bg-accent-emerald hover:bg-accent-emerald/90 text-black text-sm font-bold tracking-tight flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent-emerald/20"
            >
              <span>{loading ? 'Authenticating…' : 'Log In'}</span>
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-slate-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent-emerald font-semibold hover:brightness-125 transition-all">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-[0.18em] font-bold
                       bg-white/[0.04] border border-white/[0.10] text-slate-400
                       hover:bg-accent-emerald/[0.1] hover:border-accent-emerald/30 hover:text-accent-emerald
                       backdrop-blur-sm transition-all duration-200"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
