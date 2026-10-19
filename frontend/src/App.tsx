import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LenisProvider } from './components/LenisProvider'
import { TitleBar } from './components/TitleBar'

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron

// Total top offset:
// Browser:  0px TitleBar + 64px NavPill = 64px (NavPill only on landing)
// Electron: 36px TitleBar + 64px NavPill = 100px
const TITLEBAR_H = isElectron ? 36 : 0

export default function App() {
  return (
    // paddingTop only accounts for TitleBar — pages handle their own NavPill offset
    <div style={{ minHeight: '100%', background: '#FAF8F5', paddingTop: TITLEBAR_H }}>
      <TitleBar />
      <LenisProvider>
        <RouterProvider router={router} />
      </LenisProvider>
    </div>
  )
}
