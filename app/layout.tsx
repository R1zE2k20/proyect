import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Rajdhani } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-orbitron",
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
})

export const metadata: Metadata = {
  title: "GTA Casino Crypto - Servidor Roleplay",
  description: "Casino online con criptomonedas para servidor GTA 5 RP",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${orbitron.variable} ${rajdhani.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
