import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GlowCard } from '../ui/GlowCard'

gsap.registerPlugin(ScrollTrigger)

export function Act2HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const panels = gsap.utils.toArray('.panel') as HTMLElement[]
        
        panels.forEach((panel, i) => {
          // Fade in and lift the panel as it enters
          gsap.fromTo(panel, 
            { opacity: 0, y: 100 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 1,
              scrollTrigger: {
                trigger: panel,
                start: "top 80%",
                toggleActions: "play none none reverse"
              }
            }
          )

          // Background depth parallax
          gsap.to(panel.querySelector('.glow-wrapper'), {
            y: -50,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          })

          ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            scrub: true,
            toggleClass: { targets: panel.querySelector('.scroll-lit-text'), className: 'lit' }
          })

          // Word-by-word text reveal for step descriptions
          const words = panel.querySelectorAll('.step-word')
          gsap.fromTo(words,
            { opacity: 0.1, y: 8 },
            {
              opacity: 1, y: 0,
              duration: 0.3,
              stagger: 0.03,
              scrollTrigger: {
                trigger: panel,
                start: "top 75%",
                toggleActions: "play none none reverse"
              }
            }
          )

          // Number counter animation
          const counter = panel.querySelector('.step-counter')
          if (counter) {
            gsap.fromTo(counter,
              { scale: 0.4, opacity: 0, rotateY: -90 },
              {
                scale: 1, opacity: 1, rotateY: 0,
                duration: 0.8,
                ease: 'back.out(2)',
                scrollTrigger: {
                  trigger: panel,
                  start: "top 80%",
                  toggleActions: "play none none reverse"
                }
              }
            )
          }
        })
      }, sectionRef)
      return () => ctx.revert()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  const steps = [
    {
      num: "01",
      title: "The Prompt",
      desc: "Type out your dream space. Our NLP engine understands natural language, dimensions, furniture, and style constraints instantly.",
      imgSrc: "/images/step1.jpg",
      accent: "#2954FF"
    },
    {
      num: "02",
      title: "NLP Analytics",
      desc: "We parse your input highlighting specific styles, object requests, colors, and constraints in real-time with spaCy NLP.",
      imgSrc: "/images/step2.jpg",
      accent: "#8b5cf6"
    },
    {
      num: "03",
      title: "Genetic Optimization",
      desc: "40 generations of evolutionary algorithms optimize furniture placement for space utilization, clearance, and style alignment.",
      imgSrc: "/images/step3.jpg",
      accent: "#f43f5e"
    }
  ]

  return (
    <section ref={sectionRef} className="relative bg-bg-secondary w-full py-24 px-6 md:px-12 font-sans overflow-hidden">
      {/* Section header */}
      <div className="max-w-6xl mx-auto mb-16 text-center" data-animate="fade-up">
        <span className="text-[10px] uppercase tracking-[0.4em] font-semibold text-text-secondary mb-4 block">How It Works</span>
        <h2 className="font-serif text-4xl md:text-6xl text-text-primary leading-tight">
          From Words to <span className="gradient-text">Worlds</span>
        </h2>
      </div>

       <div className="max-w-6xl mx-auto space-y-[40vh] pb-[40vh]">
         {steps.map((step, i) => (
           <div key={i} className="panel min-h-[50vh] flex flex-col md:flex-row items-center gap-16 sticky top-32">
             
             {/* Left Text */}
             <div className="w-full md:w-1/2" data-animate={i % 2 === 0 ? "slide-right" : "slide-left"}>
               <div className="scroll-lit-text">
                  {/* Big step number */}
                  <div className="step-counter text-7xl md:text-9xl font-serif font-bold mb-4 opacity-10" style={{ color: step.accent }}>
                    {step.num}
                  </div>
                  <h3 className="text-sm uppercase tracking-widest font-semibold mb-4" style={{ color: step.accent }}>
                    Step {step.num}: {step.title}
                  </h3>
                  <p className="text-2xl md:text-4xl font-serif text-text-primary leading-tight drop-shadow-sm whitespace-normal">
                    {step.desc.split(' ').map((word, wi) => (
                      <span key={wi} className="step-word inline-block mr-[0.3em]">{word}</span>
                    ))}
                  </p>
               </div>
             </div>
             
              {/* Right Illustration */}
             <div className="w-full md:w-1/2 flex justify-center" data-animate="scale-in">
                <GlowCard className="w-64 h-64 md:w-96 md:h-96 rounded-full bg-bg-primary border border-black/5 dark:border-white/10 shadow-xl dark:shadow-[0_0_40px_rgba(255,255,255,0.03)] p-1">
                   <div className="w-full h-full rounded-full overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none z-20" />
                     {/* Animated ring border */}
                     <div className="absolute inset-0 rounded-full z-10 pointer-events-none"
                       style={{
                         border: `3px solid ${step.accent}20`,
                         animation: `pulse${i} 3s ease infinite`,
                       }}
                     />
                     <img 
                       src={step.imgSrc} 
                       alt={step.title} 
                       className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000 ease-out" 
                     />
                   </div>
                </GlowCard>
             </div>
             
           </div>
         ))}
       </div>
    </section>
  )
}
