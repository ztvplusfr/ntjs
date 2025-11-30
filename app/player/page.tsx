import { Metadata } from 'next'
import PlayerClient from './client'

export const metadata: Metadata = {
  title: 'Player Test - ZTVPlus',
  description: 'Test du lecteur vidéo optimisé pour tous les appareils',
}

export default function PlayerPage() {
  return <PlayerClient />
}
