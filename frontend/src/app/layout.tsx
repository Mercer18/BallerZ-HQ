import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

// ── Design-system fonts (BallerZ V3 — editorial premium) ──
// Hanken Grotesk = UI / body (--font-sans → Tailwind `font-sans`, spec's --fb)
const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

// Fraunces = display / serif accents & numbers (--font-serif → `font-serif`, spec's --fd)
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
})

// JetBrains Mono = terminal labels / kbd
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'BallerZ HQ | Your Club, Every Number',
  description: 'Personalised football intelligence built on fifteen seasons of Europe\'s top five leagues. Standings, head-to-heads, club deep-dives, and Club IQ — an AI analyst grounded in real data.',
  keywords: 'football, soccer, premier league, la liga, serie a, bundesliga, ligue 1, Club IQ, AI analyst, standings, head to head, stats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-white selection:bg-accent-emerald/30">
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  )
}
