'use client'

import Head from 'next/head'

export default function PWAMetaTags() {
  return (
    <Head>
      {/* Métadonnées PWA pour iOS - forcées sur toutes les pages */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="ZTVPlus" />
      <meta name="application-name" content="ZTVPlus" />
      <meta name="theme-color" content="#000000" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Icônes pour iOS */}
      <link rel="apple-touch-icon" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="57x57" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/favicon.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      
      {/* Image de démarrage pour iOS */}
      <link rel="apple-touch-startup-image" href="/favicon.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Icône générale */}
      <link rel="icon" href="/favicon.png" />
      <link rel="shortcut icon" href="/favicon.png" />
    </Head>
  )
}