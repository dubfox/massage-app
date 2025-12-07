'use client'

import { useState, useMemo } from 'react'
import { X, Plus, Trash2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PaymentDetail {
  method: string
  amount: number
  reference?: string
  verified: boolean
  timestamp: string
  collectedBy?: string
}

interface ServiceEntry {
  id: string
  therapist: string
  service: string
  price: number
  time: string
  endTime?: string
  groupNumber?: number
  paymentType?: string
  paymentStatus?: 'paid' | 'unpaid' | 'partial'
  paymentDetails?: PaymentDetail[]
}

interface ServicePayment {
  entryId: string
  paymentDetails: PaymentDetail[]
  paymentStatus: 'paid' | 'unpaid' | 'partial'
}

interface PaymentCollectionModalProps {
  groupEntries: ServiceEntry[]
  groupNumber: number
  onClose: () => void
  onSave: (servicePayments: ServicePayment[]) => void
}

export default function PaymentCollectionModal({
  groupEntries,
  groupNumber,
  onClose,
  onSave,
}: PaymentCollectionModalProps) {
  const { t } = useLanguage()
  
  // Check if all services in the group are completed
  const allServicesCompleted = useMemo(() => {
    if (groupEntries.length === 0) return false
    return groupEntries.every(entry => entry.endTime !== undefined)
  }, [groupEntries])

  const activeServices = useMemo(() => {
    return groupEntries.filter(entry => !entry.endTime)
  }, [groupEntries])

  // Initialize per-service payment state - default to unpaid
  const [servicePayments, setServicePayments] = useState<Record<string, PaymentDetail[]>>(() => {
    const initial: Record<string, PaymentDetail[]> = {}
    groupEntries.forEach(entry => {
      if (entry.paymentDetails && entry.paymentDetails.length > 0) {
        initial[entry.id] = entry.paymentDetails
      } else {
        // Default to unpaid (empty payment array or amount 0)
        initial[entry.id] = []
      }
    })
    return initial
  })

  // Track selected services for group payment
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())

  const [referenceNumbers, setReferenceNumbers] = useState<Record<string, Record<number, string>>>({})

  // Calculate payment status for each service
  const getServicePaymentStatus = (entryId: string): 'paid' | 'unpaid' | 'partial' => {
    const entry = groupEntries.find(e => e.id === entryId)
    if (!entry) return 'unpaid'
    const payments = servicePayments[entryId] || []
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid === 0) return 'unpaid'
    if (totalPaid >= entry.price) return 'paid'
    return 'partial'
  }

  const totalAmount = useMemo(() => {
    return groupEntries.reduce((sum, entry) => sum + entry.price, 0)
  }, [groupEntries])

  const totalPaid = useMemo(() => {
    return Object.values(servicePayments).reduce((sum, payments) => {
      return sum + payments.reduce((pSum, p) => pSum + p.amount, 0)
    }, 0)
  }, [servicePayments])

  const remaining = totalAmount - totalPaid
  const overallPaymentStatus: 'paid' | 'unpaid' | 'partial' = 
    totalPaid === 0 ? 'unpaid' :
    totalPaid >= totalAmount ? 'paid' : 'partial'

  const paymentMethodOptions = [
    'Cash',
    'Card',
    'QR Code',
    'TrueMoney',
    'LINE Pay',
    'Bank Transfer',
    'Other'
  ]

  const handleAddPaymentMethod = (entryId: string) => {
    const entry = groupEntries.find(e => e.id === entryId)
    if (!entry) return
    
    const currentPayments = servicePayments[entryId] || []
    const currentPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = entry.price - currentPaid

    setServicePayments(prev => ({
      ...prev,
      [entryId]: [...currentPayments, {
        method: 'Cash',
        amount: remaining > 0 ? remaining : 0,
        verified: true,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }]
    }))
  }

  const handleRemovePaymentMethod = (entryId: string, index: number) => {
    const currentPayments = servicePayments[entryId] || []
    if (currentPayments.length > 1) {
      setServicePayments(prev => ({
        ...prev,
        [entryId]: currentPayments.filter((_, i) => i !== index)
      }))
      setReferenceNumbers(prev => {
        const updated = { ...prev }
        if (updated[entryId]) {
          delete updated[entryId][index]
        }
        return updated
      })
    }
  }

  const handlePaymentMethodChange = (entryId: string, index: number, field: keyof PaymentDetail, value: any) => {
    const currentPayments = servicePayments[entryId] || []
    const updated = [...currentPayments]
    updated[index] = { ...updated[index], [field]: value }
    setServicePayments(prev => ({
      ...prev,
      [entryId]: updated
    }))
  }

  const handleAmountChange = (entryId: string, index: number, amount: number) => {
    const entry = groupEntries.find(e => e.id === entryId)
    if (!entry) return
    
    const currentPayments = servicePayments[entryId] || []
    const updated = [...currentPayments]
    updated[index].amount = Math.max(0, Math.min(amount, entry.price))
    setServicePayments(prev => ({
      ...prev,
      [entryId]: updated
    }))
  }

  const handleSave = () => {
    // Prevent saving if services are not completed
    if (!allServicesCompleted) {
      return
    }

    // Convert to ServicePayment array
    const finalServicePayments: ServicePayment[] = groupEntries.map(entry => {
      const payments = servicePayments[entry.id] || []
      const finalPayments = payments.map((payment, index) => ({
        ...payment,
        reference: referenceNumbers[entry.id]?.[index] || undefined,
        verified: payment.method === 'Cash' ? true : payment.verified,
        timestamp: payment.timestamp || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }))
      
      return {
        entryId: entry.id,
        paymentDetails: finalPayments,
        paymentStatus: getServicePaymentStatus(entry.id)
      }
    })
    
    onSave(finalServicePayments)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('payment.collectPayment')} - Group {groupNumber}</h2>
            <p className="text-sm text-gray-600 mt-1">{groupEntries.length} {t('entry.service')}{groupEntries.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning if services not completed */}
          {!allServicesCompleted && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-800 mb-1">
                    {t('payment.servicesNotCompleted')}
                  </div>
                  <div className="text-sm text-orange-700">
                    {t('payment.completeServicesFirstDesc')}
                    {activeServices.length > 0 && (
                      <span className="block mt-1">
                        {activeServices.length} {t('entry.service')}{activeServices.length > 1 ? 's' : ''} {t('payment.servicesInProgress')}.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Selection for Group Payment */}
          {allServicesCompleted && groupEntries.length > 1 && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Select Services for Group Payment</h3>
                  <p className="text-sm text-gray-600">
                    Select multiple services to pay together, or pay each service individually below
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedServices.size === groupEntries.length) {
                        setSelectedServices(new Set())
                      } else {
                        setSelectedServices(new Set(groupEntries.map(e => e.id)))
                      }
                    }}
                    className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    {selectedServices.size === groupEntries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {groupEntries.map((entry) => {
                  const isSelected = selectedServices.has(entry.id)
                  const serviceName = entry.service.split(' ')[0]
                  
                  return (
                    <label
                      key={entry.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-blue-100 border-brand-blue-400'
                          : 'bg-white border-gray-200 hover:border-brand-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = new Set(selectedServices)
                          if (e.target.checked) {
                            newSelected.add(entry.id)
                          } else {
                            newSelected.delete(entry.id)
                          }
                          setSelectedServices(newSelected)
                        }}
                        className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{serviceName}</div>
                        <div className="text-xs text-gray-600">{entry.price.toLocaleString()} THB</div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {selectedServices.size > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} selected:
                    </span>
                    <span className="text-lg font-bold text-brand-blue-600">
                      {(() => {
                        const total = Array.from(selectedServices).reduce((sum, id) => {
                          const e = groupEntries.find(ent => ent.id === id)
                          return sum + (e?.price || 0)
                        }, 0)
                        return total.toLocaleString()
                      })()} THB
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Add payment method to all selected services
                      const selectedEntries = groupEntries.filter(e => selectedServices.has(e.id))
                      const newServicePayments = { ...servicePayments }
                      
                      selectedEntries.forEach(entry => {
                        const currentPayments = newServicePayments[entry.id] || []
                        const currentPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0)
                        const remaining = entry.price - currentPaid
                        
                        if (remaining > 0) {
                          newServicePayments[entry.id] = [
                            ...currentPayments,
                            {
                              method: 'Cash',
                              amount: remaining,
                              verified: true,
                              timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                            }
                          ]
                        }
                      })
                      
                      setServicePayments(newServicePayments)
                      setSelectedServices(new Set())
                    }}
                    className="mt-3 w-full px-4 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Pay Selected Services ({(() => {
                      const total = Array.from(selectedServices).reduce((sum, id) => {
                        const e = groupEntries.find(ent => ent.id === id)
                        return sum + (e?.price || 0)
                      }, 0)
                      return total.toLocaleString()
                    })()} THB)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Individual Service Payments */}
          <div className="space-y-4">
            {groupEntries.map((entry) => {
              const payments = servicePayments[entry.id] || []
              const servicePaid = payments.reduce((sum, p) => sum + p.amount, 0)
              const serviceRemaining = entry.price - servicePaid
              const serviceStatus = getServicePaymentStatus(entry.id)
              const serviceName = entry.service.split(' ')[0]

              return (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  {/* Service Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {serviceName} - {entry.therapist}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Price: {entry.price.toLocaleString()} THB
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded text-sm font-bold ${
                        serviceStatus === 'paid' ? 'bg-brand-green-100 text-brand-green-700' :
                        serviceStatus === 'partial' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {serviceStatus === 'paid' ? t('payment.paid') : 
                         serviceStatus === 'partial' ? t('payment.partial') : 
                         t('payment.unpaid')}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Paid: {servicePaid.toLocaleString()} / {entry.price.toLocaleString()} THB
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods for this Service */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">{t('payment.paymentMethods')}</h4>
                      <button
                        onClick={() => handleAddPaymentMethod(entry.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-brand-blue-600 hover:bg-brand-blue-50 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t('payment.addPayment')}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {payments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
                          No payment recorded. Click "Add Payment" to record payment.
                        </div>
                      ) : (
                        payments.map((payment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('payment.method')}</label>
                              <select
                                value={payment.method}
                                onChange={(e) => handlePaymentMethodChange(entry.id, index, 'method', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                              >
                                {paymentMethodOptions.map(method => (
                                  <option key={method} value={method}>{method}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('payment.amount')} (THB)</label>
                              <input
                                type="number"
                                value={payment.amount}
                                onChange={(e) => handleAmountChange(entry.id, index, parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                                min="0"
                                max={entry.price}
                                step="1"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              {payments.length > 1 && (
                                <button
                                  onClick={() => handleRemovePaymentMethod(entry.id, index)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  aria-label="Remove payment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reference Number for non-cash payments */}
                          {payment.method !== 'Cash' && (
                            <div className="mt-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                {t('payment.reference')} {payment.method === 'QR Code' || payment.method === 'Bank Transfer' ? '(Required)' : '(Optional)'}
                              </label>
                              <input
                                type="text"
                                value={referenceNumbers[entry.id]?.[index] || ''}
                                onChange={(e) => setReferenceNumbers(prev => ({
                                  ...prev,
                                  [entry.id]: {
                                    ...(prev[entry.id] || {}),
                                    [index]: e.target.value
                                  }
                                }))}
                                placeholder="Enter reference number"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                              />
                            </div>
                          )}

                          {/* Verification checkbox for non-cash */}
                          {payment.method !== 'Cash' && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={payment.verified}
                                onChange={(e) => handlePaymentMethodChange(entry.id, index, 'verified', e.target.checked)}
                                className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                              />
                              <label className="text-xs text-gray-700">{t('payment.verified')}</label>
                            </div>
                          )}
                        </div>
                        ))
                      )}
                    </div>

                    {/* Service Payment Summary */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Service Total:</span>
                        <span className="font-semibold text-gray-900">{entry.price.toLocaleString()} THB</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-700">Paid:</span>
                        <span className="font-semibold text-brand-green-600">{servicePaid.toLocaleString()} THB</span>
                      </div>
                      {serviceRemaining > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-700">Remaining:</span>
                          <span className="font-semibold text-orange-600">{serviceRemaining.toLocaleString()} THB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Overall Payment Summary */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('payment.paymentSummary')}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{t('payment.totalAmount')}:</span>
                <span className="text-sm font-bold text-gray-900">{totalAmount.toLocaleString()} THB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{t('payment.totalPaid')}:</span>
                <span className="text-sm font-bold text-brand-green-600">{totalPaid.toLocaleString()} THB</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-blue-200">
                <span className="text-base font-bold text-gray-900">{t('payment.remaining')}:</span>
                <span className={`text-lg font-bold ${remaining > 0 ? 'text-orange-600' : 'text-brand-green-600'}`}>
                  {remaining.toLocaleString()} THB
                </span>
              </div>
            </div>

            {/* Overall Payment Status Badge */}
            <div className="mt-3 pt-3 border-t border-brand-blue-200">
              <div className="flex items-center gap-2">
                {overallPaymentStatus === 'paid' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-brand-green-600" />
                    <span className="text-sm font-semibold text-brand-green-700">{t('payment.fullyPaid')}</span>
                  </>
                )}
                {overallPaymentStatus === 'partial' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-700">{t('payment.partiallyPaid')}</span>
                  </>
                )}
                {overallPaymentStatus === 'unpaid' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">{t('payment.unpaid')}</span>
                  </>
                )}
              </div>
            </div>
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
            disabled={!allServicesCompleted}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors shadow-md flex items-center gap-2 ${
              allServicesCompleted
                ? 'bg-brand-blue-500 hover:bg-brand-blue-600 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={!allServicesCompleted ? t('payment.completeServicesFirst') : t('payment.savePayment')}
          >
            <DollarSign className="w-5 h-5" />
            {t('payment.savePayment')}
          </button>
        </div>
      </div>
    </div>
  )
}
