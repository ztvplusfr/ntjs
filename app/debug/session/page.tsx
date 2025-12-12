'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

export default function SessionDebugPage() {
  const { user, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSessionData(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Session</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">useAuth Hook:</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify({ user, loading }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Session API:</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
