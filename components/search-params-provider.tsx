'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SearchParamsProviderProps {
  children: (searchParams: URLSearchParams) => React.ReactNode
}

export default function SearchParamsProvider({ children }: SearchParamsProviderProps) {
  const searchParams = useSearchParams()
  
  return <>{children(searchParams)}</>
}
