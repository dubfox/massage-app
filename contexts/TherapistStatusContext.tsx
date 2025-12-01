'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TherapistStatusContextType {
  loggedInTherapists: string[]
  loginTherapist: (therapistName: string) => void
  logoutTherapist: (therapistName: string) => void
  isLoggedIn: (therapistName: string) => boolean
}

const TherapistStatusContext = createContext<TherapistStatusContextType | undefined>(undefined)

export function TherapistStatusProvider({ children }: { children: ReactNode }) {
  const [loggedInTherapists, setLoggedInTherapists] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('loggedInTherapists')
    if (stored) {
      try {
        setLoggedInTherapists(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing loggedInTherapists from localStorage', e)
      }
    }
  }, [])

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('loggedInTherapists', JSON.stringify(loggedInTherapists))
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('therapistStatusChanged', { 
      detail: { loggedInTherapists } 
    }))
  }, [loggedInTherapists])

  const loginTherapist = (therapistName: string) => {
    setLoggedInTherapists(prev => {
      if (!prev.includes(therapistName)) {
        return [...prev, therapistName]
      }
      return prev
    })
  }

  const logoutTherapist = (therapistName: string) => {
    setLoggedInTherapists(prev => prev.filter(name => name !== therapistName))
  }

  const isLoggedIn = (therapistName: string) => {
    return loggedInTherapists.includes(therapistName)
  }

  return (
    <TherapistStatusContext.Provider value={{
      loggedInTherapists,
      loginTherapist,
      logoutTherapist,
      isLoggedIn,
    }}>
      {children}
    </TherapistStatusContext.Provider>
  )
}

export function useTherapistStatus() {
  const context = useContext(TherapistStatusContext)
  if (context === undefined) {
    throw new Error('useTherapistStatus must be used within a TherapistStatusProvider')
  }
  return context
}

