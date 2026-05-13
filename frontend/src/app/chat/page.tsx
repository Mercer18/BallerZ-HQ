'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Send, Activity, Zap, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: 'analyst' | 'hype'
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'analyst' | 'hype'>('analyst')
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const initChat = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      // Check if user has completed onboarding
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!prefs) {
        router.push('/onboarding')
        return
      }

      // Fetch chat history
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: true })

      if (history && history.length > 0) {
        setMessages(history.map(msg => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          mode: msg.mode || 'analyst'
        })))
      } else {
        // Initial welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Welcome to BallerZ HQ. I have access to your club's latest stats, predictions, and upcoming fixtures. What would you like to know?",
          mode: 'analyst'
        }])
      }
    }

    initChat()
  }, [router])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !userId) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      mode
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // 1. Save user message to DB
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'user',
        content: userMsg.content,
        mode: mode
      })

      // 2. Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userMsg.content,
          mode: mode
        })
      })

      if (!response.ok) throw new Error('API request failed')
      
      const data = await response.json()
      
      // 3. Save assistant message
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: data.response,
        mode: mode
      })

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        mode
      }

      setMessages(prev => [...prev, assistantMsg])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect to the backend. Please ensure the FastAPI server is running.",
        mode
      }
      setMessages(prev => [...prev, errorMsg])
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
    setMessages([{
      id: "welcome_new",
      role: 'assistant',
      content: "Chat history cleared. How can I help you today?",
      mode: 'analyst'
    }])
  }

  return (
    <div className="page-container h-[calc(100vh-4rem)] min-h-0 overflow-hidden hero-gradient-bg">
      <main className="content-container flex flex-col h-full pt-6 pb-6">
        
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-dark-900/50 backdrop-blur-md p-4 rounded-t-2xl border border-white/10 mb-[-1px] z-10 relative">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="bg-primary-500/20 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Intelligence Chat</h1>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
            {/* Mode Toggle */}
            <div className="flex bg-dark-950 rounded-lg p-1 border border-white/5 shadow-inner">
              <button
                onClick={() => setMode('analyst')}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                  mode === 'analyst'
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Activity className="w-4 h-4 mr-2" />
                Analyst
              </button>
              <button
                onClick={() => setMode('hype')}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                  mode === 'hype'
                    ? 'bg-accent-600 text-white shadow-glow-accent'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                Hype
              </button>
            </div>

            <button 
              onClick={clearHistory}
              title="Clear History"
              className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-dark-800/80 backdrop-blur-md border border-white/10 p-6 space-y-6 custom-scrollbar flex flex-col min-h-0">
          
          {/* Default notice */}
          {(!process.env.NEXT_PUBLIC_GROQ_KEY && !process.env.NEXT_PUBLIC_OPENAI_KEY) && messages.length <= 1 && (
             <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-lg flex items-center justify-center text-sm w-max mx-auto shadow-glass-sm animate-fade-in-up">
              <AlertCircle className="w-4 h-4 mr-2" />
              Running in local fallback mode (no API key configured).
            </div>
          )}

          <div className="flex-1 space-y-6 flex flex-col justify-end">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up mt-auto`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 shadow-glass-sm border ${
                    msg.mode === 'analyst' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                  }`}>
                    {msg.mode === 'analyst' ? <Activity className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-glass-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm border border-primary-500'
                      : 'bg-dark-900 border border-white/5 text-gray-200 rounded-tl-sm font-sans'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${
                    mode === 'analyst' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                  }`}>
                    {mode === 'analyst' ? <Activity className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4 animate-pulse" />}
                  </div>
                <div className="bg-dark-900 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-2 items-center">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'analyst' ? 'bg-primary-400' : 'bg-accent-400'}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'analyst' ? 'bg-primary-400' : 'bg-accent-400'}`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'analyst' ? 'bg-primary-400' : 'bg-accent-400'}`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-dark-900/80 backdrop-blur-md p-4 rounded-b-2xl border border-white/10 border-t-0 relative z-10">
          <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask BallerZ HQ about your team... (${mode === 'analyst' ? 'Tactical' : 'Hype'} Mode)`}
              className="w-full bg-dark-950 border border-white/10 rounded-full pl-6 pr-14 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`absolute right-2 p-2.5 rounded-full transition-all duration-300 ${
                !input.trim() || loading
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : mode === 'analyst' ? 'bg-primary-600 text-white shadow-glow hover:bg-primary-500' : 'bg-accent-600 text-white shadow-glow-accent hover:bg-accent-500'
              }`}
            >
              <Send className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-xs text-gray-600">AI responses are built from live database queries for your specific club.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
