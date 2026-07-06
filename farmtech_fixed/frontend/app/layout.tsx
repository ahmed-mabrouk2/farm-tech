import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "FarmTec - Agricultural AI Dashboard",
  description:
    "Modern AI-powered agricultural platform for Egyptian farmers with crop recommendations, disease detection, and yield predictions",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
