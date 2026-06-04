'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  History,
  ListOrdered,
  Swords,
  BarChart3,
  Users,
  Globe,
  MessageSquare,
  Crown,
  LogOut,
  Search as SearchIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { SearchOverlay } from '@/components/SearchOverlay'
import { AnalystPanel } from '@/components/AnalystPanel'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import { EliteBackground } from '@/components/EliteBackground'
import { CustomCursor } from '@/components/CustomCursor'

/**
 * Left app-shell nav. Collapsible/expandable with full names visible when expanded.
 * Wraps children with dynamic padding so the middle content area reflows when
 * the sidebar or the right-side AI panel are toggled.
 *
 * Also paints a faint stadium wallpaper across all authed pages.
 * Renders pass-through on landing/login/signup/onboarding.
 */

const HIDE_ON = ['/', '/login', '/signup', '/onboarding']

const SIDEBAR_COLLAPSED = 76
const SIDEBAR_EXPANDED = 220
const PANEL_WIDTH = 460
const LS_KEY = 'ballerz_sidebar_collapsed'

// Chat is rendered separately as a floating top-right button, not in this list.
const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard',    icon: LayoutDashboard },
  { name: 'Matches',   href: '/matches',      icon: History },
  { name: 'Standings', href: '/standings',    icon: ListOrdered },
  { name: 'H2H',       href: '/head-to-head', icon: Swords },
  { name: 'Clubs',     href: '/clubs',        icon: BarChart3 },
  { name: 'Players',   href: '/players',      icon: Users },
  { name: 'World Cup', href: '/world-cup',    icon: Globe },
  { name: 'PRO',       href: '/premium',      icon: Crown },
]

export function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Restore collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {}
    setHydrated(true)
  }, [])

  // Check window size for mobile/tablet responsive views
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(LS_KEY, collapsed ? '1' : '0') } catch {}
  }, [collapsed, hydrated])

  // ⌘K / Ctrl+K shortcut for quick search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (HIDE_ON.includes(pathname)) return <>{children}</>

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      await supabase.from('chat_messages').delete().eq('user_id', session.user.id)
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED)
  const panelWidth = (isMobile || !panelOpen) ? 0 : PANEL_WIDTH


  return (
    <>
      {/* Elite background — stadium wallpaper + drifting emerald/amber blobs + scrim + cursor spotlight */}
      <EliteBackground />
      {/* Cinema-magnetic emerald dot + Liquid-frosted glass ring cursor */}
      <CustomCursor />

      {/* Mobile Top Header */}
      {isMobile && (
        <header
          className="fixed top-0 left-0 right-0 h-14 z-35 flex items-center justify-between px-4"
          style={{
            background: 'rgba(8, 14, 24, 0.8)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-md text-white/70 hover:text-white flex items-center justify-center hover:bg-white/[0.05]"
            title="Open navigation"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
            <AnimatedLogo size="sm" />
          </Link>
          <div className="w-10" />
        </header>
      )}

      {/* Backdrop for mobile sidebar */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-200"
        />
      )}

      {/* Sidebar — frosted glass shell */}
      <aside
        className="app-shell fixed left-0 top-0 bottom-0
                   flex flex-col py-4
                   transition-all duration-200 ease-out"
        style={{
          zIndex: isMobile ? 50 : 40,
          width: isMobile ? SIDEBAR_EXPANDED : sidebarWidth,
          transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          background: 'rgba(8, 14, 24, 0.65)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header row: brand + close button on mobile, or collapse toggle on desktop */}
        <div className={`flex items-center mb-5 ${collapsed && !isMobile ? 'justify-center' : 'justify-between px-3'}`}>
          <Link
            href="/dashboard"
            className="hover:opacity-90 transition-opacity"
            title="BallerZ HQ"
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
          >
            {collapsed && !isMobile
              ? <AnimatedLogo size="md" symbolOnly />
              : <AnimatedLogo size="md" />
            }
          </Link>
          {isMobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]
                         flex items-center justify-center transition-colors"
              title="Close navigation"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          ) : (
            !collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="w-8 h-8 rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]
                           flex items-center justify-center transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Collapse toggle when collapsed — separate row underneath brand (desktop only) */}
        {collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(false)}
            className="self-center w-10 h-8 rounded-md text-white/40 hover:text-white hover:bg-white/[0.05]
                       flex items-center justify-center transition-colors mb-3"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Quick Search trigger */}
        <NavRow
          collapsed={collapsed && !isMobile}
          icon={<SearchIcon className="w-5 h-5" />}
          label="Quick search"
          onClick={() => {
            setSearchOpen(true)
            if (isMobile) setMobileOpen(false)
          }}
        />

        {/* Divider */}
        <div className={`h-px bg-white/[0.06] my-3 ${collapsed && !isMobile ? 'w-10 self-center' : 'mx-3'}`} />

        {/* Nav items */}
        <nav className="flex flex-col flex-1 gap-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <NavRow
                key={item.name}
                href={item.href}
                collapsed={collapsed && !isMobile}
                active={active}
                icon={<Icon className="w-5 h-5" />}
                label={item.name}
                pro={item.name === 'PRO'}
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            )
          })}
        </nav>

        {/* Logout pinned at bottom */}
        <NavRow
          collapsed={collapsed && !isMobile}
          icon={<LogOut className="w-5 h-5" />}
          label="Logout"
          onClick={handleLogout}
          danger
        />
      </aside>

      {/* Floating Club IQ toggle — frosted glass pill with ping dot */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="app-shell fixed z-40
                     inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full
                     text-slate-200 text-[13px] font-medium
                     hover:text-white transition-all"
          style={{
            top: isMobile ? '10px' : '16px',
            right: isMobile ? '10px' : '16px',
            background: 'rgba(8, 14, 24, 0.65)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(16,185,129,0.30)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px -10px rgba(0,0,0,0.5)',
          }}
          title="Open Club IQ"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-70 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
          </span>
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>Club IQ</span>
        </button>
      )}

      {/* Content wrapper — pads for sidebar AND panel widths.
          Both the sidebar and the Analyst panel reflow the page (not overlay),
          so content always fits the visible viewport. */}
      <div
        className="transition-[padding] duration-200 ease-out min-h-screen"
        style={{
          paddingLeft: sidebarWidth,
          paddingRight: panelWidth,
          paddingTop: isMobile ? '56px' : '0px',
        }}
      >
        {children}
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenAnalyst={() => { setSearchOpen(false); setPanelOpen(true) }}
      />
      <AnalystPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}

