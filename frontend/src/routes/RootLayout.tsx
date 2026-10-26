import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

export function RootLayout() {
  const location = useLocation()
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant'})},[location.pathname])

  // Always force light mode — Elyse design is light-only
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.body.style.backgroundColor = '#FAF8F5'
    document.body.style.color = '#1A1A1A'
  }, [])

  return (
    <div style={{ minHeight: '100%', background: '#FAF8F5' }}>
      {/* Clean NavigationPill — no wrapper header, nav manages its own fixed positioning */}

      <Outlet />
    </div>
  )
}
