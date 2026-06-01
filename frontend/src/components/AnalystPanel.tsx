'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Send, X, Activity, Zap, RefreshCw, MessageSquare } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

interface Message { id: string; role: 'user' | 'assistant'; content: string; mode: 'analyst' | 'hype' }

const SUGGESTED = [
  'How is my club doing this season?',
  'What was our biggest win?',
  'Show me our recent form.',
  'Who is our top scorer?',
]

/**
 * Slide-out chat panel anchored to the right edge of the viewport.
 * Replaces the standalone /chat route. Mounted globally; visibility controlled
 * by parent (Sidebar toggles it via the Chat nav icon).
 */
export function AnalystPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'analyst' | 'hype'>('analyst')
  const [userId, setUserId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lazy-load session + history when first opened
  useEffect(() => {
    if (!open || userId !== null) return
    const init = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: true })
      if (history && history.length > 0) {
        setMessages(history.map(m => ({
          id: m.id.toString(),
          role: m.role,
          content: m.content,
          mode: m.mode || 'analyst',
        })))
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          mode: 'analyst',
          content: "What would you like to know? I can dig into your club's results, standings, head-to-head, and season history — every answer grounded in real data.",
        }])
      }
    }
    init()
  }, [open, userId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !userId) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, mode }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content: userMsg.content, mode })
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: userMsg.content, mode }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      await supabase.from('chat_messages').insert({ user_id: userId, role: 'assistant', content: data.response, mode })
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, mode }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        mode,
        content: "Couldn't reach Club IQ. Check the backend is running.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!userId) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.from('chat_messages').delete().eq('user_id', userId)
    setMessages([{ id: 'cleared', role: 'assistant', mode: 'analyst', content: 'History cleared. What next?' }])
  }

  return (
    <>
      {/* No backdrop — the parent wrapper reflows content to make room, so dimming is unnecessary. */}

      {/* Panel — frosted glass, matches sidebar treatment */}
      <aside
        className={`app-shell fixed top-0 right-0 bottom-0 z-50
                    w-full sm:w-[460px] max-w-[460px]
                    flex flex-col
                    transition-transform duration-200 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{
          background: 'rgba(8, 14, 24, 0.65)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), -20px 0 60px -20px rgba(0,0,0,0.6)',
        }}
        aria-hidden={!open}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-accent-emerald/12 border border-accent-emerald/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent-emerald" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold text-white">Club IQ</div>
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/40 mt-0.5">your club · grounded in data</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={clearHistory}
              className="w-9 h-9 rounded-md text-white/45 hover:text-red-400 hover:bg-red-400/[0.08]
                         flex items-center justify-center transition-colors"
              title="Clear history"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-md text-white/45 hover:text-white hover:bg-white/[0.06]
                         flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/[0.05] shrink-0">
          <ModeBtn active={mode === 'analyst'} onClick={() => setMode('analyst')} icon={<Activity className="w-3.5 h-3.5" />}>Analyst</ModeBtn>
          <ModeBtn active={mode === 'hype'} onClick={() => setMode('hype')} icon={<Zap className="w-3.5 h-3.5" />}>Hype</ModeBtn>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0" data-lenis-prevent>
          {messages.map(msg => (
            <MsgBubble key={msg.id} msg={msg} />
          ))}
          {loading && <TypingDots mode={mode} />}
          <div ref={endRef} />
        </div>

        {/* Suggestions (only when chat is fresh) */}
        {messages.length <= 1 && !loading && (
          <div className="px-5 pb-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-[12.5px] text-white/65 bg-white/[0.04] border border-white/[0.06]
                             hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white
                             rounded-full px-3 py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-white/[0.05] shrink-0">
          <div className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask Club IQ about your club… (${mode})`}
              disabled={loading || !userId}
              className="w-full bg-ink-2 border border-white/[0.06] rounded-md
                         text-[15px] text-white placeholder-white/30
                         px-3.5 py-3 pr-11
                         focus:outline-none focus:border-accent-emerald/35
                         disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || !userId}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                !input.trim() || loading || !userId
                  ? 'text-white/25'
                  : mode === 'analyst'
                    ? 'bg-accent-emerald/15 text-accent-emerald hover:bg-accent-emerald/25'
                    : 'bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

function ModeBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
        active
          ? 'bg-accent-emerald/12 text-accent-emerald border border-accent-emerald/25'
          : 'text-white/55 hover:text-white hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function MsgBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm px-3.5 py-2.5 text-[14.5px] leading-relaxed
                        bg-accent-emerald/15 border border-accent-emerald/20 text-white"
             style={{ whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start gap-2.5">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
        msg.mode === 'analyst' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-amber/10 text-accent-amber'
      }`}>
        {msg.mode === 'analyst' ? <Activity className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
      </div>
      <div className="max-w-[85%] rounded-lg rounded-tl-sm px-3.5 py-2.5 text-[14.5px] leading-relaxed
                      bg-ink-2 border border-white/[0.06] text-white/90"
           style={{ whiteSpace: 'pre-wrap' }}>
        {msg.content}
      </div>
    </div>
  )
}

function TypingDots({ mode }: { mode: 'analyst' | 'hype' }) {
  const dotColor = mode === 'analyst' ? 'bg-accent-emerald' : 'bg-accent-amber'
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
        mode === 'analyst' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-amber/10 text-accent-amber'
      }`}>
        {mode === 'analyst' ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Zap className="w-3.5 h-3.5 animate-pulse" />}
      </div>
      <div className="bg-ink-2 border border-white/[0.06] rounded-lg rounded-tl-sm px-3.5 py-2.5 flex gap-1.5 items-center">
        <span className={`w-2 h-2 rounded-full animate-bounce ${dotColor}`} style={{ animationDelay: '0ms' }} />
        <span className={`w-2 h-2 rounded-full animate-bounce ${dotColor}`} style={{ animationDelay: '150ms' }} />
        <span className={`w-2 h-2 rounded-full animate-bounce ${dotColor}`} style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
