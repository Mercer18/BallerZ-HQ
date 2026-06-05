'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, ShieldAlert, Sparkles, MailCheck } from 'lucide-react'
import { AmbientParticles } from '@/components/AmbientParticles'
import { AnimatedLogo } from '@/components/AnimatedLogo'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export default function Signup() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Create the account through the backend admin API — it's marked confirmed
    // immediately, so no (rate-limited) confirmation email is ever sent.
    try {
      const res = await fetch(`${BACKEND}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Could not create the account. Please try again.')
        setLoading(false)
        return
      }
    } catch {
      setError("Couldn't reach the server. Please try again.")
      setLoading(false)
      return
    }

    // Account is confirmed — sign in straight away and head to onboarding.
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) {
      setError(signInErr.message)
      setLoading(false)
      return
    }
    router.push('/onboarding')
  }

  return (
    <div className="page-container stadium-bg items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm bg-base/35 pointer-events-none" aria-hidden="true" />
      <AmbientParticles />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <Link href="/" className="flex justify-center mb-8 group">
          <AnimatedLogo />
        </Link>

        <div className="card shadow-2xl backdrop-blur-xl !border-accent-emerald/20 ring-1 ring-accent-emerald/5" style={{ boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), 0 0 32px -8px rgba(16,185,129,0.12)' }}>
          {verifySent ? (
            <div className="text-center py-4">
              <div className="inline-flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-accent-emerald/15 border border-accent-emerald/30 flex items-center justify-center">
                  <MailCheck className="w-7 h-7 text-accent-emerald" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">Check your inbox</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                We sent a verification link to{' '}
                <span className="text-text-primary font-medium break-all">{email}</span>.<br />
                Confirm it, then sign in.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                Redirecting to login…
              </p>
            </div>
          ) : (
          <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Join BallerZ HQ</h1>
            <p className="text-text-secondary mt-2">Create your free account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start animate-fade-in">
                <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-11"
                  placeholder="baller_123"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password <span className="text-text-muted font-normal text-xs ml-1">(min 6 chars)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              {!loading && <Sparkles className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-accent-emerald font-medium hover:brightness-125 transition-all">
                Log in
              </Link>
            </p>
          </div>
          </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-[0.15em] font-bold
                       bg-white/[0.05] border border-white/[0.12] text-text-secondary
                       hover:bg-accent-emerald/[0.1] hover:border-accent-emerald/30 hover:text-accent-emerald
                       backdrop-blur-sm transition-all duration-200"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
