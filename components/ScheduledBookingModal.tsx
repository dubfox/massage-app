'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Addon {
  name: string
  price: number
  selected: boolean
}

interface TherapistData {
  name: string
  certifiedServices?: string[]
}

interface Service {
  id: string
  name: string
  price: number
}

interface ServiceEntry {
  id: string
  therapist: string
  service: string
  scheduledTime?: string
  isScheduled?: boolean
  endTime?: string
  time?: string
  extendedMinutes?: number
}

interface ScheduledBookingModalProps {
  therapists: string[]
  therapistsData?: TherapistData[]
  availableServices?: Service[]
  services: string[]
  serviceEntries?: ServiceEntry[] // Existing service entries to check for conflicts
  getNextTherapistForService?: (serviceId: string) => string | null
  onClose: () => void
  onSave: (entry: any) => void
}

export default function ScheduledBookingModal({
  therapists,
  therapistsData = [],
  availableServices = [],
  services,
  serviceEntries = [],
  getNextTherapistForService,
  onClose,
  onSave,
}: ScheduledBookingModalProps) {
  const { t } = useLanguage()
  const [service, setService] = useState(services[0] || '')
  const [price, setPrice] = useState(400)
  const [therapist, setTherapist] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [paymentType, setPaymentType] = useState('Cash')
  const [notes, setNotes] = useState('')
  const [addons, setAddons] = useState<Addon[]>([])
  const [error, setError] = useState('')

  // Extract service ID from service string
  const selectedServiceId = availableServices.find(
    s => service.startsWith(s.name)
  )?.id

  // Auto-select therapist when service changes (if in auto mode)
  const handleServiceChange = (newService: string) => {
    setService(newService)
    setError('') // Clear error when service changes
    const serviceName = newService.split(' ')[0]
    const serviceInfo = availableServices.find(s => s.name === serviceName)
    const serviceId = serviceInfo?.id

    if (serviceId && getNextTherapistForService) {
      const nextTherapist = getNextTherapistForService(serviceId)
      if (nextTherapist) {
        setTherapist(nextTherapist)
      }
    }

    // Update price
    const newPrice = serviceInfo?.price || 400
    setPrice(newPrice)
  }

  // Service duration lookup
  const serviceDurations: { [key: string]: number } = {
    'Thai': 60,
    'Foot': 60,
    'Oil': 60,
    'Aroma': 60,
    'Hot': 60,
    'Herbal': 60,
    'Sport': 60,
    'Back': 60,
  }

  // Get service duration in minutes
  const getServiceDuration = (serviceName: string, extendedMinutes: number = 0): number => {
    const baseDuration = serviceDurations[serviceName] || 60
    return baseDuration + extendedMinutes
  }

  // Check if selected therapist is certified for selected service
  const isTherapistCertified = () => {
    if (!therapist || !selectedServiceId) return true // Allow if not selected yet
    const therapistInfo = therapistsData.find(t => t.name === therapist)
    return therapistInfo?.certifiedServices?.includes(selectedServiceId) || false
  }

  // Check if therapist has conflicts within 1 hour before scheduled time
  const checkTherapistAvailability = (scheduledDateTime: Date): string | null => {
    if (!therapist || !scheduledDate || !scheduledTime) return null

    const oneHourInMs = 60 * 60 * 1000 // 1 hour in milliseconds

    // Get all entries for this therapist (scheduled or active, not completed)
    const therapistEntries = serviceEntries.filter(
      e => e.therapist === therapist && !e.endTime
    )

    for (const entry of therapistEntries) {
      let entryStartTime: Date | null = null
      let entryEndTime: Date | null = null

      if (entry.isScheduled && entry.scheduledTime) {
        // Scheduled booking - use the scheduled time
        entryStartTime = new Date(entry.scheduledTime)
        const serviceName = entry.service.split(' ')[0]
        const duration = getServiceDuration(serviceName, entry.extendedMinutes || 0)
        entryEndTime = new Date(entryStartTime.getTime() + duration * 60 * 1000)
      } else if (entry.time && !entry.endTime) {
        // Active service (in progress now)
        // Calculate when it will end based on start time and duration
        const [hours, minutes] = entry.time.split(':').map(Number)
        const today = new Date()
        entryStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0)
        
        // If the time is in the future today, use that; otherwise assume it started earlier
        if (entryStartTime > today) {
          // Service starts later today
          const serviceName = entry.service.split(' ')[0]
          const duration = getServiceDuration(serviceName, entry.extendedMinutes || 0)
          entryEndTime = new Date(entryStartTime.getTime() + duration * 60 * 1000)
        } else {
          // Service started earlier today or is ongoing
          const serviceName = entry.service.split(' ')[0]
          const duration = getServiceDuration(serviceName, entry.extendedMinutes || 0)
          entryEndTime = new Date(entryStartTime.getTime() + duration * 60 * 1000)
          
          // If service would have ended, it's likely still ongoing, so use current time + remaining duration estimate
          if (entryEndTime < today) {
            // Service is ongoing, estimate it ends soon (use current time as reference)
            entryEndTime = new Date(today.getTime() + 30 * 60 * 1000) // Assume 30 min remaining
          }
        }
      }

      if (entryStartTime && entryEndTime) {
        // Check if new scheduled time is within 1 hour BEFORE an existing service starts
        // This is the main requirement: prevent scheduling within 1 hour before
        const oneHourBeforeExisting = new Date(entryStartTime.getTime() - oneHourInMs)
        
        if (scheduledDateTime >= oneHourBeforeExisting && scheduledDateTime < entryEndTime) {
          const conflictTime = entryStartTime.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
          return `Therapist has a service at ${conflictTime}. Please schedule at least 1 hour before this time.`
        }

        // Also check if new service would end within 1 hour before an existing service
        const newServiceName = service.split(' ')[0]
        const newServiceDuration = getServiceDuration(newServiceName, 0)
        const newServiceEndTime = new Date(scheduledDateTime.getTime() + newServiceDuration * 60 * 1000)
        const oneHourBeforeExistingFromNewEnd = new Date(entryStartTime.getTime() - oneHourInMs)

        if (newServiceEndTime > oneHourBeforeExistingFromNewEnd && newServiceEndTime <= entryStartTime) {
          const conflictTime = entryStartTime.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
          return `This service would end too close to an existing service at ${conflictTime}. Please schedule earlier to allow at least 1 hour before the existing service.`
        }
      }
    }

    return null // No conflict
  }

  // Initialize scheduled date/time to tomorrow at 9:00 AM
  useEffect(() => {
    if (!scheduledDate || !scheduledTime) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      setScheduledDate(dateStr)
      setScheduledTime('09:00')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!scheduledDate || !scheduledTime) {
      setError('Please select both date and time for the scheduled booking')
      return
    }

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}`
    const scheduledDateObj = new Date(scheduledDateTime)
    const now = new Date()

    if (scheduledDateObj <= now) {
      setError('Scheduled time must be in the future')
      return
    }

    if (!therapist) {
      setError('Please select a therapist')
      return
    }

    // Check therapist certification
    if (!isTherapistCertified()) {
      const serviceName = service.split(' ')[0]
      setError(`Therapist ${therapist} is not certified for ${serviceName} service. Please select a different therapist.`)
      return
    }

    // Check for scheduling conflicts (1 hour buffer)
    const conflictError = checkTherapistAvailability(scheduledDateObj)
    if (conflictError) {
      setError(conflictError)
      return
    }

    const entry = {
      service,
      price,
      therapist,
      scheduledDate,
      scheduledTime,
      scheduledDateTime: scheduledDateTime,
      paymentType,
      notes,
      addons: addons.filter(a => a.selected),
      isScheduled: true,
    }

    onSave(entry)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-brand-blue-100">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Schedule Booking</h2>
              <p className="text-sm text-gray-600">Book a service for a future date and time</p>
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
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <X className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Service *
            </label>
            <select
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
              required
            >
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Therapist Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Therapist *
            </label>
            <select
              value={therapist}
              onChange={(e) => {
                setTherapist(e.target.value)
                setError('') // Clear error when therapist changes
              }}
              className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base ${
                therapist && !isTherapistCertified() 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select therapist...</option>
              {therapists.map((name) => {
                const therapistInfo = therapistsData.find(t => t.name === name)
                const isCertified = selectedServiceId && therapistInfo?.certifiedServices?.includes(selectedServiceId)
                return (
                  <option key={name} value={name} disabled={!isCertified && selectedServiceId ? true : false}>
                    {name} {isCertified ? '✓' : selectedServiceId ? '(Not Certified)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Scheduled Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Scheduled Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Scheduled Time *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
                required
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Price (THB) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
              min="0"
              step="1"
              required
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="QR Code">QR Code</option>
              <option value="TrueMoney">TrueMoney</option>
              <option value="LINE Pay">LINE Pay</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-base"
              placeholder="Additional notes for this booking..."
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
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue-500 hover:bg-brand-blue-600 rounded-lg transition-colors"
            >
              Schedule Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

