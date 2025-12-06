export const AUTH_FLAG_KEY = 'ztv-authenticated'

export function readAuthFlag(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_FLAG_KEY) === '1'
}

export function writeAuthFlag(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) {
    localStorage.setItem(AUTH_FLAG_KEY, '1')
  } else {
    localStorage.removeItem(AUTH_FLAG_KEY)
  }
}
