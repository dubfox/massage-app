'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Plus, X, Edit, Calendar, DollarSign, UserPlus, LogIn, LogOut } from 'lucide-react'
import TherapistProfileModal from '@/components/TherapistProfileModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTherapistStatus } from '@/contexts/TherapistStatusContext'
import LanguagePicker from '@/components/LanguagePicker'

interface Therapist {
  id: string
  name: string
  phone: string
  email?: string
  pin: string
  status: 'active' | 'inactive'
  commissionRate?: number
  joinDate: string
  certifiedServices?: string[] // Service IDs the therapist is certified to perform
}

// Mock available services - in real app, this would come from Services Management
const availableServices = [
  { id: '1', name: 'Thai', price: 400 },
  { id: '2', name: 'Foot', price: 300 },
  { id: '3', name: 'Oil', price: 500 },
  { id: '4', name: 'Aroma', price: 350 },
  { id: '5', name: 'Hot Oil', price: 450 },
  { id: '6', name: 'Herbal', price: 400 },
  { id: '7', name: 'Sport', price: 500 },
  { id: '8', name: 'Back', price: 350 },
]

const mockTherapists: Therapist[] = [
  { id: '1', name: 'Lisa', phone: '0812345678', pin: '1234', status: 'active', commissionRate: 50, joinDate: '2024-01-15', certifiedServices: ['1', '2', '3', '4'] },
  { id: '2', name: 'Sarah', phone: '0823456789', pin: '2345', status: 'active', commissionRate: 50, joinDate: '2024-02-01', certifiedServices: ['1', '2', '5', '6'] },
  { id: '3', name: 'Emma', phone: '0834567890', pin: '3456', status: 'active', commissionRate: 45, joinDate: '2024-03-10', certifiedServices: ['3', '4', '7'] },
  { id: '4', name: 'Maya', phone: '0845678901', pin: '4567', status: 'active', commissionRate: 50, joinDate: '2024-01-20', certifiedServices: ['1', '2', '3', '4', '5', '6'] },
  { id: '5', name: 'Anna', phone: '0856789012', pin: '5678', status: 'inactive', commissionRate: 50, joinDate: '2024-02-15', certifiedServices: ['1', '8'] },
]

export default function TherapistManagement() {
  const { t } = useLanguage()
  const { loggedInTherapists, loginTherapist, logoutTherapist } = useTherapistStatus()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists)

  const handleCheckIn = (therapistName: string) => {
    loginTherapist(therapistName)
  }

  const handleCheckOut = (therapistName: string) => {
    logoutTherapist(therapistName)
  }

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingTherapist(null)
    setIsModalOpen(true)
  }

  const handleSave = (therapistData: Therapist) => {
    if (editingTherapist) {
      // Update existing
      setTherapists(therapists.map(t => t.id === editingTherapist.id ? { ...therapistData, id: editingTherapist.id } : t))
    } else {
      // Add new
      const newTherapist = { ...therapistData, id: Date.now().toString() }
      setTherapists([...therapists, newTherapist])
    }
    setIsModalOpen(false)
    setEditingTherapist(null)
  }

  const toggleStatus = (id: string) => {
    setTherapists(therapists.map(t => 
      t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
    ))
  }

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
            <h1 className="text-xl font-bold text-gray-800">{t('manager.therapistManagement')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-brand-green-500 hover:bg-brand-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              {t('therapist.addTherapist')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        {/* Desktop / Tablet: Table View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('therapist.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('therapist.phone')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('therapist.commission')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('therapist.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Clock Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('therapist.joinDate')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {therapists.map((therapist) => (
                  <tr key={therapist.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {therapist.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {therapist.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {therapist.commissionRate || 0}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(therapist.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          therapist.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {therapist.status === 'active' ? t('common.active') : t('common.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {loggedInTherapists.includes(therapist.name) ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-brand-green-700">Clocked In</span>
                          <button
                            onClick={() => handleCheckOut(therapist.name)}
                            className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Check Out"
                          >
                            <LogOut className="w-3 h-3" />
                            Check Out
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(therapist.name)}
                          className="px-3 py-1 bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Check In"
                        >
                          <LogIn className="w-3 h-3" />
                          Check In
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(therapist.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(therapist)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/manager/therapists/${therapist.id}/shifts`}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="Assign Shifts"
                        >
                          <Calendar className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/manager/therapists/${therapist.id}/payout`}
                          className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                          title="View Payout"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Card View */}
        <div className="space-y-4 md:hidden">
          {therapists.map((therapist) => {
            const isClockedIn = loggedInTherapists.includes(therapist.name)
            const certifiedNames =
              therapist.certifiedServices && therapist.certifiedServices.length > 0
                ? therapist.certifiedServices
                    .map(id => availableServices.find(s => s.id === id)?.name)
                    .filter(Boolean)
                : []

            return (
              <div
                key={therapist.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
              >
                {/* Header: Name, phone, status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-gray-900">
                      {therapist.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {therapist.phone}
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined: {new Date(therapist.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => toggleStatus(therapist.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        therapist.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {therapist.status === 'active' ? t('common.active') : t('common.inactive')}
                    </button>
                    <div className="text-xs text-gray-600">
                      {therapist.commissionRate || 0}% commission
                    </div>
                  </div>
                </div>

                {/* Clock status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isClockedIn ? (
                      <>
                        <div className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-brand-green-700">Clocked In</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Not clocked in</span>
                    )}
                  </div>
                  <div>
                    {isClockedIn ? (
                      <button
                        onClick={() => handleCheckOut(therapist.name)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <LogOut className="w-3 h-3" />
                        Check Out
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(therapist.name)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <LogIn className="w-3 h-3" />
                        Check In
                      </button>
                    )}
                  </div>
                </div>

                {/* Certified services */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-700 mb-1">
                    Certified Services
                  </div>
                  {certifiedNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {certifiedNames.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-full bg-brand-green-50 text-brand-green-800 border border-brand-green-200 text-[10px] font-semibold"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      No services assigned. Therapist will not appear for service selection.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(therapist)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/manager/therapists/${therapist.id}/shifts`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
                    >
                      <Calendar className="w-3 h-3" />
                      Shifts
                    </Link>
                    <Link
                      href={`/manager/therapists/${therapist.id}/payout`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      <DollarSign className="w-3 h-3" />
                      Payout
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
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
                className="block py-2 px-4 bg-brand-green-50 text-brand-green-700 rounded-lg font-semibold mb-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.therapistManagement')}
              </Link>
              <Link
                href="/manager/services"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
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

      {/* Profile Modal */}
      {isModalOpen && (
        <TherapistProfileModal
          therapist={editingTherapist}
          availableServices={availableServices}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTherapist(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

