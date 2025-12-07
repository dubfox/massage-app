'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, DollarSign, Activity } from 'lucide-react'

interface ServiceEntry {
  id: string
  therapist: string
  service: string
  price: number
  time: string
  endTime?: string
  round: number
  paymentStatus?: 'paid' | 'unpaid' | 'partial'
}

interface TherapistProgressionChartProps {
  serviceEntries: ServiceEntry[]
  therapistName: string
}

export default function TherapistProgressionChart({
  serviceEntries,
  therapistName,
}: TherapistProgressionChartProps) {
  // Filter entries for this therapist
  const therapistEntries = useMemo(() => {
    return serviceEntries.filter(entry => entry.therapist === therapistName)
  }, [serviceEntries, therapistName])

  // Group by round and calculate metrics
  const roundData = useMemo(() => {
    const rounds = new Map<number, {
      round: number
      services: number
      revenue: number
      completed: number
      avgPrice: number
      serviceList: Array<{ name: string; price: number; time: string; endTime?: string }>
    }>()

    therapistEntries.forEach(entry => {
      const round = entry.round
      if (!rounds.has(round)) {
        rounds.set(round, {
          round,
          services: 0,
          revenue: 0,
          completed: 0,
          avgPrice: 0,
          serviceList: [],
        })
      }

      const data = rounds.get(round)!
      data.services += 1
      data.revenue += entry.price
      if (entry.endTime) {
        data.completed += 1
      }
      
      // Extract service name (e.g., "Thai 400" -> "Thai")
      const serviceName = entry.service.split(' ')[0]
      data.serviceList.push({
        name: serviceName,
        price: entry.price,
        time: entry.time,
        endTime: entry.endTime,
      })
    })

    // Calculate average price per round
    Array.from(rounds.values()).forEach(data => {
      data.avgPrice = data.services > 0 ? Math.round(data.revenue / data.services) : 0
    })

    // Sort by round number
    return Array.from(rounds.values()).sort((a, b) => a.round - b.round)
  }, [therapistEntries])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalServices: therapistEntries.length,
      totalRevenue: therapistEntries.reduce((sum, e) => sum + e.price, 0),
      completedServices: therapistEntries.filter(e => e.endTime).length,
      rounds: roundData.length,
    }
  }, [therapistEntries, roundData])

  // Prepare data for charts
  const chartData = roundData.map(data => ({
    round: `Round ${data.round}`,
    services: data.services,
    revenue: data.revenue,
    completed: data.completed,
    avgPrice: data.avgPrice,
  }))

  // Colors for the charts
  const colors = {
    services: '#10b981', // emerald-500
    revenue: '#3b82f6', // blue-500
    completed: '#f59e0b', // amber-500
  }

  if (roundData.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-purple-500/20">
            <TrendingUp className="w-5 h-5 text-purple-300" />
          </div>
          <h3 className="text-xl font-bold text-white">{therapistName} - Progression</h3>
        </div>
        <div className="text-center py-8 text-white/60">
          <p className="text-lg">No services recorded yet</p>
          <p className="text-sm mt-2">Services will appear here as they are assigned</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-500/20">
            <TrendingUp className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{therapistName}</h3>
            <p className="text-sm text-white/60">Historical Progression by Round</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Total Services</div>
          <div className="text-2xl font-bold text-white">{totals.totalServices}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-emerald-300">{totals.totalRevenue.toLocaleString()} THB</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Completed</div>
          <div className="text-2xl font-bold text-amber-300">{totals.completedServices}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Rounds</div>
          <div className="text-2xl font-bold text-blue-300">{totals.rounds}</div>
        </div>
      </div>

      {/* Services per Round - Bar Chart */}
      <div>
        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Services per Round
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="round" 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Bar dataKey="services" fill={colors.services} name="Services" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill={colors.completed} name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue per Round - Line Chart */}
      <div>
        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Revenue per Round
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="round" 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              tickFormatter={(value) => `${value} THB`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value.toLocaleString()} THB`, 'Revenue']}
            />
            <Legend 
              wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.revenue} 
              strokeWidth={3}
              dot={{ fill: colors.revenue, r: 5 }}
              activeDot={{ r: 7 }}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="avgPrice" 
              stroke={colors.completed} 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: colors.completed, r: 4 }}
              name="Avg Price/Service"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Round Details Table */}
      <div>
        <h4 className="text-sm font-semibold text-white/80 mb-3">Round Details</h4>
        <div className="space-y-4">
          {roundData.map((data) => (
            <div key={data.round} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              {/* Round Header */}
              <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-lg">Round {data.round}</h5>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/70">
                      <span className="text-white/90 font-semibold">{data.services}</span> services
                    </span>
                    <span className="text-amber-300">
                      <span className="font-semibold">{data.completed}</span> completed
                    </span>
                    <span className="text-emerald-300 font-semibold">
                      {data.revenue.toLocaleString()} THB
                    </span>
                    <span className="text-white/70">
                      Avg: <span className="text-white/90">{data.avgPrice.toLocaleString()} THB</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Services List */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data.serviceList.map((service, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-lg border ${
                        service.endTime
                          ? 'bg-emerald-500/10 border-emerald-400/30'
                          : 'bg-amber-500/10 border-amber-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm">{service.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {service.time}
                            {service.endTime && ` - ${service.endTime}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-300">
                            {service.price.toLocaleString()} THB
                          </div>
                          {service.endTime ? (
                            <div className="text-[10px] text-emerald-400/80 mt-0.5">Completed</div>
                          ) : (
                            <div className="text-[10px] text-amber-400/80 mt-0.5">In Progress</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

