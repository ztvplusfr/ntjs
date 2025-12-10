'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function SessionDebugPage() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookies(document.cookie)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Session</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p className="text-sm">Status: {status}</p>
          <p className="text-sm">Session: {session ? 'Found' : 'Not found'}</p>
          {session && (
            <div className="mt-2">
              <p className="text-sm">User ID: {session.user?.id}</p>
              <p className="text-sm">Name: {session.user?.name}</p>
              <p className="text-sm">Email: {session.user?.email}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <pre className="text-xs whitespace-pre-wrap break-all">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Agent</h2>
          <p className="text-xs">{typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
