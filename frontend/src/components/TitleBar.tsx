/**
 * TitleBar — Custom frameless window title bar for Electron
 * Elyse Luxury Design — ivory, charcoal, gold accents
 * Only rendered when running inside Electron.
 */

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean
      minimize?: () => void
      maximize?: () => void
      close?: () => void
      getVersion?: () => Promise<string>
    }
  }
}

export function TitleBar() {
  const [version, setVersion] = useState('1.0.0')
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron

  useEffect(() => {
    if (isElectron && window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(v => setVersion(v)).catch(() => {})
    }
  }, [isElectron])

  if (!isElectron) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '36px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Elyse ivory — matches app background perfectly, no dark flash
        background: '#FAF8F5',
        borderBottom: '1px solid #E8E2DA',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        flexShrink: 0,
      } as React.CSSProperties}
    >
      {/* Left: App branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px' }}>
        {/* LayoutMind logo mark — thin gold hexagon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="#C9A96E" strokeWidth="1.5" fill="rgba(201,169,110,0.1)" />
          <circle cx="12" cy="12" r="2.5" fill="#2D3B2D" />
        </svg>
        <span style={{
          fontFamily: "'Playfair Display Variable', serif",
          fontSize: '12px',
          fontWeight: 400,
          color: '#1A1A1A',
          letterSpacing: '-0.01em',
        }}>
          LayoutMind
        </span>
        <span style={{
          fontFamily: "'DM Sans Variable', sans-serif",
          fontSize: '9px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: '#C9A96E',
        }}>
          v{version}
        </span>
      </div>

      {/* Center: subtle title */}
      <div style={{
        fontFamily: "'DM Sans Variable', sans-serif",
        fontSize: '9px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.25em',
        color: '#6B6560',
      }}>
        AI INTERIOR STUDIO
      </div>

      {/* Right: Window controls — must NOT be draggable */}
      <div
        style={{ display: 'flex', alignItems: 'stretch', height: '36px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={() => window.electronAPI?.minimize?.()}
          title="Minimize"
          style={btnStyle()}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F2EDE8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="#6B6560" />
          </svg>
        </button>

        {/* Maximize */}
        <button
          onClick={() => window.electronAPI?.maximize?.()}
          title="Maximize"
          style={btnStyle()}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F2EDE8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6B6560" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronAPI?.close?.()}
          title="Close"
          style={btnStyle()}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#8B5E52'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6B6560" strokeWidth="1.2" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function btnStyle(): React.CSSProperties {
  return {
    width: '46px',
    height: '36px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease',
    outline: 'none',
  }
}
