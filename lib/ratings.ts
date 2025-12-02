export interface RatingInfo {
  code: string
  label: string
  description?: string
  mature?: boolean
}

const MAPPING: Record<string, RatingInfo> = {
  U: { code: 'U', label: 'Tous publics' },
  ALL: { code: 'ALL', label: 'Tous publics' },
  TP: { code: 'TP', label: 'Tous publics' },
  L: { code: 'L', label: 'Tous publics' },
  '10': { code: '10', label: 'À partir de 10 ans' },
  '12': { code: '12', label: 'À partir de 12 ans' },
  '13': { code: '13', label: 'À partir de 13 ans' },
  '14': { code: '14', label: 'À partir de 14 ans' },
  '16': { code: '16', label: 'À partir de 16 ans' },
  '18': { code: '18', label: 'Interdit -16 ans' },
  '12A': { code: '12A', label: 'À partir de 12 ans' },
  'PG-13': { code: 'PG-13', label: 'Interdit -13 ans' },
  PG: { code: 'PG', label: 'Déconseillé aux moins de 10 ans' },
  'TV-MA': {
    code: 'TV-MA',
    label: 'Mature Audience Only',
    description:
      'Contenu réservé aux adultes (17+). Peut contenir violence forte, sexualité explicite, langage très grossier et scènes sensibles.',
    mature: true,
  },
}

export function getRatingInfo(code: string | null | undefined): RatingInfo | null {
  if (!code) return null

  const normalized = code.trim().toUpperCase()
  if (MAPPING[normalized]) {
    return MAPPING[normalized]
  }

  if (/^\d+$/.test(normalized)) {
    return {
      code: normalized,
      label: `À partir de ${normalized} ans`,
    }
  }

  return {
    code: normalized,
    label: normalized,
  }
}
