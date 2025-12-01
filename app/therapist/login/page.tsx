'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTherapistStatus } from '@/contexts/TherapistStatusContext'
import LanguagePicker from '@/components/LanguagePicker'

// Mock therapist data for authentication - in real app, this would come from backend
const mockTherapists = [
  { name: 'Lisa', phone: '0812345678', pin: '1234' },
  { name: 'Sarah', phone: '0823456789', pin: '2345' },
  { name: 'Emma', phone: '0834567890', pin: '3456' },
  { name: 'Maya', phone: '0845678901', pin: '4567' },
  { name: 'Anna', phone: '0856789012', pin: '5678' },
]

export default function TherapistLogin() {
  const { t } = useLanguage()
  const { loginTherapist } = useTherapistStatus()
  const [idOrPhone, setIdOrPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Find therapist by phone or name
    const therapist = mockTherapists.find(
      t => t.phone === idOrPhone || t.name.toLowerCase() === idOrPhone.toLowerCase()
    )
    
    if (!therapist) {
      setError('Therapist not found')
      return
    }
    
    if (therapist.pin !== pin) {
      setError('Invalid PIN')
      return
    }
    
    // Log in the therapist (adds them to queue)
    loginTherapist(therapist.name)
    
    // Store current therapist in session storage for the home page
    sessionStorage.setItem('currentTherapist', therapist.name)
    
    // Redirect to home
    router.push('/therapist/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          {t('therapist.login.title')}
        </h1>
        <p className="text-xl text-center text-gray-600 mb-8">Clock In / Check In</p>
        
        {/* Test Credentials - For Testing Only */}
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Credentials:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {mockTherapists.map((therapist) => (
              <div key={therapist.name} className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-semibold text-base">{therapist.name}:</span>
                <span className="text-base">Phone: {therapist.phone} | PIN: {therapist.pin}</span>
              </div>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">
              {t('therapist.login.idPhone')}:
            </label>
            <input
              type="text"
              value={idOrPhone}
              onChange={(e) => setIdOrPhone(e.target.value)}
              className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-green-300 focus:border-brand-green-500"
              placeholder={t('therapist.login.idPhone')}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">
              {t('therapist.login.pin')}:
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-green-300 focus:border-brand-green-500"
              placeholder={t('therapist.login.pin')}
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-lg font-semibold">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-brand-green-500 hover:bg-brand-green-600 text-white font-bold py-6 px-6 rounded-xl text-2xl transition-colors shadow-lg active:scale-95"
          >
            ✓ Clock In / Check In
          </button>
        </form>

        {/* Public Display Link */}
        <div className="mt-8 text-center">
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            View Live Service Board
          </a>
          <p className="mt-1 text-xs text-gray-500">
            (For shop monitor display – shows queue and services without prices)
          </p>
        </div>
      </div>
    </div>
  )
}

