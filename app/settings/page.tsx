'use client'

import { useState, useEffect } from 'react'
import { Settings, Trash2, Info, Moon, Sun, Monitor, Globe, Volume2, Bell } from 'lucide-react'
import PageHead from '@/components/page-head'

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('fr')
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

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

  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      })
      alert('Cache et données locales vidés avec succès!')
      window.location.reload()
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />
      case 'dark':
        return <Moon size={20} />
      default:
        return <Monitor size={20} />
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
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-sky-400" />
              <h1 className="text-2xl font-bold">Paramètres</h1>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            
            {/* Appearance */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Monitor size={20} />
                Apparence
              </h2>
              
              <div className="space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Thème</p>
                    <p className="text-gray-400 text-sm">Choisissez l'apparence de l'interface</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateTheme('light')}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'light' 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title="Clair"
                    >
                      <Sun size={18} />
                    </button>
                    <button
                      onClick={() => updateTheme('dark')}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title="Sombre"
                    >
                      <Moon size={18} />
                    </button>
                    <button
                      onClick={() => updateTheme('system')}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'system' 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title="Système"
                    >
                      <Monitor size={18} />
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Globe size={16} />
                      Langue
                    </p>
                    <p className="text-gray-400 text-sm">Choisissez la langue de l'interface</p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => updateLanguage(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Series Preferences */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Préférences des séries</h2>
              
              <div className="space-y-4">
                {/* Filter persistence */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Filtre "Disponibles uniquement"</p>
                    <p className="text-gray-400 text-sm">Se souvenir de votre choix de filtre</p>
                  </div>
                  <button
                    onClick={() => updateFilter(!showAvailableOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showAvailableOnly ? 'bg-sky-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showAvailableOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Bell size={20} />
                Notifications
              </h2>
              
              <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Notifications push</p>
                    <p className="text-gray-400 text-sm">Recevoir des notifications de nouveaux épisodes</p>
                  </div>
                  <button
                    onClick={() => updateNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications ? 'bg-sky-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Volume2 size={16} />
                      Effets sonores
                    </p>
                    <p className="text-gray-400 text-sm">Jouer des sons pour les actions</p>
                  </div>
                  <button
                    onClick={() => updateSound(!sound)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sound ? 'bg-sky-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sound ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Cache Management */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Gestion du cache</h2>
              
              <button
                onClick={clearCache}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
              >
                <Trash2 size={20} />
                Vider le cache et les données locales
              </button>
              <p className="text-gray-500 text-sm mt-2">
                Supprime toutes les données locales, le cache et les cookies. La page se rechargera automatiquement.
              </p>
            </div>

            {/* App Information */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Info size={20} />
                Informations de l'application
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Application:</span>
                  <span className="text-white">ZTVPlus</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white">2.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Build:</span>
                  <span className="text-white">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Framework:</span>
                  <span className="text-white">Next.js 15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Navigateur:</span>
                  <span className="text-white">
                    {typeof window !== 'undefined' ? navigator.userAgent.split(' ').slice(-2)[0] : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plateforme:</span>
                  <span className="text-white">
                    {typeof window !== 'undefined' ? 
                      (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
