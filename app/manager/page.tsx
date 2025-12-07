'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Plus, X, Users, BarChart3, ClipboardList, Layers, DollarSign, CheckCircle, AlertCircle, Clock, PlusCircle, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import AddEntryModal from '@/components/AddEntryModal'
import AddGroupModal from '@/components/AddGroupModal'
import PaymentCollectionModal from '@/components/PaymentCollectionModal'
import ScheduledBookingModal from '@/components/ScheduledBookingModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTherapistStatus } from '@/contexts/TherapistStatusContext'
import LanguagePicker from '@/components/LanguagePicker'

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
  time: string // service start / assignment time
  endTime?: string // service end time when manager closes out the service
  extendedMinutes?: number // Extended time in minutes
  originalPrice?: number // Original service price before extensions
  column: number
  round: number // Track which round-robin cycle this entry belongs to
  groupNumber?: number // Sequential group number for the day
  paymentType?: string // Payment method (Cash, Card, QR, etc.)
  paymentStatus?: 'paid' | 'unpaid' | 'partial' // Payment status
  paymentDetails?: PaymentDetail[] // Payment history (for split payments)
  notes?: string // Entry notes
  scheduledTime?: string // ISO datetime string for scheduled bookings
  isScheduled?: boolean // Flag to indicate if this is a scheduled booking
}

// Mock therapist data with certified services - in real app, this would come from backend
interface TherapistData {
  name: string
  certifiedServices?: string[]
  commissionRate?: number
}

const therapistsData: TherapistData[] = [
  { name: 'Lisa', certifiedServices: ['1', '2', '3', '4'], commissionRate: 50 },
  { name: 'Sarah', certifiedServices: ['1', '2', '5', '6'], commissionRate: 50 },
  { name: 'Emma', certifiedServices: ['3', '4', '7'], commissionRate: 45 },
  { name: 'Maya', certifiedServices: ['1', '2', '3', '4', '5', '6'], commissionRate: 50 },
  { name: 'Anna', certifiedServices: ['1', '8'], commissionRate: 50 },
]

const therapists = therapistsData.map(t => t.name)

// Available services - in real app, this would come from Services Management
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

// Extract service names from the services array (remove prices)
const serviceNames = availableServices.map(s => s.name)
const services = availableServices.map(s => `${s.name} ${s.price}`)
const maxColumns = 20 // Maximum number of service columns per therapist

