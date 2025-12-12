'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Settings, Trash2, Info, Moon, Sun, Monitor, Globe, Volume2, Bell, Film, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import PageHead from '@/components/page-head'
import packageInfo from '../../package.json'

type ThemeValue = 'light' | 'dark' | 'system'

const themeOptions: { value: ThemeValue; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Par défaut' }
]

const themeLabelMap: Record<ThemeValue, string> = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Par défaut'
}

const timezoneLocations: Record<string, string> = {
  'Indian/Reunion': 'Île de la Réunion',
  'Europe/Paris': 'France métropolitaine',
  'America/New_York': 'États-Unis (NY)',
  'Europe/London': 'Royaume-Uni',
  'Asia/Tokyo': 'Japon',
  'Asia/Seoul': 'Corée du Sud',
  'Asia/Singapore': 'Singapour',
  'Asia/Hong_Kong': 'Hong Kong',
  'America/Sao_Paulo': 'Brésil',
  'America/Mexico_City': 'Mexique',
  'Australia/Sydney': 'Australie'
}

const locationAliases: Record<string, string> = {
  reunion: 'Île de la Réunion'
}

function resolveLocationLabel(value?: string) {
  if (!value) return 'Inconnu'
  const normalized = value.toLowerCase()
  const aliasEntry = Object.entries(locationAliases).find(([key]) =>
    normalized.includes(key)
  )
  if (aliasEntry) return aliasEntry[1]
  return value
}

