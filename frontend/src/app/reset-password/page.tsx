'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react'
import { AmbientParticles } from '@/components/AmbientParticles'
import { AnimatedLogo } from '@/components/AnimatedLogo'

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

export default function ResetPassword() {
  const router = useRouter()
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('checking')

  // Arriving from the email link, Supabase establishes a temporary recovery
  // session parsed from the URL. Wait for it before showing the form; if no
  // session materialises the link is missing/expired.
  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('ready')
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        setPhase('ready')
      } else {
        // Give detectSessionInUrl a beat to parse the recovery token first.
        setTimeout(() => {
          if (active) setPhase((p) => (p === 'checking' ? 'invalid' : p))
        }, 2000)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setPhase('done')
    setTimeout(() => router.push('/login'), 2200)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#060b18]">
      {/* Stadium wallpaper — matches the login page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/cinematic_clean.png')] bg-cover bg-center bg-no-repeat opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,24,0.65)_0%,rgba(6,11,24,0.45)_50%,rgba(6,11,24,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_100%)]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <AmbientParticles />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-6 group">
          <AnimatedLogo />
        </Link>

        <div
          className="rounded-2xl border border-white/[0.08] bg-[rgba(8,14,28,0.75)] backdrop-blur-xl p-8 shadow-2xl"
          style={{ boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), 0 0 32px -8px rgba(16,185,129,0.10)' }}
        >
          {phase === 'checking' && (
            <p className="text-center text-slate-400 text-sm py-6">Verifying your reset link…</p>
          )}

          {phase === 'invalid' && (
            <div className="text-center py-3">
              <div className="inline-flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7 text-red-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Link expired or invalid</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                This reset link is no longer valid. Request a fresh one and try again.
              </p>
              <Link
                href="/forgot-password"
                className="text-accent-emerald text-sm font-semibold hover:brightness-125 transition-all"
              >
                Request a new link
              </Link>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center py-3">
              <div className="inline-flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-accent-emerald/15 border border-accent-emerald/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-accent-emerald" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Password updated</h1>
              <p className="text-slate-400 text-sm leading-relaxed">Redirecting you to login…</p>
            </div>
          )}

          {phase === 'ready' && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-3xl font-bold text-white tracking-tight">Set a new password</h1>
                <p className="text-slate-400 text-sm mt-2">Choose a strong password you&apos;ll remember</p>
              </div>

              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2"
                  >
                    New Password{' '}
                    <span className="text-slate-600 normal-case font-normal tracking-normal">(min 6 chars)</span>
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
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-lg bg-[rgba(6,11,24,0.7)] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent-emerald/50 focus:ring-2 focus:ring-accent-emerald/20 transition-colors"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-lg bg-accent-emerald hover:bg-accent-emerald/90 text-black text-sm font-bold tracking-tight flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent-emerald/20"
                >
                  <span>{loading ? 'Updating…' : 'Update password'}</span>
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
