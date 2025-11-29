'use client'

import { useState } from 'react'

interface Image {
  url: string
  type: 'poster' | 'backdrop'
  alt: string
}

interface ImageGalleryProps {
  images: Image[]
  movieTitle: string
}

export default function ImageGallery({ images, movieTitle }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)

  const openLightbox = (image: Image) => {
    setSelectedImage(image)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  if (images.length === 0) return null

  return (
    <>
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1 h-8 bg-red-600 rounded-full"></div>
          <h2 className="text-3xl font-bold">Images</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className="relative aspect-[2/3] md:aspect-[3/2] lg:aspect-[2/3] group cursor-pointer overflow-hidden rounded-lg bg-gray-800 border border-white/20"
              onClick={() => openLightbox(image)}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 bg-black border border-white/20 rounded text-xs text-white">
                  {image.type === 'poster' ? 'Poster' : 'Backdrop'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={closeLightbox}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            <img
              src={selectedImage.url.replace('/w500', '/original')}
              alt={selectedImage.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center mt-4">
              <p className="text-white text-lg">{selectedImage.alt}</p>
              <p className="text-gray-400 text-sm">
                {selectedImage.type === 'poster' ? 'Poster' : 'Backdrop'} • {movieTitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
