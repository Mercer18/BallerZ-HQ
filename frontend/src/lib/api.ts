/**
 * Shared client for the FastAPI backend.
 *
 * Built around the Render free-tier cold start: a sleeping backend can take
 * ~40-60s to wake, and Render *holds* the request open during that boot rather
 * than rejecting it. So we:
 *   1. signal a global "waking up" state if a request is still pending after a
 *      short wait (so the UI can reassure the user),
 *   2. keep the request alive up to a generous ceiling (let the boot finish —
 *      never abort an in-flight cold start early),
 *   3. retry only on a *genuine* failure (network error / 5xx), with a short
 *      backoff. A slow cold start is not a failure, so it is not retried.
 */

export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

const WAKING_AFTER_MS = 5_000 // reveal the "waking up" banner if still pending after this
const CEILING_MS = 60_000 // abandon a request after this (a cold boot has had ample time)
const RETRY_BACKOFF_MS = 1_500 // pause before retrying a genuinely failed request

// ── Global "server is waking" signal ─────────────────────────────────────────
// A counter of in-flight requests that have crossed WAKING_AFTER_MS. The banner
// subscribes via onWakingChange and shows while the count is > 0.
let wakingCount = 0
const wakingListeners = new Set<(waking: boolean) => void>()

function setWaking(delta: number) {
  wakingCount = Math.max(0, wakingCount + delta)
  const waking = wakingCount > 0
  wakingListeners.forEach((fn) => fn(waking))
}

/** Subscribe to the global "waking up" state. Returns an unsubscribe fn. */
export function onWakingChange(cb: (waking: boolean) => void): () => void {
  wakingListeners.add(cb)
  cb(wakingCount > 0) // emit current state immediately on subscribe
  return () => {
    wakingListeners.delete(cb)
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** retries on genuine failure (network error / 5xx). Default 1. */
  retries?: number
  /** override the per-request ceiling, in ms. */
  ceilingMs?: number
}

/**
 * fetch() wrapper that understands cold starts. Pass a path (e.g. "/api/...")
 * and it prefixes the backend origin; pass a full URL and it's used as-is.
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { retries = 1, ceilingMs = CEILING_MS, ...init } = options
  const url = path.startsWith('http') ? path : `${BACKEND}${path}`

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    let signalledWaking = false
    const wakingTimer = setTimeout(() => {
      signalledWaking = true
      setWaking(1)
    }, WAKING_AFTER_MS)
    const ceilingTimer = setTimeout(() => controller.abort(), ceilingMs)

    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      // 5xx on a non-final attempt → likely a boot hiccup, retry. Client errors pass through.
      if (res.status >= 500 && attempt < retries) {
        lastError = new Error(`HTTP ${res.status}`)
        continue
      }
      return res
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS))
      }
    } finally {
      clearTimeout(wakingTimer)
      clearTimeout(ceilingTimer)
      if (signalledWaking) setWaking(-1)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}