export default function SettingsPage() {
  const { signOut } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('fr')
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [serverLocation, setServerLocation] = useState('Détection...')

  useEffect(() => {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ztv-theme') as 'light' | 'dark' | 'system' || 'system'
      const savedLanguage = localStorage.getItem('ztv-language') || 'fr'
      const savedNotifications = localStorage.getItem('ztv-notifications') === 'true'
      const savedSound = localStorage.getItem('ztv-sound') === 'true'
      const savedFilter = localStorage.getItem('ztv-series-filter-available') === 'true'
      
      setTheme(savedTheme)
      setLanguage(savedLanguage)
      setNotifications(savedNotifications)
      setSound(savedSound)
      setShowAvailableOnly(savedFilter)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const defaultLabel =
        timezoneLocations[timezone] || timezone.replace('_', ' ') || 'Inconnu'
      setServerLocation(resolveLocationLabel(defaultLabel))

      const fetchGeoLocation = async () => {
        try {
          const response = await fetch('https://ipapi.co/json', { cache: 'no-store' })
          if (!response.ok) return
          const payload = await response.json()
          const location =
            payload.country_name ||
            timezoneLocations[payload.timezone] ||
            payload.timezone
          if (location) {
            setServerLocation(resolveLocationLabel(location))
          }
        } catch (error) {
          console.error('Impossible de détecter le serveur via l\'IP', error)
        }
      }
      fetchGeoLocation()
    }

    // Charger la version depuis package.json
    if (packageInfo?.version) {
      setAppVersion(packageInfo.version)
    }
  }, [])

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-theme', newTheme)
      // Apply theme immediately
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
  }

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-language', newLanguage)
    }
  }

  const updateNotifications = (enabled: boolean) => {
    setNotifications(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-notifications', enabled.toString())
    }
  }

  const updateSound = (enabled: boolean) => {
    setSound(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-sound', enabled.toString())
    }
  }

  const updateFilter = (enabled: boolean) => {
    setShowAvailableOnly(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ztv-series-filter-available', enabled.toString())
    }
  }

  const updateApp = async () => {
    if (typeof window !== 'undefined') {
      try {
        const confirmed = confirm('Mettre à jour l\'application ? Cela va vider le cache et recharger la page.')
        if (!confirmed) return

        // Clear caches but keep auth
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }
        
        // Clear sessionStorage but keep localStorage auth
        sessionStorage.clear()
        
        // Clear only non-auth localStorage items
        const authToken = localStorage.getItem('auth-token')
        const keysToKeep = ['auth-token', 'ztv-theme', 'ztv-language', 'ztv-notifications', 'ztv-sound', 'ztv-series-filter-available']
        const allKeys = Object.keys(localStorage)
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key)
          }
        })
        
        alert('Application mise à jour ! La page va se recharger.')
        
        // Force reload with cache bypass
        window.location.reload()
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error)
        alert('Une erreur est survenue lors de la mise à jour. Veuillez réessayer.')
      }
    }
  }

  const clearCache = async () => {
    if (typeof window !== 'undefined') {
      try {
        const confirmed = confirm('Êtes-vous sûr de vouloir vider tout le cache et les cookies ? Cela vous déconnectera également.')
        if (!confirmed) return

        // Déconnexion avec notre système d'auth maison
        await signOut()
        
        // Nettoyer via l'API
        await fetch('/api/clean-auth', { method: 'POST' })
        
        // Clear localStorage
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          const cookie = c.trim()
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          
          const domains = ['', 'localhost', window.location.hostname]
          const paths = ['/', '/api', '/auth']
          
          domains.forEach(domain => {
            paths.forEach(path => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? ';domain=' + domain : ''}`
            })
          })
        })
        
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map(registration => registration.unregister()))
        }
        
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }
        
        alert('Cache, cookies et données locales vidés avec succès! Vous allez être redirigé.')
        
        // Force un rechargement complet sans cache
        window.location.replace('/')
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error)
        alert('Une erreur est survenue lors du nettoyage. Veuillez réessayer.')
      }
    }
  }

  return (
    <>
      <PageHead
        title="Paramètres | ZTVPlus"
        description="Gérez vos préférences et paramètres sur ZTVPlus"
        keywords="paramètres, préférences, configuration, ZTVPlus"
        image="/og-default.jpg"
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      <div className="min-h-screen bg-black text-white">
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Settings size={28} className="text-sky-400" />
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Paramètres</p>
                <h1 className="text-3xl font-bold">Préférences</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-black border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Préférences générales</h2>
                    <p className="text-sm text-gray-400">
                      Contrôlez votre expérience : thème, langue, notifications et filtres.
                    </p>
                  </div>
                  <div className="text-xs uppercase tracking-[0.4em] text-gray-400">
                    {themeLabelMap[theme]?.toUpperCase() ?? theme.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const isActive = theme === option.value
                    const Icon = option.value === 'light' ? Sun : option.value === 'dark' ? Moon : Monitor
                    const isDisabled = option.value !== 'system'
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (!isDisabled) updateTheme(option.value)
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border-sky-500 bg-sky-500/10 text-white'
                            : isDisabled
                            ? 'border-gray-700 bg-black/20 text-gray-500 cursor-not-allowed'
                            : 'border-gray-700 bg-black/30 text-gray-300 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em]">
                          <Icon size={16} />
                          <span>{option.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {option.value === 'system'
                            ? 'Synchronisé au système'
                            : option.value === 'light'
                            ? 'Claire et nette (bientôt)'
                            : 'Ambiance sombre (bientôt)'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="hidden sm:block">
                    <SettingToggle
                      icon={<Globe size={16} />}
                      label="Langue"
                      description="Langue de l’interface (bientôt)"
                      value="Bientôt"
                      action={() => {}}
                      disabled
                    />
                  </div>
                  <SettingToggle
                    icon={<Bell size={16} />}
                    label="Notifications"
                    description="Alertes et rappels (bientôt)"
                    value="Bientôt"
                    action={() => {}}
                    disabled
                    badgeText="Bientôt"
                  />
                  <div className="hidden sm:block">
                    <SettingToggle
                      icon={<Volume2 size={16} />}
                      label="Son"
                      description="Effets sonores (bientôt)"
                      value="Bientôt"
                      action={() => {}}
                      disabled
                    />
                  </div>
                  <SettingToggle
                    icon={<Film size={16} />}
                    label="Disponibles uniquement"
                    description="Filtrer les séries visibles"
                    value={showAvailableOnly ? 'Oui' : 'Non'}
                    action={() => updateFilter(!showAvailableOnly)}
                    active={showAvailableOnly}
                  />
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Mettre à jour l'application</h2>
                  <RefreshCw size={20} className="text-sky-400" />
                </div>
                <p className="text-sm text-gray-400">
                  Vide le cache et recharge l'application pour obtenir la dernière version. 
                  Vous restez connecté et vos préférences sont conservées.
                </p>
                <button
                  onClick={updateApp}
                  className="w-full rounded-2xl border border-sky-500/60 bg-sky-500/10 px-4 py-3 text-center text-sm font-medium text-sky-300 transition hover:bg-sky-500/20"
                >
                  Mettre à jour l'application
                </button>
              </div>

              <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Cache et données</h2>
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <p className="text-sm text-gray-400">
                  Réinitialise complètement vos préférences, cookies, cache et vous déconnecte de toutes les sessions. 
                  Cette action est irréversible et nettoiera toutes les données locales.
                </p>
                <button
                  onClick={clearCache}
                  className="w-full rounded-2xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Réinitialiser tout (cache, cookies, session)
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={20} className="text-amber-400" />
                  <h2 className="text-lg font-semibold">Info système</h2>
                </div>
                <InfoRow label="Application" value="ZTVPlus" />
                <InfoRow label="Version" value={appVersion || 'Chargement...'} />
                <InfoRow label="Build" value={new Date().toISOString().split('T')[0]} />
                <InfoRow label="Framework" value="Next.js 16" />
                <InfoRow
                  label="Navigateur"
                  value={
                    typeof navigator !== 'undefined'
                      ? navigator.userAgent.split(' ').slice(-2)[0]
                      : 'N/A'
                  }
                />
                <InfoRow label="Serveur" value={serverLocation} />
                <InfoRow
                  label="Plateforme"
                  value={
                    typeof navigator !== 'undefined'
                      ? navigator.userAgent.includes('Mobile')
                        ? 'Mobile'
                        : 'Desktop'
                      : 'N/A'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface SettingToggleProps {
  icon: ReactNode
  label: string
  description: string
  value: string
  action: () => void
  active?: boolean
  disabled?: boolean
  badgeText?: string
}

function SettingToggle({ icon, label, description, value, action, active, disabled, badgeText }: SettingToggleProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        action()
      }}
      className={`w-full flex flex-col gap-1 rounded-2xl border px-4 py-4 text-left transition ${
        disabled
          ? 'border-gray-700 bg-black/20 text-gray-500 cursor-not-allowed opacity-80'
          : active
          ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/20'
          : 'border-gray-700 bg-gray-900/60 hover:border-white/40'
      }`}
    >
      <div className="flex flex-col gap-1">
        {badgeText && (
          <span className="text-[9px] text-sky-500 uppercase tracking-[0.4em]">{badgeText}</span>
        )}
        <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-gray-400">
          <span className="flex items-center gap-2 text-white">
            {icon}
            {label}
          </span>
          <span className="text-xs text-gray-400">{value}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm text-gray-400">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </div>
  )
}
