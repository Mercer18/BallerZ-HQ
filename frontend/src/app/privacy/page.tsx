'use client'

import Link from 'next/link'
import { EliteBackground } from '@/components/EliteBackground'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-white relative font-sans bg-[#060b18]">
      <EliteBackground />

      {/* Navigation Header */}
      <nav
        className="fixed top-0 w-full z-50 h-[56px] flex items-center"
        style={{
          background: 'rgba(8,11,16,0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-accent-emerald transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <AnimatedLogo size="sm" />
          <div className="hidden sm:block text-slate-500 font-mono text-[10px] tracking-wider uppercase">
            Legal Document
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <main className="max-w-[800px] mx-auto px-6 pt-24 pb-20 relative z-10">
        <div className="text-center mt-8 mb-12">
          <div className="inline-flex p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-2xl text-accent-emerald mb-4 shadow-[0_0_15px_rgba(52,211,153,0.15)] animate-pulse-glow">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white mb-2">
            Privacy Policy
          </h1>
          <p className="font-mono text-[11px] text-slate-400">
            Last updated: June 7, 2026 &bull; Version 1.0
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-[rgba(16,18,22,0.55)] border border-white/[0.07] backdrop-blur-md rounded-2xl p-6 mb-8">
          <p className="text-sm leading-relaxed text-slate-300">
            At BallerZ HQ, accessible from http://localhost:3000, we prioritize the privacy and security of our visitors. This Privacy Policy details the types of information we collect, how we use it, and your rights regarding your personal data. By using our website, you consent to the collection and use of information in accordance with this policy.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-emerald/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-emerald/10 text-accent-emerald text-xs font-mono font-bold">1</span>
              Information We Collect
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-350">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Account Credentials:</strong> When registering an account, we securely manage your login credentials and email address using Supabase Authentication.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Waitlist Sign-ups:</strong> If you join our waitlist, we store your email address to notify you when access is available.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Telemetry & Analytics:</strong> We collect system telemetry, interaction logs, browser type, and page visit duration to optimize user experiences.</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-emerald/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-emerald/10 text-accent-emerald text-xs font-mono font-bold">2</span>
              How We Use Information
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-350">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Deliver Intelligence:</strong> To load statistical deep-dives, head-to-head match histories, and personalized Club IQ AI chat responses.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">App Security:</strong> To detect, investigate, and prevent malicious actions, data scraping, or security exploits.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Product Updates:</strong> To share feature announcements and system status updates (purely opt-in; you can unsubscribe anytime).</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-emerald/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-emerald/10 text-accent-emerald text-xs font-mono font-bold">3</span>
              Security & Storage (Supabase)
            </h2>
            <p className="text-sm leading-relaxed text-slate-350 mb-3">
              We employ professional-grade administrative and cryptographic safeguards to protect your personal information:
            </p>
            <p className="text-sm leading-relaxed text-slate-350">
              User credentials and profiles are stored inside PostgreSQL databases managed by <strong className="text-slate-200">Supabase</strong>. All authentication endpoints are encrypted over transport via TLS/HTTPS, and user passwords are automatically hashed. We will never sell, lease, or distribute your email or data details to third-party marketing companies.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-emerald/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-emerald/10 text-accent-emerald text-xs font-mono font-bold">4</span>
              Your Legal Rights (GDPR / CCPA)
            </h2>
            <p className="text-sm leading-relaxed text-slate-350 mb-4">
              Regardless of your geographical location, we support standard data privacy rights:
            </p>
            <ul className="space-y-2 text-sm text-slate-350">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald shrink-0" />
                <span>The right to request access to and copies of your personal data.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald shrink-0" />
                <span>The right to request correction of inaccurate database profiles.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald shrink-0" />
                <span>The right to request the permanent deletion of your account and files.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact info footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.05] text-center">
          <p className="text-sm text-slate-400">
            Have questions about how we handle your privacy? Contact us directly:
          </p>
          <a
            href="mailto:rishi18022005@gmail.com"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 hover:bg-accent-emerald/20 transition-all font-mono text-xs font-bold"
          >
            rishi18022005@gmail.com
          </a>
        </div>
      </main>
    </div>
  )
}
