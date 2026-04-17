import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavigationPill } from '../components/NavigationPill'
import { CommandPalette } from '../components/CommandPalette'
import { useThemeStore } from '../store/useThemeStore'

export function RootLayout() {
  const location = useLocation()
  const isWorkspace = location.pathname === '/workspace'
  const theme = useThemeStore(s => s.theme)

  // Sync theme class on html + body whenever theme changes
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    if (theme === 'dark') {
      html.classList.add('dark')
      body.style.backgroundColor = '#05050A'
    } else {
      html.classList.remove('dark')
      body.style.backgroundColor = '#FFFFFF'
    }
  }, [theme])

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--bg-primary)', transition: 'background-color 0.5s ease' }}>
      <div className="pointer-events-none fixed inset-0 opacity-60 grid-glow z-[-1]" />
      {!isWorkspace && (
        <header className="fixed top-0 w-full z-50 glass-nav transition-colors duration-300">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <NavigationPill />
            <CommandPalette />
          </div>
        </header>
      )}
      <Outlet />
    </div>
  )
}
