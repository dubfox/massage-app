'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface TherapistData {
  name: string
  certifiedServices?: string[]
}

interface Service {
  id: string
  name: string
  price: number
}

interface GroupServiceEntry {
  id: string
  service: string
  therapist: string
  price: number
}

interface AddGroupModalProps {
  therapists: string[]
  therapistsData?: TherapistData[]
  availableServices?: Service[]
  services: string[]
  getNextTherapistForService?: (serviceId: string) => string | null
  onClose: () => void
  onSave: (entries: any[]) => void
}

export default function AddGroupModal({
  therapists,
  therapistsData = [],
  availableServices = [],
  services,
  getNextTherapistForService,
  onClose,
  onSave,
}: AddGroupModalProps) {
  const { t } = useLanguage()
  
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

  // Extract price from service string
  const extractPrice = (serviceStr: string) => {
    const match = serviceStr.match(/\d+/)
    return match ? parseInt(match[0]) : 400
  }

  // Initialize with one service entry
  const [groupEntries, setGroupEntries] = useState<GroupServiceEntry[]>([
    {
      id: Date.now().toString(),
      service: services[0] || '',
      therapist: 'auto',
      price: extractPrice(services[0] || ''),
    },
  ])

  const [paymentType, setPaymentType] = useState('Cash')
  const [notes, setNotes] = useState('')

  // Update therapist assignment when service changes
  // This ensures no therapist is assigned twice in the same group
  const updateTherapistForEntry = (entryId: string, newService: string) => {
    const serviceId = getServiceId(newService)
    let assignedTherapist = 'auto'
    
    // Get therapists already assigned in this group (excluding the current entry being updated)
    const therapistsAssignedInGroup = new Set(
      groupEntries
        .filter(entry => entry.id !== entryId && entry.therapist !== 'auto')
        .map(entry => entry.therapist)
    )
    
    if (serviceId && getNextTherapistForService) {
      // Get all certified therapists for this service
      const therapistsForService = getTherapistsForService(serviceId)
      
      // Filter out therapists already assigned in this group
      const availableTherapists = therapistsForService.filter(
        therapist => !therapistsAssignedInGroup.has(therapist)
      )
      
      if (availableTherapists.length > 0) {
        // Try to get next therapist from the queue (if not already in group)
        const nextTherapist = getNextTherapistForService(serviceId)
        if (nextTherapist && availableTherapists.includes(nextTherapist)) {
          assignedTherapist = nextTherapist
        } else {
          // Use first available therapist not in group
          assignedTherapist = availableTherapists[0]
        }
      } else if (therapistsForService.length > 0) {
        // All certified therapists are already in group - use first one anyway
        // (Backend will handle this, but show something in UI)
        assignedTherapist = therapistsForService[0]
      }
    }

    setGroupEntries(prev =>
      prev.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              service: newService,
              therapist: assignedTherapist,
              price: extractPrice(newService),
            }
          : entry
      )
    )
  }

  const handleServiceChange = (entryId: string, newService: string) => {
    updateTherapistForEntry(entryId, newService)
  }

  const handleAddService = () => {
    // Get therapists already assigned in this group
    const therapistsAssignedInGroup = new Set(
      groupEntries
        .filter(entry => entry.therapist !== 'auto')
        .map(entry => entry.therapist)
    )
    
    // Get first service and find an available therapist
    const firstService = services[0] || ''
    const serviceId = getServiceId(firstService)
    let assignedTherapist = 'auto'
    
    if (serviceId) {
      const therapistsForService = getTherapistsForService(serviceId)
      const availableTherapists = therapistsForService.filter(
        therapist => !therapistsAssignedInGroup.has(therapist)
      )
      
      if (availableTherapists.length > 0) {
        // Try to get next therapist from queue
        if (getNextTherapistForService) {
          const nextTherapist = getNextTherapistForService(serviceId)
          if (nextTherapist && availableTherapists.includes(nextTherapist)) {
            assignedTherapist = nextTherapist
          } else {
            assignedTherapist = availableTherapists[0]
          }
        } else {
          assignedTherapist = availableTherapists[0]
        }
      } else if (therapistsForService.length > 0) {
        // All therapists already in group - will be handled by backend
        assignedTherapist = therapistsForService[0]
      }
    }
    
    const newEntry: GroupServiceEntry = {
      id: Date.now().toString(),
      service: firstService,
      therapist: assignedTherapist,
      price: extractPrice(firstService),
    }
    setGroupEntries([...groupEntries, newEntry])
  }

  const handleRemoveService = (entryId: string) => {
    if (groupEntries.length > 1) {
      setGroupEntries(groupEntries.filter(entry => entry.id !== entryId))
    }
  }

  const calculateTotal = () => {
    return groupEntries.reduce((sum, entry) => sum + entry.price, 0)
  }

  const handleSave = () => {
    // Convert group entries to individual entry format
    // Payment will be collected via PaymentCollectionModal after entries are created
    const entriesToSave = groupEntries.map(entry => ({
      therapist: entry.therapist,
      timeSlot: 'auto',
      service: entry.service,
      price: entry.price,
      addons: [],
      paymentType: paymentType === 'Unpaid' ? 'Unpaid' : paymentType, // Allow deferred payment
      notes,
    }))
    
    onSave(entriesToSave)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">{t('manager.addGroup')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Service Entries */}
          <div className="space-y-3">
            {groupEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 text-sm font-semibold text-gray-700 min-w-[60px]">
                  Service {index + 1}:
                </div>
                <select
                  value={entry.service}
                  onChange={(e) => handleServiceChange(entry.id, e.target.value)}
                  className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                <div className="flex-1 text-sm text-gray-600">
                  Therapist: <span className="font-semibold text-gray-900">{entry.therapist === 'auto' ? 'Auto' : entry.therapist}</span>
                </div>
                <div className="flex-1 text-sm text-gray-600">
                  Price: <span className="font-semibold text-gray-900">{entry.price} THB</span>
                </div>
                {groupEntries.length > 1 && (
                  <button
                    onClick={() => handleRemoveService(entry.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove service"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Service Button */}
          <button
            onClick={handleAddService}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-brand-blue-500 hover:text-brand-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">{t('service.addService')}</span>
          </button>

          {/* Payment and Total */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Payment:</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="px-3 py-2 text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="QR">QR</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>{calculateTotal().toLocaleString()} THB</span>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Add any notes for this group..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-semibold transition-colors shadow-md"
          >
            {t('manager.addAllToQueue')}
          </button>
        </div>
      </div>
    </div>
  )
}

