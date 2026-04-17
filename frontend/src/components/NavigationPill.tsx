import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'

export function NavigationPill() {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  
  const links = [
    { name: 'Prompt Studio', path: '/' },
    { name: 'Workspace', path: '/workspace' }
  ]

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-4 py-2 flex items-center gap-2 shadow-glow"
    >
      {links.map((link) => {
        const isActive = location.pathname === link.path
        return (
          <Link key={link.path} to={link.path} className="relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors hover:text-primary">
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className={isActive ? 'text-primary' : 'text-text-secondary dark:text-gray-300'}>
              {link.name}
            </span>
          </Link>
        )
      })}

      <div className="w-px h-6 bg-text-secondary/20 dark:bg-white/10 mx-2" />

      <button 
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      <div className="hidden md:flex text-xs opacity-50 ml-1 mr-2 px-2 py-0.5 rounded border border-text-secondary/20">
        ⌘K
      </div>
    </motion.nav>
  )
}
