'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
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

interface AddEntryModalProps {
  therapists: string[]
  therapistsData?: TherapistData[]
  availableServices?: Service[]
  services: string[]
  getNextTherapistForService?: (serviceId: string) => string | null
  onClose: () => void
  onSave: (entry: any) => void
}

export default function AddEntryModal({
  therapists,
  therapistsData = [],
  availableServices = [],
  services,
  getNextTherapistForService,
  onClose,
  onSave,
}: AddEntryModalProps) {
  const { t } = useLanguage()
  const [timeSlot, setTimeSlot] = useState('auto')
  const [service, setService] = useState(services[0] || '')
  const [price, setPrice] = useState(400)
  
  // Extract service ID from service string (e.g., "Thai 400" -> find service with name "Thai")
  const getServiceId = (serviceStr: string) => {
    if (!serviceStr || !availableServices.length) return null
    const serviceName = serviceStr.split(' ')[0] // Get service name before price
    const foundService = availableServices.find(s => s.name === serviceName)
    return foundService?.id || null
  }

  // Get therapists certified for a specific service
  const getTherapistsForService = (serviceId: string | null) => {
    if (!serviceId || therapistsData.length === 0) return therapists
    return therapistsData
      .filter(t => t.certifiedServices && t.certifiedServices.includes(serviceId))
      .map(t => t.name)
  }

  // Get the next therapist in queue for the selected service
  const getNextTherapist = () => {
    if (timeSlot !== 'auto' || !getNextTherapistForService) return null
    const serviceId = getServiceId(service)
    if (!serviceId) return null
    return getNextTherapistForService(serviceId)
  }

  const [therapist, setTherapist] = useState(() => {
    // Initialize with next therapist for first service
    const serviceId = getServiceId(services[0] || '')
    if (serviceId && getNextTherapistForService) {
      return getNextTherapistForService(serviceId) || therapists[0] || ''
    }
    return therapists[0] || ''
  })

  // Get therapists who can perform the selected service
  const availableTherapists = getTherapistsForService(getServiceId(service))
  const [addons, setAddons] = useState<Addon[]>([
    { name: 'Aroma', price: 100, selected: false },
    { name: 'Hot Oil', price: 150, selected: false },
    { name: 'Herbal', price: 200, selected: false },
  ])
  const [paymentType, setPaymentType] = useState('Cash')
  const [notes, setNotes] = useState('')

  const handleAddonToggle = (index: number) => {
    const updated = [...addons]
    updated[index].selected = !updated[index].selected
    setAddons(updated)
  }

  const handleSave = () => {
    const selectedAddons = addons.filter(a => a.selected)
    onSave({
      therapist,
      timeSlot,
      service,
      price,
      addons: selectedAddons,
      paymentType,
      notes,
    })
  }

  const extractPrice = (serviceStr: string) => {
    const match = serviceStr.match(/\d+/)
    return match ? parseInt(match[0]) : 400
  }

  const handleServiceChange = (newService: string) => {
    setService(newService)
    setPrice(extractPrice(newService))
    
    // When service changes, find the next therapist in queue who can perform this service
    if (timeSlot === 'auto' && getNextTherapistForService) {
      const serviceId = getServiceId(newService)
      if (serviceId) {
        const nextTherapist = getNextTherapistForService(serviceId)
        if (nextTherapist) {
          setTherapist(nextTherapist)
        } else {
          // If no therapist found, use first available therapist for this service
          const therapistsForService = getTherapistsForService(serviceId)
          if (therapistsForService.length > 0) {
            setTherapist(therapistsForService[0])
          }
        }
      }
    } else if (timeSlot === 'auto') {
      // If no getNextTherapistForService function, use first available therapist
      const serviceId = getServiceId(newService)
      const therapistsForService = getTherapistsForService(serviceId)
      if (therapistsForService.length > 0) {
        setTherapist(therapistsForService[0])
      }
    }
  }

  const handleTherapistChange = (newTherapist: string) => {
    if (timeSlot === 'auto') {
      // Don't allow manual change in auto mode
      return
    }
    setTherapist(newTherapist)
  }

  const handleTimeSlotChange = (newTimeSlot: string) => {
    setTimeSlot(newTimeSlot)
    if (newTimeSlot === 'auto' && getNextTherapistForService) {
      // Reset to round-robin therapist for current service when switching to auto
      const serviceId = getServiceId(service)
      if (serviceId) {
        const nextTherapist = getNextTherapistForService(serviceId)
        if (nextTherapist) {
          setTherapist(nextTherapist)
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 relative">
          <h2 className="text-xl font-bold text-gray-800">MANAGER SERVICE ENTRY</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600 border border-transparent hover:border-red-200"
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Service - Now First */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Service:
            </label>
            <select
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-4 py-3 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-green-300 focus:border-brand-green-500 text-gray-900"
            >
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {availableTherapists.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                No therapists are certified for this service. Please assign this service to therapists in Therapist Management.
              </p>
            )}
          </div>

          {/* Therapist - Auto-selected based on service */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Therapist: {timeSlot === 'auto' && (
                <span className="text-xs text-brand-green-600 font-normal ml-2">
                  (Round-robin: {getNextTherapist() || therapist})
                </span>
              )}
            </label>
            <select
              value={therapist}
              onChange={(e) => handleTherapistChange(e.target.value)}
              disabled={timeSlot === 'auto' || availableTherapists.length === 0}
              className={`w-full px-4 py-3 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-green-300 focus:border-brand-green-500 text-gray-900 ${
                timeSlot === 'auto' || availableTherapists.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              {availableTherapists.length > 0 ? (
                availableTherapists.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              ) : (
                <option value="">No therapists available for this service</option>
              )}
            </select>
            {timeSlot === 'auto' && (
              <p className="text-xs text-gray-600 mt-1">
                Auto-assigned via round-robin based on service. Change Time Slot to "Pick Row" to manually select therapist.
              </p>
            )}
            {availableTherapists.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                No therapists are certified for the selected service.
              </p>
            )}
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time Slot:
            </label>
            <select
              value={timeSlot}
              onChange={(e) => handleTimeSlotChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="auto">Auto / Pick Row</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((row) => (
                <option key={row} value={row}>
                  Row {row}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Price:
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Add-ons */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add-ons:
            </label>
            <div className="flex flex-wrap gap-2">
              {addons.map((addon, index) => (
                <button
                  key={addon.name}
                  onClick={() => handleAddonToggle(index)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    addon.selected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {addon.name} +{addon.price}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Payment Type:
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="QR">QR</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

