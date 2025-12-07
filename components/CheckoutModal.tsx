'use client'

import { useState } from 'react'
import { X, LogOut } from 'lucide-react'

interface CheckoutModalProps {
  therapistName: string
  onClose: () => void
  onConfirm: (comment: string) => void
}

export default function CheckoutModal({
  therapistName,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customComment, setCustomComment] = useState('')

  const predefinedReasons = [
    { value: '', label: 'Select a reason (optional)' },
    { value: 'training', label: 'Training' },
    { value: 'eating', label: 'Eating' },
    { value: 'doctor_appointment', label: 'Doctor Appointment' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'toilet', label: 'Toilet' },
    { value: 'custom', label: 'Other (custom comment)' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Combine selected reason and custom comment
    let finalComment = ''
    if (selectedReason && selectedReason !== 'custom') {
      const reasonLabel = predefinedReasons.find(r => r.value === selectedReason)?.label || selectedReason
      finalComment = reasonLabel
      if (customComment.trim()) {
        finalComment += `: ${customComment.trim()}`
      }
    } else if (selectedReason === 'custom') {
      if (!customComment.trim()) {
        // If custom is selected but no comment, don't submit
        return
      }
      finalComment = customComment.trim()
    } else if (customComment.trim()) {
      finalComment = customComment.trim()
    }
    
    // Always call onConfirm, even if comment is empty (for tracking purposes)
    onConfirm(finalComment)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Check Out Therapist</h2>
              <p className="text-sm text-gray-600">Remove {therapistName} from the queue</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason for Checkout (Optional)
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
            >
              {predefinedReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Comment Field - shown if "Other" is selected or always visible */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {selectedReason === 'custom' ? 'Custom Comment *' : 'Additional Notes (Optional)'}
            </label>
            <textarea
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
              placeholder={
                selectedReason === 'custom'
                  ? 'Please provide details...'
                  : 'Add any additional notes about this checkout...'
              }
              required={selectedReason === 'custom'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Check Out
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

