'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

const HIDDEN_ON = ['/', '/login', '/signup', '/onboarding', '/chat']

export function FloatingChatButton() {
  const pathname = usePathname()
  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <Link
      href="/chat"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-surface border border-dashed border-accent-emerald/40 rounded-full pl-4 pr-5 py-3 shadow-glow hover:shadow-glow-lg hover:border-accent-emerald/60 transition-all duration-300 group"
      title="Ask Club IQ"
    >
      <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse-glow" />
      <span className="font-mono text-xs font-bold text-accent-emerald uppercase tracking-wider">
        Club IQ
      </span>
      <MessageSquare className="w-4 h-4 text-accent-emerald group-hover:scale-110 transition-transform" />
    </Link>
  )
}
