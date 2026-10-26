import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const GITHUB_URL = 'https://github.com/SINAAN-AHAMED'
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron
// In Electron the TitleBar is 36px fixed at top:0, so nav sits below it
const NAV_TOP = isElectron ? 36 : 0

export function NavigationPill() {
  const location = useLocation()

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Studio', path: '/studio' },
  ]

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: NAV_TOP,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        height: '64px',
        background: '#FAF8F5',
        borderBottom: '1px solid #E8E2DA',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: "'Playfair Display Variable', serif",
          fontSize: '22px',
          fontWeight: 300,
          color: '#1A1A1A',
          letterSpacing: '-0.02em',
        }}>
          LayoutMind
        </span>
      </Link>

      {/* Center nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
        {links.map(link => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                fontFamily: "'DM Sans Variable', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                color: isActive ? '#1A1A1A' : '#6B6560',
                textDecoration: 'none',
                borderBottom: isActive ? '1px solid #C9A96E' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#1A1A1A' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = isActive ? '#1A1A1A' : '#6B6560' }}
            >
              {link.name}
            </Link>
          )
        })}
      </div>

      {/* Right — GitHub icon + Begin Design button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* GitHub Icon */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="SINAAN-AHAMED on GitHub"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            color: '#6B6560',
            transition: 'color 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#1A1A1A' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B6560' }}
        >
          {/* GitHub Octocat SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>

        {/* Begin Design button */}
        <Link
          to="/studio"
          style={{
            fontFamily: "'DM Sans Variable', sans-serif",
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            padding: '10px 22px',
            background: 'transparent',
            border: '1px solid #2D3B2D',
            color: '#1A1A1A',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            transition: 'all 0.25s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = '#2D3B2D'
            el.style.color = '#FAF8F5'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'transparent'
            el.style.color = '#1A1A1A'
          }}
        >
          Begin Design
        </Link>
      </div>
    </motion.nav>
  )
}
