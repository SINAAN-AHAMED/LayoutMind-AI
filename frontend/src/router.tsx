import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { RoomCraftPage } from './routes/RoomCraftPage'
import { WorkspacePage } from './routes/WorkspacePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <RoomCraftPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
    ],
  },
])

