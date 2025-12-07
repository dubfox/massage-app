'use client'

import { useState, useEffect } from 'react'
import { X, Clock, LogIn, LogOut, Calendar } from 'lucide-react'

interface HistoryRecord {
  therapistName: string
  timestamp: string
  comment?: string | null
  type: 'checkin' | 'checkout'
}

interface TherapistHistoryModalProps {
  therapistName: string
  onClose: () => void
}

export default function TherapistHistoryModal({
  therapistName,
  onClose,
}: TherapistHistoryModalProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([])

  useEffect(() => {
    try {
      // Load checkout history
      const checkoutStored = localStorage.getItem('therapistCheckoutHistory')
      const checkoutHistory: HistoryRecord[] = checkoutStored
        ? JSON.parse(checkoutStored).map((record: any) => ({
            ...record,
            type: 'checkout' as const,
          }))
        : []

      // Load check-in history
      const checkinStored = localStorage.getItem('therapistCheckinHistory')
      const checkinHistory: HistoryRecord[] = checkinStored
        ? JSON.parse(checkinStored).map((record: any) => ({
            ...record,
            type: 'checkin' as const,
          }))
        : []

      // Combine and filter for this therapist
      const allHistory = [...checkoutHistory, ...checkinHistory]
        .filter(record => record.therapistName === therapistName)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setHistory(allHistory)
    } catch (error) {
      console.error('Error loading therapist history:', error)
      setHistory([])
    }
  }, [therapistName])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-brand-blue-100">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Check In/Out History</h2>
              <p className="text-sm text-gray-600">{therapistName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No history records found</p>
              <p className="text-gray-500 text-sm mt-2">
                Check-in and check-out records will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    record.type === 'checkin'
                      ? 'bg-brand-green-50 border-brand-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-full ${
                          record.type === 'checkin'
                            ? 'bg-brand-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {record.type === 'checkin' ? (
                          <LogIn className="w-4 h-4 text-brand-green-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-semibold text-sm ${
                              record.type === 'checkin'
                                ? 'text-brand-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {record.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.timestamp)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(record.timestamp)}
                          </div>
                        </div>
                        {record.comment && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                            <p className="text-sm text-gray-700">{record.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

