'use client'

import { useEffect } from 'react'
import Head from 'next/head'

interface PageHeadProps {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'movie' | 'series'
  releaseDate?: string
  genres?: string[]
  duration?: string
}

export default function PageHead({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'movie',
  releaseDate,
  genres,
  duration
}: PageHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', description)
    if (keywords) updateMetaTag('keywords', keywords)

    // Open Graph meta tags
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:url', url || window.location.href)
    updateMetaTag('og:site_name', 'ZTVPlus - Streaming Platform')
    updateMetaTag('og:locale', 'fr_FR')
    updateMetaTag('og:type', type === 'movie' ? 'video.movie' : 'video.tv_show')
    
    if (image) {
      updateMetaTag('og:image', image)
      updateMetaTag('og:image:alt', `${title} - Poster officiel`)
      updateMetaTag('og:image:width', '500')
      updateMetaTag('og:image:height', '750')
    }

    // Additional Open Graph tags
    if (releaseDate) updateMetaTag('og:release_date', releaseDate)
    if (duration) updateMetaTag('og:duration', duration)
    if (genres && genres.length > 0) updateMetaTag('og:tags', genres.join(','))

    // Twitter meta tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    if (image) updateMetaTag('twitter:image', image)

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url || window.location.href)
  }, [title, description, keywords, image, url, type, releaseDate, genres, duration])

  return null
}
