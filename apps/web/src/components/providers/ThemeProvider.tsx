'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Default to dark
      setTheme('dark')
      applyTheme('dark')
    }
    setMounted(true)
  }, [])

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const html = document.documentElement
    if (newTheme === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
      // Set CSS variables for light mode
      html.style.setProperty('--room-bg', 'linear-gradient(to bottom right, white 0%, rgb(248, 250, 252) 50%, white 100%)')
    } else {
      html.classList.add('dark')
      html.classList.remove('light')
      // Set CSS variables for dark mode
      html.style.setProperty('--room-bg', 'linear-gradient(to bottom right, rgb(10, 10, 10) 0%, rgb(17, 17, 17) 50%, rgb(10, 10, 10) 100%)')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) return <>{children}</>

  return (
    <>
      {children}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all duration-300 flex items-center justify-center"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={20} className="text-yellow-400" />
        ) : (
          <Moon size={20} className="text-blue-400" />
        )}
      </button>
    </>
  )
}
