import {APP_BUILD} from '../lib/buildInfo'
import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowUpRight,ArrowDown,MoveUpRight} from 'lucide-react'
const asset=(name:string)=>`${import.meta.env?.BASE_URL??'/'}images/${name}${name==='architectural-blueprint.svg'?`?v=${APP_BUILD}`:''}`
const steps=[['01','Make room for an idea.','Choose your room, set its dimensions, and tell us how you want it to feel.'],['02','Find your arrangement.','Explore room-aware layouts, compare alternatives, and choose a direction.'],['03','Make every detail yours.','Move furniture, change finishes, and add the little things that make a place feel like home.']]
export function RoomCraftPage(){
 const [scrolled,setScrolled]=useState(false)
 useEffect(()=>{const scroll=()=>setScrolled(window.scrollY>24);scroll();window.addEventListener('scroll',scroll,{passive:true});return()=>window.removeEventListener('scroll',scroll)},[])
 const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
 return <div className="lm-home" style={{'--desktop-top':typeof window!=='undefined'&&window.electronAPI?.isElectron?'36px':'0px'} as React.CSSProperties}>
  <a className="home-skip" href="#home-main">Skip to content</a>
  <header className={`home-nav${scrolled?' home-nav-scrolled':''}`}>
   <Link to="/" className="home-wordmark" aria-label="LayoutMind home">LayoutMind<span>SPATIAL STUDIO</span></Link>
   <nav aria-label="Main navigation"><button onClick={()=>jump('room-portfolio')}>The possibilities</button><button onClick={()=>jump('how-it-works')}>The process</button></nav>
   <Link className="home-nav-cta" to="/studio">Enter the studio <ArrowUpRight size={15}/></Link>
  </header>
  <main id="home-main">
   <section className="home-hero" aria-labelledby="home-heading">
    <div className="home-intro"><p className="home-eyebrow"><i/> A LITTLE VISION. A PLACE OF YOUR OWN.</p>
     <h1 id="home-heading">Considered spaces.<br/><em>Entirely yours.</em></h1>
     <p className="home-lead">A room begins with a feeling. Turn yours into a thoughtful layout, then shape every colour, corner, and detail.</p>
     <div className="home-hero-actions"><Link to="/studio" className="home-button">Create your space <ArrowUpRight size={18}/></Link><button onClick={()=>jump('how-it-works')} className="home-text-button">Discover the process <ArrowDown size={14}/></button></div>
     <div className="home-footnote"><span>ROOM-AWARE PLANNING</span><span>YOUR DIMENSIONS. YOUR DETAILS.</span></div>
    </div>
    <figure className="home-hero-figure"><img src={asset('step1.jpg')} alt="Warm living room with a grey sofa, oak table, sculptural lighting and garden views" fetchPriority="high"/><div className="home-image-shade"/>
     <span className="home-image-index">01 / THE ART OF LIVING</span><figcaption><span>A softer kind of everyday.</span><small>WARM MATERIALS · ROOM TO BREATHE</small></figcaption><div className="home-figure-mark" aria-hidden="true">LM<span>STUDIO NOTES — 01</span></div>
    </figure>
    <div className="home-hero-note"><span className="home-note-no">01—06</span><p>From a quiet bedroom to a kitchen full of life.<br/>Every room has its own rhythm.</p><button onClick={()=>jump('room-portfolio')} aria-label="Explore room possibilities"><ArrowDown size={19}/></button></div>
   </section>
   <section id="room-portfolio" className="home-possibilities" aria-labelledby="possibilities-heading">
    <div className="home-section-heading"><div><p className="home-eyebrow">A PLACE FOR EVERY PART OF LIFE</p><h2 id="possibilities-heading">Different rooms.<br/><em>The same sense of home.</em></h2></div><p>Six room types. Eight styles. A palette of possibilities, with the freedom to make it personal.</p></div>
    <div className="home-room-grid">
     <Link to="/studio" className="home-room-feature"><img src={asset('living.jpg')} loading="lazy" alt="An open living and dining space with natural materials"/><span className="home-room-caption"><span><small>01 / GATHER</small><strong>Space to come together.</strong></span><ArrowUpRight size={24}/></span></Link>
     <div className="home-room-side"><div className="home-plan-card"><img src={asset('architectural-blueprint.svg')} alt="A coherent one-bedroom apartment floor plan" loading="lazy"/><span>GOOD DESIGN STARTS WITH A GOOD PLAN.</span></div><div className="home-room-links">{['Living Room','Bedroom','Kitchen','Bathroom','Dining Room','Home Office'].map((name,i)=><Link to="/studio" key={name}><small>0{i+1}</small><span>{name}</span><MoveUpRight size={14}/></Link>)}</div></div>
    </div>
   </section>
   <section id="how-it-works" className="home-process" aria-labelledby="process-heading"><div className="home-section-heading"><div><p className="home-eyebrow">FROM AN IDEA TO YOUR EVERYDAY</p><h2 id="process-heading">A little guidance.<br/><em>A lot of freedom.</em></h2></div><Link to="/studio" className="home-text-button">Begin with your room <ArrowUpRight size={17}/></Link></div><div className="home-steps">{steps.map(([number,title,description])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
   <section className="home-closing"><p className="home-eyebrow">YOUR NEXT CHAPTER, BY DESIGN</p><h2>There’s room for<br/><em>your imagination.</em></h2><Link to="/studio" className="home-button home-button-light">Let’s make it yours <ArrowUpRight size={18}/></Link><span className="home-closing-line" aria-hidden="true"/></section>
  </main>
  <footer className="home-footer"><Link to="/" className="home-wordmark">LayoutMind<span>SPATIAL STUDIO</span></Link><p>Thoughtful spaces. Personal possibilities.</p><span>© {new Date().getFullYear()} LayoutMind</span></footer>
 </div>
}
