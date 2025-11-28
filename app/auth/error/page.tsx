'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Erreur lors de la création de la requête OAuth. Veuillez réessayer.'
      case 'OAuthCallback':
        return 'Erreur lors du callback OAuth. Vérifiez votre configuration Discord.'
      case 'OAuthCreateAccount':
        return 'Impossible de créer le compte. Veuillez réessayer.'
      case 'EmailCreateAccount':
        return 'Impossible de créer le compte avec cet email.'
      case 'Callback':
        return 'Erreur lors du callback. Veuillez réessayer.'
      case 'OAuthAccountNotLinked':
        return 'Ce compte Discord est déjà lié à un autre utilisateur.'
      case 'SessionRequired':
        return 'Vous devez être connecté pour accéder à cette page.'
      case 'Default':
        return 'Une erreur est survenue. Veuillez réessayer.'
      default:
        return `Erreur inconnue: ${error}`
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Erreur d'authentification</h1>
          <p className="text-lg mb-6">{getErrorMessage(error)}</p>
          
          <div className="space-y-4">
            <div className="bg-gray-900 rounded p-4">
              <h3 className="font-semibold mb-2">Code d'erreur:</h3>
              <code className="text-red-400">{error || 'Inconnu'}</code>
            </div>
            
            <div className="bg-gray-900 rounded p-4">
              <h3 className="font-semibold mb-2">Solutions possibles:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Vérifiez que votre application Discord est correctement configurée</li>
                <li>Assurez-vous que le redirect URI est correct</li>
                <li>Redémarrez votre serveur après avoir modifié .env.local</li>
                <li>Vérifiez que les identifiants Discord sont corrects</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <a 
                href="/auth/test" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Page de test
              </a>
              <a 
                href="/" 
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
