'use client'

import { useState, useEffect } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isAnniversary, setIsAnniversary] = useState(false)
  const [userTimezone, setUserTimezone] = useState('')

  useEffect(() => {
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(timezone)

    // Target date: December 10th, 2025 at 00:00 UTC
    const targetDate = new Date('2025-12-10T00:00:00Z')
    
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()
      
      if (difference <= 0) {
        // Check if it's still the anniversary day (within 24 hours)
        const dayAfter = new Date('2025-12-11T00:00:00Z')
        if (now.getTime() < dayAfter.getTime()) {
          setIsAnniversary(true)
        } else {
          setIsAnniversary(false)
        }
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        }
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      
      return { days, hours, minutes, seconds }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [])

  // Format target date in user's local timezone
  const getLocalTargetDate = () => {
    const targetDate = new Date('2025-12-10T00:00:00Z')
    return targetDate.toLocaleString('fr-FR', {
      timeZone: userTimezone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isAnniversary) {
    return (
      <div className="relative bg-black">
        {/* Background layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Content */}
        <div className="relative py-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-sky-500/20 via-blue-600/10 to-cyan-500/20 backdrop-blur-md rounded-2xl p-8 border border-sky-400/30 shadow-lg shadow-sky-500/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                🎉 <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">Joyeux 3ème Anniversaire</span> ZTVPlus ! 🎉
              </h2>
              <p className="text-xl text-white/90 mb-2">
                3 ans de streaming et d'émotions !
              </p>
              <p className="text-lg text-white/80">
                Merci pour votre fidélité • <span className="text-sky-300">{userTimezone}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <div className="relative bg-black">
        {/* Background layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

        {/* Content */}
        <div className="relative py-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-emerald-500/20 via-green-600/10 to-teal-500/20 backdrop-blur-md rounded-2xl p-8 border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                🎉 <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Joyeux Anniversaire ZTVPlus !</span> 🎉
              </h2>
              <p className="text-xl text-white/90 mb-2">
                3 ans de streaming et d'émotions !
              </p>
              <p className="text-lg text-white/80">
                Merci pour votre fidélité • <span className="text-emerald-300">{userTimezone}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-black">
      {/* Background layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      
      {/* Content */}
      <div className="relative py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-gradient-to-br from-sky-500/20 via-blue-600/10 to-cyan-500/20 backdrop-blur-md rounded-2xl p-8 border border-sky-400/30 shadow-lg shadow-sky-500/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              🎂 <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">3 Ans de ZTVPlus Approchent !</span>
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Célébrons ensemble nos 3 ans de streaming
            </p>
            
            <div className="flex justify-center gap-3 md:gap-6 mb-6">
              <div className="bg-gradient-to-br from-sky-500/30 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 min-w-[70px] md:min-w-[100px] border border-sky-400/40 shadow-sm shadow-sky-500/10">
                <div className="text-2xl md:text-4xl font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs md:text-base text-sky-300">Jours</div>
              </div>
              <div className="bg-gradient-to-br from-sky-500/30 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 min-w-[70px] md:min-w-[100px] border border-sky-400/40 shadow-sm shadow-sky-500/10">
                <div className="text-2xl md:text-4xl font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs md:text-base text-sky-300">Heures</div>
              </div>
              <div className="bg-gradient-to-br from-sky-500/30 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 min-w-[70px] md:min-w-[100px] border border-sky-400/40 shadow-sm shadow-sky-500/10">
                <div className="text-2xl md:text-4xl font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs md:text-base text-sky-300">Minutes</div>
              </div>
              <div className="bg-gradient-to-br from-sky-500/30 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 min-w-[70px] md:min-w-[100px] border border-sky-400/40 shadow-sm shadow-sky-500/10">
                <div className="text-2xl md:text-4xl font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs md:text-base text-sky-300">Secondes</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-white/70 text-sm">
                📍 <span className="text-sky-300">{userTimezone}</span>
              </p>
              <p className="text-white/60 text-xs">
                {getLocalTargetDate()} (heure locale)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
