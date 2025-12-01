'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Download } from 'lucide-react'

interface Session {
  id: string
  date: string
  service: string
  price: number
  commission: number
}

interface Totals {
  daily: { date: string; total: number; commission: number; sessions: number }
  weekly: { total: number; commission: number; sessions: number }
  monthly: { total: number; commission: number; sessions: number }
}

export default function TherapistPayout() {
  const params = useParams()
  const router = useRouter()
  const therapistId = params.id as string
  const therapistName = 'Lisa' // In real app, fetch from API
  const commissionRate = 50 // In real app, get from therapist profile

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Mock data - in real app, fetch from API
  const mockSessions: Session[] = [
    { id: '1', date: '2024-11-29', service: 'Thai 400', price: 400, commission: 200 },
    { id: '2', date: '2024-11-29', service: 'Foot 300', price: 300, commission: 150 },
    { id: '3', date: '2024-11-29', service: 'Oil 500', price: 500, commission: 250 },
    { id: '4', date: '2024-11-28', service: 'Thai 400', price: 400, commission: 200 },
    { id: '5', date: '2024-11-28', service: 'Aroma 350', price: 350, commission: 175 },
  ]

  const calculateTotals = (): Totals => {
    const today = new Date().toISOString().split('T')[0]
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const dailySessions = mockSessions.filter(s => s.date === selectedDate)
    const weeklySessions = mockSessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= startOfWeek
    })
    const monthlySessions = mockSessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= startOfMonth
    })

    return {
      daily: {
        date: selectedDate,
        total: dailySessions.reduce((sum, s) => sum + s.price, 0),
        commission: dailySessions.reduce((sum, s) => sum + s.commission, 0),
        sessions: dailySessions.length,
      },
      weekly: {
        total: weeklySessions.reduce((sum, s) => sum + s.price, 0),
        commission: weeklySessions.reduce((sum, s) => sum + s.commission, 0),
        sessions: weeklySessions.length,
      },
      monthly: {
        total: monthlySessions.reduce((sum, s) => sum + s.price, 0),
        commission: monthlySessions.reduce((sum, s) => sum + s.commission, 0),
        sessions: monthlySessions.length,
      },
    }
  }

  const totals = calculateTotals()
  const currentTotals = totals[period]

  const getSessionsForPeriod = () => {
    switch (period) {
      case 'daily':
        return mockSessions.filter(s => s.date === selectedDate)
      case 'weekly':
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        return mockSessions.filter(s => {
          const sessionDate = new Date(s.date)
          return sessionDate >= startOfWeek
        })
      case 'monthly':
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        return mockSessions.filter(s => {
          const sessionDate = new Date(s.date)
          return sessionDate >= startOfMonth
        })
      default:
        return []
    }
  }

  const handleExport = () => {
    // In real app, generate and download report
    alert('Exporting payout report...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/manager/therapists"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Payout & Totals</h1>
            <p className="text-sm text-gray-600">Therapist: {therapistName} ({commissionRate}% commission)</p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">View:</span>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    period === p
                      ? 'bg-brand-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {period === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-2 bg-brand-green-500 hover:bg-brand-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {currentTotals.total.toLocaleString()} THB
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Commission</h3>
              <TrendingUp className="w-5 h-5 text-brand-green-600" />
            </div>
            <p className="text-2xl font-bold text-brand-green-600">
              {currentTotals.commission.toLocaleString()} THB
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Sessions</h3>
              <Calendar className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {currentTotals.sessions}
            </p>
          </div>
        </div>

        {/* All Periods Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Periods Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-brand-blue-50 rounded-lg border border-brand-blue-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Daily</h3>
              <p className="text-xl font-bold text-gray-800">
                {totals.daily.commission.toLocaleString()} THB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totals.daily.sessions} sessions
              </p>
            </div>
            <div className="p-4 bg-brand-green-50 rounded-lg border border-brand-green-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Weekly</h3>
              <p className="text-xl font-bold text-gray-800">
                {totals.weekly.commission.toLocaleString()} THB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totals.weekly.sessions} sessions
              </p>
            </div>
            <div className="p-4 bg-brand-green-50 rounded-lg border border-brand-green-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Monthly</h3>
              <p className="text-xl font-bold text-gray-800">
                {totals.monthly.commission.toLocaleString()} THB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totals.monthly.sessions} sessions
              </p>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Session Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Service
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSessionsForPeriod().length > 0 ? (
                  getSessionsForPeriod().map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {session.service}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {session.price.toLocaleString()} THB
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-brand-green-600 text-right">
                        {session.commission.toLocaleString()} THB
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No sessions found for this period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-800">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">
                    {currentTotals.total.toLocaleString()} THB
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-brand-green-600 text-right">
                    {currentTotals.commission.toLocaleString()} THB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

