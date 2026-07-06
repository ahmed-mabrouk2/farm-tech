"use client"

import { useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

export default function QuickActionsPanel() {
  const router = useRouter()
  const { t } = useLanguage()
  const Q = t.dashboard.quickActions

  const actions = useMemo(
    () => [
    {
      id: "upload",
      label: Q.uploadLabel,
      description: Q.uploadDesc,
      color: "bg-primary",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      ),
    },
    {
      id: "simulate",
      label: Q.simulateLabel,
      description: Q.simulateDesc,
      color: "bg-secondary",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.52l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.34.24.52.49.52h4c.25 0 .46-.18.49-.52l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </svg>
      ),
    },
  ],
    [Q]
  )

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-900/60 bg-[#0a2e1f] dark:bg-[#0a1f15] p-6 shadow-lg text-white">
      <h2 className="text-lg font-semibold mb-6 text-white">{Q.title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === "upload") {
                router.push("/ai-models/disease-detection")
              } else if (action.id === "simulate") {
                router.push("/ai-models/scenario-simulator")
              }
            }}
            className="p-6 rounded-lg border border-emerald-900/40 bg-emerald-950/60 hover:bg-emerald-950/80 hover:border-emerald-500/50 transition-all group hover:shadow-lg text-white"
          >
            <div
              className={`w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              {action.icon}
            </div>
            <h3 className="font-semibold text-start mb-2 text-white">{action.label}</h3>
            <p className="text-xs text-emerald-400/70 text-start">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
