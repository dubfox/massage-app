'use client'

import { useEffect, useState, useMemo } from 'react'
import { Users, Activity, TrendingUp } from 'lucide-react'
import TherapistProgressionChart from '@/components/TherapistProgressionChart'

interface ServiceEntry {
  id: string
  therapist: string
  service: string
  price: number
  time: string
  endTime?: string
  column: number
  round: number
  groupNumber?: number
  paymentStatus?: 'paid' | 'unpaid' | 'partial'
}

// Available services with estimated durations (minutes)
// In a real app this would be shared with the Services Management data
const serviceDurations: { name: string; duration: number }[] = [
  { name: 'Thai', duration: 60 },
  { name: 'Foot', duration: 60 },
  { name: 'Oil', duration: 60 },
  { name: 'Aroma', duration: 60 },
  { name: 'Hot', duration: 60 }, // Hot Oil (we match by prefix)
  { name: 'Herbal', duration: 60 },
  { name: 'Sport', duration: 60 },
  { name: 'Back', duration: 60 },
]

// Mock therapist data and services as in manager page
interface TherapistData {
  name: string
  certifiedServices?: string[]
}

const therapistsData: TherapistData[] = [
  { name: 'Lisa', certifiedServices: ['1', '2', '3', '4'] },
  { name: 'Sarah', certifiedServices: ['1', '2', '5', '6'] },
  { name: 'Emma', certifiedServices: ['3', '4', '7'] },
  { name: 'Maya', certifiedServices: ['1', '2', '3', '4', '5', '6'] },
  { name: 'Anna', certifiedServices: ['1', '8'] },
]

const availableServices = [
  { id: '1', name: 'Thai' },
  { id: '2', name: 'Foot' },
  { id: '3', name: 'Oil' },
  { id: '4', name: 'Aroma' },
  { id: '5', name: 'Hot Oil' },
  { id: '6', name: 'Herbal' },
  { id: '7', name: 'Sport' },
  { id: '8', name: 'Back' },
]

interface ServiceBoardData {
  serviceEntries: ServiceEntry[]
  therapistQueue: string[]
  nextTherapistIndex: number
}

