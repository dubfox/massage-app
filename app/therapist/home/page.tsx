'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, CheckCircle2 } from 'lucide-react'
import { useTherapistStatus } from '@/contexts/TherapistStatusContext'

interface Session {
  id: string
  time: string
  service: string
  price: number
}

interface TherapistData {
  name: string
  certifiedServices?: string[]
  commissionRate?: number
}

// Mock therapist data - in real app, this would come from backend
const therapistsData: TherapistData[] = [
  { name: 'Lisa', certifiedServices: ['1', '2', '3', '4'], commissionRate: 50 },
  { name: 'Sarah', certifiedServices: ['1', '2', '5', '6'], commissionRate: 50 },
  { name: 'Emma', certifiedServices: ['3', '4', '7'], commissionRate: 45 },
  { name: 'Maya', certifiedServices: ['1', '2', '3', '4', '5', '6'], commissionRate: 50 },
  { name: 'Anna', certifiedServices: ['1', '8'], commissionRate: 50 },
]

// Available services - in real app, this would come from Services Management
const availableServices = [
  { id: '1', name: 'Thai', price: 400 },
  { id: '2', name: 'Foot', price: 300 },
  { id: '3', name: 'Oil', price: 500 },
  { id: '4', name: 'Aroma', price: 350 },
  { id: '5', name: 'Hot Oil', price: 450 },
  { id: '6', name: 'Herbal', price: 400 },
  { id: '7', name: 'Sport', price: 500 },
  { id: '8', name: 'Back', price: 350 },
]

export default function TherapistHome() {
  const router = useRouter()
  const { logoutTherapist, isLoggedIn } = useTherapistStatus()
  const [therapistName, setTherapistName] = useState('')
  const [certifiedServices, setCertifiedServices] = useState<Array<{ id: string; name: string; price: number }>>([])
  
  useEffect(() => {
    // Get therapist name from session storage
    const stored = sessionStorage.getItem('currentTherapist')
    if (stored) {
      setTherapistName(stored)
      
      // Find therapist data and get certified services
      const therapistInfo = therapistsData.find(t => t.name === stored)
      if (therapistInfo?.certifiedServices) {
        const services = availableServices.filter(service => 
          therapistInfo.certifiedServices?.includes(service.id)
        )
        setCertifiedServices(services)
      }
    } else {
      // If no therapist in session, redirect to login
      router.push('/therapist/login')
    }
  }, [router])
  
  // Full logout: clock out and remove from queue
  const handleLogout = () => {
    if (therapistName) {
      logoutTherapist(therapistName)
      sessionStorage.removeItem('currentTherapist')
    }
    router.push('/therapist/login')
  }

  // Close kiosk UI but keep therapist clocked in / in queue
  const handleCloseUI = () => {
    sessionStorage.removeItem('currentTherapist')
    router.push('/therapist/login')
  }
  const [sessions] = useState<Session[]>([
    { id: '1', time: '11:05', service: 'Thai 400', price: 400 },
    { id: '2', time: '13:10', service: 'Foot 300', price: 300 },
    { id: '3', time: '16:20', service: 'Oil 500', price: 500 },
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const totalSessions = sessions.length
  const totalEarned = sessions.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hi, {therapistName}!</h1>
            <p className="text-lg text-gray-600">Today: {today}</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        {/* Status Badge */}
        {therapistName && isLoggedIn(therapistName) && (
          <div className="bg-brand-green-100 border-4 border-brand-green-300 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-4 h-4 bg-brand-green-500 rounded-full animate-pulse"></div>
              <span className="text-brand-green-800 font-bold text-xl">Clocked In - Active in Queue</span>
            </div>
            <p className="text-base text-brand-green-700 mt-2">
              Sessions will be assigned by the manager
            </p>
          </div>
        )}

        {/* Clock Out / Check Out Button - removes from queue */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-8 px-6 rounded-xl text-3xl transition-colors shadow-xl active:scale-95 flex items-center justify-center gap-3"
        >
          <LogOut className="w-8 h-8" />
          Clock Out / Check Out
        </button>

        {/* Close Screen Button - keeps therapist clocked in */}
        <button
          onClick={handleCloseUI}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-6 px-6 rounded-xl text-2xl transition-colors shadow-md border-2 border-gray-300 flex items-center justify-center gap-3"
        >
          Close Screen (Stay Clocked In)
        </button>

        {/* Certified Services */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-brand-green-600" />
            My Certified Services
          </h2>
          {certifiedServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certifiedServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-brand-green-50 border-2 border-brand-green-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-lg text-gray-800">{service.name}</span>
                  </div>
                  <span className="font-semibold text-xl text-brand-green-700">
                    {service.price.toLocaleString()} THB
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 text-lg">
              No certified services assigned. Please contact your manager.
            </p>
          )}
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-xl text-gray-600">Sessions:</span>
              <span className="font-bold text-2xl text-gray-800">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-gray-100 pt-4">
              <span className="text-xl text-gray-600">Total:</span>
              <span className="font-bold text-2xl text-brand-green-600">{totalEarned.toLocaleString()} THB</span>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Sessions</h2>
          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-3 border-b-2 border-gray-100 last:border-0"
                >
                  <div>
                    <span className="text-gray-500 text-lg">{session.time}</span>
                    <span className="ml-4 text-gray-800 font-semibold text-lg">{session.service}</span>
                  </div>
                  <span className="text-gray-700 font-bold text-xl">{session.price} THB</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6 text-lg">No sessions today</p>
            )}
          </div>
        </div>

        {/* View Summary Link */}
        <Link
          href="/therapist/summary"
          className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-6 rounded-xl text-center border-2 border-gray-300 transition-colors text-lg"
        >
          View Daily Summary
        </Link>
      </div>
    </div>
  )
}

