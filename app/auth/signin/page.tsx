'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleDiscordSignIn = async () => {
    setIsLoading(true)
    window.location.href = '/api/auth/discord'
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Se connecter</h2>
          <p className="mt-2 text-gray-400">Connectez-vous avec Discord</p>
        </div>
        
        <button
          onClick={handleDiscordSignIn}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Connexion...' : 'Se connecter avec Discord'}
        </button>
      </div>
    </div>
  )
}