export default function ServiceDisplayBoard() {
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([])
  const [therapistQueue, setTherapistQueue] = useState<string[]>([])
  const [nextTherapistIndex, setNextTherapistIndex] = useState(0)
  const [loggedInTherapists, setLoggedInTherapists] = useState<string[]>([])
  const [now, setNow] = useState<Date | null>(null)

  // Load initial data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial time on client to avoid hydration mismatch
    setNow(new Date())

    try {
      const storedBoard = localStorage.getItem('serviceBoardData')
      if (storedBoard) {
        const parsed: ServiceBoardData = JSON.parse(storedBoard)
        setServiceEntries(parsed.serviceEntries || [])
        setTherapistQueue(parsed.therapistQueue || [])
        setNextTherapistIndex(parsed.nextTherapistIndex || 0)
      }

      const storedTherapists = localStorage.getItem('loggedInTherapists')
      if (storedTherapists) {
        setLoggedInTherapists(JSON.parse(storedTherapists))
      }
    } catch (e) {
      console.error('Error loading service board data', e)
    }
  }, [])

  // Listen for updates from manager / therapist actions
  useEffect(() => {
    const handleBoardChange = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail &&
        'serviceEntries' in event.detail
      ) {
        const detail = event.detail as ServiceBoardData
        setServiceEntries(detail.serviceEntries || [])
        setTherapistQueue(detail.therapistQueue || [])
        setNextTherapistIndex(detail.nextTherapistIndex || 0)
      }
    }

    const handleTherapistStatusChange = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail &&
        'loggedInTherapists' in event.detail
      ) {
        setLoggedInTherapists(event.detail.loggedInTherapists || [])
      } else {
        // Fallback: reload from localStorage
        const storedTherapists = localStorage.getItem('loggedInTherapists')
        if (storedTherapists) {
          setLoggedInTherapists(JSON.parse(storedTherapists))
        }
      }
    }

    window.addEventListener('serviceBoardDataChanged', handleBoardChange)
    window.addEventListener('therapistStatusChanged', handleTherapistStatusChange)

    return () => {
      window.removeEventListener('serviceBoardDataChanged', handleBoardChange)
      window.removeEventListener(
        'therapistStatusChanged',
        handleTherapistStatusChange
      )
    }
  }, [])

  // Active (in-progress) services
  const activeServices = useMemo(
    () => serviceEntries.filter((entry) => !entry.endTime),
    [serviceEntries]
  )

  // Completed services (not used heavily, but kept for potential display)
  const completedServices = useMemo(
    () => serviceEntries.filter((entry) => entry.endTime),
    [serviceEntries]
  )

  // Determine busy therapists (currently performing a service)
  const busyTherapists = useMemo(
    () =>
      new Set(
        activeServices
          .filter((entry) => entry.therapist)
          .map((entry) => entry.therapist)
      ),
    [activeServices]
  )

  // Queue view: only logged-in therapists, in queue order, annotated with status
  const queueView = useMemo(() => {
    const queueSet = new Set(therapistQueue)

    // Therapists that are logged in but not currently in queue (edge case)
    const extraLoggedIn = loggedInTherapists.filter(
      (name) => !queueSet.has(name)
    )

    return {
      queue: therapistQueue,
      extraLoggedIn,
    }
  }, [therapistQueue, loggedInTherapists])

  const getCertifiedServiceNames = (therapistName: string) => {
    const info = therapistsData.find((t) => t.name === therapistName)
    if (!info?.certifiedServices || info.certifiedServices.length === 0) return []
    return info.certifiedServices
      .map((id) => availableServices.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[]
  }

  const getExpectedEndTime = (entry: ServiceEntry) => {
    // Extract service name (e.g. "Thai 400" -> "Thai")
    const serviceName = entry.service.split(' ')[0]
    const serviceInfo =
      serviceDurations.find((s) => serviceName.startsWith(s.name)) || null
    const durationMinutes = serviceInfo?.duration
    if (!durationMinutes) return '—'

    // entry.time is "HH:MM" in 24h format; base date at epoch to avoid timezone date issues
    const [hourStr, minuteStr] = entry.time.split(':')
    const base = new Date(0)
    base.setUTCHours(parseInt(hourStr || '0', 10), parseInt(minuteStr || '0', 10), 0, 0)
    const endMs = base.getTime() + durationMinutes * 60 * 1000
    const end = new Date(endMs)

    return end.toISOString().substring(11, 16) // HH:MM in 24h, avoids locale differences
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-900 via-gray-900 to-brand-green-900 text-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide">
            Nantika Physical Thai Massage
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Live Service Status – For Customers & Therapists
          </p>
        </div>
        <div className="text-right">
          {now && (
            <>
              <div className="text-sm text-white/60">
                {now.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-xl font-semibold">
                {now.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Now Performing */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <Activity className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Now Performing</h2>
              <p className="text-sm text-white/60">
                Therapists currently in session
              </p>
            </div>
          </div>

          {activeServices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/60 text-lg">
                No active services at the moment.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/70 border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Therapist</th>
                    <th className="py-2 text-left font-semibold">Service</th>
                    <th className="py-2 text-left font-semibold">Round</th>
                    <th className="py-2 text-left font-semibold">Start Time</th>
                    <th className="py-2 text-left font-semibold">
                      Expected End Time
                    </th>
                    <th className="py-2 text-left font-semibold">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {activeServices.map((entry) => {
                    const serviceName = entry.service.split(' ')[0]
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-2 pr-4 font-semibold">
                          {entry.therapist}
                        </td>
                        <td className="py-2 pr-4">{serviceName}</td>
                        <td className="py-2 pr-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                            R{entry.round}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{entry.time}</td>
                        <td className="py-2 pr-4">
                          {getExpectedEndTime(entry)}
                        </td>
                        <td className="py-2 pr-4">
                          {entry.groupNumber ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                              G{entry.groupNumber}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Queue / Upcoming */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-sky-500/20">
              <Users className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Therapist Queue</h2>
              <p className="text-sm text-white/60">
                Order of therapists for upcoming services
              </p>
            </div>
          </div>

          {queueView.queue.length === 0 && queueView.extraLoggedIn.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/60 text-lg">
                No therapists are currently clocked in.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              {/* Main Queue */}
              {queueView.queue.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">
                    In Queue
                  </h3>
                  <ul className="space-y-2">
                    {queueView.queue.map((name, index) => {
                      const isNext = index === nextTherapistIndex
                      const isBusy = busyTherapists.has(name)
                      return (
                        <li
                          key={name}
                          className={`px-4 py-3 rounded-xl border ${
                            isBusy
                              ? 'bg-red-500/10 border-red-400/40'
                              : isNext
                              ? 'bg-emerald-500/10 border-emerald-400/40'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-lg">
                                {name}
                              </span>
                              {isNext && !isBusy && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-900">
                                  Next
                                </span>
                              )}
                              {isBusy && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-400 text-red-900">
                                  In Service
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Certified services row */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {getCertifiedServiceNames(name).map((svc) => (
                              <span
                                key={svc}
                                className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-white/80 border border-white/20"
                              >
                                {svc}
                              </span>
                            ))}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Logged-in but not in queue (edge) */}
              {queueView.extraLoggedIn.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">
                    Clocked In (Not in Queue)
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {queueView.extraLoggedIn.map((name) => (
                      <li
                        key={name}
                        className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Therapist Progression Charts */}
      <section className="px-6 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-purple-500/20">
            <TrendingUp className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Therapist Progression</h2>
            <p className="text-sm text-white/60">
              Historical performance by round
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {therapistsData.map((therapist) => {
            const hasServices = serviceEntries.some(e => e.therapist === therapist.name)
            if (!hasServices) return null

            return (
              <TherapistProgressionChart
                key={therapist.name}
                serviceEntries={serviceEntries}
                therapistName={therapist.name}
              />
            )
          })}
        </div>

        {therapistsData.every(t => !serviceEntries.some(e => e.therapist === t.name)) && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center">
            <p className="text-white/60 text-lg">
              No therapist progression data available yet
            </p>
            <p className="text-white/40 text-sm mt-2">
              Charts will appear as services are assigned and completed
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-8 py-3 border-t border-white/10 text-xs text-white/50 flex justify-between">
        <span>Live view – updates automatically from manager entries</span>
        <span>Services only – no financial details displayed</span>
      </footer>
    </div>
  )
}


