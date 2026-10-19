import { createHashRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { RoomCraftPage } from './routes/RoomCraftPage'
import { PromptStudioPage } from './routes/PromptStudioPage'
import { WorkspacePage } from './routes/WorkspacePage'

// createHashRouter works with Electron's file:// protocol.
// RoomCraftPage is the 3D animated storytelling landing page.
// /studio is the prompt studio, /workspace is the 3D viewer.
export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <RoomCraftPage /> },
      { path: 'studio', element: <PromptStudioPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
    ],
  },
])


