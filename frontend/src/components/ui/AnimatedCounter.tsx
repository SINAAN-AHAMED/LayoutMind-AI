import React, { useEffect, useState, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

export function AnimatedCounter({ 
  from = 0, 
  to = 100, 
  duration = 2, 
  prefix = "", 
  suffix = "" 
}: { 
  from?: number
  to: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  
  useEffect(() => {
    if (inView && ref.current) {
      animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate: (value) => {
          if (ref.current) {
            ref.current.textContent = `${prefix}${Math.round(value)}${suffix}`
          }
        }
      })
    }
  }, [inView, from, to, duration, prefix, suffix])

  return <span ref={ref}>{prefix}{from}{suffix}</span>
}
