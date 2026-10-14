import { useEffect, useState } from 'react'

export default function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* keep the current session usable */ }
  }, [key, value])

  return [value, setValue]
}
