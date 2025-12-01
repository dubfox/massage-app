'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Service {
  id: string
  name: string
  price: number
}

interface Therapist {
  id: string
  name: string
  phone: string
  email?: string
  pin: string
  status: 'active' | 'inactive'
  commissionRate?: number
  joinDate: string
  certifiedServices?: string[]
}

interface TherapistProfileModalProps {
  therapist: Therapist | null
  availableServices: Service[]
  onClose: () => void
  onSave: (therapist: Therapist) => void
}

export default function TherapistProfileModal({
  therapist,
  availableServices,
  onClose,
  onSave,
}: TherapistProfileModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [commissionRate, setCommissionRate] = useState(50)
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
  const [certifiedServices, setCertifiedServices] = useState<string[]>([])

  useEffect(() => {
    if (therapist) {
      setName(therapist.name)
      setPhone(therapist.phone)
      setEmail(therapist.email || '')
      setPin(therapist.pin)
      setStatus(therapist.status)
      setCommissionRate(therapist.commissionRate || 50)
      setJoinDate(therapist.joinDate)
      setCertifiedServices(therapist.certifiedServices || [])
    } else {
      // Reset for new therapist
      setName('')
      setPhone('')
      setEmail('')
      setPin('')
      setStatus('active')
      setCommissionRate(50)
      setJoinDate(new Date().toISOString().split('T')[0])
      setCertifiedServices([])
    }
  }, [therapist])

  const handleServiceToggle = (serviceId: string) => {
    setCertifiedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleSave = () => {
    const therapistData: Therapist = {
      id: therapist?.id || '',
      name,
      phone,
      email: email || undefined,
      pin,
      status,
      commissionRate,
      joinDate,
      certifiedServices,
    }
    onSave(therapistData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {therapist ? 'Edit Therapist Profile' : 'Create Therapist Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone: <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="0812345678"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email: (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="therapist@example.com"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              PIN: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="4-digit PIN"
              maxLength={4}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status:
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Commission Rate (%):
            </label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Join Date:
            </label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Certified Services */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Certified Services: <span className="text-gray-500 text-xs">(Select services this therapist can perform)</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {availableServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={certifiedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {service.name} ({service.price} THB)
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {certifiedServices.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No services selected. Therapist will not appear in service dropdowns.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            {therapist ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

