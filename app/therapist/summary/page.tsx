'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Session {
  id: string
  time: string
  service: string
  price: number
}

export default function TherapistSummary() {
  const router = useRouter()
  const [sessions] = useState<Session[]>([
    { id: '1', time: '11:05', service: 'Thai 400', price: 400 },
    { id: '2', time: '13:10', service: 'Foot 300', price: 300 },
    { id: '3', time: '16:20', service: 'Oil 500', price: 500 },
  ])

  const totalEarned = sessions.reduce((sum, s) => sum + s.price, 0)
  const totalSessions = sessions.length
  const avgPerSession = totalSessions > 0 ? Math.round(totalEarned / totalSessions) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Today's Stats</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Earned:</span>
              <span className="text-xl font-bold text-brand-green-600">
                {totalEarned.toLocaleString()} THB
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Sessions:</span>
              <span className="text-lg font-semibold text-gray-800">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg per session:</span>
              <span className="text-lg font-semibold text-gray-800">
                {avgPerSession.toLocaleString()} THB
              </span>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">History List</h2>
          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm font-medium">{session.time}</span>
                    <span className="text-gray-800 font-medium">{session.service}</span>
                  </div>
                  <span className="text-gray-700 font-semibold">{session.price} THB</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sessions today</p>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/therapist/home')}
          className="w-full bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

