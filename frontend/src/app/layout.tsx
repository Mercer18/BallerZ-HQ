import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'BallerZ HQ | AI-Powered Football Intelligence',
  description: 'Your AI-powered football analytics platform. Get match predictions, team insights, and intelligent chatbot analysis for your favorite club.',
  keywords: 'football, soccer, AI, predictions, analytics, stats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-white selection:bg-primary-500/30">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
