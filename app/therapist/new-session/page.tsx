'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const services = [
  { name: 'Thai', price: 400, duration: 60 },
  { name: 'Foot', price: 300, duration: 45 },
  { name: 'Oil', price: 500, duration: 90 },
  { name: 'Aroma', price: 350, duration: 60 },
]

const addons = [
  { name: 'Aroma', price: 100 },
  { name: 'Hot Oil', price: 150 },
  { name: 'Herbal', price: 200 },
]

export default function NewSession() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState(services[0])
  const [duration, setDuration] = useState(selectedService.duration)
  const [price, setPrice] = useState(selectedService.price)
  const [selectedAddons, setSelectedAddons] = useState<number[]>([])
  const [tip, setTip] = useState('')
  const [notes, setNotes] = useState('')

  const handleServiceChange = (service: typeof services[0]) => {
    setSelectedService(service)
    setPrice(service.price)
    setDuration(service.duration)
  }

  const toggleAddon = (index: number) => {
    if (selectedAddons.includes(index)) {
      setSelectedAddons(selectedAddons.filter(i => i !== index))
    } else {
      setSelectedAddons([...selectedAddons, index])
    }
  }

  const calculateTotal = () => {
    const addonTotal = selectedAddons.reduce((sum, idx) => sum + addons[idx].price, 0)
    return price + addonTotal + (parseInt(tip) || 0)
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    // For now, just redirect back to home
    router.push('/therapist/home')
  }

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
          <h1 className="text-xl font-bold text-gray-800">New Session</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Service Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Service:
          </label>
          <select
            value={selectedService.name}
            onChange={(e) => {
              const service = services.find(s => s.name === e.target.value)
              if (service) handleServiceChange(service)
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {services.map((service) => (
              <option key={service.name} value={service.name}>
                {service.name} - {service.price} THB
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Duration:
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>
        </div>

        {/* Price */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Price:
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Add-ons:
          </label>
          <div className="space-y-2">
            {addons.map((addon, index) => (
              <button
                key={addon.name}
                onClick={() => toggleAddon(index)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                    selectedAddons.includes(index)
                      ? 'bg-brand-green-500 text-white border-brand-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand-green-500'
                  }`}
              >
                {addon.name} +{addon.price} THB
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tip:
          </label>
          <input
            type="number"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notes:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Total Display */}
        <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-brand-green-600">
              {calculateTotal().toLocaleString()} THB
            </span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-brand-green-500 hover:bg-brand-green-600 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg transition-colors"
        >
          Save Session
        </button>
      </div>
    </div>
  )
}

