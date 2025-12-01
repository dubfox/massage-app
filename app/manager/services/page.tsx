'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Plus, X, Edit, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguagePicker from '@/components/LanguagePicker'
import ServiceModal from '@/components/ServiceModal'

interface Service {
  id: string
  name: string
  price: number
  duration?: number
  description?: string
  category?: string
  isActive: boolean
}

const mockServices: Service[] = [
  { id: '1', name: 'Thai', price: 400, duration: 60, category: 'Massage', isActive: true },
  { id: '2', name: 'Foot', price: 300, duration: 45, category: 'Massage', isActive: true },
  { id: '3', name: 'Oil', price: 500, duration: 90, category: 'Massage', isActive: true },
  { id: '4', name: 'Aroma', price: 350, duration: 60, category: 'Massage', isActive: true },
  { id: '5', name: 'Hot Oil', price: 450, duration: 60, category: 'Massage', isActive: true },
  { id: '6', name: 'Herbal', price: 400, duration: 60, category: 'Massage', isActive: true },
  { id: '7', name: 'Sport', price: 500, duration: 90, category: 'Massage', isActive: true },
  { id: '8', name: 'Back', price: 350, duration: 45, category: 'Massage', isActive: true },
]

const categories = ['Massage', 'Add-on', 'Package', 'Other']

export default function ServicesManagement() {
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [services, setServices] = useState<Service[]>(mockServices)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingService(null)
    setIsModalOpen(true)
  }

  const handleSave = (serviceData: Service) => {
    if (editingService) {
      // Update existing
      setServices(services.map(s => s.id === editingService.id ? { ...serviceData, id: editingService.id } : s))
    } else {
      // Add new
      const newService = { ...serviceData, id: Date.now().toString() }
      setServices([...services, newService])
    }
    setIsModalOpen(false)
    setEditingService(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  const toggleStatus = (id: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ))
  }

  const filteredServices = filterCategory === 'all' 
    ? services 
    : services.filter(s => s.category === filterCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{t('manager.servicesManagement')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-brand-green-500 hover:bg-brand-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              {t('service.addService')}
            </button>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{t('service.filterByCategory')}:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('service.allCategories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('service.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('service.category')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('service.price')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('service.duration')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('service.status')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {service.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {service.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {service.price.toLocaleString()} THB
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {service.duration ? `${service.duration} min` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(service.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            service.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {service.isActive ? t('common.active') : t('common.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {t('service.noServices')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>
            <nav className="p-4">
              <Link
                href="/"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('common.home')}
              </Link>
              <Link
                href="/manager"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.dailyMatrix')}
              </Link>
              <Link
                href="/manager/therapists"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.therapistManagement')}
              </Link>
              <Link
                href="/manager/services"
                className="block py-2 px-4 bg-brand-green-50 text-brand-green-700 rounded-lg font-semibold mb-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.servicesManagement')}
              </Link>
              <Link
                href="/manager/reports"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.reports')}
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isModalOpen && (
        <ServiceModal
          key={editingService?.id || 'new'}
          service={editingService}
          categories={categories}
          onClose={() => {
            setIsModalOpen(false)
            setEditingService(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

