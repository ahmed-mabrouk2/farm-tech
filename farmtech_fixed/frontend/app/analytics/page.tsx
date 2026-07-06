'use client'

import Header from '@/components/header'
import SidebarNav from '@/components/sidebar-nav'
import { useLanguage } from '@/lib/language-context'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const L = t.analytics
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

  const maxYield = Math.max(...monthlyData.map(d => d.yield))
  const maxEfficiency = 100
  const maxCost = Math.max(...monthlyData.map(d => d.cost))

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
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{L.yieldTrend}</h3>
              <div className="flex items-end gap-2 h-64">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t" 
                         style={{ height: `${(data.yield / maxYield) * 100}%` }}></div>
                    <p className="text-xs text-muted-foreground mt-2">{data.month}</p>
                    <p className="text-xs font-semibold text-foreground">{data.yield}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{L.farmEfficiency}</h3>
              <div className="flex items-end gap-2 h-64">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" 
                         style={{ height: `${(data.efficiency / maxEfficiency) * 100}%` }}></div>
                    <p className="text-xs text-muted-foreground mt-2">{data.month}</p>
                    <p className="text-xs font-semibold text-foreground">{data.efficiency}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Savings Chart */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{L.monthlyCost}</h3>
            <div className="flex items-end gap-2 h-64">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t" 
                       style={{ height: `${(data.cost / maxCost) * 100}%` }}></div>
                  <p className="text-xs text-muted-foreground mt-2">{data.month}</p>
                  <p className="text-xs font-semibold text-foreground">EGP {data.cost / 1000}k</p>
                </div>
              ))}
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
