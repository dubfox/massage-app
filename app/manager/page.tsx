'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Plus, X, Users, BarChart3, ClipboardList } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import AddEntryModal from '@/components/AddEntryModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTherapistStatus } from '@/contexts/TherapistStatusContext'
import LanguagePicker from '@/components/LanguagePicker'

interface ServiceEntry {
  id: string
  therapist: string
  service: string
  price: number
  time: string // service start / assignment time
  endTime?: string // service end time when manager closes out the service
  column: number
  round: number // Track which round-robin cycle this entry belongs to
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
  const [activeTab, setActiveTab] = useState<'assignment' | 'chart' | 'therapist'>('assignment')
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([])
  // Round-robin: track which therapist is next in rotation
  const [nextTherapistIndex, setNextTherapistIndex] = useState(0)
  // Track the current queue order of therapists (only logged-in ones)
  const [therapistQueue, setTherapistQueue] = useState<string[]>([])
  const [now, setNow] = useState<Date | null>(null)

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
    
    const newEntry: ServiceEntry = {
      id: Date.now().toString(),
      therapist: assignedTherapist,
      service: `${entry.service} ${entry.price}`,
      price: entry.price + (entry.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      column: entry.timeSlot === 'auto' ? nextColumn : parseInt(entry.timeSlot) || nextColumn,
      round: entryRound
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
                <h2 className="text-lg font-bold text-brand-blue-800">
                  Round {round} - Entry Sheet
                </h2>
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

                              const activeEntries = entriesForCell.filter(e => !e.endTime)
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
                                      <div className="font-semibold text-gray-800">
                                        {serviceName} {entry.price.toLocaleString()} THB
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        Start: {entry.time} • End: {entry.endTime}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Active services (no end time yet) */}
                                  {isCertified && activeEntries.map(entry => (
                                    <div key={entry.id} className="space-y-1">
                                      <div className="font-semibold text-brand-green-700">
                                        {serviceName} {entry.price.toLocaleString()} THB
                                      </div>
                                      <div className="text-[10px] text-orange-600">
                                        In Progress • Start: {entry.time}
                                      </div>
                                      <button
                                        onClick={() => handleEndService(entry.id)}
                                        className="mt-1 inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded"
                                      >
                                        End Service
                                      </button>
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
                      const cellContent = getCellContent(therapist, serviceName, round)
                      return {
                        name: serviceName,
                        isCertified,
                        hasEntry: cellContent !== '—',
                        display: cellContent,
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
                                  <span className="font-semibold text-gray-800">
                                    {serviceName} {entry.price.toLocaleString()} THB
                                  </span>
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
                                <div className="mt-1">
                                  {svc.hasEntry ? svc.display : '—'}
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
    </div>
  )
}

