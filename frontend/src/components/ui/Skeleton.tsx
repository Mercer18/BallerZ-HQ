/**
 * Skeleton loader primitives.
 * Use to fill space while real data loads — feels faster than a spinner.
 */

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.04] rounded-lg animate-pulse ${className}`}
      aria-hidden
    />
  )
}

/** A row that looks like a match-list row but greyed-out. */
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`card !p-0 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <SkeletonBox className="h-3 w-20" />
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-7 w-16" />
          <SkeletonBox className="h-4 w-28" />
        </div>
        <SkeletonBox className="h-3 w-24 hidden md:block" />
      </div>
    </div>
  )
}

/** A grid of N skeleton rows. */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** A stat tile placeholder. */
export function SkeletonTile() {
  return (
    <div className="card text-center py-4 px-3">
      <SkeletonBox className="h-6 w-12 mx-auto mb-2" />
      <SkeletonBox className="h-2.5 w-16 mx-auto" />
    </div>
  )
}

/** A standings-table placeholder. */
export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="border-b border-white/[0.08] px-4 py-3 flex gap-4">
        <SkeletonBox className="h-3 w-4" />
        <SkeletonBox className="h-3 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/[0.02] last:border-0 px-4 py-3 flex items-center gap-4">
          <SkeletonBox className="h-3 w-4" />
          <SkeletonBox className="h-3.5 w-40" />
          <div className="ml-auto flex gap-3">
            {Array.from({ length: 5 }).map((__, j) => (
              <SkeletonBox key={j} className="h-3 w-6" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
