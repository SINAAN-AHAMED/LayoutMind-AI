import { useEffect, useRef } from 'react'
import { useScrollAnimations } from '../hooks/useScrollAnimations'
import { Act1Hero } from '../components/RoomCraft/Act1Hero'
import { Act2HowItWorks } from '../components/RoomCraft/Act2HowItWorks'
import { Act3PromptStudio } from '../components/RoomCraft/Act3PromptStudio'
import { Act4CTA } from '../components/RoomCraft/Act4CTA'

export function RoomCraftPage() {
  useScrollAnimations()
  const cursorGlowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = `${e.clientX}px`
        cursorGlowRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div className="bg-bg-primary text-text-primary" style={{ transition: 'background-color 0.5s ease' }}>
      {/* Global cursor glow */}
      <div ref={cursorGlowRef} className="cursor-glow hidden md:block" />

      <Act1Hero />
      <Act2HowItWorks />
      <Act3PromptStudio />
      <Act4CTA />
    </div>
  )
}
