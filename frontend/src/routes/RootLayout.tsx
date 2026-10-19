import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavigationPill } from '../components/NavigationPill'

export function RootLayout() {
  const location = useLocation()
  const isWorkspace = location.pathname === '/workspace'
  const isStudio = location.pathname === '/studio'

  // Show nav on landing page only.
  // /studio has its own embedded header, /workspace is full-screen 3D.
  const showNav = !isWorkspace && !isStudio

  // Always force light mode — Elyse design is light-only
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.body.style.backgroundColor = '#FAF8F5'
    document.body.style.color = '#1A1A1A'
  }, [])

  return (
    <div style={{ minHeight: '100%', background: '#FAF8F5' }}>
      {/* Clean NavigationPill — no wrapper header, nav manages its own fixed positioning */}
      {showNav && <NavigationPill />}
      <Outlet />
    </div>
  )
}
