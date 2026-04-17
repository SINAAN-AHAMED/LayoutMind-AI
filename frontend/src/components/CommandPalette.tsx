import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { toggleTheme } = useThemeStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const actions = [
    { id: '1', title: 'Go to Workspace', onSelect: () => { navigate('/workspace'); setOpen(false) } },
    { id: '2', title: 'Go to Prompt Studio', onSelect: () => { navigate('/'); setOpen(false) } },
    { id: '3', title: 'Toggle Light/Dark Theme', onSelect: () => { toggleTheme(); setOpen(false) } },
  ]

  const filtered = query 
    ? actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
    : actions

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 w-full max-w-lg z-[101] glass rounded-2xl overflow-hidden shadow-glow"
          >
            <div className="p-4 border-b border-white/10">
              <input
                autoFocus
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-lg text-text-primary dark:text-gray-100 placeholder:text-text-secondary dark:placeholder:text-gray-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-text-secondary opacity-50">
                  No results found.
                </div>
              ) : (
                filtered.map(action => (
                  <button
                    key={action.id}
                    onClick={action.onSelect}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/10 dark:hover:bg-white/5 transition-colors text-text-primary dark:text-gray-200"
                  >
                    {action.title}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
