import { useEffect, useState } from 'react'
import { AUTH_FLAG_KEY, readAuthFlag } from '@/lib/auth-flag'

export function useLocalAuthFlag() {
  const [isAuth, setIsAuth] = useState(() => readAuthFlag())

  useEffect(() => {
    const handle = () => setIsAuth(readAuthFlag())
    window.addEventListener('storage', handle)
    const interval = setInterval(handle, 1000)
    return () => {
      window.removeEventListener('storage', handle)
      clearInterval(interval)
    }
  }, [])

  return isAuth
}