export default function ManagerDailyMatrix() {
  const { t } = useLanguage()
  const { loggedInTherapists } = useTherapistStatus()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isScheduledBookingModalOpen, setIsScheduledBookingModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedGroupForPayment, setSelectedGroupForPayment] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'assignment' | 'chart' | 'therapist' | 'payments'>('assignment')
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([])
  // Round-robin: track which therapist is next in rotation
  const [nextTherapistIndex, setNextTherapistIndex] = useState(0)
  // Track the current queue order of therapists (only logged-in ones)
  const [therapistQueue, setTherapistQueue] = useState<string[]>([])
  const [now, setNow] = useState<Date | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [extendServiceModal, setExtendServiceModal] = useState<{ 
    open: boolean
    entryId: string | null
    currentMinutes: number
    originalPrice: number
    baseDuration: number
  }>({
    open: false,
    entryId: null,
    currentMinutes: 0,
    originalPrice: 0,
    baseDuration: 60,
  })
  const [addServiceModal, setAddServiceModal] = useState<{ open: boolean; entryId: string | null }>({
    open: false,
    entryId: null,
  })

  // Start live clock for current time display (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize immediately after mount
    setNow(new Date())

    // Update every 30 seconds (good enough for UI clock)
    const id = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(id)
  }, [])

  // Broadcast data for public display board (service entries + queue)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const payload = {
      serviceEntries,
      therapistQueue,
      nextTherapistIndex,
    }
    try {
      localStorage.setItem('serviceBoardData', JSON.stringify(payload))
      window.dispatchEvent(
        new CustomEvent('serviceBoardDataChanged', {
          detail: payload,
        })
      )
    } catch (e) {
      console.error('Error saving serviceBoardData to localStorage', e)
    }
  }, [serviceEntries, therapistQueue, nextTherapistIndex])

  // Get available therapists (logged-in and certified)
  const getAvailableTherapists = useMemo(() => {
    return therapistsData
      .filter(t => 
        loggedInTherapists.includes(t.name) && 
        t.certifiedServices && 
        t.certifiedServices.length > 0
      )
      .map(t => t.name)
  }, [loggedInTherapists])

  // Update queue when logged-in therapists change
  useEffect(() => {
    // Update queue, preserving order where possible
    setTherapistQueue(prev => {
      // Keep existing order for therapists still logged in
      const stillLoggedIn = prev.filter(name => getAvailableTherapists.includes(name))
      // Add newly logged-in therapists to the end
      const newlyLoggedIn = getAvailableTherapists.filter(name => !prev.includes(name))
      const newQueue = [...stillLoggedIn, ...newlyLoggedIn]
      
      // Adjust nextTherapistIndex if current therapist is no longer in queue
      if (newQueue.length > 0 && nextTherapistIndex >= newQueue.length) {
        setNextTherapistIndex(0)
      } else if (newQueue.length === 0) {
        setNextTherapistIndex(0)
      }
      
      return newQueue
    })
  }, [getAvailableTherapists, nextTherapistIndex])

  // Listen for therapist status changes
  useEffect(() => {
    const handleStatusChange = () => {
      // Queue will update via the loggedInTherapists dependency
    }
    window.addEventListener('therapistStatusChanged', handleStatusChange)
    return () => window.removeEventListener('therapistStatusChanged', handleStatusChange)
  }, [])
  // Track service counts per therapist for current round
  const [roundServiceCounts, setRoundServiceCounts] = useState<Record<string, number>>({})
  // Track current round number
  const [currentRound, setCurrentRound] = useState(1)
  // Track current group number (sequential for the day)
  const [currentGroupNumber, setCurrentGroupNumber] = useState(1)
  
  // Mock check-in times - in real app, this would come from backend
  const [checkInTimes] = useState<Record<string, string>>({
    'Lisa': '09:00',
    'Sarah': '09:15',
    'Emma': '09:30',
    'Maya': '10:00',
    'Anna': '10:30',
  })
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  })

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

  // Helper: Parse time string (HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Helper: Convert minutes since midnight to time string (HH:MM)
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Helper: Calculate service end time based on start time, base duration, and extensions
  const calculateServiceEndTime = (startTime: string, serviceName: string, extendedMinutes: number = 0): string => {
    const baseDuration = serviceDurations[serviceName] || 60
    const totalDuration = baseDuration + extendedMinutes
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + totalDuration
    return minutesToTime(endMinutes)
  }

  // Helper: Get service duration in minutes
  const getServiceDuration = (serviceName: string, extendedMinutes: number = 0): number => {
    const baseDuration = serviceDurations[serviceName] || 60
    return baseDuration + extendedMinutes
  }

  // Helper: Check if a therapist has any overlapping services at a given time
  const isTherapistAvailable = (therapist: string, startTime: string, serviceName: string, extendedMinutes: number = 0, excludeEntryId?: string): boolean => {
    const serviceDuration = getServiceDuration(serviceName, extendedMinutes)
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + serviceDuration

    // Check all services for this therapist (excluding the current entry if editing)
    const therapistServices = serviceEntries.filter(
      e => e.therapist === therapist && e.id !== excludeEntryId
    )

    for (const service of therapistServices) {
      const serviceNameOnly = service.service.split(' ')[0]
      const serviceStartMinutes = timeToMinutes(service.time)
      const serviceEndMinutes = service.endTime 
        ? timeToMinutes(service.endTime)
        : serviceStartMinutes + getServiceDuration(serviceNameOnly, service.extendedMinutes || 0)

      // Check for overlap: new service starts before existing service ends AND new service ends after existing service starts
      if (startMinutes < serviceEndMinutes && endMinutes > serviceStartMinutes) {
        return false // Overlap detected
      }
    }

    return true // No overlap
  }

  // Helper: Find the next available time for a therapist (after their last service ends)
  const getNextAvailableTime = (therapist: string): string => {
    const therapistServices = serviceEntries
      .filter(e => e.therapist === therapist)
      .sort((a, b) => {
        const aEnd = a.endTime 
          ? timeToMinutes(a.endTime)
          : timeToMinutes(a.time) + getServiceDuration(a.service.split(' ')[0], a.extendedMinutes || 0)
        const bEnd = b.endTime
          ? timeToMinutes(b.endTime)
          : timeToMinutes(b.time) + getServiceDuration(b.service.split(' ')[0], b.extendedMinutes || 0)
        return bEnd - aEnd // Sort descending (latest end time first)
      })

    if (therapistServices.length === 0) {
      // No existing services, use current time
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }

    // Get the latest service end time
    const latestService = therapistServices[0]
    const latestServiceName = latestService.service.split(' ')[0]
    const latestEndTime = latestService.endTime
      ? timeToMinutes(latestService.endTime)
      : timeToMinutes(latestService.time) + getServiceDuration(latestServiceName, latestService.extendedMinutes || 0)

    // Return the end time as the next available start time
    return minutesToTime(latestEndTime)
  }

  // Get the next therapist in round-robin rotation for a specific service
  // This is a pure function that doesn't modify state - returns the therapist to use
  const getNextTherapistForService = (serviceId: string) => {
    // Determine which therapists are currently busy (have an active service without endTime)
    const busyTherapists = new Set(
      serviceEntries
        .filter(entry => entry.therapist && !entry.endTime)
        .map(entry => entry.therapist)
    )

    // Find therapists certified for this service from the current queue
    // and who are NOT currently busy
    const certifiedTherapists = therapistQueue.filter(therapistName => {
      const therapistInfo = therapistsData.find(t => t.name === therapistName)
      const isCertified = therapistInfo?.certifiedServices?.includes(serviceId)
      const isBusy = busyTherapists.has(therapistName)
      return Boolean(isCertified && !isBusy)
    })
    
    if (certifiedTherapists.length === 0) return null
    
    // Check if the therapist at nextTherapistIndex is certified and not busy
    const nextTherapist = therapistQueue[nextTherapistIndex]
    const nextTherapistInfo = therapistsData.find(t => t.name === nextTherapist)
    const isNextTherapistCertified = nextTherapistInfo?.certifiedServices?.includes(serviceId)
    const isNextTherapistBusy = busyTherapists.has(nextTherapist)
    
    if (isNextTherapistCertified && !isNextTherapistBusy) {
      // Next therapist is certified and free, use them
      const serviceCount = roundServiceCounts[nextTherapist] || 0
      if (serviceCount === 0) {
        return nextTherapist
      }
    }
    
    // Next therapist is not certified or is busy, find the first certified & free therapist in the queue
    // Priority: find one who hasn't received a service in this round
    for (const therapist of therapistQueue) {
      if (certifiedTherapists.includes(therapist)) {
        const serviceCount = roundServiceCounts[therapist] || 0
        if (serviceCount === 0) {
          // Return this therapist (queue will be updated in handleAddEntry)
          return therapist
        }
      }
    }
    
    // If all certified therapists have received a service, use the first certified one
    return certifiedTherapists[0] || null
  }

  const handleAddEntry = (entry: any) => {
    // Extract service ID to verify therapist assignment
    const serviceName = entry.service.split(' ')[0] // Get service name before price
    const selectedService = availableServices.find(s => s.name === serviceName)
    const serviceId = selectedService?.id
    
    // In auto mode, the therapist should already be set by the modal based on service
    // But verify they're certified for this service and update queue if needed
    let assignedTherapist = entry.therapist
    let needsQueueUpdate = false
    
    if (entry.timeSlot === 'auto' && serviceId) {
      // Verify the assigned therapist can perform this service
      const therapistInfo = therapistsData.find(t => t.name === assignedTherapist)
      const isAssignedCertified = therapistInfo?.certifiedServices?.includes(serviceId)
      
      if (!isAssignedCertified) {
        // If not certified, find the next therapist who can
        const nextTherapist = getNextTherapistForService(serviceId)
        if (nextTherapist) {
          assignedTherapist = nextTherapist
          needsQueueUpdate = true // Need to move this therapist to front
        }
      } else {
        // Check if assigned therapist is at the front of queue
        const assignedIndex = therapistQueue.indexOf(assignedTherapist)
        if (assignedIndex !== nextTherapistIndex) {
          // Therapist is certified but not at front - move them to front
          needsQueueUpdate = true
        }
      }
    }
    
    // Update queue if needed: move assigned therapist to front
    if (needsQueueUpdate && entry.timeSlot === 'auto') {
      const assignedIndex = therapistQueue.indexOf(assignedTherapist)
      if (assignedIndex >= 0 && assignedIndex !== 0) {
        // Move therapist to front of queue
        const newQueue = [assignedTherapist, ...therapistQueue.filter(t => t !== assignedTherapist)]
        setTherapistQueue(newQueue)
        setNextTherapistIndex(0)
      }
    }
    
    // Calculate the correct start time to avoid conflicts
    let serviceStartTime: string
    if (entry.timeSlot === 'auto') {
      // For auto mode, calculate next available time for this therapist
      serviceStartTime = getNextAvailableTime(assignedTherapist)
    } else {
      // For manual mode, use the provided time but check for conflicts
      serviceStartTime = entry.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      
      // Check if therapist is available at this time
      if (!isTherapistAvailable(assignedTherapist, serviceStartTime, serviceName, 0)) {
        // Conflict detected - use next available time instead
        serviceStartTime = getNextAvailableTime(assignedTherapist)
        alert(`Therapist ${assignedTherapist} has a scheduling conflict. Service will start at ${serviceStartTime} instead.`)
      }
    }
    
    const therapistEntries = serviceEntries.filter(e => e.therapist === assignedTherapist)
    const nextColumn = therapistEntries.length > 0 
      ? Math.max(...therapistEntries.map(e => e.column)) + 1 
      : 1
    
    // Get active therapists for round completion check (only logged-in ones)
    const activeTherapists = getAvailableTherapists
    
    // Check if current round will be complete after adding this entry
    const currentCounts = { ...roundServiceCounts }
    currentCounts[assignedTherapist] = (currentCounts[assignedTherapist] || 0) + 1
    const allHaveService = activeTherapists.every(therapist => 
      (currentCounts[therapist] || 0) > 0
    )
    
    // Determine which round this entry belongs to
    // Always assign to currentRound - the last entry that completes a round should still be in that round
    let entryRound: number
    if (entry.timeSlot === 'auto') {
      // For auto mode: always use currentRound (even if it completes the round)
      entryRound = currentRound
    } else {
      // For manual mode, use the highest round for this therapist + 1, or currentRound if they have no entries
      const therapistRounds = serviceEntries
        .filter(e => e.therapist === assignedTherapist)
        .map(e => e.round)
      entryRound = therapistRounds.length > 0 
        ? Math.max(...therapistRounds) + 1 
        : currentRound
    }
    
    // Determine payment status
    const paymentStatus = entry.paymentType === 'Unpaid' ? 'unpaid' : 'paid'
    const paymentDetails: PaymentDetail[] = entry.paymentType !== 'Unpaid' ? [{
      method: entry.paymentType || 'Cash',
      amount: entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0),
      verified: true,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }] : []

    const finalPrice = entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)
    const newEntry: ServiceEntry = {
      id: Date.now().toString(),
      therapist: assignedTherapist,
      service: `${entry.service} ${entry.price}`,
      price: finalPrice,
      originalPrice: finalPrice, // Store original price for extension calculations
      time: serviceStartTime, // Use calculated start time to avoid conflicts
      column: entry.timeSlot === 'auto' ? nextColumn : parseInt(entry.timeSlot) || nextColumn,
      round: entryRound,
      paymentType: entry.paymentType || 'Cash',
      paymentStatus: paymentStatus,
      paymentDetails: paymentDetails,
      notes: entry.notes
    }
    
    // Update round service counts and round number
    if (allHaveService) {
      // Round is complete - reset counts, reset queue, and increment round
      setRoundServiceCounts({})
      setNextTherapistIndex(0)
      // Reset queue to include all logged-in active therapists
      setTherapistQueue([...getAvailableTherapists])
      setCurrentRound(prev => prev + 1)
    } else {
      // Update counts for current round
      setRoundServiceCounts(currentCounts)
      
      // Adjust queue: move assigned therapist to the back of the queue
      if (entry.timeSlot === 'auto') {
        const assignedIndex = therapistQueue.indexOf(assignedTherapist)
        
        if (assignedIndex >= 0) {
          // Move the assigned therapist to the back of the queue (not remove them)
          const newQueue = [
            ...therapistQueue.filter(t => t !== assignedTherapist),
            assignedTherapist  // Add them to the end
          ]
          setTherapistQueue(newQueue)
          
          // Adjust nextTherapistIndex based on where the therapist was
          if (assignedIndex === nextTherapistIndex) {
            // Assigned therapist was at the current queue position
            // The next therapist (who was at assignedIndex + 1) is now at assignedIndex
            // So nextTherapistIndex stays the same (pointing to the therapist who moved up)
            // But if we were at the end, wrap to 0
            if (nextTherapistIndex >= newQueue.length - 1) {
              setNextTherapistIndex(0)
            }
          } else if (assignedIndex < nextTherapistIndex) {
            // Assigned therapist was before the current queue position
            // Everyone from assignedIndex+1 to nextTherapistIndex-1 moved up one position
            // So nextTherapistIndex should decrement by 1
            setNextTherapistIndex(prev => Math.max(0, prev - 1))
          }
          // If assignedIndex > nextTherapistIndex, no adjustment needed
          // (the assigned therapist was after the queue position, and moving them to back doesn't affect it)
        }
      }
    }
    
    setServiceEntries([...serviceEntries, newEntry])
    setIsModalOpen(false)
  }

  // Handle scheduled booking
  const handleScheduledBooking = (entry: any) => {
    // Extract service ID to verify therapist assignment
    const serviceName = entry.service.split(' ')[0]
    const selectedService = availableServices.find(s => s.name === serviceName)
    const serviceId = selectedService?.id

    // Verify therapist is certified
    if (serviceId) {
      const therapistInfo = therapistsData.find(t => t.name === entry.therapist)
      const isCertified = therapistInfo?.certifiedServices?.includes(serviceId)
      
      if (!isCertified) {
        // Silently return - validation should happen in the modal
        return
      }
    }

    // Calculate scheduled time in HH:MM format
    const scheduledDateTime = new Date(entry.scheduledDateTime)
    const scheduledTimeStr = scheduledDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    // Get next column for this therapist (based on existing entries)
    const therapistEntries = serviceEntries.filter(e => e.therapist === entry.therapist)
    const nextColumn = therapistEntries.length > 0 
      ? Math.max(...therapistEntries.map(e => e.column)) + 1 
      : 1

    // Determine round (use current round or highest round for therapist + 1)
    const therapistRounds = serviceEntries
      .filter(e => e.therapist === entry.therapist)
      .map(e => e.round)
    const entryRound = therapistRounds.length > 0 
      ? Math.max(...therapistRounds) + 1 
      : currentRound

    // Determine payment status
    const paymentStatus = entry.paymentType === 'Unpaid' ? 'unpaid' : 'paid'
    const paymentDetails: PaymentDetail[] = entry.paymentType !== 'Unpaid' ? [{
      method: entry.paymentType || 'Cash',
      amount: entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0),
      verified: true,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }] : []

    const finalPrice = entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)
    const scheduledEntry: ServiceEntry = {
      id: `scheduled-${Date.now()}`,
      therapist: entry.therapist,
      service: `${entry.service} ${entry.price}`,
      price: finalPrice,
      originalPrice: finalPrice,
      time: scheduledTimeStr, // Will be updated when activated
      column: nextColumn,
      round: entryRound,
      paymentType: entry.paymentType || 'Cash',
      paymentStatus: paymentStatus,
      paymentDetails: paymentDetails,
      notes: entry.notes || `Scheduled for ${entry.scheduledDate} at ${entry.scheduledTime}`,
      scheduledTime: entry.scheduledDateTime, // Store ISO datetime string
      isScheduled: true, // Flag as scheduled
    }

    setServiceEntries([...serviceEntries, scheduledEntry])
    setIsScheduledBookingModalOpen(false)
    // Booking scheduled successfully - no alert needed
  }

  // Check and activate scheduled bookings
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkScheduledBookings = () => {
      const now = new Date()
      setServiceEntries(prevEntries => {
        const updated = prevEntries.map(entry => {
          // If entry is scheduled and time has arrived, activate it
          if (entry.isScheduled && entry.scheduledTime && !entry.endTime) {
            const scheduledTime = new Date(entry.scheduledTime)
            // Activate if scheduled time is within the last minute (to account for timing)
            const timeDiff = now.getTime() - scheduledTime.getTime()
            if (timeDiff >= 0 && timeDiff < 60000) { // Within 1 minute
              // Update time to actual activation time
              const actualTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              return {
                ...entry,
                time: actualTime,
                isScheduled: false, // Remove scheduled flag
                notes: entry.notes?.replace(/Scheduled for.*/, '') || '',
              }
            }
          }
          return entry
        })
        return updated
      })
    }

    // Check every minute
    const intervalId = setInterval(checkScheduledBookings, 60000)
    
    // Also check immediately
    checkScheduledBookings()

    return () => clearInterval(intervalId)
  }, [])

  const handleAddGroup = (entries: any[]) => {
    // Process all group entries and add them to serviceEntries
    // Assign the same group number to all entries in this group
    const groupNumber = currentGroupNumber
    const newEntries: ServiceEntry[] = []
    let updatedRoundServiceCounts = { ...roundServiceCounts }
    let updatedTherapistQueue = [...therapistQueue]
    let updatedNextTherapistIndex = nextTherapistIndex
    let updatedCurrentRound = currentRound
    
    // Track therapists already assigned in this group to prevent duplicate assignments
    const therapistsAssignedInGroup = new Set<string>()
    
    entries.forEach((entry, index) => {
      // Extract service ID to verify therapist assignment
      const serviceName = entry.service.split(' ')[0]
      const selectedService = availableServices.find(s => s.name === serviceName)
      const serviceId = selectedService?.id
      
      let assignedTherapist = entry.therapist
      
      if (entry.timeSlot === 'auto' && serviceId) {
        // Determine which therapists are currently busy (have an active service without endTime)
        const busyTherapists = new Set(
          serviceEntries
            .filter(e => e.therapist && !e.endTime)
            .map(e => e.therapist)
        )
        
        // Find therapists certified for this service from the current queue
        // who are NOT currently busy AND NOT already assigned in this group
        const certifiedTherapists = updatedTherapistQueue.filter(therapistName => {
          const therapistInfo = therapistsData.find(t => t.name === therapistName)
          const isCertified = therapistInfo?.certifiedServices?.includes(serviceId)
          const isBusy = busyTherapists.has(therapistName)
          const isAlreadyAssignedInGroup = therapistsAssignedInGroup.has(therapistName)
          return Boolean(isCertified && !isBusy && !isAlreadyAssignedInGroup)
        })
        
        if (certifiedTherapists.length > 0) {
          // Check if the therapist at nextTherapistIndex is available
          const nextTherapist = updatedTherapistQueue[updatedNextTherapistIndex]
          const nextTherapistInfo = therapistsData.find(t => t.name === nextTherapist)
          const isNextTherapistCertified = nextTherapistInfo?.certifiedServices?.includes(serviceId)
          const isNextTherapistBusy = busyTherapists.has(nextTherapist)
          const isNextTherapistInGroup = therapistsAssignedInGroup.has(nextTherapist)
          
          if (isNextTherapistCertified && !isNextTherapistBusy && !isNextTherapistInGroup) {
            // Next therapist is certified, free, and not in this group - use them
            const serviceCount = updatedRoundServiceCounts[nextTherapist] || 0
            if (serviceCount === 0) {
              assignedTherapist = nextTherapist
            } else {
              // Find first certified therapist who hasn't received a service in this round
              for (const therapist of updatedTherapistQueue) {
                if (certifiedTherapists.includes(therapist)) {
                  const serviceCount = updatedRoundServiceCounts[therapist] || 0
                  if (serviceCount === 0) {
                    assignedTherapist = therapist
                    break
                  }
                }
              }
              // If all have services, use first available
              if (assignedTherapist === entry.therapist && certifiedTherapists.length > 0) {
                assignedTherapist = certifiedTherapists[0]
              }
            }
          } else {
            // Next therapist is not available, find first certified & free therapist not in group
            for (const therapist of updatedTherapistQueue) {
              if (certifiedTherapists.includes(therapist)) {
                const serviceCount = updatedRoundServiceCounts[therapist] || 0
                if (serviceCount === 0) {
                  assignedTherapist = therapist
                  break
                }
              }
            }
            // If all have services, use first available
            if (assignedTherapist === entry.therapist && certifiedTherapists.length > 0) {
              assignedTherapist = certifiedTherapists[0]
            }
          }
        } else {
          // No available therapists - this shouldn't happen, but fallback to original
          const therapistInfo = therapistsData.find(t => t.name === assignedTherapist)
          const isAssignedCertified = therapistInfo?.certifiedServices?.includes(serviceId)
          if (!isAssignedCertified) {
            // Try to find any certified therapist (even if busy or in group)
            const anyCertified = therapistsData
              .filter(t => t.certifiedServices?.includes(serviceId))
              .map(t => t.name)
              .filter(name => loggedInTherapists.includes(name))
            if (anyCertified.length > 0) {
              assignedTherapist = anyCertified[0]
            }
          }
        }
      }
      
      // Mark this therapist as assigned in this group
      therapistsAssignedInGroup.add(assignedTherapist)
      
      // Calculate next column for this therapist
      const existingEntries = [...serviceEntries, ...newEntries]
      const therapistEntries = existingEntries.filter(e => e.therapist === assignedTherapist)
      const nextColumn = therapistEntries.length > 0 
        ? Math.max(...therapistEntries.map(e => e.column)) + 1 
        : 1
      
      // Check round completion
      const activeTherapists = getAvailableTherapists
      updatedRoundServiceCounts[assignedTherapist] = (updatedRoundServiceCounts[assignedTherapist] || 0) + 1
      const allHaveService = activeTherapists.every(therapist => 
        (updatedRoundServiceCounts[therapist] || 0) > 0
      )
      
      // Determine round
      let entryRound: number
      if (entry.timeSlot === 'auto') {
        entryRound = updatedCurrentRound
      } else {
        const therapistRounds = existingEntries
          .filter(e => e.therapist === assignedTherapist)
          .map(e => e.round)
        entryRound = therapistRounds.length > 0 
          ? Math.max(...therapistRounds) + 1 
          : updatedCurrentRound
      }
      
      // Determine payment status for group entries
      // Group payment is handled at group level, individual entries inherit status
      const groupPaymentStatus = entries[0]?.paymentType === 'Unpaid' ? 'unpaid' : 
                                 entries[0]?.paymentType ? 'paid' : 'unpaid'
      
      // Calculate the correct start time to avoid conflicts
      let serviceStartTime: string
      if (entry.timeSlot === 'auto') {
        // For auto mode, calculate next available time for this therapist
        // Use existing entries + already processed entries in this group
        const allExistingEntries = [...serviceEntries, ...newEntries]
        const therapistServices = allExistingEntries.filter(e => e.therapist === assignedTherapist)
        
        if (therapistServices.length === 0) {
          serviceStartTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        } else {
          // Find the latest end time for this therapist
          const sortedServices = therapistServices.sort((a, b) => {
            const aEnd = a.endTime 
              ? timeToMinutes(a.endTime)
              : timeToMinutes(a.time) + getServiceDuration(a.service.split(' ')[0], a.extendedMinutes || 0)
            const bEnd = b.endTime
              ? timeToMinutes(b.endTime)
              : timeToMinutes(b.time) + getServiceDuration(b.service.split(' ')[0], b.extendedMinutes || 0)
            return bEnd - aEnd
          })
          
          const latestService = sortedServices[0]
          const latestServiceName = latestService.service.split(' ')[0]
          const latestEndTime = latestService.endTime
            ? timeToMinutes(latestService.endTime)
            : timeToMinutes(latestService.time) + getServiceDuration(latestServiceName, latestService.extendedMinutes || 0)
          
          serviceStartTime = minutesToTime(latestEndTime)
        }
      } else {
        // For manual mode, use the provided time but check for conflicts
        serviceStartTime = entry.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        
        // Check if therapist is available at this time
        const allExistingEntries = [...serviceEntries, ...newEntries]
        if (!isTherapistAvailable(assignedTherapist, serviceStartTime, serviceName, 0)) {
          // Conflict detected - use next available time instead
          const therapistServices = allExistingEntries.filter(e => e.therapist === assignedTherapist)
          if (therapistServices.length > 0) {
            const sortedServices = therapistServices.sort((a, b) => {
              const aEnd = a.endTime 
                ? timeToMinutes(a.endTime)
                : timeToMinutes(a.time) + getServiceDuration(a.service.split(' ')[0], a.extendedMinutes || 0)
              const bEnd = b.endTime
                ? timeToMinutes(b.endTime)
                : timeToMinutes(b.time) + getServiceDuration(b.service.split(' ')[0], b.extendedMinutes || 0)
              return bEnd - aEnd
            })
            
            const latestService = sortedServices[0]
            const latestServiceName = latestService.service.split(' ')[0]
            const latestEndTime = latestService.endTime
              ? timeToMinutes(latestService.endTime)
              : timeToMinutes(latestService.time) + getServiceDuration(latestServiceName, latestService.extendedMinutes || 0)
            
            serviceStartTime = minutesToTime(latestEndTime)
          }
        }
      }
      
      // Create new entry with group number and payment info
      const finalPrice = entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)
      const newEntry: ServiceEntry = {
        id: `${Date.now()}-${index}`,
        therapist: assignedTherapist,
        service: `${entry.service} ${entry.price}`,
        price: finalPrice,
        originalPrice: finalPrice, // Store original price for extension calculations
        time: serviceStartTime, // Use calculated start time to avoid conflicts
        column: entry.timeSlot === 'auto' ? nextColumn : parseInt(entry.timeSlot) || nextColumn,
        round: entryRound,
        groupNumber: groupNumber,
        paymentType: entries[0]?.paymentType || 'Cash',
        paymentStatus: groupPaymentStatus,
        notes: entries[0]?.notes
      }
      
      newEntries.push(newEntry)
      
      // Update queue: move assigned therapist to back
      if (entry.timeSlot === 'auto') {
        const assignedIndex = updatedTherapistQueue.indexOf(assignedTherapist)
        if (assignedIndex >= 0) {
          updatedTherapistQueue = [
            ...updatedTherapistQueue.filter(t => t !== assignedTherapist),
            assignedTherapist
          ]
          
          if (assignedIndex === updatedNextTherapistIndex) {
            if (updatedNextTherapistIndex >= updatedTherapistQueue.length - 1) {
              updatedNextTherapistIndex = 0
            }
          } else if (assignedIndex < updatedNextTherapistIndex) {
            updatedNextTherapistIndex = Math.max(0, updatedNextTherapistIndex - 1)
          }
        }
      }
      
      // Check if round is complete
      if (allHaveService) {
        updatedRoundServiceCounts = {}
        updatedNextTherapistIndex = 0
        updatedTherapistQueue = [...getAvailableTherapists]
        updatedCurrentRound = updatedCurrentRound + 1
      }
    })
    
    // Apply all updates at once
    setServiceEntries(prev => [...prev, ...newEntries])
    setRoundServiceCounts(updatedRoundServiceCounts)
    setNextTherapistIndex(updatedNextTherapistIndex)
    setTherapistQueue(updatedTherapistQueue)
    setCurrentRound(updatedCurrentRound)
    // Increment group number for next group
    setCurrentGroupNumber(prev => prev + 1)
    setIsGroupModalOpen(false)
    
    // Payment collection will only be available after all services are completed
    // Do not open payment modal automatically
  }

  // Get all entries for a specific group
  const getGroupEntries = (groupNumber: number): ServiceEntry[] => {
    return serviceEntries.filter(entry => entry.groupNumber === groupNumber)
  }

  // Check if all services in a group are completed (have endTime)
  const isGroupCompleted = (groupNumber: number): boolean => {
    const groupEntries = getGroupEntries(groupNumber)
    if (groupEntries.length === 0) return false
    return groupEntries.every(entry => entry.endTime !== undefined)
  }

  // Handle payment collection/update - now supports per-service payments
  interface ServicePayment {
    entryId: string
    paymentDetails: PaymentDetail[]
    paymentStatus: 'paid' | 'unpaid' | 'partial'
  }

  const handlePaymentCollection = (servicePayments: ServicePayment[]) => {
    if (selectedGroupForPayment === null) return

    // Update each service entry with its own payment information
    setServiceEntries(prev => prev.map(entry => {
      if (entry.groupNumber === selectedGroupForPayment) {
        const servicePayment = servicePayments.find(sp => sp.entryId === entry.id)
        if (servicePayment) {
          // Determine payment type from payment details
          const primaryPaymentMethod = servicePayment.paymentDetails[0]?.method || 'Cash'
          const isSplitPayment = servicePayment.paymentDetails.length > 1
          
          return {
            ...entry,
            paymentType: isSplitPayment ? 'Split' : primaryPaymentMethod,
            paymentStatus: servicePayment.paymentStatus,
            paymentDetails: servicePayment.paymentDetails,
          }
        }
      }
      return entry
    }))

    setIsPaymentModalOpen(false)
    setSelectedGroupForPayment(null)
  }

  const getTherapistTotal = (therapistName: string) => {
    return serviceEntries
      .filter(entry => entry.therapist === therapistName)
      .reduce((sum, entry) => sum + entry.price, 0)
  }

  const getShopTotal = () => {
    return serviceEntries.reduce((sum, entry) => sum + entry.price, 0)
  }

  const getCellContent = (therapist: string, serviceName: string, round: number) => {
    // Find entries for this therapist, service type, and round
    const matchingEntries = serviceEntries.filter((e: ServiceEntry) => 
      e.therapist === therapist && 
      e.round === round &&
      e.service.toLowerCase().includes(serviceName.toLowerCase())
    )
    return matchingEntries.length > 0 
      ? matchingEntries.map((e: ServiceEntry) => {
          const price = e.price || e.service.match(/\d+/)?.[0] || ''
          return price ? `${serviceName} ${price}` : e.service
        }).join(', ')
      : '—'
  }

  // Get the service assignment time for a specific round
  const getAssignmentTime = (therapist: string, round: number) => {
    const roundEntries = serviceEntries.filter((e: ServiceEntry) => 
      e.therapist === therapist && e.round === round
    )
    if (roundEntries.length === 0) return '—'
    // Return the earliest time in this round
    const times = roundEntries.map(e => e.time).sort()
    return times[0]
  }

  // Mark a service entry as completed by setting its end time
  const handleEndService = (entryId: string) => {
    const endTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setServiceEntries(prev =>
      prev.map(entry =>
        entry.id === entryId ? { ...entry, endTime } : entry
      )
    )
  }

  // Open extend service modal
  const handleOpenExtendService = (entryId: string) => {
    const entry = serviceEntries.find(e => e.id === entryId)
    if (!entry) return
    
    // Get service duration and original price
    const serviceName = entry.service.split(' ')[0]
    const serviceInfo = availableServices.find(s => s.name === serviceName)
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
    const baseDuration = serviceDurations[serviceName] || 60
    const currentMinutes = baseDuration + (entry.extendedMinutes || 0)
    
    // Get original price (stored or calculate from service info)
    let originalPrice = entry.originalPrice || entry.price
    // If originalPrice is not stored, use serviceInfo price
    if (!entry.originalPrice && serviceInfo) {
      originalPrice = serviceInfo.price
    }
    // If we still don't have it and there are extensions, reverse-calculate
    if (!entry.originalPrice && entry.extendedMinutes && entry.extendedMinutes > 0 && serviceInfo) {
      const pricePerMinute = serviceInfo.price / baseDuration
      const extensionCost = entry.extendedMinutes * pricePerMinute
      originalPrice = entry.price - extensionCost
    }
    
    setExtendServiceModal({
      open: true,
      entryId,
      currentMinutes,
      originalPrice,
      baseDuration,
    })
  }

  // Handle extending service time
  const handleExtendService = (additionalMinutes: number) => {
    if (!extendServiceModal.entryId || additionalMinutes <= 0) return
    
    // Calculate additional cost based on original price/duration ratio
    const pricePerMinute = extendServiceModal.originalPrice / extendServiceModal.baseDuration
    const additionalCost = Math.round(pricePerMinute * additionalMinutes)
    
    setServiceEntries(prev =>
      prev.map(entry => {
        if (entry.id === extendServiceModal.entryId) {
          // Preserve originalPrice if it exists, otherwise use the current originalPrice from modal
          const preservedOriginalPrice = entry.originalPrice || extendServiceModal.originalPrice
          return {
            ...entry,
            extendedMinutes: (entry.extendedMinutes || 0) + additionalMinutes,
            price: entry.price + additionalCost, // Add extension cost to total price
            originalPrice: preservedOriginalPrice, // Preserve original price for future extensions
          }
        }
        return entry
      })
    )
    
    setExtendServiceModal({ 
      open: false, 
      entryId: null, 
      currentMinutes: 0,
      originalPrice: 0,
      baseDuration: 60,
    })
  }

  // Handle adding an additional service to an existing entry
  const handleAddServiceToEntry = (entry: any) => {
    if (!addServiceModal.entryId) return
    
    const existingEntry = serviceEntries.find(e => e.id === addServiceModal.entryId)
    if (!existingEntry) return

    // Extract service name and get service info
    const serviceName = entry.service.split(' ')[0]
    const selectedService = availableServices.find(s => s.name === serviceName)
    if (!selectedService) return

    // Verify therapist is certified for the new service
    const therapistInfo = therapistsData.find(t => t.name === existingEntry.therapist)
    const isCertified = therapistInfo?.certifiedServices?.includes(selectedService.id)
    
    if (!isCertified) {
      alert(`Therapist ${existingEntry.therapist} is not certified for ${serviceName} service.`)
      setAddServiceModal({ open: false, entryId: null })
      return
    }

    // Get existing service duration (base + extended)
    const existingServiceName = existingEntry.service.split(' ')[0]
    const existingBaseDuration = serviceDurations[existingServiceName] || 60
    const existingExtendedMinutes = existingEntry.extendedMinutes || 0
    const existingTotalDuration = existingBaseDuration + existingExtendedMinutes
    
    // Get new service duration
    const newServiceDuration = serviceDurations[serviceName] || 60
    
    // Calculate combined duration
    const combinedDuration = existingTotalDuration + newServiceDuration
    const twoHoursInMinutes = 120
    
    // Calculate when the existing service ends
    const existingServiceEndTime = existingEntry.endTime 
      ? existingEntry.endTime
      : calculateServiceEndTime(existingEntry.time, existingServiceName, existingExtendedMinutes)
    
    // Calculate start time for new service (after existing service ends)
    let newServiceStartTime = existingServiceEndTime
    
    // Check if therapist is available at this time (should be, but verify)
    if (!isTherapistAvailable(existingEntry.therapist, newServiceStartTime, serviceName, 0, existingEntry.id)) {
      // If not available, find next available time
      const nextAvailable = getNextAvailableTime(existingEntry.therapist)
      // Use the later of the two times
      const existingEndMinutes = timeToMinutes(existingServiceEndTime)
      const nextAvailableMinutes = timeToMinutes(nextAvailable)
      newServiceStartTime = nextAvailableMinutes > existingEndMinutes ? nextAvailable : existingServiceEndTime
      
      alert(`Scheduling conflict detected. New service will start at ${newServiceStartTime}.`)
    }
    
    // Determine round: same round if combined duration <= 2 hours, otherwise new round
    let assignedRound = existingEntry.round
    if (combinedDuration > twoHoursInMinutes) {
      // Assign to a new round (highest round for this therapist + 1)
      const therapistRounds = serviceEntries
        .filter(e => e.therapist === existingEntry.therapist)
        .map(e => e.round)
      assignedRound = therapistRounds.length > 0 
        ? Math.max(...therapistRounds) + 1 
        : currentRound + 1
    }

    // Create a new entry for the additional service
    const finalPrice = entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)
    const newServiceEntry: ServiceEntry = {
      id: `${Date.now()}-additional`,
      therapist: existingEntry.therapist,
      service: `${entry.service} ${entry.price}`,
      price: finalPrice,
      originalPrice: finalPrice,
      time: newServiceStartTime, // Start after existing service ends
      column: existingEntry.column, // Same column
      round: assignedRound, // Same round if within 2 hours, otherwise new round
      groupNumber: combinedDuration <= twoHoursInMinutes ? existingEntry.groupNumber : undefined, // Same group only if same round
      paymentType: entry.paymentType || 'Cash',
      paymentStatus: entry.paymentType === 'Unpaid' ? 'unpaid' : 'paid',
      paymentDetails: entry.paymentType !== 'Unpaid' ? [{
        method: entry.paymentType || 'Cash',
        amount: finalPrice,
        verified: true,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }] : [],
      notes: `Additional service added to ${existingEntry.service.split(' ')[0]}`,
    }

    setServiceEntries(prev => [...prev, newServiceEntry])
    setAddServiceModal({ open: false, entryId: null })
  }

  // Get all rounds that have entries for a therapist
  const getTherapistRounds = (therapist: string) => {
    const rounds = new Set(serviceEntries
      .filter(e => e.therapist === therapist)
      .map(e => e.round))
    return Array.from(rounds).sort((a, b) => a - b)
  }

  // Get max rounds across all therapists
  const getMaxRounds = () => {
    const allRounds = new Set(serviceEntries.map(e => e.round))
    return Math.max(...Array.from(allRounds), 1) // At least 1 round
  }

  // Get all rounds that have entries, sorted in descending order (latest first)
  const getRoundsWithEntries = () => {
    const allRounds = new Set(serviceEntries.map(e => e.round))
    const rounds = Array.from(allRounds).sort((a, b) => b - a) // Descending order
    // Always include round 1 if it doesn't exist yet
    if (!rounds.includes(1)) {
      rounds.push(1)
    }
    return rounds.sort((a, b) => b - a) // Ensure descending order
  }

  // Get round total for a specific round
  const getRoundTotal = (round: number) => {
    return serviceEntries
      .filter(entry => entry.round === round)
      .reduce((sum, entry) => sum + entry.price, 0)
  }

  // Get therapist total for a specific round
  const getTherapistRoundTotal = (therapistName: string, round: number) => {
    return serviceEntries
      .filter(entry => entry.therapist === therapistName && entry.round === round)
      .reduce((sum, entry) => sum + entry.price, 0)
  }

  // Get unique group numbers for a specific round
  const getGroupsInRound = (round: number) => {
    const groups = new Set(
      serviceEntries
        .filter(entry => entry.round === round && entry.groupNumber)
        .map(entry => entry.groupNumber)
        .filter((num): num is number => num !== undefined)
    )
    return Array.from(groups).sort((a, b) => a - b)
  }

  // Get overall payment status for a group (based on individual service payments)
  const getGroupPaymentStatus = (groupNumber: number): 'paid' | 'unpaid' | 'partial' => {
    const entries = getGroupEntries(groupNumber)
    if (entries.length === 0) return 'unpaid'
    
    const statuses = entries.map(e => e.paymentStatus || 'unpaid')
    const allPaid = statuses.every(s => s === 'paid')
    const allUnpaid = statuses.every(s => s === 'unpaid')
    
    if (allPaid) return 'paid'
    if (allUnpaid) return 'unpaid'
    return 'partial'
  }

  // Get service distribution data for pie chart
  const getServiceDistribution = useMemo(() => {
    const serviceCounts: Record<string, { name: string; value: number; count: number }> = {}
    
    serviceEntries.forEach(entry => {
      // Extract service name from entry (e.g., "Thai 400" -> "Thai")
      const serviceName = entry.service.split(' ')[0]
      if (!serviceCounts[serviceName]) {
        serviceCounts[serviceName] = { name: serviceName, value: 0, count: 0 }
      }
      serviceCounts[serviceName].value += entry.price
      serviceCounts[serviceName].count += 1
    })
    
    return Object.values(serviceCounts).sort((a, b) => b.value - a.value)
  }, [serviceEntries])

  // Get therapist revenue distribution data for pie chart
  const getTherapistRevenue = useMemo(() => {
    const therapistRevenue: Record<string, { 
      name: string; 
      value: number; 
      count: number; 
      commission: number; 
      storeRevenue: number;
      commissionRate: number;
    }> = {}
    
    serviceEntries.forEach(entry => {
      const therapistName = entry.therapist
      const therapistInfo = therapistsData.find(t => t.name === therapistName)
      const commissionRate = therapistInfo?.commissionRate || 50 // Default 50% if not set
      
      if (!therapistRevenue[therapistName]) {
        therapistRevenue[therapistName] = { 
          name: therapistName, 
          value: 0, 
          count: 0, 
          commission: 0, 
          storeRevenue: 0,
          commissionRate 
        }
      }
      therapistRevenue[therapistName].value += entry.price
      therapistRevenue[therapistName].count += 1
      therapistRevenue[therapistName].commissionRate = commissionRate
    })
    
    // Calculate commission and store revenue for each therapist
    Object.values(therapistRevenue).forEach(therapist => {
      therapist.commission = (therapist.value * therapist.commissionRate) / 100
      therapist.storeRevenue = therapist.value - therapist.commission
    })
    
    return Object.values(therapistRevenue).sort((a, b) => b.value - a.value)
  }, [serviceEntries])

  // Color palette for pie chart
  const COLORS = [
    '#10b981', // brand-green-500
    '#3b82f6', // brand-blue-500
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ]

  const RADIAN = Math.PI / 180

  // Whether there is at least one therapist currently available in the queue
  const hasAvailableTherapists = therapistQueue.length > 0

  // Custom label renderers to keep labels inside pie slices (better for mobile)
  const renderServicePieLabel = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
      name,
    } = props

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const pct = (percent * 100).toFixed(0)

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
      >
        {`${name} ${pct}%`}
      </text>
    )
  }

  const renderTherapistPieLabel = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
      name,
    } = props

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const pct = (percent * 100).toFixed(0)

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
      >
        {`${name} ${pct}%`}
      </text>
    )
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
            <h1 className="text-xl font-bold text-gray-800">
              {t('manager.dailyMatrix')} ({currentDate})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {showGuide ? t('guide.manager.toggle.hide') : t('guide.manager.toggle.show')}
            </button>
            <button
              onClick={() => hasAvailableTherapists && setIsModalOpen(true)}
              disabled={!hasAvailableTherapists}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-md ${
                hasAvailableTherapists
                  ? 'bg-brand-green-500 hover:bg-brand-green-600 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
              title={
                hasAvailableTherapists
                  ? t('manager.addEntry')
                  : 'No therapists are currently clocked in and available'
              }
            >
              <Plus className="w-5 h-5" />
              {t('manager.addEntry')}
            </button>
            <button
              onClick={() => setIsScheduledBookingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-md bg-purple-500 hover:bg-purple-600 text-white cursor-pointer"
              title="Schedule a booking for a future date and time"
            >
              <Calendar className="w-5 h-5" />
              Schedule Booking
            </button>
            <button
              onClick={() => hasAvailableTherapists && setIsGroupModalOpen(true)}
              disabled={!hasAvailableTherapists}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-md ${
                hasAvailableTherapists
                  ? 'bg-brand-blue-500 hover:bg-brand-blue-600 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
              title={
                hasAvailableTherapists
                  ? t('manager.addGroup')
                  : 'No therapists are currently clocked in and available'
              }
            >
              <Layers className="w-5 h-5" />
              {t('manager.addGroup')}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'assignment'
                ? 'border-brand-green-500 text-brand-green-600 bg-brand-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Service Assignment
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'chart'
                ? 'border-brand-green-500 text-brand-green-600 bg-brand-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Service Chart
          </button>
          <button
            onClick={() => setActiveTab('therapist')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'therapist'
                ? 'border-brand-green-500 text-brand-green-600 bg-brand-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Therapist Revenue
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'assignment' && (
        <div className="p-4 space-y-6">
        {/* Simple guide for managers */}
        {showGuide && (
          <div className="bg-white border border-brand-blue-200 rounded-lg p-4 shadow-sm text-xs md:text-sm space-y-2">
            <div className="font-semibold text-brand-blue-800 mb-1">
              {t('guide.manager.assignment.title')}
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>
                {t('guide.manager.assignment.step1')}
              </li>
              <li>
                {t('guide.manager.assignment.step2')}
              </li>
              <li>
                {t('guide.manager.assignment.step3')}
              </li>
              <li>
                {t('guide.manager.assignment.step4')}
              </li>
              <li>
                {t('guide.manager.assignment.step5')}
              </li>
            </ul>
          </div>
        )}
        {/* Current Time Banner for Round Entry View */}
        {now && (
          <div className="flex items-center justify-between bg-brand-blue-50 border border-brand-blue-200 rounded-lg px-4 py-2">
            <span className="text-sm font-semibold text-brand-blue-800">
              Current Time
            </span>
            <span className="text-base font-bold text-brand-blue-900">
              {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Info banner when no therapists are available */}
        {!hasAvailableTherapists && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-500" />
            <div className="text-xs text-yellow-900">
              <div className="font-semibold mb-1">
                No therapists are currently clocked in and available.
              </div>
              <div>
                Ask therapists to <span className="font-semibold">Clock In</span> from the kiosk or use the{' '}
                <span className="font-semibold">Check In</span> buttons in Therapist Management before adding entries.
              </div>
            </div>
          </div>
        )}
        {getRoundsWithEntries().map((round) => {
          const hasEntriesInRound = serviceEntries.some(e => e.round === round)
          
          return (
            <div key={`round-${round}`} className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
              {/* Round Header */}
              <div className="bg-brand-blue-100 border-b-2 border-brand-blue-300 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-brand-blue-800">
                    Round {round} - Entry Sheet
                  </h2>
                  {getGroupsInRound(round).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-blue-700 font-medium">Groups:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {getGroupsInRound(round).map((groupNum) => {
                          const groupPaymentStatus = getGroupPaymentStatus(groupNum)
                          const isCompleted = isGroupCompleted(groupNum)
                          const statusColors = {
                            paid: 'bg-brand-green-200 text-brand-green-800 border-brand-green-400',
                            partial: 'bg-orange-200 text-orange-800 border-orange-400',
                            unpaid: 'bg-red-200 text-red-800 border-red-400',
                          }
                          const canCollectPayment = isCompleted
                          return (
                            <button
                              key={groupNum}
                              onClick={() => {
                                if (canCollectPayment) {
                                  setSelectedGroupForPayment(groupNum)
                                  setIsPaymentModalOpen(true)
                                }
                              }}
                              disabled={!canCollectPayment}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border transition-opacity ${
                                canCollectPayment 
                                  ? `cursor-pointer hover:opacity-80 ${statusColors[groupPaymentStatus]}`
                                  : 'cursor-not-allowed opacity-50 bg-gray-200 text-gray-600 border-gray-300'
                              }`}
                              title={canCollectPayment 
                                ? `Group ${groupNum} - ${t('payment.collectPayment')}`
                                : `Group ${groupNum} - ${t('payment.paymentAvailableAfterCompletion')}`
                              }
                            >
                              G{groupNum}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop / Tablet: Ledger Table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 sticky left-0 bg-gray-100 z-10 min-w-[120px]">
                        Service Assignment Time
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 sticky left-[140px] bg-gray-100 z-10 min-w-[150px]">
                        Therapist
                      </th>
                      {serviceNames.map((serviceName, index) => (
                        <th
                          key={serviceName}
                          className="px-3 py-3 text-center text-xs font-semibold text-gray-700 border-b border-gray-200 min-w-[100px]"
                        >
                          {serviceName}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 bg-gray-50 min-w-[120px] sticky right-0">
                        Round Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {therapistQueue.length > 0 ? (
                      therapistQueue.map((therapist, queuePosition) => {
                        const hasEntries = serviceEntries.some(e => e.therapist === therapist && e.round === round)
                        const isNextInQueue = queuePosition === nextTherapistIndex
                        
                        return (
                          <tr 
                            key={`${therapist}-round-${round}`} 
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              isNextInQueue ? 'bg-brand-green-50 border-l-4 border-brand-green-500' : ''
                            }`}
                          >
                            {/* Service Assignment Time */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-200">
                              {getAssignmentTime(therapist, round)}
                            </td>
                            {/* Therapist */}
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800 sticky left-[140px] bg-white z-10 border-r border-gray-200">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span>{therapist}</span>
                                  {isNextInQueue && (
                                    <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-0.5 rounded">
                                      Next
                                    </span>
                                  )}
                                  <span className="text-xs font-normal text-gray-500">
                                    (#{queuePosition + 1})
                                  </span>
                                </div>
                                <span className="text-xs font-normal text-gray-600 mt-1">
                                  Check-in: {checkInTimes[therapist] || '—'}
                                </span>
                              </div>
                            </td>
                            {/* Service Columns */}
                            {serviceNames.map((serviceName) => {
                              const entriesForCell = serviceEntries.filter((e: ServiceEntry) =>
                                e.therapist === therapist &&
                                e.round === round &&
                                e.service.toLowerCase().includes(serviceName.toLowerCase())
                              )

                              const activeEntries = entriesForCell.filter(e => !e.endTime && !e.isScheduled)
                              const scheduledEntries = entriesForCell.filter(e => !e.endTime && e.isScheduled)
                              const completedEntries = entriesForCell.filter(e => e.endTime)

                              // Determine if this therapist is certified for this service
                              const serviceInfo = availableServices.find(s => s.name === serviceName)
                              const therapistInfo = therapistsData.find(t => t.name === therapist)
                              const isCertified = serviceInfo && therapistInfo?.certifiedServices?.includes(serviceInfo.id)

                              const cellBaseClasses = 'px-3 py-3 text-xs text-center border-l align-top'
                              const cellShadeClasses = isCertified
                                ? 'bg-brand-green-50 text-brand-green-800 border-brand-green-200'
                                : 'bg-red-50 text-red-500 border-red-200 opacity-80'

                              return (
                                <td
                                  key={`${therapist}-${serviceName}-round-${round}`}
                                  className={`${cellBaseClasses} ${cellShadeClasses}`}
                                >
                                  {/* If therapist is not certified, always show em dash */}
                                  {!isCertified && '—'}

                                  {/* Completed services */}
                                  {isCertified && completedEntries.map(entry => (
                                    <div key={entry.id} className="mb-1">
                                      <div className="flex items-center gap-1">
                                        <div className="font-semibold text-gray-800">
                                          {serviceName} {entry.price.toLocaleString()} THB
                                        </div>
                                        {entry.groupNumber && (() => {
                                          const paymentStatus = entry.paymentStatus || 'unpaid'
                                          const groupCompleted = isGroupCompleted(entry.groupNumber!)
                                          const statusColors = {
                                            paid: 'bg-brand-green-100 text-brand-green-700 border-brand-green-300',
                                            partial: 'bg-orange-100 text-orange-700 border-orange-300',
                                            unpaid: 'bg-red-100 text-red-700 border-red-300',
                                          }
                                          return (
                                            <span 
                                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-opacity ${
                                                groupCompleted 
                                                  ? `cursor-pointer hover:opacity-80 ${statusColors[paymentStatus]}`
                                                  : 'cursor-not-allowed opacity-50 bg-gray-100 text-gray-600 border-gray-300'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                if (groupCompleted) {
                                                  setSelectedGroupForPayment(entry.groupNumber!)
                                                  setIsPaymentModalOpen(true)
                                                }
                                              }}
                                              title={groupCompleted 
                                                ? `Group ${entry.groupNumber} - Click to manage payment`
                                                : `Group ${entry.groupNumber} - Payment available after service completion`
                                              }
                                            >
                                              G{entry.groupNumber}
                                            </span>
                                          )
                                        })()}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        Start: {entry.time} • End: {entry.endTime}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Scheduled bookings (not yet activated) */}
                                  {isCertified && scheduledEntries.map(entry => {
                                    const scheduledTime = entry.scheduledTime ? new Date(entry.scheduledTime) : null
                                    const scheduledDateStr = scheduledTime?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                    const scheduledTimeStr = scheduledTime?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                    return (
                                      <div key={entry.id} className="mb-1 p-1.5 bg-purple-50 border border-purple-200 rounded">
                                        <div className="flex items-center gap-1">
                                          <div className="font-semibold text-purple-700 text-[10px]">
                                            {serviceName} {entry.price.toLocaleString()} THB
                                          </div>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-300">
                                            <Calendar className="w-2.5 h-2.5 mr-0.5" />
                                            Scheduled
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-purple-600 mt-0.5">
                                          {scheduledDateStr} at {scheduledTimeStr}
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {/* Active services (no end time yet) */}
                                  {isCertified && activeEntries.map(entry => (
                                    <div key={entry.id} className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <div className="font-semibold text-brand-green-700">
                                          {serviceName} {entry.price.toLocaleString()} THB
                                        </div>
                                        {entry.groupNumber && (() => {
                                          const paymentStatus = entry.paymentStatus || 'unpaid'
                                          const groupCompleted = isGroupCompleted(entry.groupNumber!)
                                          const statusColors = {
                                            paid: 'bg-brand-green-100 text-brand-green-700 border-brand-green-300',
                                            partial: 'bg-orange-100 text-orange-700 border-orange-300',
                                            unpaid: 'bg-red-100 text-red-700 border-red-300',
                                          }
                                          return (
                                            <span 
                                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border transition-opacity ${
                                                groupCompleted 
                                                  ? `cursor-pointer hover:opacity-80 ${statusColors[paymentStatus]}`
                                                  : 'cursor-not-allowed opacity-50 bg-gray-100 text-gray-600 border-gray-300'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                if (groupCompleted) {
                                                  setSelectedGroupForPayment(entry.groupNumber!)
                                                  setIsPaymentModalOpen(true)
                                                }
                                              }}
                                              title={groupCompleted 
                                                ? `Group ${entry.groupNumber} - Click to manage payment`
                                                : `Group ${entry.groupNumber} - Payment available after service completion`
                                              }
                                            >
                                              G{entry.groupNumber}
                                            </span>
                                          )
                                        })()}
                                      </div>
                                      <div className="text-[10px] text-orange-600">
                                        In Progress • Start: {entry.time}
                                        {entry.extendedMinutes && entry.extendedMinutes > 0 && (
                                          <span className="ml-1 text-purple-600">
                                            • Extended: +{entry.extendedMinutes} min
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <button
                                          onClick={() => setAddServiceModal({ open: true, entryId: entry.id })}
                                          className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                                          title="Add additional service"
                                        >
                                          <PlusCircle className="w-3 h-3 mr-0.5" />
                                          Add Service
                                        </button>
                                        <button
                                          onClick={() => handleOpenExtendService(entry.id)}
                                          className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded"
                                          title="Extend service time"
                                        >
                                          <Clock className="w-3 h-3 mr-0.5" />
                                          Extend
                                        </button>
                                        <button
                                          onClick={() => handleEndService(entry.id)}
                                          className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded"
                                        >
                                          End Service
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* If certified and no entries, show em dash */}
                                  {isCertified && entriesForCell.length === 0 && '—'}
                                </td>
                              )
                            })}
                            {/* Round Total for this therapist */}
                            <td className="px-4 py-3 text-sm font-bold text-center text-gray-800 bg-gray-50 sticky right-0 border-l-2 border-gray-300">
                              {getTherapistRoundTotal(therapist, round).toLocaleString()} THB
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={serviceNames.length + 3} className="px-4 py-8 text-center text-gray-500">
                          No therapists are currently logged in. Therapists must log in to be included in the queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-brand-green-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 bg-brand-green-50 z-10 border-r border-gray-200">
                        Round {round} Total
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-[140px] bg-brand-green-50 z-10 border-r border-gray-200">
                        —
                      </td>
                      <td
                        colSpan={serviceNames.length}
                        className="px-4 py-3 text-center text-sm font-bold text-brand-green-700"
                      >
                        —
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-center text-brand-green-700 bg-brand-green-50 sticky right-0 border-l-2 border-gray-300">
                        {getRoundTotal(round).toLocaleString()} THB
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile: Per-Therapist Cards */}
              <div className="block md:hidden p-4 space-y-4">
                {therapistQueue.length > 0 ? (
                  therapistQueue.map((therapist, queuePosition) => {
                    const isNextInQueue = queuePosition === nextTherapistIndex
                    const therapistInfo = therapistsData.find(t => t.name === therapist)

                    // Active (in-progress) services for this therapist and round
                    const activeEntriesForTherapist = serviceEntries.filter(
                      (e: ServiceEntry) =>
                        e.therapist === therapist &&
                        e.round === round &&
                        !e.endTime
                    )

                    // Build per-service info for this therapist and round
                    const servicesForTherapist = serviceNames.map((serviceName) => {
                      const serviceInfo = availableServices.find(s => s.name === serviceName)
                      const isCertified = serviceInfo && therapistInfo?.certifiedServices?.includes(serviceInfo.id)
                      const entriesForService = serviceEntries.filter((e: ServiceEntry) =>
                        e.therapist === therapist &&
                        e.round === round &&
                        e.service.toLowerCase().includes(serviceName.toLowerCase())
                      )
                      const cellContent = entriesForService.length > 0
                        ? entriesForService.map(e => {
                            const price = e.price || e.service.match(/\d+/)?.[0] || ''
                            return price ? `${serviceName} ${price}` : e.service
                          }).join(', ')
                        : '—'
                      return {
                        name: serviceName,
                        isCertified,
                        hasEntry: entriesForService.length > 0,
                        display: cellContent,
                        entries: entriesForService,
                      }
                    })

                    return (
                      <div
                        key={`${therapist}-card-round-${round}`}
                        className={`rounded-xl border p-4 space-y-3 ${
                          isNextInQueue ? 'border-brand-green-500 bg-brand-green-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{therapist}</span>
                              {isNextInQueue && (
                                <span className="text-[10px] font-semibold text-brand-green-700 bg-brand-green-100 px-2 py-0.5 rounded-full">
                                  Next
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Queue position: #{queuePosition + 1}
                            </div>
                            <div className="text-xs text-gray-600">
                              Check-in: {checkInTimes[therapist] || '—'}
                            </div>
                            <div className="text-xs text-gray-600">
                              Service assignment time: {getAssignmentTime(therapist, round)}
                            </div>
                          </div>
                          <div className="text-right text-sm font-bold text-gray-800">
                            {getTherapistRoundTotal(therapist, round).toLocaleString()} THB
                          </div>
                        </div>

                        {/* Current service in progress, if any */}
                        {activeEntriesForTherapist.length > 0 && (
                          <div className="mt-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-[11px]">
                            <div className="font-semibold text-orange-700 mb-1">
                              Current Service
                            </div>
                            {activeEntriesForTherapist.map((entry) => {
                              const serviceName = entry.service.split(' ')[0] || 'Service'
                              return (
                                <div key={entry.id} className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-gray-800">
                                      {serviceName} {entry.price.toLocaleString()} THB
                                    </span>
                                    {entry.groupNumber && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-blue-100 text-brand-blue-700 border border-brand-blue-300">
                                        G{entry.groupNumber}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-orange-700">
                                    In Progress • Start: {entry.time}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Services grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {servicesForTherapist.map((svc) => (
                            <div
                              key={svc.name}
                              className={`rounded-lg px-2 py-2 text-[11px] leading-tight border ${
                                svc.isCertified
                                  ? 'bg-brand-green-50 text-brand-green-800 border-brand-green-200'
                                  : 'bg-red-50 text-red-500 border-red-200 opacity-80'
                              }`}
                            >
                              <div className="font-semibold">{svc.name}</div>
                              {svc.isCertified ? (
                                <div className="mt-1 space-y-1">
                                  {svc.hasEntry ? (
                                    svc.entries.map((entry: ServiceEntry) => (
                                      <div key={entry.id} className="flex items-center gap-1">
                                        <span className="text-[10px]">
                                          {entry.price.toLocaleString()} THB
                                        </span>
                                        {entry.groupNumber && (
                                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-brand-blue-100 text-brand-blue-700 border border-brand-blue-300">
                                            G{entry.groupNumber}
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    '—'
                                  )}
                                </div>
                              ) : (
                                <div className="mt-1">Not allowed</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-6 text-center text-gray-500 text-sm">
                    No therapists are currently logged in. Therapists must log in to be included in the queue.
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Overall Shop Total */}
        {serviceEntries.length > 0 && (
          <div className="bg-brand-green-100 rounded-lg shadow-sm border-2 border-brand-green-300 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-brand-green-800">
                Overall Shop Total
              </h3>
              <span className="text-2xl font-bold text-brand-green-700">
                {getShopTotal().toLocaleString()} THB
              </span>
            </div>
          </div>
        )}
      </div>
      )}

      {activeTab === 'chart' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Services Performed - Daily Overview
            </h2>

            {showGuide && (
              <div className="mb-4 bg-white border border-brand-blue-200 rounded-lg p-3 shadow-sm text-xs md:text-sm">
                <div className="font-semibold text-brand-blue-800 mb-1">
                  {t('guide.manager.chart.title')}
                </div>
                <p className="text-gray-700">
                  {t('guide.manager.chart.text')}
                </p>
              </div>
            )}
            {getServiceDistribution.length > 0 ? (
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={getServiceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderServicePieLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getServiceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} THB`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Service Statistics Table / Cards */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Service Statistics
                  </h3>

                  {/* Desktop / Tablet: Table */}
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Service
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Count
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Total Revenue
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Average Price
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getServiceDistribution.map((service, index) => {
                          const percentage = (service.value / getShopTotal()) * 100
                          const avgPrice = service.count > 0 ? service.value / service.count : 0
                          return (
                            <tr key={service.name} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  {service.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600">
                                {service.count}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                                {service.value.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">
                                {avgPrice.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600">
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-brand-green-50">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center text-gray-800">
                            {getServiceDistribution.reduce((sum, s) => sum + s.count, 0)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-brand-green-700">
                            {getShopTotal().toLocaleString()} THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-gray-800">
                            {getServiceDistribution.length > 0 
                              ? (getShopTotal() / getServiceDistribution.reduce((sum, s) => sum + s.count, 0)).toLocaleString()
                              : '0'
                            } THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center text-gray-800">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile: Card View */}
                  <div className="md:hidden space-y-3">
                    {getServiceDistribution.map((service, index) => {
                      const percentage = (service.value / getShopTotal()) * 100
                      const avgPrice = service.count > 0 ? service.value / service.count : 0
                      return (
                        <div
                          key={service.name}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-900">
                                {service.name}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {service.count} sessions • {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900">
                              {service.value.toLocaleString()} THB
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Avg {avgPrice.toLocaleString()} THB
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Mobile total summary */}
                    <div className="mt-2 rounded-lg bg-brand-green-50 border border-brand-green-200 px-3 py-2 text-[11px] flex justify-between">
                      <span className="font-semibold text-gray-800">
                        Total sessions: {getServiceDistribution.reduce((sum, s) => sum + s.count, 0)}
                      </span>
                      <span className="font-bold text-brand-green-700">
                        {getShopTotal().toLocaleString()} THB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No services have been assigned yet.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Start adding service entries to see the chart.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'therapist' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Therapist Revenue - Daily Overview
            </h2>

            {showGuide && (
              <div className="mb-4 bg-white border border-brand-blue-200 rounded-lg p-3 shadow-sm text-xs md:text-sm">
                <div className="font-semibold text-brand-blue-800 mb-1">
                  {t('guide.manager.therapistChart.title')}
                </div>
                <p className="text-gray-700">
                  {t('guide.manager.therapistChart.text')}
                </p>
              </div>
            )}
            {getTherapistRevenue.length > 0 ? (
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={getTherapistRevenue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderTherapistPieLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getTherapistRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} THB`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Therapist Revenue Statistics Table */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Therapist Revenue Statistics
                  </h3>

                  {/* Desktop / Tablet: Table */}
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Therapist
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Sessions
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Total Revenue
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Therapist Commission
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Store Revenue
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Average per Session
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTherapistRevenue.map((therapist, index) => {
                          const percentage = (therapist.value / getShopTotal()) * 100
                          const avgPrice = therapist.count > 0 ? therapist.value / therapist.count : 0
                          return (
                            <tr key={therapist.name} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <div className="flex flex-col">
                                    <span>{therapist.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {therapist.commissionRate}% commission
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600">
                                {therapist.count}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                                {therapist.value.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-brand-green-600 font-semibold">
                                {therapist.commission.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-brand-blue-600 font-semibold">
                                {therapist.storeRevenue.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">
                                {avgPrice.toLocaleString()} THB
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600">
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-brand-green-50">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center text-gray-800">
                            {getTherapistRevenue.reduce((sum, t) => sum + t.count, 0)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-gray-800">
                            {getShopTotal().toLocaleString()} THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-brand-green-700">
                            {getTherapistRevenue.reduce((sum, t) => sum + t.commission, 0).toLocaleString()} THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-brand-blue-700">
                            {getTherapistRevenue.reduce((sum, t) => sum + t.storeRevenue, 0).toLocaleString()} THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-gray-800">
                            {getTherapistRevenue.length > 0 
                              ? (getShopTotal() / getTherapistRevenue.reduce((sum, t) => sum + t.count, 0)).toLocaleString()
                              : '0'
                            } THB
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center text-gray-800">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile: Card View */}
                  <div className="md:hidden space-y-3">
                    {getTherapistRevenue.map((therapist, index) => {
                      const percentage = (therapist.value / getShopTotal()) * 100
                      const avgPrice = therapist.count > 0 ? therapist.value / therapist.count : 0
                      return (
                        <div
                          key={therapist.name}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900">
                                  {therapist.name}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {therapist.commissionRate}% commission
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-xs font-bold text-gray-900">
                              {therapist.value.toLocaleString()} THB
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>
                              {therapist.count} sessions • {percentage.toFixed(1)}%
                            </span>
                            <span>Avg {avgPrice.toLocaleString()} THB</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-brand-green-700 font-semibold">
                              Therapist: {therapist.commission.toLocaleString()} THB
                            </span>
                            <span className="text-brand-blue-700 font-semibold">
                              Store: {therapist.storeRevenue.toLocaleString()} THB
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Mobile total summary */}
                    <div className="mt-2 rounded-lg bg-brand-green-50 border border-brand-green-200 px-3 py-2 text-[11px] flex justify-between">
                      <span className="font-semibold text-gray-800">
                        Total sessions: {getTherapistRevenue.reduce((sum, t) => sum + t.count, 0)}
                      </span>
                      <span className="font-bold text-brand-green-700">
                        {getShopTotal().toLocaleString()} THB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No therapist revenue data available yet.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Start adding service entries to see therapist revenue distribution.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Payment Management
            </h2>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const groups = new Set(serviceEntries.filter(e => e.groupNumber).map(e => e.groupNumber))
                const paidGroups = Array.from(groups).filter(g => getGroupPaymentStatus(g!) === 'paid').length
                const partialGroups = Array.from(groups).filter(g => getGroupPaymentStatus(g!) === 'partial').length
                const unpaidGroups = Array.from(groups).filter(g => getGroupPaymentStatus(g!) === 'unpaid').length
                
                return (
                  <>
                    <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-brand-green-600" />
                        <span className="text-sm font-semibold text-gray-700">{t('payment.paid')}</span>
                      </div>
                      <div className="text-2xl font-bold text-brand-green-700">
                        {paidGroups}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{t('payment.groupsFullyPaid')}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-700">{t('payment.partial')}</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-700">
                        {partialGroups}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{t('payment.groupsPartiallyPaid')}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold text-gray-700">{t('payment.unpaid')}</span>
                      </div>
                      <div className="text-2xl font-bold text-red-700">
                        {unpaidGroups}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{t('payment.groupsUnpaid')}</div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Outstanding Payments */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Outstanding Payments</h3>
              {(() => {
                const groups = new Set(serviceEntries.filter(e => e.groupNumber).map(e => e.groupNumber))
                const outstandingGroups = Array.from(groups).filter(groupNum => {
                  const entries = getGroupEntries(groupNum!)
                  const isCompleted = isGroupCompleted(groupNum!)
                  // Only show completed groups that are unpaid or partially paid
                  return isCompleted && (entries[0]?.paymentStatus === 'unpaid' || entries[0]?.paymentStatus === 'partial' || !entries[0]?.paymentStatus)
                })

                if (outstandingGroups.length === 0) {
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-12 h-12 text-brand-green-400 mx-auto mb-2" />
                      <p className="text-gray-600">All payments collected!</p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {outstandingGroups.map(groupNum => {
                      const entries = getGroupEntries(groupNum!)
                      const total = entries.reduce((sum, e) => sum + e.price, 0)
                      const paid = entries[0]?.paymentDetails?.reduce((sum, p) => sum + p.amount, 0) || 0
                      const remaining = total - paid
                      const status = entries[0]?.paymentStatus || 'unpaid'
                      const isCompleted = isGroupCompleted(groupNum!)

                      return (
                        <div
                          key={groupNum}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  status === 'paid' ? 'bg-brand-green-200 text-brand-green-800' :
                                  status === 'partial' ? 'bg-orange-200 text-orange-800' :
                                  'bg-red-200 text-red-800'
                                }`}>
                                  Group {groupNum}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {entries.length} service{entries.length > 1 ? 's' : ''}
                                </span>
                                {!isCompleted && (
                                  <span className="text-xs text-orange-600 font-semibold">
                                    (Services in progress)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700">
                                {entries.map(e => e.service.split(' ')[0]).join(', ')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{total.toLocaleString()} THB</div>
                              {status === 'partial' && (
                                <div className="text-sm text-orange-600">
                                  Paid: {paid.toLocaleString()} THB
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                Remaining: {remaining.toLocaleString()} THB
                              </div>
                              <button
                                onClick={() => {
                                  if (isCompleted) {
                                    setSelectedGroupForPayment(groupNum!)
                                    setIsPaymentModalOpen(true)
                                  }
                                }}
                                disabled={!isCompleted}
                                className={`mt-2 px-4 py-1.5 text-white text-sm font-semibold rounded-lg transition-colors ${
                                  isCompleted
                                    ? 'bg-brand-blue-500 hover:bg-brand-blue-600 cursor-pointer'
                                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                                }`}
                                title={isCompleted ? t('payment.collectPayment') : t('payment.completeServicesFirst')}
                              >
                                {isCompleted ? t('payment.collectPayment') : t('payment.completeServicesFirst')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* All Groups Payment Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Groups</h3>
              {(() => {
                const groups = new Set(serviceEntries.filter(e => e.groupNumber).map(e => e.groupNumber))
                const allGroups = Array.from(groups).sort((a, b) => (b || 0) - (a || 0))

                if (allGroups.length === 0) {
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No group payments yet.</p>
                    </div>
                  )
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Group</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Services</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Paid</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allGroups.map(groupNum => {
                          const entries = getGroupEntries(groupNum!)
                          const total = entries.reduce((sum, e) => sum + e.price, 0)
                          // Calculate total paid across all services in group
                          const paid = entries.reduce((sum, e) => {
                            const servicePaid = e.paymentDetails?.reduce((pSum, p) => pSum + p.amount, 0) || 0
                            return sum + servicePaid
                          }, 0)
                          const status = getGroupPaymentStatus(groupNum!)
                          // Show payment method(s) - if all same, show one; if different, show "Mixed"
                          const paymentMethods = entries.map(e => e.paymentType).filter(Boolean)
                          const uniqueMethods = new Set(paymentMethods)
                          const paymentMethod = uniqueMethods.size === 0 ? '—' :
                                                uniqueMethods.size === 1 ? paymentMethods[0]! :
                                                'Mixed'
                          const isCompleted = isGroupCompleted(groupNum!)
                          const activeServices = entries.filter(e => !e.endTime).length

                          return (
                            <tr key={groupNum} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">G{groupNum}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {entries.length}
                                {!isCompleted && (
                                  <span className="ml-2 text-xs text-orange-600">
                                    ({activeServices} active)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">{total.toLocaleString()} THB</td>
                              <td className="px-4 py-3 text-right text-gray-700">{paid.toLocaleString()} THB</td>
                              <td className="px-4 py-3">
                                {!isCompleted ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                                    In Progress
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    status === 'paid' ? 'bg-brand-green-100 text-brand-green-700' :
                                    status === 'partial' ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{isCompleted ? paymentMethod : '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    if (isCompleted) {
                                      setSelectedGroupForPayment(groupNum!)
                                      setIsPaymentModalOpen(true)
                                    }
                                  }}
                                  disabled={!isCompleted}
                                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                    isCompleted
                                      ? 'bg-brand-blue-500 hover:bg-brand-blue-600 text-white cursor-pointer'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                                  }`}
                                  title={isCompleted ? t('payment.manage') : t('payment.completeServicesFirst')}
                                >
                                  {isCompleted ? t('payment.manage') : t('payment.completeFirst')}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

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
                className="block py-2 px-4 bg-brand-green-50 text-brand-green-700 rounded-lg font-semibold mb-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('manager.dailyMatrix')}
              </Link>
              <Link
                href="/manager/therapists"
                className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-5 h-5 text-gray-900" />
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

      {/* Add Entry Modal */}
      {isModalOpen && (
        <AddEntryModal
          therapists={therapists}
          therapistsData={therapistsData}
          availableServices={availableServices}
          services={services}
          getNextTherapistForService={getNextTherapistForService}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddEntry}
        />
      )}

      {/* Add Group Modal */}
      {isGroupModalOpen && (
        <AddGroupModal
          therapists={therapists}
          therapistsData={therapistsData}
          availableServices={availableServices}
          services={services}
          getNextTherapistForService={getNextTherapistForService}
          onClose={() => setIsGroupModalOpen(false)}
          onSave={handleAddGroup}
        />
      )}

      {/* Scheduled Booking Modal */}
      {isScheduledBookingModalOpen && (
        <ScheduledBookingModal
          therapists={therapists}
          therapistsData={therapistsData}
          availableServices={availableServices}
          services={services}
          serviceEntries={serviceEntries}
          getNextTherapistForService={getNextTherapistForService}
          onClose={() => setIsScheduledBookingModalOpen(false)}
          onSave={handleScheduledBooking}
        />
      )}

      {/* Payment Collection Modal */}
      {isPaymentModalOpen && selectedGroupForPayment !== null && (
        <PaymentCollectionModal
          groupEntries={getGroupEntries(selectedGroupForPayment)}
          groupNumber={selectedGroupForPayment}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedGroupForPayment(null)
          }}
          onSave={handlePaymentCollection}
        />
      )}

      {/* Extend Service Modal */}
      {extendServiceModal.open && extendServiceModal.entryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Extend Service Time</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current duration: {extendServiceModal.currentMinutes} minutes
                </p>
              </div>
              <button
                onClick={() => setExtendServiceModal({ 
                  open: false, 
                  entryId: null, 
                  currentMinutes: 0,
                  originalPrice: 0,
                  baseDuration: 60,
                })}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Minutes
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="extendMinutes"
                      min="1"
                      max="120"
                      defaultValue="15"
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Enter minutes"
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value || '0', 10)
                        const newDurationEl = document.getElementById('newDuration')
                        if (newDurationEl) {
                          const current = extendServiceModal.currentMinutes
                          const newTotal = current + (minutes || 0)
                          newDurationEl.textContent = `${newTotal} min`
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">minutes</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Quick select:
                  </p>
                  <div className="flex gap-2 mt-2">
                    {[15, 30, 45, 60].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => {
                          const input = document.getElementById('extendMinutes') as HTMLInputElement
                          if (input) {
                            input.value = minutes.toString()
                            // Update the display
                            const newDurationEl = document.getElementById('newDuration')
                            if (newDurationEl) {
                              const current = extendServiceModal.currentMinutes
                              const newTotal = current + minutes
                              newDurationEl.textContent = `${newTotal} min`
                            }
                          }
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        +{minutes}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-1">
                      <span>Current:</span>
                      <span className="font-semibold">{extendServiceModal.currentMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>After extension:</span>
                      <span className="font-semibold text-brand-blue-600" id="newDuration">
                        {extendServiceModal.currentMinutes + 15} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setExtendServiceModal({ 
                  open: false, 
                  entryId: null, 
                  currentMinutes: 0,
                  originalPrice: 0,
                  baseDuration: 60,
                })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('extendMinutes') as HTMLInputElement
                  const minutes = parseInt(input?.value || '0', 10)
                  if (minutes > 0) {
                    handleExtendService(minutes)
                  }
                }}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Extend Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {addServiceModal.open && addServiceModal.entryId && (
        <AddEntryModal
          therapists={therapists}
          therapistsData={therapistsData}
          availableServices={availableServices}
          services={services}
          getNextTherapistForService={getNextTherapistForService}
          onClose={() => setAddServiceModal({ open: false, entryId: null })}
          onSave={handleAddServiceToEntry}
          prefillTherapist={(() => {
            const existingEntry = serviceEntries.find(e => e.id === addServiceModal.entryId)
            return existingEntry?.therapist || undefined
          })()}
        />
      )}
    </div>
  )
}

