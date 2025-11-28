'use client'

import { useState } from 'react'
import { Share2, Check, Facebook, Twitter, Link2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  url: string
  type: 'movie' | 'series'
  className?: string
}

export default function ShareButton({ title, url, type, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Regarde ${title} en streaming HD gratuit sur notre plateforme! ${type === 'movie' ? '🎬' : '📺'}`,
          url: url
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      setShowOptions(!showOptions)
    }
  }

  const handleFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleTwitterShare = () => {
    const text = `Regarde ${title} en streaming HD gratuit! ${type === 'movie' ? '#film #streaming' : '#serie #streaming'} 🍿`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={handleNativeShare}
        className={`flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors ${className || ''}`}
      >
        {copied ? (
          <>
            <Check size={18} />
            <span>Copié!</span>
          </>
        ) : (
          <>
            <Share2 size={18} />
            <span>Partager</span>
          </>
        )}
      </button>

      {/* Share Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="p-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded transition-colors"
            >
              <Link2 size={16} className="text-gray-400" />
              <span className="text-sm">Copier le lien</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded transition-colors"
            >
              <Facebook size={16} className="text-blue-500" />
              <span className="text-sm">Facebook</span>
            </button>

            {/* Twitter */}
            <button
              onClick={handleTwitterShare}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded transition-colors"
            >
              <Twitter size={16} className="text-sky-400" />
              <span className="text-sm">Twitter</span>
            </button>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  )
}
