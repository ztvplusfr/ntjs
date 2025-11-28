'use client'

import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'

const PathnameContext = createContext<{
  pathname: string
  isHomePage: boolean
}>({
  pathname: '',
  isHomePage: false,
})

export function usePathnameContext() {
  return useContext(PathnameContext)
}

export default function PathnameProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  return (
    <PathnameContext.Provider value={{ pathname, isHomePage }}>
      {children}
    </PathnameContext.Provider>
  )
}
