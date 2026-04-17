import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function MagneticButton({ 
  children, 
  className = "", 
  onClick,
  disabled = false
}: { 
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current!.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block relative ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </motion.div>
  )
}
