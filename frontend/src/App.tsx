import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LenisProvider } from './components/LenisProvider'

export default function App() {
  return (
    <div className="min-h-full">
      <LenisProvider>
        <RouterProvider router={router} />
      </LenisProvider>
    </div>
  )
}
