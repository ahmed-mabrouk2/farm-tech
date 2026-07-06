'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const L = t.analytics
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const metrics = [
    { label: L.totalYield, value: `2,450 ${L.tons}`, change: '+8.5%', status: 'up' },
    { label: L.avgEfficiency, value: '87%', change: '+3.2%', status: 'up' },
    { label: L.costSaved, value: 'EGP 145,000', change: '+12%', status: 'up' },
    { label: L.healthScore, value: '8.7/10', change: '+0.5', status: 'up' },
  ]

  const monthlyData = [
    { month: L.months[0], yield: 180, efficiency: 75, cost: 28000 },
    { month: L.months[1], yield: 195, efficiency: 78, cost: 26500 },
    { month: L.months[2], yield: 210, efficiency: 82, cost: 25000 },
    { month: L.months[3], yield: 235, efficiency: 85, cost: 23500 },
    { month: L.months[4], yield: 265, efficiency: 88, cost: 21000 },
    { month: L.months[5], yield: 290, efficiency: 87, cost: 22500 },
  ]

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{L.title}</h1>
            <p className="text-muted-foreground mt-2">{L.subtitle}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <span className="text-sm font-semibold text-green-600">↑ {metric.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Yield Chart */}
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{L.yieldTrend}</h3>
              <div className="h-72 w-full flex items-center justify-center">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                      <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        itemStyle={{ color: '#16a34a' }}
                      />
                      <Area type="monotone" dataKey="yield" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorYield)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-green-600"></div>
                )}
              </div>
            </div>

            {/* Efficiency Chart */}
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{L.farmEfficiency}</h3>
              <div className="h-72 w-full flex items-center justify-center">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                      <YAxis stroke="currentColor" domain={[0, 100]} className="text-[10px] text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        itemStyle={{ color: '#2563eb' }}
                      />
                      <Line type="monotone" dataKey="efficiency" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-blue-600"></div>
                )}
              </div>
            </div>
          </div>

          {/* Cost Savings Chart */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{L.monthlyCost}</h3>
            <div className="h-72 w-full flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground" />
                    <Tooltip 
                      formatter={(value: any) => [`EGP ${value.toLocaleString()}`, L.monthlyCost]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ea580c' }}
                    />
                    <Bar dataKey="cost" fill="url(#colorCost)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-orange-600"></div>
              )}
            </div>
            <p className="text-sm text-green-600 mt-4 font-semibold">{L.costReduction}: EGP 14,000 (33% {L.savings})</p>
          </div>

          {/* Crop Performance Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{L.cropPerfTitle}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-4 font-semibold text-foreground">{L.thCrop}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{L.thHectares}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{L.thTotalYield}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{L.thAvgYield}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{L.thEfficiency}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{L.thStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { crop: L.crops.wheat as string, hectares: 50, yield: 450, avgYield: 9.0, efficiency: 92 },
                    { crop: L.crops.corn as string, hectares: 35, yield: 680, avgYield: 19.4, efficiency: 87 },
                    { crop: L.crops.rice as string, hectares: 40, yield: 520, avgYield: 13.0, efficiency: 85 },
                    { crop: L.crops.cotton as string, hectares: 25, yield: 200, avgYield: 8.0, efficiency: 80 },
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-3 px-4 text-foreground">{row.crop}</td>
                      <td className="py-3 px-4 text-center text-foreground">{row.hectares}</td>
                      <td className="py-3 px-4 text-center font-semibold text-foreground">{row.yield} {L.tons}</td>
                      <td className="py-3 px-4 text-center font-semibold text-green-600">{row.avgYield} {L.tons}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${row.efficiency}%` }}></div>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{row.efficiency}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">{L.excellent}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