/**
 * Single nav-list row. Renders as a Link when href is provided, otherwise a button.
 * Adapts layout based on collapsed state.
 */
function NavRow({
  href,
  active,
  collapsed,
  icon,
  label,
  hint,
  onClick,
  danger,
  pro,
}: {
  href?: string
  active?: boolean
  collapsed: boolean
  icon: React.ReactNode
  label: string
  hint?: string
  onClick?: () => void
  danger?: boolean
  pro?: boolean
}) {
  const base = `group relative flex items-center transition-colors
                ${collapsed ? 'self-center w-12 h-12 justify-center rounded-xl'
                            : 'mx-2 px-2.5 h-11 rounded-lg gap-3'}`

  const stateClasses = active
    ? (pro ? 'bg-accent-amber/[0.12] text-accent-amber' : 'bg-accent-emerald/12 text-accent-emerald')
    : danger
      ? 'text-white/55 hover:text-red-400 hover:bg-red-400/[0.07]'
      : pro
        ? 'text-accent-amber/75 hover:text-accent-amber hover:bg-accent-amber/[0.08]'
        : 'text-white/55 hover:text-white hover:bg-white/[0.05]'

  const content = (
    <>
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="text-[14px] font-medium whitespace-nowrap flex-1 truncate">
          {label}
        </span>
      )}
      {!collapsed && hint && (
        <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]
                       text-[11px] font-mono text-white/45 shrink-0">{hint}</kbd>
      )}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${pro ? 'bg-accent-amber' : 'bg-accent-emerald'}`}
          aria-hidden="true"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {collapsed && <NavTooltip label={label} hint={hint} />}
    </>
  )

  const className = `${base} ${stateClasses}`

  if (href) {
    return <Link href={href} className={className} title={collapsed ? label : undefined}>{content}</Link>
  }
  return <button onClick={onClick} className={className} title={collapsed ? label : undefined}>{content}</button>
}

function NavTooltip({ label, hint }: { label: string; hint?: string }) {
  return (
    <span
      className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-md
                 bg-ink-3 border border-white/[0.08] shadow-lg
                 text-[13px] font-medium text-white whitespace-nowrap
                 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                 transition-all duration-150 z-50"
    >
      {label}
      {hint && (
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]
                       text-[11px] font-mono text-white/60">{hint}</kbd>
      )}
    </span>
  )
}
