'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Save } from 'lucide-react'

interface Shift {
  id: string
  day: string
  startTime: string
  endTime: string
  isActive: boolean
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ShiftAssignment() {
  const params = useParams()
  const router = useRouter()
  const therapistId = params.id as string
  const therapistName = 'Lisa' // In real app, fetch from API

  const [shifts, setShifts] = useState<Shift[]>(
    daysOfWeek.map((day, index) => ({
      id: `shift-${index}`,
      day,
      startTime: index < 5 ? '09:00' : '10:00', // Weekdays 9am, weekends 10am
      endTime: index < 5 ? '18:00' : '20:00', // Weekdays 6pm, weekends 8pm
      isActive: index < 5, // Active on weekdays by default
    }))
  )

  const handleShiftChange = (id: string, field: 'startTime' | 'endTime' | 'isActive', value: string | boolean) => {
    setShifts(shifts.map(shift =>
      shift.id === id ? { ...shift, [field]: value } : shift
    ))
  }

  const handleSave = () => {
    // In real app, save to backend
    console.log('Saving shifts:', shifts)
    alert('Shifts saved successfully!')
    router.push('/manager/therapists')
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
            <h1 className="text-xl font-bold text-gray-800">Assign Shifts</h1>
            <p className="text-sm text-gray-600">Therapist: {therapistName}</p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Schedule
            </h2>
            <p className="text-sm text-gray-600">
              Set working hours for each day of the week
            </p>
          </div>

          <div className="space-y-4">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  shift.isActive
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Day */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={shift.isActive}
                      onChange={(e) => handleShiftChange(shift.id, 'isActive', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label className="text-lg font-semibold text-gray-800 min-w-[120px]">
                      {shift.day}
                    </label>
                  </div>

                  {/* Time Range */}
                  {shift.isActive && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <label className="text-sm text-gray-600">Start:</label>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleShiftChange(shift.id, 'startTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">End:</label>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleShiftChange(shift.id, 'endTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  )}

                  {!shift.isActive && (
                    <span className="text-sm text-gray-500 italic">Day off</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-2">Schedule Summary</h3>
            <p className="text-sm text-gray-600">
              Active days: {shifts.filter(s => s.isActive).length} / {shifts.length}
            </p>
            <p className="text-sm text-gray-600">
              Total hours per week: {
                shifts
                  .filter(s => s.isActive)
                  .reduce((total, shift) => {
                    const [startH, startM] = shift.startTime.split(':').map(Number)
                    const [endH, endM] = shift.endTime.split(':').map(Number)
                    const hours = (endH * 60 + endM - (startH * 60 + startM)) / 60
                    return total + hours
                  }, 0).toFixed(1)
              } hours
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <Save className="w-5 h-5" />
              Save Schedule
            </button>
            <Link
              href="/manager/therapists"
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

