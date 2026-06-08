'use client'

import Link from 'next/link'
import { EliteBackground } from '@/components/EliteBackground'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import { ArrowLeft, Scale, Shield, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'

export default function TermsPage() {
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
          <div className="inline-flex p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl text-accent-gold mb-4 shadow-[0_0_15px_rgba(230,184,78,0.15)] animate-pulse-glow" style={{ animationName: 'pulseGlow' }}>
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white mb-2">
            Terms of Service
          </h1>
          <p className="font-mono text-[11px] text-slate-400">
            Last updated: June 7, 2026 &bull; Version 1.0
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-[rgba(16,18,22,0.55)] border border-white/[0.07] backdrop-blur-md rounded-2xl p-6 mb-8">
          <p className="text-sm leading-relaxed text-slate-350">
            Welcome to BallerZ HQ (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;), and BallerZ HQ, concerning your access to and use of http://localhost:3000 as well as any other media form, website, or mobile application related or connected thereto.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-gold/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-gold/10 text-accent-gold text-xs font-mono font-bold">1</span>
              Intellectual Property Rights
            </h2>
            <p className="text-sm leading-relaxed text-slate-350 mb-3">
              Unless otherwise indicated, the website, including its source code, databases, backend scripts, API endpoints, stylesheet structures, frontend visual UI layouts, graphics, database compilations, team rating algorithms, logos, and custom SVG icons are our proprietary intellectual property owned by <strong className="text-slate-200">Rishi Srivastava / BallerZ HQ</strong>.
            </p>
            <p className="text-sm leading-relaxed text-slate-350">
              They are protected by international copyright, trademark, and database compilation laws. You may not copy, clone, reproduce, redistribute, republish, or commercially exploit any part of our codebase, stylesheets, or backend designs without express prior written consent.
            </p>
          </div>

          {/* Section 2 - STRICT ANTI-SCRAPING */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-accent-coral/20 rounded-xl p-6 hover:border-accent-coral/40 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-accent-coral mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-coral/10 text-accent-coral text-xs font-mono font-bold">2</span>
              Strict Anti-Scraping & Data Restrictions
            </h2>
            <p className="text-sm leading-relaxed text-slate-350 mb-4">
              To protect the integrity of our analytical database compilations and platform performance, the following actions are strictly prohibited:
            </p>
            <ul className="space-y-3 text-sm text-slate-350">
              <li className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
                <span>You may not use any automated tool, robot, spider, crawler, scraper, offline reader, or manual script to extract, download, harvest, index, or copy our data, match statistics, player attributes, ratings, or database entries.</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
                <span>You may not bypass, disable, or circumvent any security measures, rate-limiting frameworks, or IP blocklists designed to protect our server endpoints.</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
                <span>You may not use our statistics, database entries, or Club IQ analytical responses to train artificial intelligence (AI), machine learning models, or build competing football index products.</span>
              </li>
            </ul>
            <p className="mt-4 text-[12px] font-mono text-accent-coral/80 bg-accent-coral/[0.04] p-3 rounded-lg border border-accent-coral/10">
              VIOLATION NOTICE: Any breach of this clause constitutes a material violation of these Terms, unauthorized access to computer systems, and breach of contract, and will result in immediate IP banning, account deletion, and direct legal enforcement action.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-gold/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-gold/10 text-accent-gold text-xs font-mono font-bold">3</span>
              Limited User License
            </h2>
            <p className="text-sm leading-relaxed text-slate-350">
              We grant you a non-exclusive, non-transferable, revocable, personal license to access and use the website solely for your private, non-commercial enjoyment. Any commercial redistribution of our matches, standings, head-to-head indices, or AI analytical insights is prohibited.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-gold/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-gold/10 text-accent-gold text-xs font-mono font-bold">4</span>
              Disclaimers & Liability Limits
            </h2>
            <p className="text-sm leading-relaxed text-slate-350 mb-3">
              All data, match indicators, player profiles, bookmaker odds, and Club IQ AI predictions are provided for analytical and entertainment purposes on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis.
            </p>
            <p className="text-sm leading-relaxed text-slate-350">
              We do not warrant the absolute accuracy, completeness, or timeliness of statistics. We are not liable for any losses, database downtime, or decision outcomes (including wagering decisions) based on platform content.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-[rgba(16,18,22,0.4)] border border-white/[0.05] rounded-xl p-6 hover:border-accent-gold/25 transition-colors duration-300">
            <h2 className="flex items-center gap-3 text-base font-semibold text-white mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-gold/10 text-accent-gold text-xs font-mono font-bold">5</span>
              Copyright Infringement & DMCA Claims
            </h2>
            <p className="text-sm leading-relaxed text-slate-350">
              We respect intellectual property rights. If you believe any material hosted on or linked to by our platform infringes upon any copyright you own, you may submit a formal notification (DMCA request) to our designated email below. We reserve the right to file similar DMCA Takedown requests against any third-party hosts or indexing sites hosting cloned copies of our codebase or visual style.
            </p>
          </div>
        </div>

        {/* Contact info footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.05] text-center">
          <p className="text-sm text-slate-400">
            If you have any questions or require clarification regarding these Terms, contact us:
          </p>
          <a
            href="mailto:rishi18022005@gmail.com"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-all font-mono text-xs font-bold"
          >
            rishi18022005@gmail.com
          </a>
        </div>
      </main>
    </div>
  )
}
