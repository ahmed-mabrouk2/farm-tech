"use client"
import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import SidebarNav from "@/components/sidebar-nav"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Leaf, BarChart3, Droplet, Zap, Clock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface AIModel {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  lastUsed?: string
}
export default function AIModelsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { t, dir, language } = useLanguage()
  const L = t.aiModelsIndex
  const isAr = language === 'ar'
  
  const aiModels: AIModel[] = [
    {
      id: "crop-recommendation",
      title: L.models.cropRec.title,
      description: L.models.cropRec.desc,
      icon: <Leaf className="w-8 h-8" />,
      color: "bg-emerald-100 dark:bg-emerald-950",
      lastUsed: L.models.cropRec.time,
    },
    {
      id: "yield-prediction",
      title: L.models.yieldPred.title,
      description: L.models.yieldPred.desc,
      icon: <BarChart3 className="w-8 h-8" />,
      color: "bg-blue-100 dark:bg-blue-950",
      lastUsed: L.models.yieldPred.time,
    },
    {
      id: "disease-detection",
      title: L.models.diseaseDet.title,
      description: L.models.diseaseDet.desc,
      icon: <Zap className="w-8 h-8" />,
      color: "bg-orange-100 dark:bg-orange-950",
    },
    {
      id: "fertilizer-optimizer",
      title: L.models.fertOpt.title,
      description: L.models.fertOpt.desc,
      icon: <Leaf className="w-8 h-8" />,
      color: "bg-amber-100 dark:bg-amber-950",
    },
    {
      id: "irrigation-control",
      title: L.models.irrigCtrl.title,
      description: L.models.irrigCtrl.desc,
      icon: <Droplet className="w-8 h-8" />,
      color: "bg-cyan-100 dark:bg-cyan-950",
      lastUsed: L.models.irrigCtrl.time,
    },
    {
      id: "pest-management",
      title: L.models.pestMgt.title,
      description: L.models.pestMgt.desc,
      icon: <Brain className="w-8 h-8" />,
      color: "bg-red-100 dark:bg-red-950",
    },
    {
      id: "scenario-simulator",
      title: isAr ? "الدورة الزراعية (تعاقب المحاصيل)" : "Crop Rotation Sequence",
      description: isAr ? "استخدام الذكاء الاصطناعي لتخطيط الدورة الزراعية المثلى للحفاظ على صحة التربة وزيادة الأرباح" : "Optimize crop sequences to maintain soil health and maximize profit using AI",
      icon: <Brain className="w-8 h-8" />,
      color: "bg-purple-100 dark:bg-purple-950",
    },
  ]

  const recentlyUsed = aiModels.filter((model) => model.lastUsed)

  const handleLaunchModel = (id: string) => {
    router.push(`/ai-models/${id}`)
  }

  return (
    <div dir={dir} className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background text-foreground">
      <SidebarNav isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-2">{L.title}</h1>
              <p className="text-lg text-muted-foreground">{L.subtitle}</p>
            </div>

            {/* Recently Used Section */}
            {recentlyUsed.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">{L.recentlyUsed}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyUsed.map((model) => (
                    <Card
                      key={model.id}
                      onClick={() => handleLaunchModel(model.id)}
                      className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <CardContent className="pt-6">
                        <div
                          className={`${model.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform`}
                        >
                          {model.icon}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{model.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 me-1" />
                            {model.lastUsed}
                          </Badge>
                          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            {L.open}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Models Grid */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{L.allModels}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiModels.map((model) => (
                  <Card
                    key={model.id}
                    onClick={() => handleLaunchModel(model.id)}
                    className="bg-card border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <CardContent className="pt-8">
                      {/* Icon Container */}
                      <div
                        className={`${model.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform`}
                      >
                        {model.icon}
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-foreground mb-2">{model.title}</h3>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{model.description}</p>

                      {/* Action Button */}
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 transition-all group-hover:shadow-md">
                        {L.startNow}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <Card className="mt-12 bg-muted/50 border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>{L.tipTitle}</strong> {L.tipText}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
