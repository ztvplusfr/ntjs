'use client'

import { useState, type ReactNode } from 'react'

const AD_SCRIPT_SRC = '//d1zhmd1pxxxajf.cloudfront.net/?dmhzd=1228481'
const AD_SCRIPT_ID = 'ntjs-ad-gate-script'
const AD_PAGE_URL = 'https://d1zhmd1pxxxajf.cloudfront.net/?dmhzd=1228481'

interface AdGateProps {
  children: ReactNode
  className?: string
  enabled?: boolean
}

export default function AdGate({ children, className, enabled = true }: AdGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hasInjectedScript, setHasInjectedScript] = useState(false)
  const [hasOpenedPage, setHasOpenedPage] = useState(false)

  if (!enabled) {
    return <div className={`relative ${className ?? ''}`}>{children}</div>
  }

  const openAd = () => {
    setIsUnlocked(true)

    if (!hasOpenedPage) {
      if (typeof window !== 'undefined') {
        window.open(AD_PAGE_URL, '_blank', 'noopener,noreferrer')
      }
      setHasOpenedPage(true)
    }

    if (hasInjectedScript) return

    if (typeof document === 'undefined') return

    const existingScript = document.getElementById(AD_SCRIPT_ID)
    if (existingScript) {
      setHasInjectedScript(true)
      return
    }

    const script = document.createElement('script')
    script.id = AD_SCRIPT_ID
    script.src = AD_SCRIPT_SRC
    script.dataset.cfasync = 'false'
    script.async = true
    document.body.appendChild(script)
    setHasInjectedScript(true)
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        className={`transition duration-200 ${isUnlocked ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
      >
        {children}
      </div>

      {!isUnlocked && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-lg border border-white/20 bg-black/90 p-6 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-white/60">
            Pour accéder au lecteur, vous devez d'abord ouvrir la publicité.
          </p>
          <p className="text-xs text-white/40">
            Ce script contourne certains bloqueurs de publicité et déclenche la pub officielle du site.
          </p>
          <button
            type="button"
            onClick={openAd}
            className="pointer-events-auto rounded-lg border border-white/40 bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Ouvrir la publicité
          </button>
        </div>
      )}
    </div>
  )
}
