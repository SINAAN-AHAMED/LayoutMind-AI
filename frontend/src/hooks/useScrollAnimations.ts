import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollAnimations() {
  const { pathname } = useLocation()
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Determine active reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          // Stop observing once animated in
          observerRef.current?.unobserve(entry.target)
        }
      })
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15
    })

    const animatedElements = document.querySelectorAll('[data-animate]')
    animatedElements.forEach((el) => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [pathname])
}
