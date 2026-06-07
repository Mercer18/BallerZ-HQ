'use client'

import React from 'react'

type Size = 'sm' | 'md' | 'lg'

export function AnimatedLogo({
  size = 'sm',
  withSubtitle = false,
  symbolOnly = false,
}: {
  size?: Size
  withSubtitle?: boolean
  symbolOnly?: boolean
}) {
  // Brand scaling constraints
  const sizes = {
    sm: { width: 140, height: 36 },
    md: { width: 172, height: 44 },
    lg: { width: 280, height: 72 },
  }

  const { width, height } = sizes[size]

  if (symbolOnly) {
    // Collapsed sidebar logo - compact glowing emerald ball mark
    return (
      <div className="logo-anim flex items-center justify-center">
        <svg
          width={40}
          height={40}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-symbol drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]"
        >
          <defs>
            <linearGradient id="logo-grad-sym" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          {/* Hexagonal Tactical ball layout */}
          <path
            d="M22 3L39 13V31L22 41L5 31V13L22 3Z"
            stroke="url(#logo-grad-sym)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M22 3V13" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M5 13L15 19" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M39 13L29 19" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M15 19H29" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M15 19L22 31L29 19" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M22 31V41" stroke="url(#logo-grad-sym)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="logo-anim flex items-center" style={{ width, height }}>
      <svg
        viewBox="0 0 195 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none logo-image"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Tactical ball icon (left) */}
        <g transform="translate(4, 5)">
          <path
            d="M20 2L35 11V29L20 38L5 29V11L20 2Z"
            stroke="url(#logo-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M20 2V11" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 11L14 16" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M35 11L26 16" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 16H26" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 16L20 27L26 16" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 27V38" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Wordmark brand text */}
        <text
          x="50"
          y="31"
          fill="#FFFFFF"
          fontSize="23"
          fontWeight="800"
          fontFamily="var(--font-sans), sans-serif"
          letterSpacing="-0.03em"
          fontStyle="italic"
        >
          Baller<tspan fill="url(#logo-grad)">Z</tspan> <tspan fill="#10b981">HQ</tspan>
        </text>

        {/* Monospaced Subtitle if withSubtitle is true */}
        {withSubtitle && (
          <text
            x="50"
            y="43"
            fill="#8b97ac"
            fontSize="6.5"
            fontWeight="bold"
            fontFamily="var(--font-mono), monospace"
            letterSpacing="0.22em"
          >
            FOOTBALL INTELLIGENCE
          </text>
        )}
      </svg>
    </div>
  )
}
