'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Crown, Check, Mail, CheckCircle2, Loader2 } from 'lucide-react'

export default function PremiumPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prefs } = await supabase.from('user_preferences').select('id').eq('user_id', session.user.id).single()
      if (!prefs) { router.push('/onboarding'); return }
      setAuthed(true)
    }
    init()
  }, [router])

  if (!authed) return <div className="page-container app-bg pt-14 items-center justify-center h-screen"><Loader2 className="w-6 h-6 text-accent-emerald animate-spin" /></div>

  return (
    <div className="page-container app-bg pt-14">
      <main className="content-container max-w-[1000px]">
        <div className="text-center mb-12 pb-6 border-b border-dashed border-accent-emerald/20">
          <div className="inline-flex items-center gap-2 bg-accent-amber/10 border border-dashed border-accent-amber/30 rounded-full px-4 py-1.5 mb-6">
            <Crown className="w-3.5 h-3.5 text-accent-amber" />
            <span className="font-mono text-[10px] font-bold text-accent-amber uppercase tracking-wider">BallerZ Pro — Coming Soon</span>
          </div>
          <h1 className="font-serif font-semibold text-text-primary mb-4 tracking-[-0.02em] leading-[0.95]" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>
            You&apos;re on the <span className="italic text-accent-emerald">free plan</span>
          </h1>
          <p className="text-base text-text-secondary max-w-xl mx-auto">
            The full historical platform is yours, free. Player-level depth and advanced AI are on the way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-terminal p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-text-primary">Free</h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/25 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald" /> Active
              </span>
            </div>
            <ul className="space-y-3">
              <PlanFeature available>27,000+ matches, 2010-11 to today</PlanFeature>
              <PlanFeature available>League standings for every season</PlanFeature>
              <PlanFeature available>Head-to-head history</PlanFeature>
              <PlanFeature available>Club deep-dives</PlanFeature>
              <PlanFeature available>Club IQ — AI grounded in real data</PlanFeature>
            </ul>
          </div>

          <div className="card-terminal p-7 border-accent-amber/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-white flex items-center gap-2">
                BallerZ <span className="text-accent-amber">PRO</span> <Crown className="w-5 h-5 text-accent-amber" />
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent-amber bg-accent-amber/10 border border-accent-amber/25 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full border border-accent-amber" /> Coming Soon
              </span>
            </div>
            <ul className="space-y-3">
              <PlanFeature>Player stats &amp; deep analysis</PlanFeature>
              <PlanFeature>Advanced AI analysis mode</PlanFeature>
              <PlanFeature>Club logos &amp; polished presentation</PlanFeature>
              <PlanFeature>Bookmaker odds comparison</PlanFeature>
            </ul>
            <div className="mt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function PlanFeature({ children, available = false }: { children: React.ReactNode; available?: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${available ? 'bg-accent-emerald/12' : 'bg-accent-amber/12'}`}>
        {available
          ? <Check className="w-3 h-3 text-accent-emerald" />
          : <Crown className="w-3 h-3 text-accent-amber" />}
      </div>
      <span className="text-text-primary">{children}</span>
    </li>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError('Enter a valid email'); return }
    setSaving(true); setError('')
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { error: insertError } = await supabase.from('waitlist').insert({ email: value })
    setSaving(false)
    if (insertError) {
      if (insertError.code === '23505') { setSubmitted(true); return }
      setError('Could not save — try again'); return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0" />
        <span className="text-sm text-text-primary">You&apos;re on the list. We&apos;ll let you know.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <label htmlFor="premium-waitlist-email" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Get notified when Premium launches</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="premium-waitlist-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input pl-9"
            disabled={saving}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-accent whitespace-nowrap disabled:opacity-50">
          {saving ? 'Saving...' : 'Notify Me'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  )
}
