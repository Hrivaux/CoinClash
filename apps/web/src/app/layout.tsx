import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import NotificationManager from '@/components/notifications/NotificationManager'
import NotificationToasts from '@/components/notifications/NotificationToasts'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Coin Clash Online - Hardcore Multiplayer Party Game',
  description: 'A strategic multiplayer party game with bluffing, economy management, and special cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <NotificationManager />
            <NotificationToasts />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
