'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

export default function ReCaptchaWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Désactiver reCAPTCHA en développement local
  const isDevelopment = process.env.NODE_ENV === 'development'
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  // En développement, retourner les enfants sans reCAPTCHA
  if (isDevelopment || !siteKey) {
    return <>{children}</>
  }

  // En production, utiliser reCAPTCHA
  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  )
}
