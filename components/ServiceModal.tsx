'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Service {
  id: string
  name: string
  price: number
  duration?: number
  description?: string
  category?: string
  isActive: boolean
}

interface ServiceModalProps {
  service: Service | null
  categories: string[]
  onClose: () => void
  onSave: (service: Service) => void
}

export default function ServiceModal({
  service,
  categories,
  onClose,
  onSave,
}: ServiceModalProps) {
  const { t } = useLanguage()
  const [name, setName] = useState(service?.name || '')
  const [price, setPrice] = useState(service?.price || 0)
  const [duration, setDuration] = useState<number | undefined>(service?.duration || 60)
  const [description, setDescription] = useState(service?.description || '')
  const [category, setCategory] = useState(service?.category || categories[0] || '')
  const [isActive, setIsActive] = useState(service?.isActive ?? true)

  useEffect(() => {
    if (service) {
      setName(service.name || '')
      setPrice(service.price || 0)
      setDuration(service.duration)
      setDescription(service.description || '')
      setCategory(service.category || categories[0] || '')
      setIsActive(service.isActive ?? true)
    } else {
      // Reset for new service
      setName('')
      setPrice(0)
      setDuration(60)
      setDescription('')
      setCategory(categories[0] || '')
      setIsActive(true)
    }
  }, [service, categories])

  const handleSave = () => {
    if (!name.trim() || price <= 0) {
      alert('Please fill in all required fields')
      return
    }

    const serviceData: Service = {
      id: service?.id || '',
      name: name.trim(),
      price,
      duration,
      description: description.trim() || undefined,
      category: category || undefined,
      isActive,
    }
    onSave(serviceData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {service ? t('service.editService') : t('service.createService')}
          </h2>
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
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.name')}: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="e.g., Thai, Foot, Oil"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.category')}:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.price')} (THB): <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.duration')} (minutes):
            </label>
            <input
              type="number"
              value={duration || ''}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Optional"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.description')}:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Optional description..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('service.status')}:
            </label>
            <select
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            {service ? t('common.save') : t('service.create')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

